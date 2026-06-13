import { createCsvExport, objectsToCsv } from "@/lib/export/csv";
import { createExportFilename } from "@/lib/export/filename";
import { createJsonExport, jsonExportToString } from "@/lib/export/json";
import { adapterHealthExportRows, countryProfileExportRows } from "@/lib/export/page-data";
import { getCountryMacroView } from "@/lib/data/service";
import type { AdapterHealth } from "@/lib/types";

describe("CSV export utilities", () => {
  it("escapes commas, quotation marks, and line breaks", () => {
    const csv = objectsToCsv([
      {
        name: 'United States, "headline"',
        note: "line one\nline two",
        value: 3.2
      }
    ]);

    expect(csv).toContain('"United States, ""headline"""');
    expect(csv).toContain('"line one\nline two"');
    expect(csv).toContain("3.2");
  });

  it("handles empty data with metadata-only rows", () => {
    const csv = createCsvExport([], {
      title: "Empty export",
      module: "Test Module",
      dataStatus: "demo"
    });

    expect(csv).toContain("export_record_type");
    expect(csv).toContain("metadata_title");
    expect(csv).toContain("metadata_only");
    expect(csv).toContain("Empty export");
  });
});

describe("JSON export utilities", () => {
  it("generates structured metadata and formatted JSON", () => {
    const payload = createJsonExport(
      {
        title: "Adapter health",
        module: "Data Sources",
        generatedAt: "2026-06-13T00:00:00.000Z",
        dataStatus: "mixed"
      },
      [{ source: "Demo data", status: "healthy" }]
    );

    expect(payload.metadata.projectName).toBe("Global Macro Outlook AI");
    expect(payload.metadata.website).toBe("https://global-macro-forecasting-mvp.vercel.app/");
    expect(payload.metadata.generatedAt).toBe("2026-06-13T00:00:00.000Z");
    expect(jsonExportToString(payload)).toContain('"metadata"');
    expect(jsonExportToString(payload)).toContain('"data"');
  });
});

describe("filename generation", () => {
  it("creates safe lowercase filenames with a generated date", () => {
    const filename = createExportFilename("Country Profile US / Inflation", "csv", new Date("2026-06-13T12:00:00.000Z"));

    expect(filename).toBe("country-profile-us-inflation-2026-06-13.csv");
  });
});

describe("export row builders", () => {
  it("maps adapter health diagnostics into export rows", () => {
    const health: AdapterHealth[] = [
      {
        name: "FRED API",
        status: "degraded",
        statusCategory: "network-error",
        endpoint: "https://api.stlouisfed.org/fred/series/observations",
        sourceName: "FRED",
        seriesId: "CPIAUCSL",
        httpStatus: "HTTP 403 Forbidden",
        parserError: "N/A",
        fallbackReason: "Missing key",
        lastUpdated: "2026-06-13T00:00:00.000Z",
        frequency: "monthly",
        coverage: "US macro indicators",
        notes: "Demo fallback is active.",
        mode: "demo"
      }
    ];

    const rows = adapterHealthExportRows(health);

    expect(rows[0]).toMatchObject({
      source: "FRED API",
      status: "degraded",
      status_category: "network-error",
      endpoint: "https://api.stlouisfed.org/fred/series/observations",
      series_id: "CPIAUCSL",
      http_status: "HTTP 403 Forbidden",
      fallback_reason: "Missing key"
    });
  });

  it("builds country profile exports with observations and score rows", async () => {
    const view = await getCountryMacroView("US", { useOpenAI: false });

    expect(view).toBeDefined();

    const rows = countryProfileExportRows(view!);

    expect(rows.some((row) => row.record_type === "observation" && row.indicator_id === "CPI")).toBe(true);
    expect(rows.some((row) => row.record_type === "risk_score" && row.indicator_name === "Inflation risk score")).toBe(true);
    expect(rows.every((row) => row.country_code === "US")).toBe(true);
    expect(rows.some((row) => row.live_demo_status === "demo")).toBe(true);
  });
});
