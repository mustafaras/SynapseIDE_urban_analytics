# 13 - Design Implementation Blueprint

Date: 2026-05-22
Status: execution blueprint
Scope: concrete file/module plan for applying the premium GIS design system to Map Explorer while harmonizing with Urban Analytics and Synapse IDE.

## Purpose

This blueprint translates the design system and motion spec into implementable work. It is not a visual wish list. It defines where the design layer should live, which components should be created or refactored, how to verify the result, and how to avoid breaking the existing scientific and GIS contracts.

## Design Implementation Goals

1. Create a GIS-specific token layer that maps to existing Synapse IDE and Urban Analytics tokens.
2. Refactor Map Explorer chrome into a professional workbench shell.
3. Standardize GIS panel, table, tree, toolbar, inspector, status, and evidence components.
4. Add motion utilities that are subtle, accessible, and reduced-motion aware.
5. Ensure 3D block/digital twin controls have their own professional UI patterns.
6. Add visual QA so the workbench does not regress into overlapping text, blank canvases, or hidden caveats.

## Proposed File Additions

These are proposed implementation files for the future coding phase.

### Token And Theme Layer

```text
src/centerpanel/components/map/design/gisTokens.css
src/centerpanel/components/map/design/gisMotion.css
src/centerpanel/components/map/design/gisStatusTokens.ts
src/centerpanel/components/map/design/gisDensity.ts
src/centerpanel/components/map/design/README.md
```

Purpose:

- Map Synapse/IDE tokens into stable GIS aliases.
- Centralize motion aliases and reduced-motion helpers.
- Define status token mapping for layer/source/tool/evidence states.
- Document compact/default/relaxed density.

Acceptance:

- Map Explorer CSS Modules can reference `--gis-*` aliases.
- No major Map Explorer component needs hard-coded app colors.

### Workbench Shell

```text
src/centerpanel/components/map/workbench/GisWorkbenchShell.tsx
src/centerpanel/components/map/workbench/GisWorkbenchShell.module.css
src/centerpanel/components/map/workbench/GisActivityRail.tsx
src/centerpanel/components/map/workbench/GisTopCommandBar.tsx
src/centerpanel/components/map/workbench/GisDockPanel.tsx
src/centerpanel/components/map/workbench/GisBottomPanel.tsx
src/centerpanel/components/map/workbench/GisStatusBar.tsx
src/centerpanel/components/map/workbench/GisResizableDivider.tsx
```

Purpose:

- Replace modal-like chrome with a professional workbench frame.
- Use VS Code-like rail, docks, bottom panel, and status bar.
- Preserve existing Map Explorer behavior while improving layout.

Acceptance:

- `MapExplorerModal.tsx` composes the shell instead of owning dense layout details.
- Docks and bottom panel are resizable.
- UI remains usable at desktop, tablet, and short viewport heights.

### Shared GIS UI Primitives

```text
src/centerpanel/components/map/ui/GisIconButton.tsx
src/centerpanel/components/map/ui/GisStatusChip.tsx
src/centerpanel/components/map/ui/GisSectionHeader.tsx
src/centerpanel/components/map/ui/GisPropertyGrid.tsx
src/centerpanel/components/map/ui/GisTabs.tsx
src/centerpanel/components/map/ui/GisToolbar.tsx
src/centerpanel/components/map/ui/GisEmptyState.tsx
src/centerpanel/components/map/ui/GisProgressBar.tsx
src/centerpanel/components/map/ui/GisTooltip.tsx
```

Purpose:

- Stop duplicating one-off panel, chip, tab, and button styles.
- Make GIS status and evidence state consistent.
- Ensure controls have accessibility labels and tooltips.

Acceptance:

- Catalog, contents, inspector, toolbox, and bottom panel share the same primitives.
- Status chips always carry semantic state and tooltip explanation.

### Catalog And Contents UI

