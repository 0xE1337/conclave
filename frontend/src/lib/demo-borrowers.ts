import { BorrowerData } from "./types";

/**
 * Demo institutional borrowers — synthetic data shown in the UI before any
 * real on-chain interaction. Mirrors the encrypted-state shape that
 * BorrowerRegistry / CreditScoreEngine / PrivateCreditPool produce on-chain.
 *
 * Personas:
 *   #1 — sovereign-grade qualified-purchaser, perfect repay history
 *   #2 — accredited DAO treasury, mid-tier
 *   #3 — accredited SME, mixed history
 *   #4 — paused — KYC tier downgraded, awaiting re-attestation
 *   #5 — institutional, top tier, large position
 *   #6 — small accredited, building history
 *   #7 — revoked — defaulted multiple times
 *   #8 — accredited, clean record
 */
export const DEMO_BORROWERS: BorrowerData[] = [
  {
    id: 1, wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    status: "active", kycTier: 3, accreditedBond: 5e18,
    creditScore: 87, repayments: 8, defaults: 0, collateralPosts: 12,
    hasLoan: false, loanAmount: 0, loanCollateral: 0, collateralPct: 50, votesParticipated: 8,
  },
  {
    id: 2, wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    status: "active", kycTier: 2, accreditedBond: 2e18,
    creditScore: 62, repayments: 5, defaults: 1, collateralPosts: 8,
    hasLoan: true, loanAmount: 1e18, loanCollateral: 0.75e18, collateralPct: 75, votesParticipated: 5,
  },
  {
    id: 3, wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    status: "active", kycTier: 2, accreditedBond: 1.5e18,
    creditScore: 45, repayments: 3, defaults: 2, collateralPosts: 5,
    hasLoan: false, loanAmount: 0, loanCollateral: 0, collateralPct: 100, votesParticipated: 3,
  },
  {
    id: 4, wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    status: "paused", kycTier: 1, accreditedBond: 0.5e18,
    creditScore: 18, repayments: 1, defaults: 3, collateralPosts: 2,
    hasLoan: false, loanAmount: 0, loanCollateral: 0, collateralPct: 150, votesParticipated: 1,
  },
  {
    id: 5, wallet: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    status: "active", kycTier: 4, accreditedBond: 8e18,
    creditScore: 95, repayments: 15, defaults: 0, collateralPosts: 20,
    hasLoan: true, loanAmount: 3e18, loanCollateral: 1.5e18, collateralPct: 50, votesParticipated: 15,
  },
  {
    id: 6, wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    status: "active", kycTier: 1, accreditedBond: 0.3e18,
    creditScore: 30, repayments: 2, defaults: 1, collateralPosts: 4,
    hasLoan: false, loanAmount: 0, loanCollateral: 0, collateralPct: 100, votesParticipated: 2,
  },
  {
    id: 7, wallet: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    status: "revoked", kycTier: 0, accreditedBond: 0,
    creditScore: 5, repayments: 0, defaults: 4, collateralPosts: 1,
    hasLoan: false, loanAmount: 0, loanCollateral: 0, collateralPct: 150, votesParticipated: 0,
  },
  {
    id: 8, wallet: "0x14dC79964da2C08daa4968307cc169a6639Ecb0C",
    status: "active", kycTier: 2, accreditedBond: 3e18,
    creditScore: 71, repayments: 7, defaults: 0, collateralPosts: 10,
    hasLoan: false, loanAmount: 0, loanCollateral: 0, collateralPct: 75, votesParticipated: 7,
  },
];
