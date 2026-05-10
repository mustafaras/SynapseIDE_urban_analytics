# Urban Analytics Prompt Audit and Remediation

Date: 2026-04-23
Audited source: `URBAN_ANALYTICS_STRENGTHENING_SEQUENTIAL_PROMPTS.md`
Workspace: `c:\Users\PC\Desktop\SynapseIDE_urban_analytics`

## Validation executed during audit

- `npm run typecheck` - PASS
- `npm run build` - PASS
- `npm run lint:errors` - PASS
- `npm run test` - PASS, 1311 tests
- `npm run perf:budgets` - PASS
- `npm run test:e2e:smoke` - PASS, 13 tests
- Residual hardening note from smoke run: a non-fatal MapLibre cleanup `AbortError` still surfaced during teardown, consistent with `src/centerpanel/components/map/MapCanvas.tsx:254-256`

## Executive verdict

- The repository is no longer at placeholder or scaffold level. Core spatial statistics, multivariate analytics, scenario tools, reporting, education, collaboration, columnar I/O, worker orchestration, and release validation are materially implemented.
- The statement "every prompt is fully, smoothly, scientifically, visibly, and premium-grade wired in the UI" is not yet true.
- The highest-risk gaps are not the core mathematics. The main problems are governance drift, demo-wired GeoAI surfaces, missing first-class operator UI for EO connectors, hidden or weakly validated advanced tools, unresolved right-panel/report placeholders, and premium UI maintainability debt.
- Release documentation currently overstates functional depth in several places by treating "reachable in UI" as equivalent to "fully wired against real data and real runtime conditions."

## Prompt-by-prompt audit matrix

Status key:
- `Complete` = materially implemented and no major prompt-specific defect was found in this audit
- `Complete + docs gap` = implemented, but missing prompt completion or current-state governance is incomplete
- `Partial` = materially implemented but not fully wired, not fully truthful, or not fully productized

