# Map Explorer Premium Redesign Archive

Date: 2026-06-05  
Archived: 2026-06-08  
Status: archived historical operating pack  
Original root path: `map-explorer-premium-redesign-2026-06-05/`  
Scope owner: Map Explorer canonical surface

This folder preserves the June 2026 Map Explorer premium redesign operating pack as historical execution material. The implementation ladder itself is exhausted: prompts 00 through 18 were implemented, and Prompt 19 entered closeout revalidation.

During the final 2026-06-08 revalidation pass, local Node tooling was available again and several late closeout regressions were fixed, including the top-shell close control contract, launch-dialog dismissal on workspace entry points, and multiple e2e locator drifts caused by the redesigned command surface. Prompt 19 was not promoted to `verified` in this archive because the full Playwright closeout has not completed green end-to-end after the targeted repairs.

## Completion Summary

- Prompt count: 20.
- Prompt ladder status in `05_IMPLEMENTATION_PROMPTS.json`: prompts 00-18 `implemented`, prompt 19 `blocked`.
- 2026-06-08 closeout validations that passed during archive prep: `npm run typecheck`, `npm run lint:errors`, `npm run test:analytics`, `npm run build`, focused Playwright reruns for Prompt 03 accessibility, Prompt 34 3D interaction, AI guardrails, catalog, choropleth, and the late-suite Map Explorer specs repaired during archive closeout.
- Focused Playwright repairs now pass for `e2e/map-columnar-io.spec.ts`, `e2e/map-contents.spec.ts`, `e2e/map-context-and-geojson.spec.ts`, `e2e/map-csv-kml-gpx-import.spec.ts`, `e2e/map-explorer-stability.spec.ts`, `e2e/map-external-service.spec.ts`, `e2e/map-figure-composer.spec.ts`, and `e2e/map-image-export.spec.ts`.
- Remaining blocker at archive time: full `npm run test:e2e` was not rerun after the last targeted fix, so Prompt 19 remains blocked rather than verified.

## File Index

| File | Purpose |
| --- | --- |
| `00_SCOPE_AND_GUARDRAILS.md` | Non-regression contract, issue IDs, current surface map, and source-file guardrails. |
| `01_OPENING_MODAL_SPEC.md` | Startup/readiness modal specification. |
| `02_PANEL_ARCHITECTURE_SPEC.md` | Left/right panel, right dock, and no-bottom-panel architecture spec. |
| `03_TOP_AND_STATUS_BAR_SPEC.md` | Unified top command surface and bottom status bar spec. |
| `04_VISUAL_INTERACTION_SYSTEM.md` | Visual language, density, accessibility, scroll, motion, and responsive rules. |
| `05_IMPLEMENTATION_PROMPTS.md` | Human-readable prompt ladder. |
| `05_IMPLEMENTATION_PROMPTS.json` | Structured prompt ladder manifest. |
| `06_QA_AND_REGRESSION_GATES.md` | Validation commands, screenshot gates, and non-regression scenarios. |
| `07_ANTI_AMNESIA_LEDGER.md` | Canonical historical execution state, decisions, completion records, and residual blockers. |
| `08_BASELINE_SURFACE_INVENTORY.md` | Baseline inventory of the original failing surfaces. |
| `AGENT_NEXT_PROMPT.md` | Archived handoff note explaining that there is no active next prompt anymore. |
| `ARCHIVE_INDEX.md` | Short archive entry point and closeout evidence. |

## Historical Entry Point

Start here for review:

1. `ARCHIVE_INDEX.md`
2. `07_ANTI_AMNESIA_LEDGER.md`
3. `05_IMPLEMENTATION_PROMPTS.json`
4. `05_IMPLEMENTATION_PROMPTS.md` only when prompt-level detail is needed

This archive is historical reference only. Do not resume it as an active root-level operating pack.
