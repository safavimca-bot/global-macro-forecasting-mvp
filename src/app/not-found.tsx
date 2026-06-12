import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";

export default function NotFound() {
  return (
    <div>
      <SectionHeading title="Page not found" copy="That route is not available in this MVP." />
      <Link className="rounded-md bg-signal-blue px-4 py-2 text-sm font-semibold text-navy-950" href="/dashboard">
        Open dashboard
      </Link>
    </div>
  );
}
