import { COUNTRIES, INDICATORS } from "../constants";
import { DEMO_LAST_UPDATED, getDemoObservations } from "../demo-data";
import type { AdapterHealth, AdapterStatusCategory, CountryCode, DataAdapter, DataAdapterParams, Frequency, Indicator, Observation } from "../types";
import {
  OECD_INDICATOR_MAPPINGS,
  OECD_UNMAPPED_NOTE,
  isOecdMappingConfigured,
  type OecdIndicatorMapping,
  type OecdMappingRegistry
} from "./oecd-mappings";

const HEALTH_REVALIDATE_SECONDS = 60 * 15;
const IMF_BLOCKED_MESSAGE = "IMF DataMapper blocked the server request with HTTP 403. Demo fallback is active.";

export const LIVE_SOURCE_PRIORITY_BY_INDICATOR: Partial<Record<string, string[]>> = {
  GDP_GROWTH: ["FRED for U.S. quarterly proxies where configured", "World Bank annual GDP growth", "OECD Data Explorer where mapped", "IMF DataMapper optional/secondary", "Demo fallback"],
  CPI: ["FRED for U.S. inflation where configured", "BLS for U.S. CPI where configured", "OECD Data Explorer where mapped", "IMF DataMapper optional/secondary", "Demo fallback"],
  UNEMPLOYMENT: ["FRED for U.S. unemployment where configured", "BLS for U.S. unemployment where configured", "OECD Data Explorer where mapped", "IMF DataMapper optional/secondary", "Demo fallback"],
  POLICY_RATE: ["FRED for U.S. rates where configured", "Bank of Canada for Canadian rates", "BIS/OECD where mapped", "Demo fallback"],
  YIELD_10Y: ["FRED for U.S. 10-year yields where configured", "OECD Data Explorer where mapped", "Demo fallback"],
  CURRENT_ACCOUNT: ["World Bank annual current-account indicators", "IMF DataMapper optional/secondary", "Demo fallback"]
};

function envValue(name: string) {
  return process.env[name]?.trim();
}

function missingKey(name: string) {
  return `Missing ${name}. Add it to .env.local to enable this live adapter. Demo data remains available.`;
}

function countryFromWbCode(wbCode: string): CountryCode | undefined {
  return COUNTRIES.find((country) => country.wbCode === wbCode)?.code;
}

function health(
  name: string,
  status: AdapterHealth["status"],
  frequency: AdapterHealth["frequency"],
  coverage: string,
  notes: string,
  mode: AdapterHealth["mode"],
  extra: Partial<AdapterHealth> = {}
): AdapterHealth {
  return {
    name,
    status,
    frequency,
    coverage,
    notes,
    mode,
    ...extra
  };
}

async function fetchWithRetry(input: string | URL, init?: RequestInit & { next?: { revalidate: number } }, attempts = 2) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });

      if (response.ok || attempt === attempts - 1) {
        return response;
      }
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError) {
    throw lastError;
  }

  return fetch(input, init);
}

async function liveHealthCheck(url: string | URL, init?: RequestInit & { next?: { revalidate: number } }) {
  try {
    const response = await fetchWithRetry(url, init ?? { next: { revalidate: HEALTH_REVALIDATE_SECONDS } });

    if (!response.ok) {
      return { ok: false, message: `Live check returned HTTP ${response.status}. Demo fallback is active.` };
    }

    return { ok: true, message: "Live API connected." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    return { ok: false, message: `Live check failed: ${message}. Demo fallback is active.` };
  }
}

function indicator(id: string) {
  return INDICATORS.find((item) => item.id === id);
}

function compactDate(date: string) {
  return date.length >= 10 ? date.slice(0, 10) : date;
}

function parseCsvCells(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];

    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      row.push(current.trim());
      current = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];

      if (char === "\r" && csv[index + 1] === "\n") {
        index += 1;
      }
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function parseCsvTable(csv: string) {
  const [headers = [], ...lines] = parseCsvCells(csv);

  return {
    headers,
    rows: lines
      .filter((line) => line.some((cell) => cell.length > 0))
      .map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ""])))
  };
}

function parseCsvRows(csv: string) {
  return parseCsvTable(csv).rows;
}

function normalizeHeader(header: string) {
  return header.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function findCsvColumn(headers: string[], exactMatches: string[], fallback: (normalizedHeader: string) => boolean) {
  const exact = headers.find((header) => exactMatches.some((candidate) => header.toLowerCase() === candidate.toLowerCase()));

  if (exact) {
    return exact;
  }

  return headers.find((header) => fallback(normalizeHeader(header)));
}

function numberFromCsvValue(value: string | undefined) {
  if (value === undefined) {
    return Number.NaN;
  }

  return Number(value.replace(/,/g, "").trim());
}

function firstNonEmptyValue(record: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (record[key]?.trim()) {
      return record[key].trim();
    }
  }

  return undefined;
}

function responseContentType(response: Response) {
  return response.headers?.get("content-type") ?? "unknown";
}

