"use client";

import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import {
  BORROWERS,
  POOL_STATS,
  TIER_BANDS,
  SEPOLIA_ADDRESSES,
  ETHERSCAN_BASE,
} from "@/lib/demo-data";

export function PoolApp({ onBack }: { onBack: () => void }) {
  const tierCounts = TIER_BANDS.map(
    (t) => BORROWERS.filter((b) => b.tierIdx === t.idx).length
  );
  const totalForBars = tierCounts.reduce((a, c) => a + c, 0) || 1;

  const activeLoans = BORROWERS.filter((b) => b.loan);

  return (
    <div>
      <AppHeader
        icon="🪺"
        title="Private Credit Pool"
        subtitle="LP-funded · tier-gated · score-as-state on repay/default"
        accent="var(--color-app-yellow)"
        contractAddress={{
          label: `${SEPOLIA_ADDRESSES.pool.slice(0, 6)}…${SEPOLIA_ADDRESSES.pool.slice(-4)}`,
          href: `${ETHERSCAN_BASE}/address/${SEPOLIA_ADDRESSES.pool}`,
        }}
        onBack={onBack}
      />

      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="TVL" value={`${POOL_STATS.tvlEth.toFixed(1)} ETH`} accent="var(--color-app-mint)" />
        <Kpi label="Active loans" value={String(POOL_STATS.activeLoans)} accent="var(--color-app-yellow)" />
        <Kpi label="Repayments" value={String(POOL_STATS.totalRepayments)} accent="var(--color-app-sage)" />
        <Kpi
          label="Default rate"
          value={`${(POOL_STATS.defaultRate * 100).toFixed(1)}%`}
          accent="var(--color-app-coral)"
        />
      </div>

      {/* Tier distribution */}
      <div className="card mb-5 p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h3
            className="text-base font-bold text-ink"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            Collateral tier distribution
          </h3>
          <span
            className="font-mono text-[10px] uppercase tracking-wider text-ink-soft"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {BORROWERS.length} borrowers
          </span>
        </div>
        <div className="flex h-12 overflow-hidden rounded-pill border-2 border-border-soft">
          {TIER_BANDS.map((t, i) => {
            const w = (tierCounts[i] / totalForBars) * 100;
            const colors = [
              "var(--color-app-yellow)",
              "var(--color-app-mint)",
              "var(--color-app-sky)",
              "var(--color-app-coral)",
            ];
            return (
              <motion.div
                key={t.idx}
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ duration: 0.6, delay: 0.1 * i, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative flex items-center justify-center"
                style={{ background: colors[i] }}
              >
                {tierCounts[i] > 0 && (
                  <span
                    className="font-mono tabular-nums text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(70,50,30,0.45)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {tierCounts[i]}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {TIER_BANDS.map((t, i) => {
            const colors = [
              "var(--color-app-yellow)",
              "var(--color-app-mint)",
              "var(--color-app-sky)",
              "var(--color-app-coral)",
            ];
            return (
              <div key={t.idx} className="flex flex-col gap-0.5">
                <span
                  className="font-mono tabular-nums text-base font-bold"
                  style={{ color: colors[i], fontFamily: "var(--font-display)" }}
                >
                  {t.pct}%
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-ink-soft"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.label.split(" — ")[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active loans */}
      <div className="card overflow-hidden">
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b-2 border-dashed border-border-soft px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>#</span>
          <span>Borrower</span>
          <span className="text-right">Borrowed</span>
          <span className="text-right">Tier</span>
          <span className="text-right">Days</span>
        </div>
        {activeLoans.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-soft">
            No active loans · pool fully redeemed
          </div>
        ) : (
          activeLoans.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-border-soft/60 px-5 py-3.5 last:border-b-0"
            >
              <span
                className="font-mono tabular-nums text-sm font-bold text-ink"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {String(b.id).padStart(3, "0")}
              </span>
              <span
                className="text-sm font-bold text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {b.name}
              </span>
              <span
                className="font-mono tabular-nums text-sm font-bold text-ink text-right"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {(b.loan!.amount / 1e18).toFixed(2)} ETH
              </span>
              <span
                className="rounded-pill px-2.5 py-0.5 text-xs font-bold tabular-nums"
                style={{
                  background:
                    b.loan!.pct === 50
                      ? "var(--color-app-yellow)"
                      : b.loan!.pct === 75
                      ? "var(--color-app-mint)"
                      : "var(--color-app-sky)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                }}
              >
                {b.loan!.pct}%
              </span>
              <span
                className="font-mono tabular-nums text-xs text-ink-soft text-right"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {b.loan!.daysOutstanding}d
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-card border-2 border-border-soft bg-card px-4 py-3"
      style={{ borderTopColor: accent, borderTopWidth: 4 }}
    >
      <div
        className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-mono tabular-nums text-2xl font-bold text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}
