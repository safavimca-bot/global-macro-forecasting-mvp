import { AreaForecastChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { generateForecast } from "@/lib/forecast";
import { formatPercent, seriesFor } from "@/lib/format";
import { getCountryMacroView } from "@/lib/data/service";

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

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Experimental"
        title="Forecasting lab"
        copy="Simple baseline scenarios for research triage. The MVP uses naive, moving-average, and linear-trend forecasts and does not claim institutional-grade precision."
      />

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Oil shock" value="+ inflation" detail="Raises pass-through pressure." tone="watch" />
        <MetricCard label="Dollar shock" value="+ external risk" detail="FX depreciation scenario." tone="watch" />
        <MetricCard label="Rate shock" value="+ tightness" detail="Higher real-rate scenario." />
        <MetricCard label="Fiscal shock" value="+ debt risk" detail="Deficit and r-g stress." tone="bad" />
        <MetricCard label="Credit shock" value="+ spreads" detail="Stress score scenario." tone="bad" />
      </div>

      <Panel title="Moving-average CPI forecast">
        <AreaForecastChart data={movingAverage} />
        <p className="mt-3 text-xs text-slate-400">Latest forecast baseline: {formatPercent(movingAverage.at(-1)?.baseline)}.</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Linear-trend forecast">
          <AreaForecastChart data={linearTrend} height={240} />
        </Panel>
        <Panel title="Last observation carried forward">
          <AreaForecastChart data={last} height={240} />
        </Panel>
      </div>

      <Disclaimer />
    </div>
  );
}
