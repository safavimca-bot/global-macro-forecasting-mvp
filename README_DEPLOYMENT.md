# Deploying Global Macro Forecasting MVP

This project should be deployed to Vercel, not directly inside WordPress.com Premium hosting.

## Deployment Decision

The app requires live Next.js server support. It is not a static-only site because it includes:

- App Router server components.
- Dynamic pages such as `/country/[countryCode]`.
- API routes at `/api/country/[countryCode]` and `/api/data-sources`.
- Server-side data fetching through the data adapter layer.
- Environment variables for live API keys and OpenAI report generation.
- `force-dynamic` pages for dashboards, country views, forecasting, AI reports, and data-source health.

WordPress.com Premium should be used for the public page and navigation link. The live app should run on Vercel.

## Push the Project to GitHub

1. Create a new GitHub repository named `global-macro-forecasting-mvp`.
2. Keep `.env.local`, API keys, `node_modules`, `.next`, `dist`, and `build` out of Git.
3. From the project folder, initialize Git if needed:

```bash
git init
git add .
git commit -m "Prepare global macro forecasting MVP for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/global-macro-forecasting-mvp.git
git push -u origin main
```

If the repository already exists locally, use the existing remote and push your current branch.

## Import into Vercel

1. Sign in to Vercel.
2. Choose Add New Project.
3. Import the GitHub repository.
4. Use these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | Leave as Vercel default for Next.js |
| Root directory | Repository root |

Do not use `next export` or a static output setting. This app needs server rendering and route handlers.

## Required Environment Variables

Add these in Vercel under Project Settings -> Environment Variables.

| Variable | Required? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Optional | Public app name shown in the UI. |
| `FRED_API_KEY` | Optional, recommended | Enables live FRED data for supported U.S. indicators. |
| `BLS_API_KEY` | Optional, recommended | Enables live BLS data for supported U.S. indicators. |
| `BEA_API_KEY` | Optional | Enables BEA health checks and future BEA live adapters. |
| `EIA_API_KEY` | Optional | Enables EIA health checks and future energy adapters. |
| `OPENAI_API_KEY` | Optional | Enables live OpenAI-generated country reports. |
| `OPENAI_MODEL` | Optional | Defaults to `gpt-4.1-mini` if blank. |
| `ALPHA_VANTAGE_API_KEY` | Optional | Reserved in `.env.example` for market-data expansion. |

Leave unknown keys blank. The app keeps demo fallback active when a key is missing.

## OECD Data Explorer Mappings

OECD does not require an API key. Live OECD series URLs are configured in:

```text
src/lib/data/oecd-mappings.ts
```

To update a mapping:

1. Open OECD Data Explorer.
2. Select the exact indicator, country, frequency, and unit.
3. Open Developer API.
4. Choose the flat CSV data URL.
5. Paste that URL into the matching mapping entry.
6. Keep `format=csvfilewithlabels` in the URL.

If a mapping is missing or invalid, the Adapter Health page shows the exact fallback reason and keeps demo data active.

## Test the Deployment

After Vercel deploys, test the Vercel URL first:

```text
https://YOUR-PROJECT.vercel.app/
```

Then check:

- `/dashboard`
- `/country/US`
- `/api/country/US`
- `/data-sources`
- `/api/data-sources`
- `/ai-report`

The Adapter Health page should show:

- `healthy` when live data loads.
- `degraded` when demo fallback is used.
- Clear missing-key messages for key-based APIs.
- OECD endpoint, HTTP status, content type, latest observation, and parser details when available.

## Troubleshooting Missing API Keys

If a source is degraded and says a key is missing:

1. Open Vercel Project Settings.
2. Go to Environment Variables.
3. Add the missing key for Production, Preview, and Development as needed.
4. Redeploy the project. Environment variable changes apply only to new deployments.
5. Recheck `/data-sources`.

If OpenAI reports show deterministic fallback text, add `OPENAI_API_KEY` and redeploy.

## Update the App Later

1. Make code changes locally.
2. Run:

```bash
npm install
npm run build
npm run test
```

3. Commit and push to GitHub:

```bash
git add .
git commit -m "Update global macro dashboard"
git push
```

4. Vercel will automatically create a new deployment from the pushed commit.

## WordPress.com Integration

Use the WordPress page at:

```text
https://safavim.com/global-macro/
```

as the landing page. Add a button from that page to the Vercel app URL. See `WORDPRESS_LINK_GUIDE.md`.

If you later configure a subdomain, use:

```text
https://global-macro.safavim.com/
```

as the direct dashboard URL after connecting it to the Vercel project.
