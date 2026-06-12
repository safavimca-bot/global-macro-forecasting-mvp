import { riskLabel } from "@/lib/format";

export function RiskBadge({ score }: { score: number }) {
  const label = riskLabel(score);
  const classes =
    score >= 75
      ? "border-signal-red/40 bg-signal-red/10 text-signal-red"
      : score >= 55
        ? "border-signal-amber/40 bg-signal-amber/10 text-signal-amber"
        : score >= 35
          ? "border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan"
          : "border-signal-green/40 bg-signal-green/10 text-signal-green";

  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}
