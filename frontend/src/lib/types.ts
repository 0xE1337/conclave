export type BorrowerStatus = "active" | "paused" | "revoked";

/**
 * Borrower = institutional entity (DAO treasury / SME / RWA originator)
 * registered with encrypted KYC tier and accredited bond. Credit-history
 * fields are computed by CreditScoreEngine in the encrypted domain.
 */
export interface BorrowerData {
  id: number;
  wallet: string;
  status: BorrowerStatus;
  kycTier: number;          // 1=retail, 2=accredited, 3=qualified-purchaser, 4=institutional
  accreditedBond: number;   // posted compliance bond (encrypted on-chain)
  // Score-as-state — these inputs are written by PrivateCreditPool atomically
  // with each repay/liquidate; the score itself is mutable encrypted state.
  creditScore: number;
  repayments: number;
  defaults: number;
  collateralPosts: number;
  // Active loan (if any)
  hasLoan: boolean;
  loanAmount: number;
  loanCollateral: number;
  collateralPct: number;    // 50 | 75 | 100 | 150
  votesParticipated: number; // ListingConclave participations
}

export type CardRarity = "common" | "uncommon" | "rare" | "legendary";

export function getRarity(b: BorrowerData): CardRarity {
  if (b.creditScore >= 80) return "legendary";
  if (b.creditScore >= 50) return "rare";
  if (b.creditScore >= 20) return "uncommon";
  return "common";
}

export function getCollateralTier(score: number): { pct: number; label: string; color: string } {
  if (score >= 80) return { pct: 50,  label: "Tier 1 — Elite",       color: "text-amber-400" };
  if (score >= 50) return { pct: 75,  label: "Tier 2 — Good",        color: "text-blue-400" };
  if (score >= 20) return { pct: 100, label: "Tier 3 — Standard",    color: "text-emerald-400" };
  return                  { pct: 150, label: "Tier 4 — High-Risk",   color: "text-red-400" };
}

export const RARITY_COLORS: Record<CardRarity, { border: string; glow: string; bg: string; badge: string }> = {
  common:    { border: "border-zinc-500",  glow: "shadow-zinc-500/20",   bg: "from-zinc-900 to-zinc-800",     badge: "bg-zinc-600" },
  uncommon:  { border: "border-green-500", glow: "shadow-green-500/30",  bg: "from-green-950 to-emerald-900", badge: "bg-green-600" },
  rare:      { border: "border-blue-500",  glow: "shadow-blue-500/40",   bg: "from-blue-950 to-indigo-900",   badge: "bg-blue-600" },
  legendary: { border: "border-amber-400", glow: "shadow-amber-400/50",  bg: "from-amber-950 to-yellow-900",  badge: "bg-amber-500" },
};

export const KYC_TIER_LABELS = ["None", "Retail", "Accredited", "Qualified Purchaser", "Institutional"];

export const STATUS_COLORS: Record<BorrowerStatus, string> = {
  active:  "text-emerald-400",
  paused:  "text-amber-400",
  revoked: "text-red-400",
};
