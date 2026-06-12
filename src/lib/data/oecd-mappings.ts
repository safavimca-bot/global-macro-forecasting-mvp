import type { Frequency } from "../types";

export const OECD_UNMAPPED_NOTE = "OECD API reachable, but this indicator is not mapped yet. Demo fallback is active.";

export interface OecdIndicatorMapping {
  indicatorId: string;
  indicatorName: string;
  country: string;
  countryCode: string;
  oecdCountryCode: string;
  developerApiDataUrl: string;
  exampleDeveloperApiDataUrl?: string;
  sourceName: string;
  seriesId: string;
  date: string;
  unit: string;
  frequency: Frequency;
}

export type OecdMappingRegistry = Partial<Record<string, OecdIndicatorMapping>>;

export function withCsvLabels(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("format", "csvfilewithlabels");
    return parsed.toString();
  } catch {
    if (url.includes("format=")) {
      return url;
    }

    const separator = url.includes("?") ? (url.endsWith("?") || url.endsWith("&") ? "" : "&") : "?";
    return `${url}${separator}format=csvfilewithlabels`;
  }
}

export const OECD_INDICATOR_MAPPINGS: OecdMappingRegistry = {
  GDP_GROWTH: {
    indicatorId: "GDP_GROWTH",
    indicatorName: "Real GDP growth",
    country: "United States",
    countryCode: "US",
    oecdCountryCode: "USA",
    developerApiDataUrl: withCsvLabels(
      "https://sdmx.oecd.org/public/rest/data/OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA,1.1/Q.Y.USA...B1GQ._Z...PC..G1.T0102?startPeriod=1947-Q1&endPeriod=2026-Q1&dimensionAtObservation=AllDimensions"
    ),
    sourceName: "OECD Data Explorer Developer API",
    seriesId: "OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA/Q.Y.USA...B1GQ._Z...PC..G1.T0102",
    date: "",
    unit: "% y/y",
    frequency: "quarterly"
  },
  CPI: {
    indicatorId: "CPI",
    indicatorName: "Headline CPI inflation",
    country: "United States",
    countryCode: "US",
    oecdCountryCode: "USA",
    developerApiDataUrl:
      "https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/USA.M.N.CPI.PA._T.N.GY?startPeriod=2025-05&dimensionAtObservation=AllDimensions&format=csvfilewithlabels",
    exampleDeveloperApiDataUrl:
      "https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_RHPI_TARGET@DF_RHPI_TARGET,1.0/COU.USA.M.RHPI...GY..?startPeriod=0001-04&dimensionAtObservation=AllDimensions&format=csvfilewithlabels",
    sourceName: "OECD Data Explorer Developer API",
    seriesId: "OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL/USA.M.N.CPI.PA._T.N.GY",
    date: "",
    unit: "% y/y",
    frequency: "monthly"
  },
  UNEMPLOYMENT: {
    indicatorId: "UNEMPLOYMENT",
    indicatorName: "Unemployment rate",
    country: "United States",
    countryCode: "US",
    oecdCountryCode: "USA",
    developerApiDataUrl: withCsvLabels(
      "https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0/USA.UNE_LF_M.._Z.Y._T.Y_GE15..M?startPeriod=2025-05&dimensionAtObservation=AllDimensions"
    ),
    sourceName: "OECD Data Explorer Developer API",
    seriesId: "OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M/USA.UNE_LF_M.._Z.Y._T.Y_GE15..M",
    date: "",
    unit: "%",
    frequency: "monthly"
  },
  YIELD_10Y: {
    indicatorId: "YIELD_10Y",
    indicatorName: "10-year government yield",
    country: "United States",
    countryCode: "US",
    oecdCountryCode: "USA",
    developerApiDataUrl: withCsvLabels(
      "https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_FINMARK,4.0/USA.M.IRLT.PA.....?startPeriod=2026-01&dimensionAtObservation=AllDimensions"
    ),
    sourceName: "OECD Data Explorer Developer API",
    seriesId: "OECD.SDD.STES,DSD_STES@DF_FINMARK/USA.M.IRLT.PA.....",
    date: "",
    unit: "%",
    frequency: "monthly"
  }
};

export function isOecdMappingConfigured(mapping?: OecdIndicatorMapping) {
  return Boolean(mapping?.developerApiDataUrl.trim());
}
