"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Banknote,
  BookOpen,
  Bot,
  Database,
  Factory,
  Globe2,
  Home,
  Landmark,
  LineChart,
  ShieldAlert,
  TrendingUp,
  type LucideIcon
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Global Dashboard", icon: Globe2 },
  { href: "/inflation", label: "Inflation Tracker", icon: Activity },
  { href: "/central-bank", label: "Central Bank Monitor", icon: Landmark },
  { href: "/fiscal", label: "Fiscal Monitor", icon: Banknote },
  { href: "/credit", label: "Credit Cycle", icon: ShieldAlert },
  { href: "/external", label: "External Vulnerability", icon: TrendingUp },
  { href: "/commodities", label: "Commodity Tracker", icon: Factory },
  { href: "/forecasting", label: "Forecasting Lab", icon: LineChart },
  { href: "/ai-report", label: "AI Country Report", icon: Bot },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/methodology", label: "Methodology", icon: BookOpen }
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
              active ? "bg-signal-blue/15 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-xs transition ${
              active ? "bg-signal-blue/15 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
