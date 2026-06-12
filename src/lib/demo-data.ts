import { COUNTRIES, INDICATORS } from "./constants";
import type { CountryCode, Frequency, Observation } from "./types";

export const DEMO_LAST_UPDATED = "2026-06-11T17:36:00-04:00";

type DemoProfile = Record<string, number>;

const countryProfiles: Record<CountryCode, DemoProfile> = {
  US: {
    GDP_GROWTH: 2.4,
    CPI: 3.1,
    UNEMPLOYMENT: 4.1,
    POLICY_RATE: 5.25,
    YIELD_10Y: 4.4,
    DEBT_GDP: 122,
    FISCAL_BALANCE: -6.2,
    CURRENT_ACCOUNT: -3.0,
    FX_USD: 102,
    WAGE_GROWTH: 4.2,
    CREDIT_GROWTH: 2.4,
    NPL: 1.2,
    RESERVES: 103,
    EXTERNAL_DEBT: 94
  },
  CA: {
    GDP_GROWTH: 1.4,
    CPI: 2.7,
    UNEMPLOYMENT: 6.1,
    POLICY_RATE: 4.75,
    YIELD_10Y: 3.5,
    DEBT_GDP: 107,
    FISCAL_BALANCE: -1.5,
    CURRENT_ACCOUNT: -0.8,
    FX_USD: 106,
    WAGE_GROWTH: 4.5,
    CREDIT_GROWTH: 1.6,
    NPL: 0.8,
    RESERVES: 99,
    EXTERNAL_DEBT: 118
  },
  EA: {
    GDP_GROWTH: 0.9,
    CPI: 2.5,
    UNEMPLOYMENT: 6.4,
    POLICY_RATE: 4.0,
    YIELD_10Y: 2.6,
    DEBT_GDP: 88,
    FISCAL_BALANCE: -3.2,
    CURRENT_ACCOUNT: 2.2,
    FX_USD: 104,
    WAGE_GROWTH: 4.1,
    CREDIT_GROWTH: 0.7,
    NPL: 2.0,
    RESERVES: 101,
    EXTERNAL_DEBT: 112
  },
  CN: {
    GDP_GROWTH: 4.7,
    CPI: 0.7,
    UNEMPLOYMENT: 5.1,
    POLICY_RATE: 3.1,
    YIELD_10Y: 2.3,
    DEBT_GDP: 84,
    FISCAL_BALANCE: -6.8,
    CURRENT_ACCOUNT: 1.4,
    FX_USD: 109,
    WAGE_GROWTH: 5.0,
    CREDIT_GROWTH: 7.2,
    NPL: 1.7,
    RESERVES: 98,
    EXTERNAL_DEBT: 15
  },
  JP: {
    GDP_GROWTH: 0.8,
    CPI: 2.8,
    UNEMPLOYMENT: 2.6,
    POLICY_RATE: 0.5,
    YIELD_10Y: 1.0,
    DEBT_GDP: 255,
    FISCAL_BALANCE: -4.4,
    CURRENT_ACCOUNT: 3.5,
    FX_USD: 116,
    WAGE_GROWTH: 3.0,
    CREDIT_GROWTH: 2.1,
    NPL: 1.1,
    RESERVES: 97,
    EXTERNAL_DEBT: 91
  },
  GB: {
    GDP_GROWTH: 1.1,
    CPI: 3.0,
    UNEMPLOYMENT: 4.4,
    POLICY_RATE: 5.0,
    YIELD_10Y: 4.2,
    DEBT_GDP: 101,
    FISCAL_BALANCE: -4.8,
    CURRENT_ACCOUNT: -2.5,
    FX_USD: 103,
    WAGE_GROWTH: 5.8,
    CREDIT_GROWTH: 0.9,
    NPL: 1.4,
    RESERVES: 100,
    EXTERNAL_DEBT: 287
  },
  DE: {
    GDP_GROWTH: 0.4,
    CPI: 2.3,
    UNEMPLOYMENT: 3.2,
    POLICY_RATE: 4.0,
    YIELD_10Y: 2.5,
    DEBT_GDP: 66,
    FISCAL_BALANCE: -2.5,
    CURRENT_ACCOUNT: 6.1,
    FX_USD: 104,
    WAGE_GROWTH: 4.0,
    CREDIT_GROWTH: -0.4,
    NPL: 1.2,
    RESERVES: 102,
    EXTERNAL_DEBT: 151
  },
  IN: {
    GDP_GROWTH: 6.7,
    CPI: 4.9,
    UNEMPLOYMENT: 7.2,
    POLICY_RATE: 6.5,
    YIELD_10Y: 7.0,
    DEBT_GDP: 82,
    FISCAL_BALANCE: -7.1,
    CURRENT_ACCOUNT: -1.4,
    FX_USD: 108,
    WAGE_GROWTH: 6.8,
    CREDIT_GROWTH: 11.5,
    NPL: 3.0,
    RESERVES: 105,
    EXTERNAL_DEBT: 21
  },
  BR: {
    GDP_GROWTH: 2.1,
    CPI: 4.2,
    UNEMPLOYMENT: 7.4,
    POLICY_RATE: 10.5,
    YIELD_10Y: 11.0,
    DEBT_GDP: 87,
    FISCAL_BALANCE: -7.5,
    CURRENT_ACCOUNT: -1.7,
    FX_USD: 112,
    WAGE_GROWTH: 6.2,
    CREDIT_GROWTH: 7.1,
    NPL: 3.4,
    RESERVES: 100,
    EXTERNAL_DEBT: 38
  },
  MX: {
    GDP_GROWTH: 1.9,
    CPI: 4.6,
    UNEMPLOYMENT: 2.8,
    POLICY_RATE: 11.0,
    YIELD_10Y: 9.7,
    DEBT_GDP: 50,
    FISCAL_BALANCE: -5.0,
    CURRENT_ACCOUNT: -0.4,
    FX_USD: 96,
    WAGE_GROWTH: 6.5,
    CREDIT_GROWTH: 5.3,
    NPL: 2.1,
    RESERVES: 102,
    EXTERNAL_DEBT: 42
  }
};

