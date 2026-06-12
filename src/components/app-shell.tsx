import { BarChart3 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { CountrySelector } from "./country-selector";
import { MobileNavLinks, NavLinks } from "./nav-links";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/10 bg-navy-900/95 p-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-signal-blue/15 text-signal-cyan">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{APP_NAME}</p>
            <p className="text-xs text-slate-400">Macro intelligence MVP</p>
          </div>
        </div>
        <NavLinks />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-navy-950/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="lg:hidden">
              <p className="text-sm font-semibold text-white">{APP_NAME}</p>
              <p className="text-xs text-slate-400">Macro intelligence MVP</p>
            </div>
            <div className="hidden text-sm text-slate-400 lg:block">Institutional-style macro dashboard for research and education.</div>
            <div className="flex items-center gap-3">
              <span className="rounded-md border border-signal-amber/40 bg-signal-amber/10 px-3 py-1.5 text-xs font-semibold text-signal-amber">
                Demo data mode
              </span>
              <CountrySelector />
            </div>
          </div>
        </header>

        <div className="border-b border-white/10 bg-navy-900 px-4 py-2 lg:hidden">
          <MobileNavLinks />
        </div>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
