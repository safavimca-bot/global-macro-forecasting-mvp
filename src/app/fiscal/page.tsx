import { LineSeriesChart } from "@/components/charts";
import { Disclaimer } from "@/components/disclaimer";
import { MetricCard } from "@/components/metric-card";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { TrackerTable } from "@/components/tracker-table";
import { formatPercent, latestValue } from "@/lib/format";
import { getCountryMacroView, getIndicatorSeries, getTrackerRows } from "@/lib/data/service";

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

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Fiscal sustainability"
        title="Sovereign debt and deficit risk"
        copy="Assesses debt-to-GDP, fiscal balance, interest-rate pressure, nominal growth, and simple debt-dynamics arithmetic."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Debt-to-GDP" value={formatPercent(debt)} detail="U.S. demo proxy." tone="watch" />
        <MetricCard label="Fiscal balance" value={formatPercent(fiscalBalance)} detail="Share of GDP." tone={fiscalBalance < -4 ? "bad" : "neutral"} />
        <MetricCard label="Nominal GDP growth" value={formatPercent(nominalGrowth)} detail="Growth plus inflation proxy." />
        <MetricCard label="Debt arithmetic" value={formatPercent(debtArithmetic)} detail="(r - g) x debt - primary balance proxy." tone="watch" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Debt-to-GDP trend">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "DEBT_GDP")} color="#ef4444" />
        </Panel>
        <Panel title="Fiscal balance trend">
          <LineSeriesChart data={getIndicatorSeries(us.observations, "FISCAL_BALANCE")} color="#f59e0b" />
        </Panel>
      </div>

      <Panel title="Debt-dynamics explanation">
        <p className="text-sm leading-6 text-slate-300">
          The MVP uses the prompt-specified identity: change in debt ratio = (interest rate - nominal growth rate) x debt ratio - primary balance.
          Where primary balance is unavailable, the fiscal balance proxy is used and clearly treated as an approximation.
        </p>
      </Panel>

      <Panel title="Countries ranked by fiscal stress">
        <TrackerTable rows={rows} />
      </Panel>

      <Disclaimer />
    </div>
  );
}
