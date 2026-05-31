# 11 - Premium VS Code GIS Design System

Date: 2026-05-22
Status: design operating plan
Scope: define the professional visual system for Map Explorer as a GIS workbench that feels native beside Synapse IDE and Urban Analytics.

## Purpose

Map Explorer must not look like a generic map modal. It should feel like a professional spatial workstation: dense, calm, fast, precise, and trustworthy. The visual target is a premium VS Code-style GIS application with ArcGIS/QGIS depth and Urban Analytics scientific state awareness.

This document turns existing Synapse IDE and Urban Analytics styling into a Map Explorer design system plan. It is intentionally implementation-oriented so future work can translate it into CSS Modules, tokens, component contracts, visual tests, and interaction QA.

## Current Design Inputs To Reuse

The plan should reuse the existing visual language rather than inventing a disconnected theme.

Primary style references:

- `src/ui/theme/ideProScope.css`
  - IDE-level aliases for surfaces, text, borders, focus rings, density, shadows, evidence/status colors, compact/relaxed modes, and reduced motion.
- `src/components/ide/styles/ideShell.css`
  - VS Code-like workbench shell: activity rail, flat icon buttons, left active accent, thin resizers, bottom panel, compact rows, premium micro refinements.
- `src/features/urbanAnalytics/rightPanelFourBlock.css`
  - Urban Analytics panel rhythm: compact typography, subtle section headings, 140-220ms transitions, fade-in, reduced-motion handling, evidence/status language.
- `src/centerpanel/components/map/mapTokens.ts`
  - Existing Map Explorer semantic aliases from `DESIGN_TOKENS.mapExplorer`.
- `src/centerpanel/components/map/MapWorkspaceCockpit.module.css`
  - Current dense map command center patterns: cockpit metrics, operational signals, mode rail, quick actions, recommendation rows, readiness tracks.
- `src/centerpanel/styles/tokens.css`
  - CenterPanel-level UI tokens for card, input, tabs, status rail, print behavior, density, and accessibility.

## Design North Star

Map Explorer should look and behave like a serious GIS command workbench:

- Dense enough for analysts who live in the tool all day.
- Calm enough that the map remains the primary surface.
- Explicit enough that CRS, source quality, QA, evidence mode, and runtime caveats are always inspectable.
- Fast enough that every hover, focus, panel switch, selection, and 3D transition feels intentional.
- Integrated enough that Urban Analytics and Synapse IDE feel like nearby panels in the same professional environment.

The desired first impression:

> "This is not a demo map viewer. This is a browser-native GIS and urban analytics workstation."

## Visual Principles

### 1. Workbench, Not Dashboard

Avoid dashboard decoration. Use professional working surfaces:

- Flat panels with thin hairline borders.
- Compact rails, rows, tables, inspectors, and command areas.
- Clear focus and selection states.
- No oversized hero areas.
- No decorative background gradients, floating blobs, or marketing sections.
- No cards inside cards.

### 2. Map First

The map/scene is the central instrument. UI should frame it, not compete with it.

- Use restrained chrome around the map.
- Keep map overlays compact and anchored.
- Prefer collapsible/dockable panels over large permanent overlays.
- Do not obscure selected geometry, popups, measurement labels, or 3D buildings with oversized panels.

### 3. Professional GIS Density

Map Explorer needs desktop-GIS depth:

- Catalog.
- Contents tree.
- Layer properties.
- Attribute table.
- Field calculator.
- Processing toolbox.
- Model builder.
- Layout composer.
- Review timeline.
- 2D/3D scene controls.

These surfaces should share one component language: compact rows, tabs, split panes, status chips, property grids, tool parameter forms, and bottom-panel outputs.

### 4. Evidence And QA Are Visual States

Scientific truth must be visible, not hidden in metadata.

Every layer, source, tool, run, figure, and evidence artifact should show state using the same language:

- Ready.
- Caveat.
- Unknown.
- Demo/sample/synthetic.
- Environment-dependent.
- Stale/superseded.
- Blocked.
- Running.

The UI must never make unknown metadata look complete.

### 5. Premium Means Quiet

