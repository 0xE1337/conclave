"use client";

import { useState } from "react";
import { BorrowerData, getCollateralTier, STATUS_COLORS } from "@/lib/types";

function scoreColor(score: number): string {
  if (score >= 80) return "bg-amber-500";
  if (score >= 60) return "bg-emerald-500";
  if (score >= 40) return "bg-emerald-700";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
}

export default function CreditHeatmap({ borrowers }: { borrowers: BorrowerData[] }) {
  const [hovered, setHovered] = useState<BorrowerData | null>(null);

  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-content-primary">Credit Score Heatmap</h3>
        <p className="text-[10px] font-mono text-content-muted">Encrypted scores — only the borrower owner can decrypt the real value</p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-8">
        {borrowers.map((b) => {
          return (
            <div
              key={b.id}
              className={`relative aspect-square rounded-lg ${scoreColor(b.creditScore)} cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-white/30 flex flex-col items-center justify-center`}
              onMouseEnter={() => setHovered(b)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-white font-mono font-bold text-sm">#{b.id}</span>
              <span className="text-white/70 text-[9px] font-mono">{b.creditScore}</span>
              <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${b.status === "active" ? "bg-emerald-300" : b.status === "paused" ? "bg-amber-300" : "bg-zinc-400"}`} />
            </div>
          );
        })}
      </div>

      {hovered && (
        <div className="mt-3 rounded-lg border border-border bg-surface-tertiary p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-bold text-content-primary">Borrower #{hovered.id}</span>
            <span className={`text-[10px] font-bold uppercase ${STATUS_COLORS[hovered.status]}`}>{hovered.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-content-muted">Score:</span> <span className="font-mono font-bold text-amber-400">{hovered.creditScore}</span></div>
            <div><span className="text-content-muted">Tier:</span> <span className={`font-mono font-bold ${getCollateralTier(hovered.creditScore).color}`}>{getCollateralTier(hovered.creditScore).label}</span></div>
            <div><span className="text-content-muted">Repayments:</span> <span className="font-mono">{hovered.repayments}</span></div>
            <div><span className="text-content-muted">Defaults:</span> <span className="font-mono">{hovered.defaults}</span></div>
            <div><span className="text-content-muted">Collateral:</span> <span className="font-mono">{getCollateralTier(hovered.creditScore).pct}%</span></div>
            <div><span className="text-content-muted">Conclave votes:</span> <span className="font-mono">{hovered.votesParticipated}</span></div>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-[10px] text-content-muted flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> Elite (80+)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Good (60-79)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-700" /> Standard (40-59)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> Low (20-39)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> High Risk (&lt;20)</span>
      </div>
    </div>
  );
}