function responseStatusText(response: Response) {
  return `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
}

function responsePreview(body: string) {
  return body.trim().slice(0, 500);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function freshOecdUrlInstruction(indicatorName: string) {
  return `Selected series URL may be invalid. Please copy a fresh OECD Developer API Flat Data query URL for ${indicatorName}: OECD Data Explorer -> select indicator filters -> Developer API -> Flat -> Copy code.`;
}

function firstValue(record: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== "") {
      return record[key];
    }
  }

  return undefined;
}

function latestMetadata(rows: Observation[], endpoint: string, seriesId: string, unit: string): Partial<AdapterHealth> {
  const latest = rows.at(-1);

  return {
    endpoint,
    seriesId,
    latestDataDate: latest?.date,
    unit,
    lastUpdated: latest?.lastUpdated,
    latestSuccessfulUpdate: latest?.lastUpdated
  };
}

export class DemoDataAdapter implements DataAdapter {
  name = "Demo data";

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    return getDemoObservations(params.countryCode, [params.indicatorId]);
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter(
      (item) =>
        item.id.toLowerCase().includes(normalized) || item.name.toLowerCase().includes(normalized) || item.category.toLowerCase().includes(normalized)
    );
  }

  async healthCheck(): Promise<AdapterHealth> {
    return health(
      this.name,
      "healthy",
      "mixed",
      "All MVP countries and core indicators",
      "Safe deterministic fallback data is loaded locally. This source is always available.",
      "demo",
      {
        endpoint: "src/lib/demo-data.ts",
        seriesId: "local demo cache",
        unit: "mixed",
        latestDataDate: "2026-05",
        lastUpdated: DEMO_LAST_UPDATED,
        latestSuccessfulUpdate: DEMO_LAST_UPDATED
      }
    );
  }
}

export class WorldBankAdapter implements DataAdapter {
  name = "World Bank API";

  private indicatorMap: Record<string, string> = {
    GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
    CPI: "FP.CPI.TOTL.ZG",
    UNEMPLOYMENT: "SL.UEM.TOTL.ZS",
    CURRENT_ACCOUNT: "BN.CAB.XOKA.GD.ZS",
    EXTERNAL_DEBT: "DT.DOD.DECT.GN.ZS",
    RESERVES: "FI.RES.TOTL.CD"
  };

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    const country = COUNTRIES.find((item) => item.code === params.countryCode);
    const wbIndicator = this.indicatorMap[params.indicatorId];
    const meta = indicator(params.indicatorId);

    if (!country || !wbIndicator || !meta) {
      return [];
    }

    const url = `https://api.worldbank.org/v2/country/${country.wbCode}/indicator/${wbIndicator}?format=json&per_page=80`;
    const response = await fetchWithRetry(url, { next: { revalidate: 60 * 60 * 24 } });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as [unknown, Array<{ countryiso3code: string; date: string; value: number | null }>];
    const rows = Array.isArray(payload?.[1]) ? payload[1] : [];

    return rows
      .filter((row) => row.value !== null && countryFromWbCode(row.countryiso3code))
      .map((row) => ({
        countryCode: params.countryCode,
        indicatorId: params.indicatorId,
        date: row.date,
        value: Number(row.value),
        source: "World Bank API",
        frequency: meta.frequency,
        isDemo: false,
        lastUpdated: new Date().toISOString()
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => item.source.includes("World Bank") && item.name.toLowerCase().includes(normalized));
  }

  async healthCheck(): Promise<AdapterHealth> {
    const endpoint = "https://api.worldbank.org/v2/country/USA/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=1";
    const check = await liveHealthCheck(endpoint);
    const now = new Date().toISOString();

    return health(
      this.name,
      check.ok ? "healthy" : "degraded",
      "annual",
      "No-key global annual macro indicators for MVP countries where World Bank coverage exists",
      check.ok ? "Live API connected. Demo data is still available as fallback." : check.message,
      check.ok ? "live" : "demo",
      {
        endpoint,
        seriesId: "NY.GDP.MKTP.KD.ZG",
        unit: "% y/y",
        lastUpdated: now,
        ...(check.ok ? { latestSuccessfulUpdate: now } : {})
      }
    );
  }
}

export class BankOfCanadaAdapter implements DataAdapter {
  name = "Bank of Canada Valet API";

  private seriesMap: Record<string, { series: string; frequency: Frequency }> = {
    FX_USD: { series: "FXUSDCAD", frequency: "daily" },
    POLICY_RATE: { series: "V39079", frequency: "daily" }
  };

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    const mapped = this.seriesMap[params.indicatorId];

    if (params.countryCode !== "CA" || !mapped) {
      return [];
    }

    const response = await fetchWithRetry(`https://www.bankofcanada.ca/valet/observations/${mapped.series}/json?recent=120`, {
      next: { revalidate: 60 * 60 * 6 }
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { observations?: Array<{ d: string } & Record<string, { v?: string }>> };

    return (payload.observations ?? [])
      .map((row) => ({
        countryCode: params.countryCode,
        indicatorId: params.indicatorId,
        date: row.d,
        value: Number(row[mapped.series]?.v),
        source: "Bank of Canada Valet API",
        frequency: mapped.frequency,
        isDemo: false,
        lastUpdated: new Date().toISOString()
      }))
      .filter((row) => Number.isFinite(row.value));
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => item.source.includes("Central banks") && item.name.toLowerCase().includes(normalized));
  }

  async healthCheck(): Promise<AdapterHealth> {
    const endpoint = "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1";
    const check = await liveHealthCheck(endpoint);
    const now = new Date().toISOString();

    return health(
      this.name,
      check.ok ? "healthy" : "degraded",
      "daily",
      "Canadian exchange rates and selected Bank of Canada financial series",
      check.ok ? "Live API connected. Canada FX/policy-rate requests can use Valet data with demo fallback." : check.message,
      check.ok ? "live" : "demo",
      {
        endpoint,
        seriesId: "FXUSDCAD",
        unit: "CAD per USD",
        lastUpdated: now,
        ...(check.ok ? { latestSuccessfulUpdate: now } : {})
      }
    );
  }
}

export class StatCanAdapter implements DataAdapter {
  name = "Statistics Canada WDS";

  async fetchSeries(): Promise<Observation[]> {
    return [];
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => item.source.includes("demo cache") && item.name.toLowerCase().includes(normalized));
  }

  async healthCheck(): Promise<AdapterHealth> {
    const endpoint = "https://www150.statcan.gc.ca/t1/wds/rest/getCodeSets";
    const check = await liveHealthCheck(endpoint);
    const now = new Date().toISOString();

    return health(
      this.name,
      check.ok ? "healthy" : "degraded",
      "mixed",
      "No-key Statistics Canada WDS service. Indicator-specific vector mappings are not yet wired into dashboard series.",
      check.ok
        ? "Live WDS API connected. The MVP still uses demo fallback until StatCan vector IDs are mapped per indicator."
        : check.message,
      check.ok ? "live" : "demo",
      {
        endpoint,
        seriesId: "getCodeSets health check",
        unit: "metadata",
        lastUpdated: now,
        ...(check.ok ? { latestSuccessfulUpdate: now } : {})
      }
    );
  }
}

