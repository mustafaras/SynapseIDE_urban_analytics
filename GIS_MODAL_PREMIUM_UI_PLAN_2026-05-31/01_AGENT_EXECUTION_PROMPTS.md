# GIS Modal Premium UI Execution Prompts

Date: 2026-05-31
Pack: GIS Modal Premium UI Redesign
Scope: Map Explorer / GIS modal only
Primary plan: `GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md`
Ledger: `LEDGER.md`

This is a fresh prompt ladder. Do not resume the archived Map Explorer Production GIS ladder. That ladder is complete and historical.

Prompt count: 56. Prompts 01-21 define the workbench architecture and hardening gates. Prompts 22-56 are deeper implementation slices for Map Explorer's concrete surfaces, services, panels, GIS caveats, motion, and premium visual behavior.

---

## Cold-Start Boot Block

Copy this block into a new agent session before the selected prompt. It is the anti-amnesia entry point.

```text
You are executing the fresh GIS Modal Premium UI Redesign pack.

Do not resume the archived Map Explorer Production GIS ladder.
Active pack:
- Plan: GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md
- Prompts: GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/01_AGENT_EXECUTION_PROMPTS.md
- Ledger: GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/LEDGER.md

Before editing:
1. Read AGENTS.md.
2. Read this boot block.
3. Read only the plan sections named by the selected prompt.
4. Read the selected prompt and the ledger status row.
5. Run git status --short, git branch --show-current, git log --oneline -5.
6. Confirm the working branch and create gis-modal-ui/pNN-<slug> from gis-modal-ui/premium-redesign.

Execution rules:
- Preserve all GIS functionality.
- Keep command palette complete.
- Keep Map Explorer scientific truthfulness visible.
- Use mapTokens.ts and GIS UI primitives.
- No Tailwind in centerpanel.
- No heavy geometry/source bytes/raster cells/3D payloads in layout state.
- Update LEDGER.md in the same commit.
- Commit and push the prompt branch, then fast-forward and push integration.
```

---

## Token-Friendly Operating Model

Use this pack without flooding context.

1. Load the smallest useful context:
   - always read the selected prompt
   - read only the plan sections referenced by that prompt
   - use `rg` for exact symbols before opening large files
   - open focused file slices instead of entire large orchestrators where possible
2. Keep local notes compact:
   - record decisions in `LEDGER.md`, not in long chat prose
   - do not paste large source excerpts into the ledger
   - summarize validation by command and outcome
3. Preserve prompt locality:
   - one prompt, one branch, one commit stack
   - do not start later prompts while closing the current one
   - if a discovered defect blocks the prompt, record it as a blocker instead of silently expanding scope
4. Reuse common contracts:
   - the Agent Contract applies to every prompt
   - the Premium UI Quality Bar applies to every visible prompt
   - prompt-specific sections define only the delta

---

## User Request Adaptation Protocol

This ladder is detailed, but it must still adapt to future user direction.

When the user changes priority, aesthetic target, scope, or sequencing:

1. Do not silently abandon the ladder.
2. Identify the affected prompt numbers.
3. Update `LEDGER.md` with an "Adaptation note" before implementation if the change affects scope, sequencing, validation, or proof.
4. If the request only changes visual taste inside the same prompt, record it in that prompt's Done Log row.
5. If the request adds a new surface, add a new prompt row instead of expanding an unrelated prompt.
6. If the request removes or defers a capability, mark that capability deferred in the ledger and keep command reachability/provenance truthful.
7. Never use user-request adaptation to bypass:
   - CRS preflight
   - demo/synthetic labels
   - source provenance
   - evidence immutability
   - accessibility
   - validation
   - commit/push closeout

Adaptation categories:

| Category | Action |
| --- | --- |
| Visual taste change | Keep prompt number; update proof checklist and Done Log |
| New GIS capability surface | Add a new prompt or split the nearest pending prompt |
| Sequencing change | Update ledger dependency notes and Current Pointer |
| Validation failure | Mark `[!]` blocked or add a corrective prompt |
| Scope conflict | Ask user only if the conflict cannot be resolved by preserving existing behavior |

---

## Premium UI Quality Bar

Every visible prompt must satisfy this quality bar.

### VS Code Workbench Standard

- Activity rail is stable, icon-led, and semantic.
- Command center is compact: title/breadcrumb, search, palette, primary action, overflow, close.
- Left sidebar contains task navigation and tree/list surfaces.
- Right inspector explains the selected object or active workflow.
- Bottom panel contains operational truth: Problems, Attributes, Timeline, Tasks, Diagnostics.
- Status bar is dense, clickable where useful, and never decorative.

### Professional GIS Standard

- Layer hierarchy, source state, CRS, QA, geometry type, feature count, and publication readiness are visible where decisions are made.
- Basemap controls are visually separate from analytical layers.
- CRS/projection/vertical datum/noData caveats are never hidden behind polished styling.
- Demo, Synthetic, Sample, Generated, External, Metadata only, Unavailable, and Recoverable states stay explicit.
- Disabled analysis/export controls name the missing prerequisite.

### Visual Standard

- Use `mapTokens.ts`, `ui/*`, and CSS Modules.
- Dense but readable rows; stable dimensions; no layout jump on hover or badge change.
- Thin separators, restrained accent bars, compact tabs, consistent status chips.
- No marketing hero layout, decorative orbs, nested cards, or broad gradient treatment.
- Long layer/source names wrap professionally without clipping action controls.

### Motion Standard

- Use existing motion classes where applicable:
  - `panelIn`
  - `fadeIn`
  - `layerFade`
  - `accentGrow`
  - `statusFlash`
  - `progressFill`
- Motion must be short and purposeful:
  - panel entrance around 180ms
  - row/status feedback around 150-220ms
  - no idle animation
  - no motion required to understand state
- `prefers-reduced-motion: reduce` must disable non-essential animation.
- Every prompt that changes visible motion must include a reduced-motion proof.

### Accessibility Standard

- Icon-only controls require `aria-label`.
- Disabled controls require visible or accessible disabled reason.
- Activity rail, tabs, sidebar, inspector, bottom panel, and command palette must be keyboard reachable.
- Focus returns to the opener when a sidebar/inspector/drawer closes.
- High-contrast mode cannot rely on color alone for active, blocked, demo, or warning states.

---

## Agent Contract

Every prompt must follow this contract.

1. Read:
   - `AGENTS.md`
   - `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md`
   - this prompt file
   - `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31/LEDGER.md`
   - prompt-specific files listed below
2. Reconcile state:
   - run `git status --short`
   - run `git branch --show-current`
   - inspect the ledger status table
   - choose the lowest-numbered incomplete prompt unless the user explicitly asks for a different prompt
3. Branch:
   - integration branch: `gis-modal-ui/premium-redesign`
   - prompt branch pattern: `gis-modal-ui/pNN-<slug>`
   - create each prompt branch from the current integration branch
4. Scope:
   - edit only Map Explorer / GIS modal surfaces unless the prompt explicitly names a supporting service/test/doc
   - preserve all current GIS behavior
   - do not alter Urban Analytics, Synapse IDE, or archived operating packs except for typed bridge compatibility explicitly required by a prompt
5. Scientific guardrails:
   - never hide missing CRS, user-declared CRS, demo/synthetic/sample/generated mode, metadata-only state, external dependency, unavailable source, noData, vertical datum caveat, or QA blocker
   - do not compute planar metric readiness from UI state
   - do not move raw source data, heavy geometry, raster cells, 3D payloads, or worker tables into layout state or command metadata
6. UI guardrails:
   - use `src/centerpanel/components/map/mapTokens.ts` and existing GIS primitives
   - no Tailwind in `centerpanel/`
   - no decorative cards-inside-cards
   - map canvas remains the primary work surface
   - all icon-only controls require accessible labels
   - disabled controls require concrete disabled reasons
7. Validation:
   - run each prompt's required validation commands
   - if a command is impossible, document the exact reason in `LEDGER.md`
8. Ledger:
   - update `LEDGER.md` in the same commit as the prompt work
   - flip the prompt status only after proof and validation are complete
   - append a Done Log row with branch, commit, files, proof, validation, and residual risk
9. Commit and push:
   - stage only files related to the prompt
   - commit message pattern: `feat(gis-modal-ui): pNN <short-title>`
   - for test-only prompts use `test(gis-modal-ui): pNN <short-title>`
   - for docs-only prompt updates use `docs(gis-modal-ui): pNN <short-title>`
   - push the prompt branch: `git push -u origin gis-modal-ui/pNN-<slug>`
   - fast-forward the integration branch and push it:
     - `git switch gis-modal-ui/premium-redesign`
     - `git merge --ff-only gis-modal-ui/pNN-<slug>`
     - `git push origin gis-modal-ui/premium-redesign`
   - if push or fast-forward fails, do not mark the prompt complete; mark it blocked in the ledger with the failure reason

---

## Prompt Output Schema

Each prompt must leave behind enough evidence for the next agent to resume without memory.

In `LEDGER.md`, record:

- selected prompt number and title
- branch name
- start commit SHA
- final commit SHA
- pushed branch name
- integration branch fast-forward status
- files changed
- validation commands and exact outcomes
- visible UI proof, if the prompt changes UI
- reduced-motion/high-contrast proof, if motion or state styling changed
- residual risk
- next recommended prompt

In the final chat response, keep it short:

- files changed
- validation run
- branch/commit/push status
- any blocker or residual risk

---

## Premium Prompt Matrix

Use this matrix with the individual prompt bodies. It makes the ladder detailed without repeating the same instructions in every prompt.

