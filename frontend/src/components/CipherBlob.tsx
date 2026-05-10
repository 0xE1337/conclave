"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * CipherBlob — leaf-wrapped ciphertext display.
 * When `revealed` flips, the leaf unfurls (rotate/scale/fade) and the
 * plaintext value smooths in. The leaf icon is the visual analog of
 * "this value is sealed by FHE ACL — only authorized addresses can decrypt".
 */
export function CipherBlob({
  revealed,
  value,
  cipher = "0x9af2c81a3b...",
  size = "md",
  label,
}: {
  revealed: boolean;
  /** Plaintext value to show when revealed */
  value: string;
  /** Ciphertext placeholder (truncated handle) */
  cipher?: string;
  size?: "sm" | "md" | "lg";
  /** Optional caption above (e.g. "Credit Score") */
  label?: string;
}) {
  const sizes = {
    sm: { wrap: "px-3 py-1.5 text-xs", leaf: 14, value: "text-sm" },
    md: { wrap: "px-4 py-2.5 text-sm", leaf: 18, value: "text-base" },
    lg: { wrap: "px-5 py-3 text-base", leaf: 22, value: "text-xl" },
  }[size];

  return (
    <div className="inline-flex flex-col gap-1">
      {label && (
        <span
          className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {label}
        </span>
      )}
      <div
        className={`relative inline-flex items-center gap-2.5 rounded-pill border-2 border-border-soft bg-mint-bg/50 ${sizes.wrap} font-mono`}
        style={{
          boxShadow: revealed
            ? "inset 0 0 0 1.5px var(--color-mint), 0 2px 6px rgba(25,200,185,0.15)"
            : "inset 0 0 0 1.5px var(--color-border-soft)",
          transition: "box-shadow 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Leaf icon — disappears on reveal */}
        <motion.span
          animate={{
            rotate: revealed ? 35 : 0,
            scale: revealed ? 0 : 1,
            opacity: revealed ? 0 : 1,
          }}
          transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
          className="origin-bottom-left"
        >
          <LeafIcon size={sizes.leaf} />
        </motion.span>

        {/* Value display: ciphertext or plaintext */}
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.span
              key="plain"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
              className={`font-bold tabular-nums text-ink ${sizes.value}`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {value}
            </motion.span>
          ) : (
            <motion.span
              key="cipher"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-ink-muted/80"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {cipher}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LeafIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M21 3c-3 5-7 8-12 9-3 1-5 3-5 7 0 1 0 1 1 1 4 0 6-2 7-5 1-5 4-9 9-12z"
        fill="var(--color-mint)"
        opacity="0.92"
      />
      <path
        d="M4 20c2-5 6-8 12-10"
        stroke="var(--color-mint-active)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
    </svg>
  );
}