export class EcbEurostatAdapter implements DataAdapter {
  name = "ECB / Eurostat";

  async fetchSeries(): Promise<Observation[]> {
    return [];
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => item.name.toLowerCase().includes(normalized));
  }

  async healthCheck(): Promise<AdapterHealth> {
    const endpoint = "https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=jsondata";
    const check = await liveHealthCheck(endpoint);
    const now = new Date().toISOString();

    return health(
      this.name,
      check.ok ? "healthy" : "degraded",
      "mixed",
      "No-key ECB Data Portal live check for euro-area financial data; Eurostat can be added with dataset-specific mappings.",
      check.ok ? "Live ECB API connected. Dashboard uses demo fallback until ECB/Eurostat indicator mappings are expanded." : check.message,
      check.ok ? "live" : "demo",
      {
        endpoint,
        seriesId: "EXR/D.USD.EUR.SP00.A",
        unit: "EUR/USD exchange rate",
        lastUpdated: now,
        ...(check.ok ? { latestSuccessfulUpdate: now } : {})
      }
    );
  }
}

type ImfSeriesMapping = {
  indicatorId: string;
  indicatorName: string;
  seriesId: string;
  unit: string;
  frequency: Frequency;
};

export class ImfAdapter implements DataAdapter {
  name = "IMF Data";

  private baseUrl = "https://www.imf.org/external/datamapper/api/v1/";

  private countryMap: Partial<Record<CountryCode, string>> = {
    US: "USA",
    CA: "CAN",
    EA: "EAQ",
    CN: "CHN",
    JP: "JPN",
    GB: "GBR",
    DE: "DEU",
    IN: "IND",
    BR: "BRA",
    MX: "MEX"
  };

  private seriesMap: Partial<Record<string, ImfSeriesMapping>> = {
    GDP_GROWTH: { indicatorId: "GDP_GROWTH", indicatorName: "Real GDP growth", seriesId: "NGDP_RPCH", unit: "% y/y", frequency: "annual" },
    CPI: { indicatorId: "CPI", indicatorName: "Inflation", seriesId: "PCPIPCH", unit: "% y/y", frequency: "annual" },
    UNEMPLOYMENT: { indicatorId: "UNEMPLOYMENT", indicatorName: "Unemployment rate", seriesId: "LUR", unit: "%", frequency: "annual" },
    CURRENT_ACCOUNT: { indicatorId: "CURRENT_ACCOUNT", indicatorName: "Current account balance", seriesId: "BCA_NGDPD", unit: "% of GDP", frequency: "annual" }
  };

  private healthIndicatorIds = ["GDP_GROWTH", "CPI", "UNEMPLOYMENT", "CURRENT_ACCOUNT"];

  private endpoint(seriesId: string, countryCode: string) {
    return `${this.baseUrl}${seriesId}/${countryCode}`;
  }

  private parseJsonResponse(body: string) {
    try {
      return { payload: JSON.parse(body) as unknown };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown JSON parse error.";
      return { parserError: `IMF response was not valid JSON: ${message}` };
    }
  }

  private dataMapFromPayload(payload: unknown, seriesId: string, countryCode: string) {
    if (!isRecord(payload)) {
      return undefined;
    }

    const values = isRecord(payload.values) ? payload.values : undefined;

    if (!values) {
      return undefined;
    }

    const seriesFirst = isRecord(values[seriesId]) ? values[seriesId] : undefined;
    const countryFirst = isRecord(values[countryCode]) ? values[countryCode] : undefined;
    const seriesCountryValues = seriesFirst && isRecord(seriesFirst[countryCode]) ? seriesFirst[countryCode] : undefined;
    const countrySeriesValues = countryFirst && isRecord(countryFirst[seriesId]) ? countryFirst[seriesId] : undefined;

    if (seriesCountryValues) {
      return seriesCountryValues;
    }

    if (countrySeriesValues) {
      return countrySeriesValues;
    }

    if (seriesFirst && Object.values(seriesFirst).some((value) => typeof value === "number" || typeof value === "string" || value === null)) {
      return seriesFirst;
    }

    return undefined;
  }

  private parseDataMapperJson(payload: unknown, params: DataAdapterParams, mappedCountry: string, mappedSeries: ImfSeriesMapping, endpoint: string) {
    const values = this.dataMapFromPayload(payload, mappedSeries.seriesId, mappedCountry);
    const lastUpdated = new Date().toISOString();

    if (!values) {
      return {
        rows: [],
        parserError: `IMF DataMapper response did not include values for series ${mappedSeries.seriesId} and country ${mappedCountry}.`
      };
    }

    const rows = Object.entries(values)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .map(([date, value]): Observation => ({
        countryCode: params.countryCode,
        indicatorId: params.indicatorId,
        indicatorName: mappedSeries.indicatorName,
        country: mappedCountry,
        date,
        value: Number(String(value).replace(/,/g, "")),
        source: "IMF DataMapper API",
        sourceName: "IMF DataMapper API",
        endpoint,
        seriesId: mappedSeries.seriesId,
        unit: mappedSeries.unit,
        frequency: mappedSeries.frequency,
        isDemo: false,
        liveDemoStatus: "live",
        lastUpdated
      }))
      .filter((row) => row.date && Number.isFinite(row.value))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!rows.length) {
      return {
        rows,
        parserError: `IMF DataMapper response included ${mappedSeries.seriesId}/${mappedCountry}, but no numeric observations were found.`
      };
    }

