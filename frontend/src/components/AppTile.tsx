"use client";

import { motion } from "framer-motion";

export type AppTileColor =
  | "mint"
  | "yellow"
  | "sky"
  | "coral"
  | "lavender"
  | "pink"
  | "sage";

const COLOR_MAP: Record<AppTileColor, { bg: string; ring: string }> = {
  mint:     { bg: "var(--color-app-mint)",     ring: "rgba(20, 168, 152, 0.3)" },
  yellow:   { bg: "var(--color-app-yellow)",   ring: "rgba(218, 169, 14, 0.3)" },
  sky:      { bg: "var(--color-app-sky)",      ring: "rgba(82, 100, 199, 0.3)" },
  coral:    { bg: "var(--color-app-coral)",    ring: "rgba(189, 105, 65, 0.3)" },
  lavender: { bg: "var(--color-app-lavender)", ring: "rgba(141, 79, 198, 0.3)" },
  pink:     { bg: "var(--color-app-pink)",     ring: "rgba(207, 105, 127, 0.3)" },
  sage:     { bg: "var(--color-app-sage)",     ring: "rgba(106, 159, 106, 0.3)" },
};

interface AppTileProps {
  /** big emoji used as app icon */
  icon: string;
  /** short label */
  label: string;
  /** subtitle / contract name */
  subtitle: string;
  /** primary fill color */
  color: AppTileColor;
  /** kpi badge bottom-right (e.g. "8 borrowers") */
  badge?: string;
  /** click handler */
  onClick?: () => void;
  /** stagger index for entrance animation (0..n) */
  index?: number;
}

export function AppTile({ icon, label, subtitle, color, badge, onClick, index = 0 }: AppTileProps) {
  const c = COLOR_MAP[color];
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.06 + index * 0.08,
        type: "spring",
        stiffness: 280,
        damping: 18,
      }}
      whileHover={{ y: -4 }}
      whileTap={{ y: 2 }}
      className="group relative flex aspect-square w-full flex-col items-start justify-between rounded-tile p-5 text-left shadow-tile transition-shadow duration-300 hover:shadow-[0_14px_28px_-6px_rgba(107,92,67,0.28)]"
      style={{
        background: c.bg,
        boxShadow: `0 6px 0 0 ${c.ring}, 0 14px 28px -10px rgba(107,92,67,0.22)`,
      }}
    >
      {/* big emoji */}
      <motion.span
        className="text-5xl leading-none drop-shadow-[0_2px_4px_rgba(70,50,30,0.18)]"
        initial={{ rotate: 0 }}
        whileHover={{ rotate: [0, -6, 5, -3, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.span>

      {/* labels */}
      <div className="flex w-full flex-col gap-0.5">
        <span
          className="text-lg font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgba(70,50,30,0.35)]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          {label}
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
          {subtitle}
        </span>
      </div>

      {/* badge */}
      {badge && (
        <span className="absolute right-3 top-3 rounded-pill bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-body shadow-[0_2px_0_0_rgba(0,0,0,0.08)]">
          {badge}
        </span>
      )}
    </motion.button>
  );
}
