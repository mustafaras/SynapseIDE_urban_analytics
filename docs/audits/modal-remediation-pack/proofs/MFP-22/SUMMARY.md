# MFP-22 — Release/publish assets — SUMMARY

**Gate:** release (typecheck + lint + build + e2e-a11y) · **Depends on:** MFP-21 (done).

## Change
- `index.html` `<title>` "Coder App - Professional Code Editor" -> "Synapse IDE — GIS &amp;
  Urban Analytics Workbench" (= BRAND.full; matches runtime document.title, no flicker).
- Favicon `/vite.svg` -> `/favicon.svg`; added `public/favicon.svg` — an original synapse-node
  product mark (amber core + blue satellite nodes on a dark tile; no third-party assets).
- Added `<head>` meta: description (reuses package.json description), theme-color, og:type/
  title/description/image, twitter:card/title/description/image.
- Added `public/og-image.png` — original 1200×630 share card (rendered via chromium-1194),
  brand-consistent ("Synapse IDE / GIS & Urban Analytics / Workbench / v0.9.0").
- `package.json` name -> `synapse-ide-urban-analytics-workbench`; version 1.0.0 -> **0.9.0**
  (owner-confirmed); `BRAND.version` already 0.9.0 (in sync).

## Gate (release)
- `npm run typecheck` clean (typecheck-clean.txt) · `npm run lint:errors` clean (lint.txt)
- `npm run build` exit 0 (build.txt); built dist/index.html verified: correct title/favicon/
  og/twitter/theme-color, favicon.svg + og-image.png shipped, NO "Coder App"/"vite.svg".
- `npm run test:e2e:a11y` ENV-BLOCKED (Chromium 1217 missing) — substitute in e2e-a11y.txt
  (head-only metadata change, no a11y surface touched; re-run in a browser-capable env).

## Proof
- `screenshot/tab-title.png` — browser tab rendering the corrected BRAND.full title + favicon.
- `screenshot/share-preview.png` — the OG/Twitter share card (public/og-image.png).
- `screenshot/favicon.png` — the /favicon.svg product mark.
- `decision.md` — owner-confirmed name + semver (0.9.0).

This is the final pack item before publish.
