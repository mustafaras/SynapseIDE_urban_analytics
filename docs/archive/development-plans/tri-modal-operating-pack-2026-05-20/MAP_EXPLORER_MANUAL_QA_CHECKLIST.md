# Map Explorer Manual QA Checklist

Premium scientific GIS cockpit acceptance pass. Run this checklist when an E2E spec is unavailable, unstable, or insufficient for visual coverage. Each block lists the source-of-truth journey from `MAP_EXPLORER_DEVELOPMENT_PLAN.md` section 25.3, the visible affordances that must be honest, and the expected truthful states.

> Validation commands are listed at the bottom. Execute them before declaring the checklist green.

## How to use

- Walk through every section in order. Stop the moment any state is fake, silent, or contradictory.
- For each step, record one of: `pass`, `pass with caveat`, `fail`. Caveats must name the specific state and the root cause.
- Pair a manual run with the matching Playwright spec from the list at the bottom whenever the spec is healthy. Manual coverage does not replace E2E; it gates premium polish.
- Do not skip a block because "nothing changed there". Cross-module wiring drifts silently — these checks are the trip-wire.

## A. Workspace shell and cockpit

1. Open Map Explorer from the cockpit. The canvas should mount inside 300 ms once chunks are warm; first cold open should not exceed two seconds and should never show an empty grey panel.
2. Cockpit status strip shows truthful AOI, QA, workflow/export, and sync context. Empty states must say `No AOI`, `QA not run`, etc. — never invent a number.
3. Toggle between modal, embedded, and presentation modes (where exposed). Rails, drawers, and the right dock keep their last widths within `MAP_LAYER_PANEL_MIN_WIDTH` / `MAX_WIDTH` clamps.
4. Skip link focuses the map canvas. Tab order: cockpit → toolbar → layer rail → canvas → right dock → drawers → timeline → close. Focus never disappears.

## B. Import paths

1. Import a GeoJSON file. The new layer surfaces feature count, geometry type, declared CRS (or `unknown`), license/attribution if present, and an evidence artifact id.
2. Import a CSV with malformed rows. Skipped row count is shown explicitly; preview shows up to five rows; coordinate columns are auto-detected or marked unknown.
3. Import an Arrow / GeoParquet file. Worker progress is visible; schema, memory estimate, transfer size, and quality summary all appear before commit.
4. External service (Overpass/OSM): live fetch surfaces attribution; cached result reuses cache without re-fetching; offline / disabled state degrades to inline fallback or a truthful error.

## C. AOI, drawing, and measurement

1. Draw a polygon AOI. The active AOI id updates in the cockpit, and the layer rail shows AOI-bound evidence affordances.
2. Switch measurement unit between metric and imperial. Existing measurements re-label, no values are recomputed in EPSG:4326.
3. Drawn features persist across modal close/reopen but do not leak through to projects with `skipViewport`.
4. Removing the last AOI clears `activeAoiId` and all AOI-bound action labels degrade to `No AOI selected`.

## D. Layer manager

1. Toggle visibility, opacity, and z-order. Reorder via drag and via the keyboard move up/down actions; both produce the same result.
2. Disabled handoffs (export, report, dashboard, education) explain the reason (`Missing CRS`, `QA blocker`, `Not publishable`, etc.) instead of going silent.
3. Delete confirmation requires explicit acknowledgement; cancelling leaves the layer unchanged.
4. Analysis-result layers carry stale flags when an upstream data layer changes; the badge is visible and the QA panel reflects it.

## E. Scientific QA

1. Run QA over a moderate stack (under 150 ms outside worker geometry checks). Issue groups: CRS, geometry, schema, license, publication readiness.
2. A blocker issue blocks export and report handoff; the block reason is visible on the disabled control via tooltip and accessible description.
3. After acknowledging caveats, report/dashboard handoff unblocks but the caveat travels into the report insert and dashboard binding.
4. `setScientificQA` with the same signature is idempotent (no visible re-render flicker in the layer rail).

## F. Workflow drawer

1. Open the workflow drawer. Manifest preview lists method requirements, inputs, expected outputs, and the apply gate.
2. Apply a workflow. The result is registered as evidence with QA, lineage, and a reproducibility manifest; the derived layer appears with `analysis` group and stale flag tracking.
3. Rail keyboard resize works (arrow keys ± modifiers) and respects clamps.
4. Cancelling mid-apply leaves no orphan evidence artifact in the registry.

## G. Report handoff drawer

