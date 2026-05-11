"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";

/**
 * DecryptionReveal — three-pane "what each persona sees" view.
 * Public always shows ciphertext; Borrower always shows plaintext;
 * Regulator starts locked, transitions to plaintext when authorized.
 *
 * The translucent mint trail flowing from Borrower → Regulator pane
 * is the key emotional beat: data flowing under explicit consent.
 */
export function DecryptionReveal({
  authorized,
  value,
  cipher = "0x9af2c81a3b08…",
}: {
  authorized: boolean;
  value: string;
  cipher?: string;
}) {
  const t = useT();
  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Pane
          tone="public"
          label={t.decryption.paneCipher}
          status={
            <span className="font-mono text-[10px] tracking-tight text-ink-muted">
              {cipher}
            </span>
          }
          value={
            <span className="font-mono text-base text-ink-muted/80">{t.decryption.sealed}</span>
          }
        />
        <Pane
          tone="borrower"
          label={t.decryption.paneBorrower}
          status={<StatusDot color="var(--color-success)" text={t.decryption.fullAccess} />}
          value={
            <span
              className="font-bold tabular-nums text-2xl text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {value}
            </span>
          }
        />
        <Pane
          tone={authorized ? "regulator-on" : "regulator-off"}
          label={t.decryption.paneRegulator}
          status={
            <StatusDot
              color={authorized ? "var(--color-regulator)" : "var(--color-ink-muted)"}
              text={authorized ? t.decryption.authorized : t.decryption.noAccess}
            />
          }
          value={
            <AnimatePresence mode="wait">
              {authorized ? (
                <motion.span
                  key="value"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  className="font-bold tabular-nums text-2xl text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {value}
                </motion.span>
              ) : (
                <motion.span
                  key="lock"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="text-2xl"
                >
                  🔒
                </motion.span>
              )}
            </AnimatePresence>
          }
        />
      </div>

      {/* Mint trail flowing borrower → regulator (desktop horizontal, hidden on mobile stacked layout) */}
      <AnimatePresence>
        {authorized && (
          <motion.div
            key="trail"
            initial={{ opacity: 0, x: "33%", scaleX: 0.4 }}
            animate={{
              opacity: [0, 0.85, 0.85, 0],
              x: ["33%", "67%", "67%", "67%"],
              scaleX: [0.4, 1, 1, 1.1],
            }}
            transition={{
              duration: 0.85,
              times: [0, 0.4, 0.7, 1],
              ease: [0.4, 0, 0.2, 1],
            }}
            className="pointer-events-none absolute inset-y-6 left-0 right-0 -z-0 mx-auto hidden h-12 sm:block"
          >
            <div
              className="h-full w-1/3 rounded-pill blur-[14px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(25,200,185,0.35) 30%, rgba(229,146,102,0.55) 80%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pane({
  tone,
  label,
  status,
  value,
}: {
  tone: "public" | "borrower" | "regulator-on" | "regulator-off";
  label: string;
  status: React.ReactNode;
  value: React.ReactNode;
}) {
  const styles: Record<typeof tone, { bg: string; border: string }> = {
    public:           { bg: "var(--color-cream)",   border: "var(--color-border-soft)" },
    borrower:         { bg: "rgba(130, 213, 187, 0.18)", border: "rgba(20, 168, 152, 0.35)" },
    "regulator-on":   { bg: "rgba(229, 146, 102, 0.18)", border: "rgba(189, 105, 65, 0.35)" },
    "regulator-off":  { bg: "var(--color-cream)",   border: "var(--color-border-soft)" },
  };
  const s = styles[tone];
  return (
    <motion.div
      animate={{ background: s.bg, borderColor: s.border }}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-[148px] flex-col justify-between rounded-card border-2 p-4"
    >
      <div className="flex flex-col gap-1">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </span>
        {status}
      </div>
      <div className="flex items-end">{value}</div>
    </motion.div>
  );
}

function StatusDot({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-body">
      <span className="inline-block size-2 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}
