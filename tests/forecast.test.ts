import { generateForecast } from "@/lib/forecast";
import { getDemoObservations } from "@/lib/demo-data";
import { seriesFor } from "@/lib/format";

describe("generateForecast", () => {
  it("creates the requested number of forecast points", () => {
    const series = seriesFor(getDemoObservations("US"), "CPI");
    const forecast = generateForecast(series, "movingAverage", 6);

    expect(forecast).toHaveLength(6);
    expect(forecast[0].baseline).toBeTypeOf("number");
    expect(forecast[0].upperBand).toBeGreaterThan(forecast[0].lowerBand);
  });

  it("supports last observation carried forward", () => {
    const series = seriesFor(getDemoObservations("US"), "CPI");
    const forecast = generateForecast(series, "last", 3);
    const lastValue = series.at(-1)?.value;

    expect(forecast.every((point) => point.baseline === lastValue)).toBe(true);
  });
});
