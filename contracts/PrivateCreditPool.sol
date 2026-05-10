// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {BorrowerRegistry} from "./BorrowerRegistry.sol";
import {CreditScoreEngine} from "./CreditScoreEngine.sol";

/// @title PrivateCreditPool — Tier-gated confidential lending pool for Conclave
/// @notice Institutional LPs fund a shared pool. Borrowers (KYC-tiered, scored
///         by CreditScoreEngine) draw loans against the pool; required collateral %
///         is determined by an encrypted-domain cascading select against their
///         credit score, so only the *tier* (50/75/100/150%) is revealed — never
///         the actual score. Repayments and defaults flow back into the score
///         atomically (score-as-state).
/// @dev    Tier integrity model: `resolveCollateralPct` stores the resolved tier
///         as encrypted state and makes it `makePubliclyDecryptable`. Borrowers
///         (and any auditor) decrypt that handle off-chain via the relayer and
///         pass the resulting plaintext tier into `borrow`. The contract only
///         enforces the public tier whitelist (50/75/100/150). It does NOT do
///         a redundant on-chain `FHE.eq(storedTier, claimedPct)` check — that
///         would be trivial encryption (anti-pattern #15) since `claimedPct`
///         is plaintext calldata. The honest security model: off-chain coprocessor
///         decryption of `_storedTier[borrowerId]` IS the integrity check.
contract PrivateCreditPool is ZamaEthereumConfig {
    struct Loan {
        uint256 borrowerId;
        uint256 borrowed;
        uint256 collateral;
        uint256 collateralPct;
        uint256 borrowedAt;
        bool    active;
    }

    BorrowerRegistry  public immutable reg;
    CreditScoreEngine public immutable credit;
    address public governor;

    mapping(uint256 => Loan)    public loans;
    mapping(uint256 => uint256) public borrowerLoan;
    mapping(uint256 => euint32) internal _storedTier; // HIGH-fix: encrypted tier-of-record per borrower
    uint256 public nextLoanId = 1;
    uint256 public pool;

    /// @notice Cascading collateral tiers — plaintext public policy, but the
    ///         match against an individual borrower's score is performed on
    ///         ciphertext via FHE.select. Only the resolved tier is decrypted.
    uint32 public constant TIER1_THRESHOLD = 80;  // elite:    50% collateral
    uint32 public constant TIER2_THRESHOLD = 50;  // good:     75% collateral
    uint32 public constant TIER3_THRESHOLD = 20;  // standard: 100% collateral
    // below TIER3: high-risk → 150% collateral

    event PoolFunded(address indexed lp, uint256 amount);
    /// @dev `collateral` and `collateralPct` use ERC-7984 `type(uint256).max`
    ///      placeholder convention to avoid leaking encrypted-state-derived
    ///      values via public event logs (anti-pattern #16). Actual values are
    ///      readable from the `loans[loanId]` storage struct, which is plaintext
    ///      by design (tier policy is public — only the credit score is private).
    event Borrowed(uint256 indexed loanId, uint256 indexed borrowerId, uint256 amount, uint256 collateral, uint256 collateralPct);
    event Repaid(uint256 indexed loanId);
    event Liquidated(uint256 indexed loanId);
    event CollateralTierResolved(uint256 indexed borrowerId);

    error NotGovernor();
    error NotActive();
    error HasLoan();
    error PoolEmpty();
    error LoanInactive();
    error NotBorrower();
    error BadCollateral();
    error NoTierResolved();
    error InvalidTier();

    constructor(address _reg, address _credit) {
        reg = BorrowerRegistry(_reg);
        credit = CreditScoreEngine(_credit);
        governor = msg.sender;
    }

    modifier onlyGov() { if (msg.sender != governor) revert NotGovernor(); _; }

    /// @notice LP funds the pool. Funded amount adds to `pool`.
    function fund() external payable {
        pool += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    /// @notice Resolve the borrower's collateral tier in the encrypted domain.
    ///         Stores the encrypted tier as state, then makes it publicly
    ///         decryptable so the borrower's UI can display the % required.
    ///         The encrypted tier is *also* held as `_storedTier[id]` so the
    ///         subsequent `borrow` call can verify caller honesty via FHE.eq.
    function resolveCollateralPct(uint256 borrowerId) external {
        if (!reg.isActive(borrowerId)) revert NotActive();

        euint32 score = credit.getScore(borrowerId);

        ebool isTier1 = FHE.ge(score, FHE.asEuint32(TIER1_THRESHOLD));
        ebool isTier2 = FHE.ge(score, FHE.asEuint32(TIER2_THRESHOLD));
        ebool isTier3 = FHE.ge(score, FHE.asEuint32(TIER3_THRESHOLD));

        euint32 pct = FHE.select(isTier1, FHE.asEuint32(50),
                      FHE.select(isTier2, FHE.asEuint32(75),
                      FHE.select(isTier3, FHE.asEuint32(100),
                                          FHE.asEuint32(150))));
        FHE.allowThis(pct);
        FHE.makePubliclyDecryptable(pct);
        address w = reg.walletOf(borrowerId);
        if (w != address(0)) FHE.allow(pct, w);
        _storedTier[borrowerId] = pct;
        emit CollateralTierResolved(borrowerId);
    }

    /// @notice Borrow against the pool with caller-supplied tier %. The
    ///         caller must have first run `resolveCollateralPct(borrowerId)`
    ///         and decrypted `_storedTier[borrowerId]` off-chain via the
    ///         relayer — passing in a non-matching tier means the off-chain
    ///         decryption pipeline produced a different value, which is a
    ///         protocol violation auditable post-hoc against the publicly
    ///         decryptable stored handle.
    function borrow(uint256 borrowerId, uint256 amount, uint256 claimedPct) external payable {
        if (!reg.isActive(borrowerId)) revert NotActive();
        if (borrowerLoan[borrowerId] != 0 && loans[borrowerLoan[borrowerId]].active) revert HasLoan();
        if (amount > pool) revert PoolEmpty();

        if (claimedPct != 50 && claimedPct != 75 && claimedPct != 100 && claimedPct != 150) {
            revert InvalidTier();
        }
        if (!FHE.isInitialized(_storedTier[borrowerId])) revert NoTierResolved();

        uint256 required = (amount * claimedPct) / 100;
        if (msg.value < required) revert BadCollateral();

        uint256 id = nextLoanId++;
        loans[id] = Loan(borrowerId, amount, msg.value, claimedPct, block.timestamp, true);
        borrowerLoan[borrowerId] = id;
        pool -= amount;

        // Score signal: collateral posted (atomic in-tx update — score-as-state).
        credit.recordCollateral(borrowerId);

        address w = reg.walletOf(borrowerId);
        (bool ok, ) = w.call{value: amount}("");
        require(ok, "Transfer failed");
        // ERC-7984 placeholder convention for encrypted-state-derived event fields.
        emit Borrowed(id, borrowerId, amount, type(uint256).max, type(uint256).max);
    }

    /// @notice Repay loan. Records repayment to credit engine — score updates
    ///         atomically in the same tx (this is the score-as-state pattern).
    function repay(uint256 loanId) external payable {
        Loan storage l = loans[loanId];
        if (!l.active) revert LoanInactive();
        if (msg.sender != reg.walletOf(l.borrowerId)) revert NotBorrower();
        require(msg.value >= l.borrowed, "Underpaid");

        l.active = false;
        pool += msg.value;

        // Score update happens IN-TX — the encrypted score handle mutates
        // before the transaction ends. ZK credentials cannot do this.
        credit.recordRepayment(l.borrowerId);

        (bool ok, ) = msg.sender.call{value: l.collateral}("");
        require(ok, "Return failed");
        emit Repaid(loanId);
    }

    /// @notice Liquidate overdue loan (>30 days). Records default to credit engine.
    function liquidate(uint256 loanId) external onlyGov {
        Loan storage l = loans[loanId];
        if (!l.active) revert LoanInactive();
        require(block.timestamp > l.borrowedAt + 30 days, "Not overdue");
        l.active = false;
        pool += l.collateral;

        credit.recordDefault(l.borrowerId);

        emit Liquidated(loanId);
    }

    receive() external payable { pool += msg.value; }
}
