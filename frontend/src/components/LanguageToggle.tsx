"use client";

import { motion } from "framer-motion";
import { useI18n, type Locale } from "@/lib/i18n";

/**
 * LanguageToggle — segmented pill switcher between Chinese and English.
 * Same NookPhone-pill aesthetic as PersonaSwitcher so it sits naturally
 * top-right of the page header.
 */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  const options: { id: Locale; label: string }[] = [
    { id: "zh", label: t.toggle.labelZh },
    { id: "en", label: t.toggle.labelEn },
  ];

  return (
    <div
      role="group"
      aria-label={t.toggle.aria}
      className="inline-flex items-center gap-0.5 rounded-pill border-2 border-border-soft bg-cream/60 p-1 shadow-[0_3px_0_0_var(--color-border)]"
    >
      {options.map((o) => {
        const isActive = locale === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setLocale(o.id)}
            aria-pressed={isActive}
            aria-label={o.id === "zh" ? "Switch to Chinese" : "Switch to English"}
            className={`relative rounded-pill px-3 py-1 text-xs font-bold tracking-wide transition-colors duration-150 ${
              isActive ? "text-ink" : "text-ink-soft hover:text-ink-body"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isActive && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-pill bg-mint/75"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