| Prompt | Feature status | Documentation status | Audit note |
|---|---|---|---|
| 01 | Partial | Stale | `docs/implementation/module-matrix.md` is no longer trustworthy as current truth. |
| 02 | Complete | OK | Spatial weights engine exists and validation passed. |
| 03 | Complete | OK | Global Moran's I exists and validation passed. |
| 04 | Complete | OK | Local Moran's I and LISA mapping exist and validation passed. |
| 05 | Complete | OK | Getis-Ord Gi* exists and validation passed. |
| 06 | Complete | OK | OLS plus diagnostics exist and validation passed. |
| 07 | Complete | OK | GWR exists and validation passed. |
| 08 | Partial | Missing completion report | STAC and COG implementations exist, but there is no first-class operator workflow surface. |
| 09 | Partial | Missing completion report | Sentinel Hub connector exists, but it is not productized into a discoverable end-user workflow. |
| 10 | Complete | Missing completion report | Placeholder analytical flows are materially present and release-tested. |
| 11 | Complete + docs gap | Missing completion report | `PCA.ts` and `ClusterAnalysis.ts` exist and are tested, but governance is incomplete. |
| 12 | Complete + docs gap | Missing completion report | ONNX runtime infrastructure exists and is used, but prompt closure is undocumented. |
| 13 | Partial | Missing completion report | Land-cover pipeline is real code, but current UI run path is synthetic-demo based. |
| 14 | Partial | Overstated | NL-to-SQL works deterministically, but it runs against demo collections rather than live project tables. |
| 15 | Complete + premium UI debt | OK | Building extrusion UI works, but remains sample-first and heavily inline-styled. |
| 16 | Complete | OK | CityJSON loader is discoverable and supports real file import. |
| 17 | Complete + sample-first | OK | Sunlight simulation works, but it is still seeded by sample buildings rather than real building inputs. |
| 18 | Partial | Overstated | Object detection UI is wired, but current run path uses a synthetic inferrer rather than real model weights. |
| 19 | Complete | OK | Narrative generation is implemented and wired into downstream surfaces. |
| 20 | Complete | OK | Cellular automata urban growth flow is materially implemented. |
| 21 | Complete | OK | Facility siting / location-allocation flow is materially implemented. |
| 22 | Complete | OK | Composite indicator builder is materially implemented. |
| 23 | Complete | OK | Scenario comparison is materially implemented and tested. |
| 24 | Complete | OK | System dynamics module is materially implemented. |
| 25 | Partial | Missing completion report | Emerging hot spot analysis exists, but is hidden behind a map toolbar toggle and lacks broader journey validation. |
| 26 | Complete + premium UI debt | Missing completion report | Dashboard builder exists, but file size and inline-style density are too high for premium maintainability. |
| 27 | Partial | Missing completion report | Report workspace is strong, but snapshots and recent change history are still unwired. |
| 28 | Complete + docs gap | Missing completion report | Advanced chart library expansion exists. |
| 29 | Complete + docs gap | Missing completion report | Learning-path engine and methodology explainers exist. |
| 30 | Complete | OK | Pre-loaded teaching dataset library is implemented. |
| 31 | Complete | OK | Interactive exercises and auto-grading are implemented. |
| 32 | Complete + docs gap | Missing completion report | Collaboration engine and UI exist, but closure documentation is absent. |
| 33 | Complete + synthetic diagnostics | Missing completion report | Spatial index stack is implemented; the lab still uses deterministic synthetic records by design. |
| 34 | Complete | OK | Arrow and GeoParquet I/O is implemented and E2E-tested. |
| 35 | Complete + docs gap | Missing completion report | Worker-pool orchestration exists and is tested. |
| 36 | Complete + docs gap | Missing completion report | Expanded indicator catalog exists and is tested. |
| 37 | Complete + docs gap | Missing completion report | Unit test matrix exists and local test run passed. |
| 38 | Complete + docs gap | Missing completion report | E2E coverage exists, but some advanced surfaces are still only launch-verified. |
| 39 | Complete + docs gap | Missing completion report | Accessibility hardening exists and a11y suites are present. |
| 40 | Complete + docs gap | Missing completion report | Shell focus visibility hardening exists, but prompt closure doc is missing. |
| 41 | Complete + docs gap | Missing completion report | Bundle budgets and performance governance exist and passed locally. |
| 42 | Partial | Contradicted by live UI | Prompt 42 says debt closure is complete, but right-panel placeholders still remain in production code. |
| 43 | Partial | Missing completion report | Release-candidate validation exists, but docs overstate functional depth and smoke teardown still emits cleanup noise. |

## Missing completion reports

The following prompt completion documents are missing under `docs/implementation/`:

`08, 09, 10, 11, 12, 13, 25, 26, 27, 28, 29, 32, 33, 35, 36, 37, 38, 39, 40, 41, 43`

## Highest-priority findings

### 1. Governance drift is severe enough to break prompt traceability

- `docs/implementation/module-matrix.md:14-27` still marks core spatial-stat files as stubbed or missing even though they are present and tested.
- `docs/implementation/module-matrix.md:54-56` still marks `STACClient.ts`, `COGReader.ts`, and `SentinelHubConnector.ts` as missing even though they exist.
- `docs/implementation/prompt-42-completion.md` says documentation debt was closed, but the current implementation ledger is still incomplete and partially misleading.

Impact:
- Prompt 01 is not operationally closed.
- Engineers cannot rely on docs alone to know what is truly implemented.
- Release confidence is weaker than the docs currently imply.

### 2. GeoAI surfaces are still demo-wired in the most credibility-sensitive areas

- `src/engine/geoai/hooks/useLandCoverClassification.ts:234` loads `demo://land-cover`.
- `src/centerpanel/Tools/components/GeoAILab.tsx:337` explicitly states the land-cover run uses a synthetic study scene.
- `src/centerpanel/Tools/components/GeoAILab.tsx:36`, `:144`, and `:237` route NL-to-SQL through `DEMO_LAYER_COLLECTIONS`.
- `src/centerpanel/components/ObjectDetectorPanel.tsx:1-9` explicitly documents a synthetic tile inferrer and no real model weights.

