import { Database } from "lucide-react";
import { Panel } from "@/components/panel";
import { SectionHeading } from "@/components/section-heading";
import { getDataSourceHealth, sourceCoverageRows } from "@/lib/data/service";

export const dynamic = "force-dynamic";

function statusClass(status: "healthy" | "degraded" | "unavailable") {
  if (status === "healthy") {
    return "border-signal-green/40 bg-signal-green/10 text-signal-green";
  }

  if (status === "degraded") {
    return "border-signal-amber/40 bg-signal-amber/10 text-signal-amber";
  }

  return "border-signal-red/40 bg-signal-red/10 text-signal-red";
}

export default async function DataSourcesPage() {
  const health = await getDataSourceHealth();
  const coverage = sourceCoverageRows();

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Transparency"
        title="Data sources and coverage"
        copy="Every dashboard element carries a source label, freshness timestamp, frequency, and demo/live state. API keys are read server-side only."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-signal-green/30 bg-signal-green/10 p-4">
          <p className="text-sm font-semibold text-signal-green">healthy</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Live API connected and returned data. The bundled demo source is healthy because it is local.</p>
        </div>
        <div className="rounded-md border border-signal-amber/30 bg-signal-amber/10 p-4">
          <p className="text-sm font-semibold text-signal-amber">degraded</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Live data did not load or a key is missing, so demo fallback is being used.</p>
        </div>
        <div className="rounded-md border border-signal-red/30 bg-signal-red/10 p-4">
          <p className="text-sm font-semibold text-signal-red">unavailable</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Adapter is missing, not implemented, or failed with no fallback available.</p>
        </div>
      </div>

      <Panel title="Adapter health">
        <div className="overflow-hidden rounded-md border border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Live metadata</th>
                <th className="px-4 py-3 font-medium">Coverage</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {health.map((source) => (
                <tr key={source.name} className="bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{source.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusClass(source.status)}`}>{source.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{source.mode}</td>
                  <td className="px-4 py-3 text-slate-300">{source.frequency}</td>
                  <td className="px-4 py-3 text-xs leading-5 text-slate-400">
                    <p>Category: {source.statusCategory ?? source.status}</p>
                    <p>Indicator: {source.indicatorName ?? "N/A"}</p>
                    <p>Country: {source.country ?? "N/A"}</p>
                    <p>Source name: {source.sourceName ?? source.name}</p>
                    <p>Endpoint: {source.endpoint ?? "N/A"}</p>
                    <p>Copied OECD URL: {source.developerApiDataUrl ?? "N/A"}</p>
                    <p>Example OECD URL: {source.exampleDeveloperApiDataUrl ?? "N/A"}</p>
                    <p>Series: {source.seriesId ?? "N/A"}</p>
                    <p>Date: {source.latestDataDate ?? "N/A"}</p>
                    <p>Unit: {source.unit ?? "N/A"}</p>
                    <p>Live/demo status: {source.liveDemoStatus ?? source.mode}</p>
                    <p>HTTP status: {source.httpStatus ?? "N/A"}</p>
                    <p>Content type: {source.responseContentType ?? "N/A"}</p>
                    <p>CSV headers: {source.detectedCsvHeaders?.length ? source.detectedCsvHeaders.join(", ") : "N/A"}</p>
                    <p>
                      Latest observation:{" "}
                      {source.latestObservation
                        ? `${source.latestObservation.date} = ${source.latestObservation.value}${source.latestObservation.unit ? ` ${source.latestObservation.unit}` : ""}`
                        : "N/A"}
                    </p>
                    <p>Parser error: {source.parserError ?? "N/A"}</p>
                    <p>Fallback reason: {source.fallbackReason ?? "N/A"}</p>
                    <p>Last updated: {source.lastUpdated ?? source.latestSuccessfulUpdate ?? "N/A"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{source.coverage}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {source.notes}
                    {source.latestSuccessfulUpdate ? <p className="mt-1 text-xs text-slate-500">Last live check: {source.latestSuccessfulUpdate}</p> : null}
                    {source.responseBodyPreview ? <p className="mt-1 text-xs text-slate-500">Response preview: {source.responseBodyPreview}</p> : null}
                    {source.adapterDetails?.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-slate-500">
                        {source.adapterDetails.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Indicator coverage">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coverage.map((indicator) => (
            <div key={indicator.id} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
              <Database className="mb-3 h-5 w-5 text-signal-cyan" aria-hidden="true" />
              <p className="font-semibold text-white">{indicator.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {indicator.category} - {indicator.frequency} - {indicator.unit}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{indicator.description}</p>
              <p className="mt-3 text-xs text-slate-500">Source: {indicator.source}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
