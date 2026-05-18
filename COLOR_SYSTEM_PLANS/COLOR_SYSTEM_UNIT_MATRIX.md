# Color System Unit Matrix

## Purpose

This matrix maps the active three-part color migration into small units. The sequential prompts reference these units so small agents can work without reading the entire repository.

## Historical Baseline

The previous broad color work completed token infrastructure and several shared shell surfaces. Treat that work as baseline context, not as the active prompt order.

| Baseline Unit | Primary Files | Notes |
| --- | --- | --- |
| Synapse Token Layer | `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts` | Provides `--syn-vscode-*`, `--syn-surface-*`, `--syn-text-*`, `--syn-border-*`, `--syn-interaction-*`, and `--syn-status-*` families. |
| Theme Provider | `src/app/AppThemeProvider.tsx`, `src/contexts/ThemeContext.tsx` | Provider compatibility already exists. Do not collapse theme paths during active prompts. |
| Shared Shell | `src/styles/GlobalStyles.ts`, `src/styles/ui.css`, shared IDE/status surfaces | Historical baseline only. Do not edit unless an active prompt explicitly requires a compatibility fix. |

## Part 1 - Urban Analytics Modal Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| UA Amber Inventory | `src/features/urbanAnalytics/**` | A01 only. Group amber hits before editing. |
| UA Modal Shell And Welcome | `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`, `src/features/urbanAnalytics/WelcomeModal.tsx`, `src/features/urbanAnalytics/icons.tsx` | Remove amber brand/hero/glow/gradient/chrome; make shell dense and VS Code-like. |
| UA Rail And Command Controls | `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`, `src/features/urbanAnalytics/rail/RailContainer.tsx`, `src/features/urbanAnalytics/rail/rail.css` | Transparent buttons, compact search, no amber active/focus/fill. |
| UA Catalog And Indicators | `src/features/urbanAnalytics/store.ts`, `src/features/urbanAnalytics/rightPanelRegistry.ts`, `src/features/urbanAnalytics/RightPanelFourBlock.tsx`, `src/features/urbanAnalytics/rightPanelFourBlock.css`, `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.tsx`, `src/features/urbanAnalytics/indicators/IndicatorCatalogPanel.module.css` | Method cards and indicator rows must not look like nested amber cards. |
| UA Right Panel And Generated HTML | `src/features/urbanAnalytics/RightPanelFourBlock.tsx`, `src/features/urbanAnalytics/rightPanelFourBlock.css`, `src/features/urbanAnalytics/rightPanelUtils.ts` | Generated report/print HTML must also be amber-free. |
| UA Evidence And Scientific Status | `src/features/urbanAnalytics/evidence/UrbanEvidenceTray.tsx`, `src/features/urbanAnalytics/evidence/urbanEvidenceTray.css`, `src/features/urbanAnalytics/context/*`, `src/features/urbanAnalytics/lib/*` | Preserve evidence immutability, data fitness, method validity, readiness semantics. |
| UA VoxCity And 3D | `src/features/urbanAnalytics/voxcity/*.tsx`, `src/features/urbanAnalytics/voxcity/hooks/*` | Remove amber controls/legends/defaults; preserve 3D and simulation behavior. |
| UA Python And Utility Panels | `src/features/urbanAnalytics/python/*`, `src/features/urbanAnalytics/python/templates/*` | Remove amber package/status/template UI and code-demo default chart amber when visible in modal content. |
| UA Tests | `src/features/urbanAnalytics/**/__tests__/*`, `src/features/urbanAnalytics/indicators/__tests__/*`, `src/features/urbanAnalytics/voxcity/__tests__/*` | Update only assertions affected by token/name/default-color changes. |

## Part 2 - Center Panel Workbench Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| Center Panel Inventory | `src/centerpanel/**` excluding Map Explorer files | C01 only. Group amber and heavy-chrome hits before editing. Preserve existing ambient header animations. |
| Center Panel Shell And Header | `src/centerpanel/CenterPanel.tsx`, shell/status/header styles, shared center-panel tokens | C02. Remove amber shell chrome while preserving header/keyframe behavior. |
| Projects Tab | `src/centerpanel/registry-ui/**`, `src/centerpanel/styles/registry.module.css`, project/session/indicator/AI surfaces | C03. Dense project registry rows, not card stacks. |
| New Project Tab | `src/centerpanel/registry-ui/newProject.*` | C04. Canonical single-surface intake form with 3px fields and transparent controls. |
| Methods/Guide Tab | `src/centerpanel/styles/guides*.css`, guide/method outline surfaces | C05. VS Code outline rail + flat guide content. |
| Report/Note Tab | `src/centerpanel/styles/note.module.css`, report builder/note/editor surfaces | C06. Workbench notebook/editor discipline. |
| Workflows Tab | `src/centerpanel/styles/flows.module.css`, flow host/rail/tile/cockpit surfaces | C07. Dense workflow inspectors with non-amber status semantics. |
| Toolbox Tab | `src/centerpanel/styles/tools*.css`, toolbox/lab/capability/consulton/export surfaces | C08. Dense toolbox inspectors; capability/demo/error states stay explicit. |
| Cross-Cutting Surfaces | Urban context strip, outline nav, background tasks, engine capabilities, narrative, object detector | C09. Cross-tab surfaces and preserved animations. |
| Center Panel Final QA | All Center Panel non-map files touched by C01-C09 | C10. Final amber/heavy-chrome cleanup and Part 3 gate. |

