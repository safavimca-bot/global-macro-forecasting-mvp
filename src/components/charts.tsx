"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface Point {
  date?: string;
  name?: string;
  value?: number;
  score?: number;
  baseline?: number;
  optimistic?: number;
  pessimistic?: number;
  lowerBand?: number;
  upperBand?: number;
  source?: string;
  isDemo?: boolean;
}

const tooltipStyle = {
  background: "#0f1f34",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: "6px",
  color: "#f8fafc"
};

export function LineSeriesChart({ data, color = "#38bdf8", height = 260 }: { data: Point[]; color?: string; height?: number }) {
  const sources = Array.from(new Set(data.map((point) => point.source).filter(Boolean)));
  const hasDemoData = data.some((point) => point.isDemo);

  return (
    <>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e2e8f0" }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {sources.length ? (
        <p className="mt-3 text-xs text-slate-400">
          Source: {sources.join(", ")}
          {hasDemoData ? " - Demo data, not live." : ""}
        </p>
      ) : null}
    </>
  );
}

export function AreaForecastChart({ data, height = 280 }: { data: Point[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e2e8f0" }} />
          <Area type="monotone" dataKey="upperBand" stroke="transparent" fill="url(#forecastFill)" />
          <Area type="monotone" dataKey="lowerBand" stroke="transparent" fill="#06111f" />
          <Line type="monotone" dataKey="baseline" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="optimistic" stroke="#22c55e" strokeDasharray="5 5" dot={false} />
          <Line type="monotone" dataKey="pessimistic" stroke="#f59e0b" strokeDasharray="5 5" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskRadarChart({ data, height = 300 }: { data: Point[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,.12)" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Radar name="Risk" dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.22} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBarChart({ data, height = 240 }: { data: Point[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,.08)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" width={110} tick={{ fill: "#cbd5e1", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="score" fill="#38bdf8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
