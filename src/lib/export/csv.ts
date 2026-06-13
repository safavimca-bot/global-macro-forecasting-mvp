export type CsvRow = Record<string, unknown>;

export function csvEscape(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);

  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

export function inferCsvHeaders(rows: CsvRow[]) {
  return Array.from(
    rows.reduce<Set<string>>((headers, row) => {
      Object.keys(row).forEach((key) => headers.add(key));
      return headers;
    }, new Set())
  );
}

export function objectsToCsv(rows: CsvRow[], headers = inferCsvHeaders(rows)) {
  if (!rows.length) {
    return headers.length ? `${headers.map(csvEscape).join(",")}\n` : "";
  }

  const lines = [headers.map(csvEscape).join(",")];

  rows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  });

  return `${lines.join("\n")}\n`;
}

function flattenMetadataValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join("; ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

export function appendMetadataToRows(rows: CsvRow[], metadata: CsvRow) {
  const metadataColumns = Object.fromEntries(Object.entries(metadata).map(([key, value]) => [`metadata_${key}`, flattenMetadataValue(value)]));

  if (!rows.length) {
    return [{ export_record_type: "metadata_only", ...metadataColumns }];
  }

  return rows.map((row) => ({
    ...row,
    ...metadataColumns
  }));
}

export function createCsvExport(rows: CsvRow[], metadata: CsvRow) {
  return objectsToCsv(appendMetadataToRows(rows, metadata));
}