| Prompt | Premium design intent | Motion / interaction proof | Anti-amnesia proof |
| --- | --- | --- | --- |
| 01 | Establish a complete map of current commands, panels, overlays, dialogs, and target workbench homes. | No visible motion change. Prove no runtime UI change. | Coverage test proves no command/panel is unmapped. |
| 02 | Create the semantic IA for a VS Code-style GIS workbench: activities, tabs, inspector contexts, bottom tabs, task lenses. | No visible motion change. | Navigation model tests prove every inventory item maps to a stable target. |
| 03 | Replace ad hoc rail actions with premium semantic activity icons and active accent behavior. | Prove active rail accent uses existing focus/motion rules and reduced-motion remains safe. | Ledger records old rail actions and their new homes. |
| 04 | Turn the header into a compact command center instead of a crowded toolbar. | Prove overflow/palette open without layout shift. | Tests prove hidden commands remain palette-searchable. |
| 05 | Introduce the contextual sidebar shell with Overview, Data, and Layers as the first stable homes. | Prove sidebar enter/collapse behavior does not cover the canvas and respects reduced motion. | Ledger records mounted legacy panels and temporary wrappers. |
| 06 | Make Layers feel like a professional GIS contents surface, not separate layer/list panels. | Prove layer rows stay stable when badges/actions appear. | Tests prove all layer actions still exist after consolidation. |
| 07 | Make Data a source portal: import, catalog, services, restore health, demo data. | Prove import progress/status feedback remains visible. | Source support and restore states remain mapped to Data sections. |
| 08 | Create one right inspector host for selected context, starting with layer inspection. | Prove inspector open/close focus return and no overlapping old panel. | LayerInspector tabs and source-handle fields remain test-covered. |
| 09 | Promote QA to a Problems model that keeps scientific blockers unavoidable. | Prove blocked/caveat/demo states are distinct without color alone. | Problems rows link back to layers/sources/actions. |
| 10 | Add a bottom panel for operational truth and reduce floating panel sprawl. | Prove tab switching is stable, keyboard reachable, and does not cover status bar. | Bottom tab routing is recorded from status bar and panel openers. |
| 11 | Make analysis discoverable without weakening CRS gates or tool prerequisites. | Prove run/progress/blocked states remain visible. | Workflow/tool/query/model routes are listed in ledger. |
| 12 | Make cartography a premium GIS styling workspace with legend contract continuity. | Prove style previews do not jump layout and legend updates are visible. | Map/report/export legend equality remains test-covered. |
| 13 | Make raster, temporal, 3D, zoning, massing, sun/shadow, and VoxCity a coherent Scene workspace. | Prove active scene controls do not obscure unrelated 2D workflows. | Scene mode/source/CRS/vertical datum caveats remain recorded. |
| 14 | Make publishing a readiness workflow, not a cluster of export buttons. | Prove readiness checklist changes status clearly without idle animation. | Export/report/package inclusion rules are ledgered. |
| 15 | Normalize the whole shell into one premium visual system. | Prove reduced-motion, high-contrast, and no-overlap checks. | Visual QA results are recorded with viewport notes. |
| 16 | Lock the redesign with regression and visual QA. | Prove desktop/tablet/short viewport behavior and no hidden command loss. | E2E command/activity coverage becomes the resume safety net. |
| 17 | Add task lenses, layout reset, collapse-all, focus-map, and density recovery. | Prove density changes do not mutate analytical state. | Ledger records layout state boundaries. |
| 18 | Standardize canvas controls: fit, basemap, active tool, scale/legend/north-arrow. | Prove controls do not cover popups/status and active tools are cancellable. | Fit/basemap/tool commands are mapped to command palette and UI. |
| 19 | Add collaboration as a truthful Review surface. | Prove live/local-only/offline states are visually distinct. | Tests prove no raw geometry/source bytes enter collaboration UI. |
| 20 | Complete keyboard, focus, Escape, high-contrast, and reduced-motion interaction rules. | Prove a keyboard-only path through import, inspect, QA, palette. | Accessibility matrix becomes a reusable resume artifact. |
| 21 | Protect performance through lazy mounting and activity-switch responsiveness. | Prove inactive heavy panels are not mounted and map does not blank. | Build and performance evidence are recorded as final guardrail. |
| 22 | Audit and upgrade GIS tokens for VS Code-like chrome, density, and semantic states. | Prove token changes do not create one-note palettes or motion regressions. | Token snapshot/tests record the design contract. |
| 23 | Harden shared GIS primitives before larger panel refactors. | Prove icon buttons, tabs, chips, tooltips, and progress bars remain accessible. | Primitive tests become the UI contract for later prompts. |
| 24 | Build the command taxonomy and palette search vocabulary around real GIS actions. | Prove commands are searchable by GIS terms, shortcuts, and activity names. | Command map prevents hidden feature loss. |
| 25 | Polish command center visual hierarchy, breadcrumbs, and contextual primary actions. | Prove header stays one-line and stable across desktop/tablet widths. | Header behavior is ledgered before sidebar work expands. |
| 26 | Refine activity rail iconography, tooltip language, active accent, and bottom utility items. | Prove active accent, tooltip, focus, and reduced-motion behavior. | Rail IDs and target homes are recorded. |
| 27 | Make Overview cockpit a true professional spatial readiness surface. | Prove empty/data-loaded/stale/blocked states render with correct next action. | Readiness rules are documented and test-covered. |
| 28 | Redesign local import and preflight UX for supported formats. | Prove source format caveats stay visible before commit. | Import paths and format support remain mapped. |
| 29 | Redesign external services and source catalog UX. | Prove live/recoverable/unavailable/external-reference states stay distinct. | Source health records become resume evidence. |
| 30 | Redesign layer stack rows and grouped layer hierarchy. | Prove dense rows keep visibility, QA, CRS, source, and actions readable. | Layer action inventory remains complete. |
| 31 | Redesign Contents tree: groups, scale ranges, filters, duplicate/repair actions. | Prove group/filter/scale changes do not hide layer readiness. | Contents model tests cover state mapping. |
| 32 | Consolidate layer row actions into a premium command menu. | Prove every current per-layer action remains reachable. | Action parity table is recorded. |
| 33 | Expand right inspector polish for layer metadata, source, schema, CRS, QA, lineage. | Prove unknown/missing values render explicitly. | Inspector tabs remain the metadata source of truth. |
| 34 | Build CRS and QA fix flows into Problems and Inspector. | Prove user-declared CRS remains caveated and not verified. | CRS fix path is recorded with tests. |
| 35 | Move attribute table, field profiles, field calculator, and joins into a professional bottom workflow. | Prove map-row-selection round trip. | Table/data operation state boundaries are recorded. |
| 36 | Standardize canvas interaction tool strip for selection, draw, measure, AOI, and clear tool. | Prove active tools are visible, cancellable, and keyboard reachable. | Canvas interaction states are mapped. |
| 37 | Polish AOI and workflow launch ergonomics. | Prove AOI sources and CRS gates stay visible before run. | Workflow prerequisites are ledgered. |
| 38 | Redesign Processing Toolbox categories, parameter forms, runtime chips, and progress. | Prove blocked reasons and runtime mode chips render before execution. | Tool registry mapping is recorded. |
| 39 | Redesign Model Builder workflow graph and batch execution UX. | Prove chain/batch/export behavior remains intact. | Model run evidence is recorded. |
| 40 | Redesign NL Query and AI guardrail UX. | Prove human confirmation is required before apply. | AI proposal audit trail remains intact. |
| 41 | Polish spatial statistics and advanced analysis renderers. | Prove LISA/Gi*/hotspot outputs remain caveated and discoverable. | Renderer/output readiness is recorded. |
| 42 | Build Style workspace renderer and symbology surfaces. | Prove renderer eligibility and disabled reasons are visible. | Style update contract remains covered. |
| 43 | Build labels, annotations, and publication mark styling. | Prove labels/annotations do not obscure critical UI or caveats. | Label/annotation export behavior is recorded. |
| 44 | Guarantee legend contract parity across map, inspector, report, and export. | Prove serialized legend equality. | Legend parity test is the resume artifact. |
| 45 | Redesign Raster evidence UI: GeoTIFF, noData, histogram, sampled/full-stat state. | Prove noData/CRS/sample caveats remain visible. | Raster evidence state is recorded. |
| 46 | Redesign Temporal playback UI and frame export controls. | Prove reduced-motion disables autoplay/animation. | Temporal state contract is recorded. |
| 47 | Redesign 3D scene, terrain, CityJSON, and 3D Tiles UX. | Prove vertical datum/source/sample/generated chips are visible. | Scene source metadata remains lightweight. |
| 48 | Redesign zoning, massing, sun/shadow, corridor, and section controls. | Prove projected CRS and vertical assumptions remain visible. | Urban form analysis caveats are recorded. |
| 49 | Redesign VoxCity 2D/3D bridge surfaces. | Prove real vs sample geometry labels stay explicit. | VoxCity source priority is recorded. |
| 50 | Redesign Publish Figure and map book workflow. | Prove title/legend/scale/north arrow/attribution/CRS checklist. | Figure readiness is recorded. |
| 51 | Redesign data export, offline package, and report handoff surfaces. | Prove inclusion/exclusion and source bounds are visible before export. | Export/report/package evidence remains intact. |
| 52 | Redesign Review timeline, audit, collaboration, and comment surfaces. | Prove local-only/live/offline and evidence links are truthful. | Review/collab payload limits are recorded. |
| 53 | Redesign Diagnostics, observability, plugin registry, and recovery surfaces. | Prove redacted diagnostics and recoverable panel errors. | Diagnostic privacy and plugin mapping are recorded. |
| 54 | Finalize preferences, task lenses, layout reset, density, and persistence boundaries. | Prove reset/density do not mutate analytical state. | Layout persistence keys are recorded. |
| 55 | Run the full accessibility and keyboard interaction pass. | Prove keyboard-only import-to-QA path and scoped Escape behavior. | Accessibility matrix becomes final artifact. |
| 56 | Run final performance, visual QA, build, and release-readiness gate. | Prove lazy mount, no blank canvas, no overlap, and build success. | Final readiness record closes the pack. |

---

## Prompt 01 - Command and Panel Inventory

Goal: create a complete, test-backed inventory of current Map Explorer commands, modal panels, hidden toggles, canvas overlays, drawers, dialogs, and target premium-UI homes. No visible UI changes.

Read first:

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/mapExperience.ts`
- `docs/architecture/map-explorer-state-and-actions.md`
- `GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md` sections 5, 6, 7, 10, 19, 20

Deliver:

- Add a navigation/inventory module under `src/centerpanel/components/map/navigation/`.
- Inventory every existing command and panel flag that affects Map Explorer UI.
- Map each item to one target home:
  - Overview
  - Data
  - Layers
  - Analyze
  - Style
  - Scene
  - Publish
  - QA
  - Review
  - Diagnostics
  - Extensions
  - Status Bar
  - Command Palette
  - Canvas Overlay
- Include hidden/test-only toggles in the inventory so they are not forgotten.
- Add tests proving there are no unmapped command/panel IDs in the inventory.
- Do not change runtime rendering.

Must preserve:

- current toolbar command behavior
- current command palette behavior
- current panel open/close flags
- existing `data-testid` values

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- inventory coverage test passes
- ledger names every added file
- no visual behavior changed

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 02 - Navigation Model

Goal: add the formal premium activity/navigation model used by later prompts. No visible UI changes.

Read first:

- Prompt 01 inventory module
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/mapExperience.ts`
- `src/centerpanel/components/map/mapTokens.ts`
- `GIS_MODAL_PREMIUM_UI_REDESIGN_PLAN.md` sections 6, 9, 12, 20

Deliver:

- Add `mapNavigationModel.ts` under `src/centerpanel/components/map/navigation/`.
- Export stable types:
  - `MapActivityId`
  - `MapActivityPlacement`
  - `MapSidebarTabId`
  - `MapInspectorContextId`
  - `MapBottomPanelTabId`
  - `MapTaskLensId`
- Define activity order:
  - Overview
  - Data
  - Layers
  - Analyze
  - Style
  - Scene
  - Publish
- Define utility/bottom activities:
  - QA
  - Review
  - Diagnostics
  - Extensions
- Define task lenses:
  - Analyst
  - Planner
  - Reviewer
  - Publisher
- Link every inventory item from Prompt 01 to the navigation model.
- Add tests for ordering, labels, keyboard-safe metadata, and command coverage.

Must preserve:

- no runtime visible changes
- no new persisted app state
- no hidden command removals

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__
npm run lint:errors
```

Proof:

- navigation model tests pass
- every inventory command has a target activity

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 03 - Activity Rail Refresh

Goal: replace feature-by-feature activity rail items with stable premium workbench activities while preserving all existing commands through sidebars, handlers, and command palette.

Read first:

- Prompt 02 navigation model
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/ui/GisIconButton.tsx`
- `src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx`

Deliver:

- Render the activity rail from the navigation model.
- Add local active-activity state in the modal composition.
- Keep activity rail accessible:
  - `aria-label`
  - active state
  - focus-visible state
  - disabled reason when applicable
- Keep old feature handlers reachable through command palette or temporary activity actions.
- Add `data-map-active-activity` on the shell surface or composition root.
- Preserve `data-testid="map-activity-rail"`.

Must preserve:

- layer panel, catalog, contents, processing, layout, 3D, QA, export, save reachability
- command palette complete command set
- focus trap behavior
- modal open/close behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- activity rail switches activities
- all prior rail actions remain reachable
- no layout overlap at desktop smoke viewport

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 04 - Command Center

Goal: simplify the header into a premium command center while keeping the full command registry available to the command palette.

Read first:

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/services/map/commands/MapCommandPalette.ts`
- Prompt 02 navigation model
- Prompt 03 activity rail work

Deliver:

- Split command data from visible toolbar rendering.
- Add a compact command-center component or equivalent structure:
  - title / breadcrumb
  - place search
  - command palette trigger
  - active activity or task lens selector
  - contextual primary action
  - grouped overflow
  - close action
- Keep the full command list searchable in the palette.
- Group overflow commands by the taxonomy from the plan.
- Preserve keyboard shortcuts:
  - command palette
  - undo
  - redo
  - map canvas controls
- Add tests proving hidden toolbar commands are still palette-searchable.

Must preserve:

- every existing `MapToolbar` handler
- disabled reason behavior
- import progress display/reachability
- export/report/save/load reachability

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- header no longer behaves as a broad button belt
- palette still reaches all mapped commands
- disabled commands expose reasons

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 05 - Sidebar Host

Goal: introduce the contextual left sidebar host and mount Overview, Data, and Layers activities using existing components first.

Read first:

- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx`
- `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`

Deliver:

- Add `src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx`.
- Sidebar must support:
  - activity title
  - compact tab strip
  - scroll containment
  - empty states
  - close/collapse behavior
- Mount:
  - Overview using `MapWorkspaceCockpit`
  - Data using current import/catalog entry points
  - Layers using current layer stack and contents entry points
- Use existing components before refactoring their internals.
- Avoid duplicated panel chrome where possible.

Must preserve:

- existing layer manager actions
- existing catalog actions
- hidden file input ownership in modal composition
- current data import behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- Overview, Data, and Layers activities render in one stable sidebar
- import, catalog, layer stack, and contents remain reachable

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 06 - Layers Consolidation

Goal: unify layer stack and contents tree under one professional Layers activity.

Read first:

- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx`
- `src/centerpanel/components/map/contents/contentsModel.ts`
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
- `src/centerpanel/components/map/__tests__/MapContentsModel.test.ts`

Deliver:

- Layers activity tabs:
  - Stack
  - Contents
  - Sources
  - Cartography
- Keep layer rows dense and readable:
  - visibility
  - name
  - source kind
  - QA/publication readiness
  - geometry/feature count
  - action menu or compact action area
- Add embedded variants or props to remove duplicate outer chrome.
- Surface source restore status per layer.
- Keep cartography recommendation entry points.

Must preserve:

- visibility
- opacity
- reorder
- remove confirmation
- inspect
- attribute table
- declare CRS
- repair geometry
- open in IDE
- send to Urban
- report/dashboard/education actions
- rerun stale analysis
- cartography recommendation apply/dismiss/undo

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapContentsModel.test.ts
npx vitest run src/centerpanel/components/map/__tests__/map-components.test.ts
npm run lint:errors
```

Proof:

- Stack and Contents are one activity, not competing panels
- all layer actions still work
- demo/synthetic and QA chips remain visible

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 07 - Data Consolidation

Goal: unify local imports, catalog, external services, source restore, and demo data under the Data activity.

Read first:

- `src/centerpanel/components/MapDataImportHubDialog.tsx`
- `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx`
- `src/centerpanel/components/MapServiceDialog.tsx`
- `src/services/map/MapDataImporter.ts`
- `src/services/map/sources/MapSourceRegistry.ts`
- `docs/map-source-support-matrix.md`

Deliver:

- Data activity sections:
  - Add Data
  - Connections
  - Catalog
  - Source Health
  - Demo Data
- Keep modal-owned hidden file input.
- Provide source readiness counts:
  - restored/live
  - recoverable
  - unavailable
  - external
  - metadata-only
  - demo/synthetic
- Keep external-provider caveats visible.
- Keep format limitations from the support matrix truthful.

Must preserve:

- GeoJSON/CSV/Arrow/GeoParquet/KML/KMZ/GPX/Shapefile/GPKG import behavior
- columnar preview behavior
- skipped-row diagnostics
- external service health checks
- no credential persistence
- demo/synthetic labels

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapDataIO.test.ts
npx vitest run src/services/map/__tests__/MapSourceRegistry.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx
npm run lint:errors
```

Proof:

- Data activity can trigger import and external service flows
- source health remains explicit
- no false support claims are introduced

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 08 - Inspector Host

Goal: create one right-side inspector host and migrate the layer inspector into it.

Read first:

- `src/centerpanel/components/map/inspector/LayerInspector.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/__tests__/layer-inspector.test.tsx`

Deliver:

- Add `src/centerpanel/components/map/inspector/MapInspectorHost.tsx`.
- Inspector contexts:
  - none / map context
  - layer
  - feature selection placeholder
  - QA issue placeholder
  - workflow preview placeholder
  - publish placeholder
  - scene placeholder
- Move `LayerInspector` into the host.
- Use right rail on desktop and bottom drawer on compact layout.
- Keep focus return to opener.

Must preserve:

- LayerInspector tabs:
  - Overview
  - Source
  - Schema
  - CRS
  - QA
  - Style
  - Lineage
  - Report
- explicit unknown/missing values
- style apply behavior
- source handle display

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/layer-inspector.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- layer inspector opens in the right host
- no overlapping old inspector panel remains
- layer inspection behavior is unchanged

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 09 - QA Problems Panel

Goal: make scientific QA blockers and warnings a first-class Problems surface.

Read first:

- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/services/map/MapScientificQA.ts`
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/mapEvidenceArtifacts.ts`
- `docs/architecture/map-crs-and-qa-method-note.md`

Deliver:

- Add a Problems model/component for:
  - CRS blockers
  - geometry validity
  - noData warnings
  - vertical datum caveats
  - temporal metadata gaps
  - source/provenance gaps
  - external provider risks
  - demo/synthetic/generated modes
- Each problem row must include:
  - severity
  - affected layer/source
  - reason
  - action target
- Route QA/status interactions to Problems where practical.
- Keep `ScientificQAPanel` semantics intact.

Must preserve:

- existing QA statuses
- exact blocker/warning truthfulness
- no false readiness
- disabled action reasons

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapScientificQA.test.ts
npx vitest run src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- Problems surface shows blockers/warnings grouped by severity
- QA details remain available
- demo/synthetic and missing CRS are never muted

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 10 - Bottom Panel

Goal: add the VS Code-style bottom panel and mount Problems, Attributes, Timeline, Tasks, and Diagnostics.

Read first:

- Prompt 09 Problems work
- `src/centerpanel/components/map/table/MapAttributeTable.tsx`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`

Deliver:

- Add `src/centerpanel/components/map/bottom/MapBottomPanel.tsx`.
- Tabs:
  - Problems
  - Attributes
  - Timeline
  - Tasks
  - Diagnostics
- Move or mount existing attribute table, review timeline, and diagnostics into the bottom panel.
- Add status bar routing:
  - QA opens Problems
  - selected features opens Attributes
  - review count opens Timeline
  - render/performance opens Diagnostics
- Ensure bottom panel never covers the status bar.

Must preserve:

- attribute row selection and map focus behavior
- review timeline events and revert command
- diagnostics retry behavior
- worker/task status truthfulness

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/map-performance-diagnostics.test.tsx
npx vitest run src/centerpanel/components/map
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- bottom panel tabs are keyboard navigable
- attribute table and timeline no longer compete as random floating panels
- status bar routes to the correct tabs

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 11 - Analyze Workspace

Goal: group workflows, processing toolbox, model builder, NL query, and spatial statistics under one Analyze activity.

Read first:

- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx`
- `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx`
- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/services/map/processing/MapProcessingRegistry.ts`
- `src/services/map/crs/CrsPreflight.ts`

Deliver:

- Analyze tabs:
  - Workflows
  - Tools
  - Query
  - Models
  - Statistics
  - Data Operations
- Preserve preview/apply/run flows.
- Keep blocked reasons visible before run.
- Route selected run/output details into inspector where practical.
- Keep command palette shortcuts.

Must preserve:

- CRS preflight
- workflow drawer behavior
- processing runtime labels
- model builder run/batch/export behavior
- NL query guardrails and human confirmation
- LISA/Gi*/Emerging hotspot reachability

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapProcessingRegistry.test.ts
npx vitest run src/services/map/__tests__/MapWorkflowService.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapProcessingToolbox.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx
npm run lint:errors
```

Proof:

- Analyze activity exposes every analysis path
- blocked tools name prerequisites
- no CRS gate is bypassed

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 12 - Style Workspace

Goal: group symbology, choropleth, labels, legend, and cartography advisor under one Style activity.

Read first:

- `src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx`
- `src/centerpanel/components/map/inspector/style/legendContract.ts`
- `src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx`
- `src/centerpanel/components/MapChoroplethLayer.tsx`
- `src/services/map/MapCartographyAdvisor.ts`
- `src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts`

Deliver:

- Style tabs:
  - Renderer
  - Symbols
  - Labels
  - Legend
  - Advisor
- Add active layer style header:
  - layer name
  - geometry type
  - renderer eligibility
  - QA/publication readiness
- Keep legend preview and serialized legend contract aligned.
- Keep cartography recommendation apply/dismiss/undo.

Must preserve:

- choropleth behavior
- point symbology behavior
- label and legend specs
- report/export legend equality
- classification caveats

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts
npx vitest run src/services/map/__tests__/MapCartographyAdvisor.test.ts
npm run lint:errors
```

Proof:

- Style activity contains all renderer/cartography entry points
- map legend, report legend, and export legend remain contract-compatible

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 13 - Scene Workspace

Goal: group raster, temporal, 3D, zoning, massing, sun/shadow, and VoxCity under one Scene activity.

Read first:

- `src/centerpanel/components/map/raster/RasterLayerPanel.tsx`
- `src/centerpanel/components/map/temporal/TemporalPlayerPanel.tsx`
- `src/centerpanel/components/map/scene3d/Scene3DPanel.tsx`
- `src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx`
- `src/centerpanel/components/map/zoning/MassingScenarioPanel.tsx`
- `src/centerpanel/components/map/scene3d/SunShadowPanel.tsx`
- `src/centerpanel/components/MapVoxCityOverlay.tsx`

Deliver:

- Scene tabs:
  - Raster
  - Temporal
  - 3D Scene
  - Zoning
  - Massing
  - Sun/Shadow
  - VoxCity
- Add scene status chips:
  - source mode
  - CRS
  - vertical datum
  - sample/generated
  - sync state
- Keep 3D/raster/temporal panels lazy where practical.
- Keep scene controls from obscuring unrelated 2D workflows.

