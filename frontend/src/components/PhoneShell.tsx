"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { type Persona } from "@/lib/personas";
import { useT } from "@/lib/i18n";

/**
 * PhoneShell — the device-shaped container that holds the entire dApp.
 * The shell tints subtly with the active persona, mirroring the on-chain
 * ACL change `FHE.allow(handle, addr)`.
 */
export function PhoneShell({
  persona,
  children,
}: {
  persona: Persona;
  children: ReactNode;
}) {
  return (
    <motion.div
      animate={{
        background: `linear-gradient(180deg, ${persona.tint}33 0%, var(--color-card) 22%, var(--color-card) 100%)`,
      }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative w-full max-w-[860px] overflow-hidden rounded-[44px] border-[3px] border-border-soft shadow-[0_24px_60px_-12px_rgba(107,92,67,0.35),0_8px_24px_-8px_rgba(107,92,67,0.18)]"
      style={{
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* top-bar */}
      <PhoneTopBar persona={persona} />

      {/* content */}
      <div className="relative px-8 pb-8 pt-2 sm:px-10 sm:pb-10">
        {children}
      </div>
    </motion.div>
  );
}

function PhoneTopBar({ persona }: { persona: Persona }) {
  const t = useT();
  const time = "01:42";
  const personaLabel = t.persona[persona.id].label;
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-border-soft/60 px-6 py-3 sm:px-8">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
        <span className="inline-block size-2 rounded-full bg-success animate-[blink-soft_1.6s_ease-in-out_infinite]" />
        <span>{t.phone.live}</span>
      </div>

      <div
        className="flex items-baseline gap-1.5 font-mono tabular-nums text-ink-soft"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="text-[15px] font-semibold">{time}</span>
        <span className="text-[10px] uppercase tracking-wider">{t.phone.am}</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
        <span className="text-base leading-none">{persona.emoji}</span>
        <span className="hidden sm:inline">{personaLabel}</span>
      </div>
    </div>
  );
}
