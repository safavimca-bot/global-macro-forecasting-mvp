import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { TrackerTable } from "@/components/tracker-table";
import { formatPercent, latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries, getTrackerRows } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const rows = await getTrackerRows("CREDIT_GROWTH");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const curveSlope = (latestValue(us.observations, "YIELD_10Y") ?? 0) - (latestValue(us.observations, "POLICY_RATE") ?? 0);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Credit cycle"
        title="Credit stress monitor"
        copy="Uses credit growth, non-performing loan proxies, yield-curve inversion, and rule-based credit-cycle stress scoring."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Credit growth" value={formatPercent(latestValue(us.observations, "CREDIT_GROWTH"))} detail="Private credit proxy." />
        <MetricCard label="NPL ratio" value={formatPercent(latestValue(us.observations, "NPL"))} detail="Asset-quality proxy." />
        <MetricCard label="Yield curve" value={formatPercent(curveSlope)} detail="Negative values flag inversion." tone={curveSlope < 0 ? "bad" : "good"} />
        <MetricCard label="Credit stress" value={`${us.scores.creditStress}/100`} detail="Rule-based score." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Credit growth">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "CREDIT_GROWTH")} color="#38bdf8" />
        </Panel>
        <Panel title="Non-performing loans">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "NPL")} color="#ef4444" />
        </Panel>
      </div>

      <Panel title="Countries ranked by credit stress">
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
