"use client";

import { motion } from "framer-motion";
import { useWallet } from "@/lib/wallet";
import { shortAddr } from "@/lib/chain";
import { useT } from "@/lib/i18n";

/**
 * Compact wallet status pill shown in Live mode.
 * 4 visual states: not-installed / disconnected / wrong-network / connected.
 * Click action follows the state's natural next step.
 */
export function WalletPill() {
  const w = useWallet();
  const t = useT();

  if (!w.hasWallet) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-pill border-2 border-dashed border-border-soft bg-card px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-mint hover:text-mint-active"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {t.wallet.installPrompt} ↗
      </a>
    );
  }

  if (w.status === "disconnected") {
    return (
      <motion.button
        onClick={w.connect}
        whileHover={{ y: -1 }}
        whileTap={{ y: 1 }}
        className="rounded-pill border-2 border-mint bg-mint/15 px-3 py-1.5 text-xs font-bold text-mint-active shadow-[0_3px_0_0_var(--color-mint)] transition-colors hover:bg-mint/25"
        style={{ fontFamily: "var(--font-display)" }}
      >
        🦊 {t.wallet.connect}
      </motion.button>
    );
  }

  if (w.status === "connecting") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-pill border-2 border-border-soft bg-card px-3 py-1.5 text-xs font-bold text-ink-soft"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-mint" />
        {t.wallet.connecting}
      </span>
    );
  }

  if (w.status === "wrong-network") {
    return (
      <motion.button
        onClick={w.switchToSepolia}
        whileHover={{ y: -1 }}
        whileTap={{ y: 1 }}
        className="inline-flex items-center gap-1.5 rounded-pill border-2 border-app-coral bg-app-coral/15 px-3 py-1.5 text-xs font-bold text-app-coral shadow-[0_3px_0_0_var(--color-app-coral)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        ⚠ {t.wallet.switchToSepolia}
      </motion.button>
    );
  }

  // Connected to Sepolia
  return (
    <span
      className="inline-flex items-center gap-2 rounded-pill border-2 border-success bg-success/15 px-3 py-1.5 text-xs font-bold text-success shadow-[0_3px_0_0_var(--color-success)]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <span className="inline-block size-1.5 animate-pulse rounded-full bg-success" />
      <span
        className="font-mono tabular-nums text-[11px]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {shortAddr(w.address)}
      </span>
      <span className="rounded-pill bg-success/25 px-1.5 py-0.5 text-[9px] tracking-wider">
        {t.wallet.sepoliaBadge}
      </span>
    </span>
  );
}