Must preserve:

- raster noData/histogram/QA behavior
- temporal reduced-motion behavior
- 3D scene evidence behavior
- zoning/massing/sun workflows
- VoxCity real vs sample labels
- viewport sync

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/RasterHistogramEngine.test.ts
npx vitest run src/centerpanel/components/map/__tests__/temporalPlayback.test.ts
npx vitest run src/services/map/__tests__/Map3DSceneController.test.ts
npm run lint:errors
```

Proof:

- Scene activity exposes all advanced scene paths
- sample/generated/vertical datum/CRS caveats remain visible
- heavy scene panels do not mount eagerly unless selected

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 14 - Publish Workspace

Goal: group figure composer, image export, data export, offline package, and report handoff under one Publish activity with a readiness checklist.

Read first:

- `src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx`
- `src/centerpanel/components/MapExportDialog.tsx`
- `src/centerpanel/components/MapDataExportDialog.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/services/map/MapExportService.ts`
- `src/services/map/MapOfflinePackageService.ts`
- `src/services/map/MapReportHandoffService.ts`

Deliver:

- Publish tabs:
  - Figure
  - Data Export
  - Report
  - Offline Package
  - Review Package
- Add readiness checklist:
  - title
  - visible layers
  - CRS
  - legend
  - scale bar
  - north arrow
  - attribution
  - QA caveats
  - evidence IDs
- Keep export dialogs where needed but launch from Publish.
- Clearly distinguish map image, data export, offline package, and report handoff.

Must preserve:

- image export rendering state
- GeoJSON/GeoParquet data export rules
- offline package source bounds
- report handoff snapshot/evidence behavior
- attribution and caveat propagation

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapExportService.test.ts
npx vitest run src/services/map/__tests__/MapOfflinePackageService.test.ts
npx vitest run src/services/map/__tests__/MapReportHandoffService.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx
npm run lint:errors
```

Proof:

- Publish activity shows readiness before export/report
- export disabled reasons are concrete
- no report/export metadata is lost

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 15 - Visual System Polish

Goal: normalize the redesigned shell into a cohesive premium GIS visual system.

Read first:

- `src/centerpanel/components/map/mapTokens.ts`
- `src/centerpanel/components/map/ui/`
- `src/centerpanel/components/map/design/motion.module.css`
- all new sidebar/inspector/bottom components
- `docs/map-visual-qa-checklist.md`

Deliver:

- Normalize:
  - headers
  - row density
  - tabs
  - chips
  - separators
  - focus rings
  - empty states
  - scroll containment
  - responsive panel sizes
- Remove nested-card appearance.
- Ensure long layer/source names wrap professionally.
- Keep demo/synthetic and QA chips distinct.
- Keep reduced-motion behavior.
- No one-note palette or decorative effects.

Must preserve:

- all existing functionality
- test IDs
- accessibility labels
- high-contrast readability

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/mapVisualQA.test.ts
npx vitest run src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts
npm run lint:no-tailwind-centerpanel
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- visual QA checklist deltas are documented in ledger
- no text overflow or panel overlap in desktop/tablet/short viewport smoke

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 16 - Regression and Visual QA

Goal: harden the redesign with automated and manual QA coverage.

Read first:

- `docs/map-visual-qa-checklist.md`
- all new tests from prompts 01-15
- `e2e/map-modal-layout.spec.ts`
- `e2e/map-evidence-visual-p62.spec.ts`

Deliver:

- Add or extend e2e coverage:
  - open/close modal
  - switch each activity
  - command palette reaches hidden commands
  - import entry visible
  - layers/contents reachable
  - layer inspector opens
  - QA opens Problems
  - attribute table opens bottom tab
  - Analyze activity opens workflow/tools/query/model
  - Scene activity opens raster/3D/zoning/massing/sun controls
  - Publish activity opens figure/export/report/package
  - desktop/tablet/short viewport no horizontal overflow
- Add visual no-overlap checks where feasible.
- Update `docs/map-visual-qa-checklist.md` if new surfaces need checklist entries.

Must preserve:

- no broad snapshot churn
- no artificial test-only product behavior

Validate:

```bash
npm run typecheck
npm run lint:errors
npm run lint:no-tailwind-centerpanel
npx vitest run src/centerpanel/components/map
npm run test:e2e -- e2e/map-modal-layout.spec.ts
npm run build
```

Proof:

- new regression tests pass
- ledger records exact viewport/manual QA evidence

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 17 - Persona Lenses and Layout Reset

Goal: add task lenses, layout recovery commands, and density controls without changing analytical state.

Read first:

- Prompt 02 navigation model
- `src/stores/useMapToolbarPreferencesStore.ts`
- `src/stores/useMapExplorerStore.ts`
- `src/centerpanel/components/map/mapDocking.ts`
- `src/centerpanel/components/map/MapStatusBar.tsx`

Deliver:

- Add task lenses:
  - Analyst
  - Planner
  - Reviewer
  - Publisher
- Add commands:
  - reset layout
  - collapse all panels
  - focus map canvas
  - restore default widths
  - switch density
- Persist only lightweight layout preferences.
- Ensure lens changes do not mutate layers, sources, evidence, selections, or project state.

Must preserve:

- active data and analysis state
- command palette reachability
- compact/mobile dock behavior

Validate:

```bash
npm run typecheck
npx vitest run src/stores
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- reset layout restores map-first chrome without clearing analytical state
- lens switching changes UI emphasis only

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 18 - Canvas Control Standard

Goal: formalize premium canvas controls for viewport recovery, basemaps, active tools, and publish map furniture.

Read first:

- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- `src/centerpanel/components/map/MapLegendOverlay.tsx`
- `src/services/map/MapExportService.ts`

Deliver:

- Add or consolidate controls:
  - zoom in/out/reset
  - fit to visible layers
  - fit to selected layer/feature/AOI
  - basemap selector
  - CRS shortcut
  - scale bar toggle
  - north arrow toggle for publish preview
  - legend toggle
  - active draw/measure/select indicator
  - clear active tool
- Keep controls compact and non-overlapping.
- Keep basemap changes separate from analytical layer changes.

Must preserve:

- map keyboard fallback controls
- layer focus behavior
- publish/export legend and map furniture contracts

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- lost viewport can be recovered with one action
- active tool is visible and cancellable
- controls do not cover feature popups or status bar

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 19 - Collaboration Surface

Goal: place collaboration status, comments, presence, and local-only state under Review without syncing heavy data.

Read first:

- `src/services/map/collaboration/MapReviewCollaborationService.ts`
- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/services/map/MapReviewSessionService.ts`
- `docs/map-explorer-workflow-guide.md`

Deliver:

- Add Review activity collaboration tab or section.
- Show:
  - live vs local-only vs offline
  - sync state
  - reviewer presence where available
  - comments by target ID
  - annotation/comment/evidence links
- Route collaboration status to bottom Timeline/Review where appropriate.
- Keep raw geometry and source bytes out of sync payloads.

Must preserve:

- existing review timeline behavior
- collaboration service payload limits
- annotation/comment target IDs
- evidence ID references

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapReviewCollaborationService.test.ts
npx vitest run src/services/map/__tests__/MapReviewSessionService.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- collaboration state is visible and truthful
- offline/local-only never appears as live sync
- no heavy data enters collaboration UI state

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 20 - Accessibility Matrix

Goal: implement and test the complete keyboard/focus/Escape interaction matrix for the redesigned modal.

Read first:

- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/useFocusTrap.ts`
- `src/centerpanel/components/map/useMapKeyboardControls.ts`
- `src/centerpanel/components/map/ui/`
- `e2e/accessibility-audit.spec.ts`

Deliver:

- Define and test:
  - activity rail keyboard traversal or predictable tab order
  - command center focus order
  - sidebar close focus return
  - inspector close focus return
  - bottom panel tab keyboard behavior
  - canvas fallback keyboard controls
  - scoped Escape behavior
  - disabled reason accessible text
  - high-contrast active/blocked/demo states
- Add tests for a full keyboard-only path:
  - import entry
  - layer inspect
  - QA review
  - command palette

Must preserve:

- modal focus trap
- skip link
- native editable-field undo behavior
- reduced-motion behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
npm run lint:errors
npm run test:e2e -- e2e/accessibility-audit.spec.ts
```

Proof:

- keyboard-only path works
- focus is never lost behind modal
- Escape closes the correct current layer of UI

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 21 - Performance Budget

Goal: ensure the premium shell does not regress modal open time, map responsiveness, or lazy-mount behavior.

Read first:

- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx`
- `src/services/map/MapPerformanceDiagnostics.ts`
- `src/centerpanel/components/map/scene3d/Scene3DPanel.tsx`
- `src/centerpanel/components/map/raster/RasterLayerPanel.tsx`
- `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx`

Deliver:

- Lazy-mount heavy activity children where safe:
  - attribute table
  - raster previews
  - 3D scene
  - model builder
  - diagnostics
  - plugin registry
- Add lightweight command/navigation metadata only.
- Add tests or diagnostics proving inactive heavy panels are not mounted.
- Add activity-switch responsiveness checks where feasible.
- Document any unavoidable bundle/performance tradeoff in the ledger.

Must preserve:

- evidence visual states
- panel state restoration where lightweight
- map canvas render continuity
- diagnostics accuracy

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
npx vitest run src/services/map/__tests__/MapPerformanceDiagnostics.test.ts
npm run lint:errors
npm run build
```

Proof:

- inactive heavy panels do not mount eagerly
- switching activities does not blank/freeze the map
- production build still succeeds

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 22 - GIS Token Audit and Premium Chrome

Goal: audit and extend the GIS design token layer so later prompts can build a premium VS Code-like Map Explorer without ad hoc colors, spacing, shadows, or motion.

Read first:

- `src/centerpanel/components/map/mapTokens.ts`
- `src/constants/design`
- `src/centerpanel/components/map/design/motion.module.css`
- `src/centerpanel/components/map/design/GisTokenStatusDemo.tsx`
- `src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts`
- `src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts`

Deliver:

- Audit token coverage for:
  - activity rail
  - command center
  - sidebar
  - right inspector
  - bottom panel
  - status bar
  - canvas overlays
  - Problems/QA states
  - demo/synthetic/generated/external/metadata-only states
- Add missing semantic aliases only when needed.
- Add density variables for compact and comfortable rows.
- Add shell dimension tokens for left sidebar, right inspector, bottom panel, activity rail, command center, and status bar.
- Add motion duration/easing aliases for panel, row, status, progress, and focus feedback.
- Update token tests and status demo if token surface changes.

Premium criteria:

- No one-off palette.
- No broad gradients or decorative glow.
- VS Code-like thin chrome and hairline separators.
- Status colors remain semantic and distinguishable.

Must preserve:

- existing token names where consumed
- MapLibre-safe paint color resolution
- reduced-motion behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/mapTokenStatus.test.ts
npx vitest run src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts
npm run lint:errors
```

Proof:

- token tests pass
- ledger records any new token aliases and why they exist
- no component behavior changes beyond token availability

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 23 - Shared GIS Primitive Hardening

Goal: make shared GIS primitives strong enough for the full redesign before large surfaces depend on them.

Read first:

- `src/centerpanel/components/map/ui/GisIconButton.tsx`
- `src/centerpanel/components/map/ui/GisTabs.tsx`
- `src/centerpanel/components/map/ui/GisStatusChip.tsx`
- `src/centerpanel/components/map/ui/GisToolbar.tsx`
- `src/centerpanel/components/map/ui/GisTooltip.tsx`
- `src/centerpanel/components/map/ui/GisEmptyState.tsx`
- `src/centerpanel/components/map/ui/GisProgressBar.tsx`
- `src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx`

Deliver:

- Add missing primitive variants needed by the workbench:
  - rail icon button
  - compact tab
  - disclosure row
  - toolbar overflow trigger
  - split status chip if needed
  - dense property row
- Ensure every primitive supports:
  - stable dimensions
  - focus-visible state
  - disabled reason
  - reduced-motion-safe feedback
  - high-contrast-friendly borders
- Add or update primitive tests.

Premium criteria:

- primitives look like one product family
- no nested card styling
- no text clipping in compact buttons/chips

Must preserve:

- existing primitive props
- current tests and test IDs
- accessible labels

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/mapVisualQA.test.ts
npm run lint:errors
```

Proof:

- shared primitives support all planned shell surfaces
- no later prompt needs to invent one-off button/chip/tab styles

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 24 - Command Taxonomy and Palette Search

Goal: make the command palette the complete, searchable command surface for every Map Explorer capability.