Premium should come from alignment, rhythm, speed, and detail. Avoid heavy glow, big shadows, high saturation, excessive gradients, and animated spectacle.

Allowed accents:

- Thin left bars on active rows.
- One-pixel tab indicators.
- Compact status chips.
- Soft focus rings.
- Subtle progress tracks.
- Small hover background changes.

## Shell Layout Standard

The target Map Explorer shell should mirror the Synapse IDE mental model while preserving GIS needs.

```text
+--------------------------------------------------------------------------+
| Top Command Bar: project, CRS, scale, tool search, run status, evidence   |
+------+-----------------------+------------------------------+------------+
| Rail | Catalog / Contents    | 2D Map or 3D Scene Canvas     | Inspector  |
|      |                       |                              | / Urban    |
+------+-----------------------+------------------------------+------------+
| Bottom Panel: attribute table, processing logs, model runs, console       |
+--------------------------------------------------------------------------+
| Status Bar: source count, selected count, CRS, scale, QA, worker state    |
+--------------------------------------------------------------------------+
```

### Top Command Bar

Purpose:

- Expose current project/session identity.
- Show CRS, scale, source restore state, selected feature count, active workflow/run state.
- Provide command palette and tool search.
- Surface Urban Analytics compatibility state.

Visual rules:

- Height: 34-44px depending on density.
- Background: IDE panel surface.
- Border: 1px bottom hairline.
- Typography: compact mono for metadata, sans/brand for active project label.
- Buttons: icon-first with tooltips; text only for high-level commands.
- Status items: compact, non-decorative.

### Activity Rail

Purpose:

- Switch between GIS modes without consuming map space.

Recommended rail items:

- Catalog.
- Contents.
- Select/Edit.
- Analysis.
- 3D Scene.
- Layout.
- Review.
- Settings.

Visual rules:

- Width: 40-44px.
- Flat icon buttons.
- Active state: 2px left accent bar.
- Hover: icon brightens, no large background fill.
- Badges: tiny mono count/dot for warnings, active jobs, evidence updates.

### Left Dock

Purpose:

- Catalog/source browser.
- Contents tree.
- Toolboxes or model library when selected from rail.

Visual rules:

- Width: default 300-380px, resizable 240-600px.
- Section headers: uppercase mono, 10-11px.
- Rows: 26-32px compact, icon + name + state.
- Active row: thin accent bar and subtle background.
- Group nesting: tree indentation with thin guide lines.
- No decorative cards. Use rows, folds, separators, and property lists.

### Center Canvas

Purpose:

- 2D map, 2.5D view, or full 3D scene.

Visual rules:

- Full-bleed inside the workbench center.
- Overlay controls must be compact.
- Coordinates, scale, zoom, snapping, and scene mode indicators should stay readable at all sizes.
- Avoid dark translucent panels over important geometry unless anchored and collapsible.

### Right Dock

Purpose:

- Layer inspector.
- Tool parameter inspector.
- Feature inspector.
- Urban Analytics compatibility and evidence handoff.
- 3D building/block/scenario inspector.

Visual rules:

- Width: default 360-440px, resizable 300-560px.
- Tabs at top: compact, underline active state.
- Sections: collapsible property groups.
- Status summaries: first visible row under header.
- Evidence/QA caveats must be visible before action buttons.

### Bottom Panel

Purpose:

- Attribute table.
- Processing run logs.
- Model builder execution output.
- Validation diagnostics.
- Console-like source/worker/CRS messages.

Visual rules:

- Height: default 220-320px, resizable.
- Tabs: 30-34px high, active underline.
- Tables: virtualized, sticky header, compact cells.
- Logs: mono, timestamped, severity colored.
- Empty states: small and useful, never full-page illustrations.

### Status Bar

Purpose:

- Continuous operational confidence.

Recommended fields:

- Active CRS / execution CRS.
- Scale.
- Cursor coordinates.
- Selected features.
- Visible layers.
- Worker/GPU/WASM backend state.
- Source restore health.
- Urban bridge sync state.
- Evidence mode and QA state.

Visual rules:

- Height: 22-26px.
- Mono 10-11px.
- Compact segmented status items.
- No tall chips.

## Token Contract

