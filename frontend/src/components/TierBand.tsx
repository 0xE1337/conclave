"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TIER_BANDS } from "@/lib/demo-data";

const STOP_COLORS = [
  "var(--color-app-yellow)",
  "var(--color-app-mint)",
  "var(--color-app-sky)",
  "var(--color-app-coral)",
];

/**
 * TierBand — horizontal slider with 4 colored stops representing
 * collateral tiers (50/75/100/150%). When `activeIdx` is set, a dot
 * springs to the target tier with overshoot, and a sparkle ripples through.
 *
 * Mirrors the on-chain `cascading FHE.select` against the encrypted score.
 * Only the resolved tier ever leaves the encrypted domain — the score itself
 * stays as ciphertext.
 */
export function TierBand({ activeIdx }: { activeIdx: number | null }) {
  const stopPositions = [10, 36.67, 63.33, 90]; // % positions of dots on the track

  return (
    <div className="w-full">
      {/* the track */}
      <div className="relative mx-auto h-3 w-full max-w-[520px] rounded-pill bg-mint-bg/60 ring-1 ring-inset ring-border-soft">
        {/* tick stops */}
        {stopPositions.map((x, i) => {
          const isActive = activeIdx === i;
          return (
            <span
              key={i}
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
              style={{
                left: `${x}%`,
                background: STOP_COLORS[i],
                opacity: activeIdx === null ? 0.55 : isActive ? 1 : 0.35,
                boxShadow: isActive
                  ? `0 0 0 4px ${STOP_COLORS[i]}33, 0 0 14px ${STOP_COLORS[i]}88`
                  : "none",
              }}
            />
          );
        })}

        {/* the dot that springs in */}
        <AnimatePresence>
          {activeIdx !== null && (
            <motion.div
              key={activeIdx}
              initial={{ left: "-8%", opacity: 0, scale: 0.4 }}
              animate={{
                left: `${stopPositions[activeIdx]}%`,
                opacity: 1,
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 16,
                mass: 0.9,
              }}
              className="pointer-events-none absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white"
              style={{
                background: STOP_COLORS[activeIdx],
                boxShadow: `0 4px 0 0 ${STOP_COLORS[activeIdx]}55, 0 0 24px ${STOP_COLORS[activeIdx]}99`,
              }}
            />
          )}
        </AnimatePresence>

        {/* sparkle on resolve */}
        {activeIdx !== null && (
          <motion.span
            key={`sparkle-${activeIdx}`}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], y: -16, scale: [0.6, 1.1, 0.6] }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-base"
            style={{ left: `${stopPositions[activeIdx]}%` }}
          >
            ✨
          </motion.span>
        )}
      </div>

      {/* labels under stops */}
      <div className="mx-auto mt-4 grid w-full max-w-[520px] grid-cols-4 gap-2 text-center">
        {TIER_BANDS.map((b, i) => {
          const isActive = activeIdx === i;
          return (
            <div
              key={b.idx}
              className="flex flex-col items-center gap-1 transition-opacity duration-300"
              style={{ opacity: activeIdx === null ? 0.7 : isActive ? 1 : 0.4 }}
            >
              <span
                className="font-mono tabular-nums text-lg font-bold"
                style={{
                  color: STOP_COLORS[i],
                  fontFamily: "var(--font-display)",
                }}
              >
                {b.pct}%
              </span>
              <span
                className="text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-ink-soft"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {b.label.split(" — ")[1] ?? b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
