import Link from "next/link";
import { Activity, Banknote, Bot, Database, Factory, Globe2, Landmark, ShieldAlert } from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";

const features = [
  { title: "Country Macro Profiles", icon: Globe2, text: "GDP, inflation, labor, fiscal, external, credit, and market indicators by country." },
  { title: "Inflation Tracker", icon: Activity, text: "Headline inflation, wage pressure, oil, food, FX, and persistence signals." },
  { title: "Central Bank Monitor", icon: Landmark, text: "Policy rate, real-rate, yield-curve, and rule-based hawkish or dovish stance." },
  { title: "Fiscal Risk Monitor", icon: Banknote, text: "Debt, deficit, rate-growth arithmetic, and sovereign stress scoring." },
  { title: "Credit Cycle Dashboard", icon: ShieldAlert, text: "Credit growth, NPLs, yield-curve inversion, and stress classification." },
  { title: "Commodity and Energy Tracker", icon: Factory, text: "Oil, gas, copper, food proxies, and inflation pass-through context." },
  { title: "AI Outlook Reports", icon: Bot, text: "OpenAI-backed reports when configured, deterministic summaries otherwise." },
  { title: "Transparent Data Sources", icon: Database, text: "Source status, frequency, coverage, notes, and demo/live labels." }
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-md border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_32%),linear-gradient(135deg,#0a1627,#06111f)] p-6 shadow-panel md:p-10">
        <SectionHeading
          eyebrow="Global Macro Outlook AI"
          title="AI-Powered Global Macro Forecasting Dashboard"
          copy="A professional macroeconomic intelligence platform for tracking country conditions, regime shifts, risk scores, transparent data coverage, and research-grade outlook summaries."
        />
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-md bg-signal-blue px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-signal-cyan">
            Open Dashboard
          </Link>
          <Link href="/methodology" className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            View Methodology
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Panel key={feature.title} title={feature.title}>
              <Icon className="mb-4 h-6 w-6 text-signal-cyan" aria-hidden="true" />
              <p className="text-sm leading-6 text-slate-300">{feature.text}</p>
            </Panel>
          );
        })}
      </div>

      <Disclaimer />
    </div>
  );
}
