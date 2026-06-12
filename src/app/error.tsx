"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-md border border-signal-red/30 bg-signal-red/10 p-6 shadow-panel">
      <p className="text-sm font-semibold text-white">Something went wrong while loading the dashboard.</p>
      <p className="mt-2 text-sm text-slate-300">The app is designed to fall back to demo data if live data is unavailable.</p>
      <button className="mt-4 rounded-md bg-signal-red px-4 py-2 text-sm font-semibold text-white" onClick={() => reset()}>
        Retry
      </button>
    </div>
  );
}
