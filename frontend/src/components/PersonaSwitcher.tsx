"use client";

import { motion } from "framer-motion";
import { PERSONAS, type PersonaId } from "@/lib/personas";

export function PersonaSwitcher({
  active,
  onChange,
}: {
  active: PersonaId;
  onChange: (id: PersonaId) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-pill border-2 border-border-soft bg-cream/60 p-1.5 shadow-[0_3px_0_0_var(--color-border)] sm:gap-1.5">
      {PERSONAS.map((p) => {
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            aria-label={p.label}
            className={`relative rounded-pill px-2.5 py-2 text-sm font-bold tracking-wide transition-all duration-[180ms] sm:px-4 ${
              isActive
                ? "text-ink"
                : "text-ink-soft hover:text-ink-body"
            }`}
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="persona-pill"
                className="absolute inset-0 rounded-pill"
                style={{ backgroundColor: p.tint, opacity: 0.85 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <span className="text-base leading-none">{p.emoji}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