const commodityProfile: DemoProfile = {
  OIL: 81,
  GAS: 114,
  COPPER: 108,
  FOOD: 121
};

const indicatorSlope: Record<string, number> = {
  GDP_GROWTH: -0.08,
  CPI: -0.05,
  UNEMPLOYMENT: 0.03,
  POLICY_RATE: 0.02,
  YIELD_10Y: 0.03,
  DEBT_GDP: 1.2,
  FISCAL_BALANCE: -0.2,
  CURRENT_ACCOUNT: -0.04,
  FX_USD: 0.35,
  OIL: 0.8,
  GAS: 0.5,
  COPPER: 0.2,
  FOOD: 0.35,
  WAGE_GROWTH: -0.03,
  CREDIT_GROWTH: -0.1,
  NPL: 0.03,
  RESERVES: -0.08,
  EXTERNAL_DEBT: 0.5
};

const volatility: Record<string, number> = {
  GDP_GROWTH: 0.5,
  CPI: 0.3,
  UNEMPLOYMENT: 0.2,
  POLICY_RATE: 0.08,
  YIELD_10Y: 0.12,
  DEBT_GDP: 1.5,
  FISCAL_BALANCE: 0.35,
  CURRENT_ACCOUNT: 0.3,
  FX_USD: 1.4,
  OIL: 4,
  GAS: 5,
  COPPER: 3,
  FOOD: 2.5,
  WAGE_GROWTH: 0.25,
  CREDIT_GROWTH: 0.9,
  NPL: 0.12,
  RESERVES: 1.2,
  EXTERNAL_DEBT: 1.5
};

function datesForFrequency(frequency: Frequency) {
  if (frequency === "annual") {
    return ["2020", "2021", "2022", "2023", "2024", "2025"];
  }

  if (frequency === "quarterly") {
    return ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4", "2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1"];
  }

  return [
    "2024-01",
    "2024-02",
    "2024-03",
    "2024-04",
    "2024-05",
    "2024-06",
    "2024-07",
    "2024-08",
    "2024-09",
    "2024-10",
    "2024-11",
    "2024-12",
    "2025-01",
    "2025-02",
    "2025-03",
    "2025-04",
    "2025-05",
    "2025-06",
    "2025-07",
    "2025-08",
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05"
  ];
}

function demoLatestValue(countryCode: CountryCode, indicatorId: string) {
  return countryProfiles[countryCode][indicatorId] ?? commodityProfile[indicatorId] ?? 50;
}

function buildObservationSeries(countryCode: CountryCode, indicatorId: string): Observation[] {
  const indicator = INDICATORS.find((item) => item.id === indicatorId);

  if (!indicator) {
    return [];
  }

  const dates = datesForFrequency(indicator.frequency);
  const latest = demoLatestValue(countryCode, indicatorId);
  const slope = indicatorSlope[indicatorId] ?? 0;
  const wiggle = volatility[indicatorId] ?? 0.2;

  return dates.map((date, index) => {
    const distanceFromLatest = dates.length - index - 1;
    const wave = Math.sin(index * 1.4 + countryCode.charCodeAt(0)) * wiggle;
    const value = Math.max(0, latest - slope * distanceFromLatest + wave);

    return {
      countryCode,
      indicatorId,
      date,
      value: Number(value.toFixed(2)),
      source: indicator.source.includes("demo") ? "Demo data module" : `${indicator.source} via demo cache`,
      frequency: indicator.frequency,
      isDemo: true,
      lastUpdated: DEMO_LAST_UPDATED
    };
  });
}

export function getDemoObservations(countryCode: CountryCode, indicatorIds = INDICATORS.map((indicator) => indicator.id)) {
  return indicatorIds.flatMap((indicatorId) => buildObservationSeries(countryCode, indicatorId));
}

export function getDemoCountryObservationMap() {
  return Object.fromEntries(COUNTRIES.map((country) => [country.code, getDemoObservations(country.code)])) as Record<
    CountryCode,
    Observation[]
  >;
}

export function getDemoCommoditySeries() {
  return getDemoObservations("US", ["OIL", "GAS", "COPPER", "FOOD"]);
}

export function getDemoMarketSnapshot() {
  return [
    {
      label: "S&P 500 proxy",
      value: 5340,
      change: 4.2,
      unit: "index",
      source: "Demo market snapshot"
    },
    {
      label: "VIX proxy",
      value: 15.8,
      change: -1.1,
      unit: "index",
      source: "Demo market snapshot"
    },
    {
      label: "U.S. 10-year yield",
      value: 4.4,
      change: 0.3,
      unit: "%",
      source: "Demo market snapshot"
    },
    {
      label: "DXY proxy",
      value: 104.2,
      change: 2.1,
      unit: "index",
      source: "Demo market snapshot"
    }
  ];
}
