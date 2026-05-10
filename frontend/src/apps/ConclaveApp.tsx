"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { VoteUrn } from "@/components/VoteUrn";
import {
  PROPOSALS as INITIAL_PROPOSALS,
  SEPOLIA_ADDRESSES,
  ETHERSCAN_BASE,
  type ListingProposal,
} from "@/lib/demo-data";
import { type PersonaId } from "@/lib/personas";

export function ConclaveApp({
  persona,
  onBack,
}: {
  persona: PersonaId;
  onBack: () => void;
}) {
  const [proposals, setProposals] = useState<ListingProposal[]>(INITIAL_PROPOSALS);
  const [voting, setVoting] = useState<number | null>(null);

  const isUnderwriter = persona === "underwriter";

  const castVote = (assetId: number, approve: boolean) => {
    setProposals((p) =>
      p.map((x) =>
        x.assetId === assetId
          ? { ...x, voterCount: x.voterCount + 1, hasVoted: true }
          : x
      )
    );
    setVoting(null);
  };

  return (
    <div>
      <AppHeader
        icon="🗳️"
        title="Listing Conclave"
        subtitle="Anti-bribery encrypted underwriting · homomorphic tally"
        accent="var(--color-app-sage)"
        contractAddress={{
          label: `${SEPOLIA_ADDRESSES.conclave.slice(0, 6)}…${SEPOLIA_ADDRESSES.conclave.slice(-4)}`,
          href: `${ETHERSCAN_BASE}/address/${SEPOLIA_ADDRESSES.conclave}`,
        }}
        onBack={onBack}
      />

      {/* Persona-conditional header note */}
      {isUnderwriter ? (
        <div className="mb-5 rounded-card border-2 border-underwriter/40 bg-[oklch(96%_0.05_135)] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌳</span>
            <div>
              <div
                className="text-sm font-bold text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                You are seated at the conclave
              </div>
              <div className="text-xs text-ink-soft">
                Cast votes on open proposals · your vote is sealed forever
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-card border border-dashed border-border-soft bg-cream/40 px-5 py-3 text-xs text-ink-soft">
          Switch to <strong className="font-semibold text-ink">🌳 Underwriter</strong>{" "}
          to cast votes. Other personas can observe sealed tallies but not vote.
        </div>
      )}

      {/* Proposals */}
      <div className="flex flex-col gap-4">
        {proposals.map((p, i) => (
          <motion.div
            key={p.assetId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="card p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Asset #{p.assetId}
                  </span>
                  <ProposalStatus status={p.status} />
                </div>
                <h3
                  className="mt-0.5 text-lg font-bold leading-tight text-ink"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
                >
                  {p.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {p.description}
                </p>
              </div>
            </div>

            <VoteUrn
              state={p.status === "voting" ? "voting" : "finalized"}
              approves={p.approves}
              rejects={p.rejects}
              voterCount={p.voterCount}
            />

            {/* Cast vote section */}
            {p.status === "voting" && isUnderwriter && !p.hasVoted && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {voting === p.assetId ? (
                  <>
                    <button
                      onClick={() => castVote(p.assetId, true)}
                      className="btn-pill"
                      style={{ background: "var(--color-success)" }}
                    >
                      ✓ Approve (sealed)
                    </button>
                    <button
                      onClick={() => castVote(p.assetId, false)}
                      className="btn-pill"
                      style={{ background: "var(--color-error)" }}
                    >
                      ✗ Reject (sealed)
                    </button>
                    <button
                      onClick={() => setVoting(null)}
                      className="btn-pill btn-pill-ghost"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setVoting(p.assetId)} className="btn-pill">
                    Cast my vote →
                  </button>
                )}
              </div>
            )}
            {p.status === "voting" && isUnderwriter && p.hasVoted && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-pill border-2 border-mint-bg bg-mint-bg/40 px-3 py-1.5 text-xs font-bold text-mint-active">
                ✓ Your vote is sealed
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Why anti-bribery */}
      <div className="mt-6 rounded-card border-2 border-dashed border-border-soft bg-mint-bg/25 px-5 py-4">
        <h4
          className="mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-mint-active"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Why this is bribery-resistant
        </h4>
        <ul className="flex flex-col gap-1 text-xs leading-relaxed text-ink-soft">
          <li>
            <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px]">
              sealVote(assetId, encVote, proof)
            </code>{" "}
            consumes the voter&apos;s randomness via homomorphic addition — voters cannot
            prove their vote afterwards
          </li>
          <li>
            <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px]">
              finalize(assetId)
            </code>{" "}
            reveals only aggregates · never per-voter breakdowns
          </li>
          <li>
            Stronger than commit-reveal voting (which leaks at the reveal step) · no
            trusted coordinator (unlike MACI)
          </li>
        </ul>
      </div>
    </div>
  );
}

function ProposalStatus({ status }: { status: ListingProposal["status"] }) {
  const styles: Record<typeof status, { label: string; bg: string; color: string }> = {
    voting:    { label: "sealing votes", bg: "var(--color-app-yellow)", color: "var(--color-ink)" },
    finalized: { label: "finalized",     bg: "var(--color-app-sage)",   color: "white" },
    admitted:  { label: "admitted ✓",    bg: "var(--color-success)",     color: "white" },
    rejected:  { label: "rejected ✗",    bg: "var(--color-error)",       color: "white" },
  };
  const s = styles[status];
  return (
    <span
      className="rounded-pill px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, fontFamily: "var(--font-display)" }}
    >
      {s.label}
    </span>
  );
}
