"use client";

import { useMemo, useState } from "react";
import { Clipboard, Download, FileJson, FileText, Image as ImageIcon } from "lucide-react";
import { createCsvExport, type CsvRow } from "@/lib/export/csv";
import { downloadChartElementAsPng } from "@/lib/export/chart-image";
import { createExportFilename } from "@/lib/export/filename";
import { buildExportMetadata, jsonExportToString, type ExportMetadataInput, type JsonExportPayload } from "@/lib/export/json";

interface ExportMenuProps<T = unknown> {
  data?: T;
  metadata: ExportMetadataInput;
  filenameBase: string;
  label?: string;
  chartTargetId?: string;
  csvRows?: CsvRow[];
  allowCsv?: boolean;
  allowJson?: boolean;
  allowPng?: boolean;
  allowClipboard?: boolean;
  markdownContent?: string;
  markdownFilenameBase?: string;
  compact?: boolean;
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function actionClass(compact?: boolean) {
  return [
    "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] font-medium text-slate-200 transition hover:border-signal-cyan/50 hover:bg-signal-cyan/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-signal-cyan/60 disabled:cursor-not-allowed disabled:opacity-60",
    compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
  ].join(" ");
}

export function ExportNotice() {
  return (
    <p className="text-xs leading-5 text-slate-400">
      Exports may include live, demo, or fallback data. Please check the data-source status and methodology before using the data.
    </p>
  );
}

export function ExportMenu<T = unknown>({
  data,
  metadata,
  filenameBase,
  label = "Export",
  chartTargetId,
  csvRows,
  allowCsv,
  allowJson = true,
  allowPng,
  allowClipboard = true,
  markdownContent,
  markdownFilenameBase,
  compact = true
}: ExportMenuProps<T>) {
  const [status, setStatus] = useState<string>("");
  const [busyAction, setBusyAction] = useState<string>("");
  const rows = useMemo(() => csvRows ?? (Array.isArray(data) ? (data as CsvRow[]) : []), [csvRows, data]);
  const canCsv = allowCsv ?? rows.length > 0;
  const canPng = allowPng ?? Boolean(chartTargetId);

  const withStatus = async (action: string, callback: () => Promise<void> | void) => {
    setStatus("");
    setBusyAction(action);

    try {
      await callback();
      setStatus(`${action} ready.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${action} failed.`);
    } finally {
      setBusyAction("");
    }
  };

  const createPayload = (): JsonExportPayload<T | CsvRow[]> => ({
    metadata: buildExportMetadata(metadata),
    data: data ?? rows
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2" role="group" aria-label={`${label} download options`}>
        {canCsv ? (
          <button
            type="button"
            className={actionClass(compact)}
            aria-label={`${label}: download data as CSV`}
            disabled={Boolean(busyAction)}
            onClick={() =>
              withStatus("CSV export", () => {
                const payload = createPayload();
                downloadBlob(createCsvExport(rows, payload.metadata), "text/csv;charset=utf-8", createExportFilename(filenameBase, "csv"));
              })
            }
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </button>
        ) : null}
        {allowJson ? (
          <button
            type="button"
            className={actionClass(compact)}
            aria-label={`${label}: download data as JSON`}
            disabled={Boolean(busyAction)}
            onClick={() =>
              withStatus("JSON export", () => {
                downloadBlob(jsonExportToString(createPayload()), "application/json;charset=utf-8", createExportFilename(filenameBase, "json"));
              })
            }
          >
            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
            JSON
          </button>
        ) : null}
        {canPng && chartTargetId ? (
          <button
            type="button"
            className={actionClass(compact)}
            aria-label={`${label}: download visible chart as PNG`}
            disabled={Boolean(busyAction)}
            onClick={() =>
              withStatus("PNG export", async () => {
                await downloadChartElementAsPng(chartTargetId, createExportFilename(filenameBase, "png"));
              })
            }
          >
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            PNG
          </button>
        ) : null}
        {markdownContent ? (
          <button
            type="button"
            className={actionClass(compact)}
            aria-label={`${label}: download report as Markdown`}
            disabled={Boolean(busyAction)}
            onClick={() =>
              withStatus("Markdown export", () => {
                downloadBlob(markdownContent, "text/markdown;charset=utf-8", createExportFilename(markdownFilenameBase ?? filenameBase, "md"));
              })
            }
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            MD
          </button>
        ) : null}
        {allowClipboard ? (
          <button
            type="button"
            className={actionClass(compact)}
            aria-label={`${label}: copy export data to clipboard`}
            disabled={Boolean(busyAction)}
            onClick={() =>
              withStatus("Clipboard copy", async () => {
                if (!navigator.clipboard) {
                  throw new Error("Clipboard access is not available in this browser.");
                }

                await navigator.clipboard.writeText(jsonExportToString(createPayload()));
              })
            }
          >
            <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
            Copy
          </button>
        ) : null}
      </div>
      {status ? <p className="max-w-xs text-right text-[11px] leading-4 text-slate-400">{status}</p> : null}
      {busyAction ? <p className="text-[11px] text-slate-500">{busyAction}...</p> : null}
    </div>
  );
}
