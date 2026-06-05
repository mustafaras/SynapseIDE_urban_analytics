# GIS Modal Premium UI Redesign Plan

Date: 2026-05-31
Scope: `Map Explorer` / GIS modal only
Status: planning document, no runtime behavior change
Primary surface: `src/centerpanel/components/MapExplorerModal.tsx` and `src/centerpanel/components/map/`

---

## 1. Purpose

This plan defines a premium, elite, VS Code-inspired interface upgrade for the GIS modal without breaking existing Map Explorer functionality. The current system is feature-rich, but the command and panel model is visually dense, difficult to scan, and exposes too many parallel menus at the same hierarchy level. The goal is not to remove capabilities. The goal is to reorganize them into a first-class professional GIS workbench where data loading, layer review, analysis, QA, 3D/raster workflows, export, review, and diagnostics have a clear place.

The target experience should feel like a serious spatial intelligence IDE:

- dense, calm, technical, and fast
- dark premium workbench chrome with restrained amber/blue accents
- clear left-to-right workflow hierarchy
- one obvious place for each capability
- map canvas as the primary work surface
- metadata, CRS, QA, provenance, and evidence always visible when they matter
- no decorative marketing layout, no oversized hero treatment, no fake readiness

This plan is intentionally UI-only. It must preserve store contracts, source handling, CRS gates, evidence provenance, command behavior, test IDs where possible, and analytical truthfulness.

---

## 2. Source Context Read

This plan is based on the current repository surface, especially:

| Area | Current file / doc |
| --- | --- |
| Modal host | `src/centerpanel/components/MapExplorerModal.tsx` |
| Decomposed modal composition | `src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx` |
| Workspace shell | `src/centerpanel/components/map/MapWorkspaceShell.tsx` |
| Toolbar and command palette | `src/centerpanel/components/map/MapToolbar.tsx` |
| Activity rail | `MapActivityRail` in `MapWorkspaceShell.tsx` |
| Layer stack | `src/centerpanel/components/map/MapLayerManager.tsx` |
| Contents tree | `src/centerpanel/components/map/contents/MapContentsTreePanel.tsx` |
| Catalog | `src/centerpanel/components/map/catalog/MapCatalogPanel.tsx` |
| Layer inspector | `src/centerpanel/components/map/inspector/LayerInspector.tsx` |
| Processing toolbox | `src/centerpanel/components/map/processing/MapProcessingToolboxPanel.tsx` |
| Navigator cockpit | `src/centerpanel/components/map/MapWorkspaceCockpit.tsx` |
| Status bar | `src/centerpanel/components/map/MapStatusBar.tsx` |
| Design tokens | `src/centerpanel/components/map/mapTokens.ts` |
| State architecture | `docs/architecture/map-explorer-state-and-actions.md` |
| Canonical surface ADR | `docs/architecture/map-explorer-canonical-surface.md` |
| Workflow guide | `docs/map-explorer-workflow-guide.md` |
| Source support matrix | `docs/map-source-support-matrix.md` |
| Visual QA checklist | `docs/map-visual-qa-checklist.md` |

Important architectural baseline:

- `src/centerpanel/components/map/` is the canonical Map Explorer surface.
- `src/components/map/` is non-canonical except explicit reuse paths for 3D/deck.gl-style logic.
- `useMapExplorerStore` remains the state boundary.
- Source handles persist lightweight metadata only.
- Heavy geometry, raw source bytes, raster cells, 3D tile payloads, and worker tables must not be pushed through UI state or generic events.
- EPSG:4326 display coordinates are not acceptable for planar metric analysis; CRS preflight remains mandatory.

---

## 3. Non-Negotiable Preservation Rules

The redesign must not degrade the scientific or functional guarantees already implemented.

### 3.1 Functional Preservation

- Every current command remains reachable through at least one of:
  - Activity rail
  - Contextual sidebar
  - Command center / palette
  - Canvas tool strip
  - Right inspector
  - Bottom panel
- Current handlers remain wired:
  - import
  - external services
  - catalog
  - contents
  - layer visibility/opacity/reorder/delete
  - inspect layer
  - attribute table
  - CRS declaration
  - geometry repair
  - symbology
  - draw AOI
  - measure
  - selection tools
  - workflow drawer
  - processing toolbox
  - model builder
  - NL query
  - scientific QA
  - review timeline
  - diagnostics
  - plugins
  - raster panel
  - 3D panel
  - zoning
  - massing
  - sun/shadow
  - VoxCity overlay
  - figure composer
  - image export
  - GeoJSON export
  - offline package
  - report handoff
  - project save/load
  - undo/redo
- Current bridge contracts remain intact:
  - Map Explorer to Urban Analytics
  - Urban Analytics to Map Explorer
  - Map Explorer to IDE
  - IDE to Map Explorer
- Current evidence artifact and review timeline behavior remains auditable.

### 3.2 Scientific Preservation

- Unknown CRS remains explicit, never hidden behind a polished UI.
- Demo/synthetic/sample/generated modes remain visible in chips, panels, exports, and reports.
- Disabled analysis controls must state the missing prerequisite.
- CRS, geometry validity, noData, temporal metadata, provenance, restore state, and provider dependency caveats must remain visible.
- Publication readiness must distinguish ready, ready-with-caveats, needs-review, and blocked.
- No UI copy should imply real readiness when a source is demo, metadata-only, unavailable, sampled, tiled/generalized, or environment-dependent.

### 3.3 Engineering Preservation

- No Redux or React Context for app state.
- Use existing Zustand selectors and store actions.
- No direct `localStorage`.
- No Tailwind in `centerpanel/`.
- Prefer existing `mapTokens.ts`, GIS UI primitives, and CSS Modules.
- Do not create a third map component family.
- Keep `data-testid` values where tests rely on them; when a visible UI moves, keep a compatibility wrapper or update targeted tests in the same phase.
- Preserve accessibility labels and disabled-reason patterns.

---

## 4. Current UI Problem Statement

The GIS modal is functionally strong but cognitively expensive.

### 4.1 Menu Complexity

Current command exposure is broad:

- Activity rail has layers, catalog, contents, processing, layout, 3D, QA, export, and save.
- Header toolbar exposes role-based commands and overflow groups.
- Floating panels can open from several entry points.
- Some features are split across similar surfaces:
  - `MapLayerManager` vs. `MapContentsTreePanel`
  - `MapCatalogPanel` vs. import hub vs. external services
  - workflow drawer vs. processing toolbox vs. model builder vs. NL query
  - figure composer vs. image export vs. data export vs. report handoff
- QA, diagnostics, review timeline, and readiness signals are present but distributed.

The result is not lack of capability. The problem is hierarchy. Many commands compete as peers when they should be grouped by task intent.

### 4.2 Panel Sprawl

The modal currently uses a mix of:

- left rail
- right rail
- bottom drawer
- absolute floating panels
- hidden test-only toggle triggers
- canvas overlays
- bottom timeline/status controls

This is flexible but can feel less premium because panel placement is inconsistent. A first-class GIS app should make the location of a capability predictable.

### 4.3 Weak User Mental Model

The current UI does not make a single strong promise such as:

1. load data
2. organize layers
3. inspect and validate
4. analyze
5. publish

Those phases exist in the code, but the visual hierarchy does not consistently reinforce them.

### 4.4 Premium Gap

The repository already has good ingredients:

- VS Code-like activity rail
- command palette
- dark GIS tokens
- status chips
- motion system
- cockpit/navigator
- map status bar
- resizable panel rails
- accessible icon buttons

The redesign should consolidate and elevate these ingredients rather than replacing them.

