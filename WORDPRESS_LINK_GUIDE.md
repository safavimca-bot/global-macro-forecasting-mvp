# WordPress.com Link Guide for Global Macro

Use WordPress.com for the public page and menu item. Host the live Next.js app on Vercel.

Target WordPress page:

```text
https://safavim.com/global-macro/
```

Recommended dashboard URL:

```text
https://YOUR-PROJECT.vercel.app/
```

Replace `https://YOUR-PROJECT.vercel.app/` with the real Vercel deployment URL after deployment.

## Best Practical Setup

Because safavim.com is on WordPress.com Premium, do not try to upload and run the live Next.js server inside WordPress.com hosting.

Use this setup instead:

1. Deploy the Next.js app to Vercel.
2. Create a WordPress page at `/global-macro/`.
3. Add an `Open Dashboard` button that links to the Vercel app.
4. Add a top navigation item named `Global Macro` that links to `https://safavim.com/global-macro/`.

This keeps your main website URL clean while preserving the live API features in the Vercel-hosted app.

## Create the WordPress Page

1. Sign in to WordPress.com.
2. Open the dashboard for `safavim.com`.
3. Go to Pages.
4. Create a new page.
5. Set the title to:

```text
Global Macro Forecasting Dashboard
```

6. Set the page slug to:

```text
global-macro
```

7. Add the page content below.
8. Publish the page.
9. Confirm the page opens at:

```text
https://safavim.com/global-macro/
```

## Suggested WordPress Page Content

Use regular WordPress blocks, or paste this text and add a Button block manually.

```text
Global Macro Forecasting Dashboard

An interactive macroeconomic monitoring and forecasting MVP covering country risk, inflation, central banks, fiscal conditions, credit, external balances, commodities, forecasting, AI reports, methodology, and data-source transparency.

Button text: Open Dashboard
Button URL: https://YOUR-PROJECT.vercel.app/
```

Recommended Button block settings:

- Text: `Open Dashboard`
- Link: `https://YOUR-PROJECT.vercel.app/`
- Open in new tab: enabled

## Optional HTML Button Snippet

If you prefer a Custom HTML block, paste this after replacing the Vercel URL:

```html
<section style="max-width: 860px; margin: 0 auto; padding: 48px 20px;">
  <h1>Global Macro Forecasting Dashboard</h1>
  <p>
    An interactive macroeconomic monitoring and forecasting MVP covering country risk,
    inflation, central banks, fiscal conditions, credit, external balances, commodities,
    forecasting, AI reports, methodology, and data-source transparency.
  </p>
  <p>
    <a
      href="https://YOUR-PROJECT.vercel.app/"
      target="_blank"
      rel="noopener"
      style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #0891b2; color: #ffffff; text-decoration: none; font-weight: 700;"
    >
      Open Dashboard
    </a>
  </p>
</section>
```

## Add Global Macro to the Top Navigation

The exact WordPress.com menu editor depends on your theme.

### If Your Theme Uses the Site Editor

1. Go to Appearance -> Editor.
2. Open the header or template part that contains the navigation.
3. Select the Navigation block.
4. Add a new page link or custom link.
5. Label it:

```text
Global Macro
```

6. Link it to:

```text
https://safavim.com/global-macro/
```

7. Save the template changes.

### If Your Theme Uses Classic Menus

1. Go to Appearance -> Menus.
2. Select the primary/top menu.
3. Add the `Global Macro Forecasting Dashboard` page, or add a custom link.
4. Use this navigation label:

```text
Global Macro
```

5. Use this URL:

```text
https://safavim.com/global-macro/
```

6. Save the menu.

## Optional Iframe Embed

A button link is recommended because the dashboard is a full interactive app with charts, navigation, API status pages, and dynamic routes. A full app inside an iframe can feel cramped, may not behave as well on mobile, and can be affected by browser privacy or embedding restrictions.

Use an iframe only if you specifically want the app visually embedded inside the WordPress page and the embed is accepted by your WordPress.com plan/theme.

Custom HTML iframe snippet:

```html
<iframe
  src="https://YOUR-PROJECT.vercel.app/"
  title="Global Macro Forecasting Dashboard"
  style="width: 100%; min-height: 900px; border: 0; border-radius: 8px;"
  loading="lazy"
></iframe>
```

If WordPress removes the iframe after saving, use the button-link setup instead.

## If You Need the Exact URL `/global-macro/`

The best practical setup is:

```text
https://safavim.com/global-macro/
```

as the WordPress landing page, with a button or optional iframe pointing to the Vercel app.

WordPress.com Premium should remain the host for the landing page. Vercel should host the live Next.js app.

## Optional Subdomain Setup

A subdomain gives the dashboard its own clean URL:

```text
https://global-macro.safavim.com/
```

To connect it to Vercel:

1. In Vercel, open the project.
2. Go to Settings -> Domains.
3. Add:

```text
global-macro.safavim.com
```

4. Vercel will show the required DNS record.
5. In WordPress.com, open domain DNS records for `safavim.com`.
6. Add the CNAME record exactly as Vercel shows it.

Typical shape:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `global-macro` | Copy the Vercel-provided target |

7. Wait for DNS propagation.
8. Test:

```text
https://global-macro.safavim.com/
```

After this works, the WordPress `/global-macro/` page can link to the subdomain instead of the default `vercel.app` URL.
