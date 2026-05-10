"use client";

import { useState } from "react";
import BorrowerCard from "@/components/BorrowerCard";
import BorrowerDetailCard from "@/components/BorrowerDetailCard";
import StatsDashboard from "@/components/StatsDashboard";
import CreditHeatmap from "@/components/CreditHeatmap";
import CollateralTiers from "@/components/CollateralTiers";
import { DEMO_BORROWERS } from "@/lib/demo-borrowers";
import { BorrowerData, getRarity } from "@/lib/types";
import { ADDRESSES, ETHERSCAN } from "@/lib/contracts";
import { useTheme } from "./theme";

type ViewTab = "borrowers" | "credit" | "pool" | "conclave";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="px-2 py-1 rounded border border-border text-[11px] font-mono text-content-muted hover:text-content-primary transition">
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

function ConclaveTab() {
  const [proposals] = useState([
    { assetId: 1001, name: "Apollo Senior Direct Lending Fund VII", approves: 4, rejects: 1, status: "finalized", encrypted: false },
    { assetId: 1002, name: "Goldman Sachs Tokenized Money Market", approves: 0, rejects: 0, status: "voting", encrypted: true },
    { assetId: 1003, name: "Centrifuge Real Estate Pool — Q3 2026", approves: 2, rejects: 2, status: "voting", encrypted: true },
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface-secondary p-4">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-content-primary">Underwriting Conclave</h3>
          <p className="text-[10px] font-mono text-content-muted">
            Anti-bribery encrypted voting on RWA listing proposals. Homomorphic tally — voters cannot prove how they voted to a briber.
          </p>
        </div>

        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.assetId} className="rounded-lg border border-border bg-surface-tertiary p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-content-primary">{p.name}</div>
                  <div className="text-[10px] text-content-muted font-mono">Asset ID: #{p.assetId}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  p.status === "voting" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {p.status === "voting" ? "Sealing votes" : "Finalized"}
                </span>
              </div>

              {p.encrypted ? (
                <div className="mt-3 rounded-md bg-black/40 p-3 font-mono text-[10px] text-emerald-300/60 break-all">
                  approves = euint32 0x9af2c81a3b...   rejects = euint32 0xc14d7e2f08...
                  <div className="mt-1 text-content-muted">↑ ciphertext — only the deadline reveal can produce a plaintext tally</div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] text-content-muted mb-1">Approves: {p.approves}</div>
                    <div className="h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${(p.approves / (p.approves + p.rejects || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-content-muted mb-1">Rejects: {p.rejects}</div>
                    <div className="h-2 rounded-full bg-red-500/20 overflow-hidden">
                      <div className="h-full bg-red-400" style={{ width: `${(p.rejects / (p.approves + p.rejects || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${p.approves > p.rejects ? "text-emerald-400" : "text-red-400"}`}>
                    {p.approves > p.rejects ? "ADMITTED" : "REJECTED"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-secondary p-4">
        <h3 className="text-xs font-semibold text-content-primary mb-2">Why this is anti-bribery</h3>
        <div className="text-[11px] text-content-secondary leading-relaxed space-y-2">
          <div>• <span className="text-amber-400">sealVote(assetId, encVote, proof)</span> consumes the voter&apos;s randomness via homomorphic addition — even the voter cannot prove their own vote afterwards</div>
          <div>• <span className="text-amber-400">finalize(assetId)</span> only reveals aggregates — never per-voter breakdowns</div>
          <div>• Stronger than commit-reveal voting (which leaks at the reveal step) and requires no trusted coordinator (unlike MACI)</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<BorrowerData | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("borrowers");
  const [filter, setFilter] = useState<"all" | "active" | "legendary">("all");

  const borrowers = DEMO_BORROWERS.filter((b) => {
    if (filter === "active") return b.status === "active";
    if (filter === "legendary") return getRarity(b) === "legendary";
    return true;
  });

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-primary text-content-primary">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            Conclave
          </h1>
          <p className="font-mono text-[10px] text-content-muted">
            Confidential private credit · 4 contracts on Sepolia · fhEVM 0.11.1 · anti-bribery underwriting
          </p>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex rounded-md border border-border bg-surface-muted p-0.5">
            {(["borrowers", "credit", "pool", "conclave"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-1 text-[11px] font-mono transition-colors ${
                  activeTab === tab
                    ? "bg-surface-secondary text-content-primary shadow-sm"
                    : "text-content-muted hover:text-content-secondary"
                }`}
              >
                {tab === "borrowers" ? "Borrowers"
                  : tab === "credit" ? "Credit Engine"
                  : tab === "pool" ? "Credit Pool"
                  : "Listing Conclave"}
              </button>
            ))}
          </nav>

          <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">Sepolia · Live</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Tab content */}
      {activeTab === "borrowers" && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-4">
            <StatsDashboard borrowers={DEMO_BORROWERS} />
          </div>

          <div className="px-6 mt-4 flex gap-2">
            {(["all", "active", "legendary"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                  filter === f
                    ? "bg-content-primary text-surface-primary"
                    : "bg-surface-secondary text-content-muted border border-border hover:bg-surface-tertiary"
                }`}
              >
                {f === "all" ? "All Borrowers" : f === "active" ? "Active Only" : "Tier 1 Elite"}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-content-muted self-center font-mono">{borrowers.length} borrowers</span>
          </div>

          <main className="px-6 py-6">
            <div className="flex flex-wrap gap-5 justify-center">
              {borrowers.map((b) => (
                <BorrowerCard key={b.id} borrower={b} onClick={() => setSelected(b)} />
              ))}
            </div>
            {borrowers.length === 0 && (
              <div className="text-center text-content-muted py-20 text-sm">No borrowers match this filter.</div>
            )}
          </main>
        </div>
      )}

      {activeTab === "credit" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <StatsDashboard borrowers={DEMO_BORROWERS} />
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 min-w-0">
              <CreditHeatmap borrowers={DEMO_BORROWERS} />
            </div>
            <div className="lg:w-80 flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary p-4">
              <h3 className="text-xs font-semibold text-content-primary">Score formula (FHE)</h3>
              <div className="font-mono text-[11px] text-content-secondary leading-relaxed space-y-2">
                <div className="p-2 rounded bg-surface-tertiary border border-border">
                  <span className="text-amber-400">score</span> = w1·<span className="text-blue-400">repay</span> − w2·<span className="text-red-400">default</span> + w3·<span className="text-emerald-400">collateral</span> + w4·<span className="text-purple-400">volume</span>
                </div>
                <div className="space-y-1">
                  <div>w1 = <span className="text-accent">10</span> (repayment weight)</div>
                  <div>w2 = <span className="text-accent">30</span> (default penalty)</div>
                  <div>w3 = <span className="text-accent">5</span> (collateral signal)</div>
                  <div>w4 = <span className="text-accent">1</span> (volume tier)</div>
                </div>
                <div className="text-[10px] text-content-muted pt-2 border-t border-border">
                  All ops on euint32. Underflow clamped via FHE.select. Score is mutable on-chain state — repayments and defaults atomically update score in the same tx as the loan event.
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-amber-400">
                    {Math.round(DEMO_BORROWERS.reduce((s, b) => s + b.creditScore, 0) / DEMO_BORROWERS.length)}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-content-muted">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl font-semibold text-emerald-400">
                    {DEMO_BORROWERS.filter((b) => b.creditScore >= 50).length}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-content-muted">Above Tier 2</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pool" && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <CollateralTiers borrowers={DEMO_BORROWERS} />
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <h3 className="text-xs font-semibold text-content-primary mb-3">Active Loans</h3>
            <div className="space-y-2">
              {DEMO_BORROWERS.filter((b) => b.hasLoan).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-tertiary border border-border">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-content-primary">Borrower #{b.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.collateralPct <= 50 ? "bg-amber-500/20 text-amber-400" : b.collateralPct <= 75 ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {b.collateralPct}% tier
                    </span>
                  </div>
                  <div className="text-right text-[11px] font-mono">
                    <div className="text-content-primary">{(b.loanAmount / 1e18).toFixed(2)} ETH borrowed</div>
                    <div className="text-content-muted">{(b.loanCollateral / 1e18).toFixed(2)} ETH collateral</div>
                  </div>
                </div>
              ))}
              {DEMO_BORROWERS.filter((b) => b.hasLoan).length === 0 && (
                <div className="text-center text-content-muted py-8 text-sm">No active loans</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "conclave" && (
        <div className="flex-1 overflow-y-auto p-6">
          <ConclaveTab />
        </div>
      )}

      {/* Footer with contract addresses */}
      <footer className="border-t border-border px-6 py-2 flex items-center justify-between text-[9px] font-mono text-content-muted">
        <div className="flex items-center gap-3">
          <a href={ETHERSCAN.registry} target="_blank" rel="noopener noreferrer" className="hover:text-content-secondary">BorrowerRegistry: {ADDRESSES.registry.slice(0, 6)}…{ADDRESSES.registry.slice(-4)}</a>
          <span>·</span>
          <a href={ETHERSCAN.credit} target="_blank" rel="noopener noreferrer" className="hover:text-content-secondary">CreditScoreEngine: {ADDRESSES.credit.slice(0, 6)}…{ADDRESSES.credit.slice(-4)}</a>
          <span>·</span>
          <a href={ETHERSCAN.pool} target="_blank" rel="noopener noreferrer" className="hover:text-content-secondary">PrivateCreditPool: {ADDRESSES.pool.slice(0, 6)}…{ADDRESSES.pool.slice(-4)}</a>
          <span>·</span>
          <a href={ETHERSCAN.conclave} target="_blank" rel="noopener noreferrer" className="hover:text-content-secondary">ListingConclave: {ADDRESSES.conclave.slice(0, 6)}…{ADDRESSES.conclave.slice(-4)}</a>
        </div>
        <a href="https://github.com/0xE1337/conclave" target="_blank" rel="noopener noreferrer" className="hover:text-content-secondary">GitHub →</a>
      </footer>

      {selected && <BorrowerDetailCard borrower={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