---

## 5. Product North Star

The GIS modal should become an "Urban GIS Workbench" with a stable professional shell:

```text
+----------------------------------------------------------------------------------+
| Command Center: Map Explorer | Search | Mode | Command Palette | Primary Action   |
+----+------------------------+-----------------------------------+-----------------+
|    | Sidebar                |                                   | Inspector       |
| A  | Data / Layers / Tools  |           Map Canvas              | QA / Layer /    |
| c  | context tree           |                                   | Analysis detail |
| t  |                        |                                   |                 |
| i  |                        |                                   |                 |
| v  +------------------------+-----------------------------------+-----------------+
| e  | Bottom Panel: Problems | Attributes | Timeline | Tasks | Console/Diagnostics|
+----+-------------------------------------------------------------------------------+
| Status: project | CRS | layers | selection | QA | render mode | sync | save state     |
+----------------------------------------------------------------------------------+
```

### 5.1 Top-Level Navigation

Use a VS Code-inspired activity rail as the primary navigation model. Each icon opens one predictable workspace in the left sidebar or focused panel area.

Recommended top-level activity groups:

| Activity | Purpose | Current features absorbed |
| --- | --- | --- |
| Overview | Readiness, next action, project/map context | `MapWorkspaceCockpit`, quick actions |
| Data | Import, catalog, external services, source restore | import hub, `MapCatalogPanel`, external service dialog |
| Layers | Layer stack, contents tree, visibility, grouping, scale filters | `MapLayerManager`, `MapContentsTreePanel` |
| Analyze | workflows, processing tools, model builder, NL query, spatial statistics | `MapWorkflowDrawer`, `MapProcessingToolboxPanel`, `MapModelBuilderPanel`, `MapNLQueryPanel`, LISA/Gi* panels |
| Style | symbology, choropleth, labels, legend, cartography recommendations | point symbology, choropleth, style editor, `CartographyRecommendationList` |
| Scene | raster, temporal, 3D, zoning, massing, sun/shadow, VoxCity | raster panel, temporal player, `Scene3DPanel`, zoning/massing/sun panels |
| Publish | export image/data/package, figure composer, report handoff | `MapLayoutDesignerPanel`, export dialogs, report drawer |

Bottom activity items:

| Activity | Purpose |
| --- | --- |
| QA | scientific QA and blocked prerequisites |
| Review | timeline, audit, collaboration-ready records |
| Diagnostics | render budget, worker tasks, performance |
| Extensions | plugin registry |
| Save | save/load project state, offline package shortcut |

This gives every feature a home while keeping the map canvas dominant.

---

## 6. Target Information Architecture

### 6.1 Command Center

The current header should become a compact command center, not a large button belt.

Recommended structure:

| Zone | Content | Behavior |
| --- | --- | --- |
| Left | `Map Explorer` title + active workspace crumb | Example: `Map Explorer / Layers / Contents` |
| Center | global map search + command palette trigger | Place search stays visible; command palette remains keyboard-first |
| Right | mode segmented control + primary contextual action + close | Only 1-3 visible actions at a time |

Visible top actions should be contextual:

- empty map: `Import`
- dirty map: `Save`
- active layer: `Inspect`
- blocked QA: `Review QA`
- publication-ready: `Publish`

All secondary commands move into command palette or contextual sidebars.

### 6.2 Activity Rail

The activity rail should be stable and semantic. Icons should not represent individual popups; they should represent work areas.

Target activity order:

1. Overview
2. Data
3. Layers
4. Analyze
5. Style
6. Scene
7. Publish

Bottom:

1. QA
2. Review
3. Diagnostics
4. Extensions
5. Account/project save state if needed

Every icon button must keep:

- `aria-label`
- active state
- disabled reason when disabled
- tooltip/title
- visible focus ring

### 6.3 Left Sidebar

The left sidebar becomes the equivalent of VS Code Explorer. It changes content based on the active activity.

Target sidebar modes:

| Sidebar mode | Sections |
| --- | --- |
| Overview | readiness, next action, project context, active AOI, current blockers |
| Data | local import, external service connection, source catalog, restore health |
| Layers | visible stack, layer groups, contents tree, scale/filter tools |
| Analyze | run-ready tools, workflows, model chains, NL query scope |
| Style | active layer styling, renderer presets, legend, cartography advice |
| Scene | 2D/3D/raster/temporal/zoning surface switcher |
| Publish | figure composer, export targets, report handoff readiness |

Important consolidation:

- `MapLayerManager` and `MapContentsTreePanel` should not feel like two separate apps.
- The user should see a single "Layers" activity with tabs:
  - Stack
  - Contents
  - Sources
  - Cartography
- Existing components can remain internally separate during migration, but the shell should present them as one surface.

### 6.4 Map Canvas

The center remains a full-bleed map canvas. It should not be visually boxed in a card.

Canvas overlays should be disciplined:

- Top-left: contextual active tool strip only when a draw/measure/select tool is active.
- Top-right: transient render/performance warning only when actionable.
- Bottom-left: scale/legend/minimap only when enabled or publish-preview mode requires it.
- Bottom-center: temporal playback only when temporal layers exist.
- Right edge: inspector rail, not random overlapping floating panels.

No overlay should cover key map controls, feature popups, or bottom status.

### 6.5 Right Inspector

The right side should become a single inspector host. Instead of many separate floating panels, the active object determines inspector tabs.

Inspector contexts:

| Context | Tabs |
| --- | --- |
| Layer | Overview, Source, Schema, CRS, QA, Style, Lineage, Report |
| Feature selection | Attributes, Geometry, Source, Actions |
| Analysis run | Inputs, CRS, Preview, Output, Evidence, Logs |
| QA issue | Issue, Affected layers, Fixes, Evidence |
| Publish item | Figure, Metadata, Attribution, Export checks |
| 3D/raster scene | Scene, Source, QA, Controls, Evidence |

The existing `LayerInspector` is already close to this pattern. The plan should generalize the host around it instead of spawning more floating detail panels.

### 6.6 Bottom Panel

Use a bottom panel like VS Code's Problems / Output / Terminal area. It should be collapsible and persistent.

Recommended tabs:

| Tab | Current capability |
| --- | --- |
| Problems | scientific QA blockers, warnings, CRS missing, render errors |
| Attributes | `MapAttributeTable` |
| Timeline | `MapReviewTimelinePanel` |
| Tasks | background jobs, workflow execution, import progress |
| Diagnostics | performance diagnostics, worker errors, telemetry |
| Console | optional redacted operational log only, no raw data/secrets |

This reduces floating-panel overload and gives quality/audit signals a predictable home.

### 6.7 Status Bar

The current `MapStatusBar` is valuable and should become more VS Code-like:

- Left cluster:
  - project
  - save state
  - active workspace
- Middle cluster:
  - CRS
  - zoom
  - cursor
  - selection count
  - AOI state
- Right cluster:
  - layer count
  - QA state
  - render mode
  - sync state
  - worker/task state

Status items should be clickable where safe:

- CRS opens CRS/QA detail
- QA opens Problems
- selection opens Attributes
- render mode opens Diagnostics
- sync opens Scene/3D sync controls

---

## 7. Feature Remapping Matrix

The following table is the core "no feature left behind" map.

