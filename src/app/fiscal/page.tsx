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

export default async function FiscalPage() {
  const rows = await getTrackerRows("DEBT_GDP");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const debt = latestValue(us.observations, "DEBT_GDP") ?? 0;
  const fiscalBalance = latestValue(us.observations, "FISCAL_BALANCE") ?? 0;
  const nominalGrowth = (latestValue(us.observations, "GDP_GROWTH") ?? 0) + (latestValue(us.observations, "CPI") ?? 0);
  const policyRate = latestValue(us.observations, "POLICY_RATE") ?? 0;
  const debtArithmetic = ((policyRate - nominalGrowth) / 100) * debt - fiscalBalance;
  const debtChartId = "fiscal-monitor-debt-chart";
  const balanceChartId = "fiscal-monitor-balance-chart";
  const trackerRows = trackerExportRows(rows, "DEBT_GDP");
  const fiscalRows = [
    ...observationExportRows(us.observations, ["DEBT_GDP", "FISCAL_BALANCE", "GDP_GROWTH", "CPI", "POLICY_RATE"]),
    {
      record_type: "derived_metric",
      country_code: "US",
      country_name: "United States",
      indicator_id: "NOMINAL_GDP_GROWTH",
      indicator_name: "Nominal GDP growth proxy",
      date: us.scores.date,
      value: nominalGrowth,
      unit: "%",
      formula: "GDP growth + CPI",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    },
    {
      record_type: "derived_metric",
      country_code: "US",
      country_name: "United States",
      indicator_id: "DEBT_ARITHMETIC",
      indicator_name: "Debt arithmetic",
      date: us.scores.date,
      value: debtArithmetic,
      unit: "percentage points",
      formula: "((policy rate - nominal growth) / 100) * debt - fiscal balance",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    },
    ...trackerRows
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Fiscal sustainability"
        title="Sovereign debt and deficit risk"
        copy="Assesses debt-to-GDP, fiscal balance, interest-rate pressure, nominal growth, and simple debt-dynamics arithmetic."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label="Fiscal monitor data"
          data={fiscalRows}
          filenameBase="fiscal-monitor-data"
          metadata={{
            title: "Fiscal monitor export",
            module: "Fiscal Monitor",
            indicatorNames: ["Debt-to-GDP", "Fiscal balance", "Nominal GDP growth", "Fiscal stress"],
            units: ["% of GDP", "%", "0-100 score"],
            dataStatus: us.dataMode
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Debt-to-GDP" value={formatPercent(debt)} detail="U.S. demo proxy." tone="watch" />
        <MetricCard label="Fiscal balance" value={formatPercent(fiscalBalance)} detail="Share of GDP." tone={fiscalBalance < -4 ? "bad" : "neutral"} />
        <MetricCard label="Nominal GDP growth" value={formatPercent(nominalGrowth)} detail="Growth plus inflation proxy." />
        <MetricCard label="Debt arithmetic" value={formatPercent(debtArithmetic)} detail="(r - g) x debt - primary balance proxy." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Debt-to-GDP trend"
          action={
            <ExportMenu
              label="Debt chart"
              data={observationExportRows(us.observations, ["DEBT_GDP"])}
              filenameBase="fiscal-monitor-debt-chart"
              chartTargetId={debtChartId}
              metadata={{ title: "Debt-to-GDP trend", module: "Fiscal Monitor", country: "US", indicatorNames: ["Government debt-to-GDP"], units: ["% of GDP"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={debtChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "DEBT_GDP")} color="#ef4444" />
          </div>
        </Panel>
        <Panel
          title="Fiscal balance trend"
          action={
            <ExportMenu
              label="Fiscal balance chart"
              data={observationExportRows(us.observations, ["FISCAL_BALANCE"])}
              filenameBase="fiscal-monitor-balance-chart"
              chartTargetId={balanceChartId}
              metadata={{ title: "Fiscal balance trend", module: "Fiscal Monitor", country: "US", indicatorNames: ["Fiscal balance"], units: ["% of GDP"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={balanceChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "FISCAL_BALANCE")} color="#f59e0b" />
          </div>
        </Panel>
      </div>

      <Panel title="Debt-dynamics explanation">
        <p className="text-sm leading-6 text-slate-300">
          The MVP uses the prompt-specified identity: change in debt ratio = (interest rate - nominal growth rate) x debt ratio - primary balance.
          Where primary balance is unavailable, the fiscal balance proxy is used and clearly treated as an approximation.
        </p>
      </Panel>

      <Panel
        title="Countries ranked by fiscal stress"
        action={
          <ExportMenu
            label="Fiscal stress ranking"
            data={trackerRows}
            filenameBase="fiscal-monitor-country-ranking"
            metadata={{ title: "Countries ranked by fiscal stress", module: "Fiscal Monitor", indicatorNames: ["Fiscal stress"], units: ["0-100 score"], dataStatus: "demo" }}
          />
        }
      >
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
