import { vi } from "vitest";
import { BisAdapter, DemoDataAdapter, ImfAdapter, OecdAdapter } from "@/lib/data/adapters";
import { withCsvLabels } from "@/lib/data/oecd-mappings";

describe("DemoDataAdapter", () => {
  it("fetches demo observations through the common adapter interface", async () => {
    const adapter = new DemoDataAdapter();
    const rows = await adapter.fetchSeries({ countryCode: "US", indicatorId: "CPI" });

    expect(rows.length).toBeGreaterThan(10);
    expect(rows.every((row) => row.isDemo)).toBe(true);
  });

  it("reports healthy demo-mode status", async () => {
    const adapter = new DemoDataAdapter();
    const health = await adapter.healthCheck();

    expect(health.status).toBe("healthy");
    expect(health.mode).toBe("demo");
  });
});

describe("ImfAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function imfResponse(body: unknown, init: { ok?: boolean; status?: number; statusText?: string; contentType?: string } = {}) {
    const text = typeof body === "string" ? body : JSON.stringify(body);

    return {
      ok: init.ok ?? true,
      status: init.status ?? 200,
      statusText: init.statusText ?? "OK",
      headers: new Headers({ "content-type": init.contentType ?? "application/json; charset=utf-8" }),
      text: async () => text
    } as Response;
  }

  it("parses valid IMF DataMapper JSON values into observations", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      imfResponse({
        values: {
          NGDP_RPCH: {
            USA: {
              "2024": 2.8,
              "2025": 2.1
            }
          }
        }
      })
    );

    const adapter = new ImfAdapter();
    const rows = await adapter.fetchSeries({ countryCode: "US", indicatorId: "GDP_GROWTH" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/USA",
      expect.objectContaining({ headers: { Accept: "application/json" } })
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].source).toBe("IMF DataMapper API");
    expect(rows[1]).toMatchObject({
      indicatorName: "Real GDP growth",
      country: "USA",
      date: "2025",
      value: 2.1,
      seriesId: "NGDP_RPCH",
      unit: "% y/y",
      liveDemoStatus: "live",
      isDemo: false
    });
  });

  it("extracts the latest IMF observation in Adapter Health metadata", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      imfResponse({
        values: {
          NGDP_RPCH: {
            USA: {
              "2024": 2.8,
              "2025": 2.1
            }
          }
        }
      })
    );

    const health = await new ImfAdapter().healthCheck();

    expect(health.status).toBe("healthy");
    expect(health.statusCategory).toBe("healthy");
    expect(health.mode).toBe("live");
    expect(health.liveDemoStatus).toBe("live");
    expect(health.seriesId).toBe("NGDP_RPCH");
    expect(health.indicatorName).toBe("Real GDP growth");
    expect(health.country).toBe("USA");
    expect(health.sourceName).toBe("IMF DataMapper API");
    expect(health.endpoint).toBe("https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/USA");
    expect(health.httpStatus).toBe("HTTP 200 OK");
    expect(health.responseContentType).toBe("application/json; charset=utf-8");
    expect(health.latestDataDate).toBe("2025");
    expect(health.latestObservation).toEqual({ date: "2025", value: 2.1, unit: "% y/y" });
    expect(health.adapterDetails?.[0]).toContain("latest 2025 = 2.1");
  });

  it("reports invalid IMF endpoint failures with response diagnostics", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      imfResponse('{"error":"Invalid indicator"}', {
        ok: false,
        status: 404,
        statusText: "Not Found",
        contentType: "application/json"
      })
    );

    const health = await new ImfAdapter().healthCheck();

    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("mapping-error");
    expect(health.mode).toBe("demo");
    expect(health.httpStatus).toBe("HTTP 404 Not Found");
    expect(health.responseContentType).toBe("application/json");
    expect(health.responseBodyPreview).toContain("Invalid indicator");
    expect(health.fallbackReason).toContain("IMF DataMapper returned HTTP 404 Not Found");
  });

  it("reports missing IMF indicator mappings without requesting live data", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const rows = await new ImfAdapter().fetchSeries({ countryCode: "US", indicatorId: "NOT_MAPPED" });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(rows).toEqual([]);
  });

  it("reports IMF parser errors for HTTP 200 responses with no values", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(imfResponse({ values: { NGDP_RPCH: { CAN: { "2025": 1.2 } } } }));

    const health = await new ImfAdapter().healthCheck();

    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("parser-error");
    expect(health.parserError).toContain("did not include values for series NGDP_RPCH and country USA");
    expect(health.responseBodyPreview).toContain("NGDP_RPCH");
    expect(health.fallbackReason).toContain("Demo fallback is active");
  });

  it("reports IMF network errors without hiding the fallback reason", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("connect ETIMEDOUT"));

    const health = await new ImfAdapter().healthCheck();

    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("network-error");
    expect(health.mode).toBe("demo");
    expect(health.endpoint).toBe("https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/USA");
    expect(health.fallbackReason).toContain("connect ETIMEDOUT");
  });
});

