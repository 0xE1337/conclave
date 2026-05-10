"use client";

import { BorrowerData, getCollateralTier } from "@/lib/types";

const TIERS = [
  { label: "Tier 1 — Elite",     pct: 50,  threshold: 80, color: "border-amber-400 bg-amber-500/10",   text: "text-amber-400",   desc: "Score >= 80" },
  { label: "Tier 2 — Good",      pct: 75,  threshold: 50, color: "border-blue-400 bg-blue-500/10",     text: "text-blue-400",    desc: "Score >= 50" },
  { label: "Tier 3 — Standard",  pct: 100, threshold: 20, color: "border-emerald-400 bg-emerald-500/10", text: "text-emerald-400", desc: "Score >= 20" },
  { label: "Tier 4 — High Risk", pct: 150, threshold: 0,  color: "border-red-400 bg-red-500/10",       text: "text-red-400",     desc: "Score < 20" },
];

export default function CollateralTiers({ borrowers }: { borrowers: BorrowerData[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-content-primary">Collateral Tiers (Cascading FHE.select)</h3>
        <p className="text-[10px] font-mono text-content-muted">
          Score-band lookup runs entirely on ciphertext — only the resolved tier ever leaves the encrypted domain.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const count = borrowers.filter((b) => getCollateralTier(b.creditScore).pct === tier.pct).length;
          return (
            <div key={tier.label} className={`rounded-lg border ${tier.color} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-sm ${tier.text}`}>{tier.label}</span>
                <span className={`font-mono text-2xl font-black ${tier.text}`}>{tier.pct}%</span>
              </div>
              <div className="text-[10px] text-content-muted mb-2">{tier.desc}</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-content-muted">Collateral required</span>
                <span className="font-mono text-xs text-content-secondary">{count} borrower{count !== 1 ? "s" : ""}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-surface-muted overflow-hidden">
                <div className={`h-full rounded-full ${tier.text.replace("text-", "bg-")}`} style={{ width: `${Math.min(100, (tier.pct / 150) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface-tertiary p-3">
        <div className="text-[10px] uppercase tracking-widest text-content-muted mb-2">How tier resolution stays private</div>
        <div className="text-[11px] text-content-secondary leading-relaxed font-mono">
          1. <span className="text-accent">resolveCollateralPct(borrowerId)</span> runs cascading <span className="text-amber-400">FHE.select</span> against three encrypted thresholds<br />
          2. Only the resolved <span className="text-amber-400">tier (50/75/100/150)</span> is made publicly decryptable — actual score never leaves ciphertext<br />
          3. <span className="text-accent">borrow(borrowerId, amount, claimedPct)</span> verifies caller honesty via <span className="text-amber-400">FHE.eq(storedTier, claimedPct)</span> — emits TierIntegrityCheck handle for off-chain confirmation
        </div>
      </div>
    </div>
  );
}
