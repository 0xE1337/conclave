// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {BorrowerRegistry} from "./BorrowerRegistry.sol";

/// @title CreditScoreEngine — On-chain encrypted credit scoring for Conclave
/// @notice Computes credit scores entirely in the encrypted domain. Score evolves
///         atomically with on-chain repayment / default events from PrivateCreditPool —
///         making score a *live mutable handle* rather than a snapshotted ZK credential.
///
///         score = w1 * repayments - w2 * defaults + w3 * collateralHistory + w4 * volumeTier
///
/// @dev    Critical FHE pattern: cross-contract ACL bridging.
///         When PrivateCreditPool reads back the encrypted score handle to make a
///         tier decision, the coprocessor will refuse to materialize FHE ops unless
///         the pool address has been granted ACL. We solve this by exposing
///         `setPool(address)` (governor-only) and re-granting `FHE.allow(score, pool)`
///         every time `computeScore` runs. Without this, mock tests pass but Sepolia
///         silently produces undefined ciphertext (anti-pattern #17).
contract CreditScoreEngine is ZamaEthereumConfig {
    uint32 public w1 = 10;  // weight: successful repayments
    uint32 public w2 = 30;  // penalty: defaults / liquidations
    uint32 public w3 = 5;   // weight: collateral history (times posted collateral)
    uint32 public w4 = 1;   // weight: encrypted volume tier

    struct Credit {
        euint32 repayments;
        euint32 defaults;
        euint32 collateralHistory;
        euint32 volumeTier;
        euint32 score;
        bool    init;
    }

    mapping(uint256 => Credit) internal _credits;
    BorrowerRegistry public immutable registry;
    address public governor;
    address public pool;          // PrivateCreditPool — receives ACL on score handle
    address public regulator;     // optional: regulator address for selective decryption

    event RepaymentRecorded(uint256 indexed borrowerId);
    event DefaultRecorded(uint256 indexed borrowerId);
    event CollateralRecorded(uint256 indexed borrowerId);
    event VolumeRecorded(uint256 indexed borrowerId);
    event ScoreComputed(uint256 indexed borrowerId);
    event PoolSet(address indexed pool);
    event RegulatorSet(address indexed regulator);
    event RegulatorAccessGranted(uint256 indexed borrowerId, address indexed regulator);

    error NotGovernor();
    error NotPoolOrGov();
    error NotActive();
    error NotBorrowerOwner();

    constructor(address _registry) {
        registry = BorrowerRegistry(_registry);
        governor = msg.sender;
    }

    modifier onlyGov() { if (msg.sender != governor) revert NotGovernor(); _; }
    modifier onlyPoolOrGov() {
        if (msg.sender != pool && msg.sender != governor) revert NotPoolOrGov();
        _;
    }

    /// @notice CRITICAL ACL bridge. Set the PrivateCreditPool address so future
    ///         `computeScore` calls grant the pool decrypt access on the score handle.
    function setPool(address _pool) external onlyGov {
        pool = _pool;
        emit PoolSet(_pool);
    }

    /// @notice Set the regulator address eligible for selective disclosure.
    ///         Borrowers individually opt in via `grantRegulatorAccess`.
    function setRegulator(address _reg) external onlyGov {
        regulator = _reg;
        emit RegulatorSet(_reg);
    }

    function _init(uint256 id) internal {
        if (!_credits[id].init) {
            euint32 z = FHE.asEuint32(0);
            FHE.allowThis(z);
            _credits[id] = Credit(z, z, z, z, z, true);
        }
    }

    /// @notice Record a successful repayment (called by PrivateCreditPool on repay).
    function recordRepayment(uint256 id) external onlyPoolOrGov {
        if (!registry.isActive(id)) revert NotActive();
        _init(id);
        _credits[id].repayments = FHE.add(_credits[id].repayments, FHE.asEuint32(1));
        FHE.allowThis(_credits[id].repayments);
        emit RepaymentRecorded(id);
    }

    /// @notice Record a default (called by PrivateCreditPool on liquidate).
    function recordDefault(uint256 id) external onlyPoolOrGov {
        if (!registry.isActive(id)) revert NotActive();
        _init(id);
        _credits[id].defaults = FHE.add(_credits[id].defaults, FHE.asEuint32(1));
        FHE.allowThis(_credits[id].defaults);
        emit DefaultRecorded(id);
    }

    /// @notice Record collateral posting event (called by PrivateCreditPool on borrow).
    function recordCollateral(uint256 id) external onlyPoolOrGov {
        if (!registry.isActive(id)) revert NotActive();
        _init(id);
        _credits[id].collateralHistory = FHE.add(_credits[id].collateralHistory, FHE.asEuint32(1));
        FHE.allowThis(_credits[id].collateralHistory);
        emit CollateralRecorded(id);
    }

    /// @notice Record encrypted volume tier (governor-only — typically an oracle).
    function recordVolume(uint256 id, externalEuint32 vol, bytes calldata proof) external onlyGov {
        if (!registry.isActive(id)) revert NotActive();
        _init(id);
        euint32 v = FHE.fromExternal(vol, proof);
        _credits[id].volumeTier = FHE.add(_credits[id].volumeTier, v);
        FHE.allowThis(_credits[id].volumeTier);
        emit VolumeRecorded(id);
    }

    /// @notice Compute encrypted score, clamped at 0.
    /// @dev    CRITICAL: re-grants ACL to `pool` on every recompute so cross-contract
    ///         FHE.ge / FHE.select calls in PrivateCreditPool resolve correctly on
    ///         Sepolia (not just in mock).
    function computeScore(uint256 id) external {
        _init(id);
        Credit storage c = _credits[id];

        euint32 pos = FHE.add(
            FHE.add(
                FHE.mul(c.repayments,        FHE.asEuint32(w1)),
                FHE.mul(c.collateralHistory, FHE.asEuint32(w3))
            ),
            FHE.mul(c.volumeTier, FHE.asEuint32(w4))
        );
        euint32 neg = FHE.mul(c.defaults, FHE.asEuint32(w2));
        ebool underflow = FHE.gt(neg, pos);
        c.score = FHE.select(underflow, FHE.asEuint32(0), FHE.sub(pos, neg));

        FHE.allowThis(c.score);
        address w = registry.walletOf(id);
        if (w != address(0)) FHE.allow(c.score, w);
        if (pool != address(0)) FHE.allow(c.score, pool); // CRITICAL: bridge to pool
        emit ScoreComputed(id);
    }

    /// @notice Borrower opts in to selective disclosure for the configured regulator.
    /// @dev    Demonstrates the FHE differentiator vs ZK: the SAME encrypted state
    ///         that proves `score >= threshold` publicly can also be selectively
    ///         decrypted by an authorized regulator address. ZK credentials require
    ///         an off-chain re-issuance for this — FHE does it in one call.
    function grantRegulatorAccess(uint256 id) external {
        if (msg.sender != registry.walletOf(id)) revert NotBorrowerOwner();
        require(regulator != address(0), "No regulator");
        FHE.allow(_credits[id].score, regulator);
        emit RegulatorAccessGranted(id, regulator);
    }

    /// @notice Encrypted threshold check restricted to the pool / governor to
    ///         prevent open binary-search side-channel attacks (anti-pattern #15).
    function meetsThreshold(uint256 id, externalEuint32 min, bytes calldata proof)
        external onlyPoolOrGov returns (ebool)
    {
        _init(id);
        euint32 threshold = FHE.fromExternal(min, proof);
        ebool result = FHE.ge(_credits[id].score, threshold);
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        return result;
    }

    /// @notice Returns the encrypted score handle.
    function getScore(uint256 id) external view returns (euint32) {
        return _credits[id].score;
    }

    function isInitialized(uint256 id) external view returns (bool) {
        return _credits[id].init;
    }

    function setWeights(uint32 _w1, uint32 _w2, uint32 _w3, uint32 _w4) external onlyGov {
        w1 = _w1; w2 = _w2; w3 = _w3; w4 = _w4;
    }
}
