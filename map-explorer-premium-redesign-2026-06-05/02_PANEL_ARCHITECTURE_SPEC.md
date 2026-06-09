# 02 - Panel Architecture Specification

## Problem

The current Map Explorer panel system mixes several concepts:

- Left panel content does not match resizable panel width.
- The opening/readiness modal leaks into left-panel thinking.
- A persistent bottom panel competes with the map canvas.
- Tool-specific panels can appear as scattered floating sketch/work panels.
- Some detail surfaces that belong to an inspector are spread across bottom, overlay, and floating UI.

## Required Outcome

Create a two-side professional GIS panel model:

- Left side: navigation, data organization, layer stack, source intake, catalog, connections, source health, demo data.
- Right side: inspectors, tool workspaces, problems, attributes, timeline, tasks, diagnostics, QA, workflow, report, draw, measure, selection, collaboration, performance.
- Bottom edge: advanced status bar only.
- Floating UI: only transient anchored controls.

## Layout Doctrine

| Region | Purpose | Must not contain |
| --- | --- | --- |
| Activity rail | High-level mode/tool entry. | Dense content, forms, readiness modal. |
| Left panel | Stable data/layer/source navigation and browsing. | Opening modal, diagnostics workbench, full attribute table, tool inspectors. |
| Map canvas | Primary spatial surface. | Persistent floating panels, bottom workbench overlays. |
| Right dock | Inspection, tool settings, detail, attributes, diagnostics, problems, workflows. | Source intake tables better suited to left panel. |
| Status bar | Live state summary and detail launch points. | Tall panels, tab bodies, scrollable diagnostics. |

## Left Panel Model

Recommended left tabs:

1. `Data`
2. `Layers`
3. `Catalog`
4. `Connections`
5. `Source Health`
6. `Demo Data`

Left panel rules:

- Width token range: 320-520 px by default, with content-aware variants.
- Optional wide mode: 560-640 px only for tables/source matrices.
- No content should require horizontal scrolling at default width.
- If a table cannot fit, convert to stacked rows or a property grid.
- Each tab owns one scroll container.
- Tab headers remain sticky only when they do not reduce canvas clarity.
- Empty states are short and action-oriented.
- The left panel never renders the launch modal.

### Left Panel Content Fit Rules

Every left tab must define:

```ts
interface MapLeftPanelContentContract {
  id: string;
  minComfortWidth: number;
  preferredWidth: number;
  maxUsefulWidth: number;
  overflowStrategy: "wrap" | "stack" | "table-to-list" | "horizontal-disallowed";
}
```

Acceptance:

- At 320 px: no clipped buttons, no horizontal page overflow.
- At 420 px: all primary content readable.
- At 520 px: dense content improves but does not become sparse.
- At user-expanded max width: content uses space intentionally.

## Right Dock Model

Recommended right tabs:

1. `Inspect`
2. `Attributes`
3. `Problems`
4. `Timeline`
5. `Tasks`
6. `Diagnostics`
7. `Draw`
8. `Measure`
9. `Selection`
10. `QA`
11. `Workflow`
12. `Report`
13. `Performance`
14. `Collaboration`

The exact visible list may be grouped by activity or exposed through a compact tab rail, but these surfaces must be docked rather than scattered.

Right dock rules:

- Width token range: 360-560 px.
- Wide inspector mode: up to 680 px for attributes and diagnostics if canvas remains usable.
- Only one primary right panel is active at a time.
- Secondary nested tabs are allowed inside right dock when they belong to the active domain.
- Right dock can be collapsed to icons or opened from status-bar segments.
- On narrow screens, it becomes a modal side drawer, not a persistent bottom panel.

## No Bottom Panel Rule

The following must move out of the persistent bottom panel:

| Current bottom tab | Target right dock surface |
| --- | --- |
| `problems` | Right `Problems` tab or `QA` tab depending on content |
| `attributes` | Right `Attributes` tab |
| `timeline` | Right `Timeline` tab |
| `tasks` | Right `Tasks` tab |
| `diagnostics` | Right `Diagnostics` or `Performance` tab |
| `console` if present | Right `Diagnostics` detail, only if truly required |

Implementation direction:

- Extract reusable content bodies from `MapBottomPanel` before deleting usage.
- Keep tests for content behavior, but change assertions from bottom panel to right dock.
- Remove bottom workspace layout from `MapWorkspaceShell`.
- Keep `MapStatusBar` mounted at the bottom.
- Migrate old bottom-panel state to equivalent right dock state where it is persisted; current local-only state can be replaced by the new route helper without a storage migration.

## Docking Type Recommendation

Current type:

```ts
export type MapRightDockPanel =
  | "pins"
  | "draw"
  | "measure"
  | "scientificQA"
  | "report"
  | "workflow"
  | "urbanMethod";
```

Recommended expanded type:

```ts
export type MapRightDockPanel =
  | "inspect"
  | "attributes"
  | "problems"
  | "timeline"
  | "tasks"
  | "diagnostics"
  | "pins"
  | "draw"
  | "measure"
  | "selection"
  | "scientificQA"
  | "workflow"
  | "report"
  | "performance"
  | "collaboration"
  | "urbanMethod";
```

Recommended removal:

```ts
export type MapLayerPanelPlacement = "left";
```

If compact screens need alternatives, use an overlay side drawer state rather than `"bottom"`.

## Floating Panel Consolidation

Allowed floating elements:

- Tooltip
- Context menu
- Search results
- Compact color picker
- Confirmation popover
- Coordinate readout
- Temporary measurement label anchored to geometry

Disallowed persistent floating elements:

- Drawing manager card
- Sketch summary card
- Measurement results card
- Diagnostics card
- Attribute table card
- Workflow card
- Readiness cockpit card

Tool surfaces move as follows:

| Tool surface | Target |
| --- | --- |
| Drawings/sketch list | Right `Draw` tab |
| Active draw tool settings | Top toolbar group plus right `Draw` tab |
| Feature count and selected geometry | Right `Selection` or `Inspect` tab |
| Measurement results | Right `Measure` tab |
| Annotation list/editor | Right `Draw` or `Inspect` tab |
| Performance diagnostics | Right `Diagnostics` or `Performance` tab |

## Panel Header Standard

Every left/right panel should share a header pattern:

- Icon
- Title
- Short state label
- One primary action if relevant
- Overflow menu
- Collapse/close control
- Optional search/filter row below header

Avoid:

- Repeating the application title inside panels.
- Header heights that vary wildly.
- Buttons without icons where an obvious lucide icon exists.
- Ambiguous close icons without labels/tooltips.

## Responsive Behavior

Desktop:

- Activity rail + left panel + canvas + right dock.
- Both side panels may be open if center lane remains above minimum canvas width.

Short desktop:

- Preserve status bar.
- Prefer collapsing the less relevant side panel instead of introducing a bottom panel.
- Toolbar can use overflow groups.

Tablet:

- One side panel open at a time, side drawer behavior.
- Status bar keeps critical items and moves the rest to overflow.

Narrow/mobile:

- Map canvas remains primary.
- Panels open as full-height side drawers.
- No bottom workspace drawer.

## Acceptance Criteria

- `IMG-02` no longer shows width/content mismatch in left panel tabs.
- `IMG-03` no longer shows a persistent bottom diagnostics/workbench panel.
- `IMG-04` no longer shows persistent scattered sketch panels.
- All previous bottom-tab entry points open equivalent right dock tabs.
- Status-bar clicks open the correct right dock surface.
- Left-panel resize does not clip text or controls.
- Right dock can host attributes, problems, timeline, tasks, and diagnostics without overlapping map controls.
- Existing keyboard and screen-reader navigation remains valid.

## Tests

Unit:

- `mapDocking` returns no bottom layer placement.
- Right dock accepts migrated panel IDs.
- Old bottom-panel state maps to right dock state; persisted storage migration is required only if a persisted bottom-panel key is found.
- Left panel content contracts clamp widths correctly.

Component:

- Left tabs render at 320, 420, and 520 px without horizontal overflow.
- Right dock renders problems, attributes, timeline, tasks, diagnostics.
- Draw and measure panels render in right dock.

E2E:

- Open diagnostics from status bar -> right dock opens, bottom panel remains absent.
- Open attributes from status bar -> right dock opens.
- Open draw tool -> right dock opens draw workspace, no floating sketch panel persists.
- Resize left panel -> content remains readable.
