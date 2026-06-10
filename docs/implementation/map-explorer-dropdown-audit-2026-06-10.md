# Map Explorer Dropdown Audit — 2026-06-10

| Component | Button label/icon | Has chevron | Has onClick | Open state storage | Menu content rendered | Content array empty | Content enters DOM | Hidden by z-index/overflow/clipping | Parent overflow / stacking issue | Pointer-events issue | Decorative chevron only |
|---|---|---:|---:|---|---|---|---|---|---|---|---|
| `MapToolbar` | `Commands` | Yes | Yes | `MapToolbar.openMenu === 'commands'` | Yes, quick actions + palette entry | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapToolbar` | `Data` group (`Import` / upload-adjacent) | Yes | Yes | `MapToolbar.openMenu === 'data'` | Yes | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapToolbar` | `Analyze` group (`Chart` / statistics-adjacent) | Yes | Yes | `MapToolbar.openMenu === 'analyze'` | Yes | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapToolbar` | `Evidence` group (`Shield` / QA-adjacent) | Yes | Yes | `MapToolbar.openMenu === 'evidence'` | Yes | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapToolbar` | `Publish` group (`Download`-adjacent) | Yes | Yes | `MapToolbar.openMenu === 'publish'` | Yes | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapToolbar` | `More` | Yes | Yes | `MapToolbar.openMenu === 'more'` | Yes, Workspace/View/Tools/Settings sections | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapBookmarkBar` | `Views` | Yes | Yes | `MapBookmarkBar.menuOpen` | Yes, save action + saved views list | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapLayerPanel` | `Basemap` selector | Yes | Yes | `MapLayerPanel.open` | Yes, basemap radio items | No | Yes, via portal | No after shared dropdown migration | No after portal migration | No | No |
| `MapSelectionTools` | `Filter` | No | Yes | `MapSelectionTools.filterOpen` | Yes, filter controls | No | Yes, via portal | No | No | No | No |
| `MapTopCommandSurface` | `Scope` chip | No | No | N/A | No | N/A | No | N/A | N/A | No | No |
| `MapTopCommandSurface` | `CRS` chip | No | Yes when warning/actionable | N/A | No dropdown; opens CRS readiness action only | N/A | No dropdown DOM | N/A | N/A | No | No |
| `ContextToolbar` | `Layers` / `Contents` / `Catalog` tabs | No | Yes | external shell/store state | No dropdown | N/A | No | N/A | N/A | No | No |
| `MapCanvasControls` | zoom / reset / measure / legend controls | No | Yes | external shell/store state | No dropdown | N/A | No | N/A | N/A | No | No |

## Root-cause summary

- Before the fix, Map Explorer mixed three interaction models: portaled `AppPopover` menus, inline absolutely positioned local menus, and controls that visually implied expansion without sharing a single trigger/content contract.
- The main broken/clipped cases were the compact basemap selector and the pre-existing command/view affordances not all using the same overlay system; this made some panels open invisibly or remain too easy to clip or style inconsistently.
- After the fix, all current chevron-bearing topbar/context toolbar controls route through a shared portaled dropdown system. Non-dropdown controls no longer present decorative chevrons.