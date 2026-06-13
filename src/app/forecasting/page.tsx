import { AreaForecastChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { ExportMenu, ExportNotice } from "@/components/export-menu";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { generateForecast } from "@/lib/forecast";
import { formatPercent, seriesFor } from "@/lib/format";
import { getCountryMacroView } from "@/lib/data/service";
import { forecastExportRows } from "@/lib/export/page-data";

export const dynamic = "force-dynamic";

export default async function ForecastingPage() {
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const cpiSeries = seriesFor(us.observations, "CPI");
  const movingAverage = generateForecast(cpiSeries, "movingAverage", 6);
  const linearTrend = generateForecast(cpiSeries, "linearTrend", 6);
  const last = generateForecast(cpiSeries, "last", 6);
  const movingAverageChartId = "forecasting-lab-moving-average-chart";
  const linearTrendChartId = "forecasting-lab-linear-trend-chart";
  const lastObservationChartId = "forecasting-lab-last-observation-chart";
  const forecastRows = [
    ...forecastExportRows(us.observations, movingAverage, "movingAverage", "moving-average"),
    ...forecastExportRows(us.observations, linearTrend, "linearTrend", "linear-trend"),
    ...forecastExportRows(us.observations, last, "last", "last-observation-carried-forward")
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Experimental"
        title="Forecasting lab"
        copy="Simple baseline scenarios for research triage. The MVP uses naive, moving-average, and linear-trend forecasts and does not claim institutional-grade precision."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label="Forecasting lab data"
          data={forecastRows}
          filenameBase="forecasting-lab-all-scenarios"
          metadata={{
            title: "Forecasting lab inputs and outputs",
            module: "Forecasting Lab",
            country: "US",
            indicatorNames: ["Headline CPI inflation"],
            units: ["% y/y"],
            dataStatus: us.dataMode,
            notes: "Forecasts are simple baseline scenarios and are not official forecasts."
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Oil shock" value="+ inflation" detail="Raises pass-through pressure." tone="watch" />
        <MetricCard label="Dollar shock" value="+ external risk" detail="FX depreciation scenario." tone="watch" />
        <MetricCard label="Rate shock" value="+ tightness" detail="Higher real-rate scenario." />
        <MetricCard label="Fiscal shock" value="+ debt risk" detail="Deficit and r-g stress." tone="bad" />
        <MetricCard label="Credit shock" value="+ spreads" detail="Stress score scenario." tone="bad" />
      </div>

      <Panel
        title="Moving-average CPI forecast"
        action={
          <ExportMenu
            label="Moving-average forecast"
            data={forecastExportRows(us.observations, movingAverage, "movingAverage", "moving-average")}
            filenameBase="forecasting-lab-moving-average"
            chartTargetId={movingAverageChartId}
            metadata={{ title: "Moving-average CPI forecast", module: "Forecasting Lab", country: "US", indicatorNames: ["Headline CPI inflation"], units: ["% y/y"], dataStatus: us.dataMode, scenario: "moving-average" }}
          />
        }
      >
        <div id={movingAverageChartId}>
          <AreaForecastChart data={movingAverage} />
        </div>
        <p className="mt-3 text-xs text-slate-400">Latest forecast baseline: {formatPercent(movingAverage.at(-1)?.baseline)}.</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Linear-trend forecast"
          action={
            <ExportMenu
              label="Linear-trend forecast"
              data={forecastExportRows(us.observations, linearTrend, "linearTrend", "linear-trend")}
              filenameBase="forecasting-lab-linear-trend"
              chartTargetId={linearTrendChartId}
              metadata={{ title: "Linear-trend forecast", module: "Forecasting Lab", country: "US", indicatorNames: ["Headline CPI inflation"], units: ["% y/y"], dataStatus: us.dataMode, scenario: "linear-trend" }}
            />
          }
        >
          <div id={linearTrendChartId}>
            <AreaForecastChart data={linearTrend} height={240} />
          </div>
        </Panel>
        <Panel
          title="Last observation carried forward"
          action={
            <ExportMenu
              label="Last observation forecast"
              data={forecastExportRows(us.observations, last, "last", "last-observation-carried-forward")}
              filenameBase="forecasting-lab-last-observation-carried-forward"
              chartTargetId={lastObservationChartId}
              metadata={{ title: "Last observation carried forward", module: "Forecasting Lab", country: "US", indicatorNames: ["Headline CPI inflation"], units: ["% y/y"], dataStatus: us.dataMode, scenario: "last-observation-carried-forward" }}
            />
          }
        >
          <div id={lastObservationChartId}>
            <AreaForecastChart data={last} height={240} />
          </div>
        </Panel>
      </div>

      <Disclaimer />
    </div>
  );
}
