# Global Macro Outlook AI

An MVP website for an AI-powered global macroeconomic forecasting and risk dashboard. The app presents country macro profiles, risk scores, regime classifications, charts, simple forecasts, source transparency, and AI-style country outlook reports.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js.

## Build and Test

```bash
npm run build
npm run test
```

## Environment Variables

Copy `.env.example` to `.env.local` and add any available keys:

- `FRED_API_KEY`
- `BLS_API_KEY`
- `BEA_API_KEY`
- `EIA_API_KEY`
- `ALPHA_VANTAGE_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_NAME`

API keys are never exposed to client components. If keys are absent, the app stays in demo data mode.

## Demo Data Mode

The MVP ships with deterministic local demo data for:

- United States
- Canada
- Euro Area
- China
- Japan
- United Kingdom
- Germany
- India
- Brazil
- Mexico

Demo values are intentionally isolated in `src/lib/demo-data.ts` and labeled as "Demo data, not live" in the interface.

## Deployment

This is a live Next.js app, not a static-only export. It uses App Router server components, dynamic routes, API routes, server-side data fetching, live data adapters, and environment variables. Deploy it to Vercel or another host that supports Next.js server rendering and route handlers.

For the Safavim WordPress.com site, use WordPress as the public landing page and navigation entry point, then link to the Vercel deployment. See:

- `README_DEPLOYMENT.md`
- `WORDPRESS_LINK_GUIDE.md`

## Data Sources

Implemented adapters:

- Demo data fallback
- World Bank API
- Bank of Canada Valet API
- Statistics Canada WDS
- ECB / Eurostat
- IMF Data
- OECD Data Explorer SDMX
- BIS Data
- FRED API
- BLS API
- BEA API health check
- EIA API health check

No-key public APIs load live where mappings and network access are available. Key-based APIs use the environment variables listed above. If a key or live mapping is missing, the app keeps working with clearly labeled demo fallback data.

## Adding a New Data Source

1. Create a class that implements `DataAdapter`.
2. Implement `fetchSeries`, `searchIndicators`, and `healthCheck`.
3. Register it in `src/lib/data/adapters.ts`.
4. Preserve source labels, timestamps, and demo/live flags.

## Adding a New Indicator

1. Add the indicator definition in `src/lib/constants.ts`.
2. Add demo coverage in `src/lib/demo-data.ts`.
3. Map the indicator in one or more live adapters.
4. Add scoring or page logic if the indicator changes a risk category.

## Forecasting Limitations

Forecasts use simple last-observation, moving-average, and linear-trend baselines. Scenario bands are illustrative and not institutional-grade macro forecasts.

## Legal and Financial Disclaimer

Forecasts, classifications, and risk scores are for research, education, and decision-support only. They are not investment, legal, tax, or financial advice.
