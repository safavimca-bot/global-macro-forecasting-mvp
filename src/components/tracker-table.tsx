import Link from "next/link";
import { formatNumber } from "@/lib/format";
import type { Country, MacroRegime } from "@/lib/types";
import { RiskBadge } from "./risk-badge";

interface TrackerRow {
  country: Country;
  value?: number;
  score: number;
  regime: MacroRegime["regime"];
}

export function TrackerTable({ rows, unit = "%" }: { rows: TrackerRow[]; unit?: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Latest</th>
            <th className="px-4 py-3 font-medium">Risk score</th>
            <th className="px-4 py-3 font-medium">Regime</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row) => (
            <tr key={row.country.code} className="bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link href={`/country/${row.country.code}`} className="font-medium text-white hover:text-signal-cyan">
                  {row.country.name}
                </Link>
                <p className="text-xs text-slate-500">{row.country.region}</p>
              </td>
              <td className="px-4 py-3 text-slate-200">
                {formatNumber(row.value)}
                {unit}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{row.score}</span>
                  <RiskBadge score={row.score} />
                </div>
              </td>
              <td className="px-4 py-3 text-slate-300">{row.regime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
