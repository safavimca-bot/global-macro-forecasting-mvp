import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { TrackerTable } from "@/components/tracker-table";
import { formatPercent, latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries, getTrackerRows } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export default async function InflationPage() {
  const rows = await getTrackerRows("CPI");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Inflation tracker"
        title="Inflation pressure monitor"
        copy="Tracks CPI, wage pressure, commodity costs, FX depreciation, and a transparent inflation-persistence risk score."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="U.S. headline CPI" value={formatPercent(latestValue(us.observations, "CPI"))} detail="Demo CPI proxy." tone="watch" />
        <MetricCard label="Wage growth" value={formatPercent(latestValue(us.observations, "WAGE_GROWTH"))} detail="Nominal wage pressure proxy." />
        <MetricCard label="Oil price" value={`$${latestValue(us.observations, "OIL")?.toFixed(0) ?? "N/A"}`} detail="Crude oil demo price." />
        <MetricCard label="Inflation score" value={`${us.scores.inflationPressure}/100`} detail="Rule-based pressure score." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="U.S. CPI trend">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "CPI")} color="#f59e0b" />
        </Panel>
        <Panel title="Energy and food pressure">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "FOOD")} color="#22c55e" />
          <p className="mt-3 text-xs text-slate-400">Food commodity proxy shown. Oil and gas are available in the commodity tracker.</p>
        </Panel>
      </div>

      <Panel title="Countries ranked by inflation risk">
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