Read first:

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/services/map/commands/MapCommandPalette.ts`
- `src/centerpanel/components/map/navigation/*`
- `src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx`
- `src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts`

Deliver:

- Add command taxonomy metadata:
  - Data
  - Layers
  - Contents
  - QA
  - Analyze
  - Query
  - Style
  - Scene
  - Publish
  - Review
  - Diagnostics
  - Project
  - Extensions
- Add search keywords for real GIS language:
  - CRS, projection, source, catalog, WMS, WFS, GeoJSON, GeoParquet, Shapefile, GeoTIFF
  - buffer, intersect, join, field, schema, LISA, Gi*, 3D, terrain, noData, attribution
- Keep aliases for old labels so existing users can find commands.
- Add tests for representative search terms.

Premium criteria:

- command results are grouped and scan-friendly
- disabled commands show concrete prerequisites
- no command disappears just because toolbar is simplified

Must preserve:

- existing shortcut behavior
- command handlers
- command palette open/close behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/MapCommandPaletteSearch.test.ts
npm run lint:errors
```

Proof:

- all mapped commands are palette-searchable
- ledger records taxonomy groups and notable aliases

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 25 - Command Center Visual Hierarchy

Goal: make the header a compact command center with premium hierarchy instead of a dense strip of peer buttons.

Read first:

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapSearchBar.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- Prompt 24 command taxonomy

Deliver:

- Add or refine command center zones:
  - title and breadcrumb
  - global place search
  - command palette trigger
  - active activity/lens indicator
  - contextual primary action
  - grouped overflow
  - close action
- Make contextual primary action state-driven:
  - empty map: Import Data
  - selected layer: Inspect Layer
  - QA blocker: Review Problems
  - publish-ready map: Publish
  - dirty project: Save
- Keep the full command palette available.

Premium criteria:

- one-line header at desktop and tablet widths
- no button wrap
- no oversized text
- restrained active/accent state

Must preserve:

- current search behavior
- all toolbar handlers
- modal close behavior
- keyboard shortcuts

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx
npx vitest run src/centerpanel/components/map
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- command center remains stable across shell smoke viewport
- palette still reaches hidden actions
- contextual primary action is tested or ledgered by state

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 26 - Activity Rail Iconography and Microinteraction

Goal: make the activity rail feel like a premium GIS IDE navigation spine.

Read first:

- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/navigation/*`
- `src/centerpanel/components/map/ui/GisIconButton.tsx`
- `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx`

Deliver:

- Use stable activities:
  - Overview
  - Data
  - Layers
  - Analyze
  - Style
  - Scene
  - Publish
- Use stable utility items:
  - QA
  - Review
  - Diagnostics
  - Extensions
  - Save/Project if retained
- Add polished tooltips and active accent.
- Ensure active activity is visible without color alone.
- Add reduced-motion-safe accent behavior.

Premium criteria:

- activity rail width is stable
- icon order reflects workflow hierarchy
- labels are professional and consistent

Must preserve:

- current feature reachability
- `data-testid="map-activity-rail"`
- focus trap
- aria labels

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx
npm run lint:errors
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Proof:

- rail icon labels are accessible
- active rail item is visibly distinct
- all old rail actions have a documented new home

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 27 - Overview Cockpit Readiness Surface

Goal: make the Overview activity a professional spatial readiness cockpit, not a marketing or placeholder surface.

Read first:

- `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
- `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
- `src/centerpanel/components/map/mapExperience.ts`
- `src/centerpanel/components/map/mapContextSummary.ts`
- `src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts`

Deliver:

- Refine readiness states:
  - no data
  - data loaded
  - invisible layers
  - stale analysis
  - missing AOI
  - QA blockers
  - publish ready
- Make next action obvious and state-specific.
- Add compact context signals:
  - project
  - layers
  - selected features
  - AOI
  - QA
  - save state
  - sync state
- Avoid large cards or hero copy.

Premium criteria:

- dense, quiet, operational
- no idle placeholder strips
- no false readiness

Must preserve:

- existing quick actions
- context summary derivation
- no heavy geometry in cockpit props

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- readiness state tests cover empty, loaded, blocked, publish-ready states
- cockpit never claims readiness without real data/source state

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 28 - Local Import and Preflight UX

Goal: make local import and preflight feel like a professional GIS data intake flow.

Read first:

- `src/centerpanel/components/MapDataImportHubDialog.tsx`
- `src/centerpanel/components/map/MapImportPreviewDialog.tsx`
- `src/centerpanel/components/MapCsvImportDialog.tsx`
- `src/centerpanel/components/MapColumnarImportDialog.tsx`
- `src/services/map/MapDataImporter.ts`
- `docs/map-source-support-matrix.md`
- `src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx`

Deliver:

- Redesign import entry inside Data activity.
- Keep import preflight visible before commit:
  - format
  - CRS status
  - geometry type
  - feature/row count
  - skipped rows
  - memory estimate
  - worker transfer readiness
  - caveats
- Group supported formats by local, columnar, external/profile-only, raster/scene-specific.
- Never overclaim support beyond `map-source-support-matrix.md`.

Premium criteria:

- import flow is compact and readable
- caveats appear near the commit action
- progress feedback uses existing motion tokens

Must preserve:

- modal-owned hidden file input
- all current format paths
- skipped-row diagnostics
- source handle creation

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapDataIO.test.ts
npx vitest run src/centerpanel/components/map/__tests__/map-import-preflight.test.tsx
npm run lint:errors
```

Proof:

- import preflight still blocks unsafe/unknown states truthfully
- Data activity gives one obvious import entry

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 29 - External Services and Source Catalog UX

Goal: make WMS/WMTS/WFS/XYZ/Overpass/source restore states professional, explicit, and usable.

Read first:

- `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx`
- `src/centerpanel/components/map/catalog/catalogModel.ts`
- `src/centerpanel/components/MapServiceDialog.tsx`
- `src/services/map/sources/MapConnectionRegistry.ts`
- `src/services/map/sources/MapSourceRegistry.ts`
- `src/services/map/ExternalServiceConnector.ts`
- `src/services/map/__tests__/MapConnectionRegistry.test.ts`
- `src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx`

Deliver:

- Redesign Data > Catalog and Connections:
  - source list
  - connection form
  - restore health
  - actionable repair/reconnect
  - provider caveats
  - attribution/licensing notes
- Add compact health summary counts.
- Keep no-credentials-stored messaging.
- Distinguish external-reference, metadata-only, recoverable, unavailable, offline, demo.

Premium criteria:

- source health reads like a GIS catalog, not a generic settings panel
- status chips are distinct and compact
- endpoint fields do not overflow

Must preserve:

- connection health checks
- source handle persistence rules
- no raw provider bytes in packages unless supported

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapConnectionRegistry.test.ts
npx vitest run src/services/map/__tests__/MapSourceRegistry.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapCatalogPanel.test.tsx
npm run lint:errors
```

Proof:

- each restore state has a visible label
- external service caveats remain visible before adding a layer

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 30 - Layer Stack Row Redesign

Goal: redesign layer stack rows so a dense professional GIS user can understand layer readiness at a glance.

Read first:

- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/mapTypes.ts`
- `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`

Deliver:

- Redesign row structure:
  - visibility
  - layer name
  - source kind
  - restore state
  - geometry type
  - feature count
  - CRS status
  - QA status
  - publication readiness
  - action menu
- Keep group headers:
  - Data Layers
  - Analysis Results
  - VoxCity/Scene layers where applicable
- Add compact row density and stable heights.

Premium criteria:

- row actions do not cause layout jump
- long names wrap cleanly
- badges do not hide the layer name

Must preserve:

- visibility/opacity/reorder/remove
- focus layer
- active layer state
- demo/synthetic labels

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts
npx vitest run src/centerpanel/components/map/__tests__/mapVisualQA.test.ts
npm run lint:errors
```

Proof:

- every existing layer readiness state remains visible in compact rows
- no row action is lost

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 31 - Contents Tree Premium Controls

Goal: make contents grouping, scale visibility, definition filters, duplicate, and source repair feel like one professional GIS contents tree.

Read first:

- `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx`
- `src/centerpanel/components/map/contents/contentsModel.ts`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.module.css`
- `src/centerpanel/components/map/__tests__/MapContentsModel.test.ts`

Deliver:

- Redesign Contents tab with:
  - group tree
  - selected layer details
  - scale range editor
  - definition filter editor
  - duplicate action
  - open properties
  - source repair action
- Make scale/filter state visible in rows.
- Keep group selected layers workflow but tighten UI.

Premium criteria:

- looks like a GIS layer contents tree
- groups are scannable
- filter/scale badges are compact

Must preserve:

- `contentsModel` behavior
- reorder behavior
- filter and scale range semantics

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapContentsModel.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- groups, scale ranges, and filters remain functional
- active layer and readiness are visible

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 32 - Layer Action Command Menu

Goal: consolidate per-layer operations into a premium command menu without losing any feature.

Read first:

- `src/centerpanel/components/map/MapLayerManager.tsx`
- `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx`
- `src/centerpanel/components/map/contextMenuUtils.ts`
- `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
- `src/centerpanel/components/map/__tests__/map-context-menu.test.ts`

Deliver:

- Add or refine a layer action menu with groups:
  - Inspect
  - View / Focus
  - Style
  - Data / Table
  - CRS / QA
  - Analyze / Rerun
  - Publish / Report
  - Bridge / IDE / Urban
  - Cache / Remove
- Keep primary row actions minimal.
- Add disabled reasons for unavailable actions.

Premium criteria:

- menu is compact and keyboard navigable
- destructive actions are visually distinct
- no action overload in row body

Must preserve:

- all current `MapLayerManager` callbacks
- guarded remove confirmation
- action audit where already present

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts
npx vitest run src/centerpanel/components/map/__tests__/map-context-menu.test.ts
npm run lint:errors
```

Proof:

- action parity table in ledger lists every old action and new menu location
- no command disappears

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 33 - Inspector Metadata and Provenance Polish

Goal: make the right inspector the trusted metadata workbench for layers, sources, schema, CRS, QA, lineage, and report context.

Read first:

- `src/centerpanel/components/map/inspector/LayerInspector.tsx`
- `src/centerpanel/components/map/inspector/MapInspectorHost.tsx` if present
- `src/centerpanel/components/map/mapLayerMetadata.ts`
- `src/centerpanel/components/map/mapEvidenceArtifacts.ts`
- `src/centerpanel/components/map/__tests__/layer-inspector.test.tsx`

Deliver:

- Polish inspector tabs:
  - Overview
  - Source
  - Schema
  - CRS
  - QA
  - Style
  - Lineage
  - Report
- Add compact property grids using primitives.
- Keep explicit `unknown`, `missing`, `metadata-only`, `external`, `user-declared`.
- Link evidence, run, source, and reproducibility IDs where available.

Premium criteria:

- inspector reads like GIS metadata, not debug JSON
- long IDs are mono and wrap safely
- tab strip remains compact

Must preserve:

- `normalizeLayerRegistryMetadata` as resolver source
- style apply behavior
- source handle behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/layer-inspector.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts
npm run lint:errors
```

Proof:

- every tab still renders explicit unknown/missing values
- inspector remains source-of-truth for layer metadata

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 34 - CRS and QA Fix Flow

Goal: make CRS declaration, QA blockers, geometry repair, and source caveats fixable from Problems and Inspector without weakening scientific truthfulness.

Read first:

- `src/centerpanel/components/map/DeclareCrsControl.tsx`
- `src/centerpanel/components/map/ScientificQAPanel.tsx`
- `src/services/map/crs/CrsPreflight.ts`
- `src/services/map/crs/ExecutionCrsPlanner.ts`
- `src/services/map/DrawnGeometryValidation.ts`
- `src/services/map/topology/TopologyRepairService.ts`
- `src/centerpanel/components/map/__tests__/crs-declaration.test.ts`
- `src/services/map/__tests__/CrsPreflight.test.ts`

Deliver:

- Add QA fix affordances:
  - declare CRS
  - inspect source
  - repair geometry
  - open affected layer
  - open export readiness
- Keep user-declared CRS permanently caveated.
- Keep EPSG:4326 display coordinates insufficient for planar metric readiness.
- Add proof text near fix actions explaining scientific consequence.

Premium criteria:

- fix flows are direct but not overconfident
- blocked states are visible before action
- caveats stay near decisions

Must preserve:

- CRS preflight semantics
- user-declared downgrade behavior
- geometry repair provenance

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/crs-declaration.test.ts
npx vitest run src/services/map/__tests__/CrsPreflight.test.ts
npx vitest run src/services/map/__tests__/TopologyRepairService.test.ts
npm run lint:errors
```

Proof:

- missing CRS is fixable but not silently verified
- QA blockers remain prominent after UI polish

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 35 - Attribute, Field, Join, and Table Workflow

Goal: make table-centric GIS work a professional bottom-panel workflow.

Read first:

- `src/centerpanel/components/map/table/MapAttributeTable.tsx`
- `src/centerpanel/components/map/table/fieldProfiles.ts`
- `src/centerpanel/components/map/table/fieldCalculator.ts`
- `src/services/map/join/MapJoinPreviewService.ts`
- `src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx`
- `src/centerpanel/components/map/__tests__/fieldProfiles.test.ts`
- `src/centerpanel/components/map/__tests__/fieldCalculator.test.ts`
- `src/services/map/__tests__/MapJoinPreviewService.test.ts`

Deliver:

- Put Attributes in bottom panel with:
  - active layer selector
  - selected-feature filter
  - schema profile
  - field stats
  - derived field preview
  - join/relate preview where supported
- Preserve map-to-table and table-to-map selection sync.
- Add disabled reasons for non-queryable layers.

Premium criteria:

- dense table controls do not crowd canvas
- field operations are preview-first
- schema metadata is visible before transformations

Must preserve:

- selected feature IDs
- feature focus
- derived layer creation
- join preview caveats

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapAttributeTable.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/fieldProfiles.test.ts
npx vitest run src/centerpanel/components/map/__tests__/fieldCalculator.test.ts
npx vitest run src/services/map/__tests__/MapJoinPreviewService.test.ts
npm run lint:errors
```

Proof:

- selected feature can be found in table and focused back on map
- field/join actions show preview and blocked reasons before apply

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 36 - Canvas Interaction Tool Strip

Goal: standardize canvas interaction controls for selection, draw, measure, AOI, active tool display, and clear tool.

Read first:

- `src/centerpanel/components/map/MapCanvas.tsx`
- `src/centerpanel/components/map/MapSelectionTools.tsx`
- `src/centerpanel/components/MapDrawingManager.tsx`
- `src/centerpanel/components/MapMeasurementTool.tsx`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/useMapKeyboardControls.ts`
- `src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts`
- `src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts`

Deliver:

- Add canvas tool strip with:
  - active tool
  - selection mode
  - draw AOI
  - measure distance
  - measure area
  - clear/cancel active tool
  - keyboard help affordance
- Keep tool strip off critical map controls/popups.
- Route tool state to status bar where useful.

Premium criteria:

- tool strip is compact and positional stable
- active state is visible without color alone
- cancellation is obvious

Must preserve:

- selection query behavior
- drawing validation
- measurement CRS/geodesic caveats
- keyboard fallback controls

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-drawing-tools.test.ts
npx vitest run src/centerpanel/components/map/__tests__/geodesic-measurement.test.ts
npx vitest run src/centerpanel/components/map/__tests__/map-accessibility.test.ts
npm run lint:errors
```

Proof:

- active draw/measure/select mode is visible and cancellable
- keyboard path remains available

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 37 - AOI and Workflow Launch Ergonomics

Goal: make AOI source selection and workflow launch clear, premium, and scientifically gated.

Read first:

- `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
- `src/centerpanel/components/map/useMapAoiDispatch.ts`
- `src/services/map/MapWorkflowService.ts`
- `src/services/map/MapAnalysisDispatcher.ts`
- `src/services/map/DrawnGeometryValidation.ts`
- `src/centerpanel/components/map/__tests__/map-workflow-worker-ui.test.tsx`
- `src/services/map/__tests__/MapWorkflowService.test.ts`

Deliver:

- Refine workflow entry points:
  - viewport AOI
  - selected features
  - drawn polygon
  - geocoded place
  - Urban study area
- Show CRS/execution readiness before workflow run.
- Show preview, output expectation, and report/evidence consequence.
- Keep restrict-to-map-view affordance clear.

Premium criteria:

- user understands input source before running
- blocked workflows are explained close to action
- progress and cancel are visible

Must preserve:

- worker execution
- cancel behavior
- workflow evidence/report handoff
- CRS preflight

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapWorkflowService.test.ts
npx vitest run src/centerpanel/components/map/__tests__/map-workflow-worker-ui.test.tsx
npm run lint:errors
```

Proof:

- AOI source is explicit
- CRS blocker is visible before compute
- workflow output evidence remains intact

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 38 - Processing Toolbox Premium Form

Goal: redesign the processing toolbox as a professional geoprocessing surface with searchable tools, clear parameters, blocked reasons, runtime chips, and progress.

Read first:

- `src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx`
- `src/centerpanel/components/map/processing/ToolParameterForm.tsx`
- `src/services/map/processing/MapProcessingRegistry.ts`
- `src/services/map/processing/serviceTools.ts`
- `src/services/map/processing/referenceTools.ts`
- `src/centerpanel/components/map/__tests__/MapProcessingToolbox.test.tsx`
- `src/centerpanel/components/map/__tests__/MapProcessingToolboxServiceTools.test.tsx`

Deliver:

- Add tool categories and compact search.
- Improve parameter form layout:
  - layer selector
  - field selector
  - numeric controls
  - enum controls
  - preview/readiness card
- Show runtime:
  - main-preview
  - worker
  - geos-wasm
  - duckdb
- Show blocked reasons before run.

Premium criteria:

- form feels like GIS geoprocessing, not generic form builder
- progress bar uses existing motion tokens
- no hidden failure states

Must preserve:

- processing registry
- preview/run behavior
- output layer publication
- service tool descriptors

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapProcessingToolbox.test.tsx
npx vitest run src/centerpanel/components/map/__tests__/MapProcessingToolboxServiceTools.test.tsx
npx vitest run src/services/map/__tests__/MapProcessingRegistry.test.ts
npm run lint:errors
```

Proof:

- blocked tools name missing prerequisites
- runtime mode chip is visible
- run/progress/result states are stable

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 39 - Model Builder Premium Workflow Graph

Goal: make model builder chains, batch execution, and IDE/Urban export feel like a serious GIS workflow builder.

Read first:

- `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.tsx`
- `src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.module.css`
- `src/services/map/model/MapModelBuilder.ts`
- `src/services/map/__tests__/MapModelBuilder.test.ts`
- `src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx`

Deliver:

- Refine model builder layout:
  - step list or graph
  - selected step editor
  - run preview
  - batch targets
  - output/evidence section
  - export to IDE/Urban action
- Show blocked steps and missing inputs.
- Keep model runs deterministic.

Premium criteria:

- step hierarchy is scannable
- batch/run progress is clear
- exported artifact labels are precise

Must preserve:

- model execution service
- batch behavior
- code artifact request behavior
- Urban publish behavior

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapModelBuilder.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapModelBuilderPanel.test.tsx
npm run lint:errors
```

Proof:

- chain and batch run still work
- export to IDE/Urban remains wired
- blocked step reasons are visible

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 40 - NL Query and AI Guardrail UX

Goal: make natural-language querying usable while keeping AI guardrails, scope limits, and human confirmation explicit.

Read first:

- `src/centerpanel/components/map/MapNLQueryPanel.tsx`
- `src/services/map/MapNLQueryBuilder.ts`
- `src/services/map/MapAIGuardrails.ts`
- `src/services/map/query/MapQueryPlanner.ts`
- `src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx`
- `src/services/map/__tests__/MapAIGuardrails.test.ts`

Deliver:

- Redesign Query tab:
  - queryable layer scope
  - AOI/current extent scope
  - prompt input
  - interpreted plan
  - guardrail status
  - preview confirmation
  - run result
- Make human confirmation mandatory before apply.
- Show redaction/sanitization and unsupported intent messages truthfully.

Premium criteria:

- AI proposal does not look like final analytical output
- scope limits are visible before run
- confirmation step is unambiguous

Must preserve:

- guardrail allowlist
- redaction/sanitization
- review timeline AI-proposed audit
- no unconfirmed apply

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/MapNLQueryPanel.test.tsx
npx vitest run src/services/map/__tests__/MapAIGuardrails.test.ts
npx vitest run src/services/map/__tests__/MapNLQueryBuilder.test.ts
npm run lint:errors
```

Proof:

- Run is disabled until proposal confirmation
- AI-proposed audit remains recorded
- unsupported query states are clear

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 41 - Spatial Statistics and Advanced Analysis Panels

Goal: polish spatial statistics outputs and advanced renderers so they are discoverable, caveated, and publication-aware.

Read first:

- `src/centerpanel/components/MapClusterViz.tsx`
- `src/centerpanel/components/MapHotSpotViz.tsx`
- `src/centerpanel/components/MapEmergingHotSpotViz.tsx`
- `src/centerpanel/components/MapHeatmapLayer.tsx`
- `src/centerpanel/components/map/spatialStatsVizUtils.ts`
- `src/services/map/SpatialStatsExecutionService.ts`
- `src/services/map/__tests__/SpatialStatsExecutionService.test.ts`
- `src/centerpanel/components/map/__tests__/spatial-stats-viz.test.ts`

Deliver:

- Place spatial statistics under Analyze > Statistics.
- Add readiness and caveat panels:
  - required geometry
  - numeric field
  - CRS/execution context
  - sample/uncertainty caveats
  - output layer group
- Keep LISA, Gi*, emerging hotspot, heatmap, and relevant outputs reachable.

Premium criteria:

- statistical outputs are not presented as generic charts
- caveats sit next to run/export controls
- output layer status is clear

Must preserve:

- spatial stats service behavior
- output layer publication
- legend/style compatibility

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/SpatialStatsExecutionService.test.ts
npx vitest run src/centerpanel/components/map/__tests__/spatial-stats-viz.test.ts
npm run lint:errors
```

Proof:

- every statistics panel is reachable from Analyze
- output caveats and readiness are visible

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 42 - Style Workspace Renderer and Symbology

Goal: make renderer selection, choropleth, point symbols, heatmaps, bivariate/dot-density, and symbology updates one coherent Style workspace.

Read first:

- `src/centerpanel/components/MapChoroplethLayer.tsx`
- `src/centerpanel/components/MapSymbolLayer.tsx`
- `src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx`
- `src/centerpanel/components/map/symbologyUtils.ts`
- `src/centerpanel/components/map/symbolStyleUtils.ts`
- `src/services/map/cartography/AdvancedCartographyEngine.ts`
- `src/centerpanel/components/map/__tests__/symbology-utils.test.ts`
- `src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts`

Deliver:

- Style > Renderer and Symbols tabs.
- Show renderer eligibility:
  - geometry type
  - numeric/categorical field availability
  - scale/readiness caveats
  - stale result status
- Keep current style update path.
- Show disabled reasons for ineligible renderer choices.

Premium criteria:

- active layer summary is always visible
- renderer choices are compact and GIS-specific
- no generic "coming soon" states

Must preserve:

- style metadata updates
- map legend contract
- existing renderer outputs

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/symbology-utils.test.ts
npx vitest run src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts
npx vitest run src/services/map/__tests__/MapCartographyAdvisor.test.ts
npm run lint:errors
```

Proof:

- renderer eligibility is explicit
- style updates still reach map and legend

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 43 - Labels, Annotations, and Publication Marks

Goal: make labels, annotations, pins, bookmarks, and publication marks polished without obscuring GIS caveats or map controls.

Read first:

- `src/services/map/labels/MapLabelEngine.ts`
- `src/centerpanel/components/MapAnnotationLayer.tsx`
- `src/centerpanel/components/MapBookmarkBar.tsx`
- `src/centerpanel/components/map/MapPinSidebar.tsx`
- `src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`
- `src/services/map/__tests__/MapCartographyAdvisor.test.ts`

Deliver:

- Place labels/annotations in Style and Publish where appropriate.
- Add compact controls for:
  - label field
  - scale range
  - collision/declutter where supported
  - annotation mode
  - pin/sidebar visibility
  - export inclusion
- Keep annotation/pin counts visible.

Premium criteria:

- labels and annotations look cartographic
- annotation tools do not look like generic note widgets
- map remains inspectable

Must preserve:

- bookmark/pin persistence boundaries
- annotation export/report inclusion
- map click behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx
npx vitest run src/services/map/__tests__/MapCartographyAdvisor.test.ts
npm run lint:errors
```

Proof:

- labels/annotations remain reachable and export-aware
- annotations do not cover critical shell controls

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 44 - Legend Contract Parity

Goal: guarantee that the map legend, inspector legend, report legend, and export legend share one serialized contract.

Read first:

- `src/centerpanel/components/map/inspector/style/legendContract.ts`
- `src/centerpanel/components/map/inspector/style/MapLegendOverlay.tsx`
- `src/centerpanel/components/map/inspector/style/LayerStyleEditor.tsx`
- `src/services/map/MapExportService.ts`
- `src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts`

Deliver:

- Audit every legend rendering path.
- Add missing tests for:
  - choropleth
  - categorical
  - graduated/proportional symbols
  - heatmap
  - noData class
  - opacity/outline
  - report/export parity
- Improve legend UI in Style and Publish.

Premium criteria:

- legend preview is compact and publication-like
- no map/report/export mismatch
- noData and caveats remain visible

Must preserve:

- serialized legend spec
- MapLibre-safe colors
- export service behavior

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/style-editor-legend-contract.test.ts
npx vitest run src/services/map/__tests__/MapExportService.test.ts
npm run lint:errors
```

Proof:

- legend contract parity test passes for all supported style families
- ledger records any intentional caveats

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 45 - Raster Evidence UI

Goal: make GeoTIFF/raster evidence inspection premium, truthful, and visually clear.

Read first:

- `src/centerpanel/components/map/raster/RasterLayerPanel.tsx`
- `src/centerpanel/components/map/raster/RasterHistogramChart.tsx`
- `src/centerpanel/components/map/raster/RasterLegend.tsx`
- `src/services/map/raster/RasterQAService.ts`
- `src/services/map/raster/RasterHistogramEngine.ts`
- `src/services/map/raster/GeoTiffParser.ts`
- `src/services/map/__tests__/RasterHistogramEngine.test.ts`

Deliver:

- Scene > Raster tab with:
  - raster source summary
  - CRS status
  - noData status
  - band metadata
  - sampled/full-stat distinction
  - histogram
  - legend/ramp
  - evidence references
- Keep sampled raster caveats explicit.

Premium criteria:

- raster panel feels analytical, not preview-only
- noData and CRS warnings are visible near chart/legend
- canvas preview is nonblank when data exists

Must preserve:

- bounded raster parsing
- no false full-resolution analytics claim
- terrain DEM source handle behavior

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/RasterHistogramEngine.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- raster noData/CRS/sample/full-stat chips visible
- raster evidence remains bounded and truthful

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 46 - Temporal Playback UI

Goal: make temporal layers and frame export controls feel like a professional map timeline.

Read first:

- `src/centerpanel/components/map/temporal/TemporalPlayerPanel.tsx`
- `src/centerpanel/components/MapTemporalPlayer.tsx`
- `src/services/map/temporal/TemporalPlaybackEngine.ts`
- `src/services/map/temporal/temporalLayerHandoff.ts`
- `src/centerpanel/components/map/__tests__/temporalPlayback.test.ts`
- `src/stores/__tests__/useTemporalLayerStore.test.ts`

Deliver:

- Scene > Temporal tab with:
  - layer selector
  - frame cursor
  - play/pause
  - speed
  - reduced-motion state
  - frame export
  - missing temporal metadata caveats
- Keep bottom timeline integration if useful.

Premium criteria:

- playback controls are stable and compact
- temporal state is not a floating afterthought
- reduced-motion is respected

Must preserve:

- temporal layer handoff
- frame export behavior
- reduced-motion autoplay constraints

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/temporalPlayback.test.ts
npx vitest run src/stores/__tests__/useTemporalLayerStore.test.ts
npm run lint:errors
```

Proof:

- reduced-motion disables temporal autoplay/animation
- temporal controls remain reachable from Scene

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 47 - 3D Scene, Terrain, CityJSON, and 3D Tiles UX

Goal: make the 3D scene path premium while keeping terrain, CityJSON, 3D Tiles, source mode, vertical datum, and generated states explicit.

Read first:

- `src/centerpanel/components/map/scene3d/Scene3DPanel.tsx`
- `src/centerpanel/components/map/scene3d/Scene3DInteractionStrip.tsx`
- `src/centerpanel/components/map/scene3d/ScenarioComparisonStrip.tsx`
- `src/services/map/scene3d/Map3DSceneController.ts`
- `src/services/map/scene3d/MapTerrainCityModelService.ts`
- `src/stores/useScene3DStore.ts`
- `src/services/map/__tests__/Map3DSceneController.test.ts`
- `src/services/map/__tests__/MapTerrainCityModelService.test.ts`

Deliver:

- Scene > 3D tab with:
  - source mode
  - terrain/CityJSON/3D Tiles metadata
  - vertical datum state
  - generated/sample/source-backed chips
  - viewport sync status
  - interaction tools
  - scenario comparison
- Lazy mount heavy 3D work.

Premium criteria:

- primary 3D scene remains full-bleed/unframed where rendered
- scene status chips are visible but not noisy
- 3D controls do not cover 2D layer work

Must preserve:

- transient scene state
- no heavy 3D payload persistence
- evidence visual states

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/Map3DSceneController.test.ts
npx vitest run src/services/map/__tests__/MapTerrainCityModelService.test.ts
npx vitest run src/stores/__tests__/useScene3DStore.interactions.test.ts
npm run lint:errors
```

Proof:

- source/vertical datum/generated/sample states remain visible
- inactive 3D panel does not mount heavy scene eagerly

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 48 - Urban Form Scene Controls

Goal: polish zoning, massing, sun/shadow, view corridor, section/cut-plane, and scenario controls.

Read first:

- `src/centerpanel/components/map/zoning/ZoningRulesPanel.tsx`
- `src/centerpanel/components/map/zoning/MassingScenarioPanel.tsx`
- `src/centerpanel/components/map/scene3d/SunShadowPanel.tsx`
- `src/services/map/zoning/ZoningRuleEngine.ts`
- `src/services/map/zoning/ZoningEnvelopeEngine.ts`
- `src/services/map/zoning/MassingEngine.ts`
- `src/services/map/scene3d/SunShadowEngine.ts`
- `src/services/map/scene3d/ViewCorridorSectionService.ts`
- relevant service tests

Deliver:

- Scene > Urban Form group/tabs for:
  - zoning rules
  - zoning envelope
  - massing alternatives
  - sun/shadow
  - view corridor
  - section/cut plane
- Show projected CRS and vertical assumptions.
- Show parcel/building prerequisites.
- Publish evidence references where already supported.

Premium criteria:

- advanced urban form tools are discoverable but not cluttered
- assumptions are visible near controls
- scenario chips are compact

Must preserve:

- deterministic engines
- CRS gates
- scenario evidence
- 3D interaction behavior

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/ZoningRuleEngine.test.ts
npx vitest run src/services/map/__tests__/ZoningEnvelopeEngine.test.ts
npx vitest run src/services/map/__tests__/MassingEngine.test.ts
npx vitest run src/services/map/__tests__/SunShadowEngine.test.ts
npx vitest run src/services/map/__tests__/ViewCorridorSectionService.test.ts
npm run lint:errors
```

Proof:

- CRS/vertical assumptions are visible before/after run
- advanced scene controls stay under Scene, not scattered

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 49 - VoxCity Bridge Surface

Goal: make VoxCity 2D/3D integration clear about real project geometry, CityJSON, OSM buildings, and sample/demo fallbacks.

Read first:

- `src/centerpanel/components/MapVoxCityOverlay.tsx`
- `src/services/map/voxCitySelectionService.ts`
- `src/services/map/voxCityProjection.ts`
- `src/features/urbanAnalytics/voxcity/voxCityDataBridge.ts`
- `src/services/map/__tests__/voxCitySyncEvidence.test.ts`
- `src/services/map/__tests__/voxCitySelectionService.test.ts` if present

Deliver:

- Scene > VoxCity section with:
  - source priority explanation
  - active source mode
  - footprint count
  - CRS/vertical caveats
  - real vs sample labels
  - sync/evidence state
- Keep VoxCity overlay and 3D handoff discoverable.

Premium criteria:

- sample/demo mode is unmistakable
- real geometry path is preferred visually
- no false project-data claim

Must preserve:

- existing VoxCity sync behavior
- Urban Analytics bridge payloads
- evidence registration

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/voxCitySyncEvidence.test.ts
npm run test:analytics
npm run lint:errors
```

Proof:

- VoxCity source mode remains explicit
- real vs sample distinction appears in UI and ledger

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 50 - Publish Figure and Map Book Workflow

Goal: make figure composer and map book export a professional publication readiness workflow.

Read first:

- `src/centerpanel/components/map/layout/MapLayoutDesignerPanel.tsx`
- `src/centerpanel/components/map/layout/MapFigureComposerPanel.tsx`
- `src/services/map/layout/MapLayoutComposer.ts`
- `src/services/map/MapExportService.ts`
- `src/centerpanel/components/map/__tests__/map-figure-composer.test.tsx`
- `src/services/map/__tests__/MapLayoutComposer.test.ts`
- `src/services/map/__tests__/MapLayoutComposerV2.test.ts`

Deliver:

- Publish > Figure with:
  - title
  - page size
  - DPI
  - visible layers
  - legend
  - scale bar
  - north arrow
  - graticule/inset if supported
  - attribution
  - CRS
  - QA caveats
- Publish > Map Book where supported.
- Show readiness checklist before export.

Premium criteria:

- publication controls feel cartographic
- readiness checklist is compact but complete
- blocked export states name missing inputs

Must preserve:

- layout composer service behavior
- export options
- report/export metadata

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-figure-composer.test.tsx
npx vitest run src/services/map/__tests__/MapLayoutComposer.test.ts
npx vitest run src/services/map/__tests__/MapLayoutComposerV2.test.ts
npm run lint:errors
```

Proof:

- readiness checklist appears before figure export
- attribution/CRS/QA caveats remain visible

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 51 - Data Export, Offline Package, and Report Handoff

Goal: make all output paths clear, truthful, and publication-grade.

Read first:

- `src/centerpanel/components/MapExportDialog.tsx`
- `src/centerpanel/components/MapDataExportDialog.tsx`
- `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
- `src/services/map/MapDataExporter.ts`
- `src/services/map/MapOfflinePackageService.ts`
- `src/services/map/MapReportHandoffService.ts`
- `src/services/map/__tests__/MapExportService.test.ts`
- `src/services/map/__tests__/MapOfflinePackageService.test.ts`
- `src/services/map/__tests__/MapReportHandoffService.test.ts`

Deliver:

- Publish tabs:
  - Data Export
  - Offline Package
  - Report Handoff
- For each path show:
  - included layers/sources
  - excluded layers/sources
  - source handle restore state
  - package bounds
  - evidence IDs
  - CRS/QA/provenance caveats
  - export disabled reasons
- Preserve existing dialogs where needed, but launch from Publish.

Premium criteria:

- output type labels are precise
- no silent embedding claim
- no false package recoverability

Must preserve:

- GeoJSON/GeoParquet export
- offline package source limits
- report snapshot/evidence insert
- review audit event

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapExportService.test.ts
npx vitest run src/services/map/__tests__/MapOfflinePackageService.test.ts
npx vitest run src/services/map/__tests__/MapReportHandoffService.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapReportHandoffDrawer.test.tsx
npm run lint:errors
```

Proof:

- export/package/report each show inclusion and caveats before action
- evidence metadata remains intact

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 52 - Review Timeline and Collaboration Surface

Goal: make review timeline, audit trail, collaboration comments, presence, and local-only state a coherent Review workspace.

Read first:

- `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
- `src/services/map/MapReviewSessionService.ts`
- `src/services/map/collaboration/MapReviewCollaborationService.ts`
- `src/services/map/__tests__/MapReviewSessionService.test.ts`
- `src/services/map/__tests__/MapReviewCollaborationService.test.ts`

Deliver:

- Review activity with tabs:
  - Timeline
  - Comments
  - Collaboration
  - Audit Export if supported
- Show:
  - imports
  - commands
  - QA events
  - workflow outputs
  - report handoffs
  - exports
  - AI-proposed actions
  - package exports
  - local-only/live/offline collaboration
- Keep comments tied to target IDs and evidence IDs.

Premium criteria:

- audit trail is dense and trustworthy
- collaboration state is not hidden
- local-only/offline cannot be mistaken for live sync

Must preserve:

- review event status updates
- revert command
- collaboration payload limits
- no raw source/geometry sync

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapReviewSessionService.test.ts
npx vitest run src/services/map/__tests__/MapReviewCollaborationService.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- Review workspace shows timeline and collaboration truthfully
- heavy data is not synced or displayed as collaboration payload

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 53 - Diagnostics, Plugins, and Recovery UX

Goal: make diagnostics, observability, plugin registry, and recoverable panel errors professional and privacy-safe.

Read first:

- `src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx`
- `src/centerpanel/components/map/MapPanelErrorBoundary.tsx`
- `src/centerpanel/components/map/plugins/MapPluginPanel.tsx`
- `src/services/map/observability/MapObservabilityService.ts`
- `src/services/map/plugins/MapExtensionRegistry.ts`
- `src/services/map/MapPerformanceDiagnostics.ts`
- related tests

Deliver:

- Diagnostics workspace/bottom tab with:
  - render budget
  - worker failures
  - external service errors
  - command failures
  - redacted telemetry
  - retry actions
- Extensions surface with:
  - source plugins
  - renderer plugins
  - processing tools
  - Urban bridge descriptors
- Recoverable panel errors should be scoped and actionable.

Premium criteria:

- diagnostics are technical but readable
- no raw secrets or credentials
- errors do not blank the whole modal

Must preserve:

- redaction
- bounded diagnostic log
- plugin contribution contracts
- panel error recovery

Validate:

```bash
npm run typecheck
npx vitest run src/services/map/__tests__/MapObservabilityService.test.ts
npx vitest run src/services/map/__tests__/MapExtensionRegistry.test.ts
npx vitest run src/services/map/__tests__/MapPerformanceDiagnostics.test.ts
npx vitest run src/centerpanel/components/map/__tests__/MapPanelErrorBoundary.test.tsx
npm run lint:errors
```

Proof:

- diagnostics remain redacted
- plugin contribution types are visible
- panel error boundary recovers locally

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 54 - Preferences, Lenses, Layout Reset, and Density

Goal: finish layout recovery and task-persona controls without mutating analytical state.

Read first:

- `src/stores/useMapToolbarPreferencesStore.ts`
- `src/stores/mapExplorer/slices/layout.ts`
- `src/stores/mapExplorer/persistence.ts`
- `src/centerpanel/components/map/mapDocking.ts`
- `src/centerpanel/components/map/navigation/*`
- `src/stores/__tests__/useMapExplorerStore.test.ts`

Deliver:

- Add:
  - Analyst lens
  - Planner lens
  - Reviewer lens
  - Publisher lens
  - reset layout
  - collapse all panels
  - focus map canvas
  - restore widths
  - compact/comfortable density
- Persist only lightweight layout preferences.
- Add command palette entries for recovery actions.

Premium criteria:

- user can recover map-first layout instantly
- density changes are subtle and professional
- lenses change emphasis, not data

Must preserve:

- layers
- sources
- evidence
- selections
- project state
- heavy geometry persistence guardrails

Validate:

```bash
npm run typecheck
npx vitest run src/stores/__tests__/useMapExplorerStore.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
```

Proof:

- layout reset does not clear analytical state
- density/lens controls are command-palette reachable

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 55 - Full Accessibility and Keyboard Pass

Goal: complete the accessibility matrix for the redesigned GIS modal.

Read first:

- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/useFocusTrap.ts`
- `src/centerpanel/components/map/useMapKeyboardControls.ts`
- `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
- `src/centerpanel/components/map/ui/`
- `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`
- `e2e/accessibility-audit.spec.ts`

Deliver:

- Test and fix:
  - activity rail keyboard traversal/tab order
  - command center focus order
  - sidebar focus return
  - inspector focus return
  - bottom panel tab keyboard behavior
  - canvas keyboard controls
  - scoped Escape behavior
  - disabled reason text
  - high-contrast active/blocked/demo states
  - reduced-motion support
- Add keyboard-only route:
  - open modal
  - reach import
  - inspect a layer
  - open Problems
  - open command palette

Premium criteria:

- advanced GIS remains usable without mouse
- focus never disappears behind modal
- visual state is not color-only

Must preserve:

- native input undo behavior
- modal focus trap
- skip link
- command shortcuts

Validate:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map/__tests__/map-accessibility.test.ts
npx vitest run src/centerpanel/components/map
npm run lint:errors
npm run test:e2e -- e2e/accessibility-audit.spec.ts
```

Proof:

- keyboard-only path passes
- Escape hierarchy is scoped
- high-contrast/reduced-motion notes are in ledger

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---

## Prompt 56 - Final Performance, Visual QA, and Release Readiness

Goal: close the pack with a truthful final gate for premium GIS UI quality, performance, accessibility, and build readiness.

Read first:

- `docs/map-visual-qa-checklist.md`
- `src/centerpanel/components/map/__tests__/mapVisualQA.test.ts`
- `src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts`
- `src/services/map/MapPerformanceDiagnostics.ts`
- `e2e/map-modal-layout.spec.ts`
- `e2e/map-evidence-visual-p62.spec.ts`

Deliver:

- Run and document:
  - typecheck
  - lint
  - no Tailwind centerpanel check
  - Map Explorer component/unit tests
  - key service tests
  - map modal e2e
  - accessibility e2e
  - production build
- Add final visual QA notes:
  - desktop 1440x900
  - tablet 768x1024
  - short viewport 1280x600
  - reduced motion
  - high contrast
  - command palette reachability
  - canvas nonblank
  - no critical overlap
- Document residual risks honestly.

Premium criteria:

- modal reads as a premium GIS workbench
- map canvas stays primary
- every feature group has a predictable home
- scientific caveats are easier to find than before

Must preserve:

- all previous prompt proofs
- no known false readiness
- no hidden command loss

Validate:

```bash
npm run typecheck
npm run lint:errors
npm run lint:no-tailwind-centerpanel
npx vitest run src/centerpanel/components/map
npx vitest run src/services/map
npm run test:e2e -- e2e/map-modal-layout.spec.ts
npm run test:e2e -- e2e/accessibility-audit.spec.ts
npm run build
```

Proof:

- final ledger row records pass/fail truthfully
- any NO-GO is explicit and not hidden
- integration branch is pushed only after ledger is updated

Closeout:

- update `LEDGER.md`
- commit and push using the Agent Contract

---
