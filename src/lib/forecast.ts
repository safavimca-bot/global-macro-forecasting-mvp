import type { ForecastPoint, Observation } from "./types";

export type ForecastMethod = "last" | "movingAverage" | "linearTrend";

function nextDate(date: string, step: number) {
  if (date.includes("-Q")) {
    const [yearText, quarterText] = date.split("-Q");
    const absoluteQuarter = Number(yearText) * 4 + Number(quarterText) - 1 + step;
    return `${Math.floor(absoluteQuarter / 4)}-Q${(absoluteQuarter % 4) + 1}`;
  }

  if (date.length === 4) {
    return `${Number(date) + step}`;
  }

  const [yearText, monthText] = date.split("-");
  const absoluteMonth = Number(yearText) * 12 + Number(monthText) - 1 + step;
  const year = Math.floor(absoluteMonth / 12);
  const month = `${(absoluteMonth % 12) + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function movingAverage(values: number[], window = 4) {
  const slice = values.slice(-window);
  return slice.reduce((total, value) => total + value, 0) / Math.max(slice.length, 1);
}

export function generateForecast(series: Observation[], method: ForecastMethod = "movingAverage", periods = 6): ForecastPoint[] {
  const ordered = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const values = ordered.map((point) => point.value);
  const latest = ordered.at(-1);
  const lastValue = values.at(-1) ?? 0;
  const priorValue = values.at(-4) ?? values.at(0) ?? lastValue;
  const trend = (lastValue - priorValue) / Math.max(Math.min(values.length - 1, 4), 1);

  if (!latest) {
    return [];
  }

  return Array.from({ length: periods }, (_, index) => {
    const step = index + 1;
    const baseline =
      method === "last"
        ? lastValue
        : method === "linearTrend"
          ? lastValue + trend * step
          : movingAverage([...values, lastValue + trend * step], 5);
    const confidenceWidth = Math.max(Math.abs(trend) * step + Math.abs(baseline) * 0.04, 0.4);

    return {
      date: nextDate(latest.date, step),
      baseline: Number(baseline.toFixed(2)),
      optimistic: Number((baseline - confidenceWidth * 0.55).toFixed(2)),
      pessimistic: Number((baseline + confidenceWidth * 0.75).toFixed(2)),
      lowerBand: Number((baseline - confidenceWidth).toFixed(2)),
      upperBand: Number((baseline + confidenceWidth).toFixed(2)),
      explanation:
        method === "last"
          ? "Carries the latest observation forward as a conservative baseline."
          : method === "linearTrend"
            ? "Extends the recent linear trend with a widening confidence band."
            : "Blends recent observations into a moving-average baseline with simple scenarios."
    };
  });
}
