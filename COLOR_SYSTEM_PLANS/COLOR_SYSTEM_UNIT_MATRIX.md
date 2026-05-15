# Color System Unit Matrix

## Purpose

This matrix maps the application into small color-migration units. The sequential prompts reference these units so small agents can work without reading the entire repository.

## Shared Theme And Token Infrastructure

| Unit | Primary Files | Notes |
| --- | --- | --- |
| Theme Provider | `src/app/AppThemeProvider.tsx`, `src/contexts/ThemeContext.tsx` | Two theme/provider paths exist. Do not collapse them without a dedicated prompt. |
| Synapse Token Layer | `src/theme/GlobalSynapseStyles.ts`, `src/theme/synapse.ts` | Main `--syn-*` variables and styled-components theme. Currently amber-heavy. |
| Legacy Theme Layer | `src/styles/theme.ts`, `src/styles/GlobalStyles.ts`, `src/styles/ui.css`, `src/styles/fonts.css` | Legacy `--color-*`, glass, and theme variables. Keep aliases until migrated. |
| Design Constants | `src/constants/design.ts`, `src/constants/app.ts` | Contains static colors for files/icons and old palette constants. |
| Status Bar Tokens | `src/components/StatusBar/statusTheme.ts`, `src/components/StatusBar/StatusBar.tsx` | Status surface has its own theme mapping. |

## Shared Shell And App Surfaces

| Unit | Primary Files | Notes |
| --- | --- | --- |
| App Root | `src/App.tsx`, `src/app/AppRoot.tsx`, `src/main.tsx` | Validate shell load only; avoid feature rewiring. |
| Error/Loading/Test Utility Surfaces | `src/app/ErrorBoundary.tsx`, `src/components/utilities/Loading.tsx`, `src/components/utilities/ErrorBoundary.tsx`, `src/components/utilities/TestHarness.tsx` | Replace hard-coded emergency colors with semantic tokens while preserving visibility. |
| Center Panel Shell | `src/centerpanel/CenterPanelShell.tsx`, related CSS Modules under `src/centerpanel/` | No Tailwind. Preserve dense workbench layout. |
| Guide/Tools/Templates | `src/centerpanel/Guide/`, `src/centerpanel/Tools/`, `src/components/templates/` | Lower-risk shared surfaces but many color literals. |

## Synapse IDE Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| IDE Shell | `src/components/ide/EnhancedIDE.tsx`, `src/components/ide/ideShell.css`, `src/components/ide/ShellPlaceholderPane.tsx` | Keep VS Code-like workbench density. |
| Header And Activity Rail | `src/components/ide/Header.tsx`, `src/components/ide/ActivityBar.tsx` if present, shell CSS | Active/focus blue, attention amber. |
| File Explorer | `src/components/file-explorer/`, `src/stores/fileExplorerStore.ts`, `src/constants/app.ts` | File-type colors need tokenized but recognizable semantics. |
| Editor Surface | `src/components/editor/`, Monaco wrappers, tab components | Preserve editor readability and diagnostics. |
| Terminal And Bottom Panel | `src/components/terminal/`, `src/components/ide/BottomPanel.tsx`, `src/components/editor/ProblemsPane.tsx` | Terminal should remain quiet and dark, diagnostics explicit. |
| Command/Search/AI | `src/components/ide/CommandPalette.tsx`, `src/components/ide/GlobalSearch.tsx`, `src/components/ai/` | Avoid AI warning/status false confidence. |

## Map Explorer Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| Map Shell And Canvas Chrome | `src/centerpanel/components/MapExplorerModal.tsx`, `src/centerpanel/components/map/MapWorkspaceShell.tsx`, `src/centerpanel/components/map/MapCanvas.tsx` | Keep map-first; chrome must not obscure map. |
| Map Toolbar/Search/Pins | `src/centerpanel/components/map/MapToolbar.tsx`, `MapSearchBar.tsx`, `MapPinSidebar.tsx`, `MapStatusBar.tsx` | Controls need focus/active/disabled consistency. |
| Layer Manager | `src/centerpanel/components/map/MapLayerManager.tsx`, `MapLayerPanel.tsx`, layer row CSS/styled blocks | Badges and disabled reasons must remain truthful. |
| Map Drawers | `MapWorkflowDrawer.tsx`, `MapReportHandoffDrawer.tsx`, `ScientificQAPanel.tsx`, `MapNLQueryPanel.tsx`, `MapReviewTimelinePanel.tsx` | QA, readiness, NL safety, report handoff colors are high-risk. |
| Map Renderers | `MapChoroplethLayer.tsx`, `MapHeatmapLayer.tsx`, `MapSymbolLayer.tsx`, `MapClusterViz.tsx`, `MapHotSpotViz.tsx`, `MapTemporalPlayer.tsx` | Data colors must be separate from UI colors. |
| Map Services And Types | `src/services/map/`, `src/centerpanel/components/map/mapTypes.ts`, `mapEvidenceArtifacts.ts` | Only touch if color/status metadata contracts are required. |

## Urban Analytics Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| UA Shell And Modal | `src/features/urbanAnalytics/`, modal shell components, CSS Modules | Must follow UA instructions if editing this tree. |
| Method Catalog And Workflow | `src/features/urbanAnalytics/seeds/`, catalog/workflow components | Capability status colors must remain explicit. |
| Evidence And Provenance | `src/features/urbanAnalytics/context/`, evidence components | Demo/unknown/stale cannot look valid. |
| Data Fitness And Validity | `src/features/urbanAnalytics/lib/dataFitness.ts`, `methodValidity.ts`, related UI | `score: null` means unknown. |
| VoxCity/3D | `src/features/urbanAnalytics/voxcity/` | Keep sample/demo status visible; 3D visuals require screenshot checks. |

## Analytical And Reporting Units

| Unit | Primary Files | Notes |
| --- | --- | --- |
| Color Ramps | `src/utils/colorRamps.ts`, `src/utils/__tests__/colorRamps.test.ts` | Palette helpers are shared analytical infrastructure. |
| Cartography Engine | `src/engine/carto/` | Do not replace proven classification logic for theme polish. |
| Dashboard | `src/features/dashboard/` | Chart/status colors must not conflict with map palettes. |
| Reporting | `src/services/reporting/`, report UI surfaces | Export/readiness colors must preserve caveats. |
| E2E And QA | `e2e/`, `docs/implementation/`, `playwright.config.ts` | Screenshot/contrast gates belong near final prompts. |
