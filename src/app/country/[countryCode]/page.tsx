import { notFound } from "next/navigation";
import { AreaForecastChart, LineSeriesChart, RiskRadarChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { RiskBadge } from "@/components/risk-badge";
import { ScoreMeter } from "@/components/score-meter";
import { SectionHeading } from "@/components/section-heading";
import { ExportMenu, ExportNotice } from "@/components/export-menu";
import { generateForecast } from "@/lib/forecast";
import { formatNumber, formatPercent, latestValue, riskEntries, seriesFor } from "@/lib/format";
import { chartDataFromScores, getCountryMacroView, getIndicatorSeries } from "@/lib/data/service";
import { countryProfileExportRows, forecastExportRows, observationExportRows } from "@/lib/export/page-data";

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
  const profileRows = countryProfileExportRows(view);
  const countrySlug = view.country.code.toLowerCase();
  const chartIds = {
    gdp: `country-profile-${countrySlug}-gdp-chart`,
    cpi: `country-profile-${countrySlug}-inflation-chart`,
    unemployment: `country-profile-${countrySlug}-unemployment-chart`,
    policy: `country-profile-${countrySlug}-policy-rate-chart`,
    debt: `country-profile-${countrySlug}-debt-chart`,
    currentAccount: `country-profile-${countrySlug}-current-account-chart`,
    radar: `country-profile-${countrySlug}-risk-radar-chart`,
    forecast: `country-profile-${countrySlug}-forecast-chart`
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Country profile"
        title={view.country.name}
        copy={`${view.country.region} - ${view.country.currency} - ${view.country.centralBank}. Data mode: demo cache, not live.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label={`${view.country.name} profile`}
          data={profileRows}
          filenameBase={`country-profile-${view.country.code}`}
          metadata={{
            title: `${view.country.name} macro profile export`,
            module: "Country Profile",
            country: `${view.country.name} (${view.country.code})`,
            indicatorNames: ["Macro observations", "Risk scores", "Regime classification"],
            units: ["mixed"],
            sourceNames: ["Demo cache", "Global Macro Outlook AI scoring engine"],
            dataStatus: view.dataMode
          }}
        />
      </div>

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
        <Panel
          title="GDP growth"
          action={
            <ExportMenu
              label="GDP growth chart"
              data={observationExportRows(view.observations, ["GDP_GROWTH"])}
              filenameBase={`country-profile-${view.country.code}-gdp-growth`}
              chartTargetId={chartIds.gdp}
              metadata={{ title: "GDP growth", module: "Country Profile", country: view.country.code, indicatorNames: ["Real GDP growth"], units: ["% y/y"], dataStatus: view.dataMode }}
            />
          }
        >
          <div id={chartIds.gdp}>
            <LineSeriesChart data={gdpSeries} color="#22c55e" />
          </div>
        </Panel>
        <Panel
          title="Inflation"
          action={
            <ExportMenu
              label="Inflation chart"
              data={observationExportRows(view.observations, ["CPI"])}
              filenameBase={`country-profile-${view.country.code}-inflation`}
              chartTargetId={chartIds.cpi}
              metadata={{ title: "Inflation", module: "Country Profile", country: view.country.code, indicatorNames: ["Headline CPI inflation"], units: ["% y/y"], dataStatus: view.dataMode }}
            />
          }
        >
          <div id={chartIds.cpi}>
            <LineSeriesChart data={cpiSeries} color="#f59e0b" />
          </div>
        </Panel>
        <Panel
          title="Unemployment"
          action={
            <ExportMenu
              label="Unemployment chart"
              data={observationExportRows(view.observations, ["UNEMPLOYMENT"])}
              filenameBase={`country-profile-${view.country.code}-unemployment`}
              chartTargetId={chartIds.unemployment}
              metadata={{ title: "Unemployment", module: "Country Profile", country: view.country.code, indicatorNames: ["Unemployment rate"], units: ["%"], dataStatus: view.dataMode }}
            />
          }
        >
          <div id={chartIds.unemployment}>
            <LineSeriesChart data={unemploymentSeries} color="#38bdf8" />
          </div>
        </Panel>
        <Panel
          title="Policy rate"
          action={
            <ExportMenu
              label="Policy-rate chart"
              data={observationExportRows(view.observations, ["POLICY_RATE"])}
              filenameBase={`country-profile-${view.country.code}-policy-rate`}
              chartTargetId={chartIds.policy}
              metadata={{ title: "Policy rate", module: "Country Profile", country: view.country.code, indicatorNames: ["Policy rate"], units: ["%"], dataStatus: view.dataMode }}
            />
          }
        >
          <div id={chartIds.policy}>
            <LineSeriesChart data={policySeries} color="#22d3ee" />
          </div>
        </Panel>
        <Panel
          title="Debt-to-GDP"
          action={
            <ExportMenu
              label="Debt chart"
              data={observationExportRows(view.observations, ["DEBT_GDP"])}
              filenameBase={`country-profile-${view.country.code}-debt-to-gdp`}
              chartTargetId={chartIds.debt}
              metadata={{ title: "Debt-to-GDP", module: "Country Profile", country: view.country.code, indicatorNames: ["Government debt-to-GDP"], units: ["% of GDP"], dataStatus: view.dataMode }}
            />
          }
        >
          <div id={chartIds.debt}>
            <LineSeriesChart data={debtSeries} color="#ef4444" />
          </div>
        </Panel>
        <Panel
          title="Current account"
          action={
            <ExportMenu
              label="Current-account chart"
              data={observationExportRows(view.observations, ["CURRENT_ACCOUNT"])}
              filenameBase={`country-profile-${view.country.code}-current-account`}
              chartTargetId={chartIds.currentAccount}
              metadata={{ title: "Current account", module: "Country Profile", country: view.country.code, indicatorNames: ["Current account balance"], units: ["% of GDP"], dataStatus: view.dataMode }}
            />
          }
        >
          <div id={chartIds.currentAccount}>
            <LineSeriesChart data={currentAccountSeries} color="#a78bfa" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Panel
          title="Risk radar"
          action={
            <ExportMenu
              label="Risk radar"
              data={profileRows.filter((row) => row.record_type === "risk_score")}
              filenameBase={`country-profile-${view.country.code}-risk-radar`}
              chartTargetId={chartIds.radar}
              metadata={{ title: "Risk radar", module: "Country Profile", country: view.country.code, indicatorNames: ["Risk score categories"], units: ["0-100 score"], dataStatus: view.dataMode }}
            />
          }
        >
          <div id={chartIds.radar}>
            <RiskRadarChart data={chartDataFromScores(view)} />
          </div>
        </Panel>
        <Panel title="Risk score detail">
          <div className="space-y-4">
            {riskEntries(view.scores).map(([label, score]) => (
              <ScoreMeter key={label} label={label} score={score} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Experimental CPI forecast"
        action={
          <ExportMenu
            label="Country CPI forecast"
            data={forecastExportRows(view.observations, forecast, "movingAverage", "baseline")}
            filenameBase={`country-profile-${view.country.code}-cpi-forecast`}
            chartTargetId={chartIds.forecast}
            metadata={{ title: "Experimental CPI forecast", module: "Country Profile", country: view.country.code, indicatorNames: ["Headline CPI inflation"], units: ["% y/y"], dataStatus: view.dataMode }}
          />
        }
      >
        <div id={chartIds.forecast}>
          <AreaForecastChart data={forecast} />
        </div>
        <p className="mt-3 text-xs text-slate-400">Simple moving-average forecast with widening confidence bands. Demo data, not live.</p>
      </Panel>

      <Panel title="AI-generated country outlook">
        <div className="whitespace-pre-line text-sm leading-6 text-slate-300">{view.outlook}</div>
      </Panel>

      <Disclaimer />
    </div>
  );
}
