import type { Country, Observation, RiskScore } from "./types";
import { averageLatest, clamp, deltaOverWindow, latestValue } from "./format";

export function calculateRiskScores(country: Country, observations: Observation[]): RiskScore {
  const gdp = latestValue(observations, "GDP_GROWTH") ?? 0;
  const gdpAverage = averageLatest(observations, "GDP_GROWTH", 4) ?? gdp;
  const cpi = latestValue(observations, "CPI") ?? country.inflationTarget;
  const unemploymentDelta = deltaOverWindow(observations, "UNEMPLOYMENT", 4);
  const policyRate = latestValue(observations, "POLICY_RATE") ?? 0;
  const yield10y = latestValue(observations, "YIELD_10Y") ?? policyRate;
  const debt = latestValue(observations, "DEBT_GDP") ?? 0;
  const fiscalBalance = latestValue(observations, "FISCAL_BALANCE") ?? 0;
  const currentAccount = latestValue(observations, "CURRENT_ACCOUNT") ?? 0;
  const fxDelta = deltaOverWindow(observations, "FX_USD", 6);
  const oilDelta = deltaOverWindow(observations, "OIL", 6);
  const wageGrowth = latestValue(observations, "WAGE_GROWTH") ?? cpi;
  const creditGrowth = latestValue(observations, "CREDIT_GROWTH") ?? 0;
  const creditDelta = deltaOverWindow(observations, "CREDIT_GROWTH", 4);
  const npl = latestValue(observations, "NPL") ?? 0;
  const reservesDelta = deltaOverWindow(observations, "RESERVES", 6);
  const externalDebt = latestValue(observations, "EXTERNAL_DEBT") ?? 0;
  const realPolicyRate = policyRate - cpi;
  const curveSlope = yield10y - policyRate;
  const nominalGrowthProxy = Math.max(gdp + cpi, 0.5);

  const growthMomentum = clamp(42 - gdp * 5 + Math.max(0, gdpAverage - gdp) * 12 + Math.max(0, unemploymentDelta) * 10);
  const inflationPressure = clamp(
    25 +
      Math.max(0, cpi - country.inflationTarget) * 16 +
      Math.max(0, wageGrowth - country.inflationTarget - 1) * 5 +
      Math.max(0, oilDelta) * 0.45 +
      Math.max(0, fxDelta) * 1.1
  );
  const monetaryTightness = clamp(35 + Math.max(0, realPolicyRate) * 10 + Math.max(0, -curveSlope) * 8 + policyRate * 1.8);
  const fiscalStress = clamp(20 + Math.max(0, debt - 60) * 0.42 + Math.max(0, -fiscalBalance - 3) * 7 + Math.max(0, realPolicyRate - nominalGrowthProxy / 3) * 5);
  const creditStress = clamp(
    28 + Math.max(0, -creditDelta) * 5 + Math.max(0, creditGrowth - 8) * 2 + Math.max(0, npl - 2) * 9 + Math.max(0, -curveSlope) * 5
  );
  const externalVulnerability = clamp(
    25 +
      Math.max(0, -currentAccount - 2) * 9 +
      Math.max(0, fxDelta) * 1.6 +
      Math.max(0, -reservesDelta) * 1.1 +
      Math.max(0, externalDebt - 80) * 0.18
  );
  const commodityExposure = clamp(
    25 +
      (country.commodityExposure === "importer" ? Math.max(0, oilDelta) * 0.9 : 0) +
      (country.commodityExposure === "exporter" ? Math.max(0, -oilDelta) * 0.6 : 0) +
      Math.max(0, cpi - country.inflationTarget) * 4
  );
  const geopoliticalRisk = clamp(
    26 +
      (country.incomeGroup === "High income" ? 4 : 14) +
      (country.region.includes("Latin") || country.region.includes("South") ? 8 : 0) +
      Math.max(0, externalVulnerability - 65) * 0.2
  );

  const overallRisk = clamp(
    growthMomentum * 0.14 +
      inflationPressure * 0.16 +
      monetaryTightness * 0.12 +
      fiscalStress * 0.15 +
      creditStress * 0.13 +
      externalVulnerability * 0.13 +
      commodityExposure * 0.08 +
      geopoliticalRisk * 0.09
  );

  return {
    countryCode: country.code,
    date: observations.at(-1)?.lastUpdated ?? new Date().toISOString(),
    growthMomentum: Number(growthMomentum.toFixed(1)),
    inflationPressure: Number(inflationPressure.toFixed(1)),
    monetaryTightness: Number(monetaryTightness.toFixed(1)),
    fiscalStress: Number(fiscalStress.toFixed(1)),
    creditStress: Number(creditStress.toFixed(1)),
    externalVulnerability: Number(externalVulnerability.toFixed(1)),
    commodityExposure: Number(commodityExposure.toFixed(1)),
    geopoliticalRisk: Number(geopoliticalRisk.toFixed(1)),
    overallRisk: Number(overallRisk.toFixed(1))
  };
}