describe("OecdAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const cpiMapping = {
    CPI: {
      indicatorId: "CPI",
      indicatorName: "Headline CPI inflation",
      country: "United States",
      countryCode: "US",
      oecdCountryCode: "USA",
      developerApiDataUrl: "https://sdmx.oecd.org/public/rest/data/OECD.EXAMPLE,DSD_EXAMPLE@DF_EXAMPLE/USA...?startPeriod=2020-01&dimensionAtObservation=AllDimensions&format=csvfilewithlabels",
      exampleDeveloperApiDataUrl:
        "https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_CPI/USA...?startPeriod=2023-01&dimensionAtObservation=AllDimensions&format=csvfilewithlabels",
      sourceName: "OECD Data Explorer Developer API",
      seriesId: "OECD.EXAMPLE,DSD_EXAMPLE@DF_EXAMPLE/USA...",
      date: "",
      unit: "% y/y",
      frequency: "monthly" as const
    }
  };

  it("appends csvfilewithlabels to OECD URLs with or without query parameters", () => {
    expect(withCsvLabels("https://sdmx.oecd.org/public/rest/data/X/Y")).toBe("https://sdmx.oecd.org/public/rest/data/X/Y?format=csvfilewithlabels");
    expect(withCsvLabels("https://sdmx.oecd.org/public/rest/data/X/Y?startPeriod=2025-01")).toBe(
      "https://sdmx.oecd.org/public/rest/data/X/Y?startPeriod=2025-01&format=csvfilewithlabels"
    );
    expect(withCsvLabels("https://sdmx.oecd.org/public/rest/data/X/Y?format=csvfile")).toBe("https://sdmx.oecd.org/public/rest/data/X/Y?format=csvfilewithlabels");
  });

  it("reports unmapped without requesting OECD when no Developer API URL is mapped", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const health = await new OecdAdapter({
      CPI: { ...cpiMapping.CPI, developerApiDataUrl: "", seriesId: "" }
    }).healthCheck();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("unmapped");
    expect(health.mode).toBe("demo");
    expect(health.liveDemoStatus).toBe("demo");
    expect(health.indicatorName).toBe("Headline CPI inflation");
    expect(health.country).toBe("United States");
    expect(health.notes).toBe("OECD API reachable, but this indicator is not mapped yet. Demo fallback is active.");
    expect(health.endpoint).toContain("oecd-mappings.ts");
    expect(health.exampleDeveloperApiDataUrl).toContain("DF_PRICES_CPI");
  });

  it("reports missing OECD mapping entries without requesting live data", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const health = await new OecdAdapter({}).healthCheck();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("unmapped");
    expect(health.mode).toBe("demo");
    expect(health.notes).toContain("GDP_GROWTH is not mapped yet");
    expect(health.endpoint).toContain("oecd-mappings.ts");
    expect(health.adapterDetails?.every((detail) => detail.includes("unmapped"))).toBe(true);
  });

  it("parses valid OECD CSV values and extracts the latest observation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "text/csv;charset=utf-8" }),
      text: async () => 'REF_AREA,"Reference area",TIME_PERIOD,"Observation value",UNIT_MEASURE\nUSA,"United States",2025-01,"3.2",PCT\nUSA,"United States",2025-02,"3.1",PCT'
    } as Response);

    const adapter = new OecdAdapter(cpiMapping);
    const rows = await adapter.fetchSeries({ countryCode: "US", indicatorId: "CPI" });
    const health = await adapter.healthCheck();

    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      indicatorName: "Headline CPI inflation",
      country: "United States",
      source: "OECD Data Explorer Developer API",
      seriesId: "OECD.EXAMPLE,DSD_EXAMPLE@DF_EXAMPLE/USA...",
      unit: "% y/y",
      liveDemoStatus: "live",
      date: "2025-02",
      value: 3.1
    });
    expect(health.status).toBe("healthy");
    expect(health.statusCategory).toBe("healthy");
    expect(health.latestObservation).toEqual({ date: "2025-02", value: 3.1, unit: "% y/y" });
    expect(health.detectedCsvHeaders).toContain("Observation value");
  });

  it("handles HTTP 422 mapping errors with response diagnostics", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => '{"error":"Selected series not found"}'
    } as Response);

    const health = await new OecdAdapter(cpiMapping).healthCheck();

    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("mapping-error");
    expect(health.httpStatus).toBe("HTTP 422 Unprocessable Entity");
    expect(health.responseContentType).toBe("application/json");
    expect(health.responseBodyPreview).toContain("Selected series not found");
    expect(health.fallbackReason).toContain("Please copy a fresh OECD Developer API Flat Data query URL");
  });

  it("reports parser errors when HTTP 200 CSV has no value column", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "text/csv" }),
      text: async () => "REF_AREA,TIME_PERIOD,Label\nUSA,2025-01,Missing value"
    } as Response);

    const health = await new OecdAdapter(cpiMapping).healthCheck();

    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("parser-error");
    expect(health.mode).toBe("demo");
    expect(health.parserError).toContain("observation value column");
    expect(health.detectedCsvHeaders).toEqual(["REF_AREA", "TIME_PERIOD", "Label"]);
  });

  it("reports invalid OECD URLs as mapping errors", async () => {
    const health = await new OecdAdapter({
      CPI: { ...cpiMapping.CPI, developerApiDataUrl: "not a url" }
    }).healthCheck();

    expect(health.status).toBe("degraded");
    expect(health.statusCategory).toBe("mapping-error");
    expect(health.fallbackReason).toContain("could not be fetched or parsed");
    expect(health.fallbackReason).toContain("Please copy a fresh OECD Developer API Flat Data query URL");
  });
});

describe("BisAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses BIS CSV values into observations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "FREQ,REF_AREA,TIME_PERIOD,OBS_VALUE\nM,US,2025-01,4.5\nM,US,2025-02,4.4"
    } as Response);

    const adapter = new BisAdapter();
    const rows = await adapter.fetchSeries({ countryCode: "US", indicatorId: "POLICY_RATE" });

    expect(rows).toHaveLength(2);
    expect(rows[0].source).toBe("BIS Statistics API");
    expect(rows[1]).toMatchObject({ date: "2025-02", value: 4.4, isDemo: false });
  });

  it("reports healthy when BIS live data loads", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "FREQ,REF_AREA,TIME_PERIOD,OBS_VALUE\nM,US,2025-02,4.4"
    } as Response);

    const health = await new BisAdapter().healthCheck();

    expect(health.status).toBe("healthy");
    expect(health.mode).toBe("live");
    expect(health.seriesId).toBe("WS_CBPOL/M.US");
  });
});
