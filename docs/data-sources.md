# Data Sources

The MVP includes a common `DataAdapter` interface with these methods:

- `fetchSeries(params)`: returns observations for a country and indicator.
- `searchIndicators(query)`: returns indicators supported by the adapter.
- `healthCheck()`: returns status, coverage, frequency, and notes.

## Implemented Adapters

- Demo data: deterministic local data for all MVP countries and indicators.
- World Bank API: no-key annual global indicators where supported.
- Bank of Canada Valet API: no-key Canadian FX and selected financial series.
- Statistics Canada WDS: no-key live service health check; indicator-specific vector mappings still need to be added before dashboard series use it.
- ECB / Eurostat: no-key ECB live health check; dataset-specific mappings still need to be expanded.
- IMF Data: no-key IMF DataMapper indicators for GDP growth, inflation, unemployment, and current-account data where covered.
- OECD Data: no-key OECD Data Explorer SDMX adapter. Paste official copied Developer API data URLs into `src/lib/data/oecd-mappings.ts` for each indicator. Until an active URL is pasted, the adapter reports that the OECD API is reachable but the indicator is not mapped yet, then uses demo fallback. The retired `stats.oecd.org` OECD.Stat API is no longer used.
- BIS Data: no-key BIS statistics API coverage for selected policy-rate series where covered.
- FRED API: U.S. macro-financial series when `FRED_API_KEY` is configured.
- BLS API: U.S. CPI, unemployment, and wage proxies when `BLS_API_KEY` is configured.
- BEA API: key-aware health check when `BEA_API_KEY` is configured.
- EIA API: key-aware health check when `EIA_API_KEY` is configured.

## Placeholder Adapters

There are no IMF, OECD, or BIS placeholders now. Any future source that has no adapter and no fallback should report `unavailable`.

## Status Meaning

- `healthy`: live API connected and returned data, or the local demo source is available.
- `degraded`: live data did not load or a key is missing, so demo fallback is being used.
- `unavailable`: the adapter is missing, not implemented, or failed with no fallback.

## Demo Mode

If API keys are missing or a live fetch fails, the app remains usable through demo data mode. Demo values are clearly labeled as demo data and should not be mistaken for live official data.

## OECD URL Mapping

OECD does not require an API key. To enable an OECD series, open `src/lib/data/oecd-mappings.ts` and paste the official OECD Data Explorer Developer API data URL into `developerApiDataUrl` for the matching indicator. Also fill in `seriesId` and, if useful, the latest official `date`.

The CPI mapping includes a ready-to-copy example URL in `exampleDeveloperApiDataUrl`. Keep `developerApiDataUrl` blank to stay in demo fallback mode, or paste the official copied OECD URL there to activate live fetches.