Map Explorer should consume existing app tokens through a GIS-specific alias layer.

### Surface Tokens

Required aliases:

- `--gis-bg-canvas`: central map/scene backing surface.
- `--gis-bg-panel`: panel surface.
- `--gis-bg-panel-alt`: alternate row/fold surface.
- `--gis-bg-control`: control background.
- `--gis-bg-hover`: row/control hover.
- `--gis-bg-active`: selected row/tab/layer state.
- `--gis-bg-popover`: menus, context menus, tool palettes.

Sources:

- `--ide-bg-canvas`
- `--ide-bg-panel`
- `--syn-surface-panel`
- `--syn-surface-workbench`
- `--syn-surface-input`

### Text Tokens

Required aliases:

- `--gis-text-primary`
- `--gis-text-secondary`
- `--gis-text-muted`
- `--gis-text-on-accent`
- `--gis-text-warning`
- `--gis-text-error`
- `--gis-text-success`

Rules:

- Primary text is for current labels and values.
- Secondary text is for metadata.
- Muted text is for optional details, not critical warnings.
- Warnings and blockers must use semantic tokens, not muted gray.

### Border And Separator Tokens

Required aliases:

- `--gis-border-subtle`
- `--gis-border-default`
- `--gis-border-strong`
- `--gis-divider`
- `--gis-focus-ring`

Rules:

- Most panel boundaries use subtle borders.
- Strong borders are reserved for active popovers, focused controls, and blocking states.
- Separators should be neutral unless indicating active selection.

### Accent Tokens

Required aliases:

- `--gis-accent`: primary workbench accent.
- `--gis-accent-hover`
- `--gis-accent-soft`
- `--gis-accent-bar`: 1-2px active indicator.

Rules:

- Accent is for active/focused/selected states.
- Do not use accent as a large background wash.
- Use amber/blue balance from existing Synapse tokens rather than introducing a new color family.

### Status Tokens

Required aliases:

- `--gis-status-ready`
- `--gis-status-caveat`
- `--gis-status-unknown`
- `--gis-status-demo`
- `--gis-status-environment`
- `--gis-status-stale`
- `--gis-status-blocked`
- `--gis-status-running`

Each status needs:

- Foreground.
- Background tint.
- Border tint.
- Compact icon.
- Tooltip explanation.

### Radius, Density, And Spacing

Rules:

- Default radius: 4-6px for GIS panels and controls.
- Maximum normal panel radius: 8px.
- Attribute table cells and tree rows should not use pill styling.
- Density modes should reuse Synapse compact/relaxed patterns.

Recommended heights:

- Rail button: 36px.
- Toolbar button: 28-32px.
- Tree row: 26-30px.
- Attribute row: 28-32px.
- Tab: 30-34px.
- Status bar: 22-26px.
- Inspector section header: 28-32px.

### Typography

Use:

- UI font: Inter/system stack for labels and readable prose.
- Mono font: JetBrains Mono for CRS, field names, IDs, counts, status, code, processing parameters, logs.

Rules:

- No viewport-scaled typography.
- No negative letter spacing.
- Use uppercase mono only for compact metadata labels.
- Avoid hero-scale type inside panels.
- Long source names, layer names, field names, and CRS definitions must truncate or wrap intentionally.

## Component System

### GIS Workbench Shell

Components:

- `GisWorkbenchShell`
- `GisActivityRail`
- `GisTopCommandBar`
- `GisDockPanel`
- `GisResizableDivider`
- `GisBottomPanel`
- `GisStatusBar`

Acceptance:

- Resizable panels keep stable min/max dimensions.
- Map remains usable at desktop and tablet sizes.
- Keyboard focus order follows rail -> dock -> canvas -> inspector -> bottom panel.

### Catalog Panel

Components:

- Source tree.
- Connection row.
- Source health badge.
- Restore/repair action.
- Import profile preview.
- Source provenance detail.

Visual requirements:

- Broken sources use explicit blocked state.
- Demo/sample packs are visibly labeled.
- External service credentials/health are never hidden in tooltips only.

### Contents Tree

Components:

- Layer group row.
- Layer row.
- Visibility toggle.
- Selectability toggle.
- Lock/editability indicator.
- Scale-range indicator.
- Definition filter indicator.
- Source health indicator.
- Drag/drop reorder affordance.

Visual requirements:

- Active layer gets left accent bar.
- Visibility, warning, and source states must be icon-first.
- Layer names should support professional-length names without layout breakage.

### Layer Inspector

Tabs:

- Overview.
- Source.
- Schema.
- CRS.
- Style.
- Labels.
- Filters.
- Editing.
- QA.
- Lineage.
- Urban bindings.
- Export.

Visual requirements:

- First visible line should state usability: ready, caveat, blocked, unknown, demo.
- Unknown CRS/schema/provenance must be impossible to miss.
- Destructive or high-impact operations must be separated and preflighted.

### Attribute Table

Features:

- Virtualized rows.
- Sticky field header.
- Sort/filter/search.
- Selection sync.
- Zoom/focus selected.
- Field profile drawer.
- Field calculator output preview.

Visual requirements:

- Headers use mono field labels with data type chips.
- Selected rows align visually with selected map features.
- Null/unknown values need distinct muted treatment.
- Warnings about sampled/limited rows must be visible above the grid.

### Processing Toolbox

Features:

- Search.
- Categories.
- Tool detail.
- Parameter form.
- CRS requirements.
- Runtime mode.
- Preview/apply.
- Logs/history.

Visual requirements:

- Tool status must show implemented/demo/residual/environment/deferred.
- Parameters use the right controls: select, checkbox, slider, numeric input, field picker, layer picker.
- Run button is disabled with a reason when blocked.

### Model Builder

Features:

- Step list or node graph.
- Inputs.
- Tool steps.
- Intermediate outputs.
- Validation states.
- Run history.
- Export to Synapse IDE artifact.

Visual requirements:

- Each step shows input/output readiness.
- Failed steps remain inspectable.
- Scenario or batch runs use clear progress state.

### Layout Composer

Features:

- Map frame.
- Legend.
- Scale bar.
- North arrow.
- Attribution.
- CRS label.
- QA caveats.
- Insets.
- Text blocks.
- Table/chart slots.

Visual requirements:

- Composer should feel like a technical layout editor, not a slide deck.
- Print/export preview must show caveats and demo/sample state.
- Restore metadata should be discoverable from the layout panel.

### Urban Analytics Bridge Panel

Features:

- Active method request.
- Compatible layers.
- Missing CRS/fields/AOI.
- Data fitness summary.
- Evidence publication.
- Report handoff.

Visual requirements:

- Use Urban Analytics status colors and language.
- Never bury caveats below action buttons.
- Make "Prepare in Map" and "Publish Evidence" feel like two stages, not one magic action.

### 3D Block And Digital Twin Panels

Components:

- 2D/3D scene switch.
- Building inspector.
- Block/parcel inspector.
- Zoning rule editor.
- Massing scenario browser.
- Sun/shadow timeline.
- Scenario comparison strip.
- 3D export/evidence panel.

Visual requirements:

- 3D controls must not hide the city model.
- Scenario colors should remain legible against basemap and extruded geometry.
- Vertical assumptions, height source, and terrain source must be visible in the inspector.

## Iconography

Use lucide icons where available. Prefer icon buttons for known commands:

- Visibility.
- Lock.
- Select.
- Edit.
- Filter.
- Style.
- Table.
- Calculate.
- Run.
- Stop.
- Refresh.
- Repair.
- Export.
- Zoom.
- 2D/3D.
- Layers.
- Database/source.
- Warning/blocker.

Rules:

- Every icon-only button needs tooltip text and accessible label.
- Avoid custom SVG unless the icon is domain-specific and unavailable.
- State must not rely on icon alone. Pair with color and tooltip; use text in inspectors and tables where needed.

## Empty, Loading, Error, And Blocked States

Empty states should be compact and operational.

Good:

- "No queryable layer selected."
- "Select a vector layer to open its table."
- "CRS is unknown. Declare CRS before metric operations."
- "External service unavailable. Retry or repair connection."

Avoid:

- Large illustration panels.
- Marketing copy.
- Generic "Something went wrong."
- Empty strips that consume map space.

Blocked states must show:

- What is blocked.
- Why it is blocked.
- Which metadata or source is missing.
- What action can resolve it.

## Accessibility Requirements

Keyboard:

- Activity rail supports arrow navigation.
- Contents tree supports tree keyboard behavior.
- Attribute table supports grid keyboard behavior.
- Tool parameters are reachable without mouse.
- Map canvas has keyboard alternatives for zoom, selection focus, and tool escape.

Screen reader:

- Icon buttons have labels.
- Status chips have readable text.
- Progress states expose live regions only when useful.
- Map features selected through the table expose count and current row.

Motion:

- All animation respects `prefers-reduced-motion`.
- No essential information is conveyed only through motion.

Contrast:

- Status states pass contrast against panel and map overlay backgrounds.
- Focus ring remains visible in high contrast mode.

## Implementation Phases

### Design Phase A - Token Bridge

Deliverables:

- Add a GIS alias token layer mapped to Synapse/IDE tokens.
- Document density modes.
- Document status color semantics.
- Add stylelint or visual checks if available.

Acceptance:

- Map components no longer invent local color values except when required for map symbology.

### Design Phase B - Workbench Shell

Deliverables:

- Apply VS Code-like shell to Map Explorer.
- Standardize rail, docks, resizers, top command bar, bottom panel, and status bar.
- Remove decorative panel styles that conflict with workbench density.

Acceptance:

- Map Explorer, Synapse IDE, and Urban Analytics feel like one application family.

### Design Phase C - Professional GIS Components

Deliverables:

- Contents tree visual system.
- Catalog visual system.
- Inspector tabs and property grids.
- Attribute table style.
- Processing toolbox forms.
- Layout composer chrome.

Acceptance:

- ArcGIS/QGIS-class workflows have consistent UI building blocks.

### Design Phase D - Urban Evidence Harmonization

Deliverables:

- Shared status chip language.
- Evidence/QA badges in layer rows, inspectors, reports, and Urban panels.
- Shared blocked/unknown/demo state patterns.

Acceptance:

- A user can recognize scientific state consistently across Map Explorer and Urban Analytics.

### Design Phase E - 3D And Scenario Visual System

Deliverables:

- 2D/3D switcher.
- 3D scene control overlays.
- Massing/scenario color rules.
- Sun/shadow timeline styling.
- 3D evidence/export panel.

Acceptance:

- 3D block workflows look like professional planning tools, not experimental overlays.

### Design Phase F - Visual QA

Deliverables:

- Playwright screenshots for key workbench states.
- Canvas nonblank checks for 2D and 3D.
- Reduced-motion screenshot pass.
- High contrast inspection.
- Mobile/tablet overflow pass.

Acceptance:

- No overlapping text.
- No clipped critical labels.
- No blank canvas.
- No hidden QA blockers.
- No visual regression against core workbench states.

## Acceptance Criteria

The design work is complete when:

- Map Explorer uses a coherent GIS-specific token layer.
- All major GIS surfaces share one professional component language.
- Urban Analytics evidence states are visually harmonized in Map Explorer.
- Synapse IDE premium shell patterns are reused where appropriate.
- 3D block and scenario workflows have a dedicated professional UI plan.
- Motion is subtle, purposeful, and accessible.
- Visual QA catches blank canvases, overlap, clipping, and reduced-motion issues.

## Design QA Checklist

- [ ] Top command bar is compact and does not push the map below useful height.
- [ ] Activity rail active state uses a 2px left accent, not a large filled button.
- [ ] Left dock rows remain readable at 240px width.
- [ ] Right inspector tabs do not overflow or wrap awkwardly.
- [ ] Attribute table headers and cells keep stable dimensions.
- [ ] Bottom panel can be resized without hiding the status bar.
- [ ] CRS, source health, and QA states are visible before execution.
- [ ] Demo/sample/synthetic sources remain labeled in table, inspector, report, and evidence surfaces.
- [ ] 3D overlays do not cover selected building/block geometry.
- [ ] Reduced motion disables nonessential transitions.
- [ ] Keyboard focus ring is visible on every interactive control.
- [ ] Text does not overlap at desktop, tablet, or small-height viewports.
