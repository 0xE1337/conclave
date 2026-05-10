"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { CipherBlob } from "@/components/CipherBlob";
import { TierBand } from "@/components/TierBand";
import { DecryptionReveal } from "@/components/DecryptionReveal";
import {
  BORROWERS,
  SEPOLIA_ADDRESSES,
  ETHERSCAN_BASE,
} from "@/lib/demo-data";
import { type PersonaId } from "@/lib/personas";

export function ScoreApp({
  persona,
  onBack,
  setRegulatorAuthorizedFor,
}: {
  persona: PersonaId;
  onBack: () => void;
  setRegulatorAuthorizedFor: (id: number, auth: boolean) => void;
}) {
  const [selectedId, setSelectedId] = useState(1);
  const [tierResolved, setTierResolved] = useState<number | null>(null);

  const b = BORROWERS.find((x) => x.id === selectedId)!;

  // Persona-conditional reveal:
  const isOwn = persona === "borrower" && b.id === 1;
  const canReveal = isOwn || (persona === "regulator" && b.regulatorAuthorized);

  const resolveTier = () => {
    setTierResolved(null);
    setTimeout(() => setTierResolved(b.tierIdx), 50);
  };

  return (
    <div>
      <AppHeader
        icon="🌱"
        title="Credit Score Engine"
        subtitle="Score is mutable encrypted state · atomic update on repay/default"
        accent="var(--color-app-mint)"
        contractAddress={{
          label: `${SEPOLIA_ADDRESSES.credit.slice(0, 6)}…${SEPOLIA_ADDRESSES.credit.slice(-4)}`,
          href: `${ETHERSCAN_BASE}/address/${SEPOLIA_ADDRESSES.credit}`,
        }}
        onBack={onBack}
      />

      {/* Borrower picker */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Subject:
        </span>
        {BORROWERS.slice(0, 6).map((x) => (
          <button
            key={x.id}
            onClick={() => {
              setSelectedId(x.id);
              setTierResolved(null);
            }}
            className={`rounded-pill border-2 px-3 py-1 text-xs font-bold transition-all ${
              selectedId === x.id
                ? "border-mint bg-mint-bg text-mint-active"
                : "border-border-soft bg-card text-ink-soft hover:border-mint/50"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            #{String(x.id).padStart(3, "0")}
          </button>
        ))}
      </div>

      {/* Subject card */}
      <div className="card mb-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Borrower #{String(b.id).padStart(3, "0")}
            </div>
            <div
              className="mt-0.5 text-lg font-bold text-ink"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
            >
              {b.name}
            </div>
          </div>
          <CipherBlob
            label="Credit Score"
            size="md"
            revealed={canReveal}
            value={String(b.score)}
            cipher={`euint32 0x${(b.score * 7919).toString(16).padStart(8, "0")}…`}
          />
        </div>

        {/* Formula breakdown */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          <FormulaCell label="Repay" value={b.repayments} weight={10} accent="var(--color-app-mint)" />
          <FormulaCell label="Default" value={b.defaults} weight={-30} accent="var(--color-app-coral)" />
          <FormulaCell label="Collateral" value={b.collateralPosts} weight={5} accent="var(--color-app-yellow)" />
          <FormulaCell label="Volume" value="?" weight={1} accent="var(--color-app-sky)" sealed />
        </div>

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-soft">
          score = w₁·repay − w₂·default + w₃·collateral + w₄·volume, all on euint32
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={resolveTier} className="btn-pill">
            Resolve tier on ciphertext
          </button>
          <span
            className="text-xs text-ink-soft"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            cascading <code className="rounded bg-mint-bg/60 px-1.5 py-0.5 font-mono text-[11px]">FHE.select</code> →
            only the band leaves the encrypted domain
          </span>
        </div>
      </div>

      {/* Tier band */}
      <div className="card mb-5 p-6">
        <div className="mb-4 text-center">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Collateral tier (cascading FHE.select)
          </span>
        </div>
        <TierBand activeIdx={tierResolved} />
      </div>

      {/* Decryption reveal — the cinematic shot */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3
              className="text-lg font-bold text-ink"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
            >
              Selective regulator disclosure
            </h3>
            <p className="text-xs text-ink-soft">
              The borrower opts in to grant exactly one regulator address decrypt
              access. Everyone else still sees ciphertext.
            </p>
          </div>
          <button
            disabled={b.regulatorAuthorized}
            onClick={() => setRegulatorAuthorizedFor(b.id, true)}
            className="btn-pill"
            style={{
              background: b.regulatorAuthorized ? "var(--color-success)" : undefined,
            }}
          >
            {b.regulatorAuthorized ? "✓ Regulator authorized" : "Authorize regulator →"}
          </button>
        </div>

        <DecryptionReveal
          authorized={b.regulatorAuthorized}
          value={String(b.score)}
          cipher={`0x${(b.score * 7919).toString(16).padStart(10, "0")}…`}
        />

        <div
          className="mt-4 rounded-card border border-dashed border-border-soft bg-mint-bg/25 px-4 py-2.5 font-mono text-[11px] leading-relaxed text-ink-body"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="text-ink-soft">solidity:</span>{" "}
          <span className="text-mint-active">FHE.allow</span>(
          <span className="text-ink">_credits[id].score</span>,{" "}
          <span className="text-ink">regulator</span>);
        </div>
      </div>
    </div>
  );
}

function FormulaCell({
  label,
  value,
  weight,
  accent,
  sealed,
}: {
  label: string;
  value: number | string;
  weight: number;
  accent: string;
  sealed?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-card border-2 border-border-soft bg-card px-3 py-2.5"
      style={{ borderLeftColor: accent, borderLeftWidth: 4 }}
    >
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        {sealed ? (
          <span className="text-base">🍃</span>
        ) : (
          <span
            className="font-mono tabular-nums text-xl font-bold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {value}
          </span>
        )}
        <span
          className="font-mono text-[10px] font-semibold text-ink-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ×{weight > 0 ? `+${weight}` : weight}
        </span>
      </div>
    </div>
  );
}
