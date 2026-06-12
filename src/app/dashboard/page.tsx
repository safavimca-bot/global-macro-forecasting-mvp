import { CountryRiskHeatmap } from "@/components/heatmap";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { RankedCountryList } from "@/components/ranked-list";
import { SectionHeading } from "@/components/section-heading";
import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { formatNumber, latestValue } from "@/lib/format";
import { getGlobalDashboard, getIndicatorSeries } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboard = await getGlobalDashboard();
  const oilSeries = getIndicatorSeries(dashboard.commoditySeries, "OIL");
  const regimeCount = Object.entries(dashboard.regimeCounts)
    .map(([regime, count]) => `${regime}: ${count}`)
    .join(" - ");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Global dashboard"
        title="Global macro conditions"
        copy="Cross-country regime classification, risk heatmaps, inflation pressure, fiscal stress, external vulnerability, and market/commodity snapshots."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Average macro risk" value={`${dashboard.averageRisk}/100`} detail="Weighted average across MVP countries." tone="watch" />
        <MetricCard label="Countries covered" value={`${dashboard.countries.length}`} detail="United States, Canada, Euro Area, China, Japan, UK, Germany, India, Brazil, Mexico." />
        <MetricCard label="Regime mix" value="Live summary" detail={regimeCount} />
      </div>

      <Panel title="Country risk heatmap">
        <CountryRiskHeatmap views={dashboard.countries} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Top inflation risk">
          <RankedCountryList views={dashboard.highestInflation} scoreKey="inflationPressure" />
        </Panel>
        <Panel title="Top fiscal stress">
          <RankedCountryList views={dashboard.highestFiscal} scoreKey="fiscalStress" />
        </Panel>
        <Panel title="Top external vulnerability">
          <RankedCountryList views={dashboard.highestExternal} scoreKey="externalVulnerability" />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Commodity snapshot: oil">
          <LineSeriesChart data={oilSeries} color="#f59e0b" />
        </Panel>
        <Panel title="Global market snapshot">
          <div className="grid gap-3 sm:grid-cols-2">
            {dashboard.marketSnapshot.map((item) => (
              <div key={item.label} className="rounded-md bg-white/[0.04] p-3">
                <p className="text-sm text-slate-300">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatNumber(item.value)}
                  {item.unit === "%" ? "%" : ""}
                </p>
                <p className="text-xs text-slate-400">
                  Change: {formatNumber(item.change)}
                  {item.unit === "%" ? " pp" : ""}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="AI-generated global outlook summary">
        <p className="text-sm leading-6 text-slate-300">{dashboard.outlook}</p>
        <p className="mt-3 text-xs text-slate-500">Latest U.S. CPI demo value: {formatNumber(latestValue(dashboard.countries[0].observations, "CPI"))}%.</p>
      </Panel>

      <Disclaimer />
    </div>
  );
}