    return { rows };
  }

  private async fetchLiveSeries(
    params: DataAdapterParams
  ): Promise<{
    rows: Observation[];
    error?: string;
    endpoint?: string;
    seriesId?: string;
    unit?: string;
    indicatorName?: string;
    country?: string;
    statusCategory: AdapterStatusCategory;
    httpStatus?: string;
    responseContentType?: string;
    responseBodyPreview?: string;
    parserError?: string;
    fallbackReason?: string;
    latestObservation?: AdapterHealth["latestObservation"];
  }> {
    const mappedCountry = this.countryMap[params.countryCode];
    const mappedSeries = this.seriesMap[params.indicatorId];

    if (!mappedCountry || !mappedSeries) {
      const missingPart = !mappedSeries ? `indicator ${params.indicatorId}` : `country ${params.countryCode}`;
      const fallbackReason = `IMF DataMapper mapping is missing for ${missingPart}. Demo fallback is active.`;
      return {
        rows: [],
        error: fallbackReason,
        endpoint: mappedSeries && mappedCountry ? this.endpoint(mappedSeries.seriesId, mappedCountry) : this.baseUrl,
        seriesId: mappedSeries?.seriesId ?? params.indicatorId,
        unit: mappedSeries?.unit,
        indicatorName: mappedSeries?.indicatorName ?? params.indicatorId,
        country: mappedCountry ?? params.countryCode,
        statusCategory: "mapping-error",
        fallbackReason
      };
    }

    const endpoint = this.endpoint(mappedSeries.seriesId, mappedCountry);

    try {
      const response = await fetchWithRetry(endpoint, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 compatible research dashboard"
        },
        next: { revalidate: 60 * 60 * 24 }
      }, 1);
      const httpStatus = responseStatusText(response);
      const contentType = responseContentType(response);
      const body = await response.text();
      const bodyPreview = responsePreview(body);

      if (response.status === 403) {
        return {
          rows: [],
          error: IMF_BLOCKED_MESSAGE,
          endpoint,
          seriesId: mappedSeries.seriesId,
          unit: mappedSeries.unit,
          indicatorName: mappedSeries.indicatorName,
          country: mappedCountry,
          statusCategory: "access-restricted",
          httpStatus,
          responseContentType: contentType,
          responseBodyPreview: bodyPreview,
          fallbackReason: IMF_BLOCKED_MESSAGE
        };
      }

      if (!response.ok) {
        const fallbackReason = `IMF DataMapper returned ${httpStatus} for ${mappedSeries.seriesId}/${mappedCountry}. Demo fallback is active.`;
        return {
          rows: [],
          error: fallbackReason,
          endpoint,
          seriesId: mappedSeries.seriesId,
          unit: mappedSeries.unit,
          indicatorName: mappedSeries.indicatorName,
          country: mappedCountry,
          statusCategory: "mapping-error",
          httpStatus,
          responseContentType: contentType,
          responseBodyPreview: bodyPreview,
          fallbackReason
        };
      }

      const parsedJson = this.parseJsonResponse(body);

      if (parsedJson.parserError) {
        const fallbackReason = `IMF DataMapper returned ${httpStatus}, but JSON parsing failed. Demo fallback is active.`;
        return {
          rows: [],
          error: fallbackReason,
          endpoint,
          seriesId: mappedSeries.seriesId,
          unit: mappedSeries.unit,
          indicatorName: mappedSeries.indicatorName,
          country: mappedCountry,
          statusCategory: "parser-error",
          httpStatus,
          responseContentType: contentType,
          responseBodyPreview: bodyPreview,
          parserError: parsedJson.parserError,
          fallbackReason
        };
      }

      const parsed = this.parseDataMapperJson(parsedJson.payload, params, mappedCountry, mappedSeries, endpoint);

      if (parsed.parserError) {
        const fallbackReason = `IMF DataMapper returned ${httpStatus}, but parsing failed: ${parsed.parserError} Demo fallback is active.`;
        return {
          rows: [],
          error: fallbackReason,
          endpoint,
          seriesId: mappedSeries.seriesId,
          unit: mappedSeries.unit,
          indicatorName: mappedSeries.indicatorName,
          country: mappedCountry,
          statusCategory: "parser-error",
          httpStatus,
          responseContentType: contentType,
          responseBodyPreview: bodyPreview,
          parserError: parsed.parserError,
          fallbackReason
        };
      }

      const latest = parsed.rows.at(-1);

      return {
        rows: parsed.rows,
        endpoint,
        seriesId: mappedSeries.seriesId,
        unit: mappedSeries.unit,
        indicatorName: mappedSeries.indicatorName,
        country: mappedCountry,
        statusCategory: "healthy",
        httpStatus,
        responseContentType: contentType,
        latestObservation: latest ? { date: latest.date, value: latest.value, unit: latest.unit } : undefined
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown IMF network error.";
      const fallbackReason = `IMF DataMapper fetch failed for ${mappedSeries.seriesId}/${mappedCountry}: ${message}. Demo fallback is active.`;

      return {
        rows: [],
        error: fallbackReason,
        endpoint,
        seriesId: mappedSeries.seriesId,
        unit: mappedSeries.unit,
        indicatorName: mappedSeries.indicatorName,
        country: mappedCountry,
        statusCategory: "network-error",
        fallbackReason
      };
    }
  }

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    return (await this.fetchLiveSeries(params)).rows;
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => Object.keys(this.seriesMap).includes(item.id) && item.name.toLowerCase().includes(normalized));
  }

  async healthCheck(): Promise<AdapterHealth> {
    const primaryResult = await this.fetchLiveSeries({ countryCode: "US", indicatorId: "GDP_GROWTH" });
    const remainingResults =
      primaryResult.statusCategory === "access-restricted"
        ? []
        : await Promise.all(this.healthIndicatorIds.filter((indicatorId) => indicatorId !== "GDP_GROWTH").map((indicatorId) => this.fetchLiveSeries({ countryCode: "US", indicatorId })));
    const results = [primaryResult, ...remainingResults];
    const successfulResult = results.find((result) => result.rows.length);
    const result = successfulResult ?? results[0];
    const metadata = latestMetadata(result?.rows ?? [], result?.endpoint ?? this.endpoint("NGDP_RPCH", "USA"), result?.seriesId ?? "NGDP_RPCH", result?.unit ?? "% y/y");
    const now = new Date().toISOString();
    const latestObservation =
      result?.latestObservation ?? (result?.rows.at(-1) ? { date: result.rows.at(-1)!.date, value: result.rows.at(-1)!.value, unit: result.rows.at(-1)!.unit } : undefined);
    const notes = result?.rows.length ? "Live IMF DataMapper API loaded and parsed. Demo fallback remains available." : (result?.fallbackReason ?? result?.error ?? "IMF live data did not load. Demo fallback is active.");

    return health(
      this.name,
      result?.rows.length ? "healthy" : "degraded",
      "annual",
      "No-key IMF DataMapper indicators for GDP growth, inflation, unemployment, and current account where covered",
      notes,
      result?.rows.length ? "live" : "demo",
      {
        ...metadata,
        statusCategory: result?.statusCategory ?? "degraded",
        indicatorName: result?.indicatorName ?? "Real GDP growth",
        country: result?.country ?? "USA",
        sourceName: "IMF DataMapper API",
        endpoint: result?.endpoint ?? metadata.endpoint,
        seriesId: result?.seriesId ?? metadata.seriesId,
        latestDataDate: metadata.latestDataDate,
        unit: result?.unit ?? metadata.unit,
        liveDemoStatus: result?.rows.length ? "live" : "demo",
        lastUpdated: metadata.lastUpdated ?? now,
        httpStatus: result?.httpStatus,
        responseContentType: result?.responseContentType,
        responseBodyPreview: result?.responseBodyPreview,
        latestObservation,
        parserError: result?.parserError,
        fallbackReason: result?.fallbackReason,
        adapterDetails: [
          "Alternative source strategy: prefer FRED for U.S. GDP growth, inflation, unemployment, and rates; World Bank for annual international macro indicators; OECD where mapped; IMF remains optional/secondary.",
          ...results.map((item) => {
            const latest = item.rows.at(-1);
            const status = latest ? `latest ${latest.date} = ${latest.value}${latest.unit ? ` ${latest.unit}` : ""}` : item.fallbackReason ?? item.error ?? "No details returned.";
            return `${item.indicatorName ?? item.seriesId ?? "IMF indicator"}: ${item.statusCategory} - ${status}`;
          })
        ]
      }
    );
  }
}

