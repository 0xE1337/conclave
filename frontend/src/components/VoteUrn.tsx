"use client";

import { motion, AnimatePresence } from "framer-motion";

/**
 * VoteUrn — visualises a sealed-vote tally. While voting is open,
 * leaves drop into the urn but no count is shown. After finalize,
 * the urn cracks open and aggregates resolve.
 *
 * Mirrors `sealVote` (homomorphic addition consumes per-vote randomness)
 * and `finalize` (makePubliclyDecryptable on the aggregates).
 */
export function VoteUrn({
  state,
  approves,
  rejects,
  voterCount,
}: {
  state: "voting" | "finalized";
  approves?: number;
  rejects?: number;
  voterCount: number;
}) {
  return (
    <div className="flex flex-col items-stretch gap-4">
      <AnimatePresence mode="wait">
        {state === "voting" ? (
          <motion.div
            key="sealed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32 }}
            className="rounded-card border-2 border-border-soft bg-mint-bg/35 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FloatingLeaves count={voterCount} />
                <div className="flex flex-col">
                  <span
                    className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-mint-active"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Sealed
                  </span>
                  <span className="text-sm font-semibold text-ink-body">
                    {voterCount} {voterCount === 1 ? "vote" : "votes"} cast
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] text-ink-muted">
                  euint32 0xc14d…7e2f
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  euint32 0x9af2…3b08
                </span>
              </div>
            </div>
            <p
              className="mt-3 text-xs leading-relaxed text-ink-soft"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Tally accumulates as ciphertext. Voters cannot prove how they
              voted to a briber afterwards.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="resolved"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="rounded-card border-2 border-success/30 bg-[oklch(96%_0.05_135)] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌿</span>
                <span
                  className="text-sm font-bold uppercase tracking-[0.14em] text-success"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Tally revealed
                </span>
              </div>
              <span
                className="font-mono text-[10px] uppercase tracking-wider text-ink-soft"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {voterCount} voters
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <TallyBar
                label="Approve"
                value={approves ?? 0}
                total={(approves ?? 0) + (rejects ?? 0)}
                color="var(--color-success)"
              />
              <span className="text-xl text-ink-soft">·</span>
              <TallyBar
                label="Reject"
                value={rejects ?? 0}
                total={(approves ?? 0) + (rejects ?? 0)}
                color="var(--color-error)"
                align="right"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingLeaves({ count }: { count: number }) {
  // visual: 3 leaves regardless of count, but with subtle layered floats
  return (
    <div className="relative flex h-9 w-9 items-center justify-center">
      <span className="absolute text-2xl leaf-float" style={{ animationDelay: "0s" }}>
        🍃
      </span>
      <span
        className="absolute text-base opacity-70 leaf-float"
        style={{ left: -2, top: 14, animationDelay: "0.6s" }}
      >
        🍃
      </span>
      <span
        className="absolute text-sm opacity-55 leaf-float"
        style={{ left: 18, top: 14, animationDelay: "1.2s" }}
      >
        🍃
      </span>
      {/* count chip */}
      <span className="absolute -right-2 -top-1 rounded-full border border-success bg-card px-1.5 text-[9px] font-bold tabular-nums text-success">
        {count}
      </span>
    </div>
  );
}

function TallyBar({
  label,
  value,
  total,
  color,
  align = "left",
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  align?: "left" | "right";
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className={`flex flex-col gap-1 ${align === "right" ? "items-end" : "items-start"}`}>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono tabular-nums text-2xl font-bold"
          style={{ color, fontFamily: "var(--font-display)" }}
        >
          {value}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-cream">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full rounded-pill"
          style={{ background: color, marginLeft: align === "right" ? "auto" : 0 }}
        />
      </div>
    </div>
  );
}