1. Open the report handoff drawer. Readiness lists structured evidence blocks, snapshot status, and insert ids.
2. Insert a handoff. The report builder receives structured metadata with evidence ids, QA caveats, and snapshot references — no FeatureCollection in the payload.
3. Snapshot capture preserves the current viewport, AOI, visible layers, and the active analysis result.
4. Re-inserting an existing handoff updates the existing entry rather than creating a duplicate.

## H. Review timeline

1. Append events for layer registry, QA, query, workflow apply, export, report handoff, and snapshot. Each event categorises correctly and exposes the linked layer ids and evidence ids.
2. Filter by event type, layer, status, date window, and free-text query. Filters compose.
3. Export Markdown and JSON. Both formats are deterministic and human-legible; oversized previews are truncated.
4. The timeline never exceeds `MAP_REVIEW_SESSION_EVENT_LIMIT`; oldest synthetic events drop first.

## I. Cross-module bridges

1. Map → Urban: AOI plus analysis layer becomes a method-readiness payload. Urban method dispatch shows truthful readiness and references the evidence id.
2. Urban → Map: Incoming method request previews QA and CRS readiness; explicit accept-before-apply path is honoured; rejection records audit.
3. Map → IDE: Workflow and export IDE artifact requests open a typed tab with manifest content (SQL, JSON, Markdown) referencing the map evidence id.
4. IDE → Map: Recognised IDE files (e.g. exported SQL, manifest JSON) appear as layer artifact candidates with truthful readiness labels.

## J. Temporal, scenario, and VoxCity

1. Temporal playback registers evidence per frame export. Playback at 0.5×, 1×, 2× respects clamps; pause is sticky.
2. Scenario comparison preserves stable handoff ids and caveat lineage.
3. VoxCity sync: real-layer path registers `voxcity-handoff` evidence; sample/demo mode is labelled explicitly and never claims live data.

## K. Accessibility and keyboard

1. Keyboard fallback controls (pan, zoom, reset, focus) operate without a mouse. Reduced-motion respects `prefers-reduced-motion`.
2. Icon-only controls have accessible names (toolbar, layer rail, drawers, timeline). Disabled controls describe their disabled reason.
3. axe smoke (`npm run test:e2e:a11y -- --grep "map modal"`) passes without violations.
4. Escape closes drawers and the modal without leaking focus into the body.

## L. Performance and memory

1. Open Map Explorer twice in the same session. Second open is under 300 ms.
2. Toggle visibility on a 100 k-feature layer. UI remains responsive; rendering happens off the main thread via the existing worker pool where applicable.
3. Long copilot session: queue more than 50 proposals. The proposal registry remains bounded (`MAP_COPILOT_PROPOSAL_LIMIT`); audit trail remains bounded (`MAP_COPILOT_AUDIT_TRAIL_LIMIT`). Pending entries are never trimmed.
4. Worker timeout or failure surfaces a truthful failed status on the related layer/workflow; the worker pool recycles its slot.

## M. Theme and visual coherence

1. Map Explorer reads exclusively from `mapTokens`; no Tailwind in `src/centerpanel/`.
2. Focus rings, hairline borders, and surface colours match the shared map token set across cockpit, layer rail, drawers, and timeline.
3. No "coming soon" placeholders. Every disabled control has a real reason.
4. Map Explorer remains map-first: no panel grows wider than its clamp; the canvas always owns the largest screen region.

## Validation commands

Execute the subset that matches the surface you touched. Record results in the Prompt Execution Log.

```text
npm run typecheck
npm run lint:errors
npm run test
npm run build
npm run test:e2e:smoke
npx playwright test e2e/map-modal-layout.spec.ts
npx playwright test e2e/map-context-and-geojson.spec.ts
npx playwright test e2e/map-csv-kml-gpx-import.spec.ts
npx playwright test e2e/map-columnar-io.spec.ts
npx playwright test e2e/map-choropleth.spec.ts
npx playwright test e2e/map-point-symbology.spec.ts
npx playwright test e2e/map-report-handoff.spec.ts
npx playwright test e2e/map-temporal-player.spec.ts
npx playwright test e2e/map-spatial-stats-renderers.spec.ts
npx playwright test e2e/map-image-export.spec.ts
npx playwright test e2e/map-explorer-stability.spec.ts
npx playwright test e2e/accessibility-audit.spec.ts -- --grep "map modal"
```

## Recording results

For each block above, append a row to the Prompt Execution Log in `MAP_EXPLORER_IMPLEMENTATION_LEDGER.md`:

```
| YYYY-MM-DD | Manual QA | block X.Y | pass / pass-with-caveat / fail | one-line note |
```

If anything fails, do not declare the checklist green. Open a follow-up entry under "Known Risks" with the exact reproduction and the affected file or service.
