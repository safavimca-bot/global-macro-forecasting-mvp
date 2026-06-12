import type { Country, MacroRegime, Observation, RiskScore } from "./types";
import { deltaOverWindow, latestValue } from "./format";

export function classifyMacroRegime(country: Country, observations: Observation[], scores: RiskScore): MacroRegime {
  const gdp = latestValue(observations, "GDP_GROWTH") ?? 0;
  const cpi = latestValue(observations, "CPI") ?? country.inflationTarget;
  const cpiTrend = deltaOverWindow(observations, "CPI", 6);
  const unemploymentTrend = deltaOverWindow(observations, "UNEMPLOYMENT", 4);

  if (scores.fiscalStress >= 76) {
    return {
      countryCode: country.code,
      regime: "Fiscal stress",
      confidence: 0.78,
      explanation: "Debt, deficits, and rate-growth dynamics dominate the current risk map."
    };
  }

  if (scores.externalVulnerability >= 76) {
    return {
      countryCode: country.code,
      regime: "External stress",
      confidence: 0.76,
      explanation: "External funding, FX pressure, or reserve trends are the strongest macro constraint."
    };
  }

  if (scores.creditStress >= 76) {
    return {
      countryCode: country.code,
      regime: "Credit stress",
      confidence: 0.74,
      explanation: "Credit-cycle stress is elevated enough to override the baseline growth signal."
    };
  }

  if (scores.growthMomentum >= 58 && scores.inflationPressure >= 62) {
    return {
      countryCode: country.code,
      regime: "Stagflation",
      confidence: 0.72,
      explanation: "Growth momentum is soft while inflation pressure remains above the comfort zone."
    };
  }

  if (scores.growthMomentum >= 68 || (gdp < 0.5 && unemploymentTrend > 0.2)) {
    return {
      countryCode: country.code,
      regime: "Recession risk",
      confidence: 0.7,
      explanation: "Weak output momentum and labor-market softening point to downside growth risk."
    };
  }

  if (gdp > 1 && cpiTrend < 0 && cpi <= country.inflationTarget + 1.2) {
    return {
      countryCode: country.code,
      regime: "Disinflationary growth",
      confidence: 0.68,
      explanation: "Growth is still positive while inflation is easing toward the policy target."
    };
  }

  if (scores.growthMomentum >= 48 || scores.creditStress >= 55) {
    return {
      countryCode: country.code,
      regime: "Slowdown",
      confidence: 0.64,
      explanation: "The macro signal is not recessionary, but growth and credit indicators are losing momentum."
    };
  }

  return {
    countryCode: country.code,
    regime: "Expansion",
    confidence: 0.66,
    explanation: "Growth is positive, inflation pressure is manageable, and credit stress is contained."
  };
}
