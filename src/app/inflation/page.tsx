import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { TrackerTable } from "@/components/tracker-table";
import { ExportMenu, ExportNotice } from "@/components/export-menu";
import { formatPercent, latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries, getTrackerRows } from "@/lib/data/service";
import { observationExportRows, trackerExportRows } from "@/lib/export/page-data";

export const dynamic = "force-dynamic";

export default async function InflationPage() {
  const rows = await getTrackerRows("CPI");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const cpiChartId = "inflation-tracker-cpi-chart";
  const foodChartId = "inflation-tracker-food-chart";
  const cpiRows = observationExportRows(us.observations, ["CPI", "WAGE_GROWTH", "OIL"]);
  const foodRows = observationExportRows(us.observations, ["FOOD"]);
  const trackerRows = trackerExportRows(rows, "CPI");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Inflation tracker"
        title="Inflation pressure monitor"
        copy="Tracks CPI, wage pressure, commodity costs, FX depreciation, and a transparent inflation-persistence risk score."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label="Inflation tracker data"
          data={[...cpiRows, ...trackerRows]}
          filenameBase="inflation-tracker-data"
          metadata={{
            title: "Inflation tracker export",
            module: "Inflation Tracker",
            indicatorNames: ["Headline CPI inflation", "Wage growth", "Crude oil", "Inflation risk score"],
            units: ["% y/y", "USD/bbl", "0-100 score"],
            dataStatus: us.dataMode
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="U.S. headline CPI" value={formatPercent(latestValue(us.observations, "CPI"))} detail="Demo CPI proxy." tone="watch" />
        <MetricCard label="Wage growth" value={formatPercent(latestValue(us.observations, "WAGE_GROWTH"))} detail="Nominal wage pressure proxy." />
        <MetricCard label="Oil price" value={`$${latestValue(us.observations, "OIL")?.toFixed(0) ?? "N/A"}`} detail="Crude oil demo price." />
        <MetricCard label="Inflation score" value={`${us.scores.inflationPressure}/100`} detail="Rule-based pressure score." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="U.S. CPI trend"
          action={
            <ExportMenu
              label="Inflation chart"
              data={observationExportRows(us.observations, ["CPI"])}
              filenameBase="inflation-tracker-cpi-chart"
              chartTargetId={cpiChartId}
              metadata={{ title: "U.S. CPI trend", module: "Inflation Tracker", country: "US", indicatorNames: ["Headline CPI inflation"], units: ["% y/y"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={cpiChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "CPI")} color="#f59e0b" />
          </div>
        </Panel>
        <Panel
          title="Energy and food pressure"
          action={
            <ExportMenu
              label="Food pressure chart"
              data={foodRows}
              filenameBase="inflation-tracker-food-chart"
              chartTargetId={foodChartId}
              metadata={{ title: "Energy and food pressure", module: "Inflation Tracker", country: "US", indicatorNames: ["Food commodity index"], units: ["index"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={foodChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "FOOD")} color="#22c55e" />
          </div>
          <p className="mt-3 text-xs text-slate-400">Food commodity proxy shown. Oil and gas are available in the commodity tracker.</p>
        </Panel>
      </div>

      <Panel
        title="Countries ranked by inflation risk"
        action={
          <ExportMenu
            label="Inflation ranking"
            data={trackerRows}
            filenameBase="inflation-tracker-country-ranking"
            metadata={{ title: "Countries ranked by inflation risk", module: "Inflation Tracker", indicatorNames: ["Inflation risk score"], units: ["0-100 score"], dataStatus: "demo" }}
          />
        }
      >
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
