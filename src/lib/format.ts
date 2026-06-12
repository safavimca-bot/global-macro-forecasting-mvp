import type { Observation, RiskScore } from "./types";

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function formatNumber(value: number | undefined, digits = 1) {
  if (value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatPercent(value: number | undefined, digits = 1) {
  if (value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${formatNumber(value, digits)}%`;
}

export function latestObservation(observations: Observation[], indicatorId: string) {
  return observations
    .filter((observation) => observation.indicatorId === indicatorId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}

export function seriesFor(observations: Observation[], indicatorId: string) {
  return observations
    .filter((observation) => observation.indicatorId === indicatorId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function latestValue(observations: Observation[], indicatorId: string) {
  return latestObservation(observations, indicatorId)?.value;
}

export function deltaOverWindow(observations: Observation[], indicatorId: string, periods = 4) {
  const series = seriesFor(observations, indicatorId);
  const latest = series.at(-1);
  const previous = series.at(Math.max(0, series.length - 1 - periods));

  if (!latest || !previous) {
    return 0;
  }

  return latest.value - previous.value;
}

export function averageLatest(observations: Observation[], indicatorId: string, periods = 4) {
  const series = seriesFor(observations, indicatorId).slice(-periods);

  if (!series.length) {
    return undefined;
  }

  return series.reduce((total, observation) => total + observation.value, 0) / series.length;
}

export function riskColor(score: number) {
  if (score >= 75) {
    return "text-signal-red";
  }

  if (score >= 55) {
    return "text-signal-amber";
  }

  if (score >= 35) {
    return "text-signal-cyan";
  }

  return "text-signal-green";
}

export function riskLabel(score: number) {
  if (score >= 75) {
    return "High";
  }

  if (score >= 55) {
    return "Elevated";
  }

  if (score >= 35) {
    return "Watch";
  }

  return "Low";
}

export function riskEntries(scores: RiskScore) {
  return [
    ["Growth", scores.growthMomentum],
    ["Inflation", scores.inflationPressure],
    ["Policy", scores.monetaryTightness],
    ["Fiscal", scores.fiscalStress],
    ["Credit", scores.creditStress],
    ["External", scores.externalVulnerability],
    ["Commodity", scores.commodityExposure],
    ["Geo/structural", scores.geopoliticalRisk]
  ] as const;
}
