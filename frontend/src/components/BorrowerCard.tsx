"use client";

import { BorrowerData, getRarity, RARITY_COLORS, KYC_TIER_LABELS, STATUS_COLORS, getCollateralTier } from "@/lib/types";

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-right font-mono text-content-muted uppercase tracking-wide text-[10px]">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-bold font-mono text-content-secondary text-[11px]">{value}</span>
    </div>
  );
}

function HolographicOverlay({ rarity }: { rarity: string }) {
  if (rarity === "common") return null;
  const gradient =
    rarity === "legendary"
      ? "linear-gradient(135deg, transparent 20%, #fbbf24 40%, transparent 45%, #f59e0b 55%, transparent 60%, #fbbf24 80%)"
      : rarity === "rare"
      ? "linear-gradient(135deg, transparent 20%, #60a5fa 40%, transparent 45%, #818cf8 55%, transparent 60%, #60a5fa 80%)"
      : "linear-gradient(135deg, transparent 20%, #34d399 40%, transparent 45%, #10b981 55%, transparent 60%, #34d399 80%)";
  return (
    <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ background: gradient, backgroundSize: "200% 200%", animation: "shimmer 3s ease-in-out infinite" }} />
    </div>
  );
}

export default function BorrowerCard({ borrower, onClick }: { borrower: BorrowerData; onClick?: () => void }) {
  const rarity = getRarity(borrower);
  const colors = RARITY_COLORS[rarity];
  const tierLabel = KYC_TIER_LABELS[borrower.kycTier] || "?";
  const collateral = getCollateralTier(borrower.creditScore);

  return (
    <div
      onClick={onClick}
      className={`relative w-[260px] rounded-2xl border-2 ${colors.border} bg-gradient-to-b ${colors.bg} shadow-lg ${colors.glow} hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer select-none overflow-hidden`}
    >
      <HolographicOverlay rarity={rarity} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black font-mono text-content-primary">#{String(borrower.id).padStart(3, "0")}</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[borrower.status]}`}>{borrower.status}</span>
        </div>
        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${colors.badge}`}>{rarity.toUpperCase()}</span>
      </div>

      {/* Avatar */}
      <div className="relative z-10 mx-4 mt-1 mb-3 h-32 rounded-xl bg-surface-muted/30 border border-white/10 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 120 120" className="w-20 h-20 opacity-90">
          <defs>
            <linearGradient id={`grad-${borrower.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={rarity === "legendary" ? "#f59e0b" : rarity === "rare" ? "#6366f1" : rarity === "uncommon" ? "#10b981" : "#71717a"} />
              <stop offset="100%" stopColor={rarity === "legendary" ? "#b45309" : rarity === "rare" ? "#3b82f6" : rarity === "uncommon" ? "#059669" : "#52525b"} />
            </linearGradient>
          </defs>
          <rect x="35" y="30" width="50" height="60" rx="4" fill={`url(#grad-${borrower.id})`} />
          <rect x="42" y="42" width="8" height="8" fill="white" opacity="0.6" />
          <rect x="56" y="42" width="8" height="8" fill="white" opacity="0.6" />
          <rect x="70" y="42" width="8" height="8" fill="white" opacity="0.6" />
          <rect x="42" y="55" width="8" height="8" fill="white" opacity="0.6" />
          <rect x="56" y="55" width="8" height="8" fill="white" opacity="0.6" />
          <rect x="70" y="55" width="8" height="8" fill="white" opacity="0.6" />
          <rect x="50" y="70" width="20" height="20" fill="white" opacity="0.4" />
        </svg>
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <span className="text-amber-400">&#9733;</span> {tierLabel}
        </div>
        {borrower.hasLoan && (
          <div className="absolute bottom-2 left-2 bg-red-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            LOAN {collateral.pct}%
          </div>
        )}
        <div className={`absolute bottom-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 ${collateral.color}`}>
          {collateral.label}
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-4 pb-2 space-y-1.5">
        <StatBar label="SCORE" value={borrower.creditScore} max={100} color="bg-gradient-to-r from-amber-400 to-amber-500" />
        <StatBar label="REPAY" value={borrower.repayments} max={20} color="bg-gradient-to-r from-blue-400 to-blue-500" />
        <StatBar label="BOND" value={Math.round(borrower.accreditedBond / 1e15)} max={10000} color="bg-gradient-to-r from-emerald-400 to-emerald-500" />
        <StatBar label="VOTES" value={borrower.votesParticipated} max={20} color="bg-gradient-to-r from-purple-400 to-purple-500" />
      </div>

      {/* Footer */}
      <div className="relative z-10 px-4 pb-3 pt-1 border-t border-white/10">
        <div className="flex justify-between items-center text-[10px] text-content-muted font-mono">
          <span>{borrower.wallet.slice(0, 6)}...{borrower.wallet.slice(-4)}</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            FHE Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
