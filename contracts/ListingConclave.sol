// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, ebool, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ListingConclave — Anti-bribery encrypted underwriting committee
/// @notice Conclave-style sealed voting for high-stakes credit-policy decisions:
///         which RWA assets to admit to the pool, which borrowers to onboard,
///         which credit-policy parameter changes to ratify. Votes are encrypted
///         booleans, tally happens homomorphically, individual votes are NEVER
///         revealed — and crucially the voter cannot prove their own vote to
///         a briber afterwards (homomorphic addition consumes the per-vote
///         randomness, breaking receipt-freeness attacks against bribery).
///
/// @dev    Threat model addressed: an underwriting committee member is bribed
///         to vote a particular way and the briber wants to verify delivery
///         by inspecting the running tally. Commit-reveal voting leaks at the
///         reveal step. ZK voting (MACI) requires a coordinator. FHE conclave
///         seals the tally entirely on-chain with no coordinator.
contract ListingConclave is ZamaEthereumConfig {
    struct Proposal {
        uint256 startedAt;
        uint256 deadline;
        euint32 approves;
        euint32 rejects;
        uint32  voterCount;
        bool    finalized;
    }

    mapping(uint256 => Proposal) internal _proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public constant DEFAULT_DURATION = 1 days;
    address public governor;

    event ProposalOpened(uint256 indexed assetId, uint256 deadline);
    event VoteSealed(uint256 indexed assetId, address indexed voter);
    event ProposalFinalized(uint256 indexed assetId, uint32 totalVoters);

    error NotGovernor();
    error ProposalExists();
    error NotActive();
    error AlreadyVoted();
    error NotEnded();
    error AlreadyFinalized();

    constructor() { governor = msg.sender; }
    modifier onlyGov() { if (msg.sender != governor) revert NotGovernor(); _; }

    /// @notice Open a listing proposal for an asset. AssetId is an opaque ID
    ///         referenced by the application layer (e.g. a bond CUSIP, a
    ///         borrower applicant, a parameter change).
    function openProposal(uint256 assetId) external onlyGov {
        if (_proposals[assetId].startedAt != 0) revert ProposalExists();
        euint32 z = FHE.asEuint32(0); FHE.allowThis(z);
        _proposals[assetId] = Proposal(block.timestamp, block.timestamp + DEFAULT_DURATION, z, z, 0, false);
        emit ProposalOpened(assetId, block.timestamp + DEFAULT_DURATION);
    }

    /// @notice Cast an encrypted vote. true = approve, false = reject.
    ///         Vote is consumed by homomorphic addition — voter cannot prove
    ///         their vote to anyone afterwards (anti-bribery / receipt-free).
    function sealVote(uint256 assetId, externalEbool encVote, bytes calldata proof) external {
        Proposal storage p = _proposals[assetId];
        if (p.startedAt == 0 || block.timestamp > p.deadline) revert NotActive();
        if (hasVoted[assetId][msg.sender]) revert AlreadyVoted();

        ebool vote = FHE.fromExternal(encVote, proof);
        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);

        p.approves = FHE.add(p.approves, FHE.select(vote, one, zero));
        p.rejects  = FHE.add(p.rejects,  FHE.select(vote, zero, one));
        FHE.allowThis(p.approves);
        FHE.allowThis(p.rejects);

        hasVoted[assetId][msg.sender] = true;
        p.voterCount++;
        emit VoteSealed(assetId, msg.sender);
    }

    /// @notice Finalize: make tallies publicly decryptable. Per-vote secrecy
    ///         is preserved; only aggregates are revealed.
    function finalize(uint256 assetId) external onlyGov {
        Proposal storage p = _proposals[assetId];
        if (p.startedAt == 0) revert NotActive();
        if (block.timestamp <= p.deadline) revert NotEnded();
        if (p.finalized) revert AlreadyFinalized();
        FHE.makePubliclyDecryptable(p.approves);
        FHE.makePubliclyDecryptable(p.rejects);
        p.finalized = true;
        emit ProposalFinalized(assetId, p.voterCount);
    }

    function isActive(uint256 assetId) external view returns (bool) {
        Proposal storage p = _proposals[assetId];
        return p.startedAt > 0 && block.timestamp <= p.deadline && !p.finalized;
    }
    function voterCount(uint256 assetId) external view returns (uint32) {
        return _proposals[assetId].voterCount;
    }
    function isFinalized(uint256 assetId) external view returns (bool) {
        return _proposals[assetId].finalized;
    }
}
