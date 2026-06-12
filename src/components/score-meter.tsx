import { riskLabel } from "@/lib/format";

export function ScoreMeter({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "bg-signal-red" : score >= 55 ? "bg-signal-amber" : score >= 35 ? "bg-signal-cyan" : "bg-signal-green";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-white">
          {score}/100 - {riskLabel(score)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(5, Math.min(score, 100))}%` }} />
      </div>
    </div>
  );
}
