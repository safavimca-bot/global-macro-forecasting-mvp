import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { TrackerTable } from "@/components/tracker-table";
import { formatPercent, latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries, getTrackerRows } from "@/lib/data/service";

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

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Central bank monitor"
        title="Monetary policy stance"
        copy="Compares policy rates, inflation targets, real policy rates, yield-curve slope, and rule-based hawkish or dovish signals."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Policy rate" value={formatPercent(policyRate)} detail="U.S. proxy shown." tone="watch" />
        <MetricCard label="Real policy rate" value={formatPercent(realRate)} detail="Policy rate minus CPI." tone={realRate > 1 ? "watch" : "neutral"} />
        <MetricCard label="Yield-curve slope" value={formatPercent(yieldCurveSlope)} detail="10-year yield minus policy rate." tone={yieldCurveSlope < 0 ? "bad" : "good"} />
        <MetricCard label="Rule-based signal" value={signal} detail="Transparent heuristic, not a forecast." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Policy-rate trend">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "POLICY_RATE")} color="#22d3ee" />
        </Panel>
        <Panel title="10-year yield trend">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "YIELD_10Y")} color="#38bdf8" />
        </Panel>
      </div>

      <Panel title="Countries ranked by monetary tightness">
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
