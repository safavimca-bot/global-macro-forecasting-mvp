# Export Features

Global Macro Outlook AI includes user-facing export controls for the main dashboard modules. Exports are designed for research review, transparency, and reproducibility.

## What Users Can Download

| Page | CSV | JSON | PNG chart |
| --- | --- | --- | --- |
| Global Dashboard | Country risk heatmap data, regime mix data, oil chart data | Same data with metadata | Oil Recharts chart |
| Country Profile | Country observations, risk scores, regime details, CPI forecast data | Same data with metadata | GDP, inflation, unemployment, policy rate, debt, current account, risk radar, and forecast charts |
| Inflation Tracker | CPI, wage, oil, food, and country inflation-risk ranking data | Same data with metadata | CPI and food-pressure charts |
| Central Bank Monitor | Policy rate, CPI, 10-year yield, real policy rate, yield-curve slope, and monetary-tightness ranking data | Same data with metadata | Policy-rate and 10-year yield charts |
| Fiscal Monitor | Debt, fiscal balance, GDP, CPI, policy rate, nominal growth, debt arithmetic, and fiscal-stress ranking data | Same data with metadata | Debt and fiscal-balance charts |
| Credit Cycle Dashboard | Credit growth, NPL, yield data, yield-curve slope, credit-stress score, and country ranking data | Same data with metadata | Credit-growth and NPL charts |
| External Vulnerability | Current account, FX, reserves, external debt, vulnerability score, and country ranking data | Same data with metadata | Current-account and FX charts |
| Commodity and Energy Tracker | Oil, gas, copper, food, CPI, and commodity-exposure score data | Same data with metadata | Oil, gas, copper, and food charts |
| Forecasting Lab | CPI input data plus moving-average, linear-trend, and last-observation forecast outputs | Same data with metadata | Forecast charts for each scenario |
| AI Country Report | Report data as structured JSON | Structured report payload | Not applicable |
| Data Sources / Adapter Health | Adapter status, endpoint, series ID, HTTP status, parser error, fallback reason, and last updated timestamp | Same data with metadata | Not applicable |

## CSV Export

CSV downloads are created from arrays of plain records. Values are escaped for commas, quotation marks, and line breaks. Empty datasets still produce a metadata-only row so the export remains traceable.

CSV rows include row-level metadata columns such as:

- project name
- website
- module/page
- country when applicable
- generated timestamp
- source names
- series IDs
- units
- data status
- disclaimer

## JSON Export

JSON downloads use a consistent payload:

```json
{
  "metadata": {
    "projectName": "Global Macro Outlook AI",
    "website": "https://global-macro-forecasting-mvp.vercel.app/",
    "title": "Export title",
    "module": "Page or module name",
    "generatedAt": "ISO timestamp",
    "disclaimer": "Research and transparency notice"
  },
  "data": []
}
```

The metadata can include country, indicator names, units, frequency, source names, endpoints, series IDs, live/demo/fallback status, and notes.

## PNG Chart Export

PNG export is implemented inside a client component and targets visible SVG charts rendered by Recharts. The chart SVG is serialized and drawn to a browser canvas, then downloaded as a PNG with a safe filename.

This avoids server-rendering issues because browser-only APIs are used only in client code.

## Filename Rules

Export filenames are:

- lowercase
- hyphen-separated
- free of spaces
- tagged with the current generated date

Examples:

- `global-dashboard-risk-heatmap-2026-06-13.csv`
- `country-profile-us-2026-06-13.json`
- `inflation-tracker-cpi-chart-2026-06-13.png`
- `adapter-health-2026-06-13.csv`

## Data-Source Transparency

Exports may include live, demo, degraded, fallback, or unavailable data. Users should check the Adapter Health page and Methodology page before using downloaded data for research or decisions.

## Privacy and Security

Exports include public source metadata such as source names, endpoints, series IDs, dates, units, and status diagnostics. Exports never include:

- `.env.local`
- API keys
- server-only environment variables
- private logs
- secrets

API keys remain server-side only.

## Limitations

- PNG export currently supports visible SVG charts such as Recharts charts. DOM-only panels, tables, and the country heatmap export as CSV/JSON rather than PNG.
- The main country scoring pipeline still uses the demo observation cache as its safe baseline.
- AI report downloads are research artifacts and should not be treated as official forecasts.
- Browser clipboard access depends on user permissions and browser support.
