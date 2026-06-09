# 00 - Scope And Guardrails

## One-Sentence Objective

Redesign only the Map Explorer UI shell and interaction layout so it feels like a premium professional GIS application while preserving all existing behavior and scientific truthfulness.

## In Scope

- Opening/readiness modal redesign.
- Left panel layout, tab hierarchy, width behavior, and content fit.
- Right panel/dock architecture.
- Removal of the persistent bottom panel as a workspace surface.
- Migration of bottom-panel content into right-panel tabs.
- Consolidation of scattered sketch, drawing, measurement, annotation, selection, and diagnostics panels.
- Header/top toolbar hierarchy and visual treatment.
- Advanced bottom status bar.
- Tokenized visual polish, scroll discipline, responsive behavior, keyboard/focus behavior, and visual QA.
- Tests and documentation required to prove no Map Explorer functionality was broken.

## Out Of Scope

- Replacing MapLibre, deck.gl, workers, SpatialDB, or analytical engines.
- Changing CRS, geometry, QA, provenance, evidence, or report semantics except to surface them more clearly.
- Rewriting the Urban Analytics module.
- Rewriting Synapse IDE panels.
- Adding fake datasets, fake citations, synthetic QA readiness, or demo data that is not explicitly labelled.
- Continuing archived operating packs as if they were active.

## Canonical Surface

Build on the accepted canonical surface:

- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/map/`
- `src/stores/useMapExplorerStore.ts`
- `src/stores/useMapToolbarPreferencesStore.ts`
- `src/services/map/`
- `src/services/map/contracts/gisContracts.ts`

Do not extend `src/components/map/` for this redesign except where an existing architecture document explicitly designates logic as reusable.

## Existing Components To Treat Carefully

| Surface | Current role | Redesign instruction |
| --- | --- | --- |
| `MapExplorerModalComposition.tsx` | Large orchestrator for modal composition, panel state, status bar, bottom panel, dialogs, and runtime wiring. | Change incrementally. Extract only when behavior is covered by tests. Preserve data-testid and keyboard paths unless replacement tests are added. |
| `MapWorkspaceShell.tsx` | Shell primitives: activity rail, command bar, panel rails, canvas region, bottom timeline primitives. | Evolve into the main layout primitive. Remove bottom workspace assumptions. |
| `mapDocking.ts` | Panel width and left/right/bottom placement logic. | Replace bottom placement with left/right/drawer rules. Add right-panel union entries for migrated surfaces. |
| `MapWorkspaceCockpit.tsx` | Readiness/cockpit summary currently reused in ways that can crowd panels. | Split into launch modal content and compact workspace summary. Do not render full launch content inside the left panel. |
| `bottom/MapBottomPanel.tsx` | Problems, attributes, timeline, tasks, diagnostics bottom workspace. | Decompose or migrate content into right-panel surfaces. Retire persistent bottom workspace usage. |
| `MapStatusBar.tsx` | Bottom status strip with clickable status items. | Upgrade into the only bottom surface. Keep it dense, clickable, and non-overlapping. |
| Floating draw/sketch panels | Tool-specific floating UI. | Consolidate into docked panel tabs and anchored micro-popovers only. |

## User Evidence IDs

These IDs anchor the plan and should be used in commits, tests, and completion notes.

| ID | Evidence | Problem |
| --- | --- | --- |
| `IMG-01` | Opening readiness cockpit screenshot | Over-large dark modal, excess whitespace, nested scroll, weak hierarchy, reads like a panel rather than a premium launch flow. |
| `IMG-02` | Left panel data tab screenshot | Left rail and tab content mismatch, content clipped by resizable width, low hierarchy, launch/modal concepts leaking into panel architecture. |
| `IMG-03` | Bottom diagnostics panel screenshot | Bottom panel consumes the map and creates a non-GIS workbench feel; diagnostics should be in a right inspector surface. |
| `IMG-04` | Floating sketch panel screenshot | Small floating sketch panel feels detached and scattered, not integrated into the professional panel system. |

## Functional Non-Regression Contract

The redesign must preserve these capabilities:

- Map open/close and keyboard launch.
- MapLibre canvas lifecycle, resize, pan/zoom/rotate, cursor, viewport persistence.
- Base map switching.
- Search/geocoding and result selection.
- Layer stack add/remove/reorder/visibility/opacity/metadata/QA badges.
- Import paths: GeoJSON/JSON, CSV, KML/KMZ/GPX, Shapefile ZIP, GeoPackage, Arrow/Feather/IPC, GeoParquet, local files, demo packs.
- Source health, catalog, connection, and source registry logic.
- Draw tools: point, line, polygon, rectangle, circle, annotation, AOI flows.
- Measurement tools and units.
- Selection, attributes, feature inspection, and context menu behavior.
- Scientific QA and CRS preflight behavior.
- NL query panel and queryable-layer constraints.
- Workflow drawer and reversible actions.
- Report handoff, export, image export, package export, publication composer.
- Review timeline, audit events, tasks, performance diagnostics.
- VoxCity/3D bridge and viewport sync indicators.
- Project save/load, autosave status, unsaved state, local-only collaboration status.
- Accessibility roles, focus trap, skip links, keyboard navigation, disabled-state reasons.

## Scientific Guardrails

- Never compute area or distance in EPSG:4326.
- Do not mutate evidence artifacts to fake readiness.
- Treat unknown data fitness as unknown, not ready.
- Keep sample/demo modes visibly labelled.
- Keep CRS, source, layer ID, feature count, temporal scope, QA caveats, and provenance visible wherever detail surfaces move.

## Layout Guardrails

- The map canvas is the primary work surface.
- The left side is for navigation, layer/data organization, catalog, source intake, and stable workspace browsing.
- The right side is for inspectors, tools, analysis detail, attributes, diagnostics, problems, timeline, report, workflow, and task detail.
- The bottom edge is only the status bar.
- Floating UI is allowed only for transient anchored controls: context menu, tooltip, search results, compact picker, or short confirmation popover.
- No persistent floating sketch/tool/diagnostic cards.
- No card-in-card composition.
- No large marketing hero layout.
- No placeholder strips or empty visual filler.

## State Guardrails

- Use Zustand store selectors. Do not add React Context for app state.
- Do not pass heavy geometry through generic events.
- Keep panel placement, active right panel, active left tab, and status-bar intent as serializable state where persistence is useful.
- Preserve existing action audit and undo/redo semantics.
- Add migration logic for persisted layout state if a removed `bottomPanel` key exists.

## Styling Guardrails

- Use `mapTokens.ts`, existing GIS primitives, or CSS Modules scoped to Map Explorer.
- No Tailwind in `src/centerpanel/`.
- No hardcoded one-off color ramps unless routed through tokens.
- Text must fit within all buttons, status items, tabs, and panel headers.
- Avoid one-note palette drift. Keep a restrained premium GIS palette with clear semantic states.
- Icons should use lucide where an appropriate icon exists.

## Validation Minimums

For any implementation touching Map Explorer UI:

```bash
npm run typecheck
npm run lint:errors
npm run test -- src/centerpanel/components/map
```

For this full redesign:

```bash
npm run typecheck
npm run lint:errors
npm run test:analytics
npm run test:e2e
```

If the full suite is too slow during a prompt, run the targeted gate named in `06_QA_AND_REGRESSION_GATES.md` and record what was not run in `07_ANTI_AMNESIA_LEDGER.md`.