export class OecdAdapter implements DataAdapter {
  name = "OECD Data";

  constructor(private mappings: OecdMappingRegistry = OECD_INDICATOR_MAPPINGS) {}

  private healthIndicatorIds = ["GDP_GROWTH", "CPI", "UNEMPLOYMENT", "YIELD_10Y"];

  private mapping(indicatorId: string) {
    return this.mappings[indicatorId];
  }

  private rowMatchesCountry(row: Record<string, string>, mapping: OecdIndicatorMapping) {
    const country = firstNonEmptyValue(row, ["REF_AREA", "Reference area", "LOCATION", "Country", "COUNTRY", "Reference area code"]);

    if (!country) {
      return true;
    }

    const normalized = country.toUpperCase();
    return (
      normalized === mapping.oecdCountryCode ||
      normalized === mapping.countryCode ||
      normalized.includes(mapping.oecdCountryCode) ||
      country.toLowerCase() === mapping.country.toLowerCase()
    );
  }

  private parseCsv(csv: string, params: DataAdapterParams, mapping: OecdIndicatorMapping) {
    const { headers, rows } = parseCsvTable(csv);
    const dateColumn = findCsvColumn(headers, ["TIME_PERIOD", "Time period", "TIME_PERIOD: Time period", "TIME"], (header) => header.includes("TIME"));
    const valueColumn = findCsvColumn(
      headers,
      ["OBS_VALUE", "Observation value", "Value", "ObsValue"],
      (header) => header.includes("OBS") && header.includes("VALUE")
    );
    const lastUpdated = new Date().toISOString();

    if (!headers.length) {
      return { rows: [], headers, parserError: "OECD CSV response did not include a header row." };
    }

    if (!dateColumn) {
      return { rows: [], headers, parserError: `OECD CSV response did not include a recognizable time column. Headers: ${headers.join(", ")}` };
    }

    if (!valueColumn) {
      return { rows: [], headers, parserError: `OECD CSV response did not include a recognizable observation value column. Headers: ${headers.join(", ")}` };
    }

    const observations = rows
      .filter((row) => this.rowMatchesCountry(row, mapping))
      .map((row): Observation => {
        const date = compactDate(row[dateColumn] ?? "");
        const value = numberFromCsvValue(row[valueColumn]);

        return {
          countryCode: params.countryCode,
          indicatorId: params.indicatorId,
          indicatorName: mapping.indicatorName,
          country: mapping.country,
          date,
          value,
          source: mapping.sourceName,
          sourceName: mapping.sourceName,
          endpoint: mapping.developerApiDataUrl,
          developerApiDataUrl: mapping.developerApiDataUrl,
          exampleDeveloperApiDataUrl: mapping.exampleDeveloperApiDataUrl,
          seriesId: mapping.seriesId,
          unit: mapping.unit,
          frequency: mapping.frequency,
          isDemo: false,
          liveDemoStatus: "live" as const,
          lastUpdated
        };
      })
      .filter((row) => row.date && Number.isFinite(row.value))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!observations.length) {
      return {
        rows: [],
        headers,
        parserError: `OECD CSV parsed, but no numeric observations were found using date column "${dateColumn}" and value column "${valueColumn}".`
      };
    }

