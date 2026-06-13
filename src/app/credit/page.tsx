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

export default async function CreditPage() {
  const rows = await getTrackerRows("CREDIT_GROWTH");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const curveSlope = (latestValue(us.observations, "YIELD_10Y") ?? 0) - (latestValue(us.observations, "POLICY_RATE") ?? 0);
  const creditChartId = "credit-cycle-growth-chart";
  const nplChartId = "credit-cycle-npl-chart";
  const trackerRows = trackerExportRows(rows, "CREDIT_GROWTH");
  const creditRows = [
    ...observationExportRows(us.observations, ["CREDIT_GROWTH", "NPL", "YIELD_10Y", "POLICY_RATE"]),
    {
      record_type: "derived_metric",
      country_code: "US",
      country_name: "United States",
      indicator_id: "YIELD_CURVE_SLOPE",
      indicator_name: "Yield-curve slope",
      date: us.scores.date,
      value: curveSlope,
      unit: "percentage points",
      formula: "10-year yield - policy rate",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    },
    {
      record_type: "risk_score",
      country_code: "US",
      country_name: "United States",
      indicator_id: "CREDIT_STRESS",
      indicator_name: "Credit stress",
      date: us.scores.date,
      value: us.scores.creditStress,
      unit: "0-100 score",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    },
    ...trackerRows
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Credit cycle"
        title="Credit stress monitor"
        copy="Uses credit growth, non-performing loan proxies, yield-curve inversion, and rule-based credit-cycle stress scoring."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label="Credit cycle data"
          data={creditRows}
          filenameBase="credit-cycle-data"
          metadata={{
            title: "Credit cycle export",
            module: "Credit Cycle Dashboard",
            indicatorNames: ["Credit growth", "Non-performing loans", "Yield-curve slope", "Credit stress"],
            units: ["% y/y", "% of loans", "percentage points", "0-100 score"],
            dataStatus: us.dataMode
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Credit growth" value={formatPercent(latestValue(us.observations, "CREDIT_GROWTH"))} detail="Private credit proxy." />
        <MetricCard label="NPL ratio" value={formatPercent(latestValue(us.observations, "NPL"))} detail="Asset-quality proxy." />
        <MetricCard label="Yield curve" value={formatPercent(curveSlope)} detail="Negative values flag inversion." tone={curveSlope < 0 ? "bad" : "good"} />
        <MetricCard label="Credit stress" value={`${us.scores.creditStress}/100`} detail="Rule-based score." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Credit growth"
          action={
            <ExportMenu
              label="Credit growth chart"
              data={observationExportRows(us.observations, ["CREDIT_GROWTH"])}
              filenameBase="credit-cycle-growth-chart"
              chartTargetId={creditChartId}
              metadata={{ title: "Credit growth", module: "Credit Cycle Dashboard", country: "US", indicatorNames: ["Private credit growth"], units: ["% y/y"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={creditChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "CREDIT_GROWTH")} color="#38bdf8" />
          </div>
        </Panel>
        <Panel
          title="Non-performing loans"
          action={
            <ExportMenu
              label="NPL chart"
              data={observationExportRows(us.observations, ["NPL"])}
              filenameBase="credit-cycle-npl-chart"
              chartTargetId={nplChartId}
              metadata={{ title: "Non-performing loans", module: "Credit Cycle Dashboard", country: "US", indicatorNames: ["Non-performing loans"], units: ["% of loans"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={nplChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "NPL")} color="#ef4444" />
          </div>
        </Panel>
      </div>

      <Panel
        title="Countries ranked by credit stress"
        action={
          <ExportMenu
            label="Credit stress ranking"
            data={trackerRows}
            filenameBase="credit-cycle-country-ranking"
            metadata={{ title: "Countries ranked by credit stress", module: "Credit Cycle Dashboard", indicatorNames: ["Credit stress"], units: ["0-100 score"], dataStatus: "demo" }}
          />
        }
      >
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
