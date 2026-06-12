import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "good" | "watch" | "bad";
  trend?: "up" | "down" | "flat";
}

const toneClass = {
  neutral: "border-white/10 bg-white/[0.04]",
  good: "border-signal-green/30 bg-signal-green/10",
  watch: "border-signal-amber/30 bg-signal-amber/10",
  bad: "border-signal-red/30 bg-signal-red/10"
};

export function MetricCard({ label, value, detail, tone = "neutral", trend = "flat" }: MetricCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <div className={`rounded-md border p-4 shadow-panel ${toneClass[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-300">{label}</p>
        <TrendIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {detail ? <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p> : null}
    </div>
  );
}