| Existing feature | Current entry | Target home | Must preserve |
| --- | --- | --- | --- |
| Local import | toolbar/import hub/file input | Data activity > Import section | hidden file input reliability; profile/preflight results |
| CSV mapping | import dialogs | Data activity > Import workflow | skipped rows and coordinate caveats |
| Arrow/GeoParquet/Parquet | columnar import dialog | Data activity > Import workflow | worker transfer, memory estimate, schema preview |
| KML/KMZ/GPX/Shapefile/GPKG | import preview | Data activity > Import workflow | format caveats and CRS behavior |
| External services | toolbar service dialog/catalog | Data activity > Connections | provider, CORS, credentials, attribution caveats |
| Source catalog | `MapCatalogPanel` | Data activity > Catalog tab | source health and restore state |
| Layer stack | `MapLayerManager` | Layers activity > Stack tab | visibility, opacity, reorder, remove, focus |
| Contents tree | `MapContentsTreePanel` | Layers activity > Contents tab | groups, scale range, definition filters |
| Layer inspector | floating right panel | Right Inspector > Layer context | all tabs and unknown values |
| Attribute table | floating table | Bottom panel > Attributes | selection/focus/derived layer actions |
| CRS declaration | layer manager action | Inspector and QA fix action | explicit user-declared state |
| Geometry repair | layer manager/content action | QA Problems > Fix action + Layer actions | repair provenance and caveats |
| Scientific QA | right rail | Bottom Problems + Right Inspector issue detail | blockers, warnings, caveats |
| NL query | right panel | Analyze activity > Query tab | guardrails, scope limits, human confirmation |
| Spatial workflow | workflow drawer | Analyze activity > Workflows tab + inspector preview | CRS preflight, preview, apply, report |
| Processing toolbox | floating panel | Analyze activity > Tools tab | runtime labels, blocked reasons, progress |
| Model builder | floating panel | Analyze activity > Models tab | chain, batch, export to IDE/Urban |
| LISA/Gi*/Emerging hotspot | toolbar panels | Analyze activity > Statistics group | output layer publication and caveats |
| Choropleth/theme | toolbar panel | Style activity > Renderer tab | classification, legend, stale state |
| Point symbology | floating panel | Style activity > Symbol tab or Layer Inspector Style | active layer style update |
| Cartography advisor | layer manager | Style activity > Advisor + inspector | recommendations, undo, details |
| Draw AOI | toolbar/canvas | Canvas tool strip + Analyze activity | AOI dispatch, validation |
| Measure | toolbar/panel | Canvas tool strip + Bottom panel measurements | units, CRS caveats |
| Selection tools | canvas overlay | Canvas tool strip + bottom Attributes | selected IDs and layer counts |
| Pins/bookmarks | sidebar | Layers or Overview > Notes section | persisted lightweight marks |
| Annotations | toolbar/canvas | Publish/Style note tools | annotation count and export inclusion |
| Raster panel | hidden/test toggle/floating | Scene activity > Raster tab | noData, sampled histogram, CRS, evidence |
| Temporal player | bottom overlay | Scene activity + bottom timeline | reduced-motion behavior |
| 3D scene | activity rail/floating | Scene activity > 3D tab | scene caveats, viewport sync |
| Zoning/massing/sun shadow | hidden/test toggles/floating | Scene activity > Urban Form group | parcel/scene prerequisites |
| VoxCity overlay | toolbar | Scene activity > VoxCity 2D overlay | sample vs real labels |
| Figure composer | toolbar/layout panel | Publish activity > Figure tab | legend, scale bar, north arrow, attribution, CRS |
| Image export | toolbar/dialog | Publish activity > Export tab | rendering state and disabled reason |
| GeoJSON export | toolbar/dialog | Publish activity > Data export tab | exportable layer rules |
| Offline package | toolbar/dialog | Publish activity > Package tab | bounded source sidecars and manifest |
| Report handoff | right drawer | Publish activity > Report tab + right inspector | snapshot/evidence/metadata |
| Review timeline | floating/right panel | Bottom panel > Timeline | audit events, revert command |
| Diagnostics | floating panel | Bottom panel > Diagnostics | render budget and worker retry |
| Plugin registry | floating panel | Extensions activity or bottom Extensions | typed plugin contribution status |
| Command palette | toolbar | global command center | keyboard shortcut and search ranking |
| Undo/redo | toolbar/shortcuts | command center + palette + keyboard | history semantics |
| Save/load | activity bottom/toolbar | command center + status bar + Publish | project persistence rules |

---

## 8. Visual Design System Direction

### 8.1 Aesthetic

Target: "premium elite VS Code GIS".

This means:

- technical, not decorative
- dense, not cramped
- flat surfaces with thin separators
- restrained accent use
- clear active state with narrow inset bars
- strong typography hierarchy through weight and spacing, not huge sizes
- status chips that communicate readiness without noisy color blocks
- map-first layout

### 8.2 Palette

Use existing `MAP_COLORS` aliases from `mapTokens.ts`. Do not introduce a separate palette.

Recommended emphasis:

| Semantic area | Visual treatment |
| --- | --- |
| App chrome | charcoal panel/header/workspace tokens |
| Active navigation | selected subtle background + 2px accent rail |
| Primary action | interaction token, used sparingly |
| Warnings/caveats | caveat token, never hidden |
| Blocked/error | existing error token |
| Success/ready | existing success/valid token |
| Demo/synthetic | distinct demo chip, not just muted text |
| External/offline | neutral/caveat hybrid with explicit label |

Avoid:

- one-note blue/purple gradients
- decorative glow/orbs
- nested card stacks
- marketing hero language
- ornamental empty panels

### 8.3 Typography

Use `MAP_TYPOGRAPHY` and existing design tokens.

Recommended hierarchy:

| Element | Size/weight intent |
| --- | --- |
| Command center title | small/semibold |
| Sidebar section heading | xs/semibold/caps sparingly |
| Panel title | sm-md/semibold |
| Dense row text | xs-sm |
| Metadata values | mono xs where IDs/CRS/source handles |
| Status bar | mono xs |

Letter spacing should remain zero or minimal. Do not scale font size with viewport width.

### 8.4 Spacing and Density

GIS professionals expect dense controls. The redesign should support density modes but default to "comfortable compact":

- activity rail: 42px width remains reasonable
- sidebar: 280-360px desktop
- right inspector: 360-440px desktop
- bottom panel: 220-340px when expanded
- rows: fixed min heights to avoid layout jump
- icon buttons: stable square dimensions

### 8.5 Motion

Use the existing `motion.module.css` system.

Motion rules:

- panel transitions should be subtle and short
- no motion should be required to understand state
- reduced-motion must disable slide/fade/pulse
- status flash is acceptable only for state change, not idle decoration

---

## 9. Command Taxonomy

The command palette should remain the complete surface. Visible UI should only show the most relevant commands.

### 9.1 Proposed Command Categories

| Category | Commands |
| --- | --- |
| Data | Import, Browse source, Add connection, Reconnect source, Add demo pack |
| Layers | Toggle layer panel, Focus layer, Inspect layer, Duplicate layer, Set opacity, Toggle visibility, Reorder, Remove |
| Contents | Group layers, Set scale range, Apply definition filter, Clear filter |
| QA | Open Problems, Declare CRS, Repair geometry, Review source caveats |
| Analyze | Workflow, Buffer, Intersect, Union, Difference, Compare, Processing toolbox, Model builder |
| Query | NL query, selection query, attribute table |
| Style | Choropleth, point symbols, labels, legend, cartography advisor |
| Scene | Raster, temporal, 3D, zoning, massing, sun/shadow, VoxCity overlay, viewport sync |
| Publish | Figure, image export, data export, package export, report handoff |
| Review | Timeline, audit export, revert command |
| Diagnostics | Performance diagnostics, retry worker job, render budget |
| Project | Save, load, undo, redo |
| Extensions | Plugin registry |

### 9.2 Visible Toolbar Reduction

