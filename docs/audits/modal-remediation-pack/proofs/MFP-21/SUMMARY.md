# MFP-21 — Branding & product-name consistency — SUMMARY

**Gate:** general · **requiresHumanDecision:** yes (see decision.md) · **Owner-confirmed name.**

## Change
Created `src/constants/brand.ts` as the single source of truth (`BRAND.full` = "Synapse IDE —
GIS & Urban Analytics Workbench", `BRAND.short` = "Synapse IDE", `version` = "0.9.0", no
tagline). Replaced the four divergent shell literals (`SynapseIDE` ×3 + `Welcome to
SynapseIDE` + `// Welcome to Synapse IDE`) with `BRAND.short`; `document.title` → `BRAND.full`;
UA chunk-fallback copy → `BRAND.short`. WelcomeModal title now derives from `BRAND` (IDE-led,
GIS-inclusive), keeping `#welcome-modal-title` + classes (MFP-14 preserved).

UrbanAnalyticsModal keeps "Urban Analytics Workbench" (module name + e2e accessible-name
contract) — documented in decision.md.

## Gate (general) — green
- `npm run typecheck` clean (typecheck-clean.txt)
- `npm run lint:errors` clean (lint-clean.txt)
- No `SynapseIDE` / `Welcome to Synapse IDE` literals remain in `src/App.tsx`.
- WelcomeModal.a11y (MFP-14) still passes (accessible name still contains "Urban Analytics").

## Proof
- `screenshot/welcome-after.png` — real-Chromium (chromium-1194) render of the WelcomeModal
  showing the unified brand "Synapse IDE · GIS & Urban Analytics · [Workbench]". Welcome
  title + dialog accessible name both resolve to "Synapse IDE · GIS & Urban Analytics
  Workbench".
- `document.title` is `BRAND.full`; the static `index.html` <title> + favicon/meta + version
  bump (0.9.0) are MFP-22.

Unblocks MFP-22.
