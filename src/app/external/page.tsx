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

export default async function ExternalPage() {
  const rows = await getTrackerRows("CURRENT_ACCOUNT");
  const us = await getCountryMacroView("US", { useOpenAI: false });

  if (!us) {
    return null;
  }

  const currentAccountChartId = "external-vulnerability-current-account-chart";
  const fxChartId = "external-vulnerability-fx-chart";
  const trackerRows = trackerExportRows(rows, "CURRENT_ACCOUNT");
  const externalRows = [
    ...observationExportRows(us.observations, ["CURRENT_ACCOUNT", "FX_USD", "RESERVES", "EXTERNAL_DEBT"]),
    {
      record_type: "risk_score",
      country_code: "US",
      country_name: "United States",
      indicator_id: "EXTERNAL_VULNERABILITY",
      indicator_name: "External vulnerability score",
      date: us.scores.date,
      value: us.scores.externalVulnerability,
      unit: "0-100 score",
      live_demo_status: us.dataMode,
      last_updated: us.dataTimestamp
    },
    ...trackerRows
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="External vulnerability"
        title="FX and balance-of-payments risk"
        copy="Assesses current-account balances, FX pressure, reserve trends, external debt, and external-vulnerability scoring."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <ExportNotice />
        <ExportMenu
          label="External vulnerability data"
          data={externalRows}
          filenameBase="external-vulnerability-data"
          metadata={{
            title: "External vulnerability export",
            module: "External Vulnerability",
            indicatorNames: ["Current account", "FX vs USD", "FX reserves", "External debt", "External vulnerability score"],
            units: ["% of GDP", "index", "0-100 score"],
            dataStatus: us.dataMode
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Current account" value={formatPercent(latestValue(us.observations, "CURRENT_ACCOUNT"))} detail="Share of GDP." />
        <MetricCard label="FX vs USD" value={`${latestValue(us.observations, "FX_USD")?.toFixed(1) ?? "N/A"}`} detail="Indexed level; higher implies depreciation in this demo." tone="watch" />
        <MetricCard label="FX reserves" value={`${latestValue(us.observations, "RESERVES")?.toFixed(1) ?? "N/A"}`} detail="Reserve adequacy proxy." />
        <MetricCard label="External stress" value={`${us.scores.externalVulnerability}/100`} detail="Rule-based vulnerability score." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Current account"
          action={
            <ExportMenu
              label="Current-account chart"
              data={observationExportRows(us.observations, ["CURRENT_ACCOUNT"])}
              filenameBase="external-vulnerability-current-account-chart"
              chartTargetId={currentAccountChartId}
              metadata={{ title: "Current account", module: "External Vulnerability", country: "US", indicatorNames: ["Current account balance"], units: ["% of GDP"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={currentAccountChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "CURRENT_ACCOUNT")} color="#22c55e" />
          </div>
        </Panel>
        <Panel
          title="FX rate versus USD"
          action={
            <ExportMenu
              label="FX chart"
              data={observationExportRows(us.observations, ["FX_USD"])}
              filenameBase="external-vulnerability-fx-chart"
              chartTargetId={fxChartId}
              metadata={{ title: "FX rate versus USD", module: "External Vulnerability", country: "US", indicatorNames: ["FX rate versus USD"], units: ["index"], dataStatus: us.dataMode }}
            />
          }
        >
          <div id={fxChartId}>
            <LineSeriesChart data={getIndicatorSeries(us.observations, "FX_USD")} color="#f59e0b" />
          </div>
        </Panel>
      </div>

      <Panel
        title="Countries ranked by external vulnerability"
        action={
          <ExportMenu
            label="External vulnerability ranking"
            data={trackerRows}
            filenameBase="external-vulnerability-country-ranking"
            metadata={{ title: "Countries ranked by external vulnerability", module: "External Vulnerability", indicatorNames: ["External vulnerability score"], units: ["0-100 score"], dataStatus: "demo" }}
          />
        }
      >
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
