# Color System Unit Matrix

## Purpose

This matrix maps the active two-part color migration into small units. The sequential prompts reference these units so small agents can work without reading the entire repository.

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

## Part 2 - Map Explorer Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| Map Amber Inventory | `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/**`, `src/centerpanel/components/Map*`, `src/services/map/**`, `src/stores/useMapExplorerStore.ts` | B01 only. Separate UI chrome from data-palette exceptions. |
| Map Tokens | `src/centerpanel/components/map/mapTokens.ts`, `src/centerpanel/components/map/__tests__/map-components.test.ts`, `src/constants/design.ts` if needed | Remove amber from shared map UI aliases before component migration. |
| Map Shell And Canvas | `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/MapWorkspaceShell.tsx`, `MapWorkspaceCockpit.tsx`, `MapWorkspaceCockpit.module.css`, `MapCanvas.tsx`, `MapStatusBar.tsx`, `MapCanvasKeyboardFallbackControls.tsx` | Map-first, neutral, compact, no amber focus fallback. |
| Map Toolbar/Search/Pins | `src/centerpanel/components/map/MapToolbar.tsx`, `MapSearchBar.tsx`, `MapPinSidebar.tsx`, `src/centerpanel/components/MapContextMenu.tsx`, `MapBookmarkBar.tsx`, `contextMenuUtils.ts` | Transparent controls, no filled amber/blue card plates. |
| Layer Manager | `src/centerpanel/components/map/MapLayerManager.tsx`, `MapLayerPanel.tsx`, `mapLayerMetadata.ts`, `useLayerSync.ts` | Active rows, badges, toggles, dropdowns, and sync states must be amber-free and explicit. |
| Map Drawers | `MapWorkflowDrawer.tsx`, `MapReportHandoffDrawer.tsx`, `ScientificQAPanel.tsx`, `MapNLQueryPanel.tsx`, `MapReviewTimelinePanel.tsx`, `CartographyRecommendationList.tsx` | QA, readiness, NL safety, review, and report colors are high-risk. |
| Map Dialogs And Tools | `MapDataImportHubDialog.tsx`, `MapCsvImportDialog.tsx`, `MapColumnarImportDialog.tsx`, `MapDataExportDialog.tsx`, `MapExportDialog.tsx`, `MapServiceDialog.tsx`, `MapDrawingManager.tsx`, `MapMeasurementTool.tsx`, `MapTemporalPlayer.tsx`, `MapVoxCityOverlay.tsx` | Remove amber form focus, tabs, primary buttons, progress/status chips. |
| Map Renderers And Data Defaults | `MapChoroplethLayer.tsx`, `MapHeatmapLayer.tsx`, `MapSymbolLayer.tsx`, `MapClusterViz.tsx`, `MapHotSpotViz.tsx`, `MapEmergingHotSpotViz.tsx`, `map/heatmapStyleUtils.ts`, `symbologyUtils.ts`, `spatialStatsVizUtils.ts`, `symbolStyleUtils.ts`, `demoDataPacks.ts` | No amber as default/demo/generated style. Document analytical palette exceptions. |
| Map Services And Exports | `src/services/map/MapEngineAdapter.ts`, `MapCartographyAdvisor.ts`, `MapPersistenceService.ts`, `MapExportService.ts`, `ExternalServiceConnector.ts`, `MapNLQueryBuilder.ts` | Default/generated color outputs must be non-amber unless documented as data palette. |
| Map Tests | `src/centerpanel/components/map/__tests__/*`, `src/centerpanel/components/__tests__/*`, `src/services/map/__tests__/*`, `src/stores/__tests__/useMapExplorerStore.test.ts` | Update only assertions affected by token/name/default-color changes. |

## Validation Units

| Unit | Command |
| --- | --- |
| TypeScript | `npm run typecheck` |
| Urban Analytics | `npm run test:analytics` |
| Color guard | `npm run color:guard:changed` if available |
| Map targeted tests | Run the smallest changed-file map test subset named by the prompt |
| Visual QA | Manual or Playwright screenshot smoke for the active modal/map surfaces |
