// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint8, euint64, ebool, externalEuint8, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title BorrowerRegistry — Confidential institutional borrower identity
/// @notice Registers institutional borrowers (DAO treasuries, SMEs, RWA originators)
///         with encrypted KYC tier and accredited bond. Identity address is public,
///         attributes are encrypted. Provides an ERC-3643-inspired transfer-compliance
///         hook so downstream contracts can gate participation by tier without ever
///         seeing the raw tier value.
/// @dev    The encrypted KYC tier maps to ERC-3643 claim topics in production. Here
///         we store the tier directly as euint8 for simplicity; FHE.ge() against an
///         externalEuint8 minimum threshold mirrors the ERC-3643 "Compliance.canTransfer"
///         pattern (https://docs.openzeppelin.com/confidential-contracts).
contract BorrowerRegistry is ZamaEthereumConfig {
    enum Status { None, Active, Paused, Revoked }

    struct Borrower {
        address  wallet;
        Status   status;
        uint256  registeredAt;
        euint8   encKycTier;        // 0=none, 1=retail, 2=accredited, 3=qualified-purchaser, 4=institutional
        euint64  encAccreditedBond; // posted compliance bond, encrypted
    }

    mapping(uint256 => Borrower) internal _borrowers;
    mapping(address => uint256) public borrowerOfWallet;
    uint256 public nextBorrowerId = 1;
    address public governor;

    event BorrowerRegistered(uint256 indexed borrowerId, address indexed wallet);
    event BorrowerPaused(uint256 indexed borrowerId);
    event BorrowerRevoked(uint256 indexed borrowerId);

    error NotGovernor();
    error AlreadyRegistered();
    error NotFound();
    error NotActive();
    error NotOwner();

    constructor() { governor = msg.sender; }

    modifier onlyGov() { if (msg.sender != governor) revert NotGovernor(); _; }

    /// @notice Register a borrower with encrypted KYC tier and accredited bond.
    function register(
        address wallet,
        externalEuint8 encTier, bytes calldata tierProof,
        externalEuint64 encBond, bytes calldata bondProof
    ) external onlyGov returns (uint256 id) {
        if (borrowerOfWallet[wallet] != 0) revert AlreadyRegistered();
        id = nextBorrowerId++;

        euint8  tier = FHE.fromExternal(encTier, tierProof);
        euint64 bond = FHE.fromExternal(encBond, bondProof);
        FHE.allowThis(tier);  FHE.allow(tier, wallet);
        FHE.allowThis(bond);  FHE.allow(bond, wallet);

        _borrowers[id] = Borrower(wallet, Status.Active, block.timestamp, tier, bond);
        borrowerOfWallet[wallet] = id;
        emit BorrowerRegistered(id, wallet);
    }

    function pause(uint256 id) external onlyGov {
        if (_borrowers[id].status != Status.Active) revert NotActive();
        _borrowers[id].status = Status.Paused;
        emit BorrowerPaused(id);
    }

    function revoke(uint256 id) external onlyGov {
        if (_borrowers[id].status == Status.None) revert NotFound();
        _borrowers[id].status = Status.Revoked;
        emit BorrowerRevoked(id);
    }

    /// @notice ERC-3643-inspired transfer-compliance hook. Returns encrypted bool
    ///         indicating whether borrower's KYC tier meets a minimum threshold.
    ///         Caller never learns the raw tier — only the encrypted yes/no.
    /// @dev    Equivalent of the ERC-3643 IModularCompliance.canTransfer check, but
    ///         the eligibility computation runs on ciphertext. The returned ebool
    ///         is granted to msg.sender so a downstream contract (e.g. PrivateCreditPool)
    ///         can compose it homomorphically into its own gating logic.
    function meetsKycTier(uint256 id, externalEuint8 minTier, bytes calldata proof)
        external returns (ebool)
    {
        if (_borrowers[id].status != Status.Active) revert NotActive();
        euint8 threshold = FHE.fromExternal(minTier, proof);
        ebool result = FHE.ge(_borrowers[id].encKycTier, threshold);
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        return result;
    }

    /// @notice Borrower authorizes a downstream protocol to read their encrypted
    ///         attributes. Persistent allowance (no revoke in v1).
    function authorize(uint256 id, address protocol) external {
        if (_borrowers[id].wallet != msg.sender) revert NotOwner();
        FHE.allow(_borrowers[id].encKycTier, protocol);
        FHE.allow(_borrowers[id].encAccreditedBond, protocol);
    }

    function isActive(uint256 id) external view returns (bool) {
        return _borrowers[id].status == Status.Active;
    }
    function walletOf(uint256 id) external view returns (address) {
        return _borrowers[id].wallet;
    }
    function count() external view returns (uint256) { return nextBorrowerId - 1; }
}
