import { COUNTRIES } from "@/lib/constants";
import { getDemoObservations } from "@/lib/demo-data";
import { calculateRiskScores } from "@/lib/scoring";

describe("calculateRiskScores", () => {
  it("returns bounded category scores and an overall score", () => {
    const country = COUNTRIES.find((item) => item.code === "US");
    expect(country).toBeDefined();

    const scores = calculateRiskScores(country!, getDemoObservations("US"));

    expect(scores.countryCode).toBe("US");
    expect(scores.overallRisk).toBeGreaterThanOrEqual(0);
    expect(scores.overallRisk).toBeLessThanOrEqual(100);
    expect(scores.inflationPressure).toBeGreaterThan(0);
  });

  it("assigns higher fiscal stress to highly indebted countries in demo data", () => {
    const japan = COUNTRIES.find((item) => item.code === "JP")!;
    const germany = COUNTRIES.find((item) => item.code === "DE")!;
    const japanScores = calculateRiskScores(japan, getDemoObservations("JP"));
    const germanyScores = calculateRiskScores(germany, getDemoObservations("DE"));

    expect(japanScores.fiscalStress).toBeGreaterThan(germanyScores.fiscalStress);
  });
});