The top toolbar should stop trying to display every important command at once. The visible toolbar should show:

- command palette trigger
- active mode/workspace segmented control
- primary contextual action
- overflow menu
- close

Secondary commands move into:

- sidebar tabs
- inspector actions
- bottom panel actions
- command palette

This keeps the UI premium while preserving command reachability.

---

## 10. Detailed Layout Plan

### 10.1 Modal Shell

Target file focus:

- `MapWorkspaceShell.tsx`
- `MapExplorerModalComposition.tsx`
- `mapDocking.ts`
- `mapTokens.ts`

Tasks:

1. Introduce a stable shell grid:
   - activity rail
   - command center
   - left sidebar
   - canvas region
   - right inspector
   - bottom panel
   - status bar
2. Replace ad hoc absolute panel positioning where feasible with named shell slots.
3. Keep compact/mobile behavior:
   - sidebars become drawers
   - right inspector becomes bottom sheet or tab
   - bottom panel collapses by default
4. Preserve focus trap and body sibling `aria-hidden` behavior.
5. Preserve `MapCanvasRegion` minimum usable height.

Acceptance criteria:

- No horizontal scrollbars at 1440x900.
- The map remains visible and usable with left/right/bottom panels open.
- Header is never clipped at 1280x600.
- Activity rail does not overlap canvas at 768x1024.
- Existing modal open/close behavior remains unchanged.

### 10.2 Navigation Model

Add a UI-only navigation model, likely:

```text
src/centerpanel/components/map/navigation/mapNavigationModel.ts
```

It should define:

- activity IDs
- labels
- icons
- default sidebar tab
- associated command IDs
- whether the activity uses left sidebar, right inspector, or bottom panel
- empty-state copy

This is not new app state. It can be derived from existing modal local state and Zustand selectors.

Suggested types:

```ts
export type MapActivityId =
  | "overview"
  | "data"
  | "layers"
  | "analyze"
  | "style"
  | "scene"
  | "publish"
  | "qa"
  | "review"
  | "diagnostics"
  | "extensions";
```

Acceptance criteria:

- Activity labels are stable and accessible.
- Every current command maps to an activity.
- Command palette search still finds commands even if no visible toolbar button exists.

### 10.3 Command Center

Target file focus:

- `MapToolbar.tsx`
- `MapWorkspaceShell.tsx`
- `MapExplorerModalComposition.tsx`
- `MapSearchBar.tsx`

Tasks:

1. Split command center from full toolbar:
   - `MapCommandCenter`
   - `MapCommandPaletteTrigger`
   - `MapContextualPrimaryAction`
2. Keep `buildToolbarCommands` logic, but render fewer top-level buttons.
3. Keep command palette using full command list.
4. Add command groups and user-facing labels that match the new IA.
5. Preserve keyboard shortcuts:
   - command palette
   - undo
   - redo
   - map canvas controls

Acceptance criteria:

- `Ctrl+K` / `Cmd+K` still opens palette.
- Import, QA, workflow, export, save remain reachable without hidden affordances.
- Disabled commands still expose reasons.
- Top command center does not wrap or clip at desktop and tablet widths.

### 10.4 Sidebar Consolidation

Target file focus:

- `MapLayerManager.tsx`
- `MapContentsTreePanel.tsx`
- `MapCatalogPanel.tsx`
- `MapWorkspaceCockpit.tsx`
- new sidebar host component

Recommended new host:

```text
src/centerpanel/components/map/sidebar/MapWorkbenchSidebar.tsx
```

Sidebar sections:

| Activity | Component composition |
| --- | --- |
| Overview | cockpit summary, readiness, quick actions |
| Data | import action, catalog items, connection form, source health |
| Layers | stack and contents tabs |
| Analyze | tool/workflow/model/query launchers |
| Style | active layer style + cartography recommendations |
| Scene | raster/temporal/3D/zoning/massing/sun controls |
| Publish | figure/report/export readiness |

Migration strategy:

- Phase 1: wrap existing panels in sidebar shell with tabs.
- Phase 2: reduce duplicated headers/search bars.
- Phase 3: merge repeated layer/source status rows into shared primitives.

Acceptance criteria:

- Layer stack and contents are accessed from one Layers activity.
- Catalog/import/external services are accessed from one Data activity.
- Empty states name the next action and do not show placeholder filler.
- Existing tests can still target underlying panel content.

### 10.5 Right Inspector Host

Target file focus:

- `LayerInspector.tsx`
- `ScientificQAPanel.tsx`
- `MapWorkflowDrawer.tsx`
- `MapReportHandoffDrawer.tsx`
- `MapUrbanMethodCompatibilityRail.tsx`

Recommended new host:

```text
src/centerpanel/components/map/inspector/MapInspectorHost.tsx
```

Host contexts:

- no selection: map context summary
- layer selected: `LayerInspector`
- QA issue selected: QA details
- workflow preview: workflow details
- publish draft: report/figure details
- 3D/raster selected: scene source/QA/evidence details

Rules:

- One right inspector at a time.
- Workflows that need a full form can still use the sidebar or bottom panel, but result/details should appear in inspector.
- On compact screens, inspector becomes bottom drawer.

Acceptance criteria:

- Opening layer inspector does not create an overlapping floating panel if the inspector host is open.
- QA details can be opened from status bar, Problems, or layer row.
- Report handoff still supports snapshot refresh and insert.

### 10.6 Bottom Panel

Target file focus:

- `MapStatusBar.tsx`
- `MapReviewTimelinePanel.tsx`
- `MapAttributeTable.tsx`
- `MapPerformanceDiagnosticsPanel.tsx`
- background tasks components

Recommended new host:

```text
src/centerpanel/components/map/bottom/MapBottomPanel.tsx
```

Tabs:

- Problems
- Attributes
- Timeline
- Tasks
- Diagnostics

Initial implementation can mount existing components inside tabs. Later phases can normalize headers.

Acceptance criteria:

- Attribute table no longer competes with layer inspector.
- Review timeline has a predictable bottom location.
- Diagnostics and worker retry are reachable from status bar and bottom tab.
- Bottom panel never covers the status bar.

---

## 11. Surface-Specific UI Plans

### 11.1 Data Activity

Goal: make importing and source health feel like one professional data portal.

Sections:

1. Add Data
   - Local file import
   - Supported formats summary link or compact disclosure
   - Current import progress
2. Connections
   - WMS/WMTS/WFS/XYZ/Overpass connection form
   - Provider caveats
   - no credentials stored note
3. Catalog
   - registered sources
   - restore health
   - actionable repairs
4. Demo Data
   - clearly labelled synthetic teaching pack

Must preserve:

- all current source support matrix truthfulness
- source health states
- recoverable/unavailable/metadata-only labels
- import preflight previews

Premium improvement:

- show a compact "source readiness ledger" with counts:
  - live/restored
  - recoverable
  - unavailable
  - external
  - demo

### 11.2 Layers Activity

Goal: make layers the user's operational center.

Tabs:

- Stack: visible order, opacity, quick actions
- Contents: groups, scale ranges, definition filters
- Sources: source handle status per layer
- Style: active layer renderer quick controls

Layer row hierarchy:

1. visibility icon
2. layer name
3. source kind chip
4. QA/publication readiness chip
5. feature count / geometry type
6. row action menu

Avoid showing every action inline. Use a compact kebab/action menu or inspector action area.

Must preserve:

- visibility
- opacity
- remove confirmation
- reorder
- report layer action
- dashboard bind
- Urban send
- IDE open
- CRS declaration
- geometry repair
- attribute table
- symbology
- cache clear
- rerun stale analysis
- cartography recommendation undo