```text
src/centerpanel/components/map/catalog/GisCatalogPanel.tsx
src/centerpanel/components/map/catalog/GisCatalogPanel.module.css
src/centerpanel/components/map/catalog/GisSourceRow.tsx
src/centerpanel/components/map/contents/GisContentsTree.tsx
src/centerpanel/components/map/contents/GisContentsTree.module.css
src/centerpanel/components/map/contents/GisLayerRow.tsx
src/centerpanel/components/map/contents/GisLayerGroupRow.tsx
```

Purpose:

- Create desktop-GIS source and layer management surfaces.
- Show restore state, source health, demo/sample state, scale range, filters, editability, and QA warnings.

Acceptance:

- User can identify broken, unknown, demo, external, and ready sources without opening inspectors.
- Active layer, selected features, and warning states are visible and keyboard reachable.

### Inspector And Urban Bridge UI

```text
src/centerpanel/components/map/inspector/GisLayerInspector.tsx
src/centerpanel/components/map/inspector/GisLayerInspector.module.css
src/centerpanel/components/map/inspector/GisInspectorTabs.tsx
src/centerpanel/components/map/inspector/GisCrsPanel.tsx
src/centerpanel/components/map/inspector/GisQaPanel.tsx
src/centerpanel/components/map/inspector/GisLineagePanel.tsx
src/centerpanel/components/map/urbanBridge/GisUrbanBridgePanel.tsx
src/centerpanel/components/map/urbanBridge/GisUrbanBridgePanel.module.css
```

Purpose:

- Make layer readiness, CRS, source, schema, QA, lineage, and Urban compatibility visible in one professional inspector.
- Harmonize Map Explorer and Urban Analytics status language.

Acceptance:

- "Prepare in Map" flows expose prerequisites before execution.
- Evidence publication is visually separate from preview/preparation.
- Demo/sample/unknown states remain visible after handoff.

### Attribute Table And Field Tools

```text
src/centerpanel/components/map/table/GisAttributeTable.tsx
src/centerpanel/components/map/table/GisAttributeTable.module.css
src/centerpanel/components/map/table/GisFieldHeader.tsx
src/centerpanel/components/map/table/GisFieldProfilePanel.tsx
src/centerpanel/components/map/table/GisFieldCalculatorPanel.tsx
```

Purpose:

- Bring professional tabular workflows into the bottom panel.
- Provide selection sync, field profiling, filtering, sorting, and safe derived fields.

Acceptance:

- Table selection and map selection stay synchronized.
- Long field names and null values are handled cleanly.
- Field calculator output preserves provenance and QA.

### Processing Toolbox And Model Builder UI

```text
src/centerpanel/components/map/processing/GisProcessingToolbox.tsx
src/centerpanel/components/map/processing/GisProcessingToolbox.module.css
src/centerpanel/components/map/processing/GisToolParameterForm.tsx
src/centerpanel/components/map/processing/GisRunHistoryPanel.tsx
src/centerpanel/components/map/modelBuilder/GisModelBuilder.tsx
src/centerpanel/components/map/modelBuilder/GisModelBuilder.module.css
```

Purpose:

- Provide ArcGIS/QGIS-like processing and chained workflow surfaces.
- Show implementation status, runtime mode, CRS requirements, preview/apply, and logs.

Acceptance:

- Tool readiness is visible before run.
- Blocked tools explain missing CRS/fields/AOI/source.
- Model runs generate auditable manifests and Synapse IDE handoff artifacts.

### Layout Composer UI

```text
src/centerpanel/components/map/layout/GisLayoutComposer.tsx
src/centerpanel/components/map/layout/GisLayoutComposer.module.css
src/centerpanel/components/map/layout/GisLayoutElementPanel.tsx
src/centerpanel/components/map/layout/GisExportPreflightPanel.tsx
```

Purpose:

- Replace screenshot-style output with professional cartographic layout authoring.
- Preserve QA, CRS, attribution, legend, timestamp, and source metadata in exports.

Acceptance:

- Export preview clearly shows caveats and demo/sample labels.
- Layout can restore the map view and visible layer state.

### 3D Block And Scenario UI