    return { rows: observations, headers };
  }

  private async fetchLiveSeries(
    params: DataAdapterParams
  ): Promise<{
    rows: Observation[];
    error?: string;
    endpoint?: string;
    seriesId?: string;
    unit?: string;
    mapping?: OecdIndicatorMapping;
    statusCategory: AdapterStatusCategory;
    httpStatus?: string;
    responseContentType?: string;
    responseBodyPreview?: string;
    detectedCsvHeaders?: string[];
    parserError?: string;
    fallbackReason?: string;
    latestObservation?: AdapterHealth["latestObservation"];
  }> {
    const mapping = this.mapping(params.indicatorId);

    if (!mapping) {
      const fallbackReason = `OECD API reachable, but ${params.indicatorId} is not mapped yet. Demo fallback is active.`;
      return { rows: [], error: fallbackReason, statusCategory: "unmapped", fallbackReason };
    }

    if (!isOecdMappingConfigured(mapping)) {
      return {
        rows: [],
        error: OECD_UNMAPPED_NOTE,
        endpoint: mapping.developerApiDataUrl,
        seriesId: mapping.seriesId,
        unit: mapping.unit,
        mapping,
        statusCategory: "unmapped",
        fallbackReason: OECD_UNMAPPED_NOTE
      };
    }

    try {
      const response = await fetchWithRetry(mapping.developerApiDataUrl, {
        headers: { Accept: "text/csv" },
        next: { revalidate: 60 * 60 * 24 }
      });
      const httpStatus = responseStatusText(response);
      const contentType = responseContentType(response);
      const body = await response.text();
      const bodyPreview = body.trim().slice(0, 500);

      if (!response.ok) {
        const fallbackReason = `OECD API reachable, but ${mapping.indicatorName} URL returned ${httpStatus}. ${freshOecdUrlInstruction(mapping.indicatorName)}`;
        return {
          rows: [],
          error: fallbackReason,
          endpoint: mapping.developerApiDataUrl,
          seriesId: mapping.seriesId,
          unit: mapping.unit,
          mapping,
          statusCategory: "mapping-error",
          httpStatus,
          responseContentType: contentType,
          responseBodyPreview: bodyPreview,
          fallbackReason
        };
      }

      const parsed = this.parseCsv(body, params, mapping);

      if (parsed.parserError) {
        const fallbackReason = `OECD API returned ${httpStatus} for ${mapping.indicatorName}, but CSV parsing failed: ${parsed.parserError} Demo fallback is active.`;
        return {
          rows: [],
          error: fallbackReason,
          endpoint: mapping.developerApiDataUrl,
          seriesId: mapping.seriesId,
          unit: mapping.unit,
          mapping,
          statusCategory: "parser-error",
          httpStatus,
          responseContentType: contentType,
          responseBodyPreview: bodyPreview,
          detectedCsvHeaders: parsed.headers,
          parserError: parsed.parserError,
          fallbackReason
        };
      }

      const latest = parsed.rows.at(-1);

      return {
        rows: parsed.rows,
        endpoint: mapping.developerApiDataUrl,
        seriesId: mapping.seriesId,
        unit: mapping.unit,
        mapping,
        statusCategory: "healthy",
        httpStatus,
        responseContentType: contentType,
        responseBodyPreview: bodyPreview,
        detectedCsvHeaders: parsed.headers,
        latestObservation: latest ? { date: latest.date, value: latest.value, unit: latest.unit } : undefined
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown OECD parsing or network error.";
      const fallbackReason = `OECD URL for ${mapping.indicatorName} could not be fetched or parsed: ${message}. ${freshOecdUrlInstruction(mapping.indicatorName)}`;
      return {
        rows: [],
        error: fallbackReason,
        endpoint: mapping.developerApiDataUrl,
        seriesId: mapping.seriesId,
        unit: mapping.unit,
        mapping,
        statusCategory: "mapping-error",
        fallbackReason
      };
    }
  }

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    return (await this.fetchLiveSeries(params)).rows;
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => Object.keys(this.mappings).includes(item.id) && item.name.toLowerCase().includes(normalized));
  }

  async healthCheck(): Promise<AdapterHealth> {
    const results = await Promise.all(this.healthIndicatorIds.map((indicatorId) => this.fetchLiveSeries({ countryCode: "US", indicatorId })));
    const successfulResult = results.find((result) => result.rows.length);
    const cpiResult = results.find((result) => result.mapping?.indicatorId === "CPI");
    const result = successfulResult ?? cpiResult ?? results[0];
    const mapping = result?.mapping ?? this.mapping("CPI");
    const metadata = latestMetadata(
      result?.rows ?? [],
      result?.endpoint ?? mapping?.developerApiDataUrl ?? "",
      result?.seriesId ?? mapping?.seriesId ?? "",
      result?.unit ?? mapping?.unit ?? "% y/y"
    );
    const now = new Date().toISOString();
    const note = result?.rows.length
      ? `Live OECD data loaded and parsed for ${mapping?.indicatorName ?? "an OECD indicator"}. Demo fallback remains available.`
      : (result?.fallbackReason ?? result?.error ?? OECD_UNMAPPED_NOTE);
    const latestObservation = result?.latestObservation ?? (result?.rows.at(-1) ? { date: result.rows.at(-1)!.date, value: result.rows.at(-1)!.value, unit: result.rows.at(-1)!.unit } : undefined);

    return health(
      this.name,
      result?.rows.length ? "healthy" : "degraded",
      "mixed",
      "No-key OECD Data Explorer SDMX indicators configured by copied Developer API data URLs",
      note,
      result?.rows.length ? "live" : "demo",
      {
        ...metadata,
        statusCategory: result?.statusCategory ?? "degraded",
        indicatorName: mapping?.indicatorName ?? "Headline CPI inflation",
        country: mapping?.country ?? "United States",
        sourceName: mapping?.sourceName ?? "OECD Data Explorer Developer API",
        developerApiDataUrl: mapping?.developerApiDataUrl,
        exampleDeveloperApiDataUrl: mapping?.exampleDeveloperApiDataUrl,
        endpoint: metadata.endpoint || mapping?.developerApiDataUrl || "No active OECD URL mapped. Paste the OECD Developer API data URL in src/lib/data/oecd-mappings.ts",
        seriesId: metadata.seriesId || mapping?.seriesId || "Not mapped",
        latestDataDate: metadata.latestDataDate ?? mapping?.date,
        unit: metadata.unit ?? mapping?.unit ?? "% y/y",
        liveDemoStatus: result?.rows.length ? "live" : "demo",
        lastUpdated: metadata.lastUpdated ?? now,
        httpStatus: result?.httpStatus,
        responseContentType: result?.responseContentType,
        responseBodyPreview: result?.responseBodyPreview,
        detectedCsvHeaders: result?.detectedCsvHeaders,
        latestObservation,
        parserError: result?.parserError,
        fallbackReason: result?.fallbackReason,
        adapterDetails: results.map((item) => {
          const itemName = item.mapping?.indicatorName ?? "Unknown OECD indicator";
          const category = item.statusCategory;
          const status = item.rows.length ? `latest ${item.rows.at(-1)?.date} = ${item.rows.at(-1)?.value}` : item.fallbackReason ?? item.error ?? "No details returned.";
          return `${itemName}: ${category} - ${status}`;
        })
      }
    );
  }
}

