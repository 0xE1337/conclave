/**
 * Synthetic demo state for the Conclave dApp.
 * Mirrors the on-chain encrypted-state shape produced by the 4 contracts.
 * In a production build these values would be hydrated from Sepolia via
 * @zama-fhe/relayer-sdk; for the demo they're illustrative.
 */

export type BorrowerStatus = "active" | "paused" | "revoked";

export interface BorrowerRecord {
  id: number;
  wallet: string;
  /** Display name (institutional) */
  name: string;
  status: BorrowerStatus;
  /** 1=retail, 2=accredited, 3=qualified-purchaser, 4=institutional */
  kycTier: number;
  /** Posted compliance bond (wei) */
  accreditedBond: number;
  /** Encrypted-state inputs */
  repayments: number;
  defaults: number;
  collateralPosts: number;
  /** Computed score (0-100) */
  score: number;
  /** Resolved tier index 0..3 (50/75/100/150%) */
  tierIdx: number;
  /** Active loan, if any */
  loan?: {
    amount: number;
    collateral: number;
    pct: number;
    daysOutstanding: number;
  };
  /** Has the borrower granted regulator access on their score? */
  regulatorAuthorized: boolean;
}

export const TIER_BANDS = [
  { idx: 0, pct: 50, label: "Tier 1 — Elite", threshold: 80, color: "app-yellow" },
  { idx: 1, pct: 75, label: "Tier 2 — Good", threshold: 50, color: "app-mint" },
  { idx: 2, pct: 100, label: "Tier 3 — Standard", threshold: 20, color: "app-sky" },
  { idx: 3, pct: 150, label: "Tier 4 — High Risk", threshold: 0, color: "app-coral" },
];

export const KYC_TIER_LABELS = ["", "Retail", "Accredited", "Qualified Purchaser", "Institutional"];

export function tierForScore(score: number): number {
  if (score >= 80) return 0;
  if (score >= 50) return 1;
  if (score >= 20) return 2;
  return 3;
}

export const BORROWERS: BorrowerRecord[] = [
  {
    id: 1,
    wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    name: "Apollo Senior Direct",
    status: "active",
    kycTier: 3,
    accreditedBond: 5e18,
    repayments: 8,
    defaults: 0,
    collateralPosts: 12,
    score: 87,
    tierIdx: 0,
    regulatorAuthorized: false,
  },
  {
    id: 2,
    wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    name: "Maple DAO Treasury",
    status: "active",
    kycTier: 2,
    accreditedBond: 2e18,
    repayments: 5,
    defaults: 1,
    collateralPosts: 8,
    score: 62,
    tierIdx: 1,
    loan: { amount: 1e18, collateral: 0.75e18, pct: 75, daysOutstanding: 12 },
    regulatorAuthorized: true,
  },
  {
    id: 3,
    wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    name: "Centrifuge SME #04",
    status: "active",
    kycTier: 2,
    accreditedBond: 1.5e18,
    repayments: 3,
    defaults: 2,
    collateralPosts: 5,
    score: 45,
    tierIdx: 2,
    regulatorAuthorized: false,
  },
  {
    id: 4,
    wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    name: "Sky-Reactor Holdings",
    status: "paused",
    kycTier: 1,
    accreditedBond: 0.5e18,
    repayments: 1,
    defaults: 3,
    collateralPosts: 2,
    score: 18,
    tierIdx: 3,
    regulatorAuthorized: false,
  },
  {
    id: 5,
    wallet: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    name: "Goldman GS DAP-7",
    status: "active",
    kycTier: 4,
    accreditedBond: 8e18,
    repayments: 15,
    defaults: 0,
    collateralPosts: 20,
    score: 95,
    tierIdx: 0,
    loan: { amount: 3e18, collateral: 1.5e18, pct: 50, daysOutstanding: 4 },
    regulatorAuthorized: true,
  },
  {
    id: 6,
    wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    name: "Ondo OUSG Sub-Pool",
    status: "active",
    kycTier: 1,
    accreditedBond: 0.3e18,
    repayments: 2,
    defaults: 1,
    collateralPosts: 4,
    score: 30,
    tierIdx: 2,
    regulatorAuthorized: false,
  },
  {
    id: 7,
    wallet: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    name: "Liquidator Counterparty",
    status: "revoked",
    kycTier: 0,
    accreditedBond: 0,
    repayments: 0,
    defaults: 4,
    collateralPosts: 1,
    score: 5,
    tierIdx: 3,
    regulatorAuthorized: false,
  },
  {
    id: 8,
    wallet: "0x14dC79964da2C08daa4968307cc169a6639Ecb0C",
    name: "Banque Privée Helvetia",
    status: "active",
    kycTier: 2,
    accreditedBond: 3e18,
    repayments: 7,
    defaults: 0,
    collateralPosts: 10,
    score: 71,
    tierIdx: 1,
    regulatorAuthorized: false,
  },
];

export interface ListingProposal {
  assetId: number;
  name: string;
  description: string;
  status: "voting" | "finalized" | "admitted" | "rejected";
  approves?: number;
  rejects?: number;
  voterCount: number;
  finalCount?: number;
  /** Whether the current user has voted on this */
  hasVoted?: boolean;
}

export const PROPOSALS: ListingProposal[] = [
  {
    assetId: 1001,
    name: "Apollo Senior Direct Lending Fund VII",
    description: "Senior secured corporate loan portfolio · $4.2B AUM · 5y avg duration",
    status: "admitted",
    approves: 4,
    rejects: 1,
    voterCount: 5,
    finalCount: 5,
  },
  {
    assetId: 1002,
    name: "Goldman Tokenized Money Market",
    description: "Tier-1 institutional money-market fund · daily liquidity · $2.1B",
    status: "voting",
    voterCount: 3,
  },
  {
    assetId: 1003,
    name: "Centrifuge Real Estate Pool — Q3 2026",
    description: "Commercial real-estate tranches · 3-5y maturity · €890M target",
    status: "voting",
    voterCount: 2,
    hasVoted: true,
  },
];

export const POOL_STATS = {
  tvlEth: 42.7,
  activeLoans: 2,
  totalRepayments: 41,
  defaultRate: 0.0476, // 2 / 42
  totalBondedEth: 20.3,
  utilization: 0.094,
};

export const SEPOLIA_ADDRESSES = {
  registry: "0x23D2566b41964AD73c649f607d35f745e6EB065A",
  conclave: "0x555B150429A8C7Ec8C5d19c894d956645C0878e1",
  credit: "0xd0AAFbd8C223f689E18Fba4F867500cE9A4DE8f1",
  pool: "0xe93C152887Cf45F01655641ff590F6c9CCf7e47C",
};

export const ETHERSCAN_BASE = "https://sepolia.etherscan.io";