```text
src/centerpanel/components/map/scene3d/GisSceneModeStrip.tsx
src/centerpanel/components/map/scene3d/GisSceneModeStrip.module.css
src/centerpanel/components/map/scene3d/GisBuildingInspector.tsx
src/centerpanel/components/map/scene3d/GisBlockParcelInspector.tsx
src/centerpanel/components/map/scene3d/GisZoningRulePanel.tsx
src/centerpanel/components/map/scene3d/GisMassingScenarioPanel.tsx
src/centerpanel/components/map/scene3d/GisSunShadowTimeline.tsx
src/centerpanel/components/map/scene3d/GisScenarioComparisonStrip.tsx
```

Purpose:

- Give 3D blocks, zoning, massing, sunlight, and digital twin workflows their own professional controls.

Acceptance:

- 3D controls do not obscure selected geometry.
- Scenario, zoning, and sunlight assumptions are visible.
- Generated massing is clearly labeled as scenario output, not existing reality.

## CSS Module Rules

Rules for all new Map Explorer design CSS:

- Use CSS Modules.
- Reference GIS aliases first: `--gis-*`.
- Use existing Synapse/IDE tokens only through the alias layer unless a component is deliberately bridging existing CSS.
- Avoid local hard-coded colors except for map symbology palettes.
- Define reduced-motion behavior in any module with transitions or animations.
- Keep panel radius at 4-8px.
- Use thin borders and restrained shadows.
- Do not use Tailwind.
- Do not create decorative cards inside cards.
- Keep text stable inside buttons, rows, chips, and table cells.

## State Mapping

Every source, layer, tool, run, output, and evidence artifact should map to a visual status.

| Domain state | Visual state | Required UI treatment |
| --- | --- | --- |
| `ready` | Ready | Success foreground, compact chip, no caveat icon. |
| `unknown` | Unknown | Muted/warning hybrid, tooltip explains missing metadata. |
| `caveat` | Caveat | Warning chip, caveat visible above primary action. |
| `demo_mode` | Demo | Demo/sample chip visible in row, inspector, report, evidence. |
| `synthetic` | Demo/sample | Same as demo but wording must say synthetic. |
| `environment_dependent` | Environment | Info/warning chip, provider health visible. |
| `residual_gap` | Caveat/blocker | Tool cannot claim complete production readiness. |
| `deferred` | Deferred | Disabled or unavailable with roadmap note. |
| `blocked` | Blocked | Error/blocker state, action disabled with reason. |
| `running` | Running | Progress state, cancel where supported. |
| `stale` | Stale | Stale chip and restore/recompute action. |

## Animation Implementation Rules

Implement animations as reusable classes or CSS variables:

- `gisFadeIn`
- `gisPanelIn`
- `gisAccentGrow`
- `gisStatusFlash`
- `gisFeaturePulse`
- `gisLayerFade`

Rules:

- Each animation must have a reduced-motion fallback.
- No infinite animations except legitimate indeterminate progress.
- No shimmer effects on primary buttons.
- No icon scale on rail hover.
- No animated scientific metric counting.

## Visual QA Plan

### Unit And Component Checks

Add component tests where feasible for:

- Status chip labels and accessibility.
- Disabled reason rendering.
- Inspector blocked/unknown/demo states.
- Attribute table selected row state.
- Processing tool readiness state.
- Urban bridge state mapping.

### Playwright Visual States

Recommended screenshot suite:

```text
e2e/map-explorer-design.spec.ts
e2e/map-explorer-3d-design.spec.ts
e2e/map-urban-bridge-design.spec.ts
```

States to capture:

- Empty project shell.
- Loaded project with multiple layers.
- Catalog with broken external source.
- Contents tree with grouped layers and warnings.
- Layer inspector unknown CRS.
- Attribute table with selection.
- Processing toolbox blocked by missing CRS.
- Urban method request ready.
- Urban method request blocked.
- Layout composer export preflight.
- 2.5D building extrusion.
- 3D massing scenario compare.
- Reduced-motion mode.

### Canvas Checks

3D and map tests should include:

