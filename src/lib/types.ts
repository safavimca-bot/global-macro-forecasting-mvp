export type CountryCode =
  | "US"
  | "CA"
  | "EA"
  | "CN"
  | "JP"
  | "GB"
  | "DE"
  | "IN"
  | "BR"
  | "MX";

export type IndicatorCategory =
  | "growth"
  | "inflation"
  | "labor"
  | "monetary"
  | "fiscal"
  | "credit"
  | "external"
  | "commodity"
  | "market"
  | "structural";

export type Frequency = "daily" | "weekly" | "monthly" | "quarterly" | "annual";

export type DataMode = "live" | "mixed" | "demo";

export type AdapterStatusCategory = "healthy" | "degraded" | "mapping-error" | "parser-error" | "network-error" | "unmapped";

export interface Country {
  code: CountryCode;
  wbCode: string;
  name: string;
  region: string;
  incomeGroup: string;
  currency: string;
  centralBank: string;
  inflationTarget: number;
  commodityExposure: "importer" | "exporter" | "mixed";
}

export interface Indicator {
  id: string;
  name: string;
  category: IndicatorCategory;
  unit: string;
  frequency: Frequency;
  source: string;
  description: string;
}

export interface Observation {
  countryCode: CountryCode;
  indicatorId: string;
  indicatorName?: string;
  country?: string;
  date: string;
  value: number;
  source: string;
  sourceName?: string;
  endpoint?: string;
  developerApiDataUrl?: string;
  exampleDeveloperApiDataUrl?: string;
  seriesId?: string;
  unit?: string;
  frequency: Frequency;
  isDemo: boolean;
  liveDemoStatus?: DataMode;
  lastUpdated: string;
}

export interface RiskScore {
  countryCode: CountryCode;
  date: string;
  growthMomentum: number;
  inflationPressure: number;
  monetaryTightness: number;
  fiscalStress: number;
  creditStress: number;
  externalVulnerability: number;
  commodityExposure: number;
  geopoliticalRisk: number;
  overallRisk: number;
}

export interface MacroRegime {
  countryCode: CountryCode;
  regime:
    | "Expansion"
    | "Slowdown"
    | "Recession risk"
    | "Stagflation"
    | "Disinflationary growth"
    | "Credit stress"
    | "External stress"
    | "Fiscal stress";
  confidence: number;
  explanation: string;
}

export interface ForecastPoint {
  date: string;
  baseline: number;
  optimistic: number;
  pessimistic: number;
  lowerBand: number;
  upperBand: number;
  explanation: string;
}

export interface CountryMacroView {
  country: Country;
  observations: Observation[];
  scores: RiskScore;
  regime: MacroRegime;
  outlook: string;
  dataMode: DataMode;
  dataTimestamp: string;
}

export interface AdapterHealth {
  name: string;
  status: "healthy" | "degraded" | "unavailable";
  statusCategory?: AdapterStatusCategory;
  latestSuccessfulUpdate?: string;
  indicatorName?: string;
  country?: string;
  endpoint?: string;
  developerApiDataUrl?: string;
  exampleDeveloperApiDataUrl?: string;
  sourceName?: string;
  seriesId?: string;
  latestDataDate?: string;
  unit?: string;
  lastUpdated?: string;
  liveDemoStatus?: DataMode;
  httpStatus?: string;
  responseContentType?: string;
  responseBodyPreview?: string;
  detectedCsvHeaders?: string[];
  latestObservation?: {
    date: string;
    value: number;
    unit?: string;
  };
  parserError?: string;
  fallbackReason?: string;
  adapterDetails?: string[];
  frequency: Frequency | "mixed";
  coverage: string;
  notes: string;
  mode: DataMode;
}

export interface DataAdapterParams {
  countryCode: CountryCode;
  indicatorId: string;
  startDate?: string;
  endDate?: string;
}

export interface DataAdapter {
  name: string;
  fetchSeries(params: DataAdapterParams): Promise<Observation[]>;
  searchIndicators(query: string): Promise<Indicator[]>;
  healthCheck(): Promise<AdapterHealth>;
}
