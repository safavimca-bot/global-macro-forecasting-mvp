import Link from "next/link";
import type { CountryMacroView } from "@/lib/types";
import { RiskBadge } from "./risk-badge";

export function RankedCountryList({ views, scoreKey }: { views: CountryMacroView[]; scoreKey: keyof CountryMacroView["scores"] }) {
  return (
    <div className="space-y-3">
      {views.map((view) => {
        const score = Number(view.scores[scoreKey]);

        return (
          <Link key={view.country.code} href={`/country/${view.country.code}`} className="flex items-center justify-between gap-4 rounded-md bg-white/[0.04] p-3">
            <div>
              <p className="font-medium text-white">{view.country.name}</p>
              <p className="text-xs text-slate-400">{view.regime.regime}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-white">{score}</p>
              <RiskBadge score={score} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
