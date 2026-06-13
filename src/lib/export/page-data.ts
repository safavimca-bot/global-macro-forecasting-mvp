import { getCountry, getIndicator } from "@/lib/constants";
import { riskEntries } from "@/lib/format";
import type { AdapterHealth, Country, CountryMacroView, ForecastPoint, MacroRegime, Observation } from "@/lib/types";

export interface TrackerExportInput {
  country: Country;
  value?: number;
  score: number;
  regime: MacroRegime["regime"];
}

function statusFromObservation(observation: Observation) {
  return observation.liveDemoStatus ?? (observation.isDemo ? "demo" : "live");
}

export function observationExportRows(observations: Observation[], indicatorIds?: string[]) {
  const allowed = indicatorIds ? new Set(indicatorIds) : undefined;

  return observations
    .filter((observation) => !allowed || allowed.has(observation.indicatorId))
    .map((observation) => {
      const country = getCountry(observation.countryCode);
      const indicator = getIndicator(observation.indicatorId);

      return {
        record_type: "observation",
        country_code: observation.countryCode,
        country_name: observation.country ?? country?.name ?? observation.countryCode,
        indicator_id: observation.indicatorId,
        indicator_name: observation.indicatorName ?? indicator?.name ?? observation.indicatorId,
        date: observation.date,
        value: observation.value,
        unit: observation.unit ?? indicator?.unit ?? "",
        frequency: observation.frequency,
        source_name: observation.sourceName ?? observation.source,
        source: observation.source,
        endpoint: observation.endpoint ?? "",
        series_id: observation.seriesId ?? "",
        live_demo_status: statusFromObservation(observation),
        is_demo: observation.isDemo,
        last_updated: observation.lastUpdated
      };
    });
}

export function countryProfileExportRows(view: CountryMacroView) {
  const scoreRows = riskEntries(view.scores).map(([label, score]) => ({
    record_type: "risk_score",
    country_code: view.country.code,
    country_name: view.country.name,
    indicator_id: `RISK_${label.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
    indicator_name: `${label} risk score`,
    date: view.scores.date,
    value: score,
    unit: "0-100 score",
    frequency: "mixed",
    source_name: "Global Macro Outlook AI scoring engine",
    source: "Rule-based scoring",
    endpoint: "",
    series_id: "",
    live_demo_status: view.dataMode,
    is_demo: view.dataMode === "demo",
    last_updated: view.dataTimestamp
  }));

  const regimeRow = {
    record_type: "regime",
    country_code: view.country.code,
    country_name: view.country.name,
    indicator_id: "MACRO_REGIME",
    indicator_name: "Macro regime classification",
    date: view.scores.date,
    value: view.regime.confidence,
    unit: "confidence share",
    frequency: "mixed",
    source_name: "Global Macro Outlook AI regime engine",
    source: view.regime.regime,
    endpoint: "",
    series_id: "",
    live_demo_status: view.dataMode,
    is_demo: view.dataMode === "demo",
    last_updated: view.dataTimestamp
  };

  return [...observationExportRows(view.observations), ...scoreRows, regimeRow];
}

export function countryRiskHeatmapRows(views: CountryMacroView[]) {
  return views.map((view) => ({
    country_code: view.country.code,
    country_name: view.country.name,
    region: view.country.region,
    income_group: view.country.incomeGroup,
    regime: view.regime.regime,
    regime_confidence: view.regime.confidence,
    overall_risk: view.scores.overallRisk,
    growth_momentum: view.scores.growthMomentum,
    inflation_pressure: view.scores.inflationPressure,
    monetary_tightness: view.scores.monetaryTightness,
    fiscal_stress: view.scores.fiscalStress,
    credit_stress: view.scores.creditStress,
    external_vulnerability: view.scores.externalVulnerability,
    commodity_exposure: view.scores.commodityExposure,
    geopolitical_risk: view.scores.geopoliticalRisk,
    data_status: view.dataMode,
    last_updated: view.dataTimestamp
  }));
}

export function regimeMixRows(regimeCounts: Record<string, number>) {
  return Object.entries(regimeCounts).map(([regime, count]) => ({
    regime,
    country_count: count
  }));
}

export function trackerExportRows(rows: TrackerExportInput[], indicatorId: string, unit = "%") {
  const indicator = getIndicator(indicatorId);

  return rows.map((row) => ({
    country_code: row.country.code,
    country_name: row.country.name,
    region: row.country.region,
    indicator_id: indicatorId,
    indicator_name: indicator?.name ?? indicatorId,
    latest_value: row.value ?? "",
    unit: indicator?.unit ?? unit,
    risk_score: row.score,
    regime: row.regime,
    data_status: "demo"
  }));
}

export function forecastExportRows(input: Observation[], forecast: ForecastPoint[], model: string, scenarioName = "baseline") {
  const inputRows = observationExportRows(input, ["CPI"]).map((row) => ({
    ...row,
    model,
    scenario_name: scenarioName,
    forecast_record_type: "input"
  }));

  const outputRows = forecast.map((point) => ({
    record_type: "forecast",
    country_code: input.at(-1)?.countryCode ?? "US",
    country_name: getCountry(input.at(-1)?.countryCode ?? "US")?.name ?? "United States",
    indicator_id: "CPI",
    indicator_name: "Headline CPI inflation",
    date: String(point.date ?? ""),
    value: point.baseline ?? "",
    unit: "% y/y",
    frequency: "monthly",
    source_name: "Global Macro Outlook AI forecasting lab",
    source: model,
    endpoint: "",
    series_id: "",
    live_demo_status: input.some((item) => !item.isDemo) ? "mixed" : "demo",
    is_demo: input.every((item) => item.isDemo),
    last_updated: new Date().toISOString(),
    model,
    scenario_name: scenarioName,
    forecast_record_type: "output",
    baseline: point.baseline ?? "",
    optimistic: point.optimistic ?? "",
    pessimistic: point.pessimistic ?? "",
    lower_band: point.lowerBand ?? "",
    upper_band: point.upperBand ?? "",
    explanation: point.explanation ?? ""
  }));

  return [...inputRows, ...outputRows];
}

export function adapterHealthExportRows(health: AdapterHealth[]) {
  return health.map((source) => ({
    source: source.name,
    status: source.status,
    status_category: source.statusCategory ?? source.status,
    mode: source.mode,
    frequency: source.frequency,
    coverage: source.coverage,
    notes: source.notes,
    endpoint: source.endpoint ?? "",
    developer_api_data_url: source.developerApiDataUrl ?? "",
    source_name: source.sourceName ?? source.name,
    series_id: source.seriesId ?? "",
    latest_data_date: source.latestDataDate ?? "",
    unit: source.unit ?? "",
    live_demo_status: source.liveDemoStatus ?? source.mode,
    http_status: source.httpStatus ?? "",
    response_content_type: source.responseContentType ?? "",
    parser_error: source.parserError ?? "",
    fallback_reason: source.fallbackReason ?? "",
    last_updated: source.lastUpdated ?? source.latestSuccessfulUpdate ?? "",
    response_body_preview: source.responseBodyPreview ?? ""
  }));
}

export function aiReportExportData(view: CountryMacroView) {
  return {
    country: view.country,
    scores: view.scores,
    regime: view.regime,
    observations: observationExportRows(view.observations),
    report: view.outlook,
    reportNotice: "AI-generated text is for research support only and is not an official forecast.",
    dataMode: view.dataMode,
    dataTimestamp: view.dataTimestamp
  };
}
