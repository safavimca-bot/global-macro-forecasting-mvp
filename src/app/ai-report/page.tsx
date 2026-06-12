import Link from "next/link";
import { COUNTRIES } from "@/lib/constants";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { RiskBadge } from "@/components/risk-badge";
import { SectionHeading } from "@/components/section-heading";
import { getCountryMacroView } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export default async function AiReportPage({ searchParams }: { searchParams?: { country?: string } }) {
  const selectedCode = searchParams?.country ?? "US";
  const view = await getCountryMacroView(selectedCode, { useOpenAI: true });

  if (!view) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="AI country report"
        title={`${view.country.name} outlook report`}
        copy="Generates a concise country outlook from retrieved indicators, risk scores, and regime classification. If no OpenAI key is configured, a deterministic fallback report is used."
      />

      <div className="flex flex-wrap gap-2">
        {COUNTRIES.map((country) => (
          <Link
            key={country.code}
            href={`/ai-report?country=${country.code}`}
            className={`rounded-md border px-3 py-2 text-sm ${
              country.code === view.country.code ? "border-signal-cyan bg-signal-cyan/10 text-white" : "border-white/10 bg-white/[0.04] text-slate-300"
            }`}
          >
            {country.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Overall risk" value={`${view.scores.overallRisk}/100`} detail="Weighted rule-based score." tone="watch" />
        <MetricCard label="Regime" value={view.regime.regime} detail={view.regime.explanation} />
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4 shadow-panel">
          <p className="text-sm text-slate-300">Report mode</p>
          <div className="mt-3 flex items-center gap-2">
            <RiskBadge score={view.scores.overallRisk} />
            <span className="text-sm text-slate-300">{process.env.OPENAI_API_KEY ? "OpenAI enabled if request succeeds" : "Deterministic fallback"}</span>
          </div>
        </div>
      </div>

      <Panel title="Generated report">
        <div className="whitespace-pre-line text-sm leading-6 text-slate-300">{view.outlook}</div>
      </Panel>

      <Disclaimer />
    </div>
  );
}
