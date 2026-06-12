import { COUNTRIES, DISCLAIMER, getCountry, INDICATORS } from "../constants";
import { generateCountryReport } from "../ai-report";
import { getDemoCommoditySeries, getDemoMarketSnapshot, getDemoObservations } from "../demo-data";
import { latestValue, riskEntries, seriesFor } from "../format";
import { classifyMacroRegime } from "../regime";
import { calculateRiskScores } from "../scoring";
import type { CountryCode, CountryMacroView, Observation } from "../types";
import { LIVE_SOURCE_PRIORITY_BY_INDICATOR, dataAdapters } from "./adapters";

export async function getCountryMacroView(countryCode: string, options: { useOpenAI?: boolean } = {}): Promise<CountryMacroView | undefined> {
  const country = getCountry(countryCode);

  if (!country) {
    return undefined;
  }

  const observations = getDemoObservations(country.code);
  const scores = calculateRiskScores(country, observations);
  const regime = classifyMacroRegime(country, observations, scores);
  const outlook = await generateCountryReport(country, observations, scores, regime, options);

  return {
    country,
    observations,
    scores,
    regime,
    outlook,
    dataMode: "demo",
    dataTimestamp: observations.at(-1)?.lastUpdated ?? new Date().toISOString()
  };
}

export async function getAllCountryViews() {
  return Promise.all(COUNTRIES.map((country) => getCountryMacroView(country.code, { useOpenAI: false }))).then((views) =>
    views.filter(Boolean) as CountryMacroView[]
  );
}

export async function getGlobalDashboard() {
  const countries = await getAllCountryViews();
  const averageRisk = countries.reduce((total, item) => total + item.scores.overallRisk, 0) / countries.length;
  const highestInflation = [...countries].sort((a, b) => b.scores.inflationPressure - a.scores.inflationPressure).slice(0, 5);
  const highestFiscal = [...countries].sort((a, b) => b.scores.fiscalStress - a.scores.fiscalStress).slice(0, 5);
  const highestExternal = [...countries].sort((a, b) => b.scores.externalVulnerability - a.scores.externalVulnerability).slice(0, 5);
  const commoditySeries = getDemoCommoditySeries();

  return {
    countries,
    averageRisk: Number(averageRisk.toFixed(1)),
    regimeCounts: countries.reduce<Record<string, number>>((counts, item) => {
      counts[item.regime.regime] = (counts[item.regime.regime] ?? 0) + 1;
      return counts;
    }, {}),
    highestInflation,
    highestFiscal,
    highestExternal,
    commoditySeries,
    marketSnapshot: getDemoMarketSnapshot(),
    outlook:
      averageRisk >= 60
        ? `Global risk is elevated in demo mode, with fiscal and inflation pressure driving cross-country dispersion. ${DISCLAIMER}`
        : `Global risk is moderate in demo mode, with country-specific fiscal and external vulnerabilities still worth monitoring. ${DISCLAIMER}`
  };
}

export async function getDataSourceHealth() {
  return Promise.all(dataAdapters.map((adapter) => adapter.healthCheck()));
}

export function getIndicatorSeries(observations: Observation[], indicatorId: string) {
  return seriesFor(observations, indicatorId).map((point) => ({
    date: point.date,
    value: point.value,
    source: point.source,
    isDemo: point.isDemo
  }));
}

export async function getTrackerRows(indicatorId: string) {
  const views = await getAllCountryViews();

  return views
    .map((view) => ({
      country: view.country,
      value: latestValue(view.observations, indicatorId),
      score:
        indicatorId === "CPI"
          ? view.scores.inflationPressure
          : indicatorId === "POLICY_RATE"
            ? view.scores.monetaryTightness
            : indicatorId === "DEBT_GDP" || indicatorId === "FISCAL_BALANCE"
              ? view.scores.fiscalStress
              : indicatorId === "CREDIT_GROWTH" || indicatorId === "NPL"
                ? view.scores.creditStress
                : indicatorId === "CURRENT_ACCOUNT" || indicatorId === "FX_USD"
                  ? view.scores.externalVulnerability
                  : view.scores.overallRisk,
      regime: view.regime.regime
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function chartDataFromScores(view: CountryMacroView) {
  return riskEntries(view.scores).map(([name, score]) => ({
    name,
    score
  }));
}

export function sourceCoverageRows() {
  return INDICATORS.map((indicator) => ({
    ...indicator,
    coverage: indicator.source.includes("demo")
      ? "All MVP countries in demo cache"
      : `Live where adapter and country coverage are available. Preferred source order: ${(LIVE_SOURCE_PRIORITY_BY_INDICATOR[indicator.id] ?? ["Configured live adapter", "Demo fallback"]).join(" -> ")}`
  }));
}

export function countryCodes(): CountryCode[] {
  return COUNTRIES.map((country) => country.code);
}
