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

export default async function CentralBankPage() {
  const rows = await getTrackerRows("POLICY_RATE");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const policyRate = latestValue(us.observations, "POLICY_RATE") ?? 0;
  const inflation = latestValue(us.observations, "CPI") ?? 0;
  const realRate = policyRate - inflation;
  const yieldCurveSlope = (latestValue(us.observations, "YIELD_10Y") ?? 0) - policyRate;
  const signal = realRate > 1 && yieldCurveSlope < 0 ? "Hawkish / restrictive" : realRate < 0 ? "Dovish / accommodative" : "Balanced";
  const policyChartId = "central-bank-policy-rate-chart";
  const yieldChartId = "central-bank-yield-chart";
  const trackerRows = trackerExportRows(rows, "POLICY_RATE");
  const derivedRows = [
    {
      record_type: "derived_metric",
      country_code: "US",
      country_name: "United States",
      indicator_id: "REAL_POLICY_RATE",
      indicator_name: "Real policy rate",
      date: us.scores.date,
      value: realRate,
      unit: "%",
      formula: "policy rate - CPI",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    },
    {
      record_type: "derived_metric",
      country_code: "US",
      country_name: "United States",
      indicator_id: "YIELD_CURVE_SLOPE",
      indicator_name: "Yield-curve slope",
      date: us.scores.date,
      value: yieldCurveSlope,
      unit: "percentage points",
      formula: "10-year yield - policy rate",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    }
  ];
  const centralBankRows = [...observationExportRows(us.observations, ["POLICY_RATE", "CPI", "YIELD_10Y"]), ...derivedRows, ...trackerRows];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Central bank monitor"
        title="Monetary policy stance"
        copy="Compares policy rates, inflation targets, real policy rates, yield-curve slope, and rule-based hawkish or dovish signals."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label="Central bank monitor data"
          data={centralBankRows}
          filenameBase="central-bank-monitor-data"
          metadata={{
            title: "Central bank monitor export",
            module: "Central Bank Monitor",
            indicatorNames: ["Policy rate", "Real policy rate", "10-year yield", "Yield-curve slope"],
            units: ["%", "percentage points"],
            dataStatus: us.dataMode
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Policy rate" value={formatPercent(policyRate)} detail="U.S. proxy shown." tone="watch" />
        <MetricCard label="Real policy rate" value={formatPercent(realRate)} detail="Policy rate minus CPI." tone={realRate > 1 ? "watch" : "neutral"} />
        <MetricCard label="Yield-curve slope" value={formatPercent(yieldCurveSlope)} detail="10-year yield minus policy rate." tone={yieldCurveSlope < 0 ? "bad" : "good"} />
        <MetricCard label="Rule-based signal" value={signal} detail="Transparent heuristic, not a forecast." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Policy-rate trend"
          action={
            <ExportMenu
              label="Policy-rate chart"
              data={observationExportRows(us.observations, ["POLICY_RATE"])}
              filenameBase="central-bank-policy-rate-chart"
              chartTargetId={policyChartId}
              metadata={{ title: "Policy-rate trend", module: "Central Bank Monitor", country: "US", indicatorNames: ["Policy rate"], units: ["%"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={policyChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "POLICY_RATE")} color="#22d3ee" />
          </div>
        </Panel>
        <Panel
          title="10-year yield trend"
          action={
            <ExportMenu
              label="10-year yield chart"
              data={observationExportRows(us.observations, ["YIELD_10Y"])}
              filenameBase="central-bank-yield-chart"
              chartTargetId={yieldChartId}
              metadata={{ title: "10-year yield trend", module: "Central Bank Monitor", country: "US", indicatorNames: ["10-year government yield"], units: ["%"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={yieldChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "YIELD_10Y")} color="#38bdf8" />
          </div>
        </Panel>
      </div>

      <Panel
        title="Countries ranked by monetary tightness"
        action={
          <ExportMenu
            label="Monetary tightness ranking"
            data={trackerRows}
            filenameBase="central-bank-monetary-tightness-ranking"
            metadata={{ title: "Countries ranked by monetary tightness", module: "Central Bank Monitor", indicatorNames: ["Monetary tightness"], units: ["0-100 score"], dataStatus: "demo" }}
          />
        }
      >
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
