import { notFound } from "next/navigation";
import { AreaForecastChart, LineSeriesChart, RiskRadarChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { RiskBadge } from "@/components/risk-badge";
import { ScoreMeter } from "@/components/score-meter";
import { SectionHeading } from "@/components/section-heading";
import { generateForecast } from "@/lib/forecast";
import { formatNumber, formatPercent, latestValue, riskEntries, seriesFor } from "@/lib/format";
import { chartDataFromScores, getCountryMacroView, getIndicatorSeries } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export default async function CountryProfilePage({ params }: { params: { countryCode: string } }) {
  const view = await getCountryMacroView(params.countryCode, { useOpenAI: true });

  if (!view) {
    notFound();
  }

  const gdpSeries = getIndicatorSeries(view.observations, "GDP_GROWTH");
  const cpiSeries = getIndicatorSeries(view.observations, "CPI");
  const unemploymentSeries = getIndicatorSeries(view.observations, "UNEMPLOYMENT");
  const policySeries = getIndicatorSeries(view.observations, "POLICY_RATE");
  const debtSeries = getIndicatorSeries(view.observations, "DEBT_GDP");
  const currentAccountSeries = getIndicatorSeries(view.observations, "CURRENT_ACCOUNT");
  const forecast = generateForecast(seriesFor(view.observations, "CPI"), "movingAverage", 6);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Country profile"
        title={view.country.name}
        copy={`${view.country.region} - ${view.country.currency} - ${view.country.centralBank}. Data mode: demo cache, not live.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="GDP growth" value={formatPercent(latestValue(view.observations, "GDP_GROWTH"))} detail="Real output momentum." />
        <MetricCard label="Inflation" value={formatPercent(latestValue(view.observations, "CPI"))} detail={`Target: ${formatPercent(view.country.inflationTarget)}`} tone="watch" />
        <MetricCard label="Unemployment" value={formatPercent(latestValue(view.observations, "UNEMPLOYMENT"))} detail="Labor-market slack." />
        <MetricCard label="Policy rate" value={formatPercent(latestValue(view.observations, "POLICY_RATE"))} detail="Short-rate stance proxy." tone="watch" />
        <MetricCard label="10-year yield" value={formatPercent(latestValue(view.observations, "YIELD_10Y"))} detail="Long-rate market signal." />
        <MetricCard label="Debt-to-GDP" value={formatPercent(latestValue(view.observations, "DEBT_GDP"))} detail="Fiscal sustainability anchor." tone="watch" />
        <MetricCard label="Fiscal balance" value={formatPercent(latestValue(view.observations, "FISCAL_BALANCE"))} detail="Government balance share of GDP." />
        <MetricCard label="Current account" value={formatPercent(latestValue(view.observations, "CURRENT_ACCOUNT"))} detail="External funding balance." />
      </div>

      <Panel
        title="Regime classification"
        action={
          <div className="flex items-center gap-2">
            <RiskBadge score={view.scores.overallRisk} />
            <span className="text-sm font-semibold text-white">{view.scores.overallRisk}/100</span>
          </div>
        }
      >
        <p className="text-lg font-semibold text-white">{view.regime.regime}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{view.regime.explanation}</p>
        <p className="mt-2 text-xs text-slate-500">Confidence: {formatNumber(view.regime.confidence * 100, 0)}%</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="GDP growth">
          <LineSeriesChart data={gdpSeries} color="#22c55e" />
        </Panel>
        <Panel title="Inflation">
          <LineSeriesChart data={cpiSeries} color="#f59e0b" />
        </Panel>
        <Panel title="Unemployment">
          <LineSeriesChart data={unemploymentSeries} color="#38bdf8" />
        </Panel>
        <Panel title="Policy rate">
          <LineSeriesChart data={policySeries} color="#22d3ee" />
        </Panel>
        <Panel title="Debt-to-GDP">
          <LineSeriesChart data={debtSeries} color="#ef4444" />
        </Panel>
        <Panel title="Current account">
          <LineSeriesChart data={currentAccountSeries} color="#a78bfa" />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Panel title="Risk radar">
          <RiskRadarChart data={chartDataFromScores(view)} />
        </Panel>
        <Panel title="Risk score detail">
          <div className="space-y-4">
            {riskEntries(view.scores).map(([label, score]) => (
              <ScoreMeter key={label} label={label} score={score} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Experimental CPI forecast">
        <AreaForecastChart data={forecast} />
        <p className="mt-3 text-xs text-slate-400">Simple moving-average forecast with widening confidence bands. Demo data, not live.</p>
      </Panel>

      <Panel title="AI-generated country outlook">
        <div className="whitespace-pre-line text-sm leading-6 text-slate-300">{view.outlook}</div>
      </Panel>

      <Disclaimer />
    </div>
  );
}