### 11.3 Analyze Activity

Goal: make analysis powerful but not chaotic.

Tabs:

- Workflows: AOI, buffer, intersect, union, difference, compare
- Tools: processing registry searchable tools
- Query: NL query with visible scope and guardrails
- Model Builder: chained processing
- Statistics: LISA, Gi*, emerging hotspot

Recommended visual hierarchy:

- left list of tools/workflows
- center detail form/preview
- right inspector for selected input/output/evidence

Must preserve:

- CRS preflight
- tool blocked reasons
- runtime mode labels
- preview before apply where currently supported
- workflow execution state
- model export to IDE/Urban
- AI proposal confirmation and audit trail

### 11.4 Style Activity

Goal: make cartography feel like a professional GIS, not scattered controls.

Tabs:

- Renderer
- Symbols
- Labels
- Legend
- Advisor

Must preserve:

- choropleth panel behavior
- point symbology behavior
- legend contract
- cartography advisor recommendation apply/dismiss/undo
- style updates through existing layer metadata contracts

Premium improvements:

- active layer header with geometry type and renderer eligibility
- disabled renderer states that name the missing geometry/field condition
- compact legend preview
- classification caveat text near the setting, not hidden elsewhere

### 11.5 Scene Activity

Goal: gather raster, temporal, 3D, and urban-form analysis into one advanced spatial scene surface.

Tabs:

- Raster
- Temporal
- 3D Scene
- Zoning
- Massing
- Sun/Shadow
- VoxCity

Must preserve:

- `RasterLayerPanel`
- `TemporalPlayerPanel`
- `Scene3DPanel`
- `Scene3DInteractionStrip`
- `ScenarioComparisonStrip`
- `ZoningRulesPanel`
- `MassingScenarioPanel`
- `SunShadowPanel`
- VoxCity overlay toggles
- viewport sync
- real vs sample geometry labels

Premium improvements:

- scene mode switcher in sidebar
- scene-specific status chips:
  - source
  - vertical datum
  - CRS
  - sample/generated
  - sync
- 3D controls should not float unpredictably over unrelated 2D workflows.

### 11.6 QA Activity and Problems Panel

Goal: make scientific correctness impossible to miss.

Problems tab should group:

- blockers
- warnings
- source caveats
- CRS missing/declaration needed
- invalid geometry
- raster noData issues
- temporal metadata gaps
- external provider risk
- demo/synthetic/generated labels

Each issue row:

- title
- affected layer/source
- severity
- why it matters
- action:
  - inspect
  - declare CRS
  - repair geometry
  - open source
  - open export readiness

Must preserve:

- existing scientific QA semantics
- no false readiness
- disabled state explanation

### 11.7 Publish Activity

Goal: put every output path under one publication cockpit.

Tabs:

- Figure
- Data Export
- Report
- Offline Package
- Review Package

Each output path should show:

- what will be included
- what will not be included
- readiness state
- caveats
- attribution/CRS/provenance requirements

Must preserve:

- figure composer options
- image export rendering state
- GeoJSON export rules
- GeoParquet/data export where exposed
- offline package bounded source behavior
- report handoff snapshot/evidence insert

Premium improvement:

- publication readiness checklist visible before export:
  - title
  - visible layers
  - CRS
  - legend
  - scale bar
  - attribution
  - QA caveats
  - evidence IDs

### 11.8 Review and Diagnostics

Goal: make audit/recovery professional and quiet.

Review timeline:

- move to bottom Timeline tab
- preserve filters/status updates/revert command
- allow right inspector details for selected timeline event

Diagnostics:

- move to bottom Diagnostics tab
- status bar opens it directly
- preserve retry worker job
- keep redacted telemetry only

Plugins:

- move to Extensions activity or bottom Extensions panel
- show contribution type:
  - source
  - renderer
  - processing tool
  - Urban bridge

---

## 12. Implementation Phases

Each phase should be small enough to validate independently. Do not attempt a single big-bang rewrite.

### Phase 0 - Baseline Audit and Screenshot Capture

Purpose: capture current behavior before UI surgery.

Tasks:

- Run existing Map Explorer unit/component tests.
- Run layout e2e smoke.
- Capture desktop, tablet, and short viewport screenshots.
- Record current command IDs from `MapToolbar.tsx`.
- Record current panel states from `MapExplorerModalComposition.tsx`.

Recommended validation:

```bash
npm run typecheck
npx vitest run src/centerpanel/components/map
npm run test:e2e -- e2e/map-modal-layout.spec.ts
```

Exit criteria:

- Known baseline documented.
- No UI work starts without command/panel inventory.

### Phase 1 - Navigation Model and Command Inventory

Purpose: create a stable map from current features to target activities.

Tasks:

- Add `mapNavigationModel.ts`.
- Add command category metadata without changing handlers.
- Add tests for command-to-activity coverage.
- Keep existing toolbar rendering unchanged in this phase.

Files:

- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/mapExperience.ts`
- new `src/centerpanel/components/map/navigation/mapNavigationModel.ts`
- new tests under `src/centerpanel/components/map/__tests__/`

Exit criteria:

- Every existing command has an activity category.
- No behavior change yet.

### Phase 2 - Shell Grid and Activity Rail Refresh

Purpose: make the modal structure match the target workbench.

Tasks:

- Update `MapWorkspaceShell` slots.
- Replace current activity item list with semantic activity groups.
- Preserve old actions through command palette and sidebar wrappers.
- Add `data-map-active-activity`.
- Keep existing focus trap.

Files:

- `MapWorkspaceShell.tsx`
- `MapExplorerModalComposition.tsx`
- `mapDocking.ts`
- `mapTokens.ts` only if token alias is missing

Exit criteria:

- Activity rail shows stable top-level groups.
- Existing layer/catalog/processing/layout/3D/QA/save commands remain reachable.
- No panel overlap regressions.

### Phase 3 - Command Center Simplification

Purpose: reduce toolbar clutter.

Tasks:

- Split full command registry from visible command rendering.
- Keep palette complete.
- Render contextual primary action.
- Add compact overflow menu grouped by taxonomy.
- Preserve role/density preference if still useful.

Files:

- `MapToolbar.tsx`
- possible new `MapCommandCenter.tsx`
- command palette tests

Exit criteria:

- Command palette still exposes all commands.
- Top bar is visually calm and does not wrap.
- Disabled reason behavior preserved.

### Phase 4 - Sidebar Host

Purpose: consolidate left-side experiences.

Tasks:

- Add `MapWorkbenchSidebar`.
- Mount Overview/Data/Layers activities.
- Wrap `MapWorkspaceCockpit`, `MapCatalogPanel`, `MapLayerManager`, and `MapContentsTreePanel`.
- Remove duplicate outer panel chrome when embedded.

Files:

- new `sidebar/MapWorkbenchSidebar.tsx`
- `MapWorkspaceCockpit.tsx`
- `MapCatalogPanel.tsx`
- `MapLayerManager.tsx`
- `MapContentsTreePanel.tsx`
- corresponding CSS modules

Exit criteria:

- User reaches import/catalog/layer stack/contents from one stable sidebar.
- No duplicated headers create a card-inside-card look.
- Layer action behavior unchanged.

### Phase 5 - Right Inspector Host

Purpose: reduce floating panel sprawl.

Tasks:

- Add `MapInspectorHost`.
- Mount `LayerInspector` as first context.
- Route QA issue detail and workflow preview into inspector where practical.
- Keep compact bottom-drawer presentation.

Files:

- new `inspector/MapInspectorHost.tsx`
- `LayerInspector.tsx`
- `ScientificQAPanel.tsx`
- `MapWorkflowDrawer.tsx`
- `MapReportHandoffDrawer.tsx`
- `MapExplorerModalComposition.tsx`

Exit criteria:

- Layer inspector uses right host.
- QA details have a predictable location.
- Report/workflow drawers retain behavior.

### Phase 6 - Bottom Panel

Purpose: move operational detail surfaces out of floating space.

Tasks:

- Add `MapBottomPanel`.
- Add tabs: Problems, Attributes, Timeline, Tasks, Diagnostics.
- Mount existing components inside tabs.
- Wire status bar clicks to open relevant tabs.

Files:

- new `bottom/MapBottomPanel.tsx`
- `MapStatusBar.tsx`
- `MapAttributeTable.tsx`
- `MapReviewTimelinePanel.tsx`
- `MapPerformanceDiagnosticsPanel.tsx`
- `MapExplorerModalComposition.tsx`

Exit criteria:

- Attribute table and timeline are no longer unpredictable floating overlays.
- Bottom panel is keyboard navigable.
- Status bar remains visible.

### Phase 7 - Analyze/Style/Scene Consolidation

Purpose: organize advanced GIS features by professional workflows.

Tasks:

- Build Analyze sidebar tabs.
- Build Style sidebar tabs.
- Build Scene sidebar tabs.
- Move existing floating advanced panels into the proper activity host.
- Keep canvas overlays only for active map interactions.

Files:

- `MapProcessingToolboxPanel.tsx`
- `MapModelBuilderPanel.tsx`
- `MapNLQueryPanel.tsx`
- `MapWorkflowDrawer.tsx`
- `MapChoroplethLayer` panel integration
- `Scene3DPanel.tsx`
- `RasterLayerPanel.tsx`
- zoning/massing/sun panels

Exit criteria:

- Advanced features are grouped and discoverable.
- No current advanced workflow loses run/apply/export behavior.
- CRS and mode caveats stay visible.

### Phase 8 - Publish Center

Purpose: make output readiness first-class.

Tasks:

- Add Publish activity content.
- Consolidate figure composer, export, package, and report handoff.
- Add publication readiness checklist.
- Keep existing dialogs where needed but launch them from Publish activity.

Files:

- `MapLayoutDesignerPanel.tsx`
- `MapExportDialog.tsx`
- `MapDataExportDialog.tsx`
- `MapReportHandoffDrawer.tsx`
- `MapExportService.ts`

Exit criteria:

- User can understand what export/report will include before running it.
- QA/provenance/CRS caveats visible before output.
- Existing export behavior unchanged.

### Phase 9 - Premium Visual Polish

Purpose: elevate aesthetics after structure is correct.

Tasks:

- Normalize headers, row density, tabs, chips, separators.
- Remove nested card look.
- Make active states consistent.
- Improve empty states.
- Verify long text wrapping.
- Verify high contrast and reduced motion.

Files:

- `mapTokens.ts`
- `ui/*`
- relevant CSS modules
- `motion.module.css`

Exit criteria:

- Visual QA checklist passes.
- No one-note palette.
- Text does not overflow controls.
- Panels feel like one system.

### Phase 10 - Regression Hardening

Purpose: protect the redesign.

Tasks:

- Update component tests for navigation model.
- Add e2e for:
  - open modal
  - switch each activity
  - import entry visible
  - layers visible
  - analyze tools reachable
  - QA problems reachable
  - publish reachable
  - bottom panel tabs
  - command palette command reachability
- Add visual checks for panel overlap.

Recommended validation:

```bash
npm run typecheck
npm run lint:errors
npx vitest run src/centerpanel/components/map
npm run test:e2e -- e2e/map-modal-layout.spec.ts
npm run build
```

Exit criteria:

- No TypeScript errors.
- No lint errors.
- Existing GIS feature tests pass.
- Layout e2e passes across desktop/tablet/short viewport.

---

## 13. Acceptance Criteria by User Experience

### 13.1 New User With No Data

The modal should answer:

- What is this workspace?
- How do I load data?
- What formats are supported?
- Why are analysis/export controls disabled?

Expected UI:

- Overview activity selected by default.
- Primary action: Import Data.
- Data activity visibly available.
- Empty map canvas is calm, not blank/confusing.
- Status bar shows no project/layers and CRS context honestly.

### 13.2 Analyst With Several Layers

The modal should answer:

- Which layers are visible?
- Which layer has QA issues?
- Which source is unavailable?
- How do I inspect schema/CRS/style?

Expected UI:

- Layers activity shows stack and contents tabs.
- Active layer opens right inspector.
- Problems bottom tab shows blockers/warnings.
- Layer chips are readable and distinct.

### 13.3 Analyst Running Spatial Workflows

The modal should answer:

- Which tools are applicable to my data?
- Why is a tool blocked?
- What CRS will be used?
- What output will be created?

Expected UI:

- Analyze activity groups workflows/tools/query/model/statistics.
- Tool previews and blocked reasons are visible before run.
- CRS gate is not hidden.
- Result output and evidence appear in inspector/review timeline.

### 13.4 Planner Reviewing 3D/Raster/Urban Form

The modal should answer:

- Am I using real project geometry or sample/demo geometry?
- What vertical/CRS caveats exist?
- Is viewport sync active?
- Which scene mode am I in?

Expected UI:

- Scene activity groups raster, temporal, 3D, zoning, massing, sun/shadow, VoxCity.
- Sample/generated labels are explicit.
- Scene controls do not obscure unrelated 2D layer work.

### 13.5 Report Author

The modal should answer:

- Is this map publishable?
- What caveats will be included?
- What attribution/CRS/legend/scale metadata is present?
- What will the report receive?

Expected UI:

- Publish activity shows figure/export/report/package tabs.
- Readiness checklist visible.
- Export disabled reasons are concrete.
- Report handoff evidence metadata remains intact.

---

## 14. Component Architecture Proposal

Target component tree after consolidation:

```text
MapExplorerModal
  MapExplorerModalComposition
    MapWorkspaceShell
      MapActivityRail
      MapCommandCenter
      MapWorkbenchSidebar
        OverviewSidebar
        DataSidebar
        LayersSidebar
        AnalyzeSidebar
        StyleSidebar
        SceneSidebar
        PublishSidebar
      MapCanvasRegion
        MapCanvas
        MapCanvasToolStrip
        MapLegendOverlay
        WorkflowPreviewOverlay
        Scene/Temporal overlays only when active
      MapInspectorHost
        LayerInspector
        QAInspector
        WorkflowInspector
        PublishInspector
        SceneInspector
      MapBottomPanel
        ProblemsTab
        AttributesTab
        TimelineTab
        TasksTab
        DiagnosticsTab
      MapStatusBar
```

This structure should be implemented incrementally. Existing components can be mounted under these hosts before deeper cleanup.

---

## 15. Data and State Model Rules During Redesign

The UI reorganization must be a presentation-layer change.

Allowed:

- local UI state for active activity/tab/panel open state
- Zustand selectors for existing map state
- derived summaries for visible counts/readiness
- memoized derived arrays
- UI-only navigation metadata

Not allowed:

- moving source data into layout state
- persisting raw geometry in UI preferences
- mutating evidence artifacts
- bypassing source handle restore status
- adding direct localStorage calls
- passing heavy geometry through command palette metadata
- deriving scientific readiness from visual state alone

---

## 16. Testing Strategy

### 16.1 Unit and Component Tests

Add/extend:

- navigation model coverage
- command-to-activity coverage
- sidebar activity rendering
- command center reduced toolbar rendering
- inspector host context routing
- bottom panel tab behavior
- status bar click routing
- disabled reason preservation
- reduced-motion behavior

Useful existing suites:

- `src/centerpanel/components/map/__tests__/mapShellPrimitives.test.tsx`
- `src/centerpanel/components/map/__tests__/MapToolbar.command-palette.test.tsx`
- `src/centerpanel/components/map/__tests__/MapToolbar.external-services.test.tsx`
- `src/centerpanel/components/map/__tests__/map-workspace-experience.test.ts`
- `src/centerpanel/components/map/__tests__/MapContentsModel.test.ts`
- `src/centerpanel/components/map/__tests__/layer-inspector.test.tsx`
- `src/centerpanel/components/map/__tests__/MapProcessingToolbox.test.tsx`
- `src/centerpanel/components/map/__tests__/mapVisualQA.test.ts`

### 16.2 E2E Tests

Add or extend:

- modal opens and closes
- activity rail switches all activities
- command palette still reaches hidden commands
- import path opens file/import hub
- layer stack and contents are reachable
- layer inspector opens from row
- QA opens Problems
- attribute table opens bottom tab
- Analyze activity opens workflows/tools/query/model
- Scene activity opens raster/3D/zoning/massing/sun controls
- Publish activity opens figure/export/report/package
- short viewport has no clipped critical actions
- tablet viewport has no horizontal overflow

Existing target:

- `e2e/map-modal-layout.spec.ts`
- `e2e/map-context-and-geojson.spec.ts`
- `e2e/map-columnar-io.spec.ts`
- `e2e/map-temporal-player.spec.ts`
- `e2e/map-report-handoff.spec.ts`
- `e2e/map-evidence-visual-p62.spec.ts`

### 16.3 Visual QA

Use and extend `docs/map-visual-qa-checklist.md`.

Additional checks:

- one active activity is visually obvious
- no duplicate panel headers in sidebar
- bottom panel does not cover status bar
- right inspector and left sidebar do not cover map controls
- long source/layer names wrap cleanly
- all activity icons have accessible names
- demo/synthetic chips remain visible
- CRS/QA chips remain visible in compact rows

---

## 17. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Command becomes unreachable after toolbar simplification | Functional regression | Maintain command registry coverage test and command palette complete list |
| Existing e2e selectors break | CI noise | Preserve `data-testid` or update tests in same phase |
| Panel migration creates focus trap issues | Accessibility regression | Keep `MapWorkspaceShell` focus model; test keyboard traversal |
| Floating panels overlap new inspector/sidebar | Visual regression | Migrate by host; add overlap visual tests |
| QA caveats become visually muted | Scientific regression | Problems tab and status chips must stay prominent |
| Source import flow breaks due to hidden file input move | Critical data regression | Keep file input owned by modal; trigger it from Data activity |
| Mobile/tablet layout becomes unusable | UX regression | Compact dock behavior and viewport tests per phase |
| Large state objects leak into layout persistence | Performance/data risk | Keep layout state lightweight; use existing persistence policy |
| New styling bypasses tokens | Design drift | Use `mapTokens.ts` and GIS primitives only |

---

## 18. Definition of Done

The redesign is done when:

- GIS modal has a clear VS Code-like shell:
  - activity rail
  - command center
  - contextual sidebar
  - full map canvas
  - right inspector
  - bottom panel
  - status bar
- Current GIS functionality remains available.
- Command palette can reach all major commands.
- Layer, source, QA, analysis, scene, and publish features have predictable homes.
- Scientific caveats are easier to find, not less visible.
- No false readiness is introduced.
- Demo/synthetic/sample states remain obvious.
- Desktop/tablet/short viewport visual QA passes.
- Reduced motion and high contrast remain supported.
- `npm run typecheck`, `npm run lint:errors`, targeted Map Explorer tests, and map layout e2e pass.

---

## 19. Recommended Execution Prompts

These prompts can be used later to implement the plan in controlled steps.

### Prompt 01 - Command and Panel Inventory

Create a complete command/panel inventory for Map Explorer. Add a test-backed mapping from every current `MapToolbar` command and modal panel flag to a target activity group. No visible UI changes.

### Prompt 02 - Navigation Model

Add the `mapNavigationModel.ts` activity taxonomy and tests. Keep all current behavior unchanged.

### Prompt 03 - Activity Rail Refresh

Replace the current activity rail item list with stable top-level activities while preserving command handlers through the existing toolbar/palette.

### Prompt 04 - Command Center

Split visible command center rendering from the full command palette registry. Reduce the top toolbar to contextual actions and grouped overflow.

### Prompt 05 - Sidebar Host

Add `MapWorkbenchSidebar` and mount Overview, Data, and Layers activities using existing components.

### Prompt 06 - Layers Consolidation

Unify `MapLayerManager` and `MapContentsTreePanel` under the Layers activity with Stack, Contents, Sources, and Cartography tabs.

### Prompt 07 - Data Consolidation

Unify import, catalog, and external services under the Data activity. Preserve hidden file input behavior.

### Prompt 08 - Inspector Host

Add `MapInspectorHost` and migrate `LayerInspector` into it. Keep existing layer inspection behavior.

### Prompt 09 - QA Problems Panel

Create bottom Problems tab and route QA/status clicks into it. Preserve `ScientificQAPanel` detail semantics.

### Prompt 10 - Bottom Panel

Add bottom panel tabs for Attributes, Timeline, Tasks, and Diagnostics. Mount existing components first.

### Prompt 11 - Analyze Workspace

Group workflow drawer, processing toolbox, model builder, NL query, and spatial statistics under Analyze activity.

### Prompt 12 - Style Workspace

Group symbology, choropleth, labels, legend, and cartography advisor under Style activity.

### Prompt 13 - Scene Workspace

Group raster, temporal, 3D, zoning, massing, sun/shadow, and VoxCity under Scene activity.

### Prompt 14 - Publish Workspace

Group figure composer, image/data export, offline package, and report handoff under Publish activity with a readiness checklist.

### Prompt 15 - Visual System Polish

Normalize headers, rows, chips, panel separators, focus rings, empty states, and responsive behavior using `mapTokens.ts`.

### Prompt 16 - Regression and Visual QA

Add e2e and visual QA tests for activity navigation, command reachability, panel layout, reduced motion, high contrast, and no-overlap behavior.

---

## 20. Second-Pass Completeness Audit

Added after a second product/UX review on 2026-05-31.

The core plan is strong enough to guide the premium Map Explorer redesign. The remaining gaps are not architectural blockers, but they should be added to the execution backlog so the final GIS modal feels like a polished professional product rather than only a reorganized feature set.

### 20.1 Add Persona-Based Task Lenses

The plan already defines activities such as Data, Layers, Analyze, Scene, Publish, QA, and Review. It should also define user task lenses so the same activity model can serve different GIS users without adding separate app modes.

Recommended lenses:

| Lens | Primary user | Default emphasis |
| --- | --- | --- |
| Analyst | spatial analyst / GIS technician | Data, Layers, Analyze, QA |
| Planner | urban planner / scenario reviewer | Layers, Scene, Style, Publish |
| Reviewer | scientific / QA reviewer | QA, Review, Data provenance, Inspector |
| Publisher | report author / decision brief owner | Style, Publish, Review, Attribution |

Implementation note:

- Treat lenses as layout/view presets, not new analytical state.
- A lens may choose default sidebar tab order and primary action.
- Do not hide commands from the command palette.

Acceptance criteria:

- A first-time analyst sees Import/Layers/Analyze first.
- A report author can reach Figure/Report/Attribution without hunting through analysis tools.
- Switching a lens does not mutate layer/source/evidence state.

### 20.2 Add Canvas Control and Basemap Ergonomics

The plan mentions the canvas but does not yet specify the full map-control experience. A premium GIS modal needs predictable canvas controls beyond panels.

Required canvas control set:

- zoom in/out/reset
- fit to visible layers
- fit to selected layer/feature/AOI
- basemap selector
- projection/CRS display shortcut
- scale bar toggle
- north arrow toggle for publish preview
- legend visibility toggle
- selection mode toggle
- measure/draw active tool indicator
- clear active tool

Target home:

- transient canvas tool strip for active interaction tools
- status bar shortcuts for CRS/selection/render mode
- Publish activity for map furniture used in exported figures
- Layers/Data activity for basemap/source selection

Acceptance criteria:

- User can recover from a lost viewport with one obvious action.
- Active draw/measure/select tool is visible and cancellable.
- Basemap changes do not look like analytical layer changes.

### 20.3 Make Collaboration Explicit

The workflow guide documents collaboration sessions, presence, annotations, comments, local-only state, and Yjs synchronization. The current plan only mentions collaboration indirectly. This should become explicit.

Target home:

- Review activity > Collaboration tab
- Bottom panel > Timeline/Collaboration status
- Status bar item for sync state

Collaboration UI must show:

- local-only vs live session
- connection/sync state
- active reviewers/presence where available
- comments and annotations by target ID
- evidence IDs linked to comments where available
- disconnected/offline state without claiming sync

Acceptance criteria:

- Collaboration never syncs raw geometry or source bytes.
- Offline/local-only status is visible.
- Review comments remain tied to layer/feature/evidence IDs.

### 20.4 Add Attribute, Join, and Field Operation Placement

The plan includes the attribute table, but table-centric GIS work should be more explicit.

Target home:

- Bottom panel > Attributes
- Analyze activity > Data Operations tab
- Layer Inspector > Schema tab actions

Capabilities to preserve or expose:

- attribute table open/focus/selection
- selected feature count by layer
- derived field creation
- field calculator previews
- joins/relates where supported
- field statistics
- schema profile and nullable/type metadata
- queryability limitations

Acceptance criteria:

- A user can move from a selected feature to its row and back to the map.
- Field calculator/join actions show preview and blocked reasons before apply.
- Schema and field operations do not imply metric analysis readiness.

### 20.5 Add Layout Presets, Reset, and Density Controls

Premium productivity apps need recovery controls when users open too many panels.

Required controls:

- reset layout
- collapse all panels
- focus map canvas
- restore default sidebar/inspector widths
- compact/comfortable density preference
- remember safe lightweight layout preferences only

Target home:

- Command palette
- command center overflow
- status bar/context menu where appropriate

Acceptance criteria:

- The user can recover a clean map-first layout in one command.
- Layout reset does not clear layers, sources, evidence, selections, or project state.
- Density affects row heights and spacing, not analytical output.

### 20.6 Add Accessibility Interaction Matrix

The plan mentions accessibility, but implementation needs a concrete interaction matrix.

Required keyboard/focus behavior:

- activity rail uses arrow-key traversal or predictable tab order
- command center exposes palette, search, primary action, and close in logical order
- sidebars and inspectors return focus to their opener on close
- bottom panel tabs are keyboard selectable
- map canvas has keyboard fallback controls
- Escape behavior is scoped:
  - close popover
  - close inspector/drawer
  - clear active tool
  - close modal only when appropriate
- disabled controls expose reasons with accessible text

Acceptance criteria:

- Full data-load to layer-inspect to QA-review workflow is keyboard reachable.
- Focus is never lost behind the modal.
- High-contrast mode does not rely on color alone for active/blocked/demo states.

### 20.7 Add Performance and Lazy-Mount Budget

Consolidating panels can accidentally mount too much heavy UI at once.

Performance rules:

- only active sidebar activity mounts heavy children
- expensive panels lazy-load where already practical
- map canvas remains responsive while panels switch
- attribute tables, raster previews, 3D scene, model builder, and diagnostics should not all mount eagerly
- command palette metadata must stay lightweight
- no raw source payloads are used to build navigation models

Acceptance criteria:

- Modal open time does not regress visibly.
- Switching activities does not blank or freeze the map canvas.
- 3D/raster/model panels mount only when selected or explicitly requested.

### 20.8 Add Terminology and Label Governance

The plan should enforce consistent professional language.

Terms to standardize:

- Data, Sources, Layers, Contents, Inspector, Problems, Analyze, Scene, Publish, Review
- `Demo`, `Synthetic`, `Sample`, `Generated`, `External`, `Metadata only`, `Unavailable`, `Recoverable`
- `CRS`, `Projection`, `Vertical datum`, `noData`, `Attribution`, `Evidence`

Rules:

- Do not mix "ready" with "valid" unless the domain meaning is precise.
- Do not use "magic", "AI did it", or vague success language.
- Disabled controls must name the prerequisite.
- Publication labels must distinguish map image, data export, offline package, and report handoff.

Acceptance criteria:

- Same concept has the same visible name across sidebar, inspector, status bar, and export dialogs.
- Demo/synthetic/generated labels are never shortened into ambiguity.

### 20.9 Add Product Success Metrics

The plan should define how to judge whether the redesign is actually more usable.

Suggested metrics:

- first data import reachable in one visible action from empty state
- layer inspector reachable in two actions from any visible layer row
- QA blockers reachable from status bar in one action
- command palette can find all mapped commands by category keyword
- no more than one left sidebar, one right inspector, and one bottom panel open as primary chrome
- critical export readiness visible before export
- no viewport has horizontal overflow in desktop/tablet/short layouts
- canvas remains at least 50% of modal area in default desktop workbench state

Acceptance criteria:

- These metrics are converted into component/e2e assertions where possible.
- Manual visual QA records the metrics that cannot be automated.

### 20.10 Add Premium GIS Reference Standard

The redesign should benchmark against professional GIS and IDE conventions without copying another product.

Reference behaviors to emulate conceptually:

- ArcGIS/QGIS-style layer contents and symbology hierarchy
- VS Code-style activity/sidebar/inspector/bottom-panel shell
- browser-first app responsiveness and command palette discoverability
- scientific workbench auditability for CRS, provenance, QA, and evidence

Acceptance criteria:

- The final UI reads as a GIS workbench first, not a generic dashboard.
- The shell is premium because it is organized, dense, responsive, and truthful.

### 20.11 Add These Items to Execution Prompts

Add follow-up prompt coverage:

| New prompt | Purpose |
| --- | --- |
| Prompt 17 - Persona Lenses and Layout Reset | Add task lenses, reset layout, collapse/focus commands, density controls |
| Prompt 18 - Canvas Control Standard | Formalize basemap, fit, active tool, scale/legend/north-arrow controls |
| Prompt 19 - Collaboration Surface | Place collaboration status/comments/presence under Review without syncing heavy data |
| Prompt 20 - Accessibility Matrix | Add keyboard/focus/Escape behavior tests |
| Prompt 21 - Performance Budget | Add lazy-mount and activity-switch performance checks |

---

## 21. Final Product Standard

The final GIS modal should feel like a premium analytical instrument:

- The user always knows where they are.
- The map remains the work surface.
- Sidebars organize tasks rather than advertise features.
- Inspector panels explain the selected object.
- Bottom panels carry operational truth: problems, attributes, timeline, diagnostics.
- Publishing is a readiness workflow, not just an export button.
- Scientific constraints are visible and respected.

The redesign should make the existing feature depth easier to use, not smaller.