Impact:
- Prompts 13, 14, and 18 are visible, but they are not yet "real-data premium analytical surfaces."
- Scientific credibility is reduced because UI language and docs can be read as stronger than current runtime truth.

### 3. EO connector prompts are implemented as libraries, not as operator tools

- `src/services/data/connectors/STACClient.ts`
- `src/services/data/connectors/COGReader.ts`
- `src/services/data/connectors/SentinelHubConnector.ts`
- Outside the connector layer, the main visible evidence is capability listing in `src/centerpanel/components/EngineCapabilitiesPanel.tsx:89-104`.
- Search across `src` outside connector code shows no equivalent first-class operator panel for STAC search, COG preview/load, or Sentinel Hub processing.

Impact:
- Prompts 08 and 09 are technically present but weakly discoverable.
- The application does not yet expose a clean end-user remote-sensing workflow for these connectors.

### 4. Prompt 42 debt closure is contradicted by live placeholders

- `src/features/urbanAnalytics/RightPanelFourBlock.tsx:306` - `No methodology details yet.`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx:346` - `No data requirements specified.`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx:376` - `No code snippets available.`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx:414` - `No references listed.`
- `docs/implementation/prompt-42-completion.md` says right-panel seed debt was closed.

Impact:
- Prompt 42 is not actually closed.
- The right panel still falls below the "scientific premium" bar when content is absent.

### 5. Report workspace still has unwired review-history holes

- `src/centerpanel/tabs/Note.tsx:651` contains `Snapshots not yet supported in urban project model`.
- `src/centerpanel/tabs/Note.tsx:868` comments that recent changes are not yet supported.
- `src/centerpanel/tabs/Note.tsx:1002-1008` defines `RecentChanges` as a placeholder returning `null`.

Impact:
- Prompt 27 is not fully complete from a reproducibility and review-governance standpoint.
- Change provenance is weaker than a premium reporting surface should allow.

### 6. Emerging hot spot analysis is implemented but under-discoverable

- `src/centerpanel/components/map/MapToolbar.tsx:386` exposes it as a toolbar toggle.
- `src/centerpanel/components/MapExplorerModal.tsx:1983-1985` mounts `MapEmergingHotSpotViz`.
- There is no completion report for Prompt 25.
- Release docs do not give it the same execution depth as stronger analytical flows.

Impact:
- Prompt 25 exists, but it is not surfaced like a first-class workflow.
- Advanced users may miss it entirely unless they inspect the map toolbar.

### 7. Premium UI consistency is below target in key shell surfaces

Observed maintainability and consistency debt:

- `src/centerpanel/components/MapExplorerModal.tsx` - 2102 lines
- `src/features/dashboard/DashboardBuilder.tsx` - 1425 lines
- `src/centerpanel/tabs/Note.tsx` - 1139 lines
- `src/centerpanel/CenterPanelShell.tsx` - 640 lines

Inline-style density in key files:

- `DashboardBuilder.tsx` - 89 `style={{ ... }}` occurrences
- `MapExplorerModal.tsx` - 33
- `CenterPanelShell.tsx` - 13
- `Note.tsx` - 9

Hardcoded amber styling is still embedded in major surfaces:

- `src/centerpanel/components/MapExplorerModal.tsx:1662`, `:1705-1711`, `:1733`, `:1768`, `:1776`, `:2003-2080`
- `src/centerpanel/CenterPanelShell.tsx:101-107`, `:445-452`, `:602-609`
- `src/features/dashboard/DashboardBuilder.tsx:243`, `:397`, `:1162`
- `src/features/urbanAnalytics/RightPanelFourBlock.tsx:671-905`

Impact:
- The product still looks coherent overall, but it is not yet at a stable premium design-system standard.
- Large monolithic files increase the chance of partial prompt wiring, hidden regressions, and visual inconsistency.

### 8. Release docs often verify launchability, not full analytical depth

- `docs/release/visual-completeness-checklist.md:24-35` repeatedly uses notes such as `Launch surface verified`.
- `docs/release/visual-completeness-checklist.md:42-50` marks toolbox/workspace surfaces as reachable or visible.
- `docs/release/release-candidate-validation.md:34` says smoke now verifies top-level tabs, toolbox labs, and workflow-library surfaces.

Impact:
- Release docs are useful, but they currently blur the line between "reachable in UI" and "fully wired to real data and production-grade runtime."
- Prompt 43 is only partially closed.

### 9. VoxCity still contains sample-first paths where real-data bridges should exist

- `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx:485-490` auto-loads sample buildings on first mount.
- `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx:602` explicitly surfaces `Load sample`.
- `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx:410-413` auto-loads demo buildings.
- `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx:1030` tells the user only sample buildings are loaded.
- Positive counterexample: `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx:453-591` already supports real drag-and-drop import.

Impact:
- Prompts 15 and 17 satisfy their original sample-data acceptance path, but they are not yet fully elevated into a real project-data workflow.

## Remediation prompt pack

The following prompts are designed to be executed as a focused correction program. Each one is implementation-oriented and should be treated as a real delivery prompt, not as a brainstorming note.

### Global remediation validation gate

Every remediation prompt below must run:

- `npm run typecheck`
- `npm run build`
- `npm run test`
- Targeted Playwright coverage for any changed user-facing flow

## Fix Prompt 01 - Governance Sync and Truthful Completion Ledger

### Objective

Restore prompt-to-repository traceability so implementation docs, release docs, and live code all tell the same truth.

### Prompt

- Regenerate `docs/implementation/module-matrix.md` from the actual repository state instead of keeping it as a misleading pseudo-current ledger.
- Create missing completion reports for prompts `08, 09, 10, 11, 12, 13, 25, 26, 27, 28, 29, 32, 33, 35, 36, 37, 38, 39, 40, 41, 43`.
- Add an explicit status vocabulary to every completion doc: `implemented`, `implemented with demo mode`, `implemented with residual gap`, `environment-dependent`, `deferred`.
- Update `docs/release/visual-completeness-checklist.md` and `docs/release/release-candidate-validation.md` so they clearly separate:
  - launch verified
  - execution verified
  - demo-mode only
  - external dependency gated
- Add a single index file, for example `docs/implementation/prompt-status-ledger.md`, that summarizes the current truth for prompts 01-43.

### Acceptance criteria

- No currently implemented module is still marked missing or stubbed in current-state docs.
- Every prompt 02-43 has a current completion or residual note.
- Release docs no longer imply full production wiring where only reachability has been verified.

## Fix Prompt 02 - EO Connector Operator Surface

### Objective

Convert Prompts 08 and 09 from library-only wins into visible, end-user, remote-sensing workflow surfaces.

### Prompt

- Build a dedicated UI panel in Toolbox or Map Explorer for EO connectors with three sections:
  - STAC catalog search
  - COG metadata/window preview
  - Sentinel Hub scene/process request
- Wire `STACClient.ts`, `COGReader.ts`, and `SentinelHubConnector.ts` into real user actions with loading, retry, auth, and empty-state messaging.
- Let users select a project extent or map bbox as the spatial query envelope.
- Let users publish connector outputs into Map Explorer as map layers or dataset entries.
- Persist connector requests and outputs into completed-run or import provenance metadata so reporting can reference them later.
- Add targeted Playwright coverage for:
  - STAC search result listing
  - COG metadata preview
  - Sentinel Hub credential-missing and success-path UI states

### Acceptance criteria

- A user can search STAC, inspect a result, preview COG metadata, and publish a selected raster source without touching code.
- Sentinel Hub is no longer only an implementation detail; it is a visible operator surface with truthful runtime feedback.
- Prompts 08 and 09 become discoverable from the main UI, not just capability catalogs.

## Fix Prompt 03 - Real Raster-Backed Land Cover Classification

### Objective

Upgrade Prompt 13 from a synthetic demo run into a real-data analytical workflow while keeping demo mode explicit and optional.

### Prompt

- Replace the hardwired synthetic default in `useLandCoverClassification.ts` with selectable inputs from:
  - imported raster layers
  - STAC/COG-derived rasters
  - Sentinel Hub outputs
- Keep a labeled `Demo mode` path, but never present it as the only runtime path.
- Surface input metadata in the UI:
  - raster source
  - extent
  - CRS
  - resolution
  - band mapping
  - preprocessing choices
- Record provenance alongside the classified result and accuracy report.
- Update GeoAI Lab copy so the UI states whether the run is `demo` or `real dataset`.
- Add E2E coverage for selecting a real raster input and publishing the resulting classified layer.

### Acceptance criteria

- Land-cover classification can run against a user-selected real raster source.
- Demo mode remains available, but it is explicitly labeled and not confused with production analysis.
- Prompt 13 becomes compatible with the EO connector stack in a real operator journey.

## Fix Prompt 04 - Live NL-to-SQL Against Project Data

### Objective

Upgrade Prompt 14 from deterministic demo query generation to real, inspectable SQL over live project datasets.

### Prompt

- Remove the hard dependency on `DEMO_LAYER_COLLECTIONS` inside `GeoAILab.tsx`.
- Expose table selection and schema awareness from the actual project spatial database or imported dataset registry.
- Let the user see:
  - available layers/tables
  - available fields
  - geometry type
  - spatial functions being used
  - row count or sample preview
- Execute accepted SQL against the live sandboxed spatial DB, not only against hardcoded demo collections.
- Preserve rejection behavior for unsafe or mutating requests.
- Add tests and Playwright coverage for:
  - querying a real imported layer
  - query rejection
  - result publication to map and run review

### Acceptance criteria

- NL-to-SQL can operate on real imported project layers.
- The UI no longer implies real query execution while silently routing through demo fixtures.
- Prompt 14 becomes analytically credible for actual project work.

## Fix Prompt 05 - Real-Model Object Detection With Explicit Demo Mode

### Objective

Upgrade Prompt 18 from a synthetic orchestration demo into a real object-detection workflow while preserving a labeled fallback demo mode.

### Prompt

- Introduce a real model-loading path through the existing GeoAI runtime and model registry.
- Support user-selected imagery inputs from imported rasters or EO connector outputs.
- Keep the current synthetic inferrer as `Demo mode` only.
- Show model provenance in the UI and saved run:
  - model id
  - backend
  - threshold set
  - tile size
  - NMS settings
  - input raster source
- Update prompt completion docs and UI copy so "complete" does not mean "synthetic only."
- Add tests for:
  - demo mode
  - real-model mode with mocked weights or a small browser-safe fixture
  - publish-to-map
  - completed-run persistence

### Acceptance criteria

- Object detection can run with a real model path, not only a synthetic inferrer.
- Demo mode remains available but is explicitly labeled.
- Prompt 18 is no longer overstated relative to runtime truth.

## Fix Prompt 06 - VoxCity Real-Data Bridges

### Objective

Lift Prompts 15 and 17 from sample-first tools into real project-data workflows while keeping their current demo samples as optional quick-starts.

### Prompt

- Add a real input bridge from:
  - imported building footprint layers into `BuildingViewer.tsx`
  - loaded CityJSON geometry into sunlight simulation where appropriate
  - existing map/project layers into both tools
- Keep `Load sample` as a convenience button, not as the default or only data path.
- Make the active input source visible in the UI at all times.
- Persist source metadata in map publications and completed runs.
- Add E2E coverage for:
  - loading a real building layer into the extrusion viewer
  - passing real geometry into the sunlight simulation

### Acceptance criteria

- Users can run extrusion and sunlight analysis on project data without touching code.
- Sample datasets remain available, but they are no longer the de facto runtime truth.
- VoxCity tools become better aligned with the rest of the platform's data lifecycle.

## Fix Prompt 07 - Emerging Hot Spot Discoverability and Validation

### Objective

Promote Prompt 25 from a hidden advanced panel to a first-class spatiotemporal workflow.

### Prompt

- Add a workflow-library entry and/or toolbox card for emerging hot spot analysis.
- Keep the map-toolbar shortcut, but do not rely on it as the primary discovery path.
- Add completed-run publication and review hooks if any part is still panel-local only.
- Add dedicated Playwright coverage for:
  - opening the feature from a non-toolbar path
  - running the analysis
  - inspecting category counts and legend
  - publishing or reviewing output
- Add a completion report for Prompt 25.

### Acceptance criteria

- Emerging hot spot analysis is reachable from an obvious product-level navigation path.
- The feature is covered by explicit validation rather than incidental visibility.
- Prompt 25 becomes discoverable to users who never inspect the map toolbar.

## Fix Prompt 08 - Report History and Right-Panel Substance Closure

### Objective

Actually close the unresolved parts of Prompts 27 and 42.

### Prompt

- Wire snapshot support and recent-change history into the urban project model and the Report workspace.
- Replace `RecentChanges` placeholder returns in `Note.tsx` with real data and UI.
- Replace right-panel placeholders in `RightPanelFourBlock.tsx` with derived or authored content for:
  - methodology
  - data requirements
  - code snippets
  - references
- If some cards still truly lack content, render an explicit curated fallback sourced from the seed library or methodology registry rather than an empty placeholder sentence.
- Add tests that fail if the four current placeholder strings ever reappear in production builds.

### Acceptance criteria

- `RecentChanges` is no longer a null placeholder.
- Right-panel sections never show empty "not yet" filler text in production UX.
- Prompt 42 becomes truthfully closable.

## Fix Prompt 09 - Premium UI Refactor and Design-System Hardening

### Objective

Raise the shell, map, dashboard, report, and right-panel surfaces to a maintainable premium standard and reduce the risk of future partial prompt wiring.

### Prompt

- Refactor the largest UI monoliths into smaller presentational and container modules:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/features/dashboard/DashboardBuilder.tsx`
  - `src/centerpanel/tabs/Note.tsx`
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
- Replace local hardcoded amber styling with semantic design tokens and shared CSS/module styles where possible.
- Reduce inline-style density substantially and centralize repeat visual patterns.
- Validate responsive behavior and text visibility on compact widths so panels remain readable and unclipped.
- Add visual regression or focused Playwright assertions for key premium surfaces:
  - Map Explorer
  - Dashboard Builder
  - Report workspace
  - Right panel

