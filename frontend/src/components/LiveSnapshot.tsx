"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import {
  ADDRS,
  ETHERSCAN_ADDR,
  fetchOnchainSnapshot,
  shortAddr,
  type OnchainSnapshot,
} from "@/lib/chain";
import { ComputeScoreButton } from "./ComputeScoreButton";

/**
 * Live-mode counterpart to `<PublicVsConclave>`. Instead of an illustrative
 * comparison, this is the real on-chain truth: actual counters, governor
 * address, regulator address, pool wiring, block height — pulled live from
 * Sepolia and time-stamped.
 *
 * It also surfaces the one permissionless write we expose to visitors
 * (`computeScore(1)`) so anyone with a wallet can submit a real tx and see
 * the FHE stack run end-to-end on a public chain.
 */
export function LiveSnapshot() {
  const t = useT();
  const [snap, setSnap] = useState<OnchainSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchOnchainSnapshot()
      .then((s) => {
        if (!cancelled) setSnap(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "RPC error";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const regulatorSet =
    snap?.credit.regulator &&
    snap.credit.regulator !== "0x0000000000000000000000000000000000000000";
  const poolSet =
    snap?.credit.pool &&
    snap.credit.pool !== "0x0000000000000000000000000000000000000000";

  return (
    <section className="w-full max-w-[860px] px-1">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h3
          className="text-lg font-bold leading-tight text-ink"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
        >
          🛰 {t.live.snapshotTitle}
        </h3>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          {snap ? (
            <span>
              {t.live.snapshotBlock} #{snap.blockNumber.toLocaleString()}
            </span>
          ) : loading ? (
            <span className="animate-pulse">{t.live.snapshotFetching}</span>
          ) : null}
          <button
            onClick={() => setTick((v) => v + 1)}
            className="rounded-pill border-2 border-border-soft bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft transition-colors hover:border-mint hover:text-mint-active"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ↻
          </button>
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-card border-2 border-app-coral/40 bg-app-coral/10 p-4 text-sm text-ink-body">
          {t.live.snapshotError}: <code className="font-mono text-xs">{error}</code>
          <button
            onClick={() => setTick((v) => v + 1)}
            className="ml-3 rounded-pill border-2 border-app-coral bg-card px-2 py-0.5 text-xs font-bold text-app-coral"
          >
            {t.live.snapshotRetry}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatPill
          label={t.live.borrowersOnchain}
          value={snap ? snap.registry.count.toString() : "—"}
          ok={(snap?.registry.count ?? 0) > 0}
          contract="registry"
        />
        <StatPill
          label={t.live.regulatorOnchain}
          value={
            snap
              ? regulatorSet
                ? shortAddr(snap.credit.regulator)
                : t.live.notSet
              : "—"
          }
          ok={Boolean(regulatorSet)}
          contract="credit"
        />
        <StatPill
          label={t.live.poolOnchain}
          value={snap ? shortAddr(snap.credit.pool) : "—"}
          ok={Boolean(poolSet)}
          contract="credit"
        />
        <StatPill
          label={t.live.governorOnchain}
          value={snap ? shortAddr(snap.credit.governor) : "—"}
          ok
          contract="credit"
        />
      </div>

      {/* Honest disclosure about why a random visitor can't do
          grantRegulatorAccess on a real-chain demo. */}
      {snap && snap.registry.count === 0 && (
        <p className="mt-3 rounded-card border border-dashed border-border-soft bg-cream/40 px-4 py-2 text-xs leading-relaxed text-ink-soft">
          {t.live.borrowerOnchainNotice.replace(
            "{count}",
            String(snap.registry.count),
          )}
        </p>
      )}

      {/* The one real write we surface */}
      <div className="mt-4">
        <ComputeScoreButton />
      </div>
    </section>
  );
}

function StatPill({
  label,
  value,
  ok,
  contract,
}: {
  label: string;
  value: string;
  ok: boolean;
  contract: keyof typeof ADDRS;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="flex items-center justify-between gap-3 rounded-card border-2 border-border-soft bg-card px-4 py-3"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: ok ? "var(--color-success)" : "var(--color-app-coral)",
      }}
    >
      <div className="flex flex-col">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </span>
        <span
          className="font-mono tabular-nums text-base font-bold text-ink"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </span>
      </div>
      <a
        href={ETHERSCAN_ADDR(ADDRS[contract])}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-pill border border-border-soft bg-cream/50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink-muted transition-colors hover:border-mint hover:text-mint-active"
      >
        ↗
      </a>
    </motion.div>
  );
}
