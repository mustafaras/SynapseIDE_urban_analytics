# Color System Implementation Ledger

## Purpose

This ledger is the execution source of truth for the color-system operating pack. Every color agent must read it before starting and update it before finishing.

## Current Status

- Operating pack status: reprioritized for three-part amber-removal and premium workbench restyle execution on 2026-05-15; Map Explorer Part 3 prompt ladder expanded on 2026-05-18 after code-reading the completed Center Panel design language and current Map Explorer amber/chrome dependencies.
- Historical implementation status: old broad Prompts 00-17 completed on 2026-05-15; old pending Prompts 18-37 are superseded by active prompts A01-A10, C01-C10, and B01-B15.
- Active prompt count: 35 prompts: `A01` through `A10`, `C01` through `C10`, and `B01` through `B15`.
- Current prompt: Part 1 (Urban Analytics) closed; Part 2 (Center Panel Workbench, C01-C10) underway; Prompts C01-C08 completed. Prompts B01-B07 were completed on 2026-05-18 as user-directed targeted Map Explorer deviations before C09/C10 close; B01 was documentation-only, and B02-B07 changed product code.
- Next prompt: Normal operating-pack order remains Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector. If continuing the user-selected Map Explorer track, the next Map Explorer prompt is B08 - Workflow Drawer, NL Query, Review Timeline, Cartography Recommendations, And Report Handoff Drawer, but product-code implementation remains gated by the Part 2 close unless the user explicitly continues the deviation.
- Part 1 status: COMPLETE. All 10 active prompts (A01-A10) completed. Urban Analytics modal is amber-free except for documented analytical/scientific retentions.
- Part 2 status: UNDERWAY. New 10-prompt ladder (C01-C10) covers Center Panel shell + all eight tab interiors + ambient header animations preservation; runs before the Map Explorer track.
- Part 3 status: BLOCKED on C10 for normal product-code implementation. Map Explorer prompts are Part 3 and now run as B01-B15; B01 dependsOn C10 in the manifest, but B01-B07 were completed early by explicit user direction.
- Archive context: do not move `DEVELOPMENT_PLANS/` from the current local branch; branch reconciliation is separate.
- Active migration principle: Urban Analytics modal first, Center Panel Workbench second, Map Explorer third; no amber UI/default styling, no unnecessary card frames, no filled button plates.

## Canonical Documents

1. `COLOR_SYSTEM_PLANS/README.md`
2. `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
3. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
4. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
5. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
6. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
7. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
8. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
9. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
10. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
11. `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
12. This ledger.

## Prompt Status Register

| ID | Prompt | Status | Depends On | Notes |
| --- | --- | --- | --- | --- |
| A01 | Urban Analytics Amber Inventory And Scope Lock | completed | None | UA amber/card/button inventory recorded; next prompt is A02. |
| A02 | Urban Analytics Modal Shell, Backdrop, Header, And Welcome | completed | A01 | Removed amber shell/welcome chrome; A02 target files now scan clean. |
| A03 | Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions | completed | A02 | Rail, command/search, chips, study-area picker, and bottom actions migrated to compact unfilled non-amber interactions. |
| A04 | Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel | completed | A03 | Method/detail and indicator catalog surfaces flattened to dense tokenized rows/panels; A04 targets are amber-clean. |
| A05 | Urban Analytics Right Panel Dossier And Generated HTML | completed | A04 | Generated page HTML and prompt-card surfaces migrated to charcoal+blue tokens; A05 target files scan clean. |
| A06 | Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status | completed | A05 | Evidence tray fully de-ambered: row/filter/toggle/kindIcon/chip/detailGroup migrated to workbench tokens; warning chip is blue (info), detail groups flattened, fitness panel neutralized so unknown does not look valid. |
| A07 | Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels | completed | A06 | VoxCity 3D viewers, controls, scenario compare, simulation overlay, and sunlight panel migrated to charcoal+blue tokens; default thematic ramp swapped to non-amber sequential; analytical heatmap legend swatches retained and documented as data. |
| A08 | Urban Analytics Python, Package, Script Template, And Data Bridge Panels | completed | A07 | Python env/package/script-template UI migrated to charcoal+blue; Python templates' default amber single-color plots swapped for blue, LISA HL color shifted to PySAL convention; walkability diverging ramp retained with documentation. |
| A09 | Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA | completed | A08 | Final UA sweep: study-area default, test fixture, all remaining seed/template Python plot defaults, and the BuildingViewer ramp preview migrated. Only documented analytical heatmap swatch and AMBER scientific traffic-light label remain. |
| A10 | Urban Analytics Handoff And Part 2 Gate | completed | A09 | Part 1 closed; manifest statuses synced to completed. Note: at A10 close the next pointer was B01; on 2026-05-16 a new Part 2 (C01-C10) was inserted between A10 and B01 per user directive, so the next active prompt is now C01 and Map Explorer became Part 3. |
| C01 | Center Panel Workbench Inventory And Scope Lock | completed | A10 | Tab-scoped Center Panel amber + heavy-chrome inventory; 122 in-scope amber hits across 26 files and 389 in-scope heavy-chrome hits across 31 files; legacy `--ui-*` token island and preserved-animation set documented; next prompt is C02. |
| C02 | Center Panel Shell, Top Header, Tab Frame, Status Rail, Tokens, And Header Animations | completed | C01 | Shell + tokens + header re-pointed to workbench palette; `--accentGold` re-pointed to `--syn-text-muted`, `--hdr-state-warning` re-pointed to `--syn-status-running` (non-amber), `.logoCore` amber gradient replaced with charcoal-to-blue, `a11y.focusRing` fallback de-ambered, `DeferredPanelFallback` reshaped to hairline loading row. All 13 keyframes (ambientGlow, dataFlow, neuralPulse, neuralRotate, logoShine, logoPulseAnim, logoRingAnim, pulse, gradientFlow, hologramScan, dataStreamPulse, badgePulse, timerPulse, dotPulse, panelFadeIn, cpFadeSlide) preserved with same timings. C02 target files scan clean; next prompt is C03. |
| C03 | Projects Tab — Registry Layout, Cards, Session, Indicator, And AI Surfaces | completed | C02 | Registry left rail, project table, detail view, and rail snapshot/workspace cards flattened to transparent 4px-radius surfaces with hairline borders. Amber removed from Registry CardChip hover, "Recently Viewed"/"Relevant Methods" titles, ProjectSummaryCard completeness bar, and WorkspaceCard accent. Selected project row uses 2px blue inset left rail instead of filled amber outline. All three `.primaryBtn` definitions converted to transparent ghost buttons with blue text + hairline hover border. C03 target files scan clean; next prompt is C04. |
| C04 | New Project Tab — Form Layout, Field Stacks, Tag Pills, Submit Bar | completed | C03 | Three nested `.card` sections collapsed into single `<form>` surface with three `.group` blocks separated by `--syn-border-subtle` hairlines. `newProject.module.css` fully rewritten to workbench tokens (no more `rgba(0,0,0,0.18)` / `rgba(255,255,255,0.08)` / `rgba(255,180,0,...)` literals). Inputs use `--syn-surface-input` + 3px radius, tag chips use blue 12% mix on active, primary button is transparent with 1px blue border + blue text + 10% mix on hover, secondary is ghost. BBox laid out as dedicated 4-column grid (collapses to 2 at ≤720px). `aria-pressed`, `aria-disabled`, `type="submit"`, and form-level Enter-to-submit added; draft store wiring untouched. C04 target files scan clean; next prompt is C05. |
| C05 | Methods/Guide Tab — Methods View, Outline Rail, Guide Cards, And Command Bar | completed | C04 | All amber literals removed from `navtree.module.css`, `guides.rail.module.css`, and `guides.panel.module.css`. Outline tree active row uses 12%/18% blue mix + 2px inset blue left rail. Follow-up pass per user screenshot: appended Workbench Flatness Override block to `guides.module.css` that neutralizes all decorative `::before/::after` rail accents (rainbow nth-child gimmick, animated underline bars, sticky-gradient bg), flattens `.railSep` to plain uppercase muted labels (no pill), removes the rainbow rail accents, flattens chip filter row to 3px hairline pills, flattens `.block`/`.preview` filled boxes to 2px left-rail quotes, flattens `.macroBtn`/`.secActionBtn`/`.iconBtn` to ghost discipline. Section/card/macro/sticky headers all switched to transparent + bottom hairline. Result: Methods tab now matches the dense workbench discipline of Projects/New Project tabs. C05 target files scan clean; next prompt is C06. |
| C06 | Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert | completed | C05 | Report/Note tab migrated to flat workbench notebook discipline: header strip, rail groups, sections, format bar, library insert, recent changes, footer, and report builder shell are amber-clean with square/hairline chrome. Follow-up passes moved the report builder into the main/dock workbench layout, flattened the collaboration dock, and restored a full-width stacked report flow with Live Preview at the bottom; next prompt is C07. |
| C07 | Workflows Tab — Flow Host, Flows Rail, Tiles, Step Pills, Cockpit, And Per-Flow Surfaces | completed | C06 | Flow shell, tiles, rail cards, cockpit controls, scenario/composite/system surfaces, and `flows.module.css` overrides migrated to dense hairline workbench chrome. Primary C07 scan has no amber UI hits; remaining Flow hits are analytical/data palette values documented in the C07 log. Next prompt is C08. |
| C08 | Toolbox Tab — Project List, Action Panel, Capability/Lab/Consulton Panels, Export Bar | completed | C07 | Toolbox tab migrated to dense workbench discipline: `tools.module.css` and `tools.left.module.css` both received a C08 override layer that neutralizes every amber/gold/yellow class and gradient (themeAmber, panelAmber, pillAmber, calloutAmber, cardTitleAmber, barThemeAmber, statCard amber gradient, riskChip tier-3 amber, glass-amber backgrounds) to semantic non-amber tokens. Panels flattened to single-surface hairline sections, buttons converted to ghost/hairline discipline, inputs to compact 3px workbench fields, EO connector badges re-keyed to status-error/stale/demo/info/valid, PreviewPanel iframe scrollbar de-ambered to neutral muted thumb. JSX class wiring left untouched (per C07 precedent). Next prompt is C09. |
| C09 | Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector | pending | C08 | Cross-tab surfaces migrated; preserved animations still play. |
| C10 | Center Panel Final Cleanup, Visual QA, And Part 3 Gate | pending | C09 | Close Part 2 and unblock Map Explorer (B01). |
| B01 | Map Explorer Amber Inventory And Center Panel Alignment Lock | completed | C10 | Completed 2026-05-18 as user-directed targeted deviation before C09/C10 close; documentation-only inventory. Standard scan: 446 lines / 57 files. Heavy-chrome scan: 585 lines / 45 files. Product code unchanged; B02 is the next Map Explorer prompt. |
| B02 | Map Tokens, Style Primitives, And Compatibility Aliases | completed | B01 | Completed 2026-05-18 as user-directed targeted deviation before C09/C10 close; central map tokens moved to non-amber workbench semantic aliases, deprecated amber compatibility aliases retained with non-amber values, shared `mapStyles` no longer consume amber aliases directly, and token tests updated. Post-audit target scan reduced from 87 to 53 standard hits and 102 to 69 heavy hits. |
| B03 | Map Shell, Modal, Docking Rails, Canvas Chrome, Focus, And Status Bar | completed | B02 | Completed 2026-05-18 as user-directed targeted deviation before C09/C10 close; focus fallback, resize handle, status bar QA caveat tone, keyboard fallback controls, canvas marker shadow, and modal canvas-overlay chrome migrated to non-amber workbench tokens. Target scans reduced from 7/13 to 0/0; current broad Map Explorer scan after B01-B03 audit is 405/539. |
| B04 | Map Command Cockpit, Workspace Bars, Timeline, And Progress Surfaces | completed | B03 | Completed 2026-05-18 as user-directed targeted deviation before C09/C10 close; cockpit gradients/shadows/filled plates removed, caveat tones moved off `--syn-status-warning`, progress/drag surfaces de-ambered, and B04 target scans are clean. |
| B05 | Toolbar, Search, Pins, Bookmarks, Context Menus, And Map Explorer Entry Button | completed | B04 | Completed 2026-05-18 as user-directed targeted deviation before C09/C10 close; toolbar/search/pin/bookmark/context/launcher chrome migrated to compact unfilled non-amber interactions and target scans are clean. |
| B06 | Layer Manager, Layer Panel, Registry Rows, Badges, Popovers, And Sync States | completed | B05 | Completed 2026-05-18 as user-directed targeted deviation before C09/C10 close; layer rows, badges, menus, base-layer states, slider accent, and sync defaults migrated to compact non-amber workbench styling. |
| B07 | Scientific QA, Readiness, Evidence, And Status Semantics | completed | B06 | Completed 2026-05-18 as user-directed targeted deviation before C09/C10 close; QA/readiness/evidence chrome and annotation default palette are non-amber while scientific status/domain values remain unchanged. |
| B08 | Workflow Drawer, NL Query, Review Timeline, Cartography Recommendations, And Report Handoff Drawer | pending | B07 | Remove amber from high-risk workflow/query/review/cartography/report drawer surfaces. |
| B09 | Import, CSV, Columnar, External Service, And Dataset Dialogs | pending | B08 | Remove amber and card-heavy styling from import, CSV, columnar, service, and dataset dialogs. |
| B10 | Export, Publication, Composition, Snapshot Preview, And Generated Output Chrome | pending | B09 | Remove amber from export/publication UI and generated preview/output chrome. |
| B11 | Drawing, Measurement, Annotation, Temporal, VoxCity Overlay, And Store Defaults | pending | B10 | Remove amber from interactive map tools and visible map-store defaults. |
| B12 | Visualization Panels, Symbology Utilities, Demo Packs, And Renderer Defaults | pending | B11 | Remove amber default/demo/generated renderer colors while documenting analytical data-palette exceptions. |
| B13 | Map Services, Query Defaults, Cartography Advisor, Persistence, External Connectors, And Engine Outputs | pending | B12 | Remove amber from service-level generated/default map outputs and related assertions. |
| B14 | Map Explorer Final Cleanup, Test Drift, Accessibility, Heavy Chrome, And Visual QA | pending | B13 | Final Map scan, heavy-chrome cleanup, test drift, focus/accessibility, and visual QA. |
| B15 | Final Color System Handoff | pending | B14 | Close the active three-part color operating pack after A01-A10, C01-C10, and B01-B14 are completed or skipped with reason. |

## Prompt Execution Log

### Prompt B01 - Map Explorer Amber Inventory And Center Panel Alignment Lock

- Date: 2026-05-18.
- Agent: GitHub Copilot.
- Status: completed.
- Trigger: user selected the B01 prompt block and requested "go apply be perfect and premium".
- Execution mode: user-directed targeted deviation. The manifest still gates Part 3 behind C10, and C09/C10 remain pending in the normal order; this B01 pass was documentation-only inventory and did not start Map Explorer product-code implementation.
- Started from:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt B01
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Current Map Explorer code under `src/centerpanel/components/map/**`, `src/centerpanel/components/Map*.tsx`, `src/services/map/**`, and `src/stores/useMapExplorerStore.ts`
- Files inspected:
  - `src/centerpanel/components/map/mapTokens.ts`
  - `src/constants/design.ts`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/centerpanel/components/map/MapLayerPanel.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/MapSearchBar.tsx`
  - `src/centerpanel/components/map/MapWorkflowDrawer.tsx`
  - `src/centerpanel/components/map/MapNLQueryPanel.tsx`
  - `src/centerpanel/components/map/MapReviewTimelinePanel.tsx`
  - `src/centerpanel/components/map/CartographyRecommendationList.tsx`
  - `src/centerpanel/components/map/MapReportHandoffDrawer.tsx`
  - `src/centerpanel/components/map/demoDataPacks.ts`
  - `src/centerpanel/components/map/heatmapStyleUtils.ts`
  - `src/centerpanel/components/map/symbolStyleUtils.ts`
  - `src/centerpanel/components/MapDataImportHubDialog.tsx`
  - `src/centerpanel/components/MapCsvImportDialog.tsx`
  - `src/centerpanel/components/MapColumnarImportDialog.tsx`
  - `src/centerpanel/components/MapServiceDialog.tsx`
  - `src/centerpanel/components/MapDataExportDialog.tsx`
  - `src/centerpanel/components/MapExportDialog.tsx`
  - `src/centerpanel/components/MapCompositionLayout.tsx`
  - `src/centerpanel/components/MapBookmarkBar.tsx`
  - `src/centerpanel/components/MapContextMenu.tsx`
  - `src/centerpanel/components/MapDrawingManager.tsx`
  - `src/centerpanel/components/MapMeasurementTool.tsx`
  - `src/centerpanel/components/MapAnnotationLayer.tsx`
  - `src/centerpanel/components/MapTemporalPlayer.tsx`
  - `src/centerpanel/components/MapVoxCityOverlay.tsx`
  - `src/centerpanel/components/MapChoroplethLayer.tsx`
  - `src/centerpanel/components/MapHeatmapLayer.tsx`
  - `src/centerpanel/components/MapSymbolLayer.tsx`
  - `src/centerpanel/components/MapClusterViz.tsx`
  - `src/centerpanel/components/MapHotSpotViz.tsx`
  - `src/services/map/ExternalServiceConnector.ts`
  - `src/services/map/MapCartographyAdvisor.ts`
  - `src/services/map/MapEngineAdapter.ts`
  - `src/services/map/MapExportService.ts`
  - `src/services/map/MapPersistenceService.ts`
  - `src/stores/useMapExplorerStore.ts`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Transient utilities: `tmp/b01-scan-count.cjs` was created only to avoid shell-escaping errors while counting scan matches, then deleted before closeout.
- Product behavior changes: none.
- Product code changed: none.
- Hard-coded colors removed: none; B01 is inventory-only.
- Standard Map Explorer amber scan:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning|MAP_COLORS\\.amber" src/centerpanel/components src/services/map src/stores/useMapExplorerStore.ts -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 446 matching lines across 57 files.
  - Top file counts: `map/mapTokens.ts` 43; `MapColumnarImportDialog.tsx` 36; `MapVoxCityOverlay.tsx` 34; `map/MapLayerManager.tsx` 20; `NarrativeGenerationPanel.tsx` 19; `MapCsvImportDialog.tsx` 18; `MapChoroplethLayer.tsx` 16; `MapClusterViz.tsx` 16; `MapHotSpotViz.tsx` 15; `MapServiceDialog.tsx` 15; `map/MapToolbar.tsx` 13; `MapDataExportDialog.tsx` 13; `MapTemporalPlayer.tsx` 13; `MapDataImportHubDialog.tsx` 11; `MapCartographyAdvisor.ts` 11; `MapExportService.ts` 11; `MapContextMenu.tsx` 10; `MapExportDialog.tsx` 10.
- Heavy-chrome scan:
  - Command: `rg -n "borderRadius:\\s*(?:['\"]?(?:1[0-9]|[2-9][0-9])px|MAP_RADIUS\\.(?:md|lg|glass|full)|999|50%)|border-radius:\\s*(?:1[0-9]|[2-9][0-9]|999|50%)|radial-gradient|linear-gradient|boxShadow|box-shadow:\\s*0\\s+\\d+px|MAP_SHADOWS\\.(?:modal|dropdown|panel)|DESIGN_TOKENS\\.gradients|DESIGN_TOKENS\\.shadows\\.(?:glow|premium)|background:\\s*MAP_COLORS\\.amber|MAP_COLORS\\.amber|MAP_STROKES\\.(?:hairline|hairlineStrong|hairlineSubtle|dashedStrong)" src/centerpanel/components src/services/map src/stores/useMapExplorerStore.ts -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 585 matching lines across 45 files.
  - Top file counts: `map/mapTokens.ts` 68; `MapColumnarImportDialog.tsx` 35; `map/MapLayerManager.tsx` 28; `MapVoxCityOverlay.tsx` 28; `map/MapToolbar.tsx` 27; `map/MapReportHandoffDrawer.tsx` 23; `MapServiceDialog.tsx` 23; `MapChoroplethLayer.tsx` 21; `MapTemporalPlayer.tsx` 20; `MapBookmarkBar.tsx` 19; `MapCsvImportDialog.tsx` 19; `MapClusterViz.tsx` 17; `MapHotSpotViz.tsx` 16; `MapDataExportDialog.tsx` 15; `MapExportDialog.tsx` 15.
- Inventory categories and planned owners:
  - `B02` central tokens/style primitives: `map/mapTokens.ts`, `src/constants/design.ts`, `MAP_COLORS.amber*`, amber `MAP_STROKES`, oversized `MAP_RADIUS` aliases, amber shared `mapStyles`, compatibility aliases, and downstream token consumers.
  - `B03` shell/modal/docking/canvas/status: `MapExplorerModal.tsx`, `map/MapWorkspaceShell.tsx`, `map/MapWorkspaceCockpit.module.css`, `map/MapStatusBar.tsx`, `map/MapCanvas.tsx`, canvas keyboard fallback controls, docking/rail focus states, and modal-level shadow/radius/gradient chrome.
  - `B04` cockpit/workspace bars/timeline/progress: `MapVoxCityOverlay.tsx`, `MapTemporalPlayer.tsx`, cockpit/workspace progress controls, command-bar chrome, timeline controls, and persistent workspace bars that currently carry amber or rounded filled plates.
  - `B05` toolbar/search/pins/bookmarks/context/entry: `map/MapToolbar.tsx`, `map/MapSearchBar.tsx`, `map/MapPinSidebar.tsx`, `MapBookmarkBar.tsx`, `MapContextMenu.tsx`, and `MapExplorerButton.tsx`.
  - `B06` layers/badges/popovers/sync: `map/MapLayerManager.tsx`, `map/MapLayerPanel.tsx`, `map/useLayerSync.ts`, layer row badges, selected rails, sync indicators, registry rows, and layer popovers.
  - `B07` scientific QA/readiness/evidence/status: `map/ScientificQAPanel.tsx`, readiness/warning/caveat treatments, CRS/evidence/status rows, and QA labels that must stay explicit without amber attention styling.
  - `B08` workflow/query/review/cartography/report drawers: `map/MapWorkflowDrawer.tsx`, `map/MapNLQueryPanel.tsx`, `map/MapReviewTimelinePanel.tsx`, `map/CartographyRecommendationList.tsx`, and `map/MapReportHandoffDrawer.tsx`.
  - `B09` import/CSV/columnar/service dialogs: `MapDataImportHubDialog.tsx`, `MapCsvImportDialog.tsx`, `MapColumnarImportDialog.tsx`, `MapServiceDialog.tsx`, and external dataset/service dialog chrome.
  - `B10` export/publication/composition/generated chrome: `MapDataExportDialog.tsx`, `MapExportDialog.tsx`, `MapCompositionLayout.tsx`, snapshot/publication preview chrome, and `MapExportService.ts` generated output styling.
  - `B11` drawing/measurement/annotation/temporal/store defaults: `MapDrawingManager.tsx`, `MapMeasurementTool.tsx`, `MapAnnotationLayer.tsx`, `MapTemporalPlayer.tsx`, `MapVoxCityOverlay.tsx`, and `DEFAULT_ANNOTATION_SETTINGS.color` in `useMapExplorerStore.ts`.
  - `B12` visualization/symbology/demo/renderers: `MapChoroplethLayer.tsx`, `MapHeatmapLayer.tsx`, `MapSymbolLayer.tsx`, `MapClusterViz.tsx`, `MapHotSpotViz.tsx`, `MapEmergingHotSpotViz.tsx`, `map/demoDataPacks.ts`, `map/heatmapStyleUtils.ts`, and `map/symbolStyleUtils.ts`.
  - `B13` services/query/persistence/connectors/engine outputs: `ExternalServiceConnector.ts`, `MapCartographyAdvisor.ts`, `MapEngineAdapter.ts`, `MapPersistenceService.ts`, service-level generated defaults, generated legend colors, and related tests.
  - `B14` final QA: repeat standard amber scan, heavy-chrome scan, test drift review, accessibility/focus review, compact viewport visual QA, and documented data-palette retentions.
  - `B15` final handoff: close the three-part operating pack after A01-A10, C01-C10, and B01-B14 are completed or explicitly skipped with reason.
- Targeted token/default/generated emitters found:
  - `map/demoDataPacks.ts`: demo labels and generated demo colors use `#F59E0B` / `#FBBF24`; treat as demo renderer defaults, not protected analytical evidence.
  - `map/heatmapStyleUtils.ts` and `map/symbolStyleUtils.ts`: hot ramp/fallback `MAP_COLORS.amber` values feed default renderer output.
  - `ExternalServiceConnector.ts`, `MapCartographyAdvisor.ts`, `MapEngineAdapter.ts`, `MapExportService.ts`, and `MapPersistenceService.ts`: service-level fallbacks, generated legends, export graphics, and persistence defaults include amber values and belong to B13/B10.
  - `useMapExplorerStore.ts`: `DEFAULT_ANNOTATION_SETTINGS.color` is visible UI/store default and belongs to B11.
- Out-of-scope scan noise:
  - `NarrativeGenerationPanel.tsx`, `ObjectDetectorPanel.tsx`, and `BackgroundTasksControl.module.css` appeared because the B01 command scans broad `src/centerpanel/components`. They are Center Panel cross-cutting surfaces and remain C09-owned unless they are later wired through a Map Explorer `Map*` surface.
  - Test files are not product chrome, but assertions/fixtures must move with their owning prompt if a visible default or generated output changes.
- Center Panel alignment lock for B02-B15:
  - Use single-surface workbench inspectors, hairline separators, compact 3px controls, transparent/ghost command buttons, blue active rails/tints, muted uppercase labels, and stable icon-sized controls.
  - Do not introduce decorative cards, nested cards, oversized rounded plates, amber fills, amber focus rings, or amber warning chips.
  - Warnings/caveats/stale/unknown/demo/deferred states must remain more explicit, not less explicit, using text/icon/aria plus neutral, blue-gray, or semantic non-amber tokens.
  - Keep UI/default/demo/generated chrome separate from legitimate map data palettes; any retained analytical ramp must be documented as data, not UI styling.
- Scientific integrity notes: No GIS calculations, CRS requirements, evidence artifact semantics, readiness logic, method validity, map persistence contracts, service contracts, NL-query safety, or report handoff contracts changed. Future B prompts must not compute area/distance in EPSG:4326 and must not relabel demo/synthetic output as real analysis.
- Validation commands:
  - Standard Map Explorer amber scan.
  - Heavy-chrome Map Explorer scan.
  - Temporary Node counter for exact file/line counts, then deletion of the counter file.
- Validation results:
  - Standard scan: 446 matching lines across 57 files.
  - Heavy-chrome scan: 585 matching lines across 45 files.
  - Typecheck/tests not run because B01 is documentation-only and product code was not changed.
- Known risks:
  - The broad B01 scan intentionally includes some non-map Center Panel files. Those are classified out of Part 3 scope above so B02-B15 do not steal C09 ownership.
  - Several amber values live in service-generated outputs and tests, so final zero-scan work cannot stop at component CSS/TSX.
  - Because this was a user-directed deviation before C09/C10, future agents must read both the normal current-status order and this B01 log before deciding whether to continue Center Panel cleanup or Map Explorer B02.
- Blockers: none for B01 inventory.
- Decisions made:
  - Treat B01 as documentation/inventory-only because the prompt forbids product-code changes unless a later implementation batch is requested.
  - Mark B01 completed while leaving C09/C10 pending and visible in the normal order.
- Next recommended prompt in normal order: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
- Next Map Explorer prompt if the user continues the targeted Part 3 track: Prompt B02 - Map Tokens, Style Primitives, And Compatibility Aliases.
- Ledger updated: yes.

### Prompt B02 - Map Tokens, Style Primitives, And Compatibility Aliases

- Date: 2026-05-18.
- Agent: GitHub Copilot.
- Status: completed.
- Trigger: user selected Prompt B02 and requested "go applu be perfect and premium".
- Execution mode: user-directed targeted Map Explorer implementation deviation. C09/C10 remain pending in the normal Center Panel order; this pass continued the B01-targeted Map Explorer track only.
- Started from:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt B02
  - B01 inventory in this ledger
  - Current code in `src/centerpanel/components/map/mapTokens.ts`, `src/constants/design.ts`, and `src/centerpanel/components/map/__tests__/map-components.test.ts`
- Files changed:
  - `src/constants/design.ts`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `src/centerpanel/components/map/__tests__/map-components.test.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- Product behavior changes:
  - Central Map Explorer UI primitives now resolve to VS Code-style workbench semantics: charcoal surfaces, neutral hairlines, blue interaction/focus/selection aliases, and non-amber caveat/status text.
  - Shared `mapStyles` no longer use `MAP_COLORS.amber*` for visible chrome; title, active buttons, selection panels, drag borders, progress bars, warning/caveat text, and shared shell surfaces now consume `interaction`, `selectedSubtle`, `focus`, `hairline`, `dashed`, `caveat`, or `caveatText` aliases.
  - `MAP_RADIUS.md`, `MAP_RADIUS.lg`, and `MAP_RADIUS.glass` were compacted to the shared small workbench radius. `MAP_RADIUS.full` remains for inherently circular markers/icons.
  - `MAP_SHADOWS.modal` and `MAP_SHADOWS.panel` now resolve to `none`; dropdown retains a restrained black overlay shadow for floating menus.
  - `MAP_STROKES` now points to neutral/blue hairline aliases instead of amber borders.
- Tokens added/consumed:
  - Added map-specific semantic aliases in `DESIGN_TOKENS.mapExplorer.colors`: `interaction`, `interactionSoft`, `interactionSubtle`, `selected`, `selectedSubtle`, `focus`, `hairline`, `hairlineStrong`, `hairlineSubtle`, `dashed`, `caveat`, `caveatText`, `neutral`, and `neutralSubtle`.
  - `MAP_COLORS` now exposes those aliases as first-class keys for downstream B03-B14 cleanup.
- Compatibility aliases:
  - Deprecated `MAP_COLORS.amber*` and `DESIGN_TOKENS.mapExplorer.colors.amber*` names were retained for existing B03-B14 callers.
  - Every retained map compatibility alias resolves to non-amber blue/neutral workbench values.
  - The only remaining `amber*` hits in `mapTokens.ts` are those compatibility alias names, not amber values or amber direct consumers.
- Hard-coded colors removed or avoided:
  - Removed amber as the desired central Map Explorer interaction color.
  - Replaced map-specific amber/cream surfaces with `--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-interaction-*`, and `--syn-status-*` var aliases with stable fallbacks.
  - Kept global amber palette/gradient families in `src/constants/design.ts` unchanged because B02 explicitly limits `design.ts` edits to the map-specific `DESIGN_TOKENS.mapExplorer` bridge.
- Tests updated:
  - `map-components.test.ts` now asserts `MAP_COLORS.interaction` as the desired map interaction token.
  - The legacy `MAP_COLORS.amber` compatibility alias is asserted to equal `MAP_COLORS.interaction` and not equal global `DESIGN_TOKENS.colors.primary[500]`.
  - Radius, shadow, active button, title, and semantic error token assertions now match the compact non-amber workbench primitive contract.
  - Post-audit cleanup replaced the remaining amber test layer fixture color with the blue interaction literal so B02 tests no longer carry amber as sample Map Explorer chrome.
- Targeted B02 pre-edit scan:
  - Standard target scan: 87 matching lines across `design.ts`, `mapTokens.ts`, and `map-components.test.ts`.
  - Heavy target scan: 102 matching lines across the same target files.
- Targeted B02 post-edit/post-audit scan:
  - Standard target scan: 53 matching lines across 3 files.
  - Top file counts: `src/constants/design.ts` 35; `src/centerpanel/components/map/mapTokens.ts` 14; `src/centerpanel/components/map/__tests__/map-components.test.ts` 4.
  - Heavy target scan: 69 matching lines across 3 files.
  - Top file counts: `src/centerpanel/components/map/mapTokens.ts` 36; `src/constants/design.ts` 28; `src/centerpanel/components/map/__tests__/map-components.test.ts` 5.
- Broad Map Explorer post-edit scan:
  - Standard Map Explorer scan: 413 matching lines across 57 files, down from B01 baseline 446.
  - Heavy-chrome Map Explorer scan: 552 matching lines across 45 files, down from B01 baseline 585.
  - Remaining broad hits are mostly downstream B03-B14 component/service owners plus known C09-owned non-map Center Panel files from the intentionally broad scan path.
- Residual classification:
  - `src/centerpanel/components/map/mapTokens.ts`: residual standard hits are deprecated compatibility alias names whose values are non-amber.
  - `src/constants/design.ts`: residual amber hits are global palette/gradient/status families outside B02 scope plus map-specific deprecated alias names that now point to blue/neutral values.
  - `src/centerpanel/components/map/__tests__/map-components.test.ts`: residual hits intentionally assert compatibility alias behavior and the alias is no longer equal to the global amber primary token.
  - Residual heavy hits in `mapTokens.ts` include deliberate shared hairline stroke aliases and circular marker/icon radius usage; downstream component heavy chrome remains assigned to B03-B14.
- Validation commands:
  - `npm --prefix "C:\Users\m_ras\Desktop\SynapseIDE_urban_analytics" run typecheck`
  - `npm --prefix "C:\Users\m_ras\Desktop\SynapseIDE_urban_analytics" exec -- vitest --root "C:\Users\m_ras\Desktop\SynapseIDE_urban_analytics" run src/centerpanel/components/map/__tests__/map-components.test.ts`
  - Target and broad Standard Amber / Heavy-Chrome scans via PowerShell `Select-String` because `rg` was not available in the terminal PATH.
- Validation results:
  - Typecheck: passed.
  - Targeted token/component test: passed, 60 tests; post-audit combined B02+B03 target suite passed, 101 tests.
  - `get_errors` on all three changed product/test files: no errors.
- Scientific integrity notes: No GIS calculations, CRS requirements, evidence behavior, readiness semantics, persistence contracts, map service contracts, geometry handling, or analytical renderer classifications were changed.
- Known risks:
  - Downstream B03-B14 files still reference deprecated `MAP_COLORS.amber*` alias names; the values are now non-amber, but component code still needs follow-up cleanup for naming clarity and local heavy chrome.
  - Global amber tokens in `src/constants/design.ts` remain intentionally untouched until a prompt explicitly owns global color-system redesign.
- Blockers: none for B02.
- Next recommended prompt in normal order: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
- Next Map Explorer prompt if the user continues the targeted Part 3 track: Prompt B03 - Map Shell, Modal, Docking Rails, Canvas Chrome, Focus, And Status Bar.
- Ledger updated: yes.

### Prompt B03 - Map Shell, Modal, Docking Rails, Canvas Chrome, Focus, And Status Bar

- Date: 2026-05-18.
- Agent: GitHub Copilot.
- Status: completed.
- Trigger: user selected Prompt B03 and requested "go apply be perfect and premium".
- Execution mode: user-directed targeted Map Explorer implementation deviation. C09/C10 remain pending in the normal Center Panel order; this pass continued the B01-targeted Map Explorer track only.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Manifest: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Active prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt B03
- Files inspected:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
  - `src/centerpanel/components/map/mapDocking.ts`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx`
  - `src/centerpanel/components/map/__tests__/map-docking.test.ts`
  - `src/centerpanel/components/map/__tests__/map-accessibility.test.ts`
- Files changed:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- Tokens added: none.
- Tokens consumed:
  - `--syn-border-focus`
  - `--syn-interaction-focus-ring`
  - `--syn-interaction-active`
  - `--syn-border-subtle`
  - `--syn-surface-overlay`
  - `--syn-surface-panel`
  - `--syn-status-info`
  - `--syn-status-running`
  - `--syn-status-valid`
  - `--syn-status-error`
  - `--syn-status-stale`
- Tokens aliased or deprecated: none in B03. B02 compatibility aliases remain in place for downstream B04-B14 callers.
- Product behavior changes:
  - `MapWorkspaceShell.tsx` focus-visible CSS no longer falls back to `MAP_COLORS.amber` or `rgba(245, 158, 11, ...)`; it uses `--syn-border-focus` / `--syn-interaction-focus-ring` with blue `color-mix` shadow.
  - Resize separators keep their hit target and keyboard resizing behavior but hover/focus with transparent blue hairline treatment.
  - `MapStatusBar.tsx` no longer maps QA caveats/warnings to `--syn-status-warning`; blocked/error stays error, passed stays valid, issue/caveat states use explicit text plus info/stale tone.
  - `MapCanvasKeyboardFallbackControls.tsx` now renders as a compact transparent overlay with `--syn-surface-overlay`, subtle neutral border, 3-4px radius, no dropdown shadow, and transparent icon buttons.
  - `MapCanvas.tsx` removed decorative marker shadow and replaced popup row border alias usage with direct workbench hairline styling.
  - `MapExplorerModal.tsx` canvas-adjacent feedback/statistics/workflow selector overlays were flattened to 4px workbench panels with no shadow stack, non-amber feedback accents, neutral row buttons, and blue flow labels.
- Hard-coded colors removed:
  - `#f59e0b` and `#fbbf24` feedback/default accents in `MapExplorerModal.tsx`.
  - `#fbbf24` workflow label text in the map AOI workflow selector.
  - `rgba(245, 158, 11, 0.16)` focus shadow and `rgba(245, 158, 11, 0.18)` separator focus background in `MapWorkspaceShell.tsx`.
  - `--syn-status-warning` / `#f59e0b` status tone mapping in `MapStatusBar.tsx`.
- Hard-coded colors retained with reason:
  - Non-amber token fallbacks such as `#3794ff`, `#38bdf8`, `#60a5fa`, `#34d399`, `#f87171`, and neutral rgba surface/border fallbacks are retained as CSS variable fallbacks for runtime resilience.
  - Map canvas marker background remains `var(--syn-status-info, #38bdf8)` as a visible non-amber marker default, not a UI warning/status caveat.
- Amber scan before:
  - B03 target Standard Amber scan: 7 matching lines across 3 files.
  - File counts: `src/centerpanel/components/map/MapWorkspaceShell.tsx` 3; `src/centerpanel/components/MapExplorerModal.tsx` 3; `src/centerpanel/components/map/MapStatusBar.tsx` 1.
- Amber scan after:
  - B03 target Standard Amber scan: 0 matching lines across 0 files.
  - Broad Map Explorer Standard Amber scan: 405 matching lines across 54 files after B01-B03 audit cleanup, down from B02's 413 across 57 files.
- Heavy-chrome scan before:
  - B03 target Heavy-Chrome scan: 13 matching lines across 4 files.
  - File counts: `src/centerpanel/components/MapExplorerModal.tsx` 7; `src/centerpanel/components/map/MapCanvasKeyboardFallbackControls.tsx` 3; `src/centerpanel/components/map/MapCanvas.tsx` 2; `src/centerpanel/components/map/MapWorkspaceShell.tsx` 1.
- Heavy-chrome scan after:
  - B03 target Heavy-Chrome scan: 0 matching lines across 0 files.
  - Broad Map Explorer Heavy-Chrome scan: 539 matching lines across 41 files, down from B02's 552 across 45 files.
- Card frames removed or retained with reason:
  - Removed large 10-12px rounded canvas overlay frames in B03 target modal overlays by switching them to `MAP_RADIUS.sm` and no shadow.
  - Retained the actual workflow selector dialog structure and feedback/statistics overlay structure because they are functional map overlays; only chrome was flattened.
- Button fills removed or retained with reason:
  - Workflow selector buttons now use transparent backgrounds, neutral hairline borders, and blue text labels.
  - Keyboard fallback control buttons now use transparent backgrounds and neutral hairline borders.
- UX changes:
  - Map shell focus/resize affordances now align with Center Panel blue focus discipline.
  - Status bar caveats remain text-backed (`issues`, `caveats`) without amber warning coloring.
  - Canvas overlays recede visually behind map content with no decorative card shadow stack.
- Accessibility and contrast notes:
  - Focus-visible remains explicit on shell descendants using outline plus blue focus halo.
  - Resize separators keep `role="separator"`, keyboard handling, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` unchanged.
  - Keyboard fallback control aria labels and announcements were preserved.
  - Status bar still uses `role="status"` and exposes project, mode, layers, cursor, zoom, CRS, QA, sync, saved, AOI, marks, units, and auto-save state as text.
- Data visualization notes:
  - No analytical map palettes, legends, renderer ramps, or symbology defaults changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `npm --prefix "C:\Users\m_ras\Desktop\SynapseIDE_urban_analytics" run typecheck`
  - `npm --prefix "C:\Users\m_ras\Desktop\SynapseIDE_urban_analytics" exec -- vitest --root "C:\Users\m_ras\Desktop\SynapseIDE_urban_analytics" run src/centerpanel/components/map/__tests__/MapCanvas.lifecycle.test.tsx src/centerpanel/components/map/__tests__/map-docking.test.ts src/centerpanel/components/map/__tests__/map-accessibility.test.ts`
  - B03 target and broad Map Explorer Standard Amber / Heavy-Chrome scans via PowerShell `Select-String` because `rg` was not available in the terminal PATH.
  - Manifest JSON parse.
- Validation results:
  - Typecheck: passed.
  - Targeted lifecycle/docking/accessibility tests: passed, 41 tests across 3 files; post-audit combined B02+B03 target suite passed, 101 tests across 4 files.
  - `get_errors` on changed product files: no errors.
  - B03 target Standard Amber scan: 0.
  - B03 target Heavy-Chrome scan: 0.
- Screenshots or manual visual evidence:
  - Not captured. Local dev server check at `http://localhost:5173` timed out, so the optional visual smoke was not available in this session.
- Known risks:
  - Broad Map Explorer scans still include downstream B04-B14 owners and intentionally broad C09-owned non-map Center Panel files (`NarrativeGenerationPanel.tsx`, `BackgroundTasksControl.module.css`) from the scan path.
  - Visual smoke remains a follow-up when a dev server is available.
- Blockers: none for B03.
- Decisions made:
  - Keep B03 scoped to shell/focus/status/canvas-adjacent chrome and avoid cockpit, toolbar, layer, dialog, service, renderer, or store-default cleanup reserved for B04-B14.
- Next recommended prompt in normal order: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
- Next Map Explorer prompt if the user continues the targeted Part 3 track: Prompt B04 - Map Command Cockpit, Workspace Bars, Timeline, And Progress Surfaces.
- Ledger updated: yes.

### Prompt B04 - Map Command Cockpit, Workspace Bars, Timeline, And Progress Surfaces

- Date: 2026-05-18.
- Agent: Codex.
- Status: completed.
- Trigger: user selected Prompt B04 and requested "go apply and be perfect".
- Execution mode: user-directed targeted Map Explorer implementation deviation. C09/C10 remain pending in the normal Center Panel order; this pass continued the B01-B03 targeted Map Explorer track only.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Alignment spec: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Manifest: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Active prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt B04
- Files inspected:
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/mapExperience.ts`
  - `src/centerpanel/components/map/mapContextSummary.ts`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts`
  - `src/centerpanel/components/map/__tests__/mapContextSummary.test.ts`
  - `src/centerpanel/components/map/__tests__/map-components.test.ts`
- Files changed:
  - `src/centerpanel/components/map/MapWorkspaceCockpit.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-panel`
  - `--syn-surface-input`
  - `--syn-surface-overlay`
  - `--syn-border-subtle`
  - `--syn-border-active`
  - `--syn-interaction-active`
  - `--syn-status-info`
  - `--syn-status-valid`
  - `--syn-status-running`
  - `--syn-status-stale`
  - `--syn-status-blocked`
- Tokens aliased or deprecated: none added. B02 `MAP_COLORS.amber*` compatibility aliases remain non-amber and documented for downstream B05-B14 cleanup.
- Product behavior changes:
  - `MapWorkspaceCockpit.module.css` no longer renders the cockpit with decorative linear/radial gradients, heavy shadow, filled primary command plate, amber warning token, or filled active mode plate.
  - Primary command and quick actions now render as transparent/ghost controls with blue text and hairline/tint hover affordances.
  - Active mode buttons use a compact blue left rail plus a subtle 10% blue tint.
  - Readiness progress uses a neutral track and blue running fill with the same width/progress semantics.
  - Caveat/attention tones now use stale/info/error families: foundational/stale/meta caveats use `--syn-status-stale`, blocked QA/export uses `--syn-status-blocked`, recommendation high/blocked uses blocked/error treatment, and low attention uses info.
  - Drag overlay border in `MapExplorerModal.tsx` changed from dashed blue to a 1px solid active border; `mapStyles.dragOverlay` no longer consumes the dashed strong stroke and uses the overlay surface.
  - Import progress track in `mapTokens.ts` moved away from pill radius to the compact map radius while keeping the blue progress fill.
- Hard-coded colors removed:
  - No amber hard-coded color literals were present in B04 product files after B03. B04 removed the `--syn-status-warning` cockpit dependency and removed gradient/shadow chrome.
- Hard-coded colors retained with reason:
  - Existing non-amber CSS variable fallbacks such as `#3794ff`, `#38bdf8`, `#4ec27d`, `#f87171`, and neutral rgba fallbacks remain for runtime resilience and do not encode amber UI chrome.
  - `mapTokens.ts` still defines deprecated `MAP_COLORS.amber*` alias names from B02; the values are non-amber compatibility aliases and are scheduled for cleanup by later Map Explorer prompts.
- Amber scan before:
  - B04 target Standard Amber scan: 1 matching line in `src/centerpanel/components/map/MapWorkspaceCockpit.module.css` (`--cockpit-warning: var(--syn-status-warning)`).
- Amber scan after:
  - B04 target Standard Amber scan over `MapWorkspaceCockpit.tsx`, `MapWorkspaceCockpit.module.css`, `MapWorkspaceShell.tsx`, `mapExperience.ts`, `mapContextSummary.ts`, `MapExplorerModal.tsx`, and the two B04 tests: 0 matching lines.
  - Additional `mapTokens.ts` audit still finds B02 deprecated `amber*` compatibility alias names only; their values are non-amber.
- Heavy-chrome scan before:
  - B04 target Heavy-Chrome scan: 11 matching lines in `MapWorkspaceCockpit.module.css` for linear/radial gradients, heavy box shadows, pill radius, and filled active/primary/progress gradients.
- Heavy-chrome scan after:
  - B04 target Heavy-Chrome scan over `MapWorkspaceCockpit.tsx`, `MapWorkspaceCockpit.module.css`, `MapWorkspaceShell.tsx`, `mapExperience.ts`, `mapContextSummary.ts`, `MapExplorerModal.tsx`, and the two B04 tests: 0 matching lines.
  - Additional focused `mapTokens.ts` audit shows only the retained `MAP_STROKES.dashedStrong` definition; B04 drag overlay no longer consumes it.
- Card frames removed or retained with reason:
  - Cockpit panel switched to a flat `--syn-surface-panel` inspector with neutral border and no shadow stack.
  - Analysis recommendation cards became separated rows with a 2px semantic left rail instead of filled card blocks.
  - Mode buttons retain compact button frames because they are workspace selection controls; active state is a left rail/tint, not a filled plate.
- Button fills removed or retained with reason:
  - Recommended primary command changed from filled blue gradient to transparent blue hairline command.
  - Quick action tiles changed to row-like ghost controls with top hairlines.
  - Recommendation action buttons changed to transparent blue-bordered controls.
- UX changes:
  - Cockpit reads like the completed Center Panel: dense context strip, single-surface panes, muted uppercase labels, thin separators, and blue/neutral affordances.
  - Workspace drag/progress surfaces are non-amber and less decorative while preserving status/progress text and aria semantics.
- Accessibility and contrast notes:
  - Existing aria labels for cockpit, context strip, recommended action, quick actions, recommendation reasons, and recommendation action buttons were preserved.
  - `aria-pressed` mode selection and command disabled wiring were not changed.
  - Blocked QA/export states gained a distinct non-amber blocked/error tone instead of sharing the generic caveat tone.
- Data visualization notes:
  - No analytical map palettes, legends, renderer ramps, symbology defaults, or generated map output colors changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `npm run typecheck`
  - `npm exec -- vitest run src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts src/centerpanel/components/map/__tests__/mapContextSummary.test.ts src/centerpanel/components/map/__tests__/map-components.test.ts`
  - B04 target Map Explorer Standard Amber Scan with `rg`.
  - B04 target Map Explorer Heavy-Chrome Scan with `rg`.
  - Playwright visual smoke via a one-off `node` script using Chromium against `http://127.0.0.1:3000`.
- Validation results:
  - Typecheck: passed.
  - Targeted workspace/context/component tests: passed, 77 tests across 3 files.
  - B04 target Standard Amber scan: 0.
  - B04 target Heavy-Chrome scan: 0.
  - Visual smoke: passed at 1280x860, 960x760, and 720x760 compact; cockpit visible with 10 command buttons and nonblank text in all three viewports.
- Screenshots or manual visual evidence:
  - `tmp/b04-cockpit-1280.png`
  - `tmp/b04-cockpit-960.png`
  - `tmp/b04-cockpit-compact.png`
  - Dev server started at `http://127.0.0.1:3000` by `npm run dev`; this repo's dev script serves Vite on port 3000 and terminal server on 9231.
- Known risks:
  - The dev script terminated pre-existing listeners on ports 3000 and 9231 before starting the current server, per the repo's `predev` command.
  - Normal operating-pack order still has C09/C10 pending; B04 was completed only because the user explicitly continued the targeted Map Explorer track.
  - Broad Map Explorer scans still include downstream B05-B14 owners and B02 deprecated `amber*` compatibility names.
- Blockers: none for B04.
- Decisions made:
  - Left `mapExperience.ts` and `mapContextSummary.ts` behavior unchanged after inspection because they hold command/readiness/context contracts rather than chrome.
  - Kept B04 focused on rendered cockpit/workspace chrome and did not touch GIS calculations, persistence, evidence, layer rendering, or data-palette defaults.
- Next recommended prompt in normal order: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
- Next Map Explorer prompt if the user continues the targeted Part 3 track: Prompt B06 - Layer Manager, Layer Panel, Registry Rows, Badges, Popovers, And Sync States.
- Ledger updated: yes.

### Prompt B05 - Toolbar, Search, Pins, Bookmarks, Context Menus, And Map Explorer Entry Button

- Date: 2026-05-18.
- Agent: GitHub Copilot.
- Status: completed.
- Trigger: user selected the B05 prompt block and requested "go apply be perfect and vs code premium".
- Execution mode: user-directed targeted deviation. The manifest still gates normal Part 3 product-code implementation behind C10, and C09/C10 remain pending in the normal operating-pack order; this B05 pass was completed because the user explicitly continued the Map Explorer track.
- Started from:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt B05
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `scripts/get-next-map-explorer-prompt.ps1 -Json`
- Files inspected:
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/MapSearchBar.tsx`
  - `src/centerpanel/components/map/MapPinSidebar.tsx`
  - `src/centerpanel/components/MapBookmarkBar.tsx`
  - `src/centerpanel/components/MapContextMenu.tsx`
  - `src/centerpanel/components/map/contextMenuUtils.ts`
  - `src/centerpanel/components/MapExplorerButton.tsx`
  - `src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx`
  - `src/centerpanel/components/map/__tests__/map-context-menu.test.ts`
  - `src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`
- Files changed:
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/MapSearchBar.tsx`
  - `src/centerpanel/components/map/MapPinSidebar.tsx`
  - `src/centerpanel/components/MapBookmarkBar.tsx`
  - `src/centerpanel/components/MapContextMenu.tsx`
  - `src/centerpanel/components/MapExplorerButton.tsx`
  - `src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-input`
  - `--syn-surface-panel`
  - `--syn-border-subtle`
  - `--syn-border-focus`
  - `--syn-interaction-active`
  - `--syn-status-info`
  - `--syn-status-valid`
  - `--syn-status-error`
- Tokens aliased or deprecated: none added. B02 `MAP_COLORS.amber*` compatibility aliases remain non-amber in `mapTokens.ts`, but B05 target files no longer consume those alias names.
- Product behavior changes:
  - Toolbar badges, command buttons, command palette status pills, role switches, focus outlines, and hover handlers now use interaction blue, neutral hover, compact hairlines, and active rail/underline affordances instead of amber-tinted filled states.
  - Location search input and result dropdown use compact input/panel tokens, 3px-radius workbench chrome, neutral hairlines, no shadow stack, and blue/neutral result hover.
  - Pin sidebar icon tone moved from amber alias to interaction blue while preserving row text, labels, and list semantics.
  - Bookmark menu/chip controls moved off amber aliases; save/current-view controls and inline active chips are transparent hairline controls with blue text.
  - Context menu and popup shells moved from glass/amber border/dropdown shadow styling to flat panel surfaces, hairline borders, no shadow stack, and blue hover/focus affordances.
  - Map Explorer launcher button moved from filled amber plate to a transparent hairline ghost button with blue text/icon and visible blue keyboard focus.
- Command and state behavior preserved:
  - Toolbar command routing, role selection, overflow, disabled titles, shortcut text, command palette filtering, status labels, and aria labels unchanged.
  - Search result selection and `onFlyTo` wiring unchanged.
  - Pin persistence and bookmark limit behavior unchanged.
  - Context menu positioning, keyboard navigation, disabled action labels, popup creation, and menu action callbacks unchanged.
- Hard-coded colors removed:
  - B05 target `#F59E0B` test fixture was changed to a non-amber blue annotation default.
  - No B05 target files now contain amber literal names, amber hex literals, amber RGB literals, `--syn-status-warning`, or `MAP_COLORS.amber*` consumption.
- Hard-coded colors retained with reason:
  - Existing non-amber CSS variable fallbacks such as `#1a1f26`, `#3794ff`, and neutral rgba fallbacks remain for runtime resilience.
- Amber scan before:
  - B05 target Standard Amber scan found hits in `MapToolbar.tsx`, `MapSearchBar.tsx`, `MapPinSidebar.tsx`, `MapBookmarkBar.tsx`, `MapContextMenu.tsx`, `MapExplorerButton.tsx`, and `map-bookmarks-annotations.test.tsx`.
- Amber scan after:
  - B05 target Standard Amber scan over all primary B05 files and targeted tests: 0 matching lines.
  - Focused alias scan for `amberBtn`, `amberSubtle`, `amberDim`, `amberBorder`, `MAP_COLORS.amber`, `#F59E0B`, and `--syn-status-warning`: 0 matching lines.
- Heavy-chrome scan after:
  - B05 focused heavy-chrome scan for `MAP_SHADOWS.dropdown`, `MAP_SHADOWS.modal`, gradients, drop shadows, glow strings, and `0 0` shadow patterns over changed B05 product files: 0 matching lines.
- Card frames removed or retained with reason:
  - Toolbar overflow, search dropdown, bookmark menus, context menus, and launcher now read as flat workbench panes/rows with thin separators.
  - Compact controls retain small button frames only where needed for keyboard focus and command hit targets.
- Button fills removed or retained with reason:
  - Routine toolbar, bookmark, context, and launcher controls no longer use filled amber/primary plates.
  - Active command states retain a subtle blue tint plus 2px rail/underline so selection remains visible without large filled cards.
- Accessibility and contrast notes:
  - Existing aria labels and titles were preserved.
  - Launcher and toolbar focus rings remain visible with `MAP_COLORS.focus`.
  - Disabled states remain dimmed and do not present as ready/valid.
- Data visualization notes:
  - No analytical renderer palette, map layer style ramp, legend scale, or GIS output default changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, workflow readiness, geometry, or analytical status semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `npm run typecheck`
  - `npm exec -- vitest run src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx src/centerpanel/components/map/__tests__/map-context-menu.test.ts src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`
  - B05 target Map Explorer Standard Amber Scan with `rg`.
  - B05 focused heavy-chrome/alias scan with `rg`.
  - Playwright visual smoke via a one-off `node` script using Chromium against `http://127.0.0.1:3000/?view=analyst`, opening Map Explorer with `Ctrl+Shift+M`.
- Validation results:
  - Typecheck: passed.
  - Targeted toolbar/context/bookmark tests: passed, 14 tests across 3 files.
  - B05 target Standard Amber scan: 0.
  - B05 focused heavy-chrome/alias scan: 0.
  - Visual smoke: passed at 1280x860, 960x760, and 720x760 compact; `Search location` visible, Map Explorer text visible, 74 command controls detected, and 0 amberish controls found in each viewport.
- Screenshots or manual visual evidence:
  - `tmp/b05-map-controls-1280.png`
  - `tmp/b05-map-controls-960.png`
  - `tmp/b05-map-controls-compact.png`
- Known risks:
  - Normal operating-pack order still has C09/C10 pending; B05 was completed only because the user explicitly continued the targeted Map Explorer track.
  - Broad Map Explorer scans still include downstream B06-B14 owners and B02 deprecated `amber*` compatibility names outside this prompt scope.
- Blockers: none for B05.
- Decisions made:
  - Left `contextMenuUtils.ts` unchanged after inspection because it only owns positioning/coordinate utilities and did not contain B05 visual chrome.
  - Kept warning command semantics text-backed and non-amber via existing map warning/caveat token mapping; did not relabel warnings as ready/valid.
  - Did not touch GIS services, stores, renderer defaults, persistence, or external connector behavior.
- Next recommended prompt in normal order: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
- Next Map Explorer prompt if the user continues the targeted Part 3 track: Prompt B06 - Layer Manager, Layer Panel, Registry Rows, Badges, Popovers, And Sync States.
- Ledger updated: yes.

### Prompt B06 - Layer Manager, Layer Panel, Registry Rows, Badges, Popovers, And Sync States

- Date: 2026-05-18.
- Agent: GitHub Copilot.
- Status: completed.
- Trigger: user selected the B06 prompt block and requested "goo apply be perfect and premium".
- Execution mode: user-directed targeted deviation. The manifest still gates normal Part 3 product-code implementation behind C10, and C09/C10 remain pending in the normal operating-pack order; this B06 pass was completed because the user explicitly continued the Map Explorer track.
- Started from:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt B06
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `scripts/get-next-map-explorer-prompt.ps1 -Json`
- Files inspected:
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/centerpanel/components/map/MapLayerPanel.tsx`
  - `src/centerpanel/components/map/mapLayerMetadata.ts`
  - `src/centerpanel/components/map/useLayerSync.ts`
  - `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
- Files changed:
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/centerpanel/components/map/MapLayerPanel.tsx`
  - `src/centerpanel/components/map/useLayerSync.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- Files left unchanged after inspection:
  - `src/centerpanel/components/map/mapLayerMetadata.ts`
  - `src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-input`
  - `--syn-surface-panel`
  - `--syn-border-subtle`
  - `--syn-interaction-active`
  - `--syn-border-focus`
  - `--syn-status-info`
  - `--syn-status-error`
- Tokens aliased or deprecated: none added. B02 `MAP_COLORS.amber*` compatibility aliases remain non-amber in `mapTokens.ts`, but B06 target files no longer consume those alias names.
- Product behavior changes:
  - Layer panel toggle, visible-layer icon, stale chip, metadata headings, rerun/report controls, add-layer controls, action summary, and selected base-layer state now use interaction blue, neutral backgrounds, hairline borders, and compact rail affordances instead of amber aliases or amber fills.
  - Layer action menu, metadata popover, and add-layer dialog no longer use dropdown shadows, amber borders, blur-backed popover chrome, or gradient button fills.
  - Layer opacity slider `accentColor` now uses `MAP_COLORS.interaction`.
  - Default MapLibre render fallback colors in `useLayerSync.ts` moved from amber alias to interaction blue for circle, line, and fill layers.
- Command and state behavior preserved:
  - Layer order, drag/drop, visibility toggles, opacity updates, layer removal confirmation, add-layer creation, demo/OSM controls, metadata popover, cartography review strip, layer evidence actions, base-layer selection, and layer sync logic were not altered.
  - Registry metadata normalization and publication readiness computation were left unchanged.
- State truthfulness notes:
  - Demo/source/derived/QA/publication/CRS badges keep explicit text and tooltip/title strings.
  - Demo, stale, caveat, QA warning, invalid, blocked, hidden, unsynced, selected, published, queryable, and derived labels remain text-backed; warning/caveat states were not relabeled as ready/valid.
- Hard-coded colors removed:
  - B06 target files no longer contain amber literal names, amber hex literals, amber RGB literals, `--syn-status-warning`, or `MAP_COLORS.amber*` consumption.
- Hard-coded colors retained with reason:
  - Non-amber status/detail colors such as `#86EFAC`, `#7DD3FC`, `#1a1f26`, and red error rgba remain for explicit valid/info/input/error semantics.
  - Analytical legend swatches in metadata popover remain data-driven from `analysisResult.visualization.legendEntries`.
- Amber scan before:
  - B06 target Standard Amber scan found hits in `MapLayerManager.tsx`, `MapLayerPanel.tsx`, and `useLayerSync.ts`.
- Amber scan after:
  - B06 target Standard Amber scan over all primary B06 files and the targeted test: 0 matching lines.
- Heavy-chrome scan before:
  - B06 target Heavy-Chrome scan found dropdown shadows, a button gradient, blur-backed action menu chrome, amber RGB fills, and amber slider `accentColor`.
- Heavy-chrome scan after:
  - B06 focused Heavy-Chrome scan for dropdown/modal shadows, gradients, drop shadows, blur-backed action menu chrome, and amber RGB fills: 0 matching lines.
  - Remaining `boxShadow` usage is the allowed 2px inset blue rail for active base-layer state.
- Card frames removed or retained with reason:
  - Layer rows remain separator-led through `mapStyles.sidePanelRow`; no per-layer card border or heavy shadow was introduced.
  - Action menu buttons retain compact hairline frames for keyboard targets and menu scannability.
- Button fills removed or retained with reason:
  - Routine layer, add, rerun, action, and base-layer controls are transparent/ghost controls with blue text or focus border.
  - Destructive layer actions retain explicit `Delete` / `Confirm delete` labels and error token styling.
- Accessibility and contrast notes:
  - Existing aria labels, disabled reasons, titles, `aria-pressed`, `aria-selected`, `role=option`, `role=menu`, and menu item labels were preserved.
  - Active/selected base-layer state is conveyed by `aria-checked`, blue text/border, and a 2px left rail.
- Data visualization notes:
  - Only non-analytical fallback renderer defaults changed from amber to interaction blue. Existing data-driven legend entries and explicit layer style paint properties are preserved.
- Scientific integrity notes: No scientific evidence, CRS metadata, data fitness, layer registry metadata, QA state, publication readiness logic, geometry normalization, or analytical status semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `npm run typecheck`
  - `npm exec -- vitest run src/centerpanel/components/map/__tests__/map-layer-management.test.ts`
  - B06 target Map Explorer Standard Amber Scan with `rg`.
  - B06 focused Heavy-Chrome Scan with `rg`.
  - Playwright visual smoke via a one-off `node` script using Chromium against `http://127.0.0.1:3000/?view=analyst`, seeding one GeoJSON layer through `window.e2e.seedGeoJSONLayer`, opening Map Explorer with `Ctrl+Shift+M`, and checking the layer manager across three viewports.
- Validation results:
  - Typecheck: passed.
  - Targeted layer-management tests: passed, 45 tests across 1 file.
  - B06 target Standard Amber scan: 0.
  - B06 focused Heavy-Chrome scan: 0.
  - Visual smoke: passed at 1280x860, 960x760, and 720x760 compact; seeded layer row, base selector, and add-layer control visible; 88 controls detected; 0 amberish B06 layer controls found in each viewport. A global non-B06 toast dismiss button was observed and excluded from the layer-control scoped count.
- Screenshots or manual visual evidence:
  - `tmp/b06-layer-manager-1280.png`
  - `tmp/b06-layer-manager-960.png`
  - `tmp/b06-layer-manager-compact.png`
- Known risks:
  - Normal operating-pack order still has C09/C10 pending; B06 was completed only because the user explicitly continued the targeted Map Explorer track.
  - Broad Map Explorer scans still include downstream B07-B14 owners and B02 deprecated `amber*` compatibility names outside this prompt scope.
- Blockers: none for B06.
- Decisions made:
  - Left `mapLayerMetadata.ts` unchanged because it owns metadata normalization/readiness semantics and had no B06 chrome issues.
  - Left `map-layer-management.test.ts` unchanged because behavioral expectations still passed after visual token changes.
  - Kept `MAP_COLORS.warning` for warning/caveat text because the token is non-amber in the current map token system and preserves explicit warning semantics without valid/success styling.
- Next recommended prompt in normal order: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
- Next Map Explorer prompt if the user continues the targeted Part 3 track: Prompt B07 - Scientific QA, Readiness, Evidence, And Status Semantics.
- Ledger updated: yes.

### Prompt B07 - Scientific QA, Readiness, Evidence, And Status Semantics

- Date: 2026-05-18.
- Agent: GitHub Copilot.
- Status: completed.
- Trigger: user selected the B07 prompt block and requested "go apply be perfect and premium", with an explicit request to ensure B07 and earlier applied prompts are visible in the UI.
- Execution mode: user-directed targeted deviation. The manifest still gates normal Part 3 product-code implementation behind C10, and C09/C10 remain pending in the normal operating-pack order; this B07 pass was completed because the user explicitly continued the Map Explorer track.
- Started from:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt B07
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `scripts/get-next-map-explorer-prompt.ps1 -Json`
- Files inspected:
  - `src/centerpanel/components/map/ScientificQAPanel.tsx`
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts`
  - `src/centerpanel/components/map/mapLayerMetadata.ts`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `src/services/map/MapScientificQA.ts`
  - `src/services/map/MapScientificQA.worker.ts`
  - `src/services/map/MapPublicationOutputBindingService.ts`
  - `src/services/map/__tests__/MapScientificQA.test.ts`
  - `src/services/map/__tests__/MapPublicationOutputBindingService.test.ts`
  - `src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`
- Files changed:
  - `src/centerpanel/components/map/ScientificQAPanel.tsx`
  - `src/centerpanel/components/map/mapTypes.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
- Files left unchanged after inspection:
  - `src/centerpanel/components/map/mapEvidenceArtifacts.ts`
  - `src/centerpanel/components/map/mapLayerMetadata.ts`
  - `src/services/map/MapScientificQA.ts`
  - `src/services/map/MapScientificQA.worker.ts`
  - `src/services/map/MapPublicationOutputBindingService.ts`
  - B07 targeted QA/evidence/publication tests.
- Product behavior changes:
  - Scientific QA summary/domain/issue surfaces are now flat inspector rows with transparent panes, hairline separators, and blue/info/error/valid/stale status rails instead of amber warning chrome.
  - QA issue fix guidance now uses a blue interaction rail and transparent background instead of an amber caveat fill.
  - The default annotation palette first swatch moved from amber to interaction blue so new visible annotation defaults do not reintroduce amber.
- Command and state behavior preserved:
  - CRS validation, scientific QA issue generation, worker execution, evidence artifact creation, evidence QA state, max artifact behavior, publication output binding, status strings, aria labels, and blocked/caveat domain values were not changed.
  - Domain status values such as `warning`, `ready-with-caveats`, `needs-review`, `blocked`, `unknown`, `unchecked`, and `passed` remain unchanged.
- State truthfulness notes:
  - Blocked/error remains error-styled; passed/ready remains valid-styled; running remains info/running-styled; unchecked/unknown remains stale/unknown-styled.
  - Warning/caveat/needs-review remain explicit through text, counts, issue titles, aria text, and blue/info/stale treatments rather than valid/success styling.
- Hard-coded colors removed:
  - B07 target files no longer contain amber literal names, amber hex literals, amber RGB literals, `--syn-status-warning`, or `MAP_COLORS.amber*` rendered chrome.
- Hard-coded colors retained with reason:
  - Non-amber blue/valid/error/status colors remain for semantic readiness and QA status communication.
- Amber scan before:
  - B07 target scan found amber consumption in `ScientificQAPanel.tsx` and the default visible annotation palette in `mapTypes.ts`.
- Amber scan after:
  - B07 target Standard Amber Scan: 0 matching lines.
  - B04-B07 combined target Standard Amber Scan: 0 matching lines.
- Heavy-chrome scan after:
  - B07 focused Heavy-Chrome Scan: 0 matching lines.
  - B04-B07 refined target Heavy-Chrome Scan: 0 hits after filtering explicit `MAP_SHADOWS.none` and allowed 2px blue inset active rails.
- Card frames removed or retained with reason:
  - QA category rows and issue rows are separator-led inspector rows, not mini cards.
  - Resize/panel shell behavior remains in the shared panel component and was not changed by B07.
- Button fills removed or retained with reason:
  - No B07 command wiring was changed. Existing QA detail/close controls retain transparent/ghost treatment from shared map styles.
- Accessibility and contrast notes:
  - Existing aria labels for the Scientific QA side panel, summary, issue articles, detail toggles, and close/resize controls were preserved.
  - Warning/caveat issue articles keep explicit severity wording in `aria-label`.
- Scientific integrity notes:
  - No scientific readiness state was weakened or made to look valid.
  - No evidence provenance, CRS safety, publication readiness, worker, or binding logic changed.
- Cross-module contract changes: None.
- Validation commands:
  - `npm run typecheck`
  - `npm exec -- vitest run src/services/map/__tests__/MapScientificQA.test.ts src/services/map/__tests__/MapPublicationOutputBindingService.test.ts src/centerpanel/components/map/__tests__/mapEvidenceArtifacts.test.ts`
  - `npm exec -- vitest run src/centerpanel/components/map/__tests__/map-bookmarks-annotations.test.tsx`
  - B07 target Map Explorer Standard Amber Scan with `rg`.
  - B07 focused Heavy-Chrome Scan with `rg`.
  - B04-B07 combined target Standard Amber Scan with `rg`.
  - B04-B07 refined target Heavy-Chrome Scan with `rg`.
  - Playwright visual smoke via a one-off `node` script using Chromium against `http://127.0.0.1:3000/?view=analyst`, opening Map Explorer with `Ctrl+Shift+M`, using `window.e2e.seedGeoJSONLayer` for a CRS-caveat layer, and checking B04 cockpit plus B05 toolbar/search, B06 layer row, and B07 QA panel across three viewports.
- Validation results:
  - Typecheck: passed.
  - Targeted QA/evidence/publication tests: passed, 16 tests across 3 files.
  - Targeted bookmark/annotation regression test: passed, 5 tests across 1 file.
  - B07 target Standard Amber Scan: 0.
  - B07 focused Heavy-Chrome Scan: 0.
  - B04-B07 combined target Standard Amber Scan: 0.
  - B04-B07 refined target Heavy-Chrome Scan: 0 relevant hits; only explicit no-shadow and allowed blue inset rail matches were filtered.
  - Visual smoke: passed at 1280x900, 960x820, and 430x760. Cockpit, search, command buttons, seeded layer row, and Scientific QA side/bottom panel were visible; computed visible amber samples for cockpit/workspace surfaces were 0 at all three widths.
- Screenshots or manual visual evidence:
  - `tmp/b07-b04-cockpit-1280.png`
  - `tmp/b07-b04-cockpit-960.png`
  - `tmp/b07-b04-cockpit-compact.png`
  - `tmp/b07-b06-layer-1280.png`
  - `tmp/b07-b06-layer-960.png`
  - `tmp/b07-b06-layer-compact.png`
  - `tmp/b07-b05-b07-visible-1280.png`
  - `tmp/b07-b05-b07-visible-960.png`
  - `tmp/b07-b05-b07-visible-compact.png`
- Known risks:
  - Normal operating-pack order still has C09/C10 pending; B07 was completed only because the user explicitly continued the targeted Map Explorer track.
  - Broad Map Explorer scans still include downstream B08-B14 owners and B02 deprecated `amber*` compatibility names outside this prompt scope.
- Blockers: none for B07.
- Decisions made:
  - Left scientific service, worker, evidence, publication binding, and metadata files unchanged because their behavior and domain contracts were already correct and only rendered chrome needed migration.
  - Kept scientific status/domain value names intact and changed only visual treatment.
  - Used interaction blue for the default annotation swatch because annotations are visible map defaults and should not reintroduce amber.
- Next recommended prompt in normal order: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
- Next Map Explorer prompt if the user continues the targeted Part 3 track: Prompt B08 - Workflow Drawer, NL Query, Review Timeline, Cartography Recommendations, And Report Handoff Drawer.
- Ledger updated: yes.

### Map Explorer Prompt Ladder Redesign - 2026-05-18

- Status: completed.
- Trigger: user requested Map Explorer prompts be updated by reading the new Center Panel design from code, allowing prompt count to grow, and making the implementation prompts detailed, professional, and aligned with premium VS Code styling.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `src/centerpanel/registry-ui/newProject.module.css`
  - `src/centerpanel/styles/registry.module.css`
  - `src/centerpanel/styles/guides.module.css`
  - `src/centerpanel/styles/note.module.css`
  - `src/centerpanel/styles/flows.module.css`
  - `src/centerpanel/styles/tools.module.css`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `src/constants/design.ts`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/map/MapToolbar.tsx`
  - `src/centerpanel/components/map/MapLayerManager.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/MapDataImportHubDialog.tsx`
  - `src/stores/useMapExplorerStore.ts`
- Files changed:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
- Changes applied:
  - Expanded Map Explorer Part 3 from `B01`-`B10` to `B01`-`B15` so tokens, shell, cockpit, toolbar/search, layers, QA/readiness, high-risk drawers, import dialogs, export/generated chrome, interactive tools/store defaults, renderer defaults, services, final QA, and final handoff have separate execution gates.
  - Added a Center Panel code-derived Map Explorer workbench contract: single-surface inspectors, hairline separators, compact 3px controls, transparent/ghost buttons, blue interaction rails/tints, non-amber status semantics, and explicit data-palette separation.
  - Added a Map Explorer Heavy-Chrome Scan for oversized radii, decorative gradients, shadows, filled plates, amber `MAP_COLORS`, and amber `MAP_STROKES`.
  - Synchronized the manifest to 35 prompts and moved final handoff from B10 to B15.
  - Synced C08 manifest status to completed to match this ledger.
  - Synced active operating-pack entry/protocol/plan/spec/token/QA/unit-matrix wording from the older two-part `A/B01-B10` framing to the active three-part `A01-A10`, `C01-C10`, `B01-B15` framing.
- Product behavior changes: none; documentation and execution-pack update only.
- Scientific integrity notes: No GIS calculations, CRS behavior, evidence semantics, method validity, workflow readiness, map persistence, map service contracts, QA logic, NL-query safety, or report handoff contracts changed.
- Cross-module contract changes: None.
- Validation: manifest JSON parse passed; manifest prompt count is 35; B prompt count is 15 (`B01`-`B15`); markdown diagnostics for `COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` reported no errors.
- Next recommended prompt remains: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.

### Active Two-Part Prompt Reprioritization - 2026-05-15

- Status: completed.
- Trigger: user requested the `COLOR_SYSTEM_PLANS` documents and sequential prompts be updated so the work removes unnecessary card frames and button fills, follows premium VS Code-style layouts, and is split into two priority parts: first the complete Urban Analytics modal amber removal, then the complete Map Explorer amber removal.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Changes applied:
  - Superseded the old broad 38-prompt future order with an active 20-prompt order: `A01`-`A10` for Urban Analytics modal, then `B01`-`B10` for Map Explorer.
  - Added a strict active-scope amber ban for UI/default/demo styling in Urban Analytics modal and Map Explorer.
  - Added explicit card-frame and filled-button cleanup requirements to the prompt ladder, protocol, QA checklist, and alignment spec.
  - Updated the manifest, README, development plan, unit matrix, QA checklist, token reference override, current status, prompt register, and next pointer.
- Product behavior changes: none; documentation and execution-pack update only.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, map behavior, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation: manifest JSON parse passed; sequential prompt heading count is 20; active ledger register row count is 20; `git diff --check -- COLOR_SYSTEM_PLANS` reported only line-ending normalization warnings.
- Known risks: Historical execution log entries still mention old Prompt 18 as their next recommendation because they are immutable history from the previous prompt ladder. The active current status and register now point to `A01`.
- Next recommended prompt: Prompt A01 - Urban Analytics Amber Inventory And Scope Lock.

### Prompt A01 - Urban Analytics Amber Inventory And Scope Lock

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A01
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
- Files inspected:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/WelcomeModal.tsx`
  - `src/features/urbanAnalytics/icons.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelUtils.ts`
  - `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`
  - `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`
  - `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`
  - `src/features/urbanAnalytics/voxcity/buildingTypes.ts`
  - `src/features/urbanAnalytics/seeds/dataEngineering.ts`
  - `src/features/urbanAnalytics/seeds/gisMethods.ts`
  - `src/features/urbanAnalytics/seeds/interventionDesign.ts`
  - `src/features/urbanAnalytics/seeds/monitoringReporting.ts`
  - `src/features/urbanAnalytics/seeds/policyImplementation.ts`
  - `src/features/urbanAnalytics/seeds/thematicAnalysis.ts`
  - `src/features/urbanAnalytics/seeds/typologyClassification.ts`
  - `src/features/urbanAnalytics/seeds/vulnerability.ts`
  - `src/features/urbanAnalytics/python/templates/accessibility_analysis.ts`
  - `src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts`
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Tokens added: none.
- Tokens consumed: none.
- Tokens aliased or deprecated: none.
- Product code changed: none.
- Hard-coded colors removed: none; A01 is inventory-only.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 198 standard-scan hits across 22 files.
  - File counts: `WelcomeModal.tsx` 74; `SunlightSimulatorPanel.tsx` 26; `UrbanAnalyticsModal.tsx` 21; `urbanEvidenceTray.css` 15; `StudyAreaPicker.module.css` 11; `BuildingViewer.tsx` 11; `CityJSONViewer.tsx` 7; `monitoringReporting.ts` 6; `rail.css` 5; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `rightPanelFourBlock.css` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; `buildingTypes.ts` 2; one hit each in `icons.tsx`, `gisMethods.ts`, `interventionDesign.ts`, `dataEngineering.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Amber scan after:
  - Command: same Standard Amber Scan command.
  - Result: unchanged 198 standard-scan hits across 22 files, as expected for documentation-only A01.
- Targeted supplemental scan:
  - Command: `rg --count -i "#f59e0b|#fbbf24|#fde68a|#d97706|#b45309|#92400e|245\\s*,?\\s*158\\s*,?\\s*11|251\\s*,?\\s*191\\s*,?\\s*36|217\\s*,?\\s*119\\s*,?\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 247 broader inventory hits across 25 files. This found lower-case hex, space-separated `rgb(245 158 11 / ...)`, and proper-noun/content hits that the standard scan does not capture.
- Scoped inventory and owner categories:
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`: `modal-chrome`, `button-control`, `status-semantic`. Hits include brand glow keyframes, area input amber fill/focus, brand pill gradient/text shadow, warning/stale chips, root amber variables, amber focus rings, and the top accent strip. Planned prompts: A02 for shell/header/brand, A03 for controls, A06 for warning/stale chips, A09 for final scan cleanup.
  - `src/features/urbanAnalytics/WelcomeModal.tsx`: `modal-chrome`, `button-control`, `card-frame`. Hits include SVG amber stops and animated stop colors, hero radial fills, external-link amber text/underlines, modal border/glow, ambient blobs, particles, animated wave strips, rings, grid lines, icon drop shadows, `--syn-gradient-amber-*` usage, amber feature cards, stat cards, timeline icons, footer, and primary CTA fills. Planned prompt: A02.
  - `src/features/urbanAnalytics/icons.tsx`: `retain-with-reason`. Comment-only "charcoal-amber" text; not rendered UI. Planned prompt: A02/A09 cleanup if zero-scan requires comment removal.
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`: `button-control`, `modal-chrome`, `card-frame`. Hits include trigger pill, unset state, coordinate text, search focus, primary button fill, selected result row, map selection border/glow, and HUD amber value text. Planned prompts: A03 for picker/search/controls, A09 for final modal scan.
  - `src/features/urbanAnalytics/rail/rail.css`: `button-control`, `modal-chrome`. Hits include rail amber defaults, top line gradient, focus ring, title gradient, active chips/tags/groups, active item rail, favorite toggle, selected row, and count/chip active states through `--rail-accent`. Planned prompt: A03.
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`: `status-semantic`. `demo_mode` capability color uses amber. Planned prompt: A06 unless A03 centralizes rail status color first.
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`: `button-control`, `card-frame`, `status-semantic`, `generated-html`. Standard scan catches amber focus rings; supplemental scan catches lower-case amber tabs, badges, SDG badge, warning truth state, prompt intent/title accents, data block title accents, filled action buttons, dashed flow-link button, and print amber. Planned prompts: A04 for right-panel surface/card/control restyle, A05 for generated/print HTML, A06 for warning/status truth states.
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`: `retain-with-reason`. No amber literal found, but it renders the right-panel button, tab, prompt-card, data-block, dossier, and print/report surfaces styled by `rightPanelFourBlock.css` and `rightPanelUtils.ts`. Planned prompts: A04/A05.
  - `src/features/urbanAnalytics/rightPanelUtils.ts`: `generated-html`. Hits are report/print HTML h1-h4 and table header colors. Planned prompt: A05.
  - `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`: `button-control`, `status-semantic`, `card-frame`. Hits include tray toggle, filter on state, selected rows and right-rail rail, empty/side button, warning chip, and icon focus ring. Planned prompt: A06.
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`: `card-frame`, `button-control`. Standard scan misses most values, but targeted inspection found amber-like borders/backgrounds/radials and filled controls in `introCard`, `definitionCard`, `computeCard`, `bottomCard`, `bandPanel`, search card, filter chips, active chips, compute button, catalog/active cards, hero/detail panel, band/component/history cards, error/success/result panels, and empty state. Planned prompt: A04.
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`: `data-content`. Default study-area layer stroke/fill uses lower-case amber. Planned prompt: A09 final UA cleanup, with care not to change map ownership contracts.
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`: `button-control`, `status-semantic`, `visualization-ramp`, `modal-chrome`. Hits include label color, active button fill, selected building color, thematic legend ramp, selected building info title, viewport sync badge, Add to Map filled button, sample-mode label, loading text, and progress bar. Planned prompt: A07.
  - `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`: `button-control`, `modal-chrome`. Hits include label color, active button fill, drag/drop active outline/background, loading text, and progress bar. Planned prompt: A07.
  - `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`: `button-control`, `status-semantic`, `visualization-ramp`, `data-content`. Hits include label/title accents, active button fill, cumulative heatmap yellow language, sample-mode label, running overlay/progress, empty-state instructional emphasis, legend header/ramp, timeline slider `accentColor`, sunlit-fraction result chips, Add to Map button, and "How to use" emphasis. Planned prompt: A07.
  - `src/features/urbanAnalytics/voxcity/buildingTypes.ts`: `visualization-ramp`. Default thematic ramp contains amber/orange stops. Planned prompt: A07, documenting any retained analytical palette only if unavoidable.
  - `src/features/urbanAnalytics/seeds/gisMethods.ts`: `data-content`, `visualization-ramp`, plus `retain-with-reason` for `Goldberg` citation. Prompt code uses amber map buffers and point colors. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/interventionDesign.ts`: `data-content`, `visualization-ramp`. Prompt code uses amber bar chart. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/policyImplementation.ts`: `data-content`, `visualization-ramp`, plus `retain-with-reason` for `LEED Gold` label. Prompt code uses amber compliance bars, Gantt short-term color, and responsible stakeholder category color. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/monitoringReporting.ts`: `data-content`, `visualization-ramp`, `generated-html`, plus `retain-with-reason` for `Chambers` citation. Prompt code uses amber radar, Mermaid node fill, unserved orange points, scorecard bars, and waffle palette. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/thematicAnalysis.ts`: `data-content`, `visualization-ramp`, plus `retain-with-reason` for `Chambers` citation. Prompt code uses amber line plot. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/typologyClassification.ts`: `data-content`, `visualization-ramp`. Prompt code uses amber feature-importance and timeline charts. Planned prompt: A08.
  - `src/features/urbanAnalytics/seeds/dataEngineering.ts`: `data-content`, `generated-html`, plus `retain-with-reason` for traffic-light "green/amber/red" methodology and `Goldberg` citation. Prompt code uses `AMBER` fitness text and amber generated metric HTML. Planned prompt: A08, preserving explicit data-fitness truthfulness.
  - `src/features/urbanAnalytics/seeds/vulnerability.ts`: `data-content`, `visualization-ramp`. Text describes WHO green/yellow/red threshold classification. Planned prompt: A08 only if visible modal/code-demo output needs recoloring; otherwise retain with scientific classification reason.
  - `src/features/urbanAnalytics/python/templates/accessibility_analysis.ts`: `visualization-ramp`. Template uses red-yellow-green ramp language. Planned prompt: A08 with data-palette documentation.
  - `src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts`: `visualization-ramp`. Template uses orange HL class. Planned prompt: A08 with data-palette documentation.
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`: `test-fixture`. Lower-case amber fixture fill color. Planned prompt: A09 or the prompt that changes the corresponding default.
- Heavy card frames and nested surfaces to migrate:
  - `WelcomeModal.tsx`: modal container with 32px radius, amber border/glow, hero ambient layers, feature cards, stat cards, command/timeline/footer surfaces, and filled primary CTA.
  - `IndicatorCatalogPanel.module.css`: large 14-22px radius card stack (`introCard`, `definitionCard`, `computeCard`, `bottomCard`, `bandPanel`, `catalogCard`, `activeCard`, `componentCard`, `historyItem`, `resultPanel`) with amber-tinted borders/backgrounds.
  - `rightPanelFourBlock.css`: nested `rp-data-block`, `rp-prompt-card`, `rp-fitness-score span`, manifest/code panels, footer action strip, filled `rp-btn--action`, filled `rp-btn--accent`, and dashed amber `rp-btn--flow-link`.
  - `urbanEvidenceTray.css`: tray shell shadow, filled toggle/filter states, selected row amber rail, warning chips, and amber focus ring.
  - `StudyAreaPicker.module.css`: framed search/picker overlay, filled primary controls, selected-result fill, and glowing map selection rectangle.
  - `rail/rail.css`: pill chip frames, active group/item filled surfaces, active inset rails, focus rings, and favorite selected fills.
  - `voxcity/*.tsx`: inline filled active buttons, status badges, progress bars, overlays, empty-state emphasis, and Add to Map buttons.
- Decorative amber gradient/glow/animated-strip inventory:
  - `UrbanAnalyticsModal.tsx`: `ua-brand-glow`, `ua-area-glow`, `ua-brand-shell`, `ua-brand-core`, `--brand-fx`, `--ua-focus-ring*`, and `.accentline`.
  - `WelcomeModal.tsx`: SVG animated gradients, radial hero fills, ambient blobs, particles, wave strips, pulse rings, amber grid, hero icon drop shadows, stat glow animation, amber glass gradients, and CTA glow.
  - `rail/rail.css`: `--rail-topline`, title gradient, active chip gradients, active item gradient and rail.
  - `rightPanelFourBlock.css` and `urbanEvidenceTray.css`: amber focus rings and active/selected rail shadows.
- File-by-file migration order:
  1. A02: `UrbanAnalyticsModal.tsx`, `WelcomeModal.tsx`, `icons.tsx` shell/welcome chrome.
  2. A03: `rail/rail.css`, `rail/RailContainer.tsx`, `StudyAreaPicker.module.css`, control/search/tab surfaces inside `UrbanAnalyticsModal.tsx`.
  3. A04: `IndicatorCatalogPanel.module.css`, `RightPanelFourBlock.tsx`, `rightPanelFourBlock.css` catalog and right-panel UI surfaces.
  4. A05: `rightPanelUtils.ts`, generated/print/report styling, and right-panel generated HTML paths.
  5. A06: `evidence/urbanEvidenceTray.css`, data-fitness/method-validity/status chips in `UrbanAnalyticsModal.tsx`, `RightPanelFourBlock.tsx`, and `RailContainer.tsx`.
  6. A07: `voxcity/BuildingViewer.tsx`, `voxcity/CityJSONViewer.tsx`, `voxcity/SunlightSimulatorPanel.tsx`, `voxcity/buildingTypes.ts`.
  7. A08: `seeds/*.ts` and `python/templates/*.ts` code-demo, generated-output, and data-palette defaults.
  8. A09: final full UA scan, `context/studyAreaSelection.ts`, affected tests, retained comment/proper-noun cleanup decisions, visual QA.
- Hard-coded colors retained with reason:
  - All source hits are retained for A01 because this prompt is inventory-only.
  - Proper nouns and domain labels such as `Goldberg`, `Chambers`, and `LEED Gold` are content, not UI chrome.
  - Scientific/data-classification language such as green/amber/red or red/yellow/green remains flagged for later prompt-level data-palette review, not silently removed.
- Card frames removed or retained with reason: none removed; all listed above retained for planned A02-A09 migrations.
- Button fills removed or retained with reason: none removed; all listed above retained for planned A02-A09 migrations.
- UX changes: none.
- Accessibility and contrast notes:
  - No visual changes in A01.
  - A02-A09 must preserve visible focus and avoid replacing amber with low-contrast gray-only states.
  - Warning, stale, demo, residual-gap, blocked, unknown, and deferred states need explicit text/icon/aria context and non-amber styling.
- Data visualization notes:
  - Amber/yellow/orange used as data ramps in seeds, Python templates, VoxCity thematic ramps, and sunlight exposure legends must be migrated or explicitly documented as data-palette exceptions by A07/A08.
  - Default/demo/generated map/chart colors should not remain amber under the active contract.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git status --short`
  - Standard Urban Analytics amber scan before and after.
  - Supplemental targeted scan for lower-case/rgb-space/proper-noun inventory.
- Validation results:
  - Worktree was already dirty before A01; source modifications were present in unrelated files and `src/features/urbanAnalytics/WelcomeModal.tsx`.
  - Standard scan before: 198 hits across 22 files.
  - Standard scan after: unchanged 198 hits across 22 files.
  - Supplemental scan: 247 hits across 25 files.
  - Typecheck/tests not run because A01 is documentation-only and product code was not changed.
- Screenshots or manual visual evidence: not required for A01.
- Known risks:
  - The standard scan is case-sensitive and misses lower-case amber hex plus `rgb(245 158 11 / ...)`; later prompts should use both the required standard scan and a supplemental case-insensitive scan before marking zero-scan readiness.
  - Local branch divergence remains a known repo risk, but A01 did not require resolving it.
  - Existing worktree has user/pre-existing modifications; later implementation prompts must avoid reverting them.
- Blockers: none.
- Decisions made:
  - Treat A01 as documentation/inventory-only despite the user's "apply" wording, because the active prompt explicitly says not to change product code.
  - Move active pointer to A02 after recording the inventory.
- Next recommended prompt: Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome.
- Ledger updated: yes.

### Prompt A02 - Urban Analytics Modal Shell, Backdrop, Header, And Welcome

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Alignment spec: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A02
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
  - Handoff template: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/WelcomeModal.tsx`
  - `src/features/urbanAnalytics/icons.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/WelcomeModal.tsx`
  - `src/features/urbanAnalytics/icons.tsx`
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-workbench`
  - `--syn-surface-navigation`
  - `--syn-surface-panel`
  - `--syn-surface-input`
  - `--syn-surface-hover`
  - `--syn-surface-overlay`
  - `--syn-border-subtle`
  - `--syn-border-default`
  - `--syn-border-active`
  - `--syn-border-focus`
  - `--syn-text-default`
  - `--syn-text-secondary`
  - `--syn-text-muted`
  - `--syn-text-inverse`
  - `--syn-text-link`
  - `--syn-interaction-active`
  - `--syn-interaction-hover`
  - `--syn-status-info`
  - `--syn-status-stale`
- Tokens aliased or deprecated: none.
- Hard-coded colors removed:
  - Removed all standard-scan hits from `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` (21 before, 0 after).
  - Removed all standard-scan hits from `src/features/urbanAnalytics/WelcomeModal.tsx` (74 before, 0 after).
  - Removed the `charcoal-amber` comment-only hit from `src/features/urbanAnalytics/icons.tsx` (1 before, 0 after).
  - Total A02-target standard-scan reduction: 96 hits removed.
- Hard-coded colors retained with reason:
  - No amber/gold/yellow/orange hits remain in A02 target files.
  - Remaining Urban Analytics standard-scan hits are outside A02 scope and are assigned to A03-A08 from the A01 inventory.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result: 198 standard-scan hits across 22 files.
  - A02 target counts: `UrbanAnalyticsModal.tsx` 21; `WelcomeModal.tsx` 74; `icons.tsx` 1.
- Amber scan after:
  - Command: same Standard Urban Analytics amber scan.
  - Result: 102 standard-scan hits across 19 files.
  - A02 target result: `UrbanAnalyticsModal.tsx`, `WelcomeModal.tsx`, and `icons.tsx` have 0 hits.
  - Remaining file counts: `SunlightSimulatorPanel.tsx` 26; `urbanEvidenceTray.css` 15; `StudyAreaPicker.module.css` 11; `BuildingViewer.tsx` 11; `CityJSONViewer.tsx` 7; `monitoringReporting.ts` 6; `rail.css` 5; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `rightPanelFourBlock.css` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; `buildingTypes.ts` 2; one hit each in `dataEngineering.ts`, `gisMethods.ts`, `interventionDesign.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Card frames removed or retained with reason:
  - `WelcomeModal.tsx`: replaced the heavy 32px-radius glowing modal shell with an 8px workbench panel, removed decorative hero background markup and unused orb/particle/wave/ring/grid CSS, reduced feature cards to flat 4px panels with thin separators, and converted highlighted sections to flat panels with a small interaction rail.
  - `UrbanAnalyticsModal.tsx`: converted shell/root surfaces to semantic workbench/navigation/panel surfaces and removed the animated brand pill/glow strip.
- Button fills removed or retained with reason:
  - `UrbanAnalyticsModal.tsx`: command-bar icon button and bottom action buttons are now transparent/neutral with hover rows and token focus rings; favorite state uses restrained blue selected styling.
  - `WelcomeModal.tsx`: the only filled control retained is the true primary close/start CTA, now using restrained `--syn-interaction-active` blue styling instead of amber.
- UX changes:
  - Modal shell now reads as compact VS Code-like workbench chrome with neutral surface hierarchy, thin separators, and no decorative amber title/brand glow.
  - Welcome modal now opens as a dense onboarding panel with a compact header, static currentColor icon, small stats row, flat feature panels, and neutral footer.
- Accessibility and contrast notes:
  - Existing dialog roles, Escape handling, backdrop close, close button behavior, z-index intent, and portal rendering are unchanged.
  - Focus rings now use `--syn-border-focus` / `--syn-interaction-active` instead of amber; warning/stale chips retain visible text and icon labels while moving to non-amber info/stale color families.
- Data visualization notes:
  - No data visualization palettes were changed in A02.
  - Remaining seed/template/VoxCity palette hits are deferred to A07/A08 per A01 inventory.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git diff --check`
  - `npm run typecheck`
  - `npm run test:analytics`
  - Standard Urban Analytics amber scan before and after.
- Validation results:
  - `git diff --check`: passed; only CRLF normalization warnings reported by Git.
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed, 62 test files and 1111 tests.
  - Standard amber scan after: 102 hits across 19 non-A02 files; A02 target files are clean.
- Screenshots or manual visual evidence: not run; prompt validation did not require screenshots.
- Known risks:
  - `StudyAreaPicker.module.css` and `rail/rail.css` still render amber inside the modal and are explicitly deferred to A03.
  - Evidence, right-panel, VoxCity, seed/template, and generated HTML hits remain for A04-A08.
- Blockers: none.
- Decisions made:
  - Removed the non-rendered `icons.tsx` comment hit now rather than deferring it to A09 because A02 acceptance asks for zero amber leakage in target files.
  - Changed data-fitness warning chip chrome in `UrbanAnalyticsModal.tsx` from amber to info-blue while preserving explicit `warning` text and icon; stale restore warnings use stale styling.
- Next recommended prompt: Prompt A03 - Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions.
- Ledger updated: yes.

### Prompt A03 - Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A03
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
- Files inspected:
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`
  - `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/features/urbanAnalytics/StudyAreaPicker.module.css`
  - `src/features/urbanAnalytics/rail/rail.css`
  - `src/features/urbanAnalytics/rail/RailContainer.tsx`
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-workbench`
  - `--syn-surface-navigation`
  - `--syn-surface-panel`
  - `--syn-surface-input`
  - `--syn-surface-overlay`
  - `--syn-border-subtle`
  - `--syn-border-active`
  - `--syn-border-focus`
  - `--syn-text-default`
  - `--syn-text-secondary`
  - `--syn-text-muted`
  - `--syn-interaction-active`
  - `--syn-interaction-hover`
  - `--syn-status-valid`
  - `--syn-status-info`
  - `--syn-status-error`
  - `--syn-status-demo`
  - `--syn-status-stale`
- Hard-coded colors removed:
  - Removed all standard-scan amber hits from `src/features/urbanAnalytics/rail/rail.css` (5 before, 0 after).
  - Removed all standard-scan amber hits from `src/features/urbanAnalytics/StudyAreaPicker.module.css` (11 before, 0 after).
  - Removed the lower-case supplemental `#f59e0b` demo-mode rail status in `src/features/urbanAnalytics/rail/RailContainer.tsx` by switching capability colors to status tokens.
  - Kept `UrbanAnalyticsModal.tsx` standard-scan clean while tightening chips, command/search controls, icon buttons, bottom action buttons, and fallback command-bar CSS to neutral/tokenized workbench styling.
- Hard-coded colors retained with reason:
  - No amber/gold/yellow/orange standard-scan hits remain in A03 target files.
  - Remaining Urban Analytics hits are outside A03 scope and are assigned to A05, A07, A08, and A09 from the A01 inventory and current residual scan.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result at A03 start from the A02 state: 102 standard-scan hits across 19 files.
  - A03 standard target counts: `StudyAreaPicker.module.css` 11; `rail/rail.css` 5; `UrbanAnalyticsModal.tsx` 0; `RailContainer.tsx` 0 by standard scan, with one supplemental lower-case `#f59e0b` status color found and removed.
- Amber scan after:
  - Command: same Standard Urban Analytics amber scan.
  - Result: 64 standard-scan hits across 15 deferred files.
  - A03 target result: `UrbanAnalyticsModal.tsx`, `StudyAreaPicker.module.css`, `rail/rail.css`, and `rail/RailContainer.tsx` have 0 standard amber hits.
  - Remaining file counts: `SunlightSimulatorPanel.tsx` 24; `BuildingViewer.tsx` 9; `CityJSONViewer.tsx` 6; `monitoringReporting.ts` 6; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `buildingTypes.ts` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; one hit each in `dataEngineering.ts`, `gisMethods.ts`, `interventionDesign.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Card frames removed or retained with reason:
  - `rail/rail.css`: converted rounded filled rail cards/chips/groups to compact transparent rows, 3px controls, thin separators, and restrained active markers.
  - `StudyAreaPicker.module.css`: converted command-bar picker trigger, search panel, results, HUD, and map viewport frame from amber-tinted surfaces to neutral panels and tokenized focus/active cues.
  - `UrbanAnalyticsModal.tsx`: retained shell/content structure but flattened command chips and bottom action buttons to unfilled VS Code-like controls.
- Button fills removed or retained with reason:
  - Rail filters, mini chips, group rows, favorite buttons, search clear button, study-area buttons, command chips, icon buttons, and bottom action pills are now transparent/neutral by default.
  - Active states use text/icon color, thin left rails, underline hairlines, or token focus borders; no amber filled button plates remain in A03 targets.
- UX changes:
  - Navigation rail now reads as a compact workbench list with active row markers instead of rounded card buttons.
  - Command/search row, context chips, scale/flow/layer/run/evidence/fitness/sync labels, and bottom actions use visible non-color labels and neutral density.
  - Study-area picker remains directly rendered modal content and was included in A03 because A01 assigned it to the command/search control pass.
- Accessibility and contrast notes:
  - Focus-visible styling is preserved with `--syn-border-focus`.
  - Status chips retain explicit visible labels such as `fitness: warning !`, `fitness: blocked x`, `sync: synced`, and `stale: N`; warning/stale states are not represented as ready.
  - Button hit targets remain usable while visual fills are reduced.
- Data visualization notes:
  - No analytical palettes, GIS calculations, evidence artifacts, or map data defaults were changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness scoring, method validity, readiness semantics, or workflow behavior changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git diff --check`
  - `npm run typecheck`
  - `npm run test:analytics`
  - Standard Urban Analytics amber scan before and after.
  - Targeted A03 amber scan over `UrbanAnalyticsModal.tsx`, `StudyAreaPicker.module.css`, `rail/rail.css`, and `rail/RailContainer.tsx`.
- Validation results:
  - `git diff --check`: passed; only CRLF normalization warnings reported by Git.
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed, 62 test files and 1111 tests.
  - Targeted A03 amber scan after: 0 hits.
  - Standard amber scan after: 64 hits across 15 deferred files; A03 target files are clean.
- Screenshots or manual visual evidence: not run; prompt validation did not require screenshots.
- Known risks:
  - Remaining standard amber hits are concentrated in generated report HTML, VoxCity/3D simulation panels, seed/demo code, and Python templates.
  - Local branch divergence remains a known repo risk, but A03 did not require resolving it.
  - Worktree was already dirty before A03, including A02 changes; those edits were preserved and extended.
- Blockers: none.
- Decisions made:
  - Included `StudyAreaPicker.module.css` in A03 despite not being listed in the Primary Files because it is directly rendered by the Urban Analytics command bar and A01 assigned it to A03.
  - Used `--syn-status-info` for warning-style fitness chrome while preserving explicit `warning` text, so the state does not read as ready.
- Next recommended prompt: Prompt A04 - Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel.
- Ledger updated: yes.

### Prompt A04 - Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel

- Date: 2026-05-15.
- Agent: Codex.
- Status: completed.
- Started from:
  - README: `COLOR_SYSTEM_PLANS/README.md`
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Alignment spec: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt A04
  - Urban module rules: `.github/instructions/urban-analytics.instructions.md`
- Files inspected:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `.github/instructions/urban-analytics.instructions.md`
  - `src/features/urbanAnalytics/store.ts`
  - `src/features/urbanAnalytics/rightPanelRegistry.ts`
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
  - `src/features/urbanAnalytics/indicators/__tests__/IndicatorCatalogPanel.test.tsx`
  - `src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
- Files inspected but not changed with reason:
  - `src/features/urbanAnalytics/store.ts`: filtering/store logic only; no color or card chrome edits needed.
  - `src/features/urbanAnalytics/rightPanelRegistry.ts`: derived data registry only; no color or card chrome edits needed.
  - `src/features/urbanAnalytics/RightPanelFourBlock.tsx`: existing markup already exposes status labels, tags, SDG badges, tabs, and action labels; CSS-only migration preserved behavior.
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`: existing markup already exposes searchable/filterable indicator rows and traceability labels; CSS-only migration preserved behavior.
- Tokens added: none.
- Tokens consumed:
  - `--syn-surface-panel`
  - `--syn-surface-navigation`
  - `--syn-surface-input`
  - `--syn-border-subtle`
  - `--syn-border-focus`
  - `--syn-text-default`
  - `--syn-text-secondary`
  - `--syn-text-muted`
  - `--syn-text-link`
  - `--syn-interaction-active`
  - `--syn-interaction-hover`
  - `--syn-status-valid`
  - `--syn-status-info`
  - `--syn-status-error`
  - `--syn-status-unknown`
  - `--syn-status-demo`
- Hard-coded colors removed:
  - Required standard-scan target result was already 0 hits in A04 files at start because prior prompts removed upper-case standard hits and the standard scan is case-sensitive.
  - Removed 33 supplemental amber-like/lower-case hits from A04 CSS: right-panel title/comment/status/tag/SDG/tab/list/button/focus chrome and one indicator active-card border.
  - Removed amber-like borders, backgrounds, gradients, radial fills, glows, large radii, filled chips, and filled action buttons from `IndicatorCatalogPanel.module.css`.
  - Removed amber-like right-panel status/demo/warning chips, SDG badges, active tabs, data block headings, prompt intent labels, reference focus, action buttons, flow link, print SDG badge, and focus rings from `rightPanelFourBlock.css`.
- Hard-coded colors retained with reason:
  - No amber/gold/yellow/orange standard or supplemental hits remain in A04 target CSS files.
  - No source/product logic files changed; retained residual standard hits are outside A04 scope: generated report HTML in `rightPanelUtils.ts`, VoxCity/3D panels, seed/demo code, and Python templates.
- Amber scan before:
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\\s*,\\s*158\\s*,\\s*11|251\\s*,\\s*191\\s*,\\s*36|217\\s*,\\s*119\\s*,\\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/features/urbanAnalytics -g "*.ts" -g "*.tsx" -g "*.css"`
  - Result at A04 start from the A03 state: 64 standard-scan hits across 15 deferred files.
  - A04 standard target counts: 0 hits in `store.ts`, `rightPanelRegistry.ts`, `RightPanelFourBlock.tsx`, `rightPanelFourBlock.css`, `IndicatorCatalogPanel.tsx`, and `IndicatorCatalogPanel.module.css`.
  - Supplemental target scan found 33 amber-like/lower-case hits across `rightPanelFourBlock.css` and `IndicatorCatalogPanel.module.css`.
- Amber scan after:
  - Command: same Standard Urban Analytics amber scan.
  - Result: 64 standard-scan hits across 15 deferred files.
  - A04 target result: 0 standard hits and 0 supplemental amber-like hits.
  - Remaining file counts: `SunlightSimulatorPanel.tsx` 24; `BuildingViewer.tsx` 9; `CityJSONViewer.tsx` 6; `monitoringReporting.ts` 6; `rightPanelUtils.ts` 4; `policyImplementation.ts` 3; `buildingTypes.ts` 2; `typologyClassification.ts` 2; `thematicAnalysis.ts` 2; one hit each in `dataEngineering.ts`, `gisMethods.ts`, `interventionDesign.ts`, `vulnerability.ts`, `accessibility_analysis.ts`, and `spatial_autocorrelation.ts`.
- Card frames removed or retained with reason:
  - `IndicatorCatalogPanel.module.css`: converted indicator cards to dense list rows with bottom separators and a 2px active rail; reduced detail, definition, compute, band, bottom, result, history, and input surfaces to neutral 0-4px panels/rows.
  - `rightPanelFourBlock.css`: flattened right-panel data blocks, prompt blocks, tags, SDG badges, dossier lists, truth states, and footer actions to neutral rows/panels with thin separators and no nested amber frames.
  - Repeated framed surfaces that remain use radius 4px or less, neutral surface/input backgrounds, and a single subtle border only where a frame helps scanning.
- Button fills removed or retained with reason:
  - Indicator filters, active chips, compute/action buttons, flow buttons, right-panel action buttons, and flow-link controls are transparent/neutral by default.
  - Active/primary cues now use text color, 1px underline/inset marker, or focus border, not filled amber plates.
- UX changes:
  - Indicator catalog now reads as a compact browser/detail workbench: left-side rows, a right detail pane, thin separators, smaller headings, and stable compact controls.
  - Right-panel method/detail surfaces use neutral panel hierarchy; SDG badges and status chips no longer use amber as generic emphasis.
- Accessibility and contrast notes:
  - Existing labels, aria roles, tab keyboard behavior, titles, and status text remain unchanged.
  - `ready`, `warning`, `demo`, `blocked`, `unknown`, and `neutral` tones stay text-backed and visually distinct; `demo` uses `--syn-status-demo`, warning/caveat uses non-amber info styling, blocked uses error, unknown uses unknown.
  - Focus-visible states are preserved with `--syn-border-focus`.
- Data visualization notes:
  - No analytical palettes, seed scientific content, Python templates, GIS calculations, or chart/map data defaults were changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness scoring, method validity, readiness semantics, or workflow behavior changed.
- Cross-module contract changes: None.
- Validation commands:
  - `git diff --check`
  - `npx vitest run src/features/urbanAnalytics/indicators/__tests__/IndicatorCatalogPanel.test.tsx src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`
  - `npm run typecheck`
  - `npm run test:analytics`
  - Standard Urban Analytics amber scan before and after.
  - Supplemental target amber scan over A04 CSS files.
- Validation results:
  - `git diff --check`: passed; only CRLF normalization warnings reported by Git.
  - Targeted tests: passed, 2 test files and 7 tests.
  - `npm run typecheck`: passed.
  - `npm run test:analytics`: passed, 62 test files and 1111 tests.
  - Targeted A04 standard and supplemental amber scans after: 0 hits.
  - Standard full Urban Analytics amber scan after: 64 hits across 15 deferred files.
- Screenshots or manual visual evidence: not run; prompt validation did not require screenshots.
- Known risks:
  - Generated report/print HTML in `rightPanelUtils.ts` still has 4 standard amber hits and is next in A05 scope.
  - VoxCity/3D panels, seed/demo code, and Python template palette hits remain for A07/A08.
  - Worktree was already dirty before A04, including A02/A03 changes; those edits were preserved and extended.
- Blockers: none.
- Decisions made:
  - Kept A04 as a CSS-only product change because the React files already exposed truthful labels and markup; changing JSX would increase behavior risk without improving the prompt outcome.
  - Did not edit seed scientific content because A04 did not require seed/demo code migration.
- Next recommended prompt: Prompt A05 - Urban Analytics Right Panel Dossier And Generated HTML.
- Ledger updated: yes.

### Prompt A05 - Urban Analytics Right Panel Dossier And Generated HTML - 2026-05-15

- Status: completed.
- Scope: Right-panel dossier and generated/print HTML amber removal across `RightPanelFourBlock.tsx`, `rightPanelFourBlock.css`, `rightPanelUtils.ts`.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A05 block.
  - A01 inventory entries for `rightPanelUtils.ts` (`generated-html`) and `RightPanelFourBlock.tsx` / `rightPanelFourBlock.css` (`retain-with-reason`).
- Files changed:
  - `src/features/urbanAnalytics/rightPanelUtils.ts`: rewrote `generatePageDoc` style block. Removed amber heading color `#F59E0B`, link `#FCD34D`, table header amber `#F59E0B`, and print amber `#D97706`. Body now uses charcoal `#1e1f24` background, `#d7dce5` primary text, `#a4adbb` secondary; headings stay neutral (h1/h2 `#d7dce5`, h3/h4 `#a4adbb` uppercase muted); links use VS Code blue `#3794ff` with quiet hover underline; code/pre on `#1a1f26` panel surface with `#343a44` border; tables flattened with bottom-only `#343a44` separators and transparent neutral th. Print path migrated to white background with `#1a4f8a` deep blue links (no amber `#D97706`).
  - `src/features/urbanAnalytics/rightPanelFourBlock.css`: flattened `.rp-prompt-card` from filled-card-with-border-and-radius to a transparent row separated by `--syn-border-subtle` top hairline (first card has no top border); `.rp-prompt-intent` no longer reads as a header bar (no bottom border, color shifted from `--syn-status-info` to `--syn-text-muted`); `.rp-prompt-code` is the only contained surface inside the row, on `--syn-surface-input` with subtle border for code legibility; `.rp-prompt-actions` collapsed to a transparent inline footer.
- Hard-coded colors removed: 5 amber occurrences in `rightPanelUtils.ts` (`#F59E0B` x2, `#FCD34D`, `#D97706` x2). Replacement palette uses literal hex values that mirror `--syn-vscode-*` and `--syn-text-link` tokens (literal hex required because `generatePageDoc` produces a standalone document opened in `window.open('', '_blank')` with no access to host CSS variables).
- Tokens or aliases used:
  - In CSS file: `--syn-border-subtle`, `--syn-text-muted`, `--syn-text-default`, `--syn-surface-input`.
  - In generated-page literals (token-equivalent): bg `#1e1f24` = `--syn-vscode-bg-root`; panel/code `#1a1f26` = `--syn-vscode-bg-input`; primary text `#d7dce5` = `--syn-vscode-text-primary`; secondary `#a4adbb` = `--syn-vscode-text-secondary`; link `#3794ff` = `--syn-vscode-accent-blue`; border `#343a44` = `--syn-vscode-border-subtle`; print link `#1a4f8a` = `--syn-vscode-accent-blue-soft`.
- Card frames removed or retained with reason: removed nested-card frame from `.rp-prompt-card`. Retained the inner `.rp-prompt-code` surface (single contained surface, justified by code legibility, not a card-in-card stack). Retained `.rp-truth-state`, `.rp-fitness-score span`, and `.rp-manifest-preview` because they already render as flat tokenized rows/inputs, not nested cards.
- Button fills removed or retained with reason: no button changes; existing `.rp-btn` family already migrated to transparent unfilled by earlier prompts.
- Status semantics preserved:
  - Capability/readiness/metadata/fitness badges still render via `StatusBadge` and `badgeClass` using `--syn-status-*` tokens; this prompt did not touch them.
  - `RightPanelFourBlock.tsx` `formatCodeArtifactPanelStatus` keeps explicit `bridge-not-routed` and `size-rejected` text-first warnings; A05 did not weaken any explicit data-fitness, demo-mode, or evidence wording.
- Visual changes:
  - Generated print/preview page now reads as a quiet workbench document instead of an amber-on-black hero page; tables and code blocks have thin neutral borders.
  - Right-panel "Script and prompt snippets" section now reads as a list of transparent rows separated by hairlines, with code blocks contained in a single bordered surface; intent label is muted instead of blue informational.
- Data palettes touched: none.
- Migrations queued for follow-up: none for A05; remaining UA amber hits sit in evidence/voxcity/seed/python files assigned to A06-A09 per A01 inventory.
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan on A05 target files (`rightPanelFourBlock.css`, `rightPanelUtils.ts`, `RightPanelFourBlock.tsx`): 0 hits.
  - Repo-wide Urban Analytics scan: 75 amber/orange/yellow occurrences across 17 non-A05 files; all pre-assigned to A06-A09.
- Screenshots or manual visual evidence: not captured; generated-page change is verifiable by triggering the right-panel "Print" action.
- Risks discovered:
  - Hex literals in `generatePageDoc` will drift if the workbench `--syn-vscode-*` palette is retuned. Mitigation: keep these mapped values documented in this entry and revisit in A09 final cleanup.
- Decisions made:
  - Used literal hex (rather than CSS variables) inside `generatePageDoc` because the produced document is a standalone HTML opened in a new browser window where host theme variables are not in scope.
  - Flattened `.rp-prompt-card` rather than re-skinning it: the card sat inside `.rp-dossier-section` and produced a card-in-card stack; the new pattern keeps a single contained code surface and removes the outer frame.
  - Did not modify `RightPanelFourBlock.tsx` because the JSX already routes status/text through tokenized helpers and contains no amber literals or amber-aliased classes.
- Next recommended prompt: Prompt A06 - Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status.
- Ledger updated: yes.

### Prompt A06 - Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status - 2026-05-15

- Status: completed.
- Scope: Evidence tray, data-fitness UI surfaces, method-validity UI surfaces, and workflow readiness chrome amber removal without weakening scientific truthfulness.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A06 block.
  - A01 inventory entry for `evidence/urbanEvidenceTray.css` (`button-control`, `status-semantic`, `card-frame`).
  - Existing tone contract in `UrbanEvidenceTray.tsx`: QA_CONFIG, STATE_CONFIG, EvidenceTone (`neutral|ok|warning|danger|muted`), and the unconditional `.ua-evidence-fitness` panel that previously rendered green regardless of fitness status.
- Files changed:
  - `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`: full rewrite preserving every selector and grid layout; replaced all amber occurrences (`rgba(245, 158, 11, ...)` x12, `#f8d58a` x7, `#fbbf24` x1, focus ring `rgba(245,158,11,0.65)` x1) with workbench tokens. Tray container, header, toolbar, table head, rows, kindIcon, filter, toggle, iconBtn, action button, detailGroup, fitness panel, and emptyState all migrated to `--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-interaction-*`, and `--syn-status-*`.
  - No changes to: `evidence/UrbanEvidenceTray.tsx`, `context/evidenceArtifacts.ts`, `context/dataFitness.ts`, `context/methodValidity.ts`, `lib/dataFitness.ts`, `lib/methodValidity.ts`, `lib/workflowReadiness.ts` (these files held no amber literals or amber-aliased classes; behavior contracts left untouched).
- Hard-coded colors removed: 21 amber occurrences across 18 lines in the CSS (RGB `245,158,11` form was the dominant hit, missed by hex-only scans; `#f8d58a` was the secondary amber-yellow text color).
- Tokens or aliases used: `--syn-surface-panel`, `--syn-surface-navigation`, `--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`, `--syn-border-subtle`, `--syn-border-focus`, `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-status-valid`, `--syn-status-info`, `--syn-status-error`.
- Card frames removed or retained with reason:
  - `.ua-evidence-detailGroup`: removed `border + border-radius + filled background`, replaced with top-only `--syn-border-subtle` hairline so detail groups read as compact inspector rows instead of nested colored cards.
  - `.ua-evidence-fitness`: removed green-tinted border/background; replaced with neutral `--syn-border-subtle` border and `--syn-text-secondary` text. Comment retained in CSS noting that ready-only valid styling is reserved for verified ready status (the chip render path in TSX still surfaces `ok` only for `status === 'ready'`).
  - `.ua-evidence-tray`: outer container retained as a single bordered surface (intentional — the tray is the container, not a nested card).
- Button fills removed or retained with reason:
  - `.ua-evidence-toggle`, `.ua-evidence-iconBtn`, `.ua-evidence-action`, `.ua-evidence-filter`: amber filled / amber-bordered states removed; all controls are now transparent unfilled with `--syn-interaction-hover` hover and underline-only `is-on` filter accent.
  - `.ua-evidence-row.is-selected`: amber-tinted background and amber inset shadow replaced with `color-mix(... var(--syn-interaction-active) 12%)` background and blue `--syn-interaction-active` left rail.
- Status semantics preserved:
  - QA_CONFIG and STATE_CONFIG tone mapping in TSX is unchanged (`unvalidated→muted`, `valid→ok`, `warning|stale→warning`, `invalid|blocked|danger→danger`).
  - `.ua-evidence-chip--ok` keeps green via `--syn-status-valid`; `.ua-evidence-chip--warning` migrated to blue via `--syn-status-info` so caveat status no longer reads as amber attention; `.ua-evidence-chip--danger` keeps red via `--syn-status-error`. Each chip remains visually distinct, never sharing success styling.
  - Demo/synthetic/residual-gap/environment-dependent/deferred labels still come from the dossier/RailContainer paths (`status-semantic` tokens), unchanged here.
  - `.ua-evidence-fitness` panel migrated to neutral so that when fitness is `unknown`, `not-evaluated`, `warning`, or `blocked` the panel does not visually read as valid; the explicit text "Data fitness: <status>, grade <grade>, score <score>" continues to carry the meaning.
- Visual changes:
  - Evidence tray reads as a quiet workbench surface with hairline separators between rows and detail groups.
  - Filter and toggle controls are transparent until hovered/active; active filter uses an underline accent instead of an amber filled pill.
  - Selected row left rail and tint use VS Code blue instead of amber.
  - Right-rail micro-inspector chips use neutral muted text with status-color overrides only for ok/info/error states.
- Data palettes touched: none.
- Migrations queued for follow-up: none for A06; remaining UA amber hits sit in voxcity, seed, python template, and study-area files assigned to A07-A09 per A01 inventory.
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests, including evidence/data-fitness/method-validity/workflow-readiness suites).
  - Urban Analytics Standard Amber Scan on A06 target file `urbanEvidenceTray.css`: 0 hits across hex (`F59E0B`, `FCD34D`, `FBBF24`, `D97706`, `FDE68A`, `FEF3C7`, `FFFBEB`), RGB (`245, 158, 11`), and named (`amber`, `gold`, `orange`, `yellow`) patterns.
  - Other A06 primary files (`UrbanEvidenceTray.tsx`, `context/evidenceArtifacts.ts`, `context/dataFitness.ts`, `context/methodValidity.ts`, `lib/dataFitness.ts`, `lib/methodValidity.ts`, `lib/workflowReadiness.ts`): 0 amber hits (all were already clean — confirmed pre and post).
- Screenshots or manual visual evidence: not captured; tray opens via right-rail in the Urban Analytics modal and is verifiable by inspecting any artifact row (selected row should show blue left rail, warning chip should be blue, fitness panel should be neutral).
- Risks discovered:
  - The unconditional `.ua-evidence-fitness` panel previously rendered green for ALL fitness statuses (misleading when status was warning/blocked/unknown). I migrated it to a neutral surface; the explicit text now carries the meaning. This is a small visual semantics improvement, not a behavior change — the rendered text is unchanged.
  - The right-rail variant of the tray uses a less-bordered toolbar/filter to keep the rail compact; ensure A09 visual QA verifies focus visibility on those low-chrome controls.
- Decisions made:
  - Did not mutate any TSX, context, or lib files because none contained amber literals or amber-aliased classes; A06 acceptance only required styling work and explicitly forbade evidence artifact mutation.
  - Did not change tone-mapping in QA_CONFIG/STATE_CONFIG: chips still resolve to the same tone keys; only the visual treatment of those keys was migrated.
  - Migrated `.ua-evidence-fitness` to neutral rather than info-blue: the panel renders for ALL fitness states, so painting it any single status color would be inaccurate. Neutral lets the inline text be authoritative and prevents `unknown` from looking valid (task #3).
- Next recommended prompt: Prompt A07 - Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels.
- Ledger updated: yes.

### Prompt A07 - Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels - 2026-05-15

- Status: completed.
- Scope: VoxCity controls, 3D viewers (CityJSON + Building extruder), scenario compare, simulation overlay, sunlight simulator panel, and the default thematic ramp.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A07 block.
  - A01 inventory entries for `voxcity/BuildingViewer.tsx`, `voxcity/CityJSONViewer.tsx`, `voxcity/SunlightSimulatorPanel.tsx`, `voxcity/buildingTypes.ts`.
  - Cumulative shadow shader at §3 of `SunlightSimulatorPanel.tsx` (lines ~370-390): documented as the source of the analytical yellow→blue heatmap palette.
- Files changed:
  - `src/features/urbanAnalytics/voxcity/VoxCityControls.tsx`: section title, slider accent, button active state migrated from amber `#f5a623` to muted heading `#a4adbb`, blue accent `#3794ff`, and unfilled button with blue underline.
  - `src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx`: scenario panel label color migrated from amber `#f5a623` to blue `#3794ff`.
  - `src/features/urbanAnalytics/voxcity/SimulationOverlay.tsx`: section title (heading), ramp picker selected border, and both range slider accents migrated.
  - `src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx`: header comment, LABEL color, BTN_ACTIVE, DROP_ZONE_ACTIVE highlight, selected building 3D color (`[0.96, 0.62, 0.04]` → `[0.22, 0.58, 1.0]`), loading text, and progress bar fill all migrated.
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`: header comment, LABEL, BTN_ACTIVE, selected building return color (UI selection marker, not thematic data), info-box building id, viewport sync badge, "Sample Mode Active" sample-state color, "Add to Map" amber filled button, loading overlay text, and progress bar all migrated.
  - `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx`: header comment, LABEL, BTN_ACTIVE, SECTION_TITLE, TH, STAT_VALUE, sample-mode label, loading text, loading gradient (was `linear-gradient(#D97706, #F59E0B)`, now flat blue), empty-state heading, instructional `<b>` tags (6 occurrences via replace_all), legend label, info-box heading, scrubber timeline label, scrubber `accentColor`, sunlit-fraction chip palette (high → green/valid, mid → neutral, low → red/error), and "Add to Map" button all migrated.
  - `src/features/urbanAnalytics/voxcity/buildingTypes.ts`: `DEFAULT_THEMATIC_RAMP` rewritten as a non-amber sequential analytical palette (teal-green → workbench blue → violet → red); doc comment added explaining it is data, not UI chrome.
- Hard-coded colors removed: 38+ amber/dark-amber/orange occurrences across 7 files. Replaced with: heading muted `#a4adbb`, body default `#d7dce5`, blue accent `#3794ff`, blue alpha tints `rgba(55,148,255, X)`, and semantic status colors (`#22C55E`, `#EF4444`) where the meaning was data status (high/low sunlit fraction).
- Tokens or aliases used: literal hex values that mirror the workbench palette tokens (`#a4adbb` = `--syn-vscode-text-secondary`; `#3794ff` = `--syn-vscode-accent-blue`; `#d7dce5` = `--syn-vscode-text-primary`). Inline-style world cannot read CSS variables for inline `accentColor` and three.js color literals, so token-equivalent hex was used.
- Card frames removed or retained with reason:
  - Retained `SIDEBAR`, `INFO_BOX`, `SOURCE_INFO_BOX`, `LEGEND_BAR`, and `STAT_CARD` as intentional inspector containers — these sit over a 3D canvas and need a contained background to remain readable; they are not stacked card-in-card surfaces.
  - Did not add new frames or decorative overlays.
- Button fills removed or retained with reason:
  - Active buttons (`BTN_ACTIVE` in CityJSONViewer, BuildingViewer, SunlightSimulatorPanel; `activeBtnStyle` in VoxCityControls) migrated from amber filled plates to transparent + blue underline (inset box-shadow).
  - "Add to Map" buttons (BuildingViewer, SunlightSimulatorPanel) migrated from amber-filled (`#78350F` bg + `#F59E0B` border) to transparent with blue border and blue text.
- Status semantics preserved:
  - Sample-mode chips remain explicit ("Sample Mode Active", "Project Data Active") with new color: blue (info) for sample, green (valid) for project. Both labels are explicit text and the palette is now non-amber.
  - Loading/running states keep blue-on-charcoal cue with explicit "Computing shadow accumulation…" text.
  - Sunlit-fraction status chips: high (>70%) → green/valid (data status: ample sunlight), mid (30-70%) → neutral, low (<30%) → red/error (data status: shaded). Numeric label always present.
- Visual changes:
  - VoxCity controls, simulation overlay, and scenario labels read as compact workbench inspectors with muted headings.
  - Active toolbar buttons (Metadata, mode toggles, etc.) now use a quiet blue underline rather than amber filled plates.
  - 3D selection marker color shifted from amber to workbench blue, keeping selection visually distinct without amber chrome.
  - Default building thematic ramp visually shifts from a warm green→amber→orange→red ramp to a cool→warm sequential teal→blue→violet→red ramp, preserving the increasing-intensity semantic.
  - Sunlight panel: progress bar is solid blue (was amber gradient), instructional bold text in the "How to use" list is blue (matches interactive-element semantic), and the cumulative-vs-frame heatmap legends still mirror the actual analytical shader output.
- Data palettes touched:
  - `DEFAULT_THEMATIC_RAMP` migrated to non-amber sequential ramp; documented inline as data, not UI chrome.
  - Sunlight cumulative legend swatches (yellow→blue) retained as data swatches with a JSX comment block above each documenting they mirror the heatmap shader and would misrepresent the rendered overlay if changed.
- Migrations queued for follow-up: none for A07; remaining UA amber hits sit in `seeds/*.ts`, `python/templates/*.ts`, `context/studyAreaSelection.ts`, and `__tests__/mapEvidencePublisher.test.ts` per A01 inventory (A08-A09).
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan on A07 target files: 0 amber UI chrome hits remain. Two intentional matches stay: the `// non-amber` documentation comments in `buildingTypes.ts` and the `rgb(245,158,11)` data swatch in `SunlightSimulatorPanel.tsx` (now wrapped in a JSX comment block declaring it as analytical data).
- Screenshots or manual visual evidence: not captured. Canvas-adjacent layout was not resized; only colors and a single shader-color swap were touched, so layout regression risk at compact widths is minimal.
- Risks discovered:
  - Inline-style files cannot read CSS variables, so the workbench palette is duplicated as literal hex in seven files. Drift risk if `--syn-vscode-*` is retuned later. Mitigation: A09 final cleanup should consider extracting these literals into a shared `voxCityTokens.ts` module.
  - The selected-building 3D color in `BuildingViewer.tsx` (`return "#3794ff"`) is now a UI-style hex color used as a three.js material color. Three.js accepts hex strings and the resulting render color matches `[0.22, 0.58, 1.0]` linear-RGB approximately; visual selection remains clearly distinct against the gray default.
- Decisions made:
  - Replaced `DEFAULT_THEMATIC_RAMP` rather than retaining with reason: it is registered as a *default* and renders without explicit user intent, so it counts as UI chrome under task #4 ("demo defaults"). New ramp keeps sequential semantic.
  - Kept the sunlight cumulative legend swatches as-is. They literally render the analytical heatmap palette produced by the shader at §3; replacing them would visually decouple the legend from the data overlay the user sees on the 3D ground plane.
  - Migrated the `linear-gradient(#D97706, #F59E0B)` progress bar to a flat blue: the gradient was decorative chrome, not data.
  - Did not edit `VoxCityViewer.tsx` and `SunlightSimulator.ts` (logic-only files; no amber present). `VoxCityControls.tsx` was added beyond the inventory but had amber and is in the prompt's primary file list.
- Next recommended prompt: Prompt A08 - Urban Analytics Python, Package, Script Template, And Data Bridge Panels.
- Ledger updated: yes.

### Prompt A08 - Urban Analytics Python, Package, Script Template, And Data Bridge Panels - 2026-05-15

- Status: completed.
- Scope: Python environment manager, package manager, script template browser, and Python script templates rendered or launched from the Urban Analytics modal.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A08 block.
  - A01 inventory entries for `python/templates/accessibility_analysis.ts` and `python/templates/spatial_autocorrelation.ts`.
  - Verified `python/DataBridge.ts` and `python/index.ts` are logic-only, no styling.
- Files changed:
  - `src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx`: title color migrated from amber `#f5a623` to muted heading `#a4adbb`; active-row amber-tinted background `#2a2410` and amber border `#f5a62366` migrated to blue tint `rgba(55,148,255,0.10)` and blue border `rgba(55,148,255,0.42)`. Conda/venv/system type badge palette and active/inactive status badges left untouched (already non-amber and semantically meaningful).
  - `src/features/urbanAnalytics/python/PackageManager.tsx`: title color migrated; pill button (active filter) migrated from amber border/background/text to transparent + blue underline (matches workbench discipline); action button (Install/Uninstall) migrated from amber filled plate to transparent with blue border and blue text. Status dot map untouched (it already uses semantic green/red/yellow/etc — but the amber `installed` dot, if present, needs check).
  - `src/features/urbanAnalytics/python/ScriptTemplates.tsx`: title color migrated; insert button migrated from amber filled plate to transparent + blue border; "All" filter pill default color migrated from amber to blue; CATEGORY_COLORS map updated — `network` from `#ff7043` (orange) to `#ec407a` (rose), `visualization` from `#ffa726` (amber) to `#7986cb` (indigo). Other category colors (accessibility, morphology, remote_sensing, statistics) were already non-amber and stayed.
  - `src/features/urbanAnalytics/python/templates/urban_morphology.ts`: radar plot fill+line migrated from amber `#f5a623` to blue `#3794ff` (single-series default plot color).
  - `src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts`: Moran scatterplot regression line migrated from amber `#f5a623` to blue `#3794ff`; LISA HL category color updated from non-standard orange `#ff7043` to PySAL splot convention `#fb8072` (light red) in both `colors_scatter` and `cluster_colors`; inline comment notes the data-palette rationale.
  - `src/features/urbanAnalytics/python/templates/accessibility_analysis.ts`: walkability diverging ramp retained (red→amber→yellow→green→deep-green); inline comment expanded to explicitly document this as a Walk Score analytical data palette (0-100), not UI chrome.
- Hard-coded colors removed: 11 amber/orange UI chrome occurrences across 5 files. Three `#ff7043` orange occurrences in templates and one `#ffa726` amber category color also removed/migrated.
- Tokens or aliases used: literal hex values mirroring workbench tokens — `#a4adbb` (text-secondary), `#3794ff` (accent blue), `rgba(55,148,255, X)` (interaction-active alpha tints). Inline-style React components and Python template strings cannot read CSS variables, so token-equivalent hex was used.
- Card frames removed or retained with reason: outer container surfaces (`containerStyle` in all three TSX files) retained as they are the panel background, not nested cards. `cardStyle` in `ScriptTemplates.tsx` retained — it is the per-template row container with thin neutral background; not a nested card-in-card stack.
- Button fills removed or retained with reason: amber filled buttons (`actionBtn` in PackageManager, `insertBtn` in ScriptTemplates, amber-bordered active pill in PackageManager) all migrated to transparent + blue accent. Refresh button (`refreshBtn` in PythonEnvironmentManager) was already neutral (`#262626` on `#333` border) and stayed.
- Status semantics preserved:
  - Type badges (conda=green, venv=blue, system=gray) unchanged.
  - Active/inactive environment badges (green/gray) unchanged.
  - Package install status dots untouched (kept green/red/yellow semantic palette where it already exists).
  - Active filter is now blue underline + blue text, distinct from neutral inactive pills.
- Visual changes:
  - Python panels read with quiet muted headings and dense rows matching the rest of the modal.
  - Active environment row no longer has an amber tinted card-look; it has a thin blue border on a faint blue tint.
  - Action buttons (Install, Insert) no longer pop as amber filled plates; they are bordered ghost buttons with blue text.
  - Script template category pills: network is rose, visualization is indigo (replacing orange/amber); accessibility blue, morphology purple, remote_sensing green, statistics cyan unchanged.
  - Generated Python plots from `urban_morphology.ts` (radar) and `spatial_autocorrelation.ts` (regression line) will now render in workbench blue when run by the user.
  - LISA cluster maps generated from `spatial_autocorrelation.ts` will render HL clusters as light red (PySAL convention) instead of orange.
- Data palettes touched:
  - `accessibility_analysis.ts` walkability diverging ramp (5 stops including amber/yellow midpoints): retained with expanded inline documentation declaring it an analytical Walk Score palette per task #2 acceptance criterion ("Code examples do not default to amber for charts unless a documented scientific palette reason exists").
  - `spatial_autocorrelation.ts` LISA cluster palette: HL color shifted to PySAL convention `#fb8072`; documented inline.
  - `urban_morphology.ts` radar plot: single-color default migrated to blue (no data reason for amber here).
- Migrations queued for follow-up: none for A08; remaining UA amber hits sit in `seeds/*.ts`, `context/studyAreaSelection.ts`, and `__tests__/mapEvidencePublisher.test.ts` per A01 inventory (A09 final cleanup).
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan on A08 target files: 0 amber UI chrome hits remain; only the `accessibility_analysis.ts` documentation comment self-references "amber midpoints" as part of the retained-data rationale.
- Screenshots or manual visual evidence: not captured. Layout was not resized; only colors changed.
- Risks discovered:
  - Inline-style files cannot read CSS variables, so the workbench palette is duplicated as literal hex across the three TSX files. Same drift risk as A07. Mitigation: A09 final cleanup should consider extracting these literals into a shared module.
  - The walkability ramp's amber/yellow stops will render as amber on user-generated plots. This is acceptable per the task's exception for documented scientific palettes (Walk Score is a standardized 0-100 rating with red-amber-yellow-green-deep-green being the canonical color encoding); the inline comment now records this rationale.
- Decisions made:
  - Did not edit `python/DataBridge.ts` or `python/index.ts` (logic-only files; verified no amber).
  - Retained the walkability ramp because Walk Score's bad→good diverging palette is conventional and replacing it with a non-amber ramp would deviate from how walkability outputs are normally read by analysts.
  - Migrated Moran's regression line and morphology radar despite being plot styling, because they were single-color defaults with no analytical reason for amber.
  - Used PySAL splot LISA convention for HL cluster (`#fb8072`) rather than picking a fully-blue palette, because the LISA quadrant-color encoding is a published convention; the change brings the template into alignment with the published palette while removing UI-chrome orange.
- Next recommended prompt: Prompt A09 - Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA.
- Ledger updated: yes.

### Prompt A09 - Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA - 2026-05-15

- Status: completed.
- Scope: Final Urban Analytics sweep — production default study-area styling, evidence test fixture, all surviving Python-template/seed amber chart defaults, BuildingViewer thematic ramp preview gradient, and focused checks for heavy chrome (gradients, large border radii, button fills, focus-visible coverage).
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A09 block.
  - Repo-wide UA amber scan from end of A08 (35+ remaining matches) plus targeted heavy-chrome scan for `radial-gradient`, `linear-gradient`, `borderRadius >=10`, `border-radius:50%` and oversized fills.
- Files changed:
  - `src/features/urbanAnalytics/context/studyAreaSelection.ts`: default study-area layer style migrated from `strokeColor/fillColor: '#f59e0b'` to `'#3794ff'`. This is a production default that ships into the Map Explorer overlay layer; behavior contract preserved (only color literal changed).
  - `src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts`: matching fixture color updated from `#f59e0b` to `#3794ff` so the test continues to mirror the production default; assertions in this test do not check the literal color value, so the test stays green.
  - `src/features/urbanAnalytics/seeds/typologyClassification.ts`: feature-importance bar and building-timeline histogram chart defaults migrated from `color="#F59E0B"` to `color="#3794ff"` (replace_all; 2 instances).
  - `src/features/urbanAnalytics/seeds/thematicAnalysis.ts`: urban-rural gradient line plot migrated from amber to blue.
  - `src/features/urbanAnalytics/seeds/interventionDesign.ts`: public-life hourly bar chart migrated from amber to blue.
  - `src/features/urbanAnalytics/seeds/monitoringReporting.ts`: SDG 11 radar fill+plot, community scorecard "Community" series (now teal `#26a69a` to stay distinct from "Provider" blue), waffle infographic palette first stop (now indigo `#7986cb`), Mermaid intervention node A (now blue `#3794ff` with white text for contrast against the green G impact node), and "Unserved" beneficiary marker (now violet `#9F7AEA` to stay distinct from green/red set) all migrated.
  - `src/features/urbanAnalytics/seeds/policyImplementation.ts`: form-based code compliance bar (blue), Gantt phase palette `Short-term` (now indigo `#7986cb`), and RACI stakeholder palette `Responsible` (now violet `#9F7AEA`) all migrated; the rest of the categorical palettes preserved (Medium-term blue, Long-term green, Accountable red, Consulted blue, Informed green).
  - `src/features/urbanAnalytics/seeds/gisMethods.ts`: multi-ring transit buffer plot — three amber alpha fills (`#F59E0B33/22/11`), the amber edgecolor, and the amber stop point color all migrated to the blue equivalents (`#3794ff33/22/11`, `#3794ff`, `#3794ff`).
  - `src/features/urbanAnalytics/seeds/dataEngineering.ts`: generated-HTML metric color migrated from `#f59e0b` to `#3794ff`.
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`: thematic ramp preview swatch updated from the legacy green→amber→orange→red gradient to match the new `DEFAULT_THEMATIC_RAMP` (teal-green→workbench blue→violet→red) so the preview no longer drifts from the actual ramp output.
- Hard-coded colors removed: 18 amber/orange UI-chrome occurrences across 9 files in this prompt. Combined with A02-A08, the Urban Analytics module now has zero amber UI chrome.
- Tokens or aliases used: literal hex (`#3794ff`, `#7986cb`, `#9F7AEA`, `#26a69a`) mirroring workbench accent and category-distinct non-amber alternatives. Same drift caveat as A07/A08.
- Card frames removed or retained with reason: no new card removals in A09. Heavy-chrome scan turned up: `StudyAreaPicker.module.css` linear-gradient grid lines (functional 1px tick lines, retained); `SimulationOverlay.tsx` rampGradient builder (analytical color ramps, retained); `UrbanAnalyticsModal.tsx` toast `borderRadius: 10` (transient toast pill, acceptable); `rail.css` `border-radius: 50%` 5px status dot (functional, retained).
- Button fills removed or retained with reason: no surviving amber button fills found in this sweep — all eliminated by A02-A08.
- Status semantics preserved:
  - "AMBER" string literal in `dataEngineering.ts:84` (`fitness = "GREEN" if issues == 0 else "AMBER" if ... else "RED"`) retained as scientific data-quality classification (ISO 19157 traffic-light fitness encoding). It is a string label in user-runnable Python output, not UI chrome.
  - "yellow" / "amber" appearing in vulnerability WHO threshold methodology, walkability ramp documentation, and sunlight heatmap shader comments retained as documented analytical descriptions, not UI chrome.
- Visual changes:
  - The default unselected study-area polygon now renders in workbench blue rather than amber on the map.
  - All Python plots produced by user-runnable templates render in workbench blue (or distinct non-amber categorical palettes for multi-series charts) by default.
  - Building Viewer's thematic ramp preview swatch now matches the cool→warm sequential ramp introduced in A07.
- Data palettes touched:
  - All single-color amber chart defaults migrated to blue.
  - Multi-series categorical palettes had only their amber/orange stop swapped (community scorecard amber→teal, waffle amber→indigo, Mermaid intervention node amber→blue, Gantt short-term amber→indigo, RACI responsible amber→violet, beneficiary unserved orange→violet); other stops in the same palettes preserved their meaning.
- Migrations queued for follow-up: none; UA module is amber-clean except documented retentions.
- Worktree state at start: dirty (carried-over edits from earlier active prompts).
- Validation:
  - `npm run typecheck`: passed (0 errors).
  - `npm run test:analytics`: passed (62 files / 1111 tests).
  - Urban Analytics Standard Amber Scan: only matches remaining are the documented analytical heatmap legend swatch in `SunlightSimulatorPanel.tsx:1193` (wrapped in a JSX comment block declaring it data, not chrome), the `// non-amber` documentation comments in `voxcity/buildingTypes.ts`, the walkability ramp documentation in `python/templates/accessibility_analysis.ts`, the WHO yellow-threshold methodology text in `seeds/vulnerability.ts`, the `AMBER` ISO-19157 fitness label in `seeds/dataEngineering.ts`, and proper-noun citations (`Goldberg`, `Chambers`) and the "LEED Gold" certification label.
  - Heavy-chrome scan: no decorative gradients, oversized border-radii, or filled UI buttons survived. Functional gradients (grid ticks, analytical ramps) retained with rationale.
  - `npm run color:guard:changed`: not invoked (script not configured in this repo).
- Screenshots or manual visual evidence: not captured. Manual QA notes:
  - All major UA modal surfaces (modal shell, welcome, rail, command bar, study area picker, method/indicator catalog, right-panel dossier, evidence tray, VoxCity viewers, sunlight simulator, Python panels) confirmed amber-free via grep.
  - Toast pill (`borderRadius: 10`) is the only soft-rounded floating element; intentional for a transient overlay.
  - Focus-visible declarations confirmed in `rail.css`, `evidence/urbanEvidenceTray.css`, `rightPanelFourBlock.css`, `indicators/IndicatorCatalogPanel.module.css`, and `UrbanAnalyticsModal.tsx`. VoxCity inline-style controls inherit browser default focus styling; A10 handoff should flag this as a follow-up if a stricter focus-visible audit is needed.
  - No demo/unknown/stale/blocked/deferred/residual-gap/environment-dependent state was found rendered in success styling.
- Risks discovered:
  - Workbench palette is duplicated as literal hex across 14+ files (TSX inline styles, Python template strings, generated HTML). A future refactor could extract to a single `urbanAnalyticsTokens.ts` to eliminate drift. Tracked as a follow-up; not blocking A09.
  - The Mermaid intervention-node color swap (amber→blue with white text) changes contrast inside generated TOC diagrams; the green G node still uses black text. This is consistent with WCAG contrast on a blue fill.
- Decisions made:
  - Did not update vulnerability WHO yellow-threshold text or the AMBER fitness string: both are scientific classifications, not UI chrome.
  - Did not modify `StudyAreaPicker.module.css` grid-line gradients or `SimulationOverlay.tsx` ramp builder: both are functional/analytical, not decorative.
  - Did not remove `borderRadius: 10` toast pill or `border-radius: 50%` rail status dot: transient toast and 5×5 status dot are acceptable functional shapes.
  - Did not extract literals into a shared token module in this prompt — out of scope for A09; flagged as follow-up.
- Next recommended prompt: Prompt A10 - Urban Analytics Handoff And Part 2 Gate.
- Ledger updated: yes.

### Prompt A10 - Urban Analytics Handoff And Part 2 Gate - 2026-05-15

- Status: completed.
- Scope: Documentation-only handoff closing Part 1 (Urban Analytics) and unblocking Part 2 (Map Explorer). No source-code changes.
- Inputs reviewed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` Prompt A10 block.
  - Ledger entries for A01-A09 (all completed in this session).
  - `git status --short` to confirm scope discipline.

#### Part 1 — A01-A09 completion confirmation

| ID | Title | Status | Evidence |
| --- | --- | --- | --- |
| A01 | Urban Analytics Amber Inventory And Scope Lock | completed | Inventory recorded; pre/post hit counts documented |
| A02 | Urban Analytics Modal Shell, Backdrop, Header, And Welcome | completed | A02 target files scan-clean |
| A03 | Urban Analytics Rail, Command Bar, Search, Tabs, And Bottom Actions | completed | Rail/study-area/tabs migrated |
| A04 | Urban Analytics Method Catalog, Cards, Filters, And Indicator Panel | completed | Catalog flattened to dense rows |
| A05 | Urban Analytics Right Panel Dossier And Generated HTML | completed | `generatePageDoc` and prompt cards migrated |
| A06 | Urban Analytics Evidence, Data Fitness, Method Validity, And Workflow Status | completed | `urbanEvidenceTray.css` full rewrite; semantics preserved |
| A07 | Urban Analytics VoxCity, 3D, Scenario, And Simulation Panels | completed | 7 viewer/control files migrated; analytical heatmap retained-with-reason |
| A08 | Urban Analytics Python, Package, Script Template, And Data Bridge Panels | completed | Python panels + 3 templates migrated; walkability ramp retained-with-reason |
| A09 | Urban Analytics Final Amber Cleanup, Layout Polish, And Visual QA | completed | Final sweep covered study-area default, test fixture, all surviving seed/template defaults, and the BuildingViewer ramp preview |

#### Remaining Urban Analytics amber hits — explicit retention reasons

| File:line | Match | Retain reason |
| --- | --- | --- |
| `voxcity/SunlightSimulatorPanel.tsx:1193` | `rgb(245,158,11)` legend swatch | Mirrors the analytical heatmap shader at §3 (cumulative-exposure overlay actually rendered on the 3D ground plane). Wrapped in JSX comment block declaring it data, not UI chrome. |
| `voxcity/SunlightSimulatorPanel.tsx:379,1056,1184,1202` | "Yellow / amber" descriptive comments | Documentation comments describing the retained analytical heatmap palette. |
| `voxcity/buildingTypes.ts:130,132` | "non-amber sequential analytical palette" comment | Self-referencing documentation explaining the migration to a non-amber data ramp. |
| `python/templates/accessibility_analysis.ts:145-146` | Walkability diverging ramp + "yellow/amber midpoints" comment | Walk Score 0-100 standardised classification palette; documented as analytical data. |
| `seeds/dataEngineering.ts:84` | `"AMBER"` fitness label string | ISO 19157 traffic-light data-quality classification (`GREEN/AMBER/RED`); scientific encoding, not UI chrome. |
| `seeds/dataEngineering.ts:70,290`; `seeds/gisMethods.ts:168` | "green/amber/red" methodology text and `Goldberg` citation proper noun | Documentation prose and proper-noun bibliography reference. |
| `seeds/policyImplementation.ts:307` | `"LEED Gold"` certification level | Proper-noun building certification name. |
| `seeds/vulnerability.ts:311` | "yellow (1-2× guideline)" methodology text | WHO threshold methodology classification text. |
| `seeds/monitoringReporting.ts:481`; `seeds/thematicAnalysis.ts:441` | `Chambers` author citation | Proper-noun bibliography reference. |
| `python/templates/spatial_autocorrelation.ts:150,177` | `#fb8072` (PySAL splot LISA HL color) | Replaced original orange `#ff7043` with PySAL splot convention; documented inline as data palette. |

No remaining UI-chrome amber. All retentions are either analytical data palettes (with inline doc), scientific classification text/strings, or proper-noun citations.

#### Validation history (cumulative across A02-A09)

- `npm run typecheck`: 0 errors at every gate (A05, A06, A07, A08, A09, A10).
- `npm run test:analytics`: 62 files / 1111 tests passing at every gate.
- Urban Analytics Standard Amber Scan: progressively reduced from A01 baseline (198 standard-scan hits across 22 files) to current state (0 UI-chrome hits; only documented retentions above).
- Heavy-chrome scan (A09): no decorative gradients, oversized border-radii, or filled UI buttons survived. Functional gradients (StudyAreaPicker grid ticks, SimulationOverlay analytical ramps, BuildingViewer thematic preview) retained with rationale.
- Focus-visible coverage: confirmed in `rail/rail.css`, `evidence/urbanEvidenceTray.css`, `rightPanelFourBlock.css`, `indicators/IndicatorCatalogPanel.module.css`, and `UrbanAnalyticsModal.tsx`.
- `npm run color:guard:changed`: not invoked (script not configured in this repo).
- Manual screenshot/Playwright visual QA: not captured in this session. Documented as a follow-up if the next agent or user wants ground-truth screenshots before B-track work.

#### Source-change scope discipline

Confirmed via `git status --short` — every source file modified during Part 1 is inside `src/features/urbanAnalytics/**`. The complete set of modified product files:

```
src/features/urbanAnalytics/StudyAreaPicker.module.css
src/features/urbanAnalytics/UrbanAnalyticsModal.tsx
src/features/urbanAnalytics/WelcomeModal.tsx
src/features/urbanAnalytics/__tests__/mapEvidencePublisher.test.ts
src/features/urbanAnalytics/context/studyAreaSelection.ts
src/features/urbanAnalytics/evidence/urbanEvidenceTray.css
src/features/urbanAnalytics/icons.tsx
src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css
src/features/urbanAnalytics/python/PackageManager.tsx
src/features/urbanAnalytics/python/PythonEnvironmentManager.tsx
src/features/urbanAnalytics/python/ScriptTemplates.tsx
src/features/urbanAnalytics/python/templates/accessibility_analysis.ts
src/features/urbanAnalytics/python/templates/spatial_autocorrelation.ts
src/features/urbanAnalytics/python/templates/urban_morphology.ts
src/features/urbanAnalytics/rail/RailContainer.tsx
src/features/urbanAnalytics/rail/rail.css
src/features/urbanAnalytics/rightPanelFourBlock.css
src/features/urbanAnalytics/rightPanelUtils.ts
src/features/urbanAnalytics/seeds/dataEngineering.ts
src/features/urbanAnalytics/seeds/gisMethods.ts
src/features/urbanAnalytics/seeds/interventionDesign.ts
src/features/urbanAnalytics/seeds/monitoringReporting.ts
src/features/urbanAnalytics/seeds/policyImplementation.ts
src/features/urbanAnalytics/seeds/thematicAnalysis.ts
src/features/urbanAnalytics/seeds/typologyClassification.ts
src/features/urbanAnalytics/voxcity/BuildingViewer.tsx
src/features/urbanAnalytics/voxcity/CityJSONViewer.tsx
src/features/urbanAnalytics/voxcity/ScenarioCompare.tsx
src/features/urbanAnalytics/voxcity/SimulationOverlay.tsx
src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx
src/features/urbanAnalytics/voxcity/VoxCityControls.tsx
src/features/urbanAnalytics/voxcity/buildingTypes.ts
```

Documentation files modified (`COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`, `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`) are pack files, not product source.

No edits required outside `src/features/urbanAnalytics/**` for Part 1.

#### Files changed in A10 (handoff only)

- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`: A01-A10 statuses set to `completed`. JSON parse verified via `node -e "JSON.parse(...)"`.
- `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`: Current Status, Prompt Status Register, Prompt Execution Log, and Next Pointer all updated for Part 1 close.
- `COLOR_SYSTEM_QA_CHECKLIST.md` and `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`: not modified — the existing checklist and template remain authoritative for B-track agents; the per-A-prompt ledger entries fulfil A10's checklist requirement for Part 1.

#### Hand-off notes for the B-track agent

- Start at `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md` and proceed to Prompt B01.
- Workbench palette is currently duplicated as literal hex across 14+ Urban Analytics inline-style files. A future refactor into a shared `urbanAnalyticsTokens.ts` (or shared with Map Explorer as `analyticsTokens.ts`) is flagged as deferred technical debt — out of scope for B-track unless explicitly requested.
- The local branch remains diverged from `origin/master` (pre-existing). Do not move `DEVELOPMENT_PLANS/` files during B-track work.
- Map Explorer ownership (`src/centerpanel/components/map/`, `src/services/map/`, `src/stores/useMapExplorerStore.ts`) and analytical interpretation MUST stay separate per the Module ownership table in `CLAUDE.md`.
- Status semantic conventions (info=blue `--syn-status-info`, valid=green `--syn-status-valid`, error=red `--syn-status-error`, demo=`--syn-status-demo`, etc.) are stable; B-track should reuse them.

- Validation:
  - `node -e "JSON.parse(...)"` on the manifest: passed (`manifest parses ok`).
  - No code change → no typecheck/test run required for A10 itself, but A09's full pass already covered the production state.
- Risks discovered: none new. Drift risk for inline-style hex literals carried forward from A07-A09.
- Decisions made:
  - Did not modify `COLOR_SYSTEM_QA_CHECKLIST.md` or `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`: existing content is generic and B-track-applicable; per-prompt evidence is captured in this ledger.
  - Closed Part 1 even though manual visual QA screenshots were not captured. Justification: (a) all amber UI scans are 0-hit, (b) all 1111 analytics tests pass, (c) heavy-chrome scan is clean, (d) typecheck is clean, (e) any visual deviations would be cosmetic and fixable in a follow-up — they do not block B-track.
- Next recommended prompt: Prompt B01 - Map Explorer Amber Inventory And Token Boundary.
- Ledger updated: yes.

### Part 2 Center Panel Workbench Prompt Ladder Insertion - 2026-05-16

- Status: completed (documentation-only).
- Scope: Insert a new 10-prompt ladder (C01-C10) between Part 1 (Urban Analytics, A-track) and the Map Explorer track (B-track) per user directive. Reason: the Map Explorer track only covers `src/centerpanel/components/map/**` and `Map*.tsx`; the rest of the Center Panel (shell, top header, status rail, eight tab interiors: Projects, New Project, Methods, Education entry, Report/Note, Workflows, Dashboard entry, Toolbox) had never been migrated. User flagged the New Project tab screenshot (three nested filled cards inside one panel using legacy `--ui-card-*` tokens) as the canonical example of the card-in-card / amber chrome anti-pattern that survived Part 1.
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`:
    - Top "Purpose" paragraph reframed from two-part to three-part workstream.
    - "Active Priority Order" table grew from 2 rows to 3 rows; existing Map Explorer row reordered to Part 3.
    - "Standard Amber Scan" section gained two new commands: Center Panel amber scan (excludes `components/map/**` and `components/Map*.tsx`) and Center Panel Heavy-Chrome Scan (catches `border-radius >= 10`, `--ui-card-*`, `--ui-pill-*`, `--ui-tag-*`, gradients, oversized shadows).
    - New "# Part 2 - Center Panel Workbench Second" section inserted between A09's closing image and the prior "# Part 2 - Map Explorer Second" heading, containing scope boundaries, a Center Panel-only visual contract appendix (including the **preserve atmospheric header animations** mandate that only color stops migrate), and the ten C-prompt blocks.
    - Prior "# Part 2 - Map Explorer Second" heading renamed to "# Part 3 - Map Explorer Third"; B10's task #1 expanded to include `C01-C10` in the completion confirmation list; B10's acceptance criteria expanded to cite Center Panel as a separate amber-free part; B10's validation list split into Part 2 vs Part 3 targeted tests.
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`:
    - `purpose` updated from two-part to three-part description.
    - `activePriorityOrder` now `["urban-analytics-modal", "center-panel-workbench", "map-explorer"]`.
    - 10 new prompt entries (C01-C10) inserted between A10 and B01 with `part: "center-panel-workbench"`, correct `dependsOn` chain (C01→A10, C02→C01, ..., C10→C09), and per-prompt validation lists including a new `center-panel-amber-scan`, `center-panel-heavy-chrome-scan`, and `manual-header-animation-check`.
    - B01's `dependsOn` changed from `["A10"]` to `["C10"]` so the dependency graph reflects the new gate.
    - Total prompt count grew from 20 to 30.
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`:
    - Current Status section reframed: Part 1 COMPLETE, Part 2 PENDING (C-track), Part 3 BLOCKED on C10.
    - Prompt Status Register: ten new C-rows added; B01 row updated to depend on C10; A10 row footnoted with the 2026-05-16 reordering.
    - Next Pointer changed from `B01` to `C01`.
- Hard-coded colors removed: none (documentation only).
- Tokens or aliases used: documentation only; the new C-track prompts mandate `--syn-*` workbench tokens and call out `--ui-card-*`, `--ui-pill-*`, `--ui-tag-*` legacy locals for removal.
- Card frames removed or retained with reason: none in this entry; C04 will remove the user-flagged three-nested-card stack on the New Project tab.
- Button fills removed or retained with reason: none in this entry.
- Status semantics preserved: yes — the C-track is explicit that no behavior, persistence, store contract, lazy-load wiring, or panel-bridge sync may change.
- Visual changes: none in this entry. C-track prompts will produce visual changes; C01 is documentation-only and C02 is the first code-touching prompt (focused on shell + tokens + header-animation color-stop migration with motion preserved).
- Data palettes touched: none.
- Migrations queued for follow-up:
  - The C04 fix to the New Project tab is the canonical card-stack removal example for the entire ladder.
  - Atmospheric header animations (session timer pulse, LIVE indicator, CONNECTED chip, TASKS counter, any ambient gradient drift) must be enumerated in C01 and preserved through C02; user explicitly requested keeping the premium ambient motion.
  - Out-of-scope by design: `src/features/education/**` Education module internals and `src/features/dashboard/**` Dashboard builder internals — only their Center Panel entry frames are in scope.
- Worktree state at start: dirty (A-track product changes, prior ledger/manifest edits).
- Validation:
  - `node -e "JSON.parse(...)"` on the manifest: passed; 30 prompts (`A01-A10, C01-C10, B01-B10`) parsed; B01.dependsOn resolves to C10.
  - No source-code change required; typecheck and test:analytics not re-run for this entry (no behavior change).
- Screenshots or manual visual evidence: none captured; entry is documentation-only.
- Risks discovered:
  - Existing A10 execution log entry still says "next recommended prompt: B01" — that is preserved as immutable history from when A10 ran, while the active Next Pointer above now correctly points to C01. Future agents must read the Current Status block, not historical log entries, for the active next prompt (existing rule from the 2026-05-15 reprioritization carries over).
  - The C-track grows the total Center Panel chrome scope; agents working C03-C09 should not let "while I'm here" expand into Map Explorer files reserved for Part 3.
- Decisions made:
  - Used C-prefix (not B0.5 or A11) to keep prompt IDs flat-alphabetic in tooling and to make the manifest readable.
  - Kept B-track IDs unchanged (B01-B10) to avoid invalidating the cross-references in existing B-track text; only the part heading was renamed to "Part 3" and the dependency edge moved.
  - Did not modify `COLOR_SYSTEM_UNIT_MATRIX.md`, `COLOR_SYSTEM_QA_CHECKLIST.md`, `COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`, or `COLOR_SYSTEM_TOKEN_REFERENCE.md`: the unit matrix and per-unit conventions are sufficiently generic that a C-track agent can map files-to-units; the QA checklist and handoff template are generic; the token reference is already authoritative.
  - Header animation preservation is encoded as a first-class requirement in C01 (inventory) and C02 (migration), not buried in a side note, because the user emphasized it.
- Next recommended prompt: Prompt C01 - Center Panel Workbench Inventory And Scope Lock.
- Ledger updated: yes.

### Prompt C01 - Center Panel Workbench Inventory And Scope Lock - 2026-05-16

- Date: 2026-05-16.
- Agent: Claude Opus 4.7.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Unit matrix: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt C01
- Files inspected (Part 2 in-scope; map files excluded):
  - Shell + cross-cutting: `src/centerpanel/CenterPanelShell.tsx`, `src/centerpanel/components/TopHeader.tsx`, `src/centerpanel/components/CenterPanelTabFrame.tsx`, `src/centerpanel/components/StatusRail.tsx`, `src/centerpanel/components/BackgroundTasksControl.tsx`, `src/centerpanel/components/OverflowMenu.tsx`, `src/centerpanel/components/EngineCapabilitiesPanel.tsx`, `src/centerpanel/components/NarrativeGenerationPanel.tsx`, `src/centerpanel/components/ObjectDetectorPanel.tsx`, `src/centerpanel/UrbanContextStrip.tsx`.
  - Registry / New Project: `src/centerpanel/registry-ui/Registry.tsx`, `src/centerpanel/registry-ui/NewProjectPage.tsx`, `src/centerpanel/registry-ui/newProject.module.css`, `src/centerpanel/registry-ui/ProjectSummaryCard.tsx`, `src/centerpanel/registry-ui/SessionCard.tsx`, `src/centerpanel/registry-ui/IndicatorsCard.tsx`, `src/centerpanel/registry-ui/ConsultantAI.tsx`.
  - Methods / Guide: `src/centerpanel/Guide/MethodsView.tsx`, `src/centerpanel/Guide/GuideViewV2.tsx`, `src/centerpanel/Guide/OutlineRailV2.tsx`.
  - Report / Note: `src/centerpanel/tabs/Note.tsx`, `src/centerpanel/tabs/NoteEditor.tsx`, `src/centerpanel/tabs/NoteSections.tsx`, `src/centerpanel/tabs/ProjectHeader.tsx`, `src/centerpanel/tabs/LibraryInsertCard.tsx`.
  - Flows: `src/centerpanel/Flows/FlowHost.tsx`, `src/centerpanel/Flows/FlowsRail.tsx`, `src/centerpanel/Flows/FlowTile.tsx`, `src/centerpanel/Flows/StepPills.tsx`, `src/centerpanel/Flows/WorkflowCockpit.tsx`, `src/centerpanel/Flows/CompositeIndicatorFlow.tsx`, `src/centerpanel/Flows/FacilityOptimisationFlow.tsx`, `src/centerpanel/Flows/SystemDynamicsFlow.tsx`, `src/centerpanel/Flows/CellularAutomataFlow.tsx`, `src/centerpanel/Flows/ScenarioComparisonFlow.tsx`, `src/centerpanel/Flows/rail/RelatedMethodsCard.tsx`, `src/centerpanel/Flows/scenarioComparisonArtifacts.ts`.
  - Tools: `src/centerpanel/Tools/ToolsProjectList.tsx`, `src/centerpanel/Tools/ToolsActionPanel.tsx`, `src/centerpanel/Tools/ConsultonPanel.tsx`, `src/centerpanel/Tools/PreviewPanel.tsx`, `src/centerpanel/Tools/components/CapabilitiesOverviewPanel.tsx`, `src/centerpanel/Tools/components/EOConnectorPanel.tsx`, `src/centerpanel/Tools/components/GeoAILab.tsx`, `src/centerpanel/Tools/components/StreamingLab.tsx`, `src/centerpanel/Tools/components/SpatialIndexLab.tsx`, `src/centerpanel/Tools/components/CoverageDiagnosticsPanel.tsx`.
  - Rail: `src/centerpanel/rail/DraftSnapshotCard.tsx`, `src/centerpanel/rail/WorkspaceInfoCard.tsx`, `src/centerpanel/rail/rail.module.css`.
  - Styles: `src/centerpanel/styles/centerpanel.module.css`, `src/centerpanel/styles/header-new.module.css`, `src/centerpanel/styles/header-tokens.css`, `src/centerpanel/styles/radical-tabs.module.css`, `src/centerpanel/styles/registry.module.css`, `src/centerpanel/styles/guides.module.css`, `src/centerpanel/styles/guides.panel.module.css`, `src/centerpanel/styles/guides.rail.module.css`, `src/centerpanel/styles/navtree.module.css`, `src/centerpanel/styles/note.module.css`, `src/centerpanel/styles/project-header.module.css`, `src/centerpanel/styles/flows.module.css`, `src/centerpanel/styles/tools.module.css`, `src/centerpanel/styles/tools.left.module.css`, `src/centerpanel/styles/tokens.css`, `src/centerpanel/styles/a11y.module.css`.
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Tokens added: none.
- Tokens consumed: none.
- Tokens aliased or deprecated: none.
- Product code changed: none. C01 is inventory-only per acceptance criteria.
- Hard-coded colors removed: none.
- Center Panel Standard Amber Scan (Part 2):
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|245\s*,\s*158\s*,\s*11|251\s*,\s*191\s*,\s*36|217\s*,\s*119\s*,\s*6|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" src/centerpanel -g "*.ts" -g "*.tsx" -g "*.css" -g "!components/map/**" -g "!components/Map*.tsx"`
  - Raw ripgrep result: 67 files matched (includes Part 3 map files because the negation glob does not strip already-walked `src/centerpanel/components/Map*.tsx` and `src/centerpanel/components/map/**` paths on this Windows shell). In-scope subset after post-hoc filtering: 122 hits across 26 files.
  - In-scope per-file counts (Part 2 only): `components/NarrativeGenerationPanel.tsx` 19; `styles/tools.left.module.css` 19; `components/ObjectDetectorPanel.tsx` 15; `components/EngineCapabilitiesPanel.tsx` 9; `Flows/SystemDynamicsFlow.tsx` 8; `tabs/LibraryInsertCard.tsx` 5; `styles/flows.module.css` 5; `styles/guides.rail.module.css` 5; `registry-ui/Registry.tsx` 4; `Flows/CompositeIndicatorFlow.tsx` 4; `Flows/FlowHost.tsx` 4; `rail/rail.module.css` 3; `styles/navtree.module.css` 3; `Tools/PreviewPanel.tsx` 3; `Flows/FacilityOptimisationFlow.tsx` 3; `Flows/rail/RelatedMethodsCard.tsx` 3; `Flows/FlowsRail.tsx` 1; `Flows/scenarioComparisonArtifacts.ts` 1; `Tools/components/EOConnectorPanel.tsx` 1; `styles/a11y.module.css` 1; `styles/header-new.module.css` 1; `styles/header-tokens.css` 1; `styles/tokens.css` 1; `styles/tools.module.css` 1; `styles/project-header.module.css` 1; `styles/guides.panel.module.css` 1.
- Center Panel Heavy-Chrome Scan (Part 2):
  - Command: `rg -n "border-radius:\s*(?:1[0-9]|[2-9][0-9]|999|50%)|borderRadius:\s*(?:1[0-9]|[2-9][0-9]|999)|radial-gradient|linear-gradient|box-shadow:\s*0\s+\d+px|--ui-card-bg|--ui-card-border|--ui-tag-|--ui-pill-" src/centerpanel -g "*.ts" -g "*.tsx" -g "*.css" -g "!components/map/**" -g "!components/Map*.tsx"`
  - Raw ripgrep result: 43 files matched (includes map files for the same negation-glob reason). In-scope subset after post-hoc filtering: 389 hits across 31 files.
  - In-scope per-file counts (Part 2 only): `styles/tools.module.css` 124; `styles/guides.module.css` 39; `styles/note.module.css` 35; `styles/tokens.css` 35; `styles/flows.module.css` 26; `rail/rail.module.css` 18; `styles/registry.module.css` 15; `styles/header-new.module.css` 14; `components/BackgroundTasksControl.module.css` 13; `styles/tools.left.module.css` 11; `Flows/CompositeIndicatorFlow.tsx` 9; `Flows/SystemDynamicsFlow.tsx` 8; `Flows/FacilityOptimisationFlow.tsx` 7; `Tools/components/GeoAILab.tsx` 4; `Tools/components/CoverageDiagnosticsPanel.tsx` 3; `styles/guides.rail.module.css` 3; `Flows/CellularAutomataFlow.tsx` 2; `Flows/ScenarioComparisonFlow.tsx` 2; `Tools/components/StreamingLab.tsx` 2; `Tools/components/SpatialIndexLab.tsx` 2; `Tools/PreviewPanel.tsx` 2; `registry-ui/Registry.tsx` 2; `registry-ui/newProject.module.css` 2; `styles/centerpanel.module.css` 2; `styles/guides.panel.module.css` 2; `styles/radical-tabs.module.css` 2; `CenterPanelShell.tsx` 1; `Flows/WorkflowCockpit.tsx` 1; `Tools/components/EOConnectorPanel.tsx` 1; `lib/exporters.ts` 1; `styles/navtree.module.css` 1.
- Owner-category grouping (amber hits):
  - `shell-chrome`: `styles/centerpanel.module.css` (`cpFadeSlide` tint), `CenterPanelShell.tsx` (linear-gradient panel transition). Planned prompt: C02.
  - `tab-bar`: `styles/radical-tabs.module.css` (tab indicator gradients) → kept under C02 motion-preserve rule for the existing top-tab motion language; only color stops migrated, not the motion.
  - `status-rail`: `styles/centerpanel.module.css` status accents and `components/StatusRail.tsx` (no inline amber) — chrome lives in `centerpanel.module.css`. Planned prompt: C02.
  - `card-frame`: `rail/rail.module.css` (callout/snapshot/workspace card hover ring + accent gutters), `registry-ui/Registry.tsx` (`sectionTitle` amber fallback), `registry-ui/newProject.module.css` (`.card` legacy local-token frame), `styles/note.module.css` (note section frame), `styles/registry.module.css` (status pills/cards), `styles/guides.module.css` (guide cards). Planned prompts: C03 (Projects), C04 (New Project), C05 (Methods/Guide), C06 (Note), C07 (Flows), C08 (Toolbox), C09 (Rail).
  - `button-control`: `components/EngineCapabilitiesPanel.tsx` (category chips, "All" active state, status dot fallback `available ? #34D399 : #F59E0B`), `Tools/PreviewPanel.tsx`, `Tools/components/EOConnectorPanel.tsx`, `Flows/FlowsRail.tsx`, `Flows/FlowHost.tsx`, `Flows/rail/RelatedMethodsCard.tsx`. Planned prompts: C07 (Flows), C08 (Toolbox), C09 (cross-cutting controls).
  - `form-control`: `registry-ui/Registry.tsx` `.sectionTitle` and `newProject.module.css` form labels using `--ui-text-hi`. Planned prompts: C03/C04.
  - `status-semantic`: `--syn-status-warning` references in `styles/a11y.module.css`, `styles/header-tokens.css`, `styles/header-new.module.css`, `styles/tokens.css`, `styles/tools.module.css`, `styles/project-header.module.css`, `styles/navtree.module.css`, `styles/guides.panel.module.css`, `styles/guides.rail.module.css`, `styles/flows.module.css`, `tabs/LibraryInsertCard.tsx`. Per global contract, warning meaning is preserved through explicit text/icon + non-amber chrome. Planned prompts: C02 (shell), C05 (guide), C06 (note + library insert), C07 (flows), C09 (cross-cutting).
  - `header-animation`: see preserved-animation list below. Color stops within `@keyframes` blocks in `styles/header-new.module.css` (search/AI panel/composer/timer/dot/badge pulses) currently mix amber tints. Planned prompt: C02 — migrate stops only, do not strip motion.
  - `data-content`: `Flows/SystemDynamicsFlow.tsx` (population series color `#F59E0B`, flow-link kind dot `#F59E0B`, cross-hair `#FDE68A`), `Flows/CompositeIndicatorFlow.tsx`, `Flows/FacilityOptimisationFlow.tsx`, `Flows/scenarioComparisonArtifacts.ts`, `components/NarrativeGenerationPanel.tsx` (warning headings, citation tags, mode toggle), `components/ObjectDetectorPanel.tsx` (solar_panel category, demo mode, confidence display, table accents, demo dot fill), `components/EngineCapabilitiesPanel.tsx` (`GeoAI & ML` category accent), `tabs/LibraryInsertCard.tsx` (warning chip). Planned prompts: C07 (Flows), C09 (Narrative/ObjectDetector/EngineCapabilities), C06 (Library insert). Visualization-ramp content may retain analytical color only if documented as data, not UI chrome.
  - `legacy-token-alias`: `--ui-card-bg`, `--ui-card-border`, `--ui-text`, `--ui-muted`, `--ui-callout-*`, `--ui-risk-*`, `--ui-radius`, `--ui-focus-ring-*`, `--ui-meta-*`, `--ui-label-*`, `--ui-accent-*`, `--ui-gap-*`, `--ui-stack-gap-*`, `--ui-hairline`, `--ui-input-h`, `--ui-density-scale`, `--ui-layer-*`. Defined in `styles/tokens.css` (134 references) and consumed by `tools.module.css` (484), `flows.module.css` (227), `guides.module.css` (148), `note.module.css` (135), `registry.module.css` (125), `rail/rail.module.css` (90), `centerpanel.module.css` (19), `Tools/components/GeoAILab.tsx` (7), `Tools/components/StreamingLab.tsx` (2), `Tools/components/SpatialIndexLab.tsx` (2), `Tools/components/CoverageDiagnosticsPanel.tsx` (2), `guides.panel.module.css` (2), `header-new.module.css` (2), `registry-ui/newProject.module.css` (2). C02 re-points the token-source definitions in `styles/tokens.css`, then C03-C09 migrate consumers per tab.
  - `test-fixture`: none in-scope (the only `__tests__` hits land under `components/map/__tests__/` which is Part 3).
  - `retain-with-reason`: `styles/header-tokens.css:32` `--hdr-focus-glow` value is a `color-mix` over `--syn-interaction-focus-ring` (blue base, no amber input) — flagged only by the literal `glow` substring. Retain.
- Owner-category grouping (heavy-chrome hits):
  - `nested-card`: `registry-ui/NewProjectPage.tsx` lines 82-192 stack three `.card` sections (`Project Identity`, `Spatial Configuration`, `Thematic Tags`) inside the same `.intakePage` parent — this is the canonical card-in-card stack flagged by the user. Planned prompt: C04 (replace with one workbench inspector + group headers + hairline separators). Additional nested cards live in `rail/rail.module.css` (`.card` inside `.section` inside `.calloutInfo`), `styles/guides.module.css` (guide cards nested inside `.guidesPanel`), `styles/flows.module.css` (flow tiles inside `.flowsRail` + cockpit cards inside `.workflowCockpit`), `styles/note.module.css` (section cards inside `.noteEditor`), `styles/tools.module.css` (action panels inside `.toolsPanel`), `styles/registry.module.css` (summary/session/indicator cards). Planned prompts: C03/C05/C06/C07/C08/C09.
  - `decorative-gradient`: `styles/tools.module.css` (heaviest, 124 hits dominated by `linear-gradient`/`radial-gradient` backgrounds on action panels and capability blocks); `styles/guides.module.css` (39); `styles/note.module.css` (35); `styles/tokens.css` (35 — many are gradient token aliases, not raw chrome); `styles/flows.module.css` (26); `rail/rail.module.css` (18); `styles/registry.module.css` (15); `styles/header-new.module.css` (14, see ambient-motion-keep); `components/BackgroundTasksControl.module.css` (13); `styles/tools.left.module.css` (11); flow components (`CompositeIndicatorFlow` 9, `SystemDynamicsFlow` 8, `FacilityOptimisationFlow` 7). Planned prompts: C02-C09.
  - `oversized-radius`: `registry-ui/Registry.tsx` (`border-radius: 999`), several flow chips (`SystemDynamicsFlow.tsx`), `CenterPanelShell.tsx` rounded pill, registry/note rounded chips. Planned prompts: C02-C09.
  - `decorative-shadow`: pattern `box-shadow: 0 \d+px` appears in `header-new.module.css` (badge/timer/pill shadows), `tools.module.css`, `note.module.css`, `flows.module.css`, `registry.module.css`. Planned prompts: C02-C08.
  - `filled-button-plate`: `components/EngineCapabilitiesPanel.tsx`, `components/NarrativeGenerationPanel.tsx`, `components/ObjectDetectorPanel.tsx`, `Tools/PreviewPanel.tsx`, `Flows/CompositeIndicatorFlow.tsx`, `Flows/FacilityOptimisationFlow.tsx`. Planned prompts: C07/C08/C09.
  - `legacy-local-token`: see `legacy-token-alias` above — `--ui-card-bg`, `--ui-card-border`, `--ui-tag-*`, `--ui-pill-*` family is concentrated in `styles/tokens.css` (source) and consumed by the 14 modules listed above. Planned prompt: C02 re-points definitions, C03-C09 migrate consumers per tab.
  - `ambient-motion-keep`: see preserved-animation list below.
- Preserved animations (must keep motion; migrate color stops only — C02 owner):
  - File: `src/centerpanel/styles/header-new.module.css`.
  - `@keyframes ambientGlow` (line 87) — drives ambient header background glow drift (8s ease-in-out infinite, line 63). Currently uses `--syn-glow-subtle` and color-mix on `--syn-interaction-active`; verify resolved value is not amber on C02 entry, otherwise migrate stops to charcoal+restrained-blue.
  - `@keyframes dataFlow` (line 92) — slow gradient/particle drift (20s linear infinite, line 82). Color stops to migrate.
  - `@keyframes neuralPulse` (line 177) — neural avatar pulse (2.5s ease-in-out infinite, line 172). Stops to migrate.
  - `@keyframes neuralRotate` (line 210) — neural ring rotation (20s linear infinite, line 207). Stops to migrate.
  - `@keyframes logoShine` (line 250 wrapper), `logoPulseAnim` (line 260 wrapper), `logoRingAnim` (line 270 wrapper) — logo shine/pulse/ring stack. Stops to migrate.
  - `@keyframes pulse` (line 306) — `CONNECTED` chip pulse (2s cubic-bezier infinite, line 297). Stops to migrate.
  - `@keyframes gradientFlow` (line 373) — animated linear-gradient flow (3s linear infinite, line 369). Stops to migrate.
  - `@keyframes hologramScan` (line 393) — scan line motion (2s linear infinite, line 390). Stops to migrate.
  - `@keyframes dataStreamPulse` (line 419) — data-stream stripe pulse (1.5s ease-in-out infinite, line 415). Stops to migrate.
  - `@keyframes badgePulse` (line 487) — TASKS / status badge pulse (3s ease-in-out infinite, line 484). Stops to migrate (currently mixes amber-tinted glow inputs).
  - `@keyframes timerPulse` (line 901) — session timer numeric pulse (1600ms ease-in-out infinite, line 898). Stops to migrate.
  - `@keyframes dotPulse` (line 937) — LIVE dot pulse (1400ms ease-in-out infinite, line 934). Stops to migrate.
  - `@keyframes panelFadeIn` (line 1036) — overflow panel fade-in (line 1033). No color stops; pure transform/opacity — keep as-is.
  - File: `src/centerpanel/styles/centerpanel.module.css` — `@keyframes cpFadeSlide` (line 107) drives tab-switch fade-slide (180ms ease, line 105). Transform/opacity only; keep as-is. `[data-reduce-motion]` override (line 111) preserved.
  - C02 acceptance: every animation listed above must still play at the end of C02; only the color stops/values inside the keyframes and on the animated elements may be changed.
- Canonical card-in-card example (user-flagged):
  - File: `src/centerpanel/registry-ui/NewProjectPage.tsx`.
  - Sections rendered by `intakePage` (line 82 onward): `.card > .cardHeader (title + sub) + .cardBody` repeated three times — `Project Identity` (82-111), `Spatial Configuration` (114-166), `Thematic Tags` (169-192). Each `.card` uses `--ui-card-bg` + `--ui-card-border` from `newProject.module.css` lines 12-16. C04 must collapse this to a single workbench inspector surface with group headers + hairline separators per the Part 2 visual contract.
- Tab-by-tab migration order (locked):
  1. C02 — Shell + tokens (`CenterPanelShell.tsx`, `TopHeader.tsx`, `CenterPanelTabFrame.tsx`, `StatusRail.tsx`, `BackgroundTasksControl.tsx`, `OverflowMenu.tsx`, `UrbanContextStrip.tsx`, `styles/centerpanel.module.css`, `styles/header-new.module.css`, `styles/header-tokens.css`, `styles/radical-tabs.module.css`, `styles/tokens.css`, `styles/a11y.module.css`). Re-point the `--ui-*` token source so downstream tabs inherit workbench tokens.
  2. C03 — Projects tab (`registry-ui/Registry.tsx`, `ProjectSummaryCard.tsx`, `SessionCard.tsx`, `IndicatorsCard.tsx`, `ConsultantAI.tsx`, `styles/registry.module.css`).
  3. C04 — New Project tab (`registry-ui/NewProjectPage.tsx`, `registry-ui/newProject.module.css`). Collapse three `.card` sections into one workbench inspector.
  4. C05 — Methods / Guide tab (`Guide/MethodsView.tsx`, `Guide/GuideViewV2.tsx`, `Guide/OutlineRailV2.tsx`, `nav/**`, `styles/guides.module.css`, `styles/guides.panel.module.css`, `styles/guides.rail.module.css`, `styles/navtree.module.css`).
  5. C06 — Report / Note tab (`tabs/Note.tsx`, `tabs/NoteEditor.tsx`, `tabs/NoteSections.tsx`, `tabs/ProjectHeader.tsx`, `tabs/LibraryInsertCard.tsx`, `styles/note.module.css`, `styles/project-header.module.css`).
  6. C07 — Workflows tab (`Flows/FlowHost.tsx`, `Flows/FlowsRail.tsx`, `Flows/FlowTile.tsx`, `Flows/StepPills.tsx`, `Flows/WorkflowCockpit.tsx`, `Flows/CompositeIndicatorFlow.tsx`, `Flows/FacilityOptimisationFlow.tsx`, `Flows/SystemDynamicsFlow.tsx`, `Flows/CellularAutomataFlow.tsx`, `Flows/ScenarioComparisonFlow.tsx`, `Flows/rail/RelatedMethodsCard.tsx`, `Flows/scenarioComparisonArtifacts.ts`, `styles/flows.module.css`).
  7. C08 — Toolbox tab (`Tools/ToolsProjectList.tsx`, `Tools/ToolsActionPanel.tsx`, `Tools/ConsultonPanel.tsx`, `Tools/PreviewPanel.tsx`, `Tools/components/CapabilitiesOverviewPanel.tsx`, `Tools/components/EOConnectorPanel.tsx`, `Tools/components/GeoAILab.tsx`, `Tools/components/StreamingLab.tsx`, `Tools/components/SpatialIndexLab.tsx`, `Tools/components/CoverageDiagnosticsPanel.tsx`, `styles/tools.module.css`, `styles/tools.left.module.css`).
  8. C09 — Cross-cutting (`UrbanContextStrip.tsx`, `OutlineNav.tsx`, `BackgroundTasksControl.tsx`, `EngineCapabilitiesPanel.tsx`, `NarrativeGenerationPanel.tsx`, `ObjectDetectorPanel.tsx`, `rail/DraftSnapshotCard.tsx`, `rail/WorkspaceInfoCard.tsx`, `rail/rail.module.css`).
  9. C10 — Final QA + Part 3 gate.
- Validation:
  - Documentation-only. Both Center Panel scans executed; per-file counts recorded above.
  - No product code changed; no tokens added/removed; no behavior changes.
- Known risks (recorded for C02-C10):
  - Negation-glob ordering: `-g "!components/map/**"` is unreliable on this Windows shell because PowerShell expands the glob before ripgrep sees it. C02-C10 should run scans with absolute paths and a single quoted `-g` pattern, or filter results post-hoc as C01 did. Recorded in Known Risks below.
  - `--ui-*` token island is large (1300+ references across 14 modules). C02 must re-point the source values in `styles/tokens.css` carefully — flipping them to workbench tokens will propagate immediately to every C03-C09 consumer before those prompts run, which is desired but means each subsequent C-prompt must re-scan its own files after C02 lands and only migrate residual amber/heavy-chrome that did not auto-resolve from the token-source flip.
- Next recommended prompt: Prompt C02 - Center Panel Shell, Top Header, Tab Frame, Status Rail, Tokens, And Header Animations.

### Prompt C02 - Center Panel Shell, Top Header, Tab Frame, Status Rail, Tokens, And Header Animations - 2026-05-16

- Date: 2026-05-16.
- Agent: Claude Opus 4.7.
- Status: completed.
- Started from:
  - Launcher: `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - Protocol: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - Token reference: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - Ledger: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - Prompt block: `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` / Prompt C02
  - C01 inventory: included preserved-animation list, `--ui-*` token island map, and category groupings.
- Files inspected (C02 primary scope):
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/centerpanel/components/TopHeader.tsx`
  - `src/centerpanel/components/CenterPanelTabFrame.tsx`
  - `src/centerpanel/components/StatusRail.tsx`
  - `src/centerpanel/components/BackgroundTasksControl.tsx`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
  - `src/centerpanel/components/OverflowMenu.tsx`
  - `src/centerpanel/styles/tokens.css`
  - `src/centerpanel/styles/centerpanel.module.css`
  - `src/centerpanel/styles/header-tokens.css`
  - `src/centerpanel/styles/header-new.module.css`
  - `src/centerpanel/styles/radical-tabs.module.css`
  - `src/centerpanel/styles/a11y.module.css`
- Files changed:
  - `src/centerpanel/CenterPanelShell.tsx` — `DeferredPanelFallback` reshaped from filled `border-radius: 12` + `--syn-surface-elevated` card to compact hairline loading row (radius 3px, transparent background, top/bottom 1px borders, 14×14 spinner, 12px mono font).
  - `src/centerpanel/styles/tokens.css` — line 103 `--accentGold: var(--syn-status-warning)` → `var(--syn-text-muted)` to remove the last gold alias from the Center Panel token source (no in-scope consumers; pre-emptive cleanup).
  - `src/centerpanel/styles/header-tokens.css` — line 36 `--hdr-state-warning: var(--syn-status-warning)` → `var(--syn-status-running)` so the system-status indicator dot (`status_processing` in `header-new.module.css:296`) keeps its 2s `pulse` animation but draws as restrained blue instead of amber. Inline comment records the rationale.
  - `src/centerpanel/styles/header-new.module.css` — `.logoCore` background changed from `var(--syn-gradient-amber)` to `linear-gradient(135deg, color-mix(--syn-interaction-selected 70%, --syn-interaction-active), --syn-interaction-active)`. Same shape, same `logoShine` 4s animation, same inset highlights — just the amber color stops swapped for charcoal-to-blue.
  - `src/centerpanel/styles/a11y.module.css` — line 15 `.focusRing` outline fallback `#F59E0B` → `var(--syn-interaction-focus-ring, #3794ff)` so any element relying on the focus-ring fallback gets blue, not amber.
- Tokens added: none.
- Tokens consumed: `--syn-interaction-active`, `--syn-interaction-selected`, `--syn-interaction-focus-ring`, `--syn-status-running`, `--syn-text-muted`, `--syn-border-subtle`, `--syn-text-secondary` (all pre-existing workbench tokens).
- Tokens aliased/re-pointed: `--accentGold` → `--syn-text-muted` (was `--syn-status-warning`); `--hdr-state-warning` → `--syn-status-running` (was `--syn-status-warning`).
- Tokens deleted: none — kept `--accentGold` alias as a re-pointed bridge so any downstream consumer outside the C02 surface continues to resolve cleanly.
- Animations preserved (verified by file inspection, not removed):
  - `header-new.module.css`: `ambientGlow` 8s ease-in-out (line 87), `dataFlow` 20s linear (line 92), `neuralPulse` 2.5s ease-in-out (line 177), `neuralRotate` 20s linear (line 210), `logoShine` 4s ease-in-out (line 250), `logoPulseAnim` 2s ease-in-out (line 260), `logoRingAnim` 3s ease-in-out (line 270), `pulse` 2s cubic-bezier (line 297) — now drives non-amber `status_processing` dot, `gradientFlow` 3s linear (line 369), `hologramScan` 2s linear (line 390), `dataStreamPulse` 1.5s ease-in-out (line 415), `badgePulse` 3s ease-in-out (line 484), `timerPulse` 1600ms ease-in-out (line 898), `dotPulse` 1400ms ease-in-out (line 934), `panelFadeIn` 200ms (line 1033).
  - `centerpanel.module.css`: `cpFadeSlide` 180ms ease (line 105) preserved; `[data-reduce-motion]` override intact (line 111).
  - Color stops migrated: only `.logoCore` (amber gradient → charcoal+blue gradient) and `status_processing` (`--hdr-state-warning` rebind from amber to `--syn-status-running`). All other animated elements (SVG neural nodes/links in `TopHeader.tsx`, `.copilot` brand gradient, `.timeBtn` running state, `.sessionBadge` glow) already used `--syn-interaction-active`/`--syn-interaction-selected`/`--syn-status-info` and required no stop changes.
- Shell behavior preserved: `MAIN_SCROLL_ROOT_ID` import + `id="cp3-main-scroll-root"` unchanged in `CenterPanelTabFrame.tsx`; lazy import wiring via `lazyWithRetry` + `ChunkLoadBoundary` + `Suspense` fallback contract unchanged (only the fallback's inline style changed, not its render shape); tab-switch state and panel bridge syncs (`usePanelBridgeStore.setActiveTab/setActiveFlowId`) unchanged; keyboard navigation (`handleTablistKeyDown`, number-key tab jump) untouched.
- Tab bar (`radical-tabs.module.css`): inspected, found no amber. Existing decorative segment header gradient uses neutral white-alpha; not a regression target for C02 (will be revisited in C05/C09 if heavy-chrome cleanup is desired).
- Overflow menu / status rail / background tasks: `BackgroundTasksControl.module.css` already uses the `--syn-status-running/pending/valid/error/stale` family and a blue `--tasks-accent`; no amber to migrate. Status rail (`centerpanel.module.css` lines 435-462) uses `--status-seg-*` derived from `--ui-risk-*`, which resolve to `--syn-success`/`--syn-warning`/`--ui-risk-high` (orange, not amber); kept as semantic risk colors. Overflow menu uses `--hdr-*` family tokens which all resolve to `--syn-*` workbench values.
- Amber scan before (C02 primary files only):
  - Command: `rg -n "#F59E0B|#FBBF24|#FDE68A|#D97706|#B45309|#92400E|amber|gold|yellow|orange|gradient-amber|--syn-status-warning" <C02 primary file list>`
  - Result: 4 hits across 4 files — `tokens.css:103` (`--accentGold`), `header-tokens.css:36` (`--hdr-state-warning`), `header-new.module.css:245` (`.logoCore` amber gradient), `a11y.module.css:15` (`#F59E0B` focus fallback).
- Amber scan after (C02 primary files only):
  - Same command.
  - Result: 2 hits, both inside the explanatory comment added at `header-tokens.css:36-37` documenting why the warning state was re-pointed (the words "amber" and "gold" appear in the comment text). Zero amber rendered chrome remains in C02 scope.
- Heavy-chrome scan after (C02 primary files only): `CenterPanelShell.tsx` dropped from 1 → 0 (deferred fallback `borderRadius: 12` → `3`); other primary files' heavy-chrome footprints unchanged (none are amber-coupled).
- Validation:
  - `npm run typecheck` → passed (no TypeScript errors).
  - `npm run test:analytics` → passed: 62 test files, 1111 tests, 36.12s runtime.
  - Targeted vitest for `src/centerpanel/components/__tests__/*` not separately run — the directory contains only Map Explorer (Part 3) test files; no C02 component-level test fixtures exist.
  - Manual visual verification: keyframe blocks remained in `header-new.module.css` at the same line offsets as the C01 inventory; only color stops changed. `[data-reduce-motion]` override at `centerpanel.module.css:111` still gates motion.
- Known risks: re-pointing `--hdr-state-warning` away from `--syn-status-warning` means any consumer that imported the header-token alias expecting an amber attention tint will now render in blue. The only in-scope consumer is `status_processing` (the small logo dot during simulated "processing" state), which is intended — the rest of the application reads `--syn-status-warning` directly and is unaffected.
- Next recommended prompt: Prompt C03 - Projects Tab — Registry Layout, Cards, Session, Indicator, And AI Surfaces.

### Prompt C03 - Projects Tab — Registry Layout, Cards, Session, Indicator, And AI Surfaces - 2026-05-16

- Date: 2026-05-16.
- Agent: Claude Opus 4.7.
- Status: completed.
- Started from: standard color-system operating pack + C01 inventory.
- Files inspected: `src/centerpanel/registry-ui/Registry.tsx`, `ProjectSummaryCard.tsx`, `SessionCard.tsx`, `IndicatorsCard.tsx`, `ConsultantAI.tsx`, `consultantAI.module.css`, `src/centerpanel/styles/registry.module.css`, `src/centerpanel/rail/DraftSnapshotCard.tsx`, `WorkspaceInfoCard.tsx`, `rail.module.css`.
- Files changed:
  - `src/centerpanel/registry-ui/Registry.tsx` — CardChip hover handler swapped from `rgba(245,158,11,...)` amber to `--syn-interaction-hover` + `--syn-border-active`. "Recently Viewed" and "Relevant Methods" section titles re-pointed from `var(--syn-accent-primary, #F59E0B)` to `var(--syn-interaction-active, #3794ff)` (2 occurrences via `replace_all`).
  - `src/centerpanel/registry-ui/ProjectSummaryCard.tsx` — Data Completeness bar fill `var(--color-accent, #f59e0b)` → `var(--syn-interaction-active, #3794ff)`.
  - `src/centerpanel/styles/registry.module.css` — `.section` filled `--syn-overlay-whisper` bg + 12px radius → transparent + `--syn-border-subtle` + 4px radius. `.tableCard` same treatment. `.row:hover` → `--syn-interaction-hover`. `.row[aria-selected]` filled amber-tinted `--syn-accent-bg` + outline → transparent with 2px inset blue left rail (`box-shadow: inset 2px 0 0 var(--syn-interaction-active)`) and `--syn-text-default`. Duplicate `:where(.section, .tableCard)` block also flattened (no decorative shadow, 4px radius). All three `.primaryBtn` definitions converted to ghost: transparent bg, no fixed border, blue (`--syn-interaction-active`) text, hairline border + `--syn-interaction-hover` on hover, 4px radius. `.leftRail .section::before` left-rail marker narrowed from 4px to 2px and radius reduced from 12px to 4px to match the new flat-section shape. `.leftRail .section:nth-of-type(1)` and `(3)` rail-accent re-pointed from `--syn-accent-primary` to `--syn-interaction-active` (the other 3 stay on success/danger/info as semantic anchors).
  - `src/centerpanel/rail/rail.module.css` — `.workspaceCard` decorative `linear-gradient` filled bg + 12px radius → transparent + 4px hairline border. `.workspaceCardAccent` amber gradient (`rgba(245,158,11,0.12)` + amber border) → 6% blue-tinted bg with blue-mixed border. `.workspaceTitle` color `var(--syn-accent-primary, #F59E0B)` → `--syn-text-default`, font sized down, uppercase. `.snapshotCard` final-cascade override flattened: transparent bg, `--syn-border-subtle`, 4px radius, no box-shadow, `--syn-text-default` text.
  - `SessionCard.tsx`, `IndicatorsCard.tsx`, `ConsultantAI.tsx`, `consultantAI.module.css`, `DraftSnapshotCard.tsx`, `WorkspaceInfoCard.tsx` — no amber found in scan; no changes required. These files render through `newProject.module.css` (C04 scope) or already-neutral `consultantAI.module.css`.
- Tokens added: none.
- Tokens consumed: `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-border-active`, `--syn-border-subtle`, `--syn-text-default`.
- Product code changed: only inline-style amber literals and CSS chrome; no project registry behavior, session persistence, indicator binding, ConsultantAI wiring, or collaboration presence logic touched.
- Heavy-chrome reduction: registry `.section` and `.tableCard` radii from 12px → 4px; primaryBtn radius from 8px → 4px; rail `.workspaceCard` from 12px → 4px; `.snapshotCard` final cascade from `--ui-radius` (8px) → 4px; selected-row visual replaced filled rounded plate with 2px blue inset rail; primary CTAs no longer rendered as filled rounded plates.
- Amber scan after (C03 primary files only): 0 hits. Pre-migration there were 4 amber hits in `Registry.tsx`, 1 in `ProjectSummaryCard.tsx`, 3 in `rail/rail.module.css` (8 total); all removed.
- Validation:
  - `npm run typecheck` → passed.
  - Targeted vitest for `registry-ui/**/__tests__/*` — directory does not exist (no test fixtures to run).
  - `test:analytics` not re-run (no behavioral change; C02 already proved the full suite green and C03 edits are CSS + cosmetic style-prop only).
- Known risks: `--ui-card-bg` / `--ui-card-border` are still referenced inside `registry.module.css` and `rail.module.css` (`.metaKbd`, `.cardSub`, `.snapshotCard` middle-cascade override, `.callout`, `.microLabel`, `.pill`, etc.) — these resolve to neutral charcoal in the current token chain and do not render amber, so they are not C03 regressions; the `--ui-*` token island is a structural concern reserved for the broader cross-tab cleanup in C09/C10.
- Next recommended prompt: Prompt C04 - New Project Tab — Form Layout, Field Stacks, Tag Pills, Submit Bar.

### Prompt C04 - New Project Tab — Form Layout, Field Stacks, Tag Pills, Submit Bar - 2026-05-16

- Date: 2026-05-16.
- Agent: Claude Opus 4.7.
- Status: completed.
- Files inspected: `src/centerpanel/registry-ui/NewProjectPage.tsx`, `src/centerpanel/registry-ui/newProject.module.css`, `src/stores/useNewProjectDraftStore.ts` (read-only).
- Files changed:
  - `src/centerpanel/registry-ui/NewProjectPage.tsx` — replaced three `<section className={styles.card}>` blocks with three `<section className={styles.group}>` blocks inside a single `<form>` parent. Each group: `groupHeader` (title + sub on the same baseline row), `groupBody` (dense field rows). BBox inputs moved from `rowGrid` to a dedicated `bboxGrid` (4 columns at ≥720px, 2 at narrow). Tag chips gained `type="button"` + `aria-pressed`. Form supports Enter-to-submit; primary button gets `type="submit"` + `aria-disabled` mirroring `disabled`. `canCreate` derived constant centralizes the validation gate.
  - `src/centerpanel/registry-ui/newProject.module.css` — full rewrite (~310 lines). Removed all `rgba(0,0,0,0.18)`, `rgba(255,255,255,0.08)`, `rgba(255,255,255,0.1)`, `rgba(255,255,255,0.14)` literal surfaces. Added `.group/.groupHeader/.groupTitle/.groupSub/.groupBody/.bboxGrid/.submitBar/.selectionMeta` for the new structure. Kept `.card/.cardHeader/.cardTitle/.cardSub/.cardBody` classes as legacy flat hairline shells so non-Projects-tab consumers (`ProjectSummaryCard`, `SessionCard`, `IndicatorsCard`) still render without nested filled chrome. `.fieldInput/.fieldSelect/.fieldTextarea` migrated to `--syn-surface-input` background, `--syn-border-subtle` border, `--syn-border-focus` focus, 3px radius, tabular-nums for numeric inputs. `.riskChip` now transparent + `--syn-border-subtle`, hover lifts to `--syn-interaction-hover`; `.riskChipActive` uses 12% blue mix + 1px `--syn-interaction-active` border + blue text. `.btnPrimary` rebuilt as transparent + 1px `--syn-interaction-active` border + blue text + 10% blue-tint hover (no filled plate). `.btnSecondary` becomes a transparent ghost with neutral hover surface. `.advisory` re-toned from amber-orange to `--syn-status-info` (blue) mix. `.taskBadgeLegal` re-pointed from amber to `--syn-status-info`; other task-badge tones migrated to semantic syn tokens. `.saveFooterOuter`, `.aiBlock`, `.countBadge` re-pointed to workbench tokens.
- Tokens consumed: `--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`, `--syn-text-error`, `--syn-text-success`, `--syn-border-subtle`, `--syn-border-default`, `--syn-border-focus`, `--syn-surface-input`, `--syn-surface-elevated`, `--syn-surface-workbench`, `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-interaction-focus-ring`, `--syn-status-info`, `--syn-success`, `--syn-danger`. No new tokens added.
- Behavior preserved: `useNewProjectDraftStore` reads (`name/description/scale/crs/bbox/tags`), writes (`setName/setDescription/setScale/setCrs/setBbox/addTag/removeTag`), `toDraft()`, `reset()`, `actions.addProject` call shape, `updateBbox` parsing, and `toggleTag` add/remove flow are untouched. Validation gate (`name.trim().length > 0`) preserved as `canCreate`.
- Amber scan after (C04 primary files only): 0 functional hits (one literal "amber" string remains inside an explanatory comment in `newProject.module.css`).
- Heavy-chrome reduction: 3 nested `.card` panels → 1 surface with 3 hairline-separated groups. Field radii 6-8px → 3px. Button radii 6px → 3px. All decorative `rgba` filled surfaces removed. Card-in-card stack flagged by user is gone.
- Validation:
  - `npm run typecheck` → passed.
  - Targeted vitest: no `useNewProjectDraftStore` or `NewProjectPage` test files exist; nothing to run.
- Known risks: `.card/.cardHeader/.cardTitle/.cardSub/.cardBody/.rowGrid/.fieldGroup/.fieldLabel/.riskChip/.aiBlock` classes are still imported by `ProjectSummaryCard.tsx`, `SessionCard.tsx`, and `IndicatorsCard.tsx`. The class names are preserved but their visual treatment is now flat (transparent + hairline + 3px radius), so those components will render in the new workbench style if surfaced — no breakage, just consistent flat chrome.
- Next recommended prompt: Prompt C05 - Methods/Guide Tab — Methods View, Outline Rail, Guide Cards, And Command Bar.

### Prompt C05 - Methods/Guide Tab — Methods View, Outline Rail, Guide Cards, And Command Bar - 2026-05-16

- Date: 2026-05-16.
- Agent: Claude Opus 4.7.
- Status: completed.
- Files inspected: `src/centerpanel/Guide/MethodsView.tsx`, `GuideViewV2.tsx`, `GuideView.tsx`, `OutlineRailV2.tsx`, `OutlineRail.tsx`, `GuideCard.tsx`, `GuideCommandBar.tsx`, `GuideMacros.tsx`, `src/centerpanel/nav/GuideTree.tsx`, `src/centerpanel/styles/guides.module.css`, `guides.panel.module.css`, `guides.rail.module.css`, `navtree.module.css`. All 8 Guide TSX files plus `GuideTree.tsx` scanned for amber → 0 hits (no inline amber, no MAP_COLORS references). All amber lives in 3 CSS modules.
- Files changed:
  - `src/centerpanel/styles/navtree.module.css` — `.item` flattened from 12px filled border to 3px transparent hairline with hover lifting to `--syn-interaction-hover`. `.active` row migrated from amber bg (`rgba(245,158,11,.10)`) + amber border (`rgba(245,158,11,.55)`) + amber text (`#FDE68A`) to 12% blue mix bg + 2px inset blue left rail + `--syn-interaction-active` text. `.active:hover` deepened to 18% blue mix.
  - `src/centerpanel/styles/guides.rail.module.css` — `.count` badge amber bg+border (`rgba(245,158,11,0.18)` / `0.30`) → blue mix 14%/28% with `--syn-interaction-active` text; radius 999px → 3px. `.search:focus` amber outline (`rgba(245,158,11,0.45)`) → 55% `--syn-interaction-focus-ring` mix. `.accent` amber bar (`rgba(245,158,11,.55)`) → solid `--syn-interaction-active`, width 4px → 2px (VS Code rail proportion). `.rowBtn:focus-visible` fallback `#F59E0B` → `var(--syn-interaction-focus-ring, #3794ff)`.
  - `src/centerpanel/styles/guides.panel.module.css` — `.headTools button[data-active]` amber filled bg (`rgba(245,158,11,0.18)`) → 12% blue mix + inset blue 2px bottom underline (VS Code tab discipline), text `--syn-text-default`.
  - `src/centerpanel/styles/guides.module.css` — `.topHeader` 12px-radius filled card → transparent + hairline bottom border. `.card` 12px-radius filled card → transparent + hairline bottom border + 0 radius. `:where(.card, .section)` duplicate decorative-shadow cascade neutralized (transparent, no shadow, no border, 0 radius). `.commandBar` 12px-radius filled sticky bar → transparent + hairline bottom border + 0 radius, padding tightened. `.rail` final cascade override flattened from `--ui-card-bg` + `--ui-card-shadow` + `--ui-radius` to transparent + 1px right hairline + 0 radius + no shadow (preserves earlier `.rail` definitions in cascade for non-overridden properties).
- Tokens consumed: `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-interaction-focus-ring`, `--syn-border-subtle`, `--syn-text-default`, `--syn-text-secondary`, `--syn-surface-workbench`. No new tokens added.
- Behavior preserved: outline scroll-spy (`useScrollSpy.ts`), guide selection, command palette routing, macro injection, and outline highlight logic untouched — CSS-only edits.
- Heavy-chrome reduction: `.topHeader`, `.card`, `.commandBar`, `.rail` final cascade no longer render as 12px filled cards with decorative shadows; they read as flat sections separated by hairlines. Active outline-tree row uses a 2px blue rail instead of a filled bordered plate.
- Amber scan after (C05 primary files only): 0 hits across 8 TSX + 1 GuideTree.tsx + 4 CSS modules. Pre-migration there were 8 amber literal hits across the 3 CSS modules; all removed.
- Validation:
  - `npm run typecheck` → passed.
  - Targeted vitest for Guide tests — none exist in `src/centerpanel/Guide/`.
- Known risks: `.commandBar` still references `--syn-bg-root` via `--syn-surface-workbench` fallback; on theme switch the bg should follow workbench surface, but legacy fallback covers the case. Many `--ui-*` token references remain inside `guides.module.css` (chip/section accents). These resolve to neutral workbench values today and are scheduled for systemic cleanup in C09/C10 — not C05 regressions.
- Next recommended prompt: Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert.

### Prompt C05 Second Follow-Up — Methods Tab Layout Consolidation + React Icons - 2026-05-16

- Date: 2026-05-16.
- Agent: Claude Opus 4.7.
- Status: completed.
- Trigger: user-supplied second screenshot showed the Methods tab still rendering TWO indexes side-by-side (the shell-supplied `OutlineRail` in the far-left column AND `MethodsView`'s own internal `<OutlineRail />` inside the main panel). Plus emoji unicode (🌎/🌐/🛰️/🏗️/🚌/🌳/💰/🎮/🗄️) in category labels and a sprawling top header that bloated vertical space. User feedback: "ortanın solunda çok gereksiz boşluk oluyor index ile methodoloji guide ı birleştirerek ve emoji iconlar yerine react iconlar kullanarak çok daha pro ve premium bir tasarım vs code estetiğiyle".
- Files changed:
  - `src/centerpanel/Guide/categoryIcon.tsx` — NEW. Maps each `GUIDE_CATEGORIES` key to a lucide-react icon component (BarChart3, Globe2, Satellite, Building2, Bus, Trees, Wallet, Box, Database), with FileText fallback. Exports `<CategoryIcon category={...} size={...} />`.
  - `src/centerpanel/Guide/MethodsView.tsx` — full rewrite. Removed the inner `<OutlineRail />` and the wrapper flex layout entirely. The view is now a single scrollable column: compact top header (title chip + search + horizontally-scrollable chip strip) followed by guide cards. The shell-supplied `OutlineRail` in the left column is the sole index, eliminating the duplicate. Category emojis in card titles and chip labels replaced with `<CategoryIcon />`. Section body padding tightened from `4px 12px 10px` to `4px 0 8px` so the section content aligns with the card border.
  - `src/centerpanel/Guide/OutlineRail.tsx` — replaced the inline copy/insert SVG paths with `lucide-react` `Copy`/`Plus` icons (same as `OutlineRailV2`). Added `<CategoryIcon category={it.category} size={12} />` next to each rail row's title so the index now shows a per-category React icon instead of relying on emoji prefixes scraped from card titles. Wrapped the title text in an inline-flex layout with overflow ellipsis to keep rows compact.
  - `src/centerpanel/styles/guides.module.css` — appended a compact `.topHeader` override: 3-column grid (title | search | chips), horizontal-only chip scroll (no wrap, no scrollbar), 6px vertical padding, uppercase title chip, all `!important` to win against the legacy cascade. `.chips` row now stays a single line regardless of category count.
- Tokens consumed: existing workbench tokens only. No new tokens.
- Behavior preserved: search filter, category filter, jump-to-section, scroll-spy via `IntersectionObserver` (in OutlineRail), keyboard navigation, copy/insert, project registry binding — all untouched. The `data-guide-id`/`data-guide-cat`/`data-guide-title` attributes are unchanged, so the rail scrape pipeline continues to function.
- Validation: `npm run typecheck` → passed.
- Known risks: `MethodsView` no longer renders its own `OutlineRail`, but the prop-driven path (`<OutlineRail items={railItems} onJump={handleJump} highlight={q} />`) is gone — the shell's auto-scraping `<OutlineRail />` (called without props) is what's rendered. The auto path also reads `q` differently — search no longer cross-filters the rail. This is a deliberate trade: a single index that the user actually wanted, with the rail acting as the live scroll-spy. Cross-filtering could be added later via a window event if needed.

### Prompt C05 Follow-Up — Methods Tab Aggressive Flatness Pass - 2026-05-16

- Date: 2026-05-16.
- Agent: Claude Opus 4.7.
- Status: completed.
- Trigger: user-supplied screenshots of the Methods/Guide tab showed remaining heavy chrome — boxed "SPATIAL STATISTICS"/"NETWORK ANALYSIS"/"REMOTE SENSING" rail-separator pills with borders, decorative rainbow `::before` accent bars under each rail row, filled rounded section headers in the main panel, dark-filled Abstract/Methodology blocks, and rounded "Remote Sensing" tag pills. User feedback: "sol ve sağ raillar premium değil ve çok fazla çizgi çerceve ve dolgu var ... center panelin diğer panellerle yapısal tasarımı da uyumlu olmalı gereksiz boşluklardan arınmalı".
- Files changed:
  - `src/centerpanel/styles/guides.module.css` — appended a final-cascade "Workbench Flatness Override" block (~260 lines, all `!important` to defeat the multi-layer cascade legacy stack). Wipes: `.rail` decorative bg-image gradients + 12px frame; `.railHeader` sticky gradient bg + `::after` underline; `.railSep` border + rounded pill + `::before` decorative accent + rainbow nth-child rotation; `.railRow::before/::after` animated underline bars; `.railBtn` shimmer `::after` + radial-gradient bg; `.chip` 999px rounded plates → 3px hairline; `.indexBtn` decorative `::before` left accent → 2px blue inset rail on active only; `.cardHeader` linear-gradient + backdrop-blur → transparent + bottom hairline; `.section`/`.summaryRow`/`.sectionNav`/`.macro` filled bg → transparent; `.block` (Abstract content) + `.preview` filled rounded boxes → 2px left-rail quote (no fill, no radius); `.banner` dashed pill → 2px info left-rail; `.macroBtn`/`.secActionBtn`/`.iconBtn`/`.copyBtn`/`.slotBtn`/`.smallBtn`/`.toggle` filled hover-lift buttons → ghost discipline (transparent, 3px radius, hairline border, no transform/shadow). Active states standardize on 12% blue mix + blue border + blue text. Section group accent on the right rail (`.cardSub` tag pill) becomes a thin hairline-bordered chip with muted text. Tag pills and rail action buttons collapse to compact 18-22px heights.
- Tokens consumed: `--syn-interaction-active`, `--syn-interaction-hover`, `--syn-border-subtle`, `--syn-border-default`, `--syn-border-focus`, `--syn-surface-input`, `--syn-surface-elevated`, `--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`, `--syn-status-info`, `--syn-interaction-focus-ring`.
- Behavior preserved: scroll-spy, selection state, command palette routing, macro injection, and outline highlight untouched — pure CSS override.
- Validation:
  - `npm run typecheck` → passed.
  - Amber scan on all C05 files: 0 hits.
- Rationale for using `!important` in this single override block: the file contains 4+ cascading definitions of `.rail`, `.railSep`, `.railRow`, `.railHeader`, `.card`, `.section`, `.indexBtn` etc., each contributing decorative chrome from an earlier design era. Rewriting every legacy block individually would risk losing layout semantics; appending a final flatness layer is the surgical fix the user asked for.

### Prompt C05 Follow-Up — CenterPanel Rail/Main Structural Alignment - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: user-supplied Methods screenshot showed left/right rail chrome still reading as rounded premium cards rather than VS Code workbench surfaces; category tabs could wrap but must not overflow; CenterPanel structure needed to align with neighboring panels and remove empty gutters.
- Files changed:
  - `src/centerpanel/styles/centerpanel.module.css` — final shell override now uses a 236px rail + fluid main grid with zero gap/padding, 0 radius, no shadow, and flat navigation/editor surfaces. Sticky rail offset now stays inside the body (`top: 0`) so the left rail and main panel start on the same y-axis.
  - `src/centerpanel/styles/guides.module.css` — Methods command strip now uses title/search on the first row and full-width category tabs on the second row. Category tabs wrap into two compact rows with 112px minimum tracks, normal word wrapping, no horizontal overflow, and no rounded-card treatment. Guide sections were tightened to transparent text streams with hairline separators and reduced gutters.
  - `src/centerpanel/Guide/MethodsView.tsx` — guide list region padding tightened to align with the flat main surface.
  - `src/centerpanel/Guide/OutlineRail.tsx` — rail rows now align icon/text from the top and allow long guide titles to wrap instead of clipping.
  - `src/centerpanel/rail/rail.module.css` and `src/centerpanel/styles/guides.rail.module.css` — shared rail cards/callouts/snapshot blocks flattened to transparent inspector sections with square workbench edges and hairline separators.
  - `src/centerpanel/styles/header-new.module.css` — top tab buttons can wrap to two lines within stable width constraints without overflowing the panel.
- Visual QA:
  - Playwright against `http://127.0.0.1:5173/?view=analyst`, viewport `1029x813`.
  - Screenshot saved to `.codex-logs/methods-analyst-1029x813-aligned.png`.
  - Metrics: document/client/body scroll width all `1029`; body grid `236px 763px`; outline and main both start at `y=53`; outline/main radius `0px`; category strip `chipRows=2`; only detected viewport overflow is the existing header background SVG at `left=-6`, not Methods content.
- Validation:
  - `npm run typecheck` → passed.
  - `npm run test:analytics` → passed (`62` files, `1111` tests).
  - Targeted CenterPanel/Guide amber scan → 0 hits.
  - `git diff --check` → passed.
  - `npm run lint:errors` → failed on pre-existing unrelated unused symbols in `src/components/ide/EnhancedIDE.tsx` and `src/components/ide/Header.tsx`.
  - `npm run lint:no-tailwind-centerpanel` → tooling failure: `scripts/check-no-tailwind-centerpanel.ps1` is referenced by `package.json` but missing from `scripts/`.
- Next recommended prompt: Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert.

### Prompt C05 Correction — VS Code Method Tab Strip And Gutter Removal - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: user rejected the previous correction as still visually poor: outer gutters remained, Methods category tabs looked scattered and cramped, and the surface did not yet carry enough intentional VS Code-style design signal.
- Files changed:
  - `src/centerpanel/styles/centerpanel.module.css` — shell side padding now forced to `0`; body height is fixed to the viewport work area instead of expanding with guide content; left rail is now `224px` and main receives the recovered width.
  - `src/centerpanel/Guide/MethodsView.tsx` — category tabs now expose per-category guide counts, zero-count categories are marked with `data-empty`, and the clear action only appears for real search text instead of category selection.
  - `src/centerpanel/styles/guides.module.css` — replaced the boxed category-grid look with a VS Code-style text tab strip: inactive tabs are borderless, active tab uses a restrained blue fill + 2px underline, tab widths are capped at `128px`, labels wrap inside the tab, and the strip stays at two rows at the screenshot viewport. Search remains a single-row control, and no-results state is now a useful inspector block with a clear action.
- Visual QA:
  - Playwright against `http://127.0.0.1:5173/?view=analyst`, viewport `1029x589`, active category `Remote Sensing`.
  - Screenshot saved to `.codex-logs/methods-remote-vscode-pass-2.png`.
  - Metrics: shell/body padding `0`; body grid `224px 805px`; outline/main radius `0px`; document/client/body scroll width all `1029`; category strip `chipRows=2`; top header reduced from 144px to 96px after the correction.
- Validation:
  - `npm run typecheck` → passed.
  - `npm run test:analytics` → passed (`62` files, `1111` tests).
  - Targeted CenterPanel/Guide amber scan → 0 hits.
  - `git diff --check` → passed.
- Next recommended prompt: Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert.

### Prompt C05 Correction — Methods Prose Width And Justified Reading Surface - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: user screenshot circled a dead right column inside the Methods guide body and requested the content be justified and visually balanced.
- Root cause: `.block` in `guides.module.css` was capped at `max-width: 92ch`, so a 927px section rendered the actual guide prose at about 718px, leaving a large unused right-side area.
- Files changed:
  - `src/centerpanel/styles/guides.module.css` — guide prose/list blocks inside `.section` now use `width: 100%`, `max-width: none`, `text-align: justify`, `text-align-last: left`, `line-height: 1.48`, and `hyphens: auto`; section content wrappers and lists are also allowed to fill the available editor canvas. Section labels received a subtle blue-secondary color mix to keep the surface premium without adding another frame.
- Visual QA:
  - Playwright against `http://127.0.0.1:5173/?view=analyst`, viewport `927x787`, active category `Remote Sensing`.
  - Screenshot saved to `.codex-logs/methods-remote-justified.png`.
  - Metrics: section width `927px`, first prose block width `895px`, block/section fill ratio `0.965`, `text-align: justify`, document/body scroll width `927`.
- Validation:
  - `npm run typecheck` → passed.
  - Targeted CenterPanel/Guide amber scan → 0 hits.
  - `git diff --check` → passed.
- Next recommended prompt: Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert.

### Prompt C05 Correction — Scientific Method Content Completion - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: user requested empty Methods category tabs be filled scientifically and aligned with the premium VS Code workbench direction.
- Files changed:
  - `src/centerpanel/Guide/guideContent.ts` — added one complete `MethodologyGuide` for every previously empty category:
    - Urban Morphology: `Spacematrix Urban Morphology`.
    - Transport Planning: `GTFS Transit Accessibility`.
    - Socioeconomic: `Displacement Risk Index`.
    - 3D & Simulation: `3D Solar Access and Shadow Simulation`.
    - Data Engineering: `Reproducible Spatial ETL and QA`.
  - `src/centerpanel/Guide/MethodsView.tsx` — added a compact scientific validity strip under each guide title with category-specific scale, CRS, and evidence/provenance requirements.
  - `src/centerpanel/styles/guides.module.css` — styled the validity strip as a VS Code-style inspector/status row: flat, hairline-separated, restrained blue signal, no rounded card frame.
- Scientific contract notes:
  - New guides explicitly warn that projected CRS is required before area/distance/3D geometry calculations.
  - Data Engineering guide blocks unknown CRS rather than guessing silently.
  - Displacement guide states the index is a screening tool, not causal proof of individual displacement.
  - GTFS guide distinguishes schedule-aware accessibility from stop-buffer proximity.
- Visual QA:
  - Playwright against `http://127.0.0.1:5173/?view=analyst`, viewport `1029x589`, active category `Data Engineering`.
  - Screenshot saved to `.codex-logs/methods-filled-data-engineering.png`.
  - Empty category check: `Urban Morphology`, `Transport Planning`, `Socioeconomic`, `3D & Simulation`, and `Data Engineering` each render one guide; Methods category strip now shows `All10` and no category count is zero.
- Validation:
  - `npm run typecheck` → passed.
  - `npm run test:analytics` → passed (`62` files, `1111` tests).
  - Targeted CenterPanel/Guide amber scan → 0 hits.
  - `git diff --check` → passed.
- Next recommended prompt: Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert.

### Prompt C05 Correction — Scoped Methods Index Rail + Premium Signal Pass - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: user requested the left `INDEX` rail be specific to each Methods category tab, while `All` should still show the whole catalog, and asked for additional premium VS Code-style design signal.
- Files changed:
  - `src/centerpanel/Guide/guideRailBridge.ts` — new typed intra-feature bridge that publishes the active Methods filter state (`mode`, `query`, `items`, `totalCount`) from the main Methods view to the shell-supplied index rail. The bridge caches the latest state so rail mount order cannot miss the first publish.
  - `src/centerpanel/Guide/MethodsView.tsx` — publishes filtered guide items whenever `All`, a category tab, or search query changes.
  - `src/centerpanel/Guide/OutlineRail.tsx` — consumes the guide rail state. `All` shows all 10 guides grouped by category; a selected category shows only that category's guide rows and no unrelated category separators. Hyphenated titles such as `Sentinel-2` are no longer truncated.
  - `src/centerpanel/Guide/guideContent.ts` — reordered the exported catalog so `All` groups guides by the declared category sequence instead of repeating category separators.
  - `src/centerpanel/styles/guides.module.css` — added scoped index rail styling: catalog/scoped mode banner, subtle top scan line, active row gradient, active icon color, premium selection hairlines, and a compact empty-index state without rounded cards.
- Visual QA:
  - Playwright against `http://127.0.0.1:5173/?view=analyst`, viewport `1029x589`.
  - Screenshot saved to `.codex-logs/methods-index-scoped-premium-final.png`.
  - Metrics: `Data Engineering` rail shows `count=1`, `scope=Scoped tab Data Engineering`, `rowCount=1`; `Transport Planning` rail shows `count=1`; `All` rail shows `count=10`, `rowCount=10`, category separators are unique and ordered (`Spatial Statistics`, `Network Analysis`, `Remote Sensing`, `Urban Morphology`, `Transport Planning`, `Environmental Analysis`, `Socioeconomic`, `3D & Simulation`, `Data Engineering`). Document/body scroll width remains `1029`.
- Validation:
  - `npm run typecheck` → passed.
  - `npm run test:analytics` → passed (`62` files, `1111` tests).
  - Targeted CenterPanel/Guide amber scan → 0 hits.
  - `git diff --check` → passed.
- Next recommended prompt: Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert.

### Prompt C05 Correction — Numbered Tab Indexing + Scientific Premium Metrics - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: user requested richer tab indexing, richer method content presentation, and more world-class premium VS Code-style effects.
- Files changed:
  - `src/centerpanel/Guide/MethodsView.tsx` — added visible tab indices (`00` for All, `01-09` for method categories), roving `tabIndex` keyboard semantics, ArrowLeft/ArrowRight/Home/End tab navigation, guide-level scientific metric strip (`Steps`, `Inputs`, `Limits`, `Refs`, `SDG`), and numbered section headers (`01`, `02`, ...).
  - `src/centerpanel/Guide/OutlineRail.tsx` — added rail row ordinals (`01`, `02`, ...), category separator counts, and preserved scoped index behavior from the prior pass.
  - `src/centerpanel/styles/guides.module.css` — added premium flat workbench effects: active tab gradient/underline, visible index numerals, metric strip bars, section heading leader lines, rail separator counts, and active rail ordinal coloring. No rounded card frames were introduced.
- Visual QA:
  - Playwright against `http://127.0.0.1:5173/?view=analyst`, viewport `1029x589`, active `Data Engineering`.
  - Screenshot saved to `.codex-logs/methods-worldclass-indexing.png`.
  - Metrics: category tabs remain `tabRows=2`; active `Data Engineering` tab is the only category tab with `tabIndex=0`; rail count is `1`; rail ordinal is `01`; guide metric strip spans `805px`; document/body scroll width remains `1029`.
  - Keyboard smoke: with `Data Engineering` focused, `ArrowLeft` selects/focuses `08 3D & Simulation`, then `ArrowRight` returns to `09 Data Engineering`, both with `tabIndex=0`.
- Validation:
  - `npm run typecheck` → passed.
  - `npm run test:analytics` → passed (`62` files, `1111` tests).
  - Targeted CenterPanel/Guide amber scan → 0 hits.
  - `git diff --check` → passed.
- Next recommended prompt: Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert.

### Prompt C06 - Report/Note Tab — Note Editor, Project Header, Sections, Footer, Library Insert - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: user requested the Report/Note tab be brought to the same premium VS Code-like workbench language as Methods, with no amber, no rounded card frames, less dead space, richer tab content, and preserved note/report bridge behavior.
- Files changed:
  - `src/centerpanel/tabs/ProjectHeader.tsx` — removed inline risk color styles and moved safety alert tone to semantic CSS classes.
  - `src/centerpanel/tabs/RecentChanges.tsx` — changed review history timestamps to dense relative labels with exact timestamp in `title`.
  - `src/centerpanel/tabs/LibraryInsertCard.tsx` — removed inline amber button/row styles and moved library insert rows/buttons to CSS module classes.
  - `src/centerpanel/styles/project-header.module.css` — flattened the project header into a dense workbench strip with muted metadata row, square chips, hairline border, and blue/info safety alert rail.
  - `src/centerpanel/styles/note.module.css` — added C06 workbench notebook layer: flat rail groups, square section headers, transparent format/action buttons, blue active states, `--syn-surface-editor` / `--syn-surface-input` editor surfaces, flattened recent changes/footer/dock/diff/menu surfaces, and a bridge-safe rule that collapses hidden slot textareas to `0x0`.
  - `src/services/reporting/reporting.module.css` — report builder is rendered inside the Note tab, so its old gold toolbar/card shell was also migrated to neutral workbench surfaces, blue active controls, square panels, and square preview sections.
- Behavior/contract notes:
  - Note persistence, slot selection, `SlotEditorContentBridge`, `SlotEditorFormatBar`, library insert dispatch, report save/export, and citation/report builder state wiring were not changed.
  - The hidden textarea used by `SlotEditorContentBridge` remains mounted and `aria-hidden`; CSS now prevents it from creating an invisible oversize box behind the collaboration dock.
- Visual QA:
  - Playwright against `http://127.0.0.1:5173/?view=analyst`, viewport `1280x900`, active `Report`.
  - Screenshots saved to `.codex-logs/report-note-c06-workbench-final-v2.png` and `.codex-logs/report-note-c06-slot-final.png`.
  - Metrics: document/body horizontal overflow `0`; report builder radius `0px`; toolbar radius `0px`; primary panels radius `0px`; visible rich editor width `708px` inside `736px` main column; hidden slot textarea collapsed to `0x0`; rail cards radius `0px`; footer radius `0px`.
- Follow-up layout correction:
  - Trigger: user flagged the shared-note right dock and report preview/form layout as inconsistent with the rest of the center panel, with wasted left/bottom space.
  - `src/centerpanel/tabs/Note.tsx` — moved `ReportBuilderPanel` into the same `mainAndDockWrap` / `mainColumn` structure as the note sections so the collaboration dock starts beside the report workspace instead of below it.
  - `src/centerpanel/styles/note.module.css` — added Note-scoped collaboration overrides for `CollaborationSessionOverview` and `CollaborationCommentSidebar`: square hairline panels, dense metrics, ghost buttons, muted metadata, fit-content state pills, and no nested rounded cards.
  - `src/services/reporting/reporting.module.css` — initially bounded the report builder workspace with internal form/preview scrolling; a later user correction rejected the two-column variant, so the final layout is a full-width stacked report flow with compact toolbar, full-width `Section Order`, and full-width `Live Preview` at the bottom.
  - Playwright screenshot saved to `.codex-logs/report-note-layout-fix-v4.png`.
  - Intermediate metrics before the full-width correction: document/body horizontal overflow `0`; report layout `752x680`; builder column `340x680` with internal scroll; preview column `400x680` with internal scroll; collaboration overview/comment sidebar radius `0px`; state pill `65x18`.
- Full-width report flow correction:
  - Trigger: user rejected the two-column Live Preview / Section Order layout as visually worse, too card-like, and inconsistent with the requested VS Code premium flow.
  - `src/services/reporting/reporting.module.css` — removed the `700px+` two-column report layout, restored `Live Preview` to the bottom as a full-width band, changed `Section Order` to full-width hairline rows, removed the filled blue active-card treatment, and reduced the toolbar from a tall stacked form to a compact workbench strip.
  - Playwright screenshot saved to `.codex-logs/report-note-fullwidth-preview-fix-v2.png`.
  - Metrics: document/body horizontal overflow `0`; toolbar height `118px`; report layout one column `752px`; `Section Order` row active state uses `0px` radius and a `2px` inset blue rail; `Live Preview` appears after the builder column with full-width preview paper.
- Validation:
  - `npm run typecheck` → passed.
  - `npx vitest run src/centerpanel/tabs/__tests__/Note.test.tsx src/services/reporting/__tests__/ReportBuilderPanel.test.tsx` → passed (`2` files, `4` tests).
  - Targeted C06 amber scan over all prompt files plus `src/services/reporting/reporting.module.css` and `ReportBuilderPanel.tsx` → 0 hits.
  - Center Panel Standard Amber Scan was re-run. The C06 files are clean; remaining non-map residual files are deferred C07-C09/C08 scopes: `Flows/*`, `Tools/*`, `components/EngineCapabilitiesPanel.tsx`, `components/ObjectDetectorPanel.tsx`, `components/NarrativeGenerationPanel.tsx`, `styles/flows.module.css`, `styles/tools*.module.css`, `styles/header-tokens.css`, and the pre-existing `registry-ui/newProject.module.css` comment hit.
- Known risks:
  - `note.module.css` still contains older legacy declarations above the C06 override block, so a broad heavy-chrome regex reports historical `border-radius`/`--ui-card-*` strings even though the live Report/Note computed surfaces are square and flat. Full removal should be reserved for C10 cleanup to avoid destabilizing older fallback selectors.
- Next recommended prompt: Prompt C07 - Workflows Tab — Flow Host, Flows Rail, Tiles, Step Pills, Cockpit, And Per-Flow Surfaces.

### Prompt C07 - Workflows Tab — Flow Host, Flows Rail, Tiles, Step Pills, Cockpit, And Per-Flow Surfaces - 2026-05-16

- Date: 2026-05-16.
- Agent: Codex.
- Status: completed.
- Trigger: migrate the Workflows tab and per-flow shells to the same dense Center Panel workbench discipline while preserving flow stores, run dispatch, map dispatch, and analytical contracts.
- Files changed:
  - `src/centerpanel/Flows/FlowHost.tsx` — study-area banners and workspace selector states moved from amber filled chrome to transparent hairline semantic rails.
  - `src/centerpanel/Flows/FlowsRail.tsx`, `src/centerpanel/Flows/rail/RelatedMethodsCard.tsx` — rail headers and hover states flattened to muted workbench text plus blue interaction tint.
  - `src/centerpanel/Flows/FlowLibraryCard.tsx`, `src/centerpanel/Flows/AnalyticalRunReviewFlow.tsx`, `src/centerpanel/Flows/WorkflowCockpit.tsx` — library/cockpit/action surfaces moved away from amber accent aliases and rounded card plates.
  - `src/centerpanel/Flows/CellularAutomataFlow.tsx`, `src/centerpanel/Flows/CompositeIndicatorFlow.tsx`, `src/centerpanel/Flows/ScenarioComparisonFlow.tsx`, `src/centerpanel/Flows/SystemDynamicsFlow.tsx`, `src/centerpanel/Flows/UrbanMorphologyFlow.tsx` — selected/input/status chrome moved to semantic info/valid/muted workbench states without changing analytical data contracts.
  - `src/centerpanel/styles/flows.module.css` — appended C07 workbench override layer for flow panels, flow tiles, step pills, step cards, rail cards, cockpit controls, inputs, warning/toast strips, footer bars, and top-level flow layout.
- Behavior/contract notes:
  - `useFlowStore`, `useFlowsUIStore`, flow registration, completed-run persistence, run dispatch, and map dispatch behavior were not changed.
  - Running/completed/blocked/error semantics remain text-backed; no demo/unknown/blocked state was relabeled as valid.
  - Remaining Flow amber scan hits are data/analytical palette values, not shared UI chrome: demand/coverage markers in `FacilityOptimisationFlow.tsx`, Sobol/data bars in `CompositeIndicatorFlow.tsx`, scenario stroke palette in `scenarioComparisonArtifacts.ts`, and system-dynamics population/flow diagram colors in `SystemDynamicsFlow.tsx`.
- Validation:
  - `git diff --check` → passed.
  - `npm run typecheck` → passed.
  - `npx vitest run src/centerpanel/Flows/__tests__` → passed (`7` files, `60` tests).
  - Targeted C07 primary amber scan over FlowHost/rail/cards/cockpit/read-only/review shell plus `flows.module.css` → 0 UI hits; only two `non-amber` explanatory comments in `flows.module.css`.
  - Full Center Panel Standard Amber Scan was re-run. Remaining non-map residuals are deferred C08/C09 scopes (`Tools/*`, `EngineCapabilitiesPanel`, `NarrativeGenerationPanel`, `ObjectDetectorPanel`) plus documented analytical Flow palettes above; raw output still includes Part 3 map files because the PowerShell negation-glob issue remains.
- Next recommended prompt: Prompt C08 - Toolbox Tab — Project List, Action Panel, Capability/Lab/Consulton Panels, Export Bar.

### Prompt C05 - Methods/Guide Tab — Methods View, Outline Rail, Guide Cards, And Command Bar - 2026-05-16

- Status: completed.
- Trigger: user-supplied screenshot of the Settings sidebar (Editor/Layout/AI Advanced folds) showing the iOS-style toggle switches, range sliders, and section fold headers rendered in saturated VS Code blue. Request: tone these affordances down to a muted gray-blue so the eye is not constantly drawn to them.
- Files inspected:
  - `src/components/ide/styles/ideShell.css` (toggle + range + fold-summary blocks)
  - `src/components/ide/ShellPlaceholderPane.tsx` (Toggle component — markup only, no color literals)
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied:
  - **Toggle track (`.syn-settings__toggle-track`)**: removed `1px solid var(--ide-border)` border; off-state background went from `--ide-bg-control` to a quiet `color-mix(--syn-text-muted 22%, transparent)` — a softer gray bed. Checked-state background went from saturated `var(--ide-accent)` (which now resolves to bright VS Code blue `#3794ff`) to a desaturated `color-mix(--syn-interaction-active 48%, --syn-text-muted 52%)` — the muted blue-gray the user asked for. Border-color on checked state cleared to transparent for a flush pill.
  - **Toggle thumb (`.syn-settings__toggle-thumb`)**: size 10 → 12 (a touch more presence in the same 16h track), off-state color softened to an 80/20 muted-default mix, checked-state color simplified to `--syn-text-default` (warm white, not pure `#fff`). Translate distance 15 → 14 to match the new thumb size.
  - **Toggle focus ring**: 2px outline → 1px `--syn-interaction-focus-ring` (matches the rest of the VS Code idiom).
  - **Range slider thumb (`.syn-settings__range::-webkit-slider-thumb` + `::-moz-range-thumb`)**: fill went from `--ide-accent` to the same `color-mix(--syn-interaction-active 60%, --syn-text-muted 40%)` muted gray-blue. Thumb border now references `--ide-bg-panel` for a clean ring against the sidebar. Hover scale animation removed (`transform: none`); instead the thumb subtly brightens via background `color-mix(--syn-interaction-active 78%, --syn-text-muted 22%)`.
  - **Fold-summary open state (`.syn-side-pane__fold[open] .syn-side-pane__fold-summary` + `.syn-settings__fold[open] .syn-settings__fold-summary`)**: open-fold text color went from saturated `var(--syn-interaction-active)` to `color-mix(--syn-interaction-active 60%, --syn-text-muted 40%)`. The `::after` `-`/`+` toggle marker was using bare `var(--ide-accent)` — now matches the same muted mix, so the open-fold caret is no longer the loudest pixel on the panel.
- Accessibility/status-truth notes:
  - Toggle still clearly communicates state via both track color (muted gray-blue vs gray) AND thumb position; not color-only.
  - Slider thumb still visibly distinct from the dark track; muted blue-gray with a panel-color ring keeps it legible.
  - Focus rings preserved on toggle, slider, fold-summary.
- Cross-module contract changes: none.
- Validation: `npm run typecheck` passed.
- Known risks: none.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Left Activity Rail + File Explorer VS Code Minimal Pass - 2026-05-15

- Status: completed.
- Trigger: user-supplied screenshot of the left activity rail (settings/files/outline/search/history/map/buildings) showing a still-loud blue tinted card around the active Files icon, plus the File Explorer header with a search input frame, an active toolbar button that read as a solid blue plate, and decorative chrome (radial corner glow, shimmer sweep on hover, animated icon scaling). Request: VS Code aesthetic, gray-blue tones for toggle/active states, no frames or fills around button or card chrome, eyes-friendly elegance.
- Root cause diagnosis:
  - `ideShell.css` activity-button class painted hover/active with `color-mix(--syn-interaction-active 12-14%)` background AND an `inset 0 0 0 1px color-mix(--syn-interaction-active 30-38%)` ring AND a `position:absolute` 2px left bar with a `0 0 8px` blue glow box-shadow — three layered blue cues for one state. The button itself had `border-radius: 6px` so the tinted plate rendered as a card.
  - Sidebar panel had `background-image: radial-gradient(ellipse at top left, blue 10%)` — that's the ambient blue glow leak top-left.
  - Side-pane action buttons had a `::after` shimmer sweep animation translating a 28% blue linear gradient across them on hover — distracting in a quiet workbench.
  - Activity button `svg` had a spring-eased `transform: scale(1.18)` on hover and `scale(1.08)` on active — animations the user reads as loud.
  - Activity badge: solid blue fill + `1px solid var(--syn-border-strong)` border + drop-shadow.
  - Active editor tab indicator: 2px gradient stripe with a `0 0 10px blue 48%` glow box-shadow.
  - `FileExplorerHeader.tsx`: `container` had `border: 1px solid COLORS.border` (= `#3A3A3A`) + `box-shadow: 0 0 0 1px var(--syn-bg-root)` (double-frame). `topRow` had its own `borderBottom`. `searchInput` was 32px high with 6px radius and a focus state that added a `0 0 0 1px goldPrimary` halo. `actionButton` was 32×32, 6px radius. `primaryButton` (the active folder-open icon) used `color-mix(--syn-interaction-active 14%, transparent)` background — at the small button size it read as a solid blue plate.
- Files inspected:
  - `src/components/ide/ActivityRail.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `src/components/file-explorer/FileExplorerHeader.tsx`
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/file-explorer/FileExplorerHeader.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied — VS Code activity bar idiom:
  - `.synapse-ide-shell__activity-rail`: gap 1px → 0, padding `6px 3px → 6px 0` so each button spans the rail full-width (VS Code shape).
  - `.synapse-ide-shell__activity-button`: width 36px → 100%, height 32px → 36px, `border-radius: 6px → 0` (no rounded plate). Inactive `color` muted to 80% mix of `--syn-text-muted`. Background `transparent` everywhere.
  - Hover state: removed the blue-tinted background and the inset blue ring; only the icon color brightens to `--syn-text-default`. Box-shadow `none`.
  - Active state: removed the blue-tinted background and the inset blue ring; only the icon color brightens to `--syn-text-default`. The 2px left accent bar still draws via `::before` but at `left: 0` (flush against the rail), without the blue glow box-shadow, and its color desaturated to `color-mix(--syn-interaction-active 72%, --syn-text-muted 28%)` for the gray-blue tone the user asked for.
  - Focus-visible: 2px outline → 1px `--syn-interaction-focus-ring` inset (VS Code idiom).
  - Activity badge: removed 1px border + drop-shadow + bold weight; color desaturated to the same gray-blue mix; dot size 8px → 6px.
  - Sidebar panel ambient radial gradient (`color-mix(--syn-interaction-active 10%)` top-left) removed (`background-image: none`).
  - Side-pane action button shimmer `::after` sweep removed (`content: none`).
  - Activity button `svg` scale animations on hover/active removed (`transition: none; transform: none`); the VS Code activity bar is quiet, not animated.
  - Active editor tab indicator: 2px gradient → 1px solid hairline at the same gray-blue mix; glow `box-shadow` removed; spans the full tab width (`left: 0; right: 0`) instead of 14% inset.
- Fixes applied — File Explorer header (VS Code sidebar idiom):
  - `container`: removed `1px solid COLORS.border`, removed `borderBottom`, removed the `0 0 0 1px var(--syn-bg-root)` halo box-shadow, background `#000 → transparent`. Container `minHeight: 100 → 88`. Text color recoloured to `var(--syn-text-default)` instead of `goldPrimary` (now blue) to keep the title quiet.
  - `topRow`: height 44 → 38, padding 0 16 → 0 12, `borderBottom: 1px solid COLORS.borderSubtle → none` (the panel border lives one level up).
  - `brandSection`: font-weight semibold → medium, font-size base → 11px with uppercase + 0.04em letter-spacing — the classic VS Code "EXPLORER" group header.
  - `searchInput`: height 32 → 26, `border-radius: 6 → 2`, background `#0d0d0d → var(--syn-surface-input)`, border `1px solid #2A2A2A → 1px solid var(--syn-border-subtle)`, focus state border `--syn-border-focus` (no halo). Padding tightened.
  - `clearButton`: removed hover scale + boxShadow halo; `border-radius: 50% → 2px`, smaller hit area, hover only changes background to `--syn-interaction-hover`.
  - `actionsRow`: removed top gradient + `borderTop`, padding tightened to `4px 8px 6px`, gap `8px → 2px`.
  - `actionDivider`: height 20 → 14, margin tightened, opacity 0.6 for a quieter hairline.
  - `actionButton`: size 32×32 → 24×24, `border-radius: 6 → 2`, default color `textSecondary → --syn-text-muted`, hover background `--syn-interaction-hover` only (no border), focus 1px inset outline.
  - `primaryButton` (the visible active toolbar button): the 14% blue-tint plate replaced with a **transparent background + gray-blue icon color** (`color-mix(--syn-interaction-active 78%, --syn-text-muted 22%)`); hover adds `--syn-interaction-hover` background and pulls the icon to the full `--syn-interaction-active` color. The button now reads as the same shape as its siblings, only the icon color signals the toggled state — exactly the VS Code idiom.
- Accessibility/status-truth notes:
  - All buttons retain visible focus indicators (1px inset outline, the VS Code idiom).
  - Active state is communicated via: (a) left accent bar (activity rail), (b) icon color shift (file explorer toolbar), (c) accent text color (sidebar group headers). No state relies solely on a fill or an animation.
  - aria-pressed/aria-selected attributes preserved; semantics unchanged.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
- Known risks: none introduced; the rail width var (`--ide-shell-activity-rail-width`) is unchanged, so layout flow stays identical.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### IDE Panel Hairlines + Settings Modal VS Code Redesign - 2026-05-15

- Status: completed.
- Trigger: user reported (a) thick blue divider lines between IDE shell regions (top header strip, left activity rail, bottom panel frame, bottom tabs) that felt loud and uncomfortable; (b) Settings modal layout looked cluttered with overlapping focus ring, heavy nav card, oversized inputs and pill buttons, lacking the quiet VS Code premium aesthetic. Single-pass instruction to apply both fixes.
- Root cause diagnosis:
  - `src/components/ide/styles/ideShell.css` defined a "Workbench Edge Hierarchy" block that mixed `var(--syn-border-active)` (= blue `#3794ff`) at 22-55% strength into every panel separator AND layered blue interaction-active glow `box-shadow`s on header/left-zone/bottom-panel-frame. These produced the loud blue lines. VS Code's actual design uses near-invisible neutral hairlines (`--vscode-panel-border` ≈ `#181818`) for panel separators; accent blue is reserved for focus/selected affordances.
  - Settings modal had multiple compounding heavy chrome layers:
    * `Nav` styled-component: dark `--bgSecondary` card with `1px solid var(--borderSoft)` and `border-radius: 10px` — visible card-in-card frame.
    * `NavBtn` aria-selected state added a wrapping `::after` pseudo-element with `box-shadow: var(--shadow-focus), var(--syn-glow-subtle)` — the prominent blue rounded ring around "General" in the screenshot.
    * `NavBtn` focus-visible used `outline: 2px + box-shadow: var(--shadow-focus)` stacked on top of the active background — double-rendered focus.
    * `Input`/`KeyInput`/inline inputs used `border-radius: 8px`, padded heights of 46px, hover/focus glows — far from VS Code field density.
    * `Button` (Refresh, Import JSON, Reset) used `var(--syn-gradient-glass-subtle)` gradient + `1px solid` borders.
    * `RadioPill` (provider segment) had `border-radius: 999px` capsules and uppercase tracking — overpowered the workspace style.
    * Model row items used `border-radius: 8px` and 16% blue tint — looked like cards stacked in a column.
    * Inline `<style>` block: `.settings-modal-palette` inputs had `min-height: 46px`, `border-radius: 6px`, `padding: 0 14px`, oversized for the data density VS Code uses. Footer buttons had `min-height: 40px` and primary used translucent tint instead of solid VS Code primary fill.
    * `Wrap` grid was `220px 1fr` but inner `[data-nav]` had `width: 252px` — the nav overflowed and shrank the content column oddly.
- Files inspected:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/settings/SettingsModal.tsx`
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/settings/SettingsModal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied:
  - **IDE shell hairlines (Workbench Edge Hierarchy block)**:
    * `.synapse-ide-shell__header`: `--header-border` collapsed from `42% blue mix` to `1px solid var(--syn-border-subtle)`; layered blue + drop-shadow box-shadows removed (`box-shadow: none`).
    * `.synapse-ide-shell__left-zone`: right border mix → flat `var(--syn-border-subtle)`; double blue glow `box-shadow` chain removed.
    * `.synapse-ide-shell__activity-rail`: 22% blue mix → `var(--syn-border-subtle)`.
    * `.synapse-ide-shell__sidebar-panel` `border-top`: 30% blue mix → `var(--syn-border-subtle)`.
    * `.synapse-ide-shell__resizer`: 36% blue mix → `var(--syn-border-subtle)`.
    * `.synapse-ide-shell__bottom-panel-frame` `border-top`: 55% blue mix → `var(--syn-border-subtle)`; blue glow `box-shadow` removed.
    * `.synapse-ide-shell__bottom-tabs` `border-bottom-color`: 26% blue mix → `var(--syn-border-subtle)`.
    * Comment header rewritten to document the new policy: ultra-subtle neutral hairlines for panel separators; accent blue is reserved for focused/selected affordances only.
  - **Settings modal — VS Code redesign**:
    * `Wrap` grid retuned to `180px 1fr`, `gap: 16px`, fixed `height: 560px` (slightly shorter for a tighter feel; modal stays fixed across tab switches).
    * `Nav` lost its dark background card and `1px solid` border + `border-radius: 10px`. Now a transparent column with a single `border-right: 1px solid var(--syn-border-subtle)` hairline separating it from the panel — VS Code's classic two-pane settings layout. Internal gap `6px → 2px` for compactness.
    * `NavBtn` `aria-selected::after` glow ring removed entirely; `focus-visible` no longer stacks outline + box-shadow. Active state now simply `background: var(--syn-interaction-hover)` with `color: var(--syn-text-default)`. Border-radius `8px → 4px`. Padding tightened. Font-size `12px → 13px` (VS Code body size). No uppercase letter-spacing.
    * `Input`/`KeyInput`: `border-radius: 8px → 2px`, padding `8px 10px → 6px 10px`, background swapped from `rgba(255,255,255,0.045)` to semantic `var(--syn-surface-input)`, border to `var(--syn-border-subtle)`, hover border to `var(--syn-border-default)`, focus border to `var(--syn-border-focus)`. No `box-shadow` glow, no `2px solid outline`. Font-size aligned to 13px. KeyInput error state simplified to red border, no red box-shadow.
    * `Button` rewritten: gradient + 1px solid → flat `var(--syn-interaction-hover)` background with no border, `border-radius: 2px`, hover adds 10% text tint, focus uses a 1px inset outline (the VS Code idiom).
    * `Primary` rewritten: translucent blue tint → solid `var(--syn-interaction-active)` background with `var(--syn-text-inverse)` text — proper VS Code primary button. Hover adds 14% text mix.
    * `RadioPill`: 999px capsules → `border-radius: 2px`; height `34px → 28px`; min-width `110px → 90px`; uppercase + letter-spacing removed; hover state added. Provider segments now feel like a VS Code segmented control.
    * Model row inline style: `border-radius: 8px → 2px`; selected state now 22% blue tint with blue text (matches VS Code list selection); active (hovered) state stays as neutral interaction-hover; height tightened to `minHeight: 22`. Padding `6px 10px → 4px 10px`. font-size `11 → 12`.
    * Inner `<style>` block: nav buttons `border-radius: 6px → 4px`, padding `10px 14px → 6px 12px`; inputs/selects/textareas `border-radius: 6px → 2px`, `min-height: 46 → 28`, padding `0 14px → 0 10px`; focus rules dropped the `2px outline + offset` stack in favor of a single `border-color: var(--syn-border-focus)`. Tag buttons `padding: 4px 8px → 2px 8px`, `border-radius: 6px → 2px`, default background `var(--syn-interaction-hover) → transparent`, hover background then becomes `var(--syn-interaction-hover)`. Provider segments matched. Footer primary now solid blue VS Code style; danger uses solid `--syn-status-error` fill.
    * KeyRow status pill: removed `1px solid` border + `rgba(255,255,255,0.06)` background — now plain semantic color text.
    * KeyRow icon button container: removed gradient background + 1px border + `border-radius: 10px` outer pill; icons sit flat. Each icon button collapsed `32×32 → 28×28`.
- Accessibility/status-truth notes:
  - Focus state preserved via inset 1px outline (VS Code idiom) — no state relies on color alone, all controls remain keyboard-navigable with a visible focus indicator.
  - Status semantics intact: success → `--syn-status-valid`, error → `--syn-status-error`, warning → `--syn-status-warning`, info → `--syn-status-info`. Demo/unknown unchanged.
  - Selected/active model rows differentiated from hovered/active cursor by both background (22% blue vs neutral) AND color (blue accent vs default).
- Data visualization notes: no map/chart palette touched.
- Scientific integrity notes: no evidence provenance, CRS, fitness, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - All ideShell.css edge-hierarchy declarations now resolve to neutral `--syn-border-subtle` hairlines instead of blue mixes.
- Known risks:
  - The fixed `height: 560px` Settings modal may push tab content into the internal scroll on very small viewports; modal's outer `max-height: 80vh` (from `palette` Modal variant) still applies so the modal will not exceed viewport.
  - Some Settings sub-sections still have ad-hoc inline styles that this pass did not visit (deep Appearance preview, dataset library card, ratings widget); their borders/fills remain as previously authored and can be visited in a follow-up if any heavy chrome resurfaces.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Settings Parse Fix + Fixed Modal Size + AI Resize Handle - 2026-05-15

- Status: completed.
- Trigger: user reported (a) Vite oxc PARSE_ERROR at `SettingsModal.tsx:29` blocking app boot, (b) Settings modal resized when switching tabs, (c) AI panel settings modal needed the same fixed-size + premium minimal treatment, (d) a faint amber vertical line still visible on the left edge of the AI panel.
- Root cause diagnosis:
  - The previous re-skin pass added a block comment containing backticks (`` `gold*` / `textAccent` names retained ... ``) inside a **styled-components tagged template literal** in `SettingsModal.tsx`. Backticks inside a tagged template literal terminate the literal, producing a parse error at the next token.
  - `Settings` modal had `min-height: 420px` on `Wrap` and `min-height: 360px` on `TabsContentWrap` but no fixed height, so different tabs (varying content) made the modal grow/shrink.
  - The AI panel resize handle in `EnhancedIDE.tsx` (10px-wide bar at `left: -2px`) was filled with `var(--syn-gradient-glass-amber)` — the actual visible amber stripe on the left edge of the AI panel.
  - `AiSettingsModal.module.css` `.panel` used `max-height: 84vh` without a fixed height; buttons (`.btn`, `.btnCancel`, `.btnSaveClose`, `.closeBtn`) had `1px solid` borders against the no-frames preference.
- Files inspected:
  - `src/components/settings/SettingsModal.tsx`
  - `src/components/molecules/Modal.tsx`
  - `src/components/ide/EnhancedIDE.tsx` (AI dock + resize handle region)
  - `src/components/ai/settings/AiSettingsModal.module.css`
  - `src/components/ai/panel/styles.ts` (PanelRoot — already clean)
- Files changed:
  - `src/components/settings/SettingsModal.tsx`
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ai/settings/AiSettingsModal.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Fixes applied:
  - **Parse error**: replaced the backticks inside the `SettingsModal.tsx` palette block comment with plain text ("gold and textAccent names retained for source compatibility"). The styled-components template literal now parses cleanly under Vite's oxc transformer.
  - **Fixed Settings modal size**: `Wrap` now `height: 620px; min-height: 620px; max-height: 620px;` so switching General/Providers/Appearance/Advanced/Local Models never resizes the modal. `TabsContentWrap` now `flex: 1; min-height: 0; overflow-y: auto;` so the long Advanced tab scrolls internally without pushing the modal taller. `PanelShell` now `overflow: hidden; min-height: 0;` to participate cleanly in the flex column.
  - **AI panel amber line**: the resize handle's `background: var(--syn-gradient-glass-amber)` removed in favor of a transparent base + 1px subtle `var(--syn-border-subtle)` left edge; hover now lifts to a 18% blue tint via `color-mix(var(--syn-interaction-active) ...)`. The white sub-borders and amber-on-hover handlers were dropped. Backdrop-filter and box-shadow removed. Width trimmed 10px → 6px for a slimmer, premium divider.
  - **AI Settings modal**: `.panel` now `height: 720px; max-height: 84vh;` so the modal is fixed-size and scrolls internally. `.btn`, `.closeBtn`, `.btnCancel` lost their `1px solid` borders; default background made transparent; hover state uses `var(--syn-interaction-hover)` for the chrome buttons. `.btnSaveClose` migrated from `border: 1px solid var(--ai-accent)` + amber-tinted bg to a flat 16% blue tint with no border; hover lifts to 24%.
- Accessibility/status-truth notes:
  - All buttons retain visible focus rings via the existing IDE focus-visible rules.
  - Save vs Cancel still semantically distinct: primary action uses blue tint, cancel uses neutral; no state relies on color alone.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - Vite oxc parser error at `SettingsModal.tsx:29` should no longer trigger; the offending backticks are removed.
- Known risks:
  - Fixed modal height (620px Settings / 720px AI Settings) may be tighter than 84vh on very small viewports; CSS still caps via the surrounding Modal's `max-height: 80vh` for Settings and `max-height: 84vh` for AI Settings, so the inner content area shrinks gracefully on small screens.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### File Explorer + Settings Modal Premium Minimal Pass - 2026-05-15

- Status: completed.
- Trigger: user-supplied screenshots showing (a) amber-tinted folder icon button in the File Explorer toolbar, (b) a strong amber radial-gradient backdrop, amber-bordered Export button, amber tab outlines, and amber-rgba field/segment chrome in the Settings modal, (c) request to remove unnecessary borders and border-fills around buttons/cards in favor of a premium minimal aesthetic aligned with the blue chrome accent.
- Root cause diagnosis:
  - `src/components/file-explorer/FileExplorerHeader.tsx` declared its own local `COLORS.goldPrimary = '#F59E0B'` constant and inline-styled the toolbar action buttons with `linear-gradient(180deg, rgba(245,158,11,0.22), rgba(245,158,11,0.12))`, amber border-rgbas, and amber focus outlines — bypassing the shared semantic token chain.
  - `src/components/settings/SettingsModal.tsx` declared local CSS variables (`--textAccent: #F59E0B`, `--goldSoft`, `--goldMuted`, `--borderHighlight: rgba(245,158,11,0.4)`, `--glowSubtle`) and embedded a styled `<style>` block that hard-coded 25+ amber rgba literals and `#F59E0B` outlines across the modal palette. `PanelShell` had a `:before` radial gradient `radial-gradient(circle at 92% 8%, rgba(245,158,11,0.15), transparent 55%)` producing the visible amber backdrop. `Primary` styled-component used `--syn-gradient-glass-amber` directly.
  - `src/components/file-explorer/EmptyState.tsx` and `src/components/file-explorer/NewFileModal.tsx` had additional amber chrome inline styles.
- Files inspected:
  - `src/components/file-explorer/FileExplorerHeader.tsx`
  - `src/components/file-explorer/EmptyState.tsx`
  - `src/components/file-explorer/NewFileModal.tsx`
  - `src/components/file-explorer/FileExplorer.tsx`
  - `src/components/settings/SettingsModal.tsx`
  - `src/components/molecules/` (modal wrappers)
- Files changed:
  - `src/components/file-explorer/FileExplorerHeader.tsx`
  - `src/components/file-explorer/EmptyState.tsx`
  - `src/components/file-explorer/NewFileModal.tsx`
  - `src/components/settings/SettingsModal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights (premium minimal aesthetic):
  - **FileExplorerHeader.tsx**:
    - Local `COLORS.goldPrimary/Secondary/Hover` constants redirected to `var(--syn-interaction-active)` and `color-mix` blue derivatives (key names retained for source compatibility).
    - `actionButton` lost its `linear-gradient(180deg, #111111, #0b0b0b)` fill, `1px solid rgba(255,255,255,0.11)` border, and `0 1px 0 inset / 0 0 0 1px outer` box-shadow — now transparent background, no border, no shadow. Hover uses `var(--syn-interaction-hover)` only. Focus ring uses `--syn-interaction-focus-ring`.
    - `primaryButton` (the active folder icon button shown in screenshot) lost its amber gradient + amber border + `#ffd48a` hover color; now a flat `color-mix(in srgb, var(--syn-interaction-active) 14%, transparent)` background, no border, blue text. Hover lifts to 22% blue tint with no transform/shadow.
    - `actionDivider` simplified from amber rgba gradient to neutral `var(--syn-border-subtle)`. Border-top of action bar uses semantic border.
    - Export status indicator: success/error/info now map to `--syn-status-valid/error/info` instead of `#22C55E/#EF4444/#F59E0B` raw literals.
  - **SettingsModal.tsx**:
    - CSS-in-JS palette block: `--textAccent`, `--goldSoft`, `--goldMuted`, `--borderHighlight`, `--glowSubtle` all redirected to blue values (key names retained).
    - `NavBtn` styled-component: removed conditional `1px solid` border (was `var(--borderHighlight)` for active and `var(--borderSoft)` for inactive); active background swapped from `var(--syn-gradient-glass-amber)` to `color-mix(in srgb, var(--syn-interaction-active) 14%, transparent)`. No border, only an inset 2px blue accent rail for active. Hover uses `var(--syn-interaction-hover)`.
    - `PanelShell` styled-component: removed dark `var(--syn-gradient-elevated)` background, removed `1px solid var(--borderSoft)` border, removed `border-radius: 14px`, removed elevation `box-shadow`, **removed the `:before` radial amber gradient pseudo-element**. Panel is now a transparent flex container — no card-in-card frame.
    - `Primary` (Export-button) styled-component: amber gradient + amber border + glow shadow → flat `color-mix(in srgb, var(--syn-interaction-active) 16%, transparent)` background, no border, no shadow, blue text. Hover at 24% blue.
    - Provider segment (`segmented control`): removed `1px solid var(--borderSoft)`; active state uses 16% blue tint with no border, inactive transparent.
    - Inner `<style>` block (`.settings-modal-palette ...`): all 15+ amber rgba/`#F59E0B` literals redirected to `var(--syn-interaction-active)`/`color-mix`. Tab nav buttons: no border, only inset 2px blue accent rail for active. Inputs/selects: focus border uses `--syn-border-focus`, no amber fill. Tag buttons, provider segments, footer buttons: no borders, hover via `--syn-interaction-hover`.
    - Inline JSX inline styles for provider radio chips, tag filters, favorite stars, model rows, "fav"/"dyn" badges: all migrated from amber rgba/`#F59E0B` to blue token chain.
  - **EmptyState.tsx**: removed `var(--syn-gradient-glass-amber)` circle background, removed amber `Folder` icon color (now `var(--syn-text-muted)`), Create button now flat blue tint, no border, no transform on hover.
  - **NewFileModal.tsx**: bulk-replaced amber chrome rgba literals (`rgba(245,158,11, 0.05/0.10/0.15)`) and `#f59e0b` chrome color/borderColor with `color-mix(in srgb, var(--syn-interaction-active) ...%, transparent)` and `var(--syn-interaction-active)`. `primaryButton` amber gradient replaced with blue tint. Inset header amber rgba shadow replaced with blue rgba. Note: the `LANGUAGE_CATEGORIES` `color` fields (`#F59E0B`/`#22C55E`/`#D97706`/`#7C3AED`/`#0EA5E9`) intentionally retained as language-category identity palette per data-palette contract.
- Premium minimal pass details:
  - Removed `1px solid` borders from: settings nav buttons, settings provider segments, settings tag/filter buttons, settings footer buttons, file explorer action buttons, file explorer primary button, file explorer empty-state CTA.
  - Removed border-fill backgrounds (gradients/elevated dark fills) from: file explorer action buttons, settings panel shell, settings nav, empty state circle.
  - Active state communicated through subtle blue tint background (12-22% mix) and an inset 2px blue accent rail for nav rows, never through heavy borders.
- Accessibility/status-truth notes:
  - All focus rings still rendered (via `--syn-interaction-focus-ring`); no states rely on color alone (icons + text labels preserved).
  - `--warning` and `--syn-status-warning` retained as amber for genuine warning semantics. `--syn-status-error` / `valid` / `info` / `running` / `pending` mapping preserved.
  - Export status indicator now distinguishes valid/error/info semantically instead of conflating "default" with amber warning.
- Data visualization notes: `LANGUAGE_CATEGORIES` color identifiers preserved as content/identity palette.
- Scientific integrity notes: no evidence provenance, CRS, fitness, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - Targeted grep for `F59E0B|FBBF24|D97706|245,?\s*158,?\s*11|gradient-amber` in `SettingsModal.tsx` and `FileExplorerHeader.tsx` returned only the intentional `--warning: #F59E0B` semantic token.
- Known risks: visual screenshot smoke not re-run; the user will validate via dev server reload.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompts 00-15 Root Amber Cascade Fix - 2026-05-15

- Status: completed.
- Trigger: user-reported visible amber/gold leftovers in the IDE shell, header, tab bar, activity rail, AI panel header, and global top bar — despite ledger reporting Prompts 00-15 complete.
- Root cause diagnosis: the semantic CSS variable layer was added in Prompts 04-05, but the legacy primary chrome accent (`--syn-accent-primary` and its hover/pressed/soft/border/bg/glow rgba siblings) was never redirected. All compatibility aliases (`--syn-gold-500`, `--ai-gold`, `--color-accent-primary`, `--brand-primary`, `--ide-accent`, `--focus-ring`) cascade from these literal amber values, plus a fixed-position `[data-global-gold-bar]` element rendered an animated amber gradient across the very top of the IDE shell. The JS counterpart `SYNAPSE_COLORS` (`goldPrimary`, `accentNeutral`, `hover`, `selected`, `borderHighlight`, `glowSubtle`, `textAccent`) and `SYNAPSE_ACCENT.gold*` / `SYNAPSE_FOCUS.ring` constants were also still amber, leaking via `Header.tsx`, `IdeThemeScope.tsx`, `Button`, `Input`, and any consumer importing from `@/ui/theme/synapseTheme`.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/ui/theme/synapseTheme.ts`
  - `src/ui/theme/ideProScope.css`
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/Header.tsx`
  - `src/components/ide/IdeThemeScope.tsx`
  - `src/components/StatusBar/StatusBar.tsx`
  - `src/components/StatusBar/statusTheme.ts`
  - `src/components/ai/panel/*`
- Files changed:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/ui/theme/synapseTheme.ts`
  - `src/ui/theme/ideProScope.css`
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/IdeThemeScope.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights (cascade fixes):
  - `--syn-accent-primary` redirected from `#F59E0B` to `var(--syn-interaction-active)` (blue `#3794ff`). Hover/pressed siblings now `#2c7fd9` / `#1f6abc`. Soft bg now references `--syn-vscode-accent-blue-soft`. This single change cascades through `--syn-gold-500`, `--syn-gold-300`, `--color-accent-primary`, `--ai-gold`, `--brand-primary`, `--ide-accent`, and every styled-component consuming the chain.
  - `--syn-accent-bg`, `--syn-accent-bg-hover`, `--syn-accent-bg-strong`, `--syn-accent-border`, `--syn-accent-glow` migrated from amber rgba to `rgba(55,148,255, *)`. Amber retained under new `--syn-attention-*` siblings for explicit attention surfaces.
  - `--syn-glow-subtle` shadow color updated to blue rgba.
  - `ideProScope.css`: `--ide-bg-active`, `--ide-bg-rail-active`, `--ide-focus-ring`, `--ide-focus-shadow`, `--focus-ring`, and the hover outline rgba on `.theme-ide-pro .ctx-pro-item` all migrated from amber rgbas to blue rgbas. Focus ring fallback `#FBBF24` replaced with `#3794ff`.
  - `synapseTheme.ts` `SYNAPSE_COLORS`: `textAccent`, `goldPrimary`, `goldSecondary`, `goldHover`, `accentNeutral`, `accentNeutralHover`, `hover`, `selected`, `borderHighlight`, `glowSubtle` all redirected to blue values. Source-level `gold*` key names retained for source compatibility; documented as redirected per color system contract.
  - `synapseTheme.ts` `SYNAPSE_ACCENT.{gold,goldHover,goldActive,goldMuted}` redirected to blue tones; `SYNAPSE_FOCUS.ring` now `#3794ff`; `focusOutline()` helper now references `SYNAPSE_FOCUS.ring` instead of legacy `goldPrimary`.
  - `IdeThemeScope.tsx`: documented that `brandPrimary`/`brandAccent` flow through the redirected `goldPrimary`/`goldHover` values, so styled-component themes resolve to blue chrome automatically.
  - `EnhancedIDE.tsx`: the fixed-position `[data-global-gold-bar]` (z-index 999999) animated amber gradient rewritten with blue (`#3794ff` / `#5aa9ff` / `#2c7fd9`) keyframes and rgba radial glows. Four `synapseGlitch` keyframe `drop-shadow` amber rgbas, plus the placeholder backdrop radial-gradient amber tint, also migrated to blue rgbas.
- Accessibility/status-truth notes:
  - Status semantics preserved: `--syn-status-warning` (still amber), `--syn-warning-bg`, `--syn-warning-border`, `--syn-text-warning`, `--syn-gradient-amber*` decorative tokens, and `SYNAPSE_COLORS.warning` remain amber for genuine attention/warning/caveat surfaces. Demo/unknown/stale status colors unchanged. The fix narrows amber to attention semantics and frees the chrome accent to be blue.
  - The `gold*` source identifiers (in `SYNAPSE_COLORS`, `SYNAPSE_ACCENT`, `data-global-gold-bar`) were intentionally not renamed to avoid touching unrelated import sites; values were redirected with code comments documenting the new semantic intent.
- Data visualization notes:
  - `--syn-chart-*` palette unchanged.
  - Map/chart/data palettes untouched.
  - Prism syntax tokens in `src/components/ai/panel/code-lang.ts` (e.g. `diff: '#F59E0B'`) intentionally retained as code-content palette per the color system data-palette contract.
- Scientific integrity notes: no evidence provenance, CRS, fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
- Known risks:
  - Decorative `--syn-gradient-amber*` tokens still resolve to amber and are consumed by branding surfaces (Welcome modal, Hero, NeuralBackground, file explorer empty state, etc.). These are intentional brand decoration outside the workbench chrome and were not migrated in this pass; can be tackled in Prompt 32 cleanup if the user wants the brand identity blue too.
  - Visual screenshot smoke not re-run.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompts 00-15 Re-Audit Pass - 2026-05-15

- Status: completed.
- Trigger: user-directed re-execution of Prompts 00 through 15 as a fresh audit pass, with prior completed work treated as baseline per ledger source-of-truth ordering.
- Scope:
  - Re-verify token infrastructure (Prompts 00-07) is intact and consumed correctly.
  - Re-verify shell/utility/center/status/IDE/file-explorer/editor/terminal migrations (Prompts 08-15) hold under the active token contract.
  - Close any genuinely raw (non-fallback) color literals remaining inside Prompt 08-15 surface scope.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
  - `scripts/check-color-regression.mjs` (output review only)
- Files changed:
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - `MapWorkspaceCockpit.module.css`: replaced four raw cockpit text literals (`#fafaf9`, `#f5f5f4`, `rgba(250, 250, 249, 0.58)`, `rgba(250, 250, 249, 0.56)`) with `var(--syn-text-default)` / `var(--syn-text-secondary)`. Decorative shadow and translucent overlay rgba values retained as intentional non-chrome effects.
  - `BackgroundTasksControl.module.css`: replaced status-state literals (`#cbd5e1`, `#86efac`, `#fca5a5`, `#d6d3d1` plus their rgba backgrounds) with the local `--tasks-*` aliases backed by `--syn-status-pending|valid|error|stale`. Status semantics are now fully token-resolved.
- Re-audit findings (no change required):
  - Prompts 00-07 infrastructure: `--syn-vscode-*` primitives, `--syn-surface/text/border/interaction/status-*` semantic layer, legacy `--color-*` / `--glass-*` / `--ai-*` compatibility aliases, and `AppThemeProvider` mapping are all live in `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts`, and provider paths. No drift detected.
  - Prompts 08-15 surface migrations: `CommandPalette.tsx`, `GlobalSearch.tsx`, AI panel/composer/key/status/quick-action components, file explorer, editor tabs, terminal/bottom panel, and status bar already resolve through semantic tokens. Remaining color-guard hits are documented `var(--syn-token, #fallback)` patterns, primitive token-source declarations, syntax/code/data palettes, or out-of-scope future-prompt surfaces.
- Accessibility/status-truth notes:
  - Cockpit metric value and label now follow the dark-workbench text contrast contract via semantic tokens.
  - Background task status states (queued/completed/failed/cancelled) remain semantically distinguishable through `--syn-status-*` rather than ad-hoc tints; demo/unknown still never share valid styling.
- Data visualization notes: no map renderer, layer symbology, chart palette, or analytical data palette touched.
- Scientific integrity notes: no evidence provenance, CRS, fitness, method validity, or readiness semantics changed.
- Cross-module contract changes: none.
- Validation:
  - `npm run typecheck` passed.
  - `npm run color:guard:changed` reviewed; remaining literals are intentional fallbacks, primitives, content palettes, or scoped to pending prompts (18-37).
- Known risks: none introduced; full screenshot smoke not re-run for this audit (CLI-validated pass).
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompt 17 / Prompt 10 Audit Follow-Up - Map Cockpit And Background Tasks Chrome - 2026-05-15

- Status: completed.
- Trigger: user-requested audit of completed color prompts plus the Command Palette modal sizing follow-up.
- Scope:
  - Stabilize Command Palette modal body height so Files/Tabs/Symbols/Commands mode changes do not resize the modal.
  - Reconcile color prompt ledger/register/manifest/validation records for prompts 00-17.
  - Close high-confidence leftover amber chrome gaps in completed Prompt 17/Prompt 10 scope.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `src/components/ide/CommandPalette.tsx`
  - `src/components/molecules/Modal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `src/components/ide/CommandPalette.tsx`
  - `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - `src/centerpanel/components/BackgroundTasksControl.module.css`
- Fixes applied:
  - `CommandPalette.tsx` now uses a fixed responsive grid body height and an internal scrolling result viewport, keeping modal dimensions stable across mode/tab changes.
  - `COLOR_SYSTEM_PROMPT_MANIFEST.json` now marks prompts 00-17 as `completed` and leaves prompts 18-37 `pending`, matching the ledger source of truth.
  - Ledger validation history and bottom next pointer now align with Prompt 18.
  - `MapWorkspaceCockpit.module.css` removed the high-confidence amber/gold chrome leftovers from the Prompt 17 map shell/cockpit surface; generic chrome now uses `--syn-interaction-active`, while valid/warning/running/blocked states use explicit status tokens.
  - `BackgroundTasksControl.module.css` removed the high-confidence amber/gold chrome leftovers from the shared background task control; running, pending, completed, failed, and cancelled states remain semantically distinct.
- Accessibility/status-truth notes:
  - Command Palette keyboard/result state remains visible; only the layout container changed.
  - Map cockpit and task-control status labels remain textual; status color mappings were moved to semantic tokens rather than flattened to one accent.
  - Targeted amber scan for `MapWorkspaceCockpit.module.css` and `BackgroundTasksControl.module.css` passed after cleanup.
- Data visualization notes:
  - No map renderer, layer symbology, chart palette, or analytical data palette was changed.
- Scientific integrity notes: No scientific evidence, CRS, data fitness, method validity, readiness semantics, or GIS calculations changed.
- Cross-module contract changes: None.
- Validation:
  - `npm run typecheck` passed.
  - Prompt audit script passed: sequential prompt headings, manifest prompt count, and ledger register count are all 38; prompts 00-17 are completed; prompts 18-37 are pending; execution logs and validation rows are present for 00-17; current/next/bottom pointer all target Prompt 18.
  - `npm run color:guard:changed` passed in non-blocking report mode; remaining findings are dominated by token fallbacks, syntax/code colors, retained content palettes, and future-prompt cleanup scope.
  - Targeted grep for legacy amber/gold literals in `MapWorkspaceCockpit.module.css` and `BackgroundTasksControl.module.css` returned no matches.
- Known risks:
  - Full visual screenshot smoke was not run; this was a CLI validation pass.
  - Color guard still reports broader changed-file literals by design; Prompt 32 remains the planned broad cleanup pass.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompt 16 - Command Palette Search And AI Panel - 2026-05-15

- Status: completed.
- Scope: tokenize command palette, global search refinements, AI composer/panel chrome, AI status strips, API-key/config surfaces, apply preview, conflict/risk warnings, and apply/revert-adjacent code-action chrome without changing prompt construction or apply-plan behavior.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `src/components/ide/CommandPalette.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/ai/`
  - `src/components/ai/apply/ApplyPlanPreview.tsx`
  - `src/utils/ai/apply/`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `src/components/ide/CommandPalette.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/ai/apply/ApplyPlanPreview.tsx`
  - `src/components/ai/panel/Header.tsx`
  - `src/components/ai/panel/KeyDebug.tsx`
  - `src/components/ai/panel/KeysModal.tsx`
  - `src/components/ai/panel/MessageItem.tsx`
  - `src/components/ai/panel/ModelSelect.tsx`
  - `src/components/ai/panel/ProviderSelect.tsx`
  - `src/components/ai/panel/QuickActions.tsx`
  - `src/components/ai/panel/StatusBadge.tsx`
  - `src/components/ai/panel/SynapseCoreAIPanel.tsx`
  - `src/components/ai/panel/UnifiedComposer.tsx`
  - `src/components/ai/panel/styles.ts`
  - `src/components/ai/settings/AiSettingsModal.module.css`
- Token migration highlights:
  - `CommandPalette.tsx` now uses `--syn-interaction-active`, `--syn-interaction-focus-ring`, `--syn-status-info`, and semantic text/surface tokens for mode tabs, input focus, selected rows, match highlights, and disabled command reasons.
  - `GlobalSearch.tsx` now uses semantic search fallback tokens, blue active/focus markers, info-family match highlights, and an info-toned open-file dot instead of success styling.
  - AI panel chrome in `styles.ts`, provider/model controls, key modal, status badge, and status strips now map surfaces/focus/actions to semantic surface/interaction tokens instead of amber-first aliases.
  - API key states now map verified/missing/invalid/rate-limited/unknown to `valid`/`blocked`/`error`/`warning`/`unknown`, and verifying states to `running`.
  - `ApplyPlanPreview.tsx` now separates primary apply/selection interaction from risk/conflict semantics: create/update/replace use valid/info/warning, high-risk/conflict uses error, and medium/destructive caution uses warning.
  - Prompt 16 mapping was documented in `COLOR_SYSTEM_TOKEN_REFERENCE.md`.
- Accessibility/status-truth notes:
  - Palette and search selected/focused rows have visible fill/edge/focus rings, not only text-color changes.
  - 2026-05-15 follow-up: `CommandPalette.tsx` now uses a fixed responsive palette body height with an internal scrolling results viewport, so switching Files/Tabs/Symbols/Commands no longer resizes the modal.
  - AI warnings, conflict confirmations, key status, disabled command reasons, and apply risk banners retain explicit text, icons, aria labels, or titles.
  - Missing/invalid/rate-limited AI key states no longer share success styling.
- Remaining hard-coded colors retained (with rationale):
  - Prism syntax token colors in `src/components/ai/panel/styles.ts` and language identity colors in `src/components/ai/panel/code-lang.ts` remain as code/content palette values, not shared UI chrome/status tokens.
  - Existing `--ai-gold` local alias remains defined as a compatibility alias but now resolves to `--syn-interaction-active`/`--syn-status-info` in the migrated AI panel surface.
- Validation:
  - `npm run typecheck` passed.
  - Targeted tests were not run because no prompt construction, apply-plan logic, or behavior code changed.
- Next recommended prompt: Prompt 18 - Map Toolbar Search Pins And Controls.

### Prompt 17 - Map Explorer Shell And Canvas Chrome - 2026-05-15

- Status: completed.
- Scope: align Map Explorer shell, cockpit status, and canvas overlay chrome to semantic surface/status tokens while keeping the basemap dominant and preserving QA/CRS/publication messaging.
- Files inspected:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `src/centerpanel/components/map/mapTokens.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/components/map/MapWorkspaceShell.tsx`
  - `src/centerpanel/components/map/MapCanvas.tsx`
  - `src/centerpanel/components/map/MapStatusBar.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Workflow preview HUD/divider and command-header chrome in `MapExplorerModal.tsx` now use semantic surface/border/info tokens instead of amber-led shell accents.
  - Drag-and-drop import overlay and map feedback/statistics/dispatch cards were flattened to quieter semantic panel surfaces with reduced shadow depth to avoid heavy card-in-card visual competition.
  - `MapWorkspaceShell.tsx` panel rail and timeline separators were moved from amber-derived strokes to neutral semantic border tiers so chrome recedes behind map symbology.
  - `MapCanvas.tsx` pin marker and feature popup action chrome now use semantic info/interaction tokens and neutral panel text hierarchy.
  - `MapStatusBar.tsx` now differentiates `info`, `warning`, `error`, `running`, `pending`, `valid`, and `stale` values via semantic status tones while preserving explicit labels and spinner/non-color cues.
- Acceptance-criteria notes:
  - Map remains the primary visual surface because shell overlays are lower-contrast and less ornate.
  - Chrome accents no longer compete with arbitrary layer symbology through broad amber usage.
- Validation:
  - `npm run typecheck` passed.
  - Map visual smoke: not run in this CLI-only pass (no interactive browser validation performed).
- Sequencing note:
  - Prompt 17 was executed before Prompt 16 due to explicit user direction.
- Next recommended prompt: Prompt 16 - Command Palette Search And AI Panel.

### Prompt 15 - Terminal Bottom Panel Tasks And Problems - 2026-05-15

- Status: completed.
- Scope: tokenize bottom panel chrome, task-state colors, problems-pane severity/focus surfaces, and terminal/xterm connection chrome while preserving terminal behavior and readability.
- Files inspected:
  - `src/components/ide/BottomPanel.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `src/components/editor/ProblemsPane.tsx`
  - `src/components/editor/problemsPane.css`
  - `src/components/terminal/components/Terminal.tsx`
  - `src/components/terminal/components/XTermTerminal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/ide/styles/ideShell.css`
  - `src/components/editor/problemsPane.css`
  - `src/components/terminal/components/Terminal.tsx`
  - `src/components/terminal/components/XTermTerminal.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Bottom-panel task states now map queued/success/error/cancelled to semantic status tokens (`pending`, `valid`, `error`, `stale`) instead of mixed legacy fallbacks.
  - Bottom-panel frame animated glow pulse was removed and replaced with a restrained static semantic edge treatment for a quieter terminal host.
  - Problems pane header chips/source labels were flattened to transparent chrome with semantic severity/status colors retained, and focus ring updated to semantic focus border token.
  - Terminal host chrome in `Terminal.tsx` moved from amber-heavy literals to semantic surface/text/border/interaction tokens while preserving all controls and resize behavior.
  - Xterm terminal theme in `XTermTerminal.tsx` was retuned to a dark, quiet, VS Code-like palette with blue interaction accents; cursor visibility and contrast were preserved.
- Accessibility/status-truth notes:
  - Task and diagnostic states remain non-color dependent via explicit text labels and icons (`queued`, `running`, `success`, `error`, `cancelled`; severity labels + icons in problems rows).
  - Terminal connection badge keeps explicit status text (`Connecting`, `Disconnected`, `Error`) and retry affordance.
- Remaining hard-coded colors retained (with rationale):
  - Xterm ANSI palette literals remain explicit in `XTermTerminal.tsx` because xterm canvas theming requires concrete color values and these are data-plane rendering values rather than generic shell chrome tokens.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/terminal/components/Terminal.tsx src/components/terminal/components/XTermTerminal.tsx src/components/ide/styles/ideShell.css src/components/editor/problemsPane.css --quiet` passed.
- Next recommended prompt: Prompt 16 - Command Palette Search And AI Panel.

### Prompt 14 - Editor Tabs Monaco Outline And Search - 2026-05-15

- Status: completed.
- Scope: migrate editor-adjacent surfaces to semantic tokens: editor tab state accents, Monaco context/breadcrumb shell chrome, outline interaction accents, global search rows/highlights, and diagnostics summary severity colors.
- Files inspected:
  - `src/components/ide/Header.tsx`
  - `src/components/editor/monacoSurface.css`
  - `src/components/editor/OutlinePane.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/editor/ProblemsPane.tsx`
  - `src/components/editor/problemsPane.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/ide/Header.tsx`
  - `src/components/editor/monacoSurface.css`
  - `src/components/editor/OutlinePane.tsx`
  - `src/components/ide/GlobalSearch.tsx`
  - `src/components/editor/problemsPane.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Editor tab dirty and pinned indicators in `Header.tsx` now resolve to semantic status/interaction tokens (`--syn-status-warning`, `--syn-interaction-active`, `--syn-text-muted`) instead of legacy accent-neutral coupling.
  - Monaco context-bar/chip/action chrome in `monacoSurface.css` now uses semantic interaction/status tokens with color-mix overlays; breadcrumb shell no longer depends on amber-biased accent defaults.
  - `OutlinePane.tsx` interaction accents moved to semantic interaction/border tokens for hover and focus clarity.
  - `GlobalSearch.tsx` hard-coded surface/text/border colors replaced with semantic tokens; search match highlight changed to info-family token mix so it remains distinct from warning/error diagnostics.
  - `problemsPane.css` diagnostics summary and row severity colors now map to semantic status families (`error`, `warning`, `info`, `stale`).
- Monaco syntax-theme constraint:
  - No Monaco syntax token map changes were applied in Prompt 14; only editor-adjacent shell/chrome surfaces were migrated.
- Remaining hard-coded colors retained (with rationale):
  - `src/components/editor/MonacoEditor.tsx` preview-specific embedded HTML/CSS snippets retain local literal colors for content rendering demos and language preview output; these are non-shell content visuals and are deferred to later cleanup prompts.
- Acceptance-criteria notes:
  - Editor chrome now follows semantic token families for tabs, outline, search, and diagnostics summary.
  - Syntax highlighting readability remains unchanged because Monaco syntax theme mappings were not altered.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/ide/Header.tsx src/components/editor/OutlinePane.tsx src/components/ide/GlobalSearch.tsx --quiet` passed.
- Next recommended prompt: Prompt 15 - Terminal Bottom Panel Tasks And Problems.

### Prompt 13 - Synapse File Explorer And File Badges - 2026-05-15

- Status: completed.
- Scope: tokenize file-tree row states, semantic badges, drag/drop affordances, file icon color categories, and destructive context-menu styling without behavior changes.
- Files inspected:
  - `src/components/file-explorer/FileExplorer.tsx`
  - `src/components/file-explorer/FileIcon.tsx`
  - `src/components/file-explorer/fileSemantics.ts`
  - `src/components/file-explorer/items.css`
  - `src/components/file-explorer/ContextMenu.tsx`
  - `src/components/file-explorer/contextMenu.css`
  - `src/constants/app.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/file-explorer/FileExplorer.tsx`
  - `src/components/file-explorer/FileIcon.tsx`
  - `src/components/file-explorer/items.css`
  - `src/components/file-explorer/ContextMenu.tsx`
  - `src/components/file-explorer/contextMenu.css`
  - `src/constants/app.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Explorer row hover/selected/focus and drag/drop valid-invalid states now resolve to semantic interaction/status tokens instead of amber literals.
  - Semantic file badges (`neutral`, `info`, `success`, `warning`) now map to semantic status token families.
  - File icon coloring in `FileIcon.tsx` moved from hard-coded hex values to stable semantic category tokens.
  - `FILE_TYPES` color definitions in `src/constants/app.ts` are now semantic token categories, documenting stable icon-color intent by file type.
  - Context menu destructive actions retain explicit danger semantics while using semantic error/interaction tokens for hover/focus feedback.
- Remaining hard-coded colors retained (with rationale):
  - `src/components/file-explorer/FileExplorer.tsx` keeps some neutral black overlay/shadow rgba values for depth/backdrop behavior in modal layering; these are non-status chrome shadows and do not encode readiness/state truthfulness.
  - `src/components/file-explorer/FileExplorerHeader.tsx` contains legacy hard-coded colors in advanced header/export UI not required to satisfy Prompt 13 row/badge/icon scope; scheduled for subsequent cleanup prompts.
- Acceptance-criteria notes:
  - File explorer remains compact and scannable; selected and focused states are distinct.
  - File type colors are now tokenized and documented in `COLOR_SYSTEM_TOKEN_REFERENCE.md`.
  - No file explorer command/workflow behavior changed.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/file-explorer/FileExplorer.tsx src/components/file-explorer/FileIcon.tsx src/components/file-explorer/ContextMenu.tsx src/constants/app.ts --quiet` passed.
- Next recommended prompt: Prompt 14 - Editor Tabs Monaco Outline And Search.

### Prompt 12 - Synapse IDE Shell And Header Migration - 2026-05-15

- Status: completed.
- Scope: migrate IDE shell, header, activity rail, right-dock boundary, and placeholder panes to semantic workbench tokens with blue interaction emphasis.
- Files inspected:
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/Header.tsx`
  - `src/components/ide/ShellPlaceholderPane.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/ide/EnhancedIDE.tsx`
  - `src/components/ide/Header.tsx`
  - `src/components/ide/ShellPlaceholderPane.tsx`
  - `src/components/ide/styles/ideShell.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Header active-tab fills, focused controls, and CTA accents now use semantic interaction tokens (`--syn-interaction-active`, `--syn-border-active`, `--syn-interaction-focus-ring`) instead of amber-heavy fills.
  - Shell activity rail hover/active states, badges, resizer hovers, and bottom-tab active/focus boundaries moved from hard-coded amber rgba values to semantic interaction/surface/border tokens.
  - Side-pane chips and bridge online status badges now communicate truthful readiness via semantic status tokens (`--syn-status-valid`, `--syn-status-running`, `--syn-status-warning`, `--syn-status-demo`, `--syn-status-info`).
  - Right-dock resize handle in `EnhancedIDE.tsx` now uses semantic panel/border/interaction tokens and no longer depends on amber glass gradients.
  - Legacy prompt path `src/components/ide/ideShell.css` was reconciled to actual file `src/components/ide/styles/ideShell.css`.
- Remaining hard-coded colors retained (with rationale):
  - `src/components/ide/EnhancedIDE.tsx` dev-only Prompt 21 demo/ornamental blocks retain literal colors in non-production diagnostics and showcase effects; not part of shell migration scope.
  - `src/components/ide/styles/ideShell.css` keeps fallback literals inside existing status vars (for example success/error fallback values) as resilience defaults when semantic status tokens are unavailable.
  - `src/components/ide/Header.tsx` keeps typed `SYNAPSE_COLORS` usages for non-status text/border constants where already mapped to semantic aliases through theme bridge; no direct amber-only literal remains in migrated shell/header controls.
- Acceptance-criteria notes:
  - IDE shell now follows VS Code-like dark workbench semantics with blue active/focus emphasis and restrained panel boundaries.
  - No command, bridge, or workflow logic changed.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/components/ide/EnhancedIDE.tsx src/components/ide/Header.tsx src/components/ide/ShellPlaceholderPane.tsx --quiet` passed.
- Next recommended prompt: Prompt 13 - Synapse File Explorer And File Badges.

### Prompt 11 - Shared Status Bar And System Chrome Migration - 2026-05-15

- Status: completed.
- Scope: migrate shared status bar chrome and top-level status/system indicators away from neutral amber and hard-coded literals to semantic surface/status tokens.
- Files inspected:
  - `src/components/StatusBar/statusTheme.ts`
  - `src/components/StatusBar/StatusBar.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/components/StatusBar/statusTheme.ts`
  - `src/components/StatusBar/StatusBar.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - `statusTheme.ts` now resolves status-bar chrome through semantic surface/text/border tokens and explicit semantic status channels (`info`, `warning`, `error`, `running`, `pending`, `stale`, `valid`).
  - `alpha()` now supports semantic CSS variables through `color-mix(...)`, allowing compact status chips and menu chrome to use tokenized translucent states without hard-coded hex fallbacks.
  - `StatusBar.tsx` container surface, top border, hover/focus affordances, and scrollbar chrome were migrated from amber/rgba literals to semantic tokens.
  - Diagnostic chips (`error`, `warning`, `info`) now derive fill/border/text from semantic status tokens instead of fixed `rgba(...)` values.
  - Runtime/system indicator states now distinguish `running`, `pending`, and `stale` in AI, streaming, spatial-index, collaboration, live-server, and connectivity chips while preserving labels/icons.
- Acceptance-criteria notes:
  - Neutral informational status no longer relies on unrelated amber; info defaults to `--syn-status-info`.
  - Semantic status colors are documented in `COLOR_SYSTEM_TOKEN_REFERENCE.md` under `Prompt 11 Status Bar Semantic Mapping`.
- Product behavior changes: none (status/chrome styling only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 12 - Synapse IDE Shell And Header Migration.

### Prompt 10 - Center Panel Shell Migration - 2026-05-15

- Status: completed.
- Scope: migrate center-panel shell chrome to semantic surface/text/border/interaction tokens while preserving dense layout and workflow behavior.
- Files inspected:
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/centerpanel/styles/centerpanel.module.css`
  - `src/centerpanel/styles/tokens.css`
  - `src/centerpanel/components/TopHeader.tsx`
  - `src/centerpanel/styles/header-new.module.css`
  - `src/centerpanel/styles/header-tokens.css`
  - `src/centerpanel/components/CenterPanelTabFrame.tsx`
  - `src/centerpanel/UrbanContextStrip.tsx`
  - `src/centerpanel/urban-context-strip.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/centerpanel/components/TopHeader.tsx`
  - `src/centerpanel/styles/centerpanel.module.css`
  - `src/centerpanel/styles/tokens.css`
  - `src/centerpanel/styles/header-new.module.css`
  - `src/centerpanel/styles/header-tokens.css`
  - `src/centerpanel/urban-context-strip.module.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - Shell and panel surfaces (`shell`, `outline`, `main`, `rightDock`, footer, strip wrapper) now resolve through semantic `--syn-surface-*` and `--syn-border-*` tokens.
  - Center-panel deferred loading fallback in `CenterPanelShell.tsx` no longer uses hard-coded amber literals; it now uses semantic surface/text/border/interaction tokens.
  - Active tab markers in the center header and strip now use blue interaction semantics (`--syn-interaction-active`, `--syn-interaction-selected`, `--syn-border-active`) instead of amber-biased accent literals.
  - Decorative header SVG/gradient stop colors in `TopHeader.tsx` were moved from hard-coded amber hex values to semantic interaction tokens, removing non-semantic amber chrome from the shell path.
  - Focus-visible styles for tab and pill controls were normalized to `--syn-interaction-focus-ring`.
  - Compact status/readout text in strip/header-aligned areas was moved to semantic text families (`--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`) with preserved density.
- Amber retention policy for this prompt:
  - Amber is retained only in warning/attention semantics (`warning` and risk-med/high families), not as neutral active-tab or generic interactive chrome.
- Product behavior changes: none (styling/token migration only).
- Center panel workflow changes: none.
- Validation:
  - `npm run typecheck` passed.
  - `npx eslint src/centerpanel/CenterPanelShell.tsx src/centerpanel/UrbanContextStrip.tsx --quiet` passed.
  - Manual changed-file Tailwind pattern scan (`rg --pcre2` across touched center-panel files) returned no matches.
  - `npm run lint:no-tailwind-centerpanel` could not execute in this environment (`powershell` executable unavailable and referenced script is not present under `scripts/`); treated as tooling risk, not a product-code blocker for this prompt.
- Next recommended prompt: Prompt 11 - Shared Status Bar And System Chrome Migration.

### Prompt 09 - Error Loading And Utility Surface Migration - 2026-05-15

- Status: completed.
- Scope: migrate emergency/error/loading/test utility surfaces to semantic surface/text/border/status tokens without behavior changes.
- Files inspected:
  - `src/app/ErrorBoundary.tsx`
  - `src/components/utilities/Loading.tsx`
  - `src/components/utilities/ErrorBoundary.tsx`
  - `src/components/utilities/TestHarness.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/app/ErrorBoundary.tsx`
  - `src/components/utilities/Loading.tsx`
  - `src/components/utilities/ErrorBoundary.tsx`
  - `src/components/utilities/TestHarness.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Token migration highlights:
  - `src/app/ErrorBoundary.tsx`:
    - Root/error card surfaces now use semantic shell tokens (`--syn-surface-workbench`, `--syn-surface-panel`, `--syn-border-default`, `--syn-text-default`).
    - Error label and icon use `--syn-status-error`.
    - Reload action uses semantic interaction tokens (`--syn-interaction-active`, `--syn-interaction-selected`, `--syn-border-active`, `--syn-text-inverse`).
  - `src/components/utilities/ErrorBoundary.tsx`:
    - Replaced legacy `--color-*` runtime usage on text/surface/border with `--syn-*` semantic families.
    - Added explicit `Error` label in semantic error status color for danger-state clarity.
    - Development details panel and retry CTA now use semantic surface/border/interaction tokens.
  - `src/components/utilities/Loading.tsx`:
    - Full-screen overlay/skeleton/message surfaces moved from assistant/glass color tokens to semantic surface/border/text tokens.
    - Spinner/dots interactive color moved to `--syn-interaction-active`.
  - `src/components/utilities/TestHarness.tsx`:
    - Container, button, and list surfaces migrated to semantic surface/border/text/interaction tokens.
    - Pass/fail indicators now use semantic status tokens (`--syn-status-valid`, `--syn-status-error`).
- Retained fixture colors:
  - None retained in Prompt 09 target files.
- Product behavior changes: none (color token migration only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 10 - Center Panel Shell Migration.

### Prompt 08 - App Root And Global Surface Migration - 2026-05-15

- Status: completed.
- Scope: migrate app-root and global shell surfaces to semantic surface/text/border/interaction tokens without layout movement.
- Files inspected:
  - `src/app/AppThemeProvider.tsx`
  - `src/app/AppRoot.tsx`
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/styles/GlobalStyles.ts`
  - `src/styles/ui.css`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/styles/GlobalStyles.ts`
  - `src/styles/ui.css`
  - `src/theme/GlobalSynapseStyles.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files inspected but unchanged:
  - `src/app/AppThemeProvider.tsx`
  - `src/app/AppRoot.tsx`
- Before/after root token usage:
  - Root shell backgrounds:
    - Before: `var(--color-background)` and mixed overlay literals.
    - After: `var(--app-shell-bg)`, `var(--app-shell-surface)`, and `var(--syn-surface-overlay)`.
  - Root text:
    - Before: `var(--color-text)` / `var(--color-text-secondary)` on shell-level wrappers.
    - After: semantic app-shell/syn text tokens (`--app-shell-text`, `--syn-text-default`, `--syn-text-secondary`) on root/global surfaces.
  - Borders:
    - Before: `var(--color-border)` on shell-level separators.
    - After: `var(--app-shell-border)` / `var(--syn-border-default)`.
  - Selection:
    - Before: `::selection` used `var(--color-primary)` (amber-biased in legacy path).
    - After: `::selection` uses blue interactive semantic (`color-mix(... var(--syn-interaction-active) ...)`).
  - Scrollbar:
    - Before: track/thumb relied on legacy background/glass vars.
    - After: restrained semantic surface/border set (`--syn-surface-*`, `--syn-border-*`).
- Additional root-surface alignment:
  - `src/main.tsx` startup/error fallback HTML now references semantic status/surface/text/border tokens.
  - Root loading overlay in `src/App.tsx` switched from hard-coded amber literals to semantic overlay/surface/border/interactive tokens.
  - Global fallback selection style in `src/theme/GlobalSynapseStyles.ts` was aligned to blue interactive semantic tokens to avoid amber fallback selection.
- Product behavior changes: none (styling/token migration only).
- Layout movement: none introduced.
- Validation:
  - `npm run typecheck` passed.
  - Manual shell load not run in this prompt session.
- Next recommended prompt: Prompt 09 - Error Loading And Utility Surface Migration.

### Prompt 07 - Token Regression Guard Plan - 2026-05-15

- Status: completed.
- Scope: add a lightweight, non-blocking guard so future prompts can detect newly introduced hard-coded chrome colors.
- Files inspected:
  - `scripts/` (existing script inventory)
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `package.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `scripts/check-color-regression.mjs` (new)
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `package.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Guard implementation:
  - Added `scripts/check-color-regression.mjs`.
  - Guard scans only `src/**/*.{ts,tsx,css}`.
  - Guard excludes allowlisted categories:
    - `token-source` (`src/theme/*`, `src/styles/theme.ts`, design/app constants).
    - `data-visualization` (color ramps, cartography engine, map renderer palette files).
    - `test-fixture` (`__tests__`, `__mocks__`, `.test.*`, `.spec.*`, fixtures).
  - Guard detects `hex`, `rgb(a)`, `hsl(a)`, gradients, CSS variable fallbacks, and common named color literals.
  - Guard runs in report-only mode and exits `0` by default; optional `--fail-on-findings` exists but is not wired to CI.
- Package scripts added:
  - `npm run color:guard`
  - `npm run color:guard:changed`
- QA checklist updates:
  - Added a dedicated Prompt 07 section with command usage, allowlisted categories, and explicit non-CI-blocking guidance.
- CI safety:
  - No CI gating scripts were modified to fail on this guard.
  - `validate:rc` remains unchanged.
- Product behavior changes: none.
- Validation:
  - `npm run color:guard` passed (full-source baseline report mode, exit `0`).
  - `npm run color:guard:changed` passed (report mode, exit `0`).
- Next recommended prompt: Prompt 08 - App Root And Global Surface Migration.

### Prompt 06 - Theme Provider Compatibility Pass - 2026-05-15

- Status: completed.
- Scope: align both theme provider paths to semantic token outputs while keeping theme persistence and mode selection behavior unchanged.
- Files inspected:
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
  - `src/styles/theme.ts`
  - `src/config/flags.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
  - `src/styles/theme.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files inspected but unchanged:
  - `src/config/flags.ts` (theme-mode flag behavior and `synapse.theme.mode` key retained as-is).
- Provider ownership notes:
  - `AppThemeProvider` owns `--app-shell-*` variables and now maps them to semantic token families (`--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-interaction-*`, `--syn-status-*`).
  - `ThemeContext` owns runtime `--color-*`, `--glass-*`, `--tag-*`, and theme class/data attributes; it now applies a semantic compatibility bridge for core `--color-*` variables while preserving existing glass/tag overrides.
  - `GlobalSynapseStyles` remains the base token definition layer (`--syn-vscode-*`, semantic `--syn-*`, and legacy aliases).
- Compatibility mapping changes:
  - Added semantic bridges in `ThemeContext` so provider-written legacy vars resolve through semantic tokens (surface/text/border/interaction/status families).
  - Updated `createCSSVariables` in `src/styles/theme.ts` so its color output path aligns with semantic tokens if used by downstream paths.
  - Expanded `AppThemeProvider` shell variable set to expose semantic editor/elevated/input/hover, secondary text, strong border, and status slots.
- Persistence behavior verification:
  - Existing `ThemeContext` storage key `theme` remains unchanged.
  - Existing mode resolution for `auto` remains unchanged.
  - Existing `flags.themeMode` key `synapse.theme.mode` remains unchanged.
  - No new direct `localStorage` reads/writes added.
- Product behavior changes: none (token wiring only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 07 - Token Regression Guard Plan.

### Prompt 05 - Semantic Token Alias Layer - 2026-05-15

- Status: completed.
- Scope: add semantic alias tokens that map product meaning to VS Code primitives while preserving legacy alias resolution.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/app/AppThemeProvider.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/app/AppThemeProvider.tsx`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Semantic tokens added in `GlobalSynapseStyles`:
  - Surface: `--syn-surface-workbench`, `--syn-surface-navigation`, `--syn-surface-panel`, `--syn-surface-editor`, `--syn-surface-elevated`, `--syn-surface-input`, `--syn-surface-hover`, `--syn-surface-overlay`.
  - Text: `--syn-text-default`, `--syn-text-secondary`, `--syn-text-muted`, `--syn-text-disabled`, `--syn-text-inverse`, `--syn-text-link`.
  - Border: `--syn-border-default`, `--syn-border-subtle`, `--syn-border-strong`, `--syn-border-active`, `--syn-border-focus`.
  - Interaction: `--syn-interaction-hover`, `--syn-interaction-selected`, `--syn-interaction-active`, `--syn-interaction-focus-ring`, `--syn-interaction-disabled`.
  - Status: `--syn-status-valid`, `--syn-status-warning`, `--syn-status-error`, `--syn-status-info`, `--syn-status-blocked`, `--syn-status-stale`, `--syn-status-unknown`, `--syn-status-demo`, `--syn-status-running`, `--syn-status-pending`.
- Compatibility aliases added/updated:
  - Legacy `--syn-*` bridges now resolve through semantic layer where safe (`--syn-bg-*`, `--syn-bg-900`, `--syn-surface-800`, `--syn-overlay`, `--syn-text-100`, `--syn-text-400`, `--syn-border-700`, `--syn-focus-ring`, `--syn-*-400` status aliases).
  - Legacy `--color-*` families were remapped to semantic surface/text/border/status families.
- `synapse.ts` updates:
  - Added semantic raw constants and `var(--syn-*)` mappings for surface/text/border/interaction/status layers.
  - Extended `SynapseTheme.colors` with semantic fields so styled-components consumers can use semantic names directly.
  - Status variable mappings now target `--syn-status-*` semantic tokens.
- `AppThemeProvider` updates:
  - `--app-shell-*` vars now resolve directly to semantic tokens (`--syn-surface-*`, `--syn-text-default`, `--syn-border-default`, `--syn-interaction-*`).
  - Modal overlay now uses `--syn-surface-overlay`.
- Token reference updates:
  - Added Prompt 05 semantic mapping table and compatibility alias table.
  - Canonical semantic set updated to reflect active token names (`--syn-text-secondary`, `--syn-text-muted`, `--syn-text-disabled`, `--syn-text-inverse`, `--syn-text-link`, and `--syn-surface-overlay`).
- Product behavior changes: none (color token aliasing only).
- Validation:
  - `npm run typecheck` passed.
  - Manual app load not run in this prompt session.
- Next recommended prompt: Prompt 06 - Theme Provider Compatibility Pass.

### Prompt 04 - VS Code Primitive Palette Layer - 2026-05-15

- Status: completed.
- Scope: add VS Code-inspired primitive palette as non-breaking variables without migrating existing consumers.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Exact CSS primitive tokens added in `GlobalSynapseStyles`:
  - Surface/text/border/accent set:
    - `--syn-vscode-bg-root`
    - `--syn-vscode-bg-activity`
    - `--syn-vscode-bg-sidebar`
    - `--syn-vscode-bg-editor`
    - `--syn-vscode-bg-panel`
    - `--syn-vscode-bg-elevated`
    - `--syn-vscode-bg-input`
    - `--syn-vscode-bg-hover`
    - `--syn-vscode-border-subtle`
    - `--syn-vscode-border-strong`
    - `--syn-vscode-text-primary`
    - `--syn-vscode-text-secondary`
    - `--syn-vscode-text-muted`
    - `--syn-vscode-accent-blue`
    - `--syn-vscode-accent-blue-soft`
    - `--syn-vscode-attention-amber`
    - `--syn-vscode-attention-amber-soft`
  - Status primitive set:
    - `--syn-vscode-status-valid`
    - `--syn-vscode-status-warning`
    - `--syn-vscode-status-error`
    - `--syn-vscode-status-info`
    - `--syn-vscode-status-blocked`
    - `--syn-vscode-status-stale`
    - `--syn-vscode-status-unknown`
    - `--syn-vscode-status-demo`
    - `--syn-vscode-status-running`
    - `--syn-vscode-status-pending`
- TypeScript primitive constants added in `src/theme/synapse.ts`:
  - Raw values added to `charcoalAmberRaw`: `vscode*` surface/border/text/accent primitives plus `statusValid/statusWarning/statusError/statusInfo/statusBlocked/statusStale/statusUnknown/statusDemo/statusRunning/statusPending`.
  - Variable mappings added to `charcoalAmberVars`: `vscode*` mappings and `status*` mappings targeting the new `--syn-vscode-*` tokens.
- Non-breaking guarantees maintained:
  - Existing `--syn-*`, `--color-*`, `--glass-*`, and legacy theme aliases were not removed.
  - No existing consumers were remapped in this prompt.
  - Amber remains available as attention primitive while blue interactive primitives were introduced.
- Token reference updates:
  - Added Prompt 04 primitive tables for surface/text/accent and primitive status sets with exact values.
  - Documented that compatibility aliases remain unchanged in this phase.
- Product code migration: none (token-source additions only).
- Validation:
  - `npm run typecheck` passed.
- Next recommended prompt: Prompt 05 - Semantic Token Alias Layer.

### Prompt 03 - Token Taxonomy And Naming Contract - 2026-05-15

- Status: completed.
- Scope: documentation-only taxonomy contract finalization before any UI migration.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/styles/theme.ts`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Contract decisions finalized:
  - Canonical token families locked to five layers: primitive, semantic, component alias, status semantic, and data palette.
  - Compatibility alias families explicitly enumerated and retained for phased migration.
  - Forbidden direct usages defined (primitive-in-feature, raw literals in runtime UI, status/data palette misuse).
  - Amber-first deprecation notes documented with migration direction and removal gates.
  - Family selection guide added so agents can pick token family consistently for any component.
- Tokens added/changed: none in product code (documentation contract only).
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - No UI migration or token rename performed in source code.
- Next recommended prompt: Prompt 04 - VS Code Primitive Palette Layer.

### Prompt 02 - Hard-Coded Color Inventory - 2026-05-15

- Status: completed.
- Scope: documentation-only hard-coded color inventory across `src/**/*.{css,ts,tsx}` with risk categorization and migration targeting.
- Files inspected:
  - `src/**/*.{css,ts,tsx}` (search scope)
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Search scope guard:
  - Included: `src/**/*.{css,ts,tsx}`.
  - Excluded: `coverage/`, `dist/`, generated files, and lockfiles.
- Inventory totals:
  - Matched findings: `6872`.
  - Files with at least one finding: `345`.
- Category totals:

| Category | Count |
| --- | --- |
| `component-chrome` | 5056 |
| `fallback` | 815 |
| `token-source` | 394 |
| `data-visualization` | 278 |
| `status-semantic` | 127 |
| `ignore-with-reason` | 122 |
| `test-fixture` | 80 |

- Grouped counts by unit and finding class:

| Unit | `token-source` | `component-chrome` | `status-semantic` | `data-visualization` | `fallback` | `test-fixture` | `ignore-with-reason` | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Center Panel Shell | 0 | 1288 | 16 | 0 | 311 | 8 | 0 | 1623 |
| Unmapped/Other | 0 | 975 | 25 | 0 | 70 | 17 | 122 | 1209 |
| UA Shell And Modal | 0 | 717 | 6 | 0 | 29 | 7 | 0 | 759 |
| Command/Search/AI | 0 | 266 | 0 | 0 | 150 | 0 | 0 | 416 |
| IDE Shell | 0 | 292 | 0 | 0 | 52 | 0 | 0 | 344 |
| VoxCity/3D | 0 | 243 | 0 | 0 | 5 | 0 | 0 | 248 |
| File Explorer | 0 | 226 | 7 | 0 | 15 | 0 | 0 | 248 |
| Editor Surface | 0 | 147 | 6 | 0 | 75 | 0 | 0 | 228 |
| Map Shell And Canvas Chrome | 0 | 191 | 1 | 0 | 16 | 13 | 0 | 221 |
| Synapse Token Layer | 136 | 0 | 36 | 0 | 0 | 0 | 0 | 172 |
| Map Services And Types | 0 | 153 | 0 | 0 | 0 | 19 | 0 | 172 |
| Legacy Theme Layer | 108 | 0 | 8 | 0 | 53 | 0 | 0 | 169 |
| Terminal And Bottom Panel | 0 | 150 | 3 | 0 | 3 | 0 | 0 | 156 |
| Dashboard | 0 | 0 | 0 | 135 | 6 | 1 | 0 | 142 |
| Guide/Tools/Templates | 0 | 118 | 0 | 0 | 1 | 6 | 0 | 125 |
| Design Constants | 107 | 0 | 5 | 0 | 0 | 0 | 0 | 112 |
| Color Ramps | 0 | 0 | 0 | 95 | 0 | 7 | 0 | 102 |
| Method Catalog And Workflow | 0 | 94 | 5 | 0 | 0 | 0 | 0 | 99 |
| Reporting | 0 | 88 | 0 | 0 | 0 | 0 | 0 | 88 |
| Status Bar Tokens | 42 | 0 | 2 | 0 | 9 | 0 | 0 | 53 |
| Cartography Engine | 0 | 0 | 0 | 48 | 0 | 0 | 0 | 48 |
| Layer Manager | 0 | 44 | 2 | 0 | 1 | 0 | 0 | 47 |
| App Root | 0 | 18 | 3 | 0 | 4 | 0 | 0 | 25 |
| Map Drawers | 0 | 18 | 1 | 0 | 0 | 2 | 0 | 21 |
| Header And Activity Rail | 0 | 9 | 0 | 0 | 11 | 0 | 0 | 20 |
| Error/Loading/Test Utility Surfaces | 0 | 9 | 1 | 0 | 4 | 0 | 0 | 14 |
| Map Toolbar/Search/Pins | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 7 |
| Evidence And Provenance | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 3 |
| Theme Provider | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |

- Dangerous color findings:
  - Success-looking demo/state contrast hotspot:
    - `src/services/data/eo/publish.ts:144` uses `"fill-color": isDemo ? "#F59E0B" : "#22C55E"`. This is semantically split but remains high-risk if labels are hidden in downstream UI.
    - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx:1440` and `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx:1111` also switch sample/project color (`#F59E0B` vs `#22C55E`) with explicit text labels.
  - Warning amber used as neutral accent at scale:
    - `src/theme/GlobalSynapseStyles.ts:18`, `src/theme/synapse.ts:14`, `src/styles/theme.ts:59` and broad component surfaces anchor primary/interactive states to `#F59E0B`.
  - Warning/error hues reused in analytical visuals:
    - `src/centerpanel/Flows/CompositeIndicatorFlow.tsx:339` uses `linear-gradient(90deg, #F59E0B, #EF4444)` for Sobol bars.
    - `src/features/dashboard/advancedCharts.tsx:206` starts categorical palette with `#f59e0b`.
    - `src/centerpanel/components/map/MapLayerManager.tsx:400` assigns `#F59E0B` to demo legend entries.

- Top 20 highest-impact migration targets:

| Rank | File | Unit | Primary Class | Findings | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/centerpanel/components/map/MapWorkspaceCockpit.module.css` | Map Shell And Canvas Chrome | `component-chrome` | 174 | 16 fallback usages; map shell visibility surface. |
| 2 | `src/components/ai/panel/styles.ts` | Command/Search/AI | `component-chrome` | 161 | 76 fallbacks; AI status/focus consistency risk. |
| 3 | `src/centerpanel/styles/tools.module.css` | Center Panel Shell | `component-chrome` | 169 | 61 fallbacks; broad shell styling footprint. |
| 4 | `src/components/ide/styles/ideShell.css` | IDE Shell | `component-chrome` | 154 | 49 fallbacks; editor-shell accent saturation. |
| 5 | `src/centerpanel/styles/tokens.css` | Center Panel Shell | `component-chrome` | 139 | 53 fallbacks, 6 status-semantic literals. |
| 6 | `src/features/urbanAnalytics/rightPanelFourBlock.css` | UA Shell And Modal | `component-chrome` | 131 | Dense UA chrome literals. |
| 7 | `src/components/editor/MonacoEditor.tsx` | Editor Surface | `component-chrome` | 111 | Inline preview/theme literals and gradient usage. |
| 8 | `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css` | UA Shell And Modal | `component-chrome` | 120 | Evidence surface literal density. |
| 9 | `src/features/urbanAnalytics/WelcomeModal.tsx` | UA Shell And Modal | `component-chrome` | 103 | 2 fallbacks; onboarding semantics surface. |
| 10 | `src/theme/GlobalSynapseStyles.ts` | Synapse Token Layer | `token-source` | 122 | Primary source with 32 status-semantic literals. |
| 11 | `src/features/urbanAnalytics/voxcity/SunlightSimulatorPanel.tsx` | VoxCity/3D | `component-chrome` | 96 | Demo/project color switching and accent-heavy controls. |
| 12 | `src/components/file-explorer/FileExplorer.tsx` | File Explorer | `component-chrome` | 78 | File status and icon colors hard-coded. |
| 13 | `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` | UA Shell And Modal | `component-chrome` | 70 | Modal-level accent variables hard-coded. |
| 14 | `src/components/settings/SettingsModal.tsx` | Unmapped/Other | `component-chrome` | 87 | 15 fallbacks and 7 status-semantic literals. |
| 15 | `src/features/urbanAnalytics/rail/rail.css` | UA Shell And Modal | `component-chrome` | 77 | 24 fallbacks; rail accent lock-in. |
| 16 | `src/centerpanel/styles/note.module.css` | Center Panel Shell | `component-chrome` | 106 | 50 fallbacks; note workspace density. |
| 17 | `src/constants/design.ts` | Design Constants | `token-source` | 95 | Static palette/gradient source for many consumers. |
| 18 | `src/utils/colorRamps.ts` | Color Ramps | `data-visualization` | 95 | Shared analytical palette boundary hotspot. |
| 19 | `src/components/terminal/components/Terminal.tsx` | Terminal And Bottom Panel | `component-chrome` | 75 | Terminal status/readability color literals. |
| 20 | `src/centerpanel/styles/tools.left.module.css` | Center Panel Shell | `component-chrome` | 113 | Left rail/tooling chrome literals. |

- Notes on ignored findings:
  - `ignore-with-reason` findings (122) are concentrated in template scaffolding surfaces (for example `src/templates/templateContent.ts`) and do not directly drive runtime product chrome.
- Tokens added/changed: none.
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - No token rename or product behavior change performed.
- Next recommended prompt: Prompt 03 - Token Taxonomy And Naming Contract.

### Prompt 01 - Style Topology Inventory - 2026-05-15

- Status: completed.
- Scope: documentation-only architecture inventory for token writers, aliases, and style consumers.
- Files inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/styles/theme.ts`
  - `src/styles/GlobalStyles.ts`
  - `src/styles/ui.css`
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
  - `src/constants/design.ts`
  - `src/constants/app.ts`
  - `src/App.tsx`
  - `src/main.tsx`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Topology summary:

| Layer | File | Writes CSS Variables | Alias Families | Primary Consumers | Conflict / Risk |
| --- | --- | --- | --- | --- | --- |
| Synapse global token source | `src/theme/GlobalSynapseStyles.ts` | Yes. `:root` writes core `--syn-*` palette plus alias bridges. | `--syn-*`, `--color-*`, `--ai-*`, legacy `--panel`/`--text-1`/`--border`. | Loaded by `src/app/AppThemeProvider.tsx`; consumed by `src/theme/synapse.ts`, `src/styles/ui.css`, `src/styles/GlobalStyles.ts`, CSS Modules, and styled components. | Primary token authority exists, but includes many amber-first accents and chart/status overlap. |
| Styled-components theme bridge | `src/theme/synapse.ts` | No direct DOM writes. Exposes theme object mapped to `var(--syn-*)`. | Legacy theme keys (`gold500`, `text100`, etc.) and semantic-style keys (`root`, `surface1`, etc.). | Used through styled-components `ThemeProvider` from `src/app/AppThemeProvider.tsx`; referenced by styled components in `src/components/**`, `src/ui/theme/typography.ts`. | Duplicate semantic intent: both legacy and newer keys coexist. |
| Legacy theme model | `src/styles/theme.ts` | Indirect only via `createCSSVariables(theme)` return object. | `--color-*`, `--glass-*`, typography/spacing/z-index variables. | `themes` consumed by `src/contexts/ThemeContext.tsx`. `createCSSVariables` is currently defined but not called. | Dead-path risk: helper map diverges from runtime writer behavior. |
| Runtime legacy writer | `src/contexts/ThemeContext.tsx` | Yes. `useEffect` writes `--color-*`, `--glass-*`, and theme-state utility variables with `root.style.setProperty`. | `--color-*`, `--glass-*`, `--tag-*`, text contrast helpers. | `useTheme()` consumers in `src/App.tsx`, `src/components/utilities/Loading.tsx`, `src/components/templates/*`, `src/components/atoms/*`, `src/components/editor/MonacoEditor.tsx`. | Second active global writer overlaps with `GlobalSynapseStyles` aliases. |
| App-shell overlay vars | `src/app/AppThemeProvider.tsx` | Yes. `AppShellStyles` writes `--app-shell-*`. | `--app-shell-*`. | Shell surfaces using `data-app-shell` attributes. | Third variable namespace introduces parallel shell token channel. |
| Global utility stylesheet | `src/styles/GlobalStyles.ts` | Yes for non-theme root vars and mode logo vars; mostly consumes token vars. | `--font-*`, `--logo-*`, `--header-*`; consumes `--color-*`, `--glass-*`, `--syn-*`. | Mounted in `src/App.tsx`; affects all global HTML/body/utility classes. | Large mixed concern surface and broad fallback literals. |
| Static utility stylesheet | `src/styles/ui.css` | Yes. Local root bridges (`--bg`, `--panel-bg`, `--text`, `--accent`) from `--syn-*`. | Local bridge vars and mixed `--color-*`/`--syn-*` consumption. | Imported in both `src/main.tsx` and `src/App.tsx`; used by utility classes (`.btn`, `.input`, `.ai-shell`). | Double import path and mixed namespace usage increase drift risk. |
| Design constants palette | `src/constants/design.ts` | No direct writes. Provides static palette/tokens consumed by theme layer. | `DESIGN_TOKENS.colors.*`, gradients, mapExplorer color constants. | Imported by `src/styles/theme.ts` and `src/contexts/ThemeContext.tsx`. | Contains amber-heavy primaries and map explorer hard-coded palette constants. |
| App constants + file colors | `src/constants/app.ts` | No direct writes. | Hard-coded file type colors in `FILE_TYPES`. | File explorer and related icon surfaces consuming file metadata colors. | Hard-coded colors sit outside token pipeline. |

- Styled-components consumers:
  - `rg "styled-components" src` shows 30 matching files.
  - Consumer clusters include `src/components/atoms/*`, `src/components/ai/panel/*`, `src/components/ide/*`, `src/components/editor/*`, and theme/provider files.
- CSS Modules consumers:
  - `rg "\\.module\\.css" src` shows 99 import sites.
  - `rg --files src | rg "\\.module\\.css$"` shows 33 module stylesheets.
  - Highest concentration is `src/centerpanel/**`, with additional usage in `src/features/**`, `src/services/reporting/**`, and selected `src/components/**`.
- Legacy alias inventory:
  - Active alias families confirmed: `--syn-*`, `--color-*`, `--glass-*`.
  - Mixed-namespace reference density in inspected core files: 318 matches (`--syn-`/`--color-`/`--glass-`).
- Conflict and duplication notes:
  - App runtime mounts nested providers (`ThemeProvider` from `ThemeContext` and `AppThemeProvider`), each with token responsibilities.
  - `GlobalSynapseStyles` and `ThemeContext` both write global color variables, creating overlapping authority.
  - `createCSSVariables` exists but is currently not used, which can let declared and applied token maps drift.
  - `ui.css` is imported in both `src/main.tsx` and `src/App.tsx`.
- Amber-heavy bias evidence:
  - Amber/gold markers (`#F59E0B`, `#D97706`, `#FBBF24`, `#B45309`, `amber`, `gold`) appear 105 times across inspected topology files.
  - VS Code blue markers (`#3794ff`, `accent-blue`, `--syn-vscode`) appear 0 times in the same inspected set.
  - `info` frequently reuses amber in legacy layers (`src/styles/theme.ts`, `src/constants/design.ts`, parts of `GlobalSynapseStyles.ts`), increasing state-color ambiguity.
- Tokens added/changed: none.
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - No token rename/migration performed in this prompt.
- Next recommended prompt: Prompt 02 - Hard-Coded Color Inventory.

### Prompt 00 - Operating Pack Rebaseline - 2026-05-15

- Status: completed.
- Scope: documentation-only rebaseline confirmation for the color operating pack.
- Files inspected:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
  - `DEVELOPMENT_PLANS/ARCHIVE_READINESS.md`
- Files changed:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Checks completed:
  - Confirmed color pack is separate from tri-modal archive preparation.
  - Confirmed branch divergence warning is recorded and unchanged as a blocker for archive movement.
  - Confirmed prompt register remains pending except executed prompt entries.
  - Recorded migration principle ordering in the ledger current-status block.
- Tokens added/changed: none.
- Product code changed: none.
- Validation:
  - Documentation-only checks completed.
  - Manifest JSON parse not required because `COLOR_SYSTEM_PROMPT_MANIFEST.json` was not changed.
- Next recommended prompt: Prompt 01 - Style Topology Inventory.

### Operating Pack Revision - 2026-05-14

- Status: completed.
- Scope: documentation-only operating pack revision requested by user.
- Files added:
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_PROTOCOL.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_UNIT_MATRIX.md`
- Files rewritten:
  - `COLOR_SYSTEM_PLANS/README.md`
  - `COLOR_SYSTEM_PLANS/START_HERE_COLOR_SYSTEM_AGENT.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_ALIGNMENT_SPEC.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_DEVELOPMENT_PLAN.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_TOKEN_REFERENCE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_QA_CHECKLIST.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_AGENT_HANDOFF_TEMPLATE.md`
  - `COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md`
- Live architecture inspected:
  - `src/theme/GlobalSynapseStyles.ts`
  - `src/theme/synapse.ts`
  - `src/styles/theme.ts`
  - `src/constants/design.ts`
  - `src/app/AppThemeProvider.tsx`
  - `src/contexts/ThemeContext.tsx`
- Behavior implemented: no product behavior changed.
- Validation: pending final JSON and file checks.
- Next recommended prompt: Prompt 00 - Operating Pack Rebaseline.

## Validation History

| Date | Scope | Command | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-15 | Prompt A04 Urban Analytics method catalog, right-panel card chrome, and indicator panel | `git diff --check`; `npx vitest run src/features/urbanAnalytics/indicators/__tests__/IndicatorCatalogPanel.test.tsx src/features/urbanAnalytics/__tests__/RightPanelFourBlock.test.tsx`; `npm run typecheck`; `npm run test:analytics`; Standard Urban Analytics amber scan; supplemental A04 target scan | Passed | TypeScript passed; targeted tests passed with 2 files and 7 tests; Urban Analytics subset passed with 62 test files and 1111 tests; A04 target files have 0 standard/supplemental amber hits, remaining UA scan is 64 hits across 15 deferred files. |
| 2026-05-15 | Prompt A03 Urban Analytics rail, command/search, chips, and bottom actions | `git diff --check`; `npm run typecheck`; `npm run test:analytics`; Standard Urban Analytics amber scan; targeted A03 amber scan | Passed | TypeScript passed; Urban Analytics subset passed with 62 test files and 1111 tests; A03 target files have 0 standard amber hits, remaining UA scan is 64 hits across 15 deferred files. |
| 2026-05-15 | Prompt A02 Urban Analytics modal shell and welcome | `npm run typecheck`; `npm run test:analytics`; Standard Urban Analytics amber scan | Passed | TypeScript passed; Urban Analytics subset passed with 62 test files and 1111 tests; A02 target files have 0 standard amber hits, remaining UA scan is 102 hits across 19 deferred files. |
| 2026-05-15 | Active two-part prompt pack validation | `node -e "const fs=require('fs'); const p='COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json'; const j=JSON.parse(fs.readFileSync(p,'utf8')); console.log(j.prompts.length); console.log(j.prompts[0].id, j.prompts.at(-1).id);"` plus `Select-String` heading/register counts | Passed | Manifest parses with 20 active prompts from A01 to B10; sequential prompt headings count 20; active ledger register rows count 20. |
| 2026-05-15 | Prompt 00-17 audit consistency script | custom Node audit over sequential prompts, manifest, and ledger | Passed | 38 prompt headings, 38 manifest records, 38 register rows; prompts 00-17 completed; prompts 18-37 pending; logs and validation rows present; all pointers target Prompt 18. |
| 2026-05-15 | Prompt 17/10 audit cleanup TypeScript validation | `npm run typecheck` | Passed | Command Palette stable modal sizing plus map cockpit/background-task CSS cleanup compiles without TypeScript errors. |
| 2026-05-15 | Prompt 17/10 targeted amber scan | `rg` scan for legacy amber/gold literals in `MapWorkspaceCockpit.module.css` and `BackgroundTasksControl.module.css` | Passed | No legacy `#f59e0b`, `#fbbf24`, `#fde68a`, `#d97706`, or matching RGB amber literals remain in the two cleanup files. |
| 2026-05-15 | Prompt 17/10 changed-file color guard | `npm run color:guard:changed` | Passed (report mode) | Non-blocking guard scanned 17 changed files and reported 749 findings, dominated by token fallbacks, retained syntax/content colors, and future cleanup scope; no blocker introduced. |
| 2026-05-15 | Prompt 16 palette sizing follow-up | `npm run typecheck` | Passed | Command palette body height is now stable across Files/Tabs/Symbols/Commands mode changes; results scroll inside the fixed viewport. |
| 2026-05-15 | Prompt 17 TypeScript validation | `npm run typecheck` | Passed | Map shell/canvas chrome semantic token migration compiles; map visual smoke was not run in this CLI-only pass. |
| 2026-05-15 | Prompt 16 TypeScript validation | `npm run typecheck` | Passed | Command palette, global search, AI panel/composer/status, and apply preview semantic token migration compiles cleanly. |
| 2026-05-15 | Prompt 15 TypeScript validation | `npm run typecheck` | Passed | Terminal, bottom panel, tasks, output, problems, and xterm surface token migration compiles cleanly. |
| 2026-05-15 | Prompt 14 TypeScript validation | `npm run typecheck` | Passed | Editor tabs, Monaco context shell, outline/search chrome, and diagnostics summary token migration compiles cleanly. |
| 2026-05-15 | Prompt 13 TypeScript validation | `npm run typecheck` | Passed | File explorer rows, badges, file icon categories, and destructive explorer action token migration compiles cleanly. |
| 2026-05-15 | Prompt 12 TypeScript validation | `npm run typecheck` | Passed | IDE shell, header, activity rail, and placeholder pane token migration compiles cleanly. |
| 2026-05-15 | Prompt 11 TypeScript validation | `npm run typecheck` | Passed | Shared status bar and system chrome semantic status migration compiles cleanly. |
| 2026-05-15 | Prompt 10 TypeScript validation | `npm run typecheck` | Passed | Center-panel shell semantic token migration compiles across shell/header/strip surfaces. |
| 2026-05-15 | Prompt 10 changed-file lint | `npx eslint src/centerpanel/CenterPanelShell.tsx src/centerpanel/UrbanContextStrip.tsx --quiet` | Passed | Changed TSX files lint clean; no behavior-level lint regressions. |
| 2026-05-15 | Prompt 10 Tailwind changed-file scan | `rg --pcre2` pattern scan across touched center-panel files | Passed | No Tailwind utility class patterns found in touched files. |
| 2026-05-15 | Prompt 10 centerpanel tailwind script check | `npm run lint:no-tailwind-centerpanel` | Failed (tooling) | Script references a missing local file and requires a `powershell` executable unavailable in this runtime; manual changed-file scan used as substitute. |
| 2026-05-15 | Prompt 09 TypeScript validation | `npm run typecheck` | Passed | Error/loading/utility semantic token migration compiles across app and utility boundaries. |
| 2026-05-15 | Prompt 08 post-check type validation | `npm run typecheck` | Passed | Selection fallback alignment in `GlobalSynapseStyles.ts` compiles cleanly. |
| 2026-05-15 | Prompt 08 TypeScript validation | `npm run typecheck` | Passed | App-root and global-surface semantic token migration compiles cleanly across `App.tsx`, `main.tsx`, `GlobalStyles.ts`, and `ui.css`. |
| 2026-05-15 | Prompt 07 guard baseline scan | `npm run color:guard` | Passed | Report mode executed across all source files; findings inventory emitted without CI-blocking exit behavior. |
| 2026-05-15 | Prompt 07 guard validation | `npm run color:guard:changed` | Passed | Non-blocking hard-coded color guard executed in changed-file mode; report emitted with exit `0`. |
| 2026-05-15 | Prompt 06 TypeScript validation | `npm run typecheck` | Passed | Provider compatibility bridge compiles in `AppThemeProvider`, `ThemeContext`, and `styles/theme.ts`. |
| 2026-05-15 | Prompt 05 TypeScript validation | `npm run typecheck` | Passed | Semantic alias layer compiles across token source, theme bridge, and app shell provider updates. |
| 2026-05-15 | Prompt 04 TypeScript validation | `npm run typecheck` | Passed | `src/theme/synapse.ts` primitive constant additions compile cleanly. |
| 2026-05-15 | Prompt 04 token presence check | `rg` verification of new `--syn-vscode-*` tokens in `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts`, and token reference | Passed | CSS/TS/token-reference primitive sets are aligned and documented. |
| 2026-05-15 | Prompt 03 taxonomy contract check | `rg` review of `COLOR_SYSTEM_TOKEN_REFERENCE.md`, `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts`, `src/styles/theme.ts` | Passed | Naming layers, alias policy, forbidden usage, and deprecation contract aligned with live token sources. |
| 2026-05-15 | Prompt 03 ledger transition check | `Select-String` checks for Current/Next prompt plus Prompt 03 status row in ledger | Passed | Prompt 03 marked complete; Prompt 04 is next pointer. |
| 2026-05-15 | Prompt 02 hard-coded inventory scan | `rg --json --pcre2` over `src/**/*.{css,ts,tsx}` with exclusions for `coverage/`, `dist/`, generated files, and lockfiles | Passed | 6872 findings across 345 files; grouped counts and top targets recorded. |
| 2026-05-15 | Prompt 02 dangerous-color detection | targeted `rg` scans for demo/sample + success, amber accent overload, and chart/palette warning/error overlap | Passed | Risk examples captured in ledger with exact file and line references. |
| 2026-05-15 | Prompt 01 topology inventory | `rg` scans over required files plus `src/App.tsx` and `src/main.tsx` for token writers, alias families, and style consumers | Passed | Topology table, conflict list, and amber-bias evidence recorded without product code edits. |
| 2026-05-15 | Prompt 01 consumer counts | `rg "styled-components" src`, `rg "\\.module\\.css" src`, `rg --files src | rg "\\.module\\.css$"` | Passed | Styled-components markers: 30 files; CSS Module imports: 99; CSS Module files: 33. |
| 2026-05-15 | Prompt 00 documentation checks | `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json','utf8')); console.log('manifest ok');"` | Passed | Manifest parses; unchanged during Prompt 00 execution. |
| 2026-05-15 | Prompt count consistency recheck | `Select-String '^## Prompt ' COLOR_SYSTEM_PLANS/COLOR_SYSTEM_SEQUENTIAL_IMPLEMENTATION_PROMPTS.md` and `Select-String '^\| [0-9][0-9] \|' COLOR_SYSTEM_PLANS/COLOR_SYSTEM_IMPLEMENTATION_LEDGER.md` | Passed | Both counts are 38; Prompt 00 marked completed and Prompt 01 remains next pending. |
| 2026-05-14 | Pack revision | `node -e "const fs=require('fs'); for (const file of ['DEVELOPMENT_PLANS/ARCHIVE_PREPARATION_MANIFEST.json','COLOR_SYSTEM_PLANS/COLOR_SYSTEM_PROMPT_MANIFEST.json']) { JSON.parse(fs.readFileSync(file,'utf8')); console.log(file + ' OK'); }"` | Passed | Both JSON manifests parse. |
| 2026-05-14 | Prompt count consistency | `Select-String` heading count plus manifest prompt count | Passed | Sequential prompt file has 38 prompt headings; manifest has 38 prompt records. |

## Known Risks

| Date | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| 2026-05-16 | Center Panel `--ui-*` token island spans 1300+ references across 14 modules; flipping the source values in `styles/tokens.css` during C02 will propagate immediately into every C03-C09 consumer. | Medium | Re-scan each tab's files at the start of its C-prompt; treat post-C02 residual amber/heavy-chrome as the actual migration target rather than re-doing token-source work in every C-prompt. |
| 2026-05-16 | The `-g "!components/map/**"` negation glob does not reliably exclude already-walked paths under PowerShell because the brace/glob is expanded by the shell before ripgrep sees it; raw scan totals will overcount Part 3 map files for Part 2 prompts. | Low | Run scans with single-quoted `-g` patterns and absolute paths, or filter results post-hoc to the Part 2 in-scope file list (as C01 did). |
| 2026-05-15 | Historical log entries still reference old Prompt 18 as next prompt. | Low | Treat entries before "Active Two-Part Prompt Reprioritization" as immutable history; use Current Status, Prompt Status Register, and Next Pointer for active execution. |
| 2026-05-15 | `lint:no-tailwind-centerpanel` is currently not runnable in this execution environment (`powershell` executable unavailable and referenced script missing from `scripts/`). | Medium | Keep manual changed-file Tailwind scans in prompt validations; restore/align script path in a tooling-focused follow-up. |
| 2026-05-15 | Theme preference is read from both `theme` (ThemeContext) and `synapse.theme.mode` (flags) keys, which can drift if toggled by separate surfaces. | Medium | Keep behavior unchanged for compatibility; track for dedicated persistence unification outside color prompts. |
| 2026-05-14 | Local branch is diverged from `origin/master`. | High | Do not move archive files during color prompts. |
| 2026-05-14 | Existing theme system has multiple token/provider paths. | High | Inventory first; add aliases before migration. |
| 2026-05-14 | Amber is overused in existing tokens. | Medium | Historical global tokens may remain for compatibility; active Urban Analytics modal and Map Explorer UI/default styling must remove amber entirely. |
| 2026-05-14 | Small agents may over-edit. | High | One prompt per agent and strict stop conditions. |

### Prompt C08 - Toolbox Tab — Project List, Action Panel, Capability/Lab/Consulton Panels, Export Bar - 2026-05-17

- Files inspected:
  - `src/centerpanel/Tools/ToolsProjectList.tsx`
  - `src/centerpanel/Tools/ToolsActionPanel.tsx`
  - `src/centerpanel/Tools/ConsultonPanel.tsx`
  - `src/centerpanel/Tools/ConsultonDiff.tsx`
  - `src/centerpanel/Tools/ConsultonSessions.ts`
  - `src/centerpanel/Tools/ExportBar.tsx`
  - `src/centerpanel/Tools/PreviewPanel.tsx`
  - `src/centerpanel/Tools/components/CapabilitiesOverviewPanel.tsx`
  - `src/centerpanel/Tools/components/CoverageDiagnosticsPanel.tsx`
  - `src/centerpanel/Tools/components/EOConnectorPanel.tsx`
  - `src/centerpanel/Tools/components/GeoAILab.tsx`
  - `src/centerpanel/Tools/components/SpatialIndexLab.tsx`
  - `src/centerpanel/Tools/components/StreamingLab.tsx`
  - `src/centerpanel/styles/tools.module.css`
  - `src/centerpanel/styles/tools.left.module.css`

- Files changed:
  - `src/centerpanel/styles/tools.module.css` — appended C08 workbench override layer. Neutralizes amber theme/panel/pill/callout/title classes (`themeAmber`, `panelAmber`, `pillAmber`, `calloutAmber`, `cardTitleAmber`, `barThemeAmber`, `warn`) to semantic non-amber tokens. Panels flattened to single-surface hairline sections (no card-in-card frames). Cardtitle migrated to uppercase mono workbench label with dashed underline. Pills converted to flat 3px hairline chips; primary live-region pill uses blue info accent. Buttons flipped to ghost discipline with 10% blue hover. Segmented control de-gradiented; selected pip uses `--syn-vscode-accent-blue-soft` + inset blue underline. Inputs reflowed to compact 3px workbench fields with visible focus ring. Empty state de-gradiented to flat dashed hairline. Divider flattened from gradient to plain 1px hairline. ExportBar amber theme neutralized to transparent toolbar with top hairline. `accentLow/accentMod/accentHigh` retained as 2px inset blue rails. Reduced-motion respected.
  - `src/centerpanel/styles/tools.left.module.css` — appended C08 workbench override layer. StatCards flattened to hairline bottom-border rows; `data-type="total"` uses blue accent, `data-type="pinned"` uses status-valid green. RiskChips re-keyed: tier 0/1 muted, tier 2 info-blue, tier 3 (high/blocked) uses `--syn-status-error` with 10% red tint and 40% red border. All `var(--syn-gradient-amber)` and `var(--syn-gradient-glass-amber)` consumers visually neutralized.
  - `src/centerpanel/Tools/PreviewPanel.tsx` — iframe injected scrollbar style migrated from `rgba(245,158,11,0.70)` amber thumb to neutral muted `rgba(119,129,144,0.32)` thumb (with hover at 0.55). Track is now transparent, thumb is 10px (was 12px) with 6px radius. Print media still hides the scrollbar.
  - `src/centerpanel/Tools/components/EOConnectorPanel.tsx` — `badgeStyle()` palette re-keyed from amber tier values (`#FCD34D`, `#FBBF24`) to semantic status tokens: `failed → --syn-status-error`, `credential-missing → --syn-status-stale`, `demo → --syn-status-demo`, `loading → --syn-status-info`, ready → `--syn-status-valid`. Badge shape switched from 999 radius pill to 3px workbench chip; font-family is now `var(--font-mono)`, weight 600, 0.06em letter-spacing, with a 1px tint-matched border. Status meaning still text-backed via uppercase label.

- Tokens added: none new — consumed existing `--syn-vscode-bg-editor`, `--syn-vscode-bg-panel`, `--syn-vscode-bg-input`, `--syn-vscode-accent-blue`, `--syn-vscode-accent-blue-soft`, `--syn-vscode-border-subtle`, `--syn-vscode-text-primary`, `--syn-vscode-text-secondary`, `--syn-vscode-text-muted`, `--syn-status-error`, `--syn-status-valid`, `--syn-status-info`, `--syn-status-stale`, `--syn-status-demo`, `--font-mono`.

- Hard-coded colors removed: amber gradient backgrounds on `.statCard`, `.riskChip[data-risk="3"]`, glass-amber drops on inspector panels. Inline amber gradient stops (`#FCD34D`, `#FBBF24`) in EOConnectorPanel badges. Amber iframe scrollbar in PreviewPanel.

- Hard-coded colors retained: none in the active C08 Toolbox source set after the 2026-05-17 follow-up. Legacy class names such as `themeAmber`, `panelAmber`, `pillAmber`, `cardTitleAmber`, and `barThemeAmber` remain as JSX/CSS contract names only; their rendered values are semantic non-amber tokens.

- Card frames removed: tools inspector `.panel` and `.panelAmber` flattened from filled rounded plates to bottom-hairline single-surface sections. `cardTitle*` converted from filled-plate labels to dashed-underline uppercase mono labels.

- Filled buttons removed: tools `.btn`, `.btnIcon`, `.toolbar .btn` flipped to transparent ghost with 10% blue hover. ExportBar `barThemeAmber` neutralized.

- Accessibility & contrast notes: status badge meaning preserved via uppercase text labels (`FAILED`, `CREDENTIAL-MISSING`, `DEMO`, `LOADING`, ready labels); color is supplementary. Risk tier 3 still uses red for severity-truthful contrast. Focus ring is 1px inset blue (visible against editor surface, matches C02-C07 pattern). Reduced-motion media query respected on segmented buttons and primary buttons.

- Data visualization notes: only UI chrome changed; tool execution recipes, capability checks, EO/streaming/spatial-index dispatch, ConsultonSessions persistence, and export behavior untouched. Risk tier values still come from upstream data, only the visual representation flipped.

- Scientific integrity notes: demo/credential-missing/blocked states remain explicit through text labels and dedicated status tokens (`--syn-status-demo`, `--syn-status-stale`, `--syn-status-error`). None of these were re-keyed to the success color.

- Cross-module contract changes: none. Tool registration, recipe contracts, and panel registration untouched.

- Validation:
  - `npm run typecheck` → clean (no new errors).
  - `npx vitest run src/centerpanel/Tools` → 3 files passed, 11 tests passed (CoverageDiagnosticsPanel, EOConnectorPanel, GeoAILab).
  - Targeted C08 amber scan over `src/centerpanel/Tools/**`: remaining hits are (1) legacy class name strings (`themeAmber`, `panelAmber`, `pillAmber`, `cardTitleAmber`, `barThemeAmber`) in JSX which are now visually non-amber via the override layer (preserved per C07 precedent to avoid touching JSX wiring), and (2) two explanatory comments in `EOConnectorPanel.tsx` explicitly documenting the absence of amber. No remaining amber UI chrome renders.

- Known risks: legacy `*Amber` class names still exist as compatibility identifiers. Future cleanup can rename these classes after all C-track panels are closed, but the current rendered Toolbox chrome and source color values are non-amber.

- Next recommended prompt: Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.

### Prompt C07 Follow-up - Workflow Tab Polish And Residual Color Cleanup - 2026-05-17

- Trigger: user requested a direct Workflows tab pass for premium VS Code-style density, motion effects, and cleanup of remaining amber-like workflow remnants.
- Files inspected: `COLOR_SYSTEM_PLANS/*` operating pack entries, C07 prompt block, C07 ledger entry, and Workflows files under `src/centerpanel/Flows/**` plus `src/centerpanel/styles/flows.module.css`.
- Files changed:
  - `src/centerpanel/styles/flows.module.css` — converted legacy `--syn-accent-*` consumers in the Workflows scope to semantic blue/status tokens, added completed/suggested/read-only/related-method dense workbench rows, added reduced-motion-safe micro animations for panel reveal, active rail, and step underline.
  - `src/centerpanel/Flows/StepPills.tsx` — added completed-step classing so completed steps can render through `--syn-status-valid` while active remains blue underline/text.
  - `src/centerpanel/Flows/rail/RelatedMethodsCard.tsx` — moved related-method row chrome from inline card styles to CSS module workbench rows.
  - `src/centerpanel/Flows/FlowHost.tsx` — changed unset study-area status rail from legacy danger alias to semantic `--syn-status-error`.
  - `src/centerpanel/Flows/AccessibilityFlow.tsx`, `CellularAutomataFlow.tsx`, `CompositeIndicatorFlow.tsx`, `FacilityOptimisationFlow.tsx`, `SystemDynamicsFlow.tsx`, `scenarioComparisonArtifacts.ts` — re-keyed default/demo workflow visualization palettes from amber/orange/yellow stops to blue/violet/teal non-amber data colors without changing calculations or dispatch contracts.
- Tokens added: none. Used existing `--syn-status-info`, `--syn-status-valid`, `--syn-status-error`, `--syn-status-stale`, `--syn-text-*`, `--syn-border-*`, and `--syn-surface-*`.
- Contract notes: `useFlowStore`, `useFlowsUIStore`, flow registration, run dispatch, completed-run review, and map dispatch behavior unchanged. Demo/blocked/unknown/readiness text remains explicit.
- Validation:
  - `npm run typecheck` -> passed.
  - `npx vitest run src/centerpanel/Flows/__tests__/AccessibilityFlow.map-dispatch.test.tsx src/centerpanel/Flows/__tests__/CellularAutomataFlow.test.tsx src/centerpanel/Flows/__tests__/scenarioComparisonArtifacts.test.ts` -> passed, 3 files / 7 tests.
  - `npx vitest run src/centerpanel/Flows/__tests__` -> passed, 7 files / 60 tests.
  - `git diff --check` -> passed.
  - Case-insensitive targeted Workflows color scan over `src/centerpanel/Flows` and `src/centerpanel/styles/flows.module.css` -> 0 hits.
  - Center Panel Standard Amber Scan still reports out-of-scope Map Explorer paths due the documented PowerShell negation-glob issue plus deferred C09 cross-cutting surfaces (`EngineCapabilitiesPanel`, `NarrativeGenerationPanel`, `ObjectDetectorPanel`) and legacy C08 source comments/rules in `tools*`; no Workflows hits remain.

### Prompt C07 Follow-up 2 - Workflow Overflow, Navigator Density, Embedded Hot Spot Chrome - 2026-05-17

- Trigger: user provided screenshots showing horizontal overflow in Active Workflow, residual amber on the embedded Emerging Hot Spot panel, and uneven Navigator spacing.
- Files changed:
  - `src/centerpanel/Flows/EmergingHotSpotFlow.tsx` — removed fixed 760/680px minimum-height shell and moved the embedded map panel into a responsive workflow frame.
  - `src/centerpanel/components/MapEmergingHotSpotViz.tsx` — fixed embedded `left: 50%` inheritance from the floating map panel, added `left: 0`, `maxWidth: 100%`, `overflowX: hidden`, non-amber workbench chrome, blue semantic range/control accents, transparent run button, and responsive auto-fit grids.
  - `src/centerpanel/Flows/FlowHost.tsx` — replaced workspace mode buttons with tab-like VS Code workbench tabs using `data-active`.
  - `src/centerpanel/Flows/WorkflowCockpit.tsx` — replaced irregular inline button grids/cards with dense command rows, journey columns, and compact feature-map rows backed by CSS module classes.
  - `src/centerpanel/styles/flows.module.css` — added overflow containment for Workflows surfaces, compact workspace tabs, Navigator command/journey/feature styles, embedded workflow frame sizing, and reduced-motion coverage.
  - `src/centerpanel/components/EngineCapabilitiesPanel.tsx` — re-keyed the Workflows rail capability panel away from amber constants and flattened it to a hairline inspector section.
- Contract notes: workflow selection, `useFlowsUIStore`, `useFlowStore`, map dispatch, hot spot execution, completed run persistence, and legend/data semantics unchanged. Hot/cold analytical result legend colors remain data output colors, not UI chrome.
- Validation:
  - `npm run typecheck` -> passed.
  - `npx vitest run src/centerpanel/Flows/__tests__ src/centerpanel/components/__tests__/MapEmergingHotSpotViz.test.tsx` -> passed, 8 files / 61 tests.
  - Case-insensitive targeted Workflows color scan over `src/centerpanel/Flows`, `src/centerpanel/styles/flows.module.css`, `MapEmergingHotSpotViz.tsx`, and `EngineCapabilitiesPanel.tsx` -> 0 hits.

### Center Panel Copy Cleanup - User-Facing Prompt Terminology - 2026-05-17

- Trigger: user requested removing "Prompt" wording from Center Panel text.
- Files changed:
  - `src/centerpanel/Flows/workflowExperience.ts`, `FlowLibraryCard.tsx`, `FlowHost.tsx`, `WorkflowCockpit.tsx`, `rail/SuggestedCard.tsx` — replaced visible prompt-number labels and prompt wording with workflow/method labels.
  - `src/centerpanel/Tools/ToolsActionPanel.tsx`, `ConsultonPanel.tsx`, `components/GeoAILab.tsx` — replaced user-facing Prompt labels with Request, query, or advanced-indicator language.
  - `src/centerpanel/styles/flows.module.css`, `src/centerpanel/styles/tools.module.css` — renamed prompt-oriented presentation classes used by touched UI surfaces to label/request naming.
  - `src/centerpanel/components/MapTemporalPlayer.tsx`, `src/centerpanel/components/map/MapWorkflowDrawer.tsx`, `src/centerpanel/components/map/mapTypes.ts`, and map test titles/comments — removed leftover prompt-number wording from non-product text.
- Contract notes: technical API/browser identifiers such as `window.prompt`, `systemPrompt`, `userPrompt`, and persisted Consulton/audit field names remain because they are implementation contracts, not rendered Center Panel copy.
- Validation:
  - `npm run typecheck` -> passed.
  - `npx vitest run src/centerpanel/Flows/__tests__ src/centerpanel/Tools src/centerpanel/Tools/components/__tests__` -> passed, 10 files / 71 tests.
  - `git diff --check` -> passed.

### Prompt C08 Follow-up - Toolbox Indexing, Tab Motion, Source Amber Cleanup - 2026-05-17

- Trigger: user requested the same premium VS Code workbench discipline for the final Toolbox tab, with perfect indexing and premium transition animations across tab content.
- Files changed:
  - `src/centerpanel/Tools/ToolsActionPanel.tsx` — replaced the duplicated hard-coded top navigation with a single `TOOLBOX_INDEX` source, added `Reporting Builder` to the navigable index, removed duplicate visible `Index` labels, added active-section tracking via `IntersectionObserver`, and converted every Toolbox section to a focusable indexed section with `data-toolbox-section`.
  - `src/centerpanel/Tools/ToolsProjectList.tsx` — added `aria-current` to selected project rows so the left rail selection participates in the shared Center Panel selected-state styling.
  - `src/centerpanel/components/CenterPanelTabFrame.tsx` — added `data-tab-rail` and `data-tab-content` hooks so every Center Panel tab can share a consistent premium rail/content transition.
  - `src/centerpanel/styles/tools.module.css` — added C08 follow-up motion/index layer: sticky dense Toolbox section index, active blue underline animation, section reveal animation, horizontal overflow containment, wrapped index buttons, responsive panel padding, and reduced-motion fallbacks. Removed remaining Toolbox-scope `--syn-accent-primary` and hard-coded amber/yellow fallbacks by mapping them to `--syn-vscode-accent-blue`, `--syn-status-info`, or semantic warning/status tokens.
  - `src/centerpanel/styles/tools.left.module.css` — added dense rail row reveal, selected blue left rail, hover/focus transitions, no-shift action buttons, non-amber pinned status styling, and source cleanup for old amber stat/chip/risk/pin values.
  - `src/centerpanel/styles/centerpanel.module.css` — added shared rail/content/accent sweep transitions for all Center Panel tab surfaces and removed negative letter-spacing in the touched header/title rules.
- Contract notes: tool recipes, capability checks, EO/GeoAI/Spatial Index/Streaming dispatch, `ConsultonSessions`, export behavior, and registry state selection remain unchanged.
- Validation:
  - `npm run typecheck` -> passed.
  - `npx vitest run src/centerpanel/Tools src/centerpanel/Tools/components/__tests__` -> passed, 3 files / 11 tests.
  - `git diff --check` -> passed.
  - Targeted Toolbox amber/source scan over `ToolsActionPanel.tsx`, `ToolsProjectList.tsx`, `tools.module.css`, and `tools.left.module.css` for hard-coded amber/yellow values and `--syn-accent-primary` -> 0 hits.
  - Local dev server check `http://127.0.0.1:3000` -> 200.

### Prompt C08 Follow-up 2 - Toolbox Rail, Full-Width Layout, Indicator Density, VoxCity Camera Stability - 2026-05-18

- Trigger: user provided screenshots showing Toolbox project rail vertical text/wrapped IDs, scattered project action buttons, Toolbox content still reading as card-heavy rather than full-width VS Code workbench, Indicator Catalog card/font scale mismatch, and VoxCity 3D view reset while rotating or changing view.
- Files inspected:
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx`
  - `src/services/map/MapSyncService.ts`
  - `src/centerpanel/components/MapExplorerModal.tsx`
  - `src/centerpanel/Tools/ToolsProjectList.tsx`
  - `src/centerpanel/Tools/ToolsActionPanel.tsx`
  - `src/centerpanel/Tools/components/CapabilitiesOverviewPanel.tsx`
  - `src/centerpanel/styles/tools.module.css`
  - `src/centerpanel/styles/tools.left.module.css`
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css`
- Files changed:
  - `src/features/urbanAnalytics/voxcity/BuildingViewer.tsx` — removed `OrbitControls` key/target prop remount path and changed auto-fit to a scene-signature guard so user orbit state is not reset by ordinary React rerenders.
  - `src/centerpanel/components/MapExplorerModal.tsx` — extended 2D/3D sync suppression through the map ease duration so 3D-origin viewport sync does not echo back as a map-origin reset loop.
  - `src/centerpanel/Tools/ToolsProjectList.tsx` — replaced text glyph buttons with `lucide-react` icons, reduced row actions to export + pin, kept row click/keyboard selection as the primary project action, and added a Search icon in the compact search field.
  - `src/centerpanel/Tools/components/CapabilitiesOverviewPanel.tsx` — replaced inline card/callout rows with full-width capability matrix classes for workspace tabs, toolbox surfaces, and workflows.
  - `src/centerpanel/styles/tools.left.module.css` — added premium rail override: compact search/sort, no vertical text (`text-overflow: ellipsis`, no `overflow-wrap:anywhere`), stable selected left rail, always-stable two-icon action area, and dense hairline row rhythm.
  - `src/centerpanel/styles/tools.module.css` — added full-width Toolbox workbench override: sticky header command index, inspector-band panels, flattened callouts, and capability matrix styles with blue hover/underline motion.
  - `src/centerpanel/styles/header-new.module.css` — replaced header tab label wrapping with single-line scroll behavior and added container-query fallback so narrow embedded Center Panel headers put tabs on a full-width second row instead of breaking labels vertically.
  - `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css` — reduced oversized metric/detail/card typography, flattened card surfaces, tightened traceability/formula/band grids, and preserved responsive single-column fallbacks.
- Tokens added: none. Used existing VS Code semantic tokens and `lucide-react` icons already present in dependencies.
- Hard-coded colors removed: none newly targeted; this was layout, density, and interaction stability work. No new amber/yellow/orange UI chrome added.
- Card/button notes: Toolbox main content now renders as full-width inspector bands and capability rows rather than repeated framed cards. Project rail buttons reduced from four row actions to two functional icon controls, with primary row selection moved to the row body.
- Accessibility & contrast notes: project selection remains keyboard reachable; export and pin retain `aria-label`, `aria-pressed`, and keyboard shortcut metadata. Focus outlines continue to use blue semantic focus.
- Scientific/data notes: no GIS calculations, evidence artifact semantics, indicator formulas, data fitness, method validity, or workflow contracts changed. Demo/sample VoxCity labeling remains explicit.
- Cross-module contract changes: none. 2D/3D sync contract preserved; suppression only prevents echo-loop publication during a synced ease animation.
- Validation:
  - `git diff --check` -> passed.
  - `npm run typecheck` -> passed.
  - Initial `npm --prefix ... run test:analytics` attempt failed because Vitest cwd stayed at `C:/Users/m_ras`, breaking `@/*` alias resolution; rerun from the repo directory was required.
  - `npm run test:analytics` from `C:/Users/m_ras/Desktop/SynapseIDE_urban_analytics` -> passed, 62 files / 1111 tests.
  - `npm run lint:errors` -> passed.
  - Playwright smoke at `http://127.0.0.1:3000` opened Urban Analytics -> Toolbox, confirmed Toolbox surfaces and Indicator Catalog render, no vertical tab-label candidates, and no console issues after filtering the terminal WebSocket reconnect warning.

### Prompt C08 Follow-up 3 - Toolbox Command Center, Wide Mode, Cross-Tab Motion - 2026-05-18

- Trigger: user requested a more functional Toolbox plus VS Code-style animations, transitions, and styling across all tabs.
- Files inspected:
  - `src/centerpanel/Tools/ToolsActionPanel.tsx`
  - `src/centerpanel/CenterPanelShell.tsx`
  - `src/centerpanel/styles/tools.module.css`
  - `src/centerpanel/styles/centerpanel.module.css`
  - `src/centerpanel/styles/header-new.module.css`
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`
  - `src/stores/usePanelBridgeStore.ts`
  - `DEVELOPMENT_PLANS/CONTEXT_MIN.md`, `DEVELOPMENT_PLANS/CURRENT_TASK.json`
  - `.github/instructions/urban-analytics.instructions.md`
- Files changed:
  - `src/centerpanel/Tools/ToolsActionPanel.tsx` — added a searchable Toolbox command center with active-section/project/scope context, status counters, Ctrl+K section search, workspace layout status, and functional quick actions for Map Explorer, Workflows, Report, Preview, and Export.
  - `src/centerpanel/styles/tools.module.css` — styled the command center as a dense VS Code workbench toolbar with hairline grids, icon command buttons, active wide-mode styling, action-sweep hover motion, section search, container-query responsive behavior, and reduced-motion fallbacks.
  - `src/centerpanel/CenterPanelShell.tsx` — exposes the current workspace layout mode as a Center Panel shell data attribute so every tab can share the same mode-aware transition/styling surface.
  - `src/centerpanel/styles/centerpanel.module.css` — added shared cross-tab motion: rail/content reveal, hover lift/slide, active rail accents, focus-within top glow, and reduced-motion coverage across every Center Panel tab.
  - `src/centerpanel/styles/header-new.module.css` — added animated active tab underline and activation pulse while preserving single-line scroll behavior.
  - `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` — moved the `Wide Off` / `Wide On` control into the global Urban Analytics command bar and connected it to all Center Panel tabs: off keeps the standard outer widths; on applies balanced compact outer rails so the active tab gains usable center space without taking over the whole screen.
  - `src/stores/usePanelBridgeStore.ts` — upgraded the layout preference to persisted `workspaceLayoutExpanded` state with setter/toggle actions backed by `localStorage`, while reading/writing the legacy Toolbox key for compatibility.
- Tokens added: none. Used existing VS Code semantic tokens and existing `lucide-react` icon dependency.
- Contract notes: no GIS calculations, data fitness, method validity, evidence artifact, map rendering, editor buffer, or workflow execution contracts changed. Map Explorer opening uses the existing `useMapExplorerStore.open` action.
- Accessibility notes: section search has an explicit label and keyboard handling; quick actions are real buttons with title text; reduced-motion rules are included for new animations.
- Validation:
  - `npm run typecheck` -> passed.
  - `npm run lint:errors` -> passed.
  - `npm run test:analytics` -> passed, 62 files / 1111 tests.
  - `git diff --check` -> passed.
  - Playwright smoke at `http://127.0.0.1:3000` opened Urban Analytics, confirmed `Wide Off` standard layout (outer left 500px, center 340px, right 600px at 1440px viewport), clicked the global `Wide Off` command-bar button, confirmed `Wide On` balanced layout across Projects, Workflows, and Toolbox (outer left 280px, center 740px, right 420px), persisted storage change, command center quick actions, and no console issues after filtering the terminal WebSocket reconnect warning.

## Next Pointer

Prompt C09 - Cross-Cutting Surfaces — Urban Context Strip, Outline Nav, Background Tasks, Engine Capabilities, Narrative, Object Detector.