- Nonblank canvas pixel check.
- Selected feature/3D object visible after focus.
- Overlay controls do not cover selected object at default viewport.
- Mobile/tablet viewport does not overlap critical UI.

### Manual Design Review

Before release, manually review:

- 1366x768 desktop.
- 1440x900 desktop.
- 1920x1080 desktop.
- 1024x768 tablet-ish viewport.
- 900x520 short viewport.
- Reduced motion.
- High contrast or forced colors.

## Implementation Sequence

### Step 1 - Add GIS Token Layer

Deliver:

- `gisTokens.css`
- `gisMotion.css`
- status token mapping
- density notes

Validation:

- Map Explorer still renders with existing components.
- No behavior change.

### Step 2 - Wrap Existing Map Explorer In Workbench Shell

Deliver:

- Workbench shell components.
- Rail, top command bar, dock containers, bottom panel, status bar.
- Existing panels slotted into new layout.

Validation:

- Existing Map Explorer tests pass.
- Playwright smoke confirms shell opens.

### Step 3 - Standardize UI Primitives

Deliver:

- Shared icon button, status chip, section header, tabs, property grid, toolbar, empty state, progress bar.
- Replace local chip/button/tab variants in Map Explorer where low risk.

Validation:

- Typecheck and component tests.
- Visual screenshot before/after for core states.

### Step 4 - Redesign Catalog And Contents

Deliver:

- Catalog panel.
- Contents tree.
- Layer/source row state language.

Validation:

- Source health and layer QA state visible.
- Keyboard tree navigation works or is explicitly tracked.

### Step 5 - Redesign Inspector And Urban Bridge

Deliver:

- Layer inspector tabs.
- QA/CRS/lineage panels.
- Urban bridge panel aligned with Urban Analytics.

Validation:

- `npm run test:analytics`
- Bridge payload tests.
- Screenshots for ready/warning/blocked states.

### Step 6 - Redesign Bottom Panel Workflows

Deliver:

- Attribute table style.
- Processing toolbox style.
- Run history/log style.

Validation:

- Virtualized table does not jump.
- Long text does not overflow.
- Blocked tools show exact reason.

### Step 7 - Add Motion Layer

Deliver:

- CSS animations and transition classes.
- Reduced-motion coverage.
- Feature selection and handoff feedback.

Validation:

- Reduced-motion Playwright pass.
- No text or layout shift from hover/focus.

### Step 8 - Add 3D Interaction UI

Deliver:

- 3D mode strip.
- Building/block/scenario/zoning panels.
- Sun/shadow timeline.
- Scenario comparison strip.

Validation:

- 3D canvas nonblank.
- Selected object visible.
- Overlays do not block inspection.

### Step 9 - Visual Regression Gate

Deliver:

- Screenshot suite.
- Canvas checks.
- Manual review checklist.

Validation:

- Design gate becomes part of release readiness.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Existing Map Explorer components have local visual assumptions. | Introduce token layer first, then migrate component groups incrementally. |
| Workbench shell could destabilize map layout. | Slot current panels into shell before refactoring internals. |
| Dense UI may become unreadable. | Use fixed row heights, truncation rules, tooltips, and tablet/short-viewport checks. |
| 3D overlays may hide scene geometry. | Use anchored compact controls and visual tests with selected object. |
| Status colors may diverge from Urban Analytics. | Centralize status mapping and reuse Urban evidence semantics. |
| Animations may hurt accessibility. | Require reduced-motion fallback in each animated module. |
| Visual QA may become flaky. | Prefer stable loaded fixture data and canvas nonblank thresholds. |

## Done Definition

Design implementation is production-ready when:

- The Map Explorer workbench visually belongs with Synapse IDE and Urban Analytics.
- The professional GIS surfaces are dense, readable, and keyboard reachable.
- Every critical state has explicit visual treatment.
- Motion is subtle, purposeful, and reduced-motion safe.
- 3D block workflows have polished controls and do not feel bolted on.
- Visual tests cover core 2D, Urban bridge, and 3D states.
- Documentation in this operating pack matches the implemented design decisions.

