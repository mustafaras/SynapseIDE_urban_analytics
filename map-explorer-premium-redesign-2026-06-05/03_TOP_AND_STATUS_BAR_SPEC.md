# 03 - Top And Status Bar Specification

## Problem

The header and top bar currently feel fragmented. The hierarchy does not read like a single professional GIS toolbar, and the bottom area is overused by a panel. The redesign needs one unified top command surface and one advanced bottom status bar.

## Top Command Surface Goal

Create a unified header/top toolbar that behaves like a premium GIS command bar:

- Slightly taller than the current compact strip.
- Hierarchical but dense.
- Combines project context, place search, task lens, tool groups, and primary actions.
- Uses icon-first commands with tooltips and disabled reasons.
- Keeps the map canvas in view.

## Recommended Height

Desktop:

- Total command surface: 56-64 px.
- Single row if possible.
- Optional second micro-row only when it contains compact mode tabs or breadcrumbs and does not crowd the map.

Short desktop:

- 52-56 px.
- More commands move to overflow.

Narrow:

- 48-56 px.
- Search collapses to icon trigger or drawer.

## Command Surface Anatomy

### Left Cluster: Identity And Scope

Content:

- Map Explorer icon/label.
- Project name or `No project`.
- Workspace mode: `Explore`, `Analyze`, `Publish`, or active lens.
- Save state chip.

Rules:

- The title must not dominate the toolbar.
- Project and mode text must truncate cleanly.
- Save state is clickable only if it opens project/save detail.

### Center Cluster: Search And Context

Content:

- Place search.
- Current extent/AOI chip.
- CRS chip.
- Optional active layer chip.

Rules:

- Search must have a stable max/min width.
- Search results overlay must not be clipped by panel containers.
- CRS chip opens right `Problems`/`QA` detail if there is a caveat.

### Right Cluster: Command Groups

Groups:

1. Data: import, catalog, external services.
2. Explore: layers, selection, pins, draw, measure.
3. Analyze: QA, workflow, symbology, query, statistics.
4. Publish: export, report, image/package, save.
5. System: undo, redo, layout, preferences, help/keyboard.

Rules:

- Use lucide icons for buttons where available.
- Commands must expose visible feedback on execution.
- Disabled commands must explain missing prerequisites.
- Overflow is grouped by command taxonomy, not a random menu.
- Undo/redo stay visible when available.

## Toolbar Interaction Rules

- Toolbar buttons never open persistent floating panels; they open left/right panels or transient menus.
- Tool activation changes both toolbar state and right dock context when needed.
- Switching a tool should not silently close unsaved work. Prompt or preserve state when necessary.
- The active tool must be visible in toolbar and status bar.
- Keyboard shortcuts must match existing command palette behavior.

## Advanced Status Bar Goal

The bottom edge is a dense operational status bar, not a panel area. It should summarize live state and open right dock details.

## Status Bar Anatomy

Recommended ordered segments:

1. Cursor: `lng, lat`
2. Zoom/scale
3. Project/save state
4. Mode/lens
5. Layers: visible/total
6. Selection
7. AOI/draw/measure counts
8. Units
9. CRS
10. QA status
11. Review/timeline count
12. Task/background state
13. Performance/render mode
14. Sync/collaboration state
15. Basemap/provider attribution state

## Status Segment Behavior

| Segment | Click behavior |
| --- | --- |
| Cursor/zoom/scale | Opens right `Inspect` or map view detail. |
| Project/save | Opens project/save detail or left data panel. |
| Layers | Opens left `Layers` tab. |
| Selection | Opens right `Selection` or `Attributes`. |
| Draw/AOI | Opens right `Draw`. |
| Measure | Opens right `Measure`. |
| CRS | Opens right `Problems` or `QA`. |
| QA | Opens right `Problems`/`QA`. |
| Review | Opens right `Timeline`. |
| Tasks | Opens right `Tasks`. |
| Performance | Opens right `Diagnostics`/`Performance`. |
| Sync/collaboration | Opens right `Collaboration`. |

## Status Bar Visual Rules

- Height target: 28-36 px.
- Use mono typography for numeric/state-heavy labels.
- Separate segments with thin dividers.
- Long values truncate with tooltip.
- Status colors must be semantic and not color-only.
- Busy states use reduced-motion-safe indicators.
- No segment should resize the whole bar when values change.
- The status bar must remain visible when side panels are open.

## Bottom Panel Replacement Rule

The status bar may launch details but may not expand into a bottom panel. If a user clicks `Diagnostics`, the right dock opens `Diagnostics`. If a user clicks `Attributes`, the right dock opens `Attributes`. The bottom edge remains the status bar.

## Implementation Targets

Likely files:

- `MapWorkspaceShell.tsx`
- `MapToolbar.tsx`
- `MapStatusBar.tsx`
- `MapExplorerModalComposition.tsx`
- `mapDocking.ts`
- `mapTokens.ts`
- `useMapToolbarPreferencesStore.ts`
- Existing command palette services under `src/services/map/commands/`

Potential new components:

- `MapTopCommandSurface.tsx`
- `MapCommandGroup.tsx`
- `MapStatusSegment.tsx`
- `MapStatusOverflowMenu.tsx`

## Acceptance Criteria

- `UX-05` is resolved: top header and toolbar read as one designed command surface.
- Top surface is slightly taller but still dense.
- Search, project context, tool groups, and publish actions have clear hierarchy.
- Toolbar commands open left/right panels, not scattered persistent floating panels.
- `UX-06` is resolved: the bottom edge is only a rich status bar.
- Status-bar segments open the correct right or left panel details.
- Status text does not overlap or overflow at desktop, short desktop, tablet, or narrow widths.

## Tests

Unit/component:

- Toolbar groups render stable command order.
- Disabled command reason is exposed.
- Status bar segment callbacks map to correct panel open actions.
- Long labels truncate without layout shift.
- Busy indicator respects reduced-motion class if used.

E2E/visual:

- 1366x768: top command surface fits one row, status bar visible.
- 1280x620: top overflow activates without clipping.
- 390x844: command surface collapses correctly, status bar remains usable.
- Clicking status `Diagnostics` opens right dock, not bottom panel.
- Clicking draw/measure command opens right tool dock.

