export type ExportFileExtension = "csv" | "json" | "png" | "md";

export function safeFilenameSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function formatDateForFilename(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function createExportFilename(base: string, extension: ExportFileExtension, date = new Date()) {
  const safeBase = safeFilenameSegment(base) || "global-macro-export";
  const safeExtension = extension.replace(/[^a-z]/g, "") as ExportFileExtension;

  return `${safeBase}-${formatDateForFilename(date)}.${safeExtension}`;
}
