"use client";

import { BorrowerData } from "@/lib/types";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 64, h = 20;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
    </svg>
  );
}

export default function StatsDashboard({ borrowers }: { borrowers: BorrowerData[] }) {
  const active = borrowers.filter((b) => b.status === "active").length;
  const avgScore = borrowers.length > 0 ? Math.round(borrowers.reduce((s, b) => s + b.creditScore, 0) / borrowers.length) : 0;
  const loanCount = borrowers.filter((b) => b.hasLoan).length;
  const totalBond = borrowers.reduce((s, b) => s + b.accreditedBond, 0);
  const totalRepayments = borrowers.reduce((s, b) => s + b.repayments, 0);
  const totalDefaults = borrowers.reduce((s, b) => s + b.defaults, 0);

  const cards = [
    { label: "Total Borrowers", value: borrowers.length, sub: `${active} active`, accent: "text-sky-400", sparkColor: "#38bdf8", spark: [5, 6, 6, 7, 8, 8] },
    { label: "Avg Credit Score", value: avgScore, sub: "FHE encrypted", accent: "text-amber-400", sparkColor: "#fbbf24", spark: [40, 45, 50, 55, 60, avgScore] },
    { label: "Active Loans", value: loanCount, sub: `of ${borrowers.length} borrowers`, accent: "text-red-400", sparkColor: "#f87171", spark: [1, 1, 2, 2, 2, loanCount] },
    { label: "Total Bonded", value: `${(totalBond / 1e18).toFixed(1)} ETH`, sub: "Accredited bond", accent: "text-purple-400", sparkColor: "#c084fc", spark: [5, 8, 12, 15, 18, totalBond / 1e18] },
    { label: "Repayments", value: totalRepayments, sub: `w1 weight: x10`, accent: "text-emerald-400", sparkColor: "#34d399", spark: [10, 18, 25, 30, 35, totalRepayments] },
    { label: "Default Rate", value: borrowers.length > 0 ? `${((totalDefaults / (totalRepayments + totalDefaults || 1)) * 100).toFixed(1)}%` : "0%", sub: `${totalDefaults} defaults`, accent: "text-orange-400", sparkColor: "#fb923c", spark: [5, 4, 6, 5, 4, totalDefaults] },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-content-primary">Pool Overview</h3>
        <p className="text-[10px] font-mono text-content-muted">Real-time FHE-encrypted metrics across all 4 contracts</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="flex flex-col justify-between rounded-md border border-border bg-surface-tertiary p-3">
            <div className="mb-2 flex items-start justify-between">
              <Sparkline data={card.spark} color={card.sparkColor} />
            </div>
            <div className={`font-mono text-xl font-semibold ${card.accent}`}>{card.value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-content-muted">{card.label}</div>
            {card.sub && <div className="mt-1.5 text-[9px] font-mono leading-tight text-content-muted">{card.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
