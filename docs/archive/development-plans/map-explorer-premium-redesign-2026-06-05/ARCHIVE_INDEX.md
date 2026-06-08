# Map Explorer Premium Redesign Archive Index

Archived: 2026-06-08.

Original root path: `map-explorer-premium-redesign-2026-06-05/`.

Closeout evidence before archive:

- Prompt ladder status: prompts 00 through 18 are `implemented`; prompt 19 remains `blocked` in `05_IMPLEMENTATION_PROMPTS.json` because the full `npm run test:e2e` gate has not completed green end-to-end.
- 2026-06-08 validation passes recorded during archive prep: `npm run typecheck`, `npm run lint:errors`, `npm run test:analytics`, `npm run build`, `npx playwright test e2e/accessibility-audit.spec.ts --grep "map modal exposes skip navigation, keyboard map focus, close control, and no serious axe issues"`, `npx playwright test e2e/map-3d-design.spec.ts`, `npx playwright test e2e/map-ai-guardrails-p58.spec.ts`, `npx playwright test e2e/map-catalog.spec.ts`, `npx playwright test e2e/map-choropleth.spec.ts`, and focused reruns for the late-suite drift repaired during archive closeout.
- Focused Playwright repairs now pass for `e2e/map-columnar-io.spec.ts`, `e2e/map-contents.spec.ts`, `e2e/map-context-and-geojson.spec.ts`, `e2e/map-csv-kml-gpx-import.spec.ts`, `e2e/map-explorer-stability.spec.ts`, `e2e/map-external-service.spec.ts`, `e2e/map-figure-composer.spec.ts`, and `e2e/map-image-export.spec.ts`. The final Playwright `.last-run` state contains no failed tests after the targeted reruns.
- Remaining blocker at archive time: full-suite closeout was not rerun after the last targeted fix, so Prompt 19 is intentionally not promoted to `verified`.

Start here when reviewing the archived pack:

1. `README.md` - archive overview and file index.
2. `07_ANTI_AMNESIA_LEDGER.md` - historical execution state, completion notes, and residual blockers.
3. `05_IMPLEMENTATION_PROMPTS.json` - final prompt status manifest.
4. `05_IMPLEMENTATION_PROMPTS.md` - prompt ladder text when prompt-level audit detail is needed.

This archive is historical reference only. Do not resume it as an active prompt ladder.