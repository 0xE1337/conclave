"use client";

import { useState } from "react";
import { BorrowerData, getRarity, RARITY_COLORS, KYC_TIER_LABELS, STATUS_COLORS, getCollateralTier } from "@/lib/types";

function LargeStatRow({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-muted/50">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="text-[10px] text-content-muted uppercase tracking-widest">{label}</div>
        <div className="text-lg font-bold text-content-primary font-mono">{value}</div>
      </div>
      {sub && <span className="text-[10px] text-content-muted">{sub}</span>}
    </div>
  );
}

export default function BorrowerDetailCard({ borrower, onClose }: { borrower: BorrowerData; onClose: () => void }) {
  const rarity = getRarity(borrower);
  const colors = RARITY_COLORS[rarity];
  const tierLabel = KYC_TIER_LABELS[borrower.kycTier] || "?";
  const collateral = getCollateralTier(borrower.creditScore);
  const [regulatorAuth, setRegulatorAuth] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`relative w-[420px] max-h-[90vh] overflow-y-auto rounded-3xl border-2 ${colors.border} bg-gradient-to-b ${colors.bg} shadow-2xl ${colors.glow}`}>
        <button onClick={onClose} className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition">&times;</button>

        {/* Header */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black font-mono text-content-primary">Borrower #{String(borrower.id).padStart(3, "0")}</h2>
            <span className={`text-sm font-bold uppercase tracking-widest ${STATUS_COLORS[borrower.status]}`}>{borrower.status}</span>
          </div>
          <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${colors.badge}`}>{rarity.toUpperCase()}</span>
        </div>

        {/* Building avatar */}
        <div className="mx-6 mt-2 mb-4 h-48 rounded-2xl bg-surface-muted/30 border border-white/10 flex items-center justify-center relative">
          <svg viewBox="0 0 120 120" className="w-32 h-32">
            <defs>
              <linearGradient id={`detail-grad-${borrower.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={rarity === "legendary" ? "#f59e0b" : rarity === "rare" ? "#6366f1" : rarity === "uncommon" ? "#10b981" : "#71717a"} />
                <stop offset="100%" stopColor={rarity === "legendary" ? "#b45309" : rarity === "rare" ? "#3b82f6" : rarity === "uncommon" ? "#059669" : "#52525b"} />
              </linearGradient>
            </defs>
            <rect x="25" y="25" width="70" height="80" rx="4" fill={`url(#detail-grad-${borrower.id})`} />
            <rect x="33" y="38" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="50" y="38" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="67" y="38" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="33" y="54" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="50" y="54" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="67" y="54" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="33" y="70" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="67" y="70" width="10" height="10" fill="white" opacity="0.6" />
            <rect x="50" y="85" width="20" height="20" fill="white" opacity="0.4" />
          </svg>
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="text-amber-400">&#9733;</span> KYC: {tierLabel}
          </div>
        </div>

        {/* Wallet */}
        <div className="mx-6 mb-3 px-3 py-2 rounded-lg bg-surface-muted/30 border border-white/10">
          <div className="text-[10px] text-content-muted uppercase tracking-widest mb-1">Wallet Address</div>
          <div className="text-xs font-mono text-content-secondary break-all">{borrower.wallet}</div>
        </div>

        {/* Stats */}
        <div className="mx-6 mb-3 space-y-2">
          <LargeStatRow icon="&#x1F3AF;" label="Credit Score" value={`${borrower.creditScore} / 100`} sub="FHE Encrypted" />
          <LargeStatRow icon="&#x2705;" label="Repayments" value={String(borrower.repayments)} sub={`+${borrower.repayments * 10} pts`} />
          <LargeStatRow icon="&#x26A0;" label="Defaults" value={String(borrower.defaults)} sub={borrower.defaults > 0 ? `-${borrower.defaults * 30} pts` : "clean"} />
          <LargeStatRow icon="&#x1F6E1;" label="Collateral Posts" value={String(borrower.collateralPosts)} sub={`+${borrower.collateralPosts * 5} pts`} />
          <LargeStatRow icon="&#x1F4B0;" label="Accredited Bond" value={`${(borrower.accreditedBond / 1e18).toFixed(4)} ETH`} sub="Encrypted" />
          <LargeStatRow icon="&#x1F5F3;" label="Conclave Votes" value={String(borrower.votesParticipated)} />
        </div>

        {/* Collateral Tier */}
        <div className="mx-6 mb-3 px-3 py-3 rounded-lg border border-white/10 bg-surface-muted/20">
          <div className="text-[10px] text-content-muted uppercase tracking-widest mb-1">Collateral Tier (cascading FHE.select)</div>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold font-mono ${collateral.color}`}>{collateral.label}</span>
            <span className={`text-2xl font-black font-mono ${collateral.color}`}>{collateral.pct}%</span>
          </div>
          <div className="text-[10px] text-content-muted mt-1">
            Borrow 1 ETH requires {(collateral.pct / 100).toFixed(2)} ETH collateral. The actual score never decrypts — only the tier band leaves the encrypted domain.
          </div>
        </div>

        {/* Loan status */}
        <div className="mx-6 mb-3 px-3 py-3 rounded-lg border border-white/10" style={{ background: borrower.hasLoan ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)" }}>
          <div className="text-[10px] text-content-muted uppercase tracking-widest mb-1">Lending Status</div>
          {borrower.hasLoan ? (
            <div>
              <div className="text-sm font-bold text-red-400">Active Loan</div>
              <div className="text-xs text-content-muted mt-1">
                Borrowed: {(borrower.loanAmount / 1e18).toFixed(4)} ETH &middot; Collateral: {(borrower.loanCollateral / 1e18).toFixed(4)} ETH ({borrower.collateralPct}%)
              </div>
            </div>
          ) : (
            <div className="text-sm font-bold text-emerald-400">No Active Loan</div>
          )}
        </div>

        {/* Regulator handoff (selective disclosure demo) */}
        <div className="mx-6 mb-4 px-3 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <div className="text-[10px] text-amber-400 uppercase tracking-widest mb-1">Regulator Handoff (FHE.allow selective disclosure)</div>
          {regulatorAuth ? (
            <div>
              <div className="text-sm font-bold text-amber-300">&#x2713; Regulator Authorized</div>
              <div className="text-[10px] text-content-muted mt-1 font-mono break-all">
                FHE.allow(score, regulator) — only the configured regulator address can decrypt; protocol, LPs, and other counterparties still see ciphertext.
              </div>
            </div>
          ) : (
            <button
              onClick={() => setRegulatorAuth(true)}
              className="w-full text-xs font-mono text-amber-300 px-3 py-2 rounded border border-amber-500/40 hover:bg-amber-500/10 transition"
            >
              Authorize regulator decryption →
            </button>
          )}
        </div>

        <div className="mx-6 mb-5 text-center text-[10px] text-content-muted flex items-center justify-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "pulse-glow 2s infinite" }} />
          All attributes encrypted via Zama fhEVM 0.11.1
        </div>
      </div>
    </div>
  );
}