export class BisAdapter implements DataAdapter {
  name = "BIS Data";

  private countryMap: Partial<Record<CountryCode, string>> = {
    US: "US",
    CA: "CA",
    EA: "XM",
    CN: "CN",
    JP: "JP",
    GB: "GB",
    DE: "DE",
    IN: "IN",
    BR: "BR",
    MX: "MX"
  };

  private seriesMap: Partial<Record<string, { dataflow: string; key: (countryCode: string) => string; unit: string; frequency: Frequency }>> = {
    POLICY_RATE: { dataflow: "WS_CBPOL", key: (countryCode) => `M.${countryCode}`, unit: "%", frequency: "monthly" }
  };

  private endpoint(dataflow: string, key: string) {
    return `https://stats.bis.org/api/v2/data/dataflow/BIS/${dataflow}/1.0/${key}?format=csvfile`;
  }

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    const mappedCountry = this.countryMap[params.countryCode];
    const mappedSeries = this.seriesMap[params.indicatorId];

    if (!mappedCountry || !mappedSeries) {
      return [];
    }

    const seriesKey = mappedSeries.key(mappedCountry);

    try {
      const response = await fetchWithRetry(this.endpoint(mappedSeries.dataflow, seriesKey), {
        headers: { Accept: "text/csv, */*" },
        next: { revalidate: 60 * 60 * 24 }
      });

      if (!response.ok) {
        return [];
      }

      const rows = parseCsvRows(await response.text());

      return rows
        .map((row) => ({
          countryCode: params.countryCode,
          indicatorId: params.indicatorId,
          date: compactDate(firstValue(row, ["TIME_PERIOD", "TIME", "Period"]) ?? ""),
          value: Number(firstValue(row, ["OBS_VALUE", "Value", "ObsValue"])),
          source: "BIS Statistics API",
          frequency: mappedSeries.frequency,
          isDemo: false,
          lastUpdated: new Date().toISOString()
        }))
        .filter((row) => row.date && Number.isFinite(row.value))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      return [];
    }
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => Object.keys(this.seriesMap).includes(item.id) && item.name.toLowerCase().includes(normalized));
  }

  async healthCheck(): Promise<AdapterHealth> {
    const endpoint = this.endpoint("WS_CBPOL", "M.US");
    const rows = await this.fetchSeries({ countryCode: "US", indicatorId: "POLICY_RATE" });
    const metadata = latestMetadata(rows, endpoint, "WS_CBPOL/M.US", "%");

    return health(
      this.name,
      rows.length ? "healthy" : "degraded",
      "monthly",
      "No-key BIS statistics API policy-rate series where BIS coverage exists",
      rows.length ? "Live BIS data loaded. Demo fallback remains available." : "Live BIS data did not load. Demo fallback is active.",
      rows.length ? "live" : "demo",
      metadata
    );
  }
}

abstract class KeyedAdapter implements DataAdapter {
  abstract name: string;
  abstract envName: string;
  abstract frequency: AdapterHealth["frequency"];
  abstract coverage: string;
  abstract sampleSeriesId: string;
  abstract sampleUnit: string;

  async fetchSeries(_params: DataAdapterParams): Promise<Observation[]> {
    return [];
  }

  async searchIndicators(_query: string): Promise<Indicator[]> {
    return [];
  }

  protected abstract healthUrl(apiKey: string): string | URL;

