import Link from "next/link";
import type { CountryMacroView } from "@/lib/types";
import { RiskBadge } from "./risk-badge";

function heatClass(score: number) {
  if (score >= 75) {
    return "bg-signal-red/25 border-signal-red/40";
  }

  if (score >= 55) {
    return "bg-signal-amber/25 border-signal-amber/40";
  }

  if (score >= 35) {
    return "bg-signal-cyan/20 border-signal-cyan/30";
  }

  return "bg-signal-green/15 border-signal-green/30";
}

export function CountryRiskHeatmap({ views }: { views: CountryMacroView[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {views.map((view) => (
        <Link
          key={view.country.code}
          href={`/country/${view.country.code}`}
          className={`rounded-md border p-3 transition hover:-translate-y-0.5 hover:border-white/30 ${heatClass(view.scores.overallRisk)}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">{view.country.name}</span>
            <RiskBadge score={view.scores.overallRisk} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">{view.scores.overallRisk}</p>
          <p className="mt-1 text-xs text-slate-300">{view.regime.regime}</p>
        </Link>
      ))}
    </div>
  );
}
