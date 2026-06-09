# Prompt 03 - Map test contracts and stable selectors (2026-06-09)

## 1. Existing test list

| File path | Test purpose | Critical selectors | Risk level if layout changes |
|---|---|---|---|
| e2e/map-modal-layout.spec.ts | Core Map Explorer modal contract: open/close, activity rails, sidebars, dock, bottom panel, overlap checks, CRS and workflow behaviors | data-map-explorer-shell, map-canvas-region, map-activity-rail, map-workbench-sidebar-tab-*, map-inspector-host, map-bottom-panel, map-command-center, map-canvas-viewport-controls, map-canvas-furniture-controls, map-review-timeline-event | High |
| e2e/map-premium-redesign-baseline.spec.ts | Visual baseline contracts for cockpit, left panel fit, diagnostics workspace | map-command-center, map-canvas-region, map-layer-panel-rail, map-performance-diagnostics, role=status name=Map status | High |
| e2e/map-explorer-stability.spec.ts | Repeated open/close + viewport churn; ensures modal survives state pressure | role=dialog name=Map Explorer, activity-btn-*, map-right-dock-host, map-workflow-drawer, role=application interactive map | High |
| e2e/accessibility-audit.spec.ts | Keyboard and accessibility contracts for Map Explorer shell and dialogs | role=dialog name=Map Explorer, link Skip to interactive map canvas, role=application interactive map canvas, map-right-dock-host, map-toolbar-command-command-palette | High |
| e2e/map-columnar-io.spec.ts | Arrow/GeoParquet import and export behavior | activity-btn-data, catalog-browse-source, role=dialog name=Spatial data import hub, role=dialog name=Arrow schema preview, role=dialog name=GeoParquet schema preview, map-publish-workspace | High |
| e2e/map-csv-kml-gpx-import.spec.ts | CSV mapping + KML/GPX preflight import contracts | catalog-browse-source, role=dialog name=CSV coordinate mapping, role=dialog name=Import source preflight, role=list name=Layer list | High |
| e2e/map-performance-diagnostics.spec.ts | Bounded preview banner + diagnostics surface behavior | map-performance-bounded-banner, map-performance-diagnostics, role=menu name=Advanced commands | Medium |
| e2e/map-evidence-publication.spec.ts | Evidence publication and stale/superseding artifact lifecycle | ua-evidence-* classes, role=button name=Publish, evidence row text markers | Medium |
| e2e/map-contents.spec.ts | Contents tree grouping and ordering behavior | activity-btn-layers, map-workbench-sidebar-tab-layers-contents, map-contents-tree, contents-* test ids | Medium |
| e2e/map-command-palette-p53.spec.ts | Command palette discovery and command execution contract | role=dialog name=Map command palette, map-command-palette-option-*, map-toolbar-command-* | Medium |
| src/centerpanel/components/__tests__/MapExplorerModal.dispatch.test.tsx | Dispatch-level modal wiring and canonical shell primitives | data-map-explorer-shell, map-activity-rail, map-canvas-region | High |
| src/centerpanel/components/map/__tests__/MapWorkbenchSidebar.test.tsx | Sidebar tab contracts and close/collapse behavior | map-workbench-sidebar, map-workbench-sidebar-tab-*, map-workbench-sidebar-close, map-workbench-sidebar-collapse | High |
| src/centerpanel/components/map/__tests__/MapTopCommandSurface.test.tsx | Top command/header semantic contract | map-top-command-surface, map-command-center-title, map-top-command-surface-project, map-top-command-surface-crs | Medium |
| src/centerpanel/components/map/__tests__/MapRightDockHost.test.tsx | Right dock presence and panel routing contract | map-right-dock-host, data-map-right-dock-panel | High |
| src/centerpanel/components/map/__tests__/MapBottomPanel.test.tsx | Bottom panel active tab/task rendering contract | map-bottom-panel, map-bottom-panel-tasks, map-bottom-tab-* | High |
| src/centerpanel/components/map/__tests__/layer-inspector.test.tsx | Inspector host and tabbed layer details contracts | map-inspector-host, map-layer-inspector, map-layer-inspector-tab-*, map-layer-inspector-panel-* | High |
| src/centerpanel/components/map/__tests__/map-accessibility.test.ts | Hook-level and keyboard a11y behavior | map-bottom-panel references, role and focus semantics for map keyboard controls | High |
| src/centerpanel/components/map/controllers/__tests__/useMapPanelLayout.test.tsx | Panel layout state and placement contracts | layer panel placement, right dock routing, compact dock behavior | Medium |

