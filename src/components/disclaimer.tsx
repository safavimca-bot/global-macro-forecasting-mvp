import { DISCLAIMER } from "@/lib/constants";

export function Disclaimer() {
  return (
    <div className="rounded-md border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm leading-6 text-slate-200">
      <strong className="text-signal-amber">Research disclaimer:</strong> {DISCLAIMER}
    </div>
  );
}
