export const EXPORT_PROJECT_NAME = "Global Macro Outlook AI";
export const EXPORT_WEBSITE = "https://global-macro-forecasting-mvp.vercel.app/";
export const EXPORT_DISCLAIMER =
  "Forecasts, classifications, and risk scores are for research, education, and decision-support only. They are not investment, legal, tax, or financial advice. Exports may include live, demo, or fallback data; check data-source status and methodology before use.";

export interface ExportMetadataInput {
  title: string;
  module: string;
  country?: string;
  indicatorNames?: string[];
  units?: string[];
  frequency?: string;
  sourceNames?: string[];
  endpoints?: string[];
  seriesIds?: string[];
  dataStatus?: string;
  generatedAt?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface ExportMetadata extends ExportMetadataInput {
  projectName: string;
  website: string;
  generatedAt: string;
  disclaimer: string;
}

export interface JsonExportPayload<T = unknown> {
  metadata: ExportMetadata;
  data: T;
}

export function buildExportMetadata(metadata: ExportMetadataInput): ExportMetadata {
  return {
    projectName: EXPORT_PROJECT_NAME,
    website: EXPORT_WEBSITE,
    ...metadata,
    generatedAt: metadata.generatedAt ?? new Date().toISOString(),
    disclaimer: EXPORT_DISCLAIMER
  };
}

export function createJsonExport<T>(metadata: ExportMetadataInput, data: T): JsonExportPayload<T> {
  return {
    metadata: buildExportMetadata(metadata),
    data
  };
}

export function jsonExportToString<T>(payload: JsonExportPayload<T>) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}
