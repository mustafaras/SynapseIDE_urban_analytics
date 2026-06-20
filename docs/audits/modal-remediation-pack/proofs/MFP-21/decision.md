# MFP-21 — owner branding decision (2026-06-20)

`requiresHumanDecision: true` — confirmed with the owner via AskUserQuestion before editing.

## Questions asked
1. Canonical product name (src/constants/brand.ts single source of truth).
2. Tagline for meta description / og:description.
3. Release version for public title/meta + package.json.

## Owner's answers
- **Name:** must include **GIS** and must include **Synapse IDE** ("ide de geçmeli synapse
  IDE her zaman olsun"). → Confirmed canonical:
  - `full`  = **"Synapse IDE — GIS & Urban Analytics Workbench"** (matches the spec's GIS-inclusive default)
  - `short` = **"Synapse IDE"**
- **Tagline:** *no preference* → per the MFP-21 constraint "no invented taglines; omit the
  field if the owner declines", the `tagline` field is **omitted** from BRAND.
- **Version:** **0.9.0** (pre-1.0 public). Set as `BRAND.version`; MFP-22 aligns
  `index.html`/`package.json` to it.

## Applied
- New `src/constants/brand.ts` (frozen `BRAND`, `as const`, no `tagline` field).
- `src/App.tsx`: shell header / hero / sidebar (`SynapseIDE`) + welcome `h2`
  (`Welcome to SynapseIDE`) + status bar (`// Welcome to Synapse IDE`) → `BRAND.short`;
  `document.title` → `BRAND.full`; Urban Analytics chunk-fallback copy → `${BRAND.short} workspace …`.
- `WelcomeModal.tsx`: title spans driven from `BRAND.short` + "GIS & Urban Analytics" /
  "Workbench"; `#welcome-modal-title` id + brand classes preserved (MFP-14 intact).
- **UrbanAnalyticsModal.tsx deliberately unchanged:** its visible badge + sr-only
  `#urban-modal-title` keep "Urban Analytics Workbench" — that is the **Urban Analytics
  module** name and the **accessible name the e2e suite selects on**
  (`e2e/helpers/urbanAnalytics.ts` + specs: `getByRole("dialog", { name: "Urban Analytics
  Workbench" })`). Renaming it would regress e2e (hard rule) and is a module identity, not the
  shell product-name divergence MFP-21 targets.
