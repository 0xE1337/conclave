"use client";

import { motion } from "framer-motion";
import { useMode, type AppMode } from "@/lib/mode";
import { useT } from "@/lib/i18n";

/**
 * ModeToggle — Demo / Live pill switcher.
 * Matches LanguageToggle's visual rhythm so the two controls sit together
 * comfortably in the top chrome.
 */
export function ModeToggle() {
  const { mode, setMode } = useMode();
  const t = useT();

  const options: { id: AppMode; label: string; tip: string }[] = [
    { id: "demo", label: t.mode.demo, tip: t.mode.demoTip },
    { id: "live", label: t.mode.live, tip: t.mode.liveTip },
  ];

  return (
    <div
      role="group"
      aria-label={t.mode.aria}
      className="inline-flex items-center gap-0.5 rounded-pill border-2 border-border-soft bg-cream/60 p-1 shadow-[0_3px_0_0_var(--color-border)]"
    >
      {options.map((o) => {
        const isActive = mode === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setMode(o.id)}
            aria-pressed={isActive}
            title={o.tip}
            className={`relative rounded-pill px-3 py-1 text-xs font-bold tracking-wide transition-colors duration-150 ${
              isActive ? "text-ink" : "text-ink-soft hover:text-ink-body"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isActive && (
              <motion.span
                layoutId="mode-pill"
                className={`absolute inset-0 rounded-pill ${
                  o.id === "live" ? "bg-app-coral/80" : "bg-mint/75"
                }`}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1">
              <span
                className={`inline-block size-1.5 rounded-full ${
                  o.id === "live" ? "bg-app-coral" : "bg-mint"
                } ${isActive ? "" : "opacity-50"}`}
              />
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
