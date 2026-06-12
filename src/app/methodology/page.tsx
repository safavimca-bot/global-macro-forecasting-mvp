import { Disclaimer } from "@/components/disclaimer";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";

const scoreBlocks = [
  {
    title: "Growth momentum",
    copy: "Higher risk when GDP growth is below its recent average, growth is slowing, or unemployment is rising."
  },
  {
    title: "Inflation pressure",
    copy: "Higher risk when CPI is above target or rising, oil and food proxies are increasing, FX is depreciating, or wage growth is elevated."
  },
  {
    title: "Monetary tightness",
    copy: "Higher risk when real policy rates are positive and rising, the yield curve is inverted, or the policy rate is restrictive."
  },
  {
    title: "Fiscal stress",
    copy: "Higher risk when debt-to-GDP is high and rising, deficits are wide, or interest rates exceed nominal GDP growth."
  },
  {
    title: "Credit stress",
    copy: "Higher risk when NPLs rise, credit growth becomes unstable, or the yield curve signals tightening."
  },
  {
    title: "External vulnerability",
    copy: "Higher risk when current-account deficits are large, currencies depreciate, reserves fall, or external debt is elevated."
  }
];

const regimes = [
  "Expansion: growth positive, inflation controlled, credit stress low.",
  "Slowdown: growth weakening, inflation moderate, credit stress rising.",
  "Recession risk: growth negative or weakening, unemployment rising, or curve/credit stress high.",
  "Stagflation: growth weak and inflation high.",
  "Disinflationary growth: growth stable while inflation falls.",
  "Credit stress, external stress, fiscal stress: the named risk bucket is high enough to override the base growth signal."
];

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Methodology"
        title="Transparent scoring and regime logic"
        copy="The MVP starts with explainable rule-based scoring. Forecasts are deliberately simple and uncertainty is displayed instead of hidden."
      />

      <Panel title="Risk score categories">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scoreBlocks.map((block) => (
            <div key={block.title} className="rounded-md bg-white/[0.04] p-4">
              <h3 className="font-semibold text-white">{block.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{block.copy}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Macro regime classification">
        <ul className="space-y-3 text-sm leading-6 text-slate-300">
          {regimes.map((regime) => (
            <li key={regime} className="rounded-md bg-white/[0.04] p-3">
              {regime}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Forecasting limitations">
        <p className="text-sm leading-6 text-slate-300">
          The forecasting lab currently supports last-observation-carried-forward, moving-average, and linear-trend baselines. Scenario bands are
          illustrative. They are not probabilistic institutional forecasts and should be treated as research scaffolding.
        </p>
      </Panel>

      <Panel title="How to extend the system">
        <div className="space-y-3 text-sm leading-6 text-slate-300">
          <p>Add a new indicator by registering it in the shared indicator list, adding demo coverage in the demo-data module, then mapping it in the relevant live adapter.</p>
          <p>Add a new source by implementing the common DataAdapter interface: fetchSeries, searchIndicators, and healthCheck.</p>
          <p>Promote a demo series to live by keeping API keys on the server, validating responses, caching results, and preserving source labels under charts.</p>
        </div>
      </Panel>

      <Disclaimer />
    </div>
  );
}
