import { COUNTRIES } from "@/lib/constants";
import { generateCountryReport } from "@/lib/ai-report";
import { getDemoObservations } from "@/lib/demo-data";
import { classifyMacroRegime } from "@/lib/regime";
import { calculateRiskScores } from "@/lib/scoring";

describe("generateCountryReport", () => {
  it("uses deterministic fallback text when OpenAI is disabled", async () => {
    const country = COUNTRIES.find((item) => item.code === "US")!;
    const observations = getDemoObservations("US");
    const scores = calculateRiskScores(country, observations);
    const regime = classifyMacroRegime(country, observations, scores);
    const report = await generateCountryReport(country, observations, scores, regime, { useOpenAI: false });

    expect(report).toContain("Executive summary");
    expect(report).toContain("Data limitations");
    expect(report).toContain("not investment");
  });
});
