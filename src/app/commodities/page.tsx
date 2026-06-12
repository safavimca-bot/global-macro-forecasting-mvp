import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries } from "@/lib/data/service";

export const dynamic = "force-dynamic";

export default async function CommoditiesPage() {
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Commodity and energy tracker"
        title="Commodity shocks and pass-through"
        copy="Tracks oil, natural gas, copper, and food proxies, then links energy shocks to inflation and country exposure."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Oil" value={`$${latestValue(us.observations, "OIL")?.toFixed(0) ?? "N/A"}`} detail="USD/bbl demo proxy." tone="watch" />
        <MetricCard label="Natural gas" value={`${latestValue(us.observations, "GAS")?.toFixed(1) ?? "N/A"}`} detail="Index proxy." />
        <MetricCard label="Copper" value={`${latestValue(us.observations, "COPPER")?.toFixed(1) ?? "N/A"}`} detail="Industrial cycle proxy." />
        <MetricCard label="Food index" value={`${latestValue(us.observations, "FOOD")?.toFixed(1) ?? "N/A"}`} detail="Food commodity proxy." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Oil price chart">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "OIL")} color="#f59e0b" />
        </Panel>
        <Panel title="Natural gas chart">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "GAS")} color="#38bdf8" />
        </Panel>
        <Panel title="Copper chart">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "COPPER")} color="#ef4444" />
        </Panel>
        <Panel title="Food commodity proxy">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "FOOD")} color="#22c55e" />
        </Panel>
      </div>

      <Panel title="Inflation pass-through explanation">
        <p className="text-sm leading-6 text-slate-300">
          Commodity shocks feed the MVP inflation score when oil, food, or FX pressure rises. Importers receive a higher commodity-exposure risk
          contribution when energy prices rise; exporters are more exposed when the same prices fall.
        </p>
      </Panel>

      <Disclaimer />
    </div>
  );
}
