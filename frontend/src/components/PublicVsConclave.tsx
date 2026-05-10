"use client";

import { motion } from "framer-motion";

/**
 * PublicVsConclave — side-by-side contrast that lands the thesis.
 * Same data point shown as it appears (a) on a typical public-chain explorer
 * and (b) on Conclave's encrypted state book. The leftpane is what BlackRock
 * BUIDL / Aave / Maple expose today; the right pane is what Conclave keeps
 * private while still settling on a public L1.
 */
export function PublicVsConclave() {
  return (
    <section className="w-full max-w-[860px] px-1">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3
          className="text-lg font-bold leading-tight text-ink"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
        >
          The contrast
        </h3>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Same borrower · same block height
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
        Today, BlackRock&apos;s $2.75B BUIDL fund leaks every holder, balance, and
        flow. JPMorgan Kinexys keeps it private — but on a closed network.
        Conclave runs on a <strong className="font-semibold text-ink-body">public L1</strong>,
        encrypted, with a per-borrower regulator viewing key.
      </p>
    </section>
  );
}

function PublicPane() {
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
          🌐 Public chain · what anyone sees
        </span>
        <span className="font-mono text-[10px] text-ink-muted">etherscan.io</span>
      </header>

      <Row label="address" value="0xf39Fd6e51aad…2266" mono />
      <Row label="kyc tier" value="Qualified Purchaser" pill="warning" />
      <Row label="credit score" value="87 / 100" highlight="warning" />
      <Row label="balance" value="5.00 ETH" mono />
      <Row label="active loan" value="1.00 ETH" mono highlight="warning" />
      <Row label="repayments" value="8 ↑   defaults 0 ↓" mono />

      <div
        className="mt-1 rounded-pill bg-app-coral/15 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-app-coral"
        style={{ fontFamily: "var(--font-mono)", color: "#bd6941" }}
      >
        ⚠ everything indexable, frontrunnable, scrapable
      </div>
    </motion.div>
  );
}

function ConclavePane() {
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
          🍃 Conclave · what the chain stores
        </span>
        <span className="font-mono text-[10px] text-ink-muted">fhEVM</span>
      </header>

      <Row label="address" value="0xf39Fd6e51aad…2266" mono />
      <Row label="kyc tier" value="🍃 euint8 0x4a8d…" sealed />
      <Row label="credit score" value="🍃 euint32 0x9af2c81a3b…" sealed />
      <Row label="balance" value="🍃 sealed in pool aggregates" sealed />
      <Row label="active loan" value="🍃 euint64 0x21cf04e7…" sealed />
      <Row label="repayments" value="atomic ciphertext mutation" mono />

      <div
        className="mt-1 rounded-pill bg-mint-bg px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-mint-active"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ✓ public solvency proofs · regulator on opt-in only
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
