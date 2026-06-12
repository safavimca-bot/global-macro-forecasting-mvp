"use client";

import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/constants";

export function CountrySelector() {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      <span className="hidden sm:inline">Country</span>
      <select
        className="rounded-md border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none transition focus:border-signal-cyan"
        defaultValue=""
        onChange={(event) => {
          if (event.target.value) {
            router.push(`/country/${event.target.value}`);
          }
        }}
      >
        <option value="" disabled>
          Select country
        </option>
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </label>
  );
}
