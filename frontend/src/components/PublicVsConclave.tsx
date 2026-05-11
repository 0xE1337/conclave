"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";

/**
 * PublicVsConclave — side-by-side contrast that lands the thesis.
 * Same data point shown as it appears (a) on a typical public-chain explorer
 * and (b) on Conclave's encrypted state book. The leftpane is what BlackRock
 * BUIDL / Aave / Maple expose today; the right pane is what Conclave keeps
 * private while still settling on a public L1.
 */
export function PublicVsConclave() {
  const t = useT();
  return (
    <section className="w-full max-w-[860px] px-1">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3
          className="text-lg font-bold leading-tight text-ink"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
        >
          {t.contrast.heading}
        </h3>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t.contrast.subhead}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PublicPane />
        <ConclavePane />
      </div>

      <p
        className="mt-4 text-center text-xs leading-relaxed text-ink-soft sm:text-left"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {t.contrast.bottomPre}
        <strong className="font-semibold text-ink-body">{t.contrast.bottomStrong}</strong>
        {t.contrast.bottomPost}
      </p>
    </section>
  );
}

function PublicPane() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-2.5 rounded-card border-2 border-border-soft bg-card p-5"
    >
      <header className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t.contrast.publicHeader}
        </span>
        <span className="font-mono text-[10px] text-ink-muted">etherscan.io</span>
      </header>

      <Row label={t.contrast.colAddress} value="0xf39Fd6e51aad…2266" mono />
      <Row label={t.contrast.colKyc} value={t.contrast.valueKycPublic} pill="warning" />
      <Row label={t.contrast.colScore} value="87 / 100" highlight="warning" />
      <Row label={t.contrast.colBalance} value="5.00 ETH" mono />
      <Row label={t.contrast.colLoan} value="1.00 ETH" mono highlight="warning" />
      <Row label={t.contrast.colRepayments} value={t.contrast.valueRepaymentsPublic} mono />

      <div
        className="mt-1 rounded-pill bg-app-coral/15 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-app-coral"
        style={{ fontFamily: "var(--font-mono)", color: "#bd6941" }}
      >
        {t.contrast.publicWarn}
      </div>
    </motion.div>
  );
}

function ConclavePane() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="flex flex-col gap-2.5 rounded-card border-2 p-5"
      style={{
        borderColor: "rgba(20, 168, 152, 0.4)",
        background:
          "linear-gradient(180deg, rgba(230, 249, 246, 0.7) 0%, rgba(255, 253, 243, 0.95) 100%)",
      }}
    >
      <header className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-mint-active)" }}
        >
          {t.contrast.conclaveHeader}
        </span>
        <span className="font-mono text-[10px] text-ink-muted">fhEVM</span>
      </header>

      <Row label={t.contrast.colAddress} value="0xf39Fd6e51aad…2266" mono />
      <Row label={t.contrast.colKyc} value="🍃 euint8 0x4a8d…" sealed />
      <Row label={t.contrast.colScore} value="🍃 euint32 0x9af2c81a3b…" sealed />
      <Row label={t.contrast.colBalance} value={t.contrast.valueSealedBalance} sealed />
      <Row label={t.contrast.colLoan} value="🍃 euint64 0x21cf04e7…" sealed />
      <Row label={t.contrast.colRepayments} value={t.contrast.valueRepaymentsCipher} mono />

      <div
        className="mt-1 rounded-pill bg-mint-bg px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-mint-active"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {t.contrast.conclaveOk}
      </div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
  pill,
  sealed,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: "warning" | "ink";
  pill?: "warning";
  sealed?: boolean;
}) {
  let valueColor = "var(--color-ink-body)";
  if (highlight === "warning") valueColor = "#bd6941";
  if (sealed) valueColor = "var(--color-ink-soft)";

  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border-soft/60 pb-1.5 last:border-b-0 last:pb-0">
      <span
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      {pill === "warning" ? (
        <span
          className="rounded-pill bg-app-yellow/30 px-2.5 py-0.5 text-[11px] font-bold text-ink-body"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </span>
      ) : (
        <span
          className={mono ? "font-mono text-[12px] tabular-nums" : "text-[12px]"}
          style={{
            fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
            color: valueColor,
            fontWeight: highlight ? 700 : 600,
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
