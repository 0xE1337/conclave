"use client";

import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { CipherBlob } from "@/components/CipherBlob";
import {
  BORROWERS,
  KYC_TIER_LABELS,
  SEPOLIA_ADDRESSES,
  ETHERSCAN_BASE,
  type BorrowerRecord,
} from "@/lib/demo-data";
import { type PersonaId } from "@/lib/personas";

const STATUS_DOT: Record<BorrowerRecord["status"], string> = {
  active: "var(--color-success)",
  paused: "var(--color-warning)",
  revoked: "var(--color-error)",
};

export function RegistryApp({
  persona,
  onBack,
}: {
  persona: PersonaId;
  onBack: () => void;
}) {
  const canDecryptKyc = (b: BorrowerRecord): boolean => {
    // Only borrower themselves sees own KYC tier; regulator only if authorized.
    if (persona === "borrower" && b.id === 1) return true; // demo: persona 'borrower' = #001
    if (persona === "regulator" && b.regulatorAuthorized) return true;
    return false;
  };

  return (
    <div>
      <AppHeader
        icon="🌿"
        title="Borrower Registry"
        subtitle="Institutional KYC — encrypted by default"
        contractAddress={{
          label: `${SEPOLIA_ADDRESSES.registry.slice(0, 6)}…${SEPOLIA_ADDRESSES.registry.slice(-4)}`,
          href: `${ETHERSCAN_BASE}/address/${SEPOLIA_ADDRESSES.registry}`,
        }}
        accent="var(--color-borrower)"
        onBack={onBack}
      />

      {/* Stat strip */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Borrowers" value={String(BORROWERS.length)} accent="var(--color-app-mint)" />
        <Stat
          label="Active"
          value={String(BORROWERS.filter((b) => b.status === "active").length)}
          accent="var(--color-app-yellow)"
        />
        <Stat
          label="Total bond"
          value={`${(BORROWERS.reduce((s, b) => s + b.accreditedBond, 0) / 1e18).toFixed(1)} ETH`}
          accent="var(--color-app-coral)"
        />
      </div>

      {/* Roster — table-style, monospace numerics. Horizontally scrolls on mobile. */}
      <div className="rounded-card border-2 border-border-soft bg-card overflow-x-auto">
        <div
          className="grid min-w-[640px] grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b-2 border-dashed border-border-soft px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>#</span>
          <span>Borrower</span>
          <span className="text-right">KYC tier</span>
          <span className="text-right">Activity</span>
          <span className="text-right">Status</span>
        </div>
        {BORROWERS.map((b, i) => {
          const decrypted = canDecryptKyc(b);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="grid min-w-[640px] grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-border-soft/60 px-5 py-3.5 last:border-b-0 hover:bg-mint-bg/30 transition-colors"
            >
              <span
                className="font-mono tabular-nums text-sm font-bold text-ink"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {String(b.id).padStart(3, "0")}
              </span>
              <div className="flex flex-col">
                <span
                  className="text-sm font-bold text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {b.name}
                </span>
                <span
                  className="font-mono text-[10px] text-ink-soft"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {b.wallet.slice(0, 8)}…{b.wallet.slice(-6)}
                </span>
              </div>
              <div className="flex justify-end">
                <CipherBlob
                  size="sm"
                  revealed={decrypted}
                  value={KYC_TIER_LABELS[b.kycTier] || "—"}
                  cipher={`euint8 0x${(b.id * 17).toString(16).padStart(4, "0")}…`}
                />
              </div>
              <span
                className="font-mono tabular-nums text-xs text-ink-soft text-right"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {b.repayments}↑ {b.defaults}↓
              </span>
              <span className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: STATUS_DOT[b.status] }}
                />
                <span className="text-ink-soft">{b.status}</span>
              </span>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        ERC-3643-inspired hook: <code className="rounded bg-mint-bg/60 px-1.5 py-0.5 font-mono text-[11px]">meetsKycTier(id, minTier)</code>{" "}
        returns an <code className="rounded bg-mint-bg/60 px-1.5 py-0.5 font-mono text-[11px]">ebool</code> a downstream
        contract composes against without seeing the raw tier.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-card border-2 border-border-soft bg-card px-4 py-3"
      style={{ borderTopColor: accent, borderTopWidth: 4 }}
    >
      <div
        className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-mono tabular-nums text-2xl font-bold text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}
