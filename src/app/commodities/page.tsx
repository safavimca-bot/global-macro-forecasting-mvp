import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { ExportMenu, ExportNotice } from "@/components/export-menu";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries } from "@/lib/data/service";
import { observationExportRows } from "@/lib/export/page-data";

export const dynamic = "force-dynamic";

export default async function CommoditiesPage() {
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const chartIds = {
    oil: "commodity-tracker-oil-chart",
    gas: "commodity-tracker-gas-chart",
    copper: "commodity-tracker-copper-chart",
    food: "commodity-tracker-food-chart"
  };
  const commodityRows = [
    ...observationExportRows(us.observations, ["OIL", "GAS", "COPPER", "FOOD", "CPI"]),
    {
      record_type: "risk_score",
      country_code: "US",
      country_name: "United States",
      indicator_id: "COMMODITY_EXPOSURE",
      indicator_name: "Commodity exposure score",
      date: us.scores.date,
      value: us.scores.commodityExposure,
      unit: "0-100 score",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    }
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Commodity and energy tracker"
        title="Commodity shocks and pass-through"
        copy="Tracks oil, natural gas, copper, and food proxies, then links energy shocks to inflation and country exposure."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label="Commodity tracker data"
          data={commodityRows}
          filenameBase="commodity-energy-tracker-data"
          metadata={{
            title: "Commodity and energy tracker export",
            module: "Commodity and Energy Tracker",
            indicatorNames: ["Crude oil", "Natural gas", "Copper", "Food commodity index", "Commodity exposure score"],
            units: ["USD/bbl", "index", "0-100 score"],
            dataStatus: us.dataMode
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Oil" value={`$${latestValue(us.observations, "OIL")?.toFixed(0) ?? "N/A"}`} detail="USD/bbl demo proxy." tone="watch" />
        <MetricCard label="Natural gas" value={`${latestValue(us.observations, "GAS")?.toFixed(1) ?? "N/A"}`} detail="Index proxy." />
        <MetricCard label="Copper" value={`${latestValue(us.observations, "COPPER")?.toFixed(1) ?? "N/A"}`} detail="Industrial cycle proxy." />
        <MetricCard label="Food index" value={`${latestValue(us.observations, "FOOD")?.toFixed(1) ?? "N/A"}`} detail="Food commodity proxy." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Oil price chart"
          action={
            <ExportMenu
              label="Oil chart"
              data={observationExportRows(us.observations, ["OIL"])}
              filenameBase="commodity-tracker-oil-chart"
              chartTargetId={chartIds.oil}
              metadata={{ title: "Oil price chart", module: "Commodity and Energy Tracker", country: "US", indicatorNames: ["Crude oil"], units: ["USD/bbl"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={chartIds.oil}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "OIL")} color="#f59e0b" />
          </div>
        </Panel>
        <Panel
          title="Natural gas chart"
          action={
            <ExportMenu
              label="Natural gas chart"
              data={observationExportRows(us.observations, ["GAS"])}
              filenameBase="commodity-tracker-gas-chart"
              chartTargetId={chartIds.gas}
              metadata={{ title: "Natural gas chart", module: "Commodity and Energy Tracker", country: "US", indicatorNames: ["Natural gas"], units: ["index"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={chartIds.gas}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "GAS")} color="#38bdf8" />
          </div>
        </Panel>
        <Panel
          title="Copper chart"
          action={
            <ExportMenu
              label="Copper chart"
              data={observationExportRows(us.observations, ["COPPER"])}
              filenameBase="commodity-tracker-copper-chart"
              chartTargetId={chartIds.copper}
              metadata={{ title: "Copper chart", module: "Commodity and Energy Tracker", country: "US", indicatorNames: ["Copper"], units: ["index"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={chartIds.copper}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "COPPER")} color="#ef4444" />
          </div>
        </Panel>
        <Panel
          title="Food commodity proxy"
          action={
            <ExportMenu
              label="Food commodity chart"
              data={observationExportRows(us.observations, ["FOOD"])}
              filenameBase="commodity-tracker-food-chart"
              chartTargetId={chartIds.food}
              metadata={{ title: "Food commodity proxy", module: "Commodity and Energy Tracker", country: "US", indicatorNames: ["Food commodity index"], units: ["index"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={chartIds.food}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "FOOD")} color="#22c55e" />
          </div>
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