## Part 3 - Map Explorer Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| Map Inventory And Alignment | `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/**`, `src/centerpanel/components/Map*`, `src/services/map/**`, `src/stores/useMapExplorerStore.ts`, Center Panel CSS anchors | B01 only. Separate UI chrome, heavy chrome, default/demo/generated colors, and analytical data-palette exceptions; lock Center Panel code-derived design rules. |
| Map Tokens And Primitives | `src/centerpanel/components/map/mapTokens.ts`, `src/constants/design.ts`, `src/centerpanel/components/map/__tests__/map-components.test.ts` | B02. Remove amber from shared map UI aliases, strokes, shared styles, radius/shadow contracts, and compatibility aliases before component migration. |
| Map Shell, Modal, Docking, Canvas, Status | `MapExplorerModal.tsx`, `MapWorkspaceShell.tsx`, `MapCanvas.tsx`, `MapStatusBar.tsx`, `MapCanvasKeyboardFallbackControls.tsx`, `mapDocking.ts` | B03. Map-first shell/docking/focus/status chrome; no amber focus fallback or card shell. |
| Map Cockpit And Workspace Bars | `MapWorkspaceCockpit.tsx`, `MapWorkspaceCockpit.module.css`, `MapWorkspaceShell.tsx`, `mapExperience.ts`, `mapContextSummary.ts` | B04. Dense cockpit/workspace operational surfaces; remove decorative gradients, amber warning variables, heavy shadows, and filled plates. |
| Toolbar, Search, Pins, Bookmarks, Context Menus | `MapToolbar.tsx`, `MapSearchBar.tsx`, `MapPinSidebar.tsx`, `MapBookmarkBar.tsx`, `MapContextMenu.tsx`, `contextMenuUtils.ts`, `MapExplorerButton.tsx` | B05. Compact transparent controls, blue rails/tints, no amber hover/active/focus. |
| Layer Manager And Layer Panel | `MapLayerManager.tsx`, `MapLayerPanel.tsx`, `mapLayerMetadata.ts`, `useLayerSync.ts` | B06. Dense layer rows, explicit badges, non-amber sync/selection/popover states. |
| Scientific QA And Readiness | `ScientificQAPanel.tsx`, `mapEvidenceArtifacts.ts`, `mapLayerMetadata.ts`, `MapScientificQA*`, `MapPublicationOutputBindingService.ts` | B07. Preserve CRS/evidence/readiness truthfulness while removing amber warning/caveat chrome. |
| Workflow, Query, Review, Cartography, Report Drawers | `MapWorkflowDrawer.tsx`, `MapNLQueryPanel.tsx`, `MapReviewTimelinePanel.tsx`, `MapReportHandoffDrawer.tsx`, `CartographyRecommendationList.tsx`, related services | B08. High-risk drawers use inspector rows and text-backed non-amber status. |
| Import And Service Dialogs | `MapDataImportHubDialog.tsx`, `MapCsvImportDialog.tsx`, `MapColumnarImportDialog.tsx`, `MapServiceDialog.tsx`, `MapDataImporter.ts`, `ExternalServiceConnector.ts` | B09. Compact workbench dialogs, no amber hero gradients, filled import buttons, or amber preview headers. |
| Export And Generated Output | `MapDataExportDialog.tsx`, `MapExportDialog.tsx`, `MapCompositionLayout.tsx`, `MapExportService.ts`, `MapDataExporter.ts`, `MapReportHandoffService.ts` | B10. Export/publication UI and generated SVG/PDF/preview chrome must be amber-free. |
| Interactive Tools And Store Defaults | `MapDrawingManager.tsx`, `MapMeasurementTool.tsx`, `MapAnnotationLayer.tsx`, `MapTemporalPlayer.tsx`, `MapVoxCityOverlay.tsx`, `src/stores/useMapExplorerStore.ts` | B11. Remove amber drawing/measurement/annotation defaults, including visible persisted annotation defaults. |
| Visualization Panels And Renderer Defaults | `MapChoroplethLayer.tsx`, `MapHeatmapLayer.tsx`, `MapSymbolLayer.tsx`, `MapClusterViz.tsx`, `MapHotSpotViz.tsx`, `MapEmergingHotSpotViz.tsx`, renderer utilities, `demoDataPacks.ts` | B12. No amber default/demo/generated renderer colors except documented analytical data-palette exceptions. |
| Map Services And Engine Outputs | `MapEngineAdapter.ts`, `MapCartographyAdvisor.ts`, `MapPersistenceService.ts`, `MapNLQueryBuilder.ts`, `ExternalServiceConnector.ts`, analysis/workflow adapters if scan hits appear | B13. Non-amber service-level generated/default colors; contracts and schemas unchanged. |
| Map Final QA | All Map Explorer files touched by B02-B13 and related tests | B14. Final amber/heavy-chrome scan, accessibility/focus, compact-layout, and visual QA. |
| Final Color Handoff | `COLOR_SYSTEM_PLANS/**` operating-pack files | B15. Ledger/manifest/QA/handoff sync after A, C, and B implementation prompts close. |

## Validation Units

| Unit | Command |
| --- | --- |
| TypeScript | `npm run typecheck` |
| Urban Analytics | `npm run test:analytics` |
| Color guard | `npm run color:guard:changed` if available |
| Map targeted tests | Run the smallest changed-file map test subset named by the prompt |
| Visual QA | Manual or Playwright screenshot smoke for the active modal/map surfaces |
