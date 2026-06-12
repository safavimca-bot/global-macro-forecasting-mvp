import { COUNTRIES } from "@/lib/constants";
import { getDemoObservations } from "@/lib/demo-data";
import { classifyMacroRegime } from "@/lib/regime";
import { calculateRiskScores } from "@/lib/scoring";

describe("classifyMacroRegime", () => {
  it("classifies a country using scores and observations", () => {
    const country = COUNTRIES.find((item) => item.code === "CA")!;
    const observations = getDemoObservations("CA");
    const scores = calculateRiskScores(country, observations);
    const regime = classifyMacroRegime(country, observations, scores);

    expect(regime.countryCode).toBe("CA");
    expect(regime.confidence).toBeGreaterThan(0);
    expect(regime.explanation.length).toBeGreaterThan(20);
  });

  it("prioritizes high fiscal stress", () => {
    const country = COUNTRIES.find((item) => item.code === "US")!;
    const observations = getDemoObservations("US");
    const baseScores = calculateRiskScores(country, observations);
    const regime = classifyMacroRegime(country, observations, { ...baseScores, fiscalStress: 90 });

    expect(regime.regime).toBe("Fiscal stress");
  });
});