Fragile hotspots currently observed in e2e:
- Exact visible text selectors for major actions, for example Open Map Explorer (Ctrl+Shift+M), Open QA Problems, Spatial data import hub.
- Role option name matching for command palette entries where command labels are long and copy-sensitive.
- Layer row selection using dynamic layer names in listitem labels.

## 2. Stable selector map

Recommended stable selectors to keep and use first:

- Modal shell: data-map-explorer-shell=true
- Modal header: map-top-command-surface and map-command-center-title
- Close button: currently aria-label=Close map explorer (Escape); add map-modal-close
- Dock or expand or minimize controls: use explicit map-right-dock-host and add map-right-dock-close, map-right-dock-collapse, map-modal-dock-toggle aliases
- Top command surface: map-command-center, map-command-center-primary-action, map-command-center-overflow
- Map canvas: map-canvas-region and role=application name includes Interactive map canvas
- Left panel: map-layer-panel-rail and map-workbench-sidebar
- Right dock: map-right-dock-host plus routed body test ids map-right-dock-*-body
- Bottom panel or status bar: map-bottom-panel, map-bottom-timeline, role=status name=Map status
- Floating controls: map-canvas-viewport-controls, map-canvas-furniture-controls, map-active-tool-indicator, map-selection-tools
- Layer rows: map-layer-actions-summary, map-layer-inspect-trigger, map-layer-table-trigger, map-declare-crs-trigger
- Inspector panel: map-inspector-host, map-layer-inspector, map-layer-inspector-tab-*, map-layer-inspector-panel-*
- Evidence panel: keep ua-evidence tray selectors; add map-evidence-panel-root alias when evidence is rendered in map route
- Diagnostics panel: map-performance-diagnostics, map-performance-bounded-banner, map-performance-warnings
- Import or export dialog: role=dialog names plus map-import-dialog-root and map-export-dialog-root aliases
- Publish or report surface: map-publish-workspace, map-report-handoff-panel, map-layout-designer
- QA or CRS warnings: map-workflow-crs-blocked-card, map-declare-crs-caveat, role=region name=Map QA problems

## 3. Selector migration rules

1. Preserve existing selectors and role contracts as primary compatibility surface.
2. Add alias selectors before replacing old selectors.
3. Keep old and new selectors in parallel for at least one prompt cycle.
4. Update tests in the same PR when adding selector aliases.
5. Prefer test id or role plus accessible name over visible paragraph text.
6. Do not use nth-child selectors for map shell regions.
7. For dynamic layer names, use stable trigger selectors inside the row instead of full row text.
8. If a command label can change, keep a stable command id selector map-command-palette-option-<id>.

## 4. Test gap list

- Layout gap:
  - Missing explicit selector contract for modal header chrome container and close control test id alias.
- Collision gap:
  - Overlap checks exist in map-modal-layout but no dedicated assertion for command center versus right dock collisions at all breakpoints.
- Keyboard gap:
  - Scoped Escape and roving focus are partially covered; no dedicated e2e matrix asserting return-focus targets for every docked dialog.
- Responsive gap:
  - Several viewport checks exist, but tablet portrait plus right dock plus bottom panel coexistence is not consistently asserted in one canonical test.
- Dialog containment gap:
  - Import and export dialogs are tested; no unified containment rule that all dialogs remain inside modal safe area at short heights.
- QA or evidence semantic gap:
  - QA and evidence are tested in separate files; no single cross-flow contract proving QA warning to evidence publication traceability in one scenario.

## 5. Recommendation

- Add missing selectors in Phase 1: Yes, safe and recommended.
- Safe additions to do first:
  1. Add map-modal-close to the close control while keeping aria-label contract unchanged.
  2. Add map-modal-header-root on top command surface wrapper.
  3. Add map-status-bar-root on Map status container while preserving role=status name=Map status.
  4. Add map-right-dock-close and map-right-dock-collapse aliases to explicit dock controls.
  5. Add map-import-dialog-root and map-export-dialog-root aliases on top-level dialogs used by import/export flows.
  6. Add map-layer-row-<id> optional row container test id alias for resilient layer-row actions.

Execution note:
- This prompt was analysis-only; no product code changed.