### Acceptance criteria

- Target files are materially smaller and better partitioned.
- Hardcoded `#F59E0B` usage is reduced to theme/token layers rather than scattered product code.
- The UI reads as one coherent premium system rather than a mix of strong features and local styling islands.

## Fix Prompt 10 - Release Candidate Hardening and Truthful QA

### Objective

Finish Prompt 43 in a way that is both technically quieter and more truthful.

### Prompt

- Eliminate the MapLibre cleanup abort noise in `MapCanvas.tsx` so smoke teardown is clean.
- Expand release-facing validation to cover areas that are currently only "launch verified" but should now be execution verified after remediation:
  - EO connector panel
  - real-data land-cover run
  - live NL-to-SQL against imported layers
  - real-model or clearly labeled demo object detection
  - emerging hot spot analysis
  - report history / recent changes
- Update release docs so every validation claim uses precise language.
- Create `docs/implementation/prompt-43-completion.md` with explicit residuals, not optimistic shorthand.

### Acceptance criteria

- Smoke and targeted release suites complete without teardown noise from map cleanup.
- Release docs distinguish actual execution coverage from launch visibility.
- Prompt 43 becomes a truthful release-hardening milestone rather than a visibility-only signoff.

## Recommended execution order

1. Fix Prompt 01
2. Fix Prompt 08
3. Fix Prompt 02
4. Fix Prompt 03
5. Fix Prompt 04
6. Fix Prompt 05
7. Fix Prompt 06
8. Fix Prompt 07
9. Fix Prompt 09
10. Fix Prompt 10

## Final assessment

The platform is strong enough to justify continued hardening rather than rewrite. The correction program should focus on truthfulness, real-data wiring, and premium UI stabilization, not on replacing the analytical engines that already work. The most important discipline from this point onward is simple: do not call demo-wired surfaces complete until the UI, runtime, provenance, and release docs all agree on what is truly real and what is still a controlled demonstration path.
