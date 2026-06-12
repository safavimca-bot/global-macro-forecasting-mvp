import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { TrackerTable } from "@/components/tracker-table";
import { formatPercent, latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries, getTrackerRows } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export default async function ExternalPage() {
  const rows = await getTrackerRows("CURRENT_ACCOUNT");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="External vulnerability"
        title="FX and balance-of-payments risk"
        copy="Assesses current-account balances, FX pressure, reserve trends, external debt, and external-vulnerability scoring."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Current account" value={formatPercent(latestValue(us.observations, "CURRENT_ACCOUNT"))} detail="Share of GDP." />
        <MetricCard label="FX vs USD" value={`${latestValue(us.observations, "FX_USD")?.toFixed(1) ?? "N/A"}`} detail="Indexed level; higher implies depreciation in this demo." tone="watch" />
        <MetricCard label="FX reserves" value={`${latestValue(us.observations, "RESERVES")?.toFixed(1) ?? "N/A"}`} detail="Reserve adequacy proxy." />
        <MetricCard label="External stress" value={`${us.scores.externalVulnerability}/100`} detail="Rule-based vulnerability score." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Current account">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "CURRENT_ACCOUNT")} color="#22c55e" />
        </Panel>
        <Panel title="FX rate versus USD">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "FX_USD")} color="#f59e0b" />
        </Panel>
      </div>

      <Panel title="Countries ranked by external vulnerability">
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
