"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";

/**
 * AppHeader — slim header inside an app screen with a back arrow,
 * an icon chip, the app name, and an optional contract-address chip.
 */
export function AppHeader({
  icon,
  title,
  subtitle,
  contractAddress,
  onBack,
  accent = "var(--color-mint)",
}: {
  icon: string;
  title: string;
  subtitle: string;
  contractAddress?: { label: string; href: string };
  onBack: () => void;
  /** Persona-tinted accent for the icon chip background */
  accent?: string;
}) {
  const t = useT();
  return (
    <div className="mb-6 flex items-center gap-3">
      <motion.button
        onClick={onBack}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.96 }}
        className="rounded-pill border-2 border-border-soft bg-card px-3.5 py-1.5 text-xs font-bold tracking-wide text-ink-body shadow-[0_3px_0_0_var(--color-border)] transition-colors hover:border-mint hover:text-mint-active"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {t.app.back}
      </motion.button>

      <span
        className="grid size-11 place-items-center rounded-tile text-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.08)]"
        style={{ background: accent }}
      >
        {icon}
      </span>

      <div className="flex flex-1 flex-col">
        <h2
          className="text-xl font-bold leading-tight text-ink"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          {title}
        </h2>
        <span className="text-xs font-medium text-ink-soft">{subtitle}</span>
      </div>

      {contractAddress && (
        <a
          href={contractAddress.href}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-pill border-2 border-dashed border-border-soft px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:border-mint hover:text-mint-active sm:inline-flex"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {contractAddress.label}
          <span className="text-[8px]">↗</span>
        </a>
      )}
    </div>
  );
}