  async healthCheck(): Promise<AdapterHealth> {
    const apiKey = envValue(this.envName);
    const now = new Date().toISOString();

    if (!apiKey) {
      return health(this.name, "degraded", this.frequency, this.coverage, missingKey(this.envName), "demo", {
        endpoint: `Requires ${this.envName}`,
        seriesId: this.sampleSeriesId,
        unit: this.sampleUnit,
        lastUpdated: now
      });
    }

    const endpoint = this.healthUrl(apiKey).toString();
    const check = await liveHealthCheck(endpoint);

    return health(
      this.name,
      check.ok ? "healthy" : "degraded",
      this.frequency,
      this.coverage,
      check.ok ? `${this.envName} is configured and the live API check passed.` : check.message,
      check.ok ? "live" : "demo",
      {
        endpoint,
        seriesId: this.sampleSeriesId,
        unit: this.sampleUnit,
        lastUpdated: now,
        ...(check.ok ? { latestSuccessfulUpdate: now } : {})
      }
    );
  }
}

export class FredAdapter extends KeyedAdapter {
  name = "FRED API";
  envName = "FRED_API_KEY";
  frequency = "mixed" as const;
  coverage = "U.S. macro-financial indicators";
  sampleSeriesId = "FEDFUNDS";
  sampleUnit = "%";

  private seriesMap: Record<string, string> = {
    CPI: "CPIAUCSL",
    UNEMPLOYMENT: "UNRATE",
    POLICY_RATE: "FEDFUNDS",
    YIELD_10Y: "DGS10",
    OIL: "DCOILWTICO"
  };

  protected healthUrl(apiKey: string) {
    const url = new URL("https://api.stlouisfed.org/fred/series");
    url.searchParams.set("series_id", "FEDFUNDS");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    return url;
  }

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    const apiKey = envValue(this.envName);
    const seriesId = this.seriesMap[params.indicatorId];
    const meta = indicator(params.indicatorId);

    if (!apiKey || params.countryCode !== "US" || !seriesId || !meta) {
      return [];
    }

    const url = new URL("https://api.stlouisfed.org/fred/series/observations");
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");

    const response = await fetchWithRetry(url, { next: { revalidate: 60 * 60 * 6 } });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { observations?: Array<{ date: string; value: string }> };

    return (payload.observations ?? [])
      .filter((row) => row.value !== ".")
      .slice(-120)
      .map((row) => ({
        countryCode: params.countryCode,
        indicatorId: params.indicatorId,
        date: row.date.slice(0, 7),
        value: Number(row.value),
        source: "FRED API",
        frequency: meta.frequency,
        isDemo: false,
        lastUpdated: new Date().toISOString()
      }));
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => item.source.includes("FRED") && item.name.toLowerCase().includes(normalized));
  }
}

export class BlsAdapter extends KeyedAdapter {
  name = "BLS API";
  envName = "BLS_API_KEY";
  frequency = "monthly" as const;
  coverage = "U.S. CPI, unemployment, and wage proxies";
  sampleSeriesId = "LNS14000000";
  sampleUnit = "%";

  private seriesMap: Record<string, string> = {
    CPI: "CUUR0000SA0",
    UNEMPLOYMENT: "LNS14000000",
    WAGE_GROWTH: "CES0500000003"
  };

  protected healthUrl(apiKey: string) {
    const url = new URL("https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000");
    url.searchParams.set("registrationkey", apiKey);
    url.searchParams.set("startyear", "2024");
    url.searchParams.set("endyear", "2024");
    return url;
  }

  async fetchSeries(params: DataAdapterParams): Promise<Observation[]> {
    const seriesId = this.seriesMap[params.indicatorId];
    const meta = indicator(params.indicatorId);

    if (!envValue(this.envName) || params.countryCode !== "US" || !seriesId || !meta) {
      return [];
    }

    const response = await fetchWithRetry("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: [seriesId],
        registrationkey: envValue(this.envName),
        startyear: "2020",
        endyear: "2026"
      }),
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      Results?: { series?: Array<{ data?: Array<{ year: string; period: string; value: string }> }> };
    };

    return (payload.Results?.series?.[0]?.data ?? [])
      .filter((row) => row.period.startsWith("M"))
      .map((row) => ({
        countryCode: params.countryCode,
        indicatorId: params.indicatorId,
        date: `${row.year}-${row.period.slice(1).padStart(2, "0")}`,
        value: Number(row.value),
        source: "BLS API",
        frequency: meta.frequency,
        isDemo: false,
        lastUpdated: new Date().toISOString()
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async searchIndicators(query: string): Promise<Indicator[]> {
    const normalized = query.toLowerCase();
    return INDICATORS.filter((item) => item.source.includes("BLS") && item.name.toLowerCase().includes(normalized));
  }
}

class BeaAdapter extends KeyedAdapter {
  name = "BEA API";
  envName = "BEA_API_KEY";
  frequency = "mixed" as const;
  coverage = "U.S. GDP and national accounts";
  sampleSeriesId = "GETDATASETLIST";
  sampleUnit = "metadata";

  protected healthUrl(apiKey: string) {
    const url = new URL("https://apps.bea.gov/api/data");
    url.searchParams.set("UserID", apiKey);
    url.searchParams.set("method", "GETDATASETLIST");
    url.searchParams.set("ResultFormat", "JSON");
    return url;
  }
}

class EiaAdapter extends KeyedAdapter {
  name = "EIA API";
  envName = "EIA_API_KEY";
  frequency = "mixed" as const;
  coverage = "Energy and commodity indicators";
  sampleSeriesId = "EIA v2 root";
  sampleUnit = "metadata";

  protected healthUrl(apiKey: string) {
    const url = new URL("https://api.eia.gov/v2/");
    url.searchParams.set("api_key", apiKey);
    return url;
  }
}

export const dataAdapters: DataAdapter[] = [
  new DemoDataAdapter(),
  new FredAdapter(),
  new BlsAdapter(),
  new WorldBankAdapter(),
  new OecdAdapter(),
  new BankOfCanadaAdapter(),
  new StatCanAdapter(),
  new EcbEurostatAdapter(),
  new BisAdapter(),
  new ImfAdapter(),
  new BeaAdapter(),
  new EiaAdapter()
];
