# Prompt 16 - Map Explorer Panel Density Audit (2026-06-10)

## 1. Panel inventory

| Panel/surface | Path | Responsibility | Visible sections | Interaction density | Current risks |
|---|---|---|---|---|---|
| Shell + global layout host | src/centerpanel/components/map/MapWorkspaceShell.tsx | Modal shell, activity rail, command center shell regions, panel rails, canvas region, bottom timeline/status containment | Activity rail, top command bar host, left/right rails, center map, bottom timeline | Medium | Shell is stable, but many child surfaces compete visually when all rails are open. |
| Modal orchestration | src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx | Wires all panel routes, right-dock targets, dialogs, workflow/report/evidence/QA routes | Top command surface, toolbar slot, right-dock panel routing, map overlays, import/export/report/dialog openings | Excessive | Central orchestrator has high coupling; visual hierarchy can flatten when many routes are active. |
| Header metadata + modal controls | src/centerpanel/components/map/MapTopCommandSurface.tsx | Project, mode, scope, CRS, active layer, modal controls cluster | Identity chips, search slot, context chips, command slot, utility + modal controls | High | Chip count and long labels can crowd compact widths if not progressively collapsed. |
| Command center + command palette | src/centerpanel/components/map/MapToolbar.tsx | Visible command groups, overflow, command taxonomy, palette reachability | Data/analyze/evidence/publish groups, overflow, palette, task lens/recovery actions | High | Rich command catalog risks peer-level action overload without strict grouping. |
| Left panel layer stack and row actions | src/centerpanel/components/map/MapLayerManager.tsx | Layer list, source metadata, QA badges, action menu, inspect/table/export/report hooks | Group headers, row-level controls, scientific badges, action menus | Excessive | Layer rows carry dense metadata + actions; scan burden is high under large layer counts. |
| Right dock shell and tab rail | src/centerpanel/components/map/MapRightDockHost.tsx | Hosts mutually exclusive right-side panel routes and tab switching | Header, options popover, tab rail, active panel body | Medium | Shell is disciplined, but tab proliferation can dilute primary task focus. |
| Inspector/properties | src/centerpanel/components/map/MapLayerInspector.tsx | Layer metadata, provenance, CRS/QA details, inspect tabs | Layer summary, CRS tab, QA/provenance/detail tabs | High | Detail-heavy surfaces can appear debug-like when summaries are not dominant. |
| Attribute + join workflow | src/centerpanel/components/map/table/MapAttributeWorkflowPanel.tsx | Attribute table, field calculator, join/previews, derived field provenance | Layer selector, table region, workflow details pane, calculator/join previews | High | Multi-tool panel can feel overloaded in narrow/right-dock contexts. |
| Problems/QA panel | src/centerpanel/components/map/problems/MapProblemsPanel.tsx | Consolidated operational problems and remediation cues | Severity/status rows, issue cards, action links | Medium | Good structure, but can escalate badge noise when combined with status chips elsewhere. |
| Scientific QA panel | src/centerpanel/components/map/ScientificQAPanel.tsx | Scientific validity checks and readiness caveats | Status band, categories, issue list, badges, action routes | Excessive | High semantic density; category + issue + badge layers can overwhelm first scan. |
| Diagnostics/performance | src/centerpanel/components/map/MapPerformanceDiagnosticsPanel.tsx | Render/perf telemetry, warnings, worker diagnostics | KPI summary, warning band, layer metrics, telemetry lists | High | Deep telemetry detail appears immediately; needs stronger summary-first framing. |
| Workflow panel | src/centerpanel/components/map/MapWorkflowDrawer.tsx | AOI/buffer/intersect/compare flow config + preview/apply | Stepper, parameter sections, preview, apply/report | High | Step-rich form plus dense metadata can crowd compact viewports. |
| Report/publish handoff | src/centerpanel/components/map/MapReportHandoffDrawer.tsx | Report package preparation, readiness and export metadata | Header, options bar, snapshot controls, readiness panel, action footer | High | Multiple options and readiness cues compete with primary publish action. |
| Review/collaboration timeline | src/centerpanel/components/map/MapReviewTimelinePanel.tsx | Event timeline, comments, collaboration and export audit views | Filters, tabs, timeline rows, comments/collab/export | High | Four-mode workspace in one panel can create navigation and information overload. |
| NL query workspace | src/centerpanel/components/map/MapNLQueryPanel.tsx | Query drafting, preview decisioning, run summaries | Query input, scope/mode toggles, context cards, SQL/review blocks, decision actions | High | Many peer controls and cards compete before clear primary run decision. |
| Urban method compatibility rail | src/centerpanel/components/map/MapUrbanMethodCompatibilityRail.tsx | Urban->Map method requirements and compatibility checks | Status, requirements, compatible-layer cards, workflow preview action | Medium | Dense requirement text can read as wall-of-text without progressive disclosure. |
| Canvas controls and furniture | src/centerpanel/components/map/MapCanvasControls.tsx | View/reset/fit/select/draw/measure/furniture quick actions | Viewport controls, tool controls, basemap/furniture toggles | Medium | Icon-only density is controlled but still competes with right-dock overlays. |
| Selection tools dock | src/centerpanel/components/map/MapSelectionTools.tsx | Selection-specific actions and quick transitions | Select modes, clear/apply actions | Medium | Can overlap conceptual ownership with layer/inspector actions if not contextual. |
| Import/export dialogs | src/centerpanel/components/MapDataImportHubDialog.tsx, src/centerpanel/components/MapCsvImportDialog.tsx, src/centerpanel/components/MapColumnarImportDialog.tsx, src/centerpanel/components/MapDataExportDialog.tsx, src/centerpanel/components/MapExportDialog.tsx | Source ingest and publication packaging flows | Preflight, schema mapping/preview, export options, confirm actions | High | Dialogs are feature-complete but option-dense; primary CTA needs stronger separation. |
| Status/log surfaces | src/centerpanel/components/map/MapStatusBar.tsx, src/centerpanel/components/map/MapBottomTimeline.tsx | Live operational state and route shortcuts | View/data/runtime segment strips + overflow | Medium | Segment count is high; non-critical values can still feel noisy in constrained widths. |

## 2. Density rating

- Low
  - None in current canonical panel set.
- Medium
  - MapWorkspaceShell
  - MapRightDockHost
  - MapUrbanMethodCompatibilityRail
  - MapCanvasControls
  - MapSelectionTools
  - MapStatusBar/MapBottomTimeline
- High
  - MapTopCommandSurface
  - MapToolbar
  - MapLayerInspector
  - MapAttributeWorkflowPanel
  - MapPerformanceDiagnosticsPanel
  - MapWorkflowDrawer
  - MapReportHandoffDrawer
  - MapReviewTimelinePanel
  - MapNLQueryPanel
  - Import/export dialogs
- Excessive
  - MapExplorerModalComposition orchestration surface (route and state density)
  - MapLayerManager row/action surface
  - ScientificQAPanel

## 3. Production readability issues

- Weak grouping
  - Layer-row metadata, QA badges, and actions are visually peer-level in MapLayerManager.
  - ScientificQAPanel combines categories, badges, and issue actions at similar visual weight.
- Too many peer actions
  - Command center and panel-level action clusters expose many adjacent controls before context narrowing.
- Long unstructured text
  - Requirements/provenance and diagnostics copy blocks can appear as dense paragraphs.
- Overuse of chips/badges
  - CRS/QA/status chips across header, status bar, and panel rows can duplicate signals.
- Hard-to-scan labels
  - Long layer/project labels and capability phrases require consistent truncation+tooltip fallback.
- Unclear primary actions
  - In report/workflow/NL query panels, primary actions can visually compete with secondary toggles.
- Debug-like details
  - Diagnostics and review metadata can surface raw detail too early in panel hierarchy.
- Scientific details without hierarchy
  - Scientific caveats are correct but require summary-first framing to avoid cognitive overload.

## 4. Proposed hierarchy (panel-by-panel pattern)

Use this hierarchy contract for each Phase 3 panel implementation:

- Summary content
  - One compact status row with the most critical state (readiness/blocker/active context).
- Primary action
  - Exactly one primary CTA per panel mode (e.g., Run, Apply, Publish, Inspect, Resolve).
- Secondary actions
  - Grouped in a compact row or overflow menu, visually subordinate to primary CTA.
- Collapsible details
  - Category breakdowns, caveats, and provenance blocks behind expandable sections.
- Advanced/raw data
  - Debug-style telemetry, schema internals, and low-frequency controls at bottom accordion/advanced section.

Panel-specific emphasis:

- Left layer panel
  - Summary: layer name + readiness + visibility
  - Primary: Inspect or open table
  - Secondary: style/export/report/repair in grouped menu
  - Details: CRS/provenance/field counts collapsible
- Right dock panels (QA/workflow/report/review/diagnostics)
  - Summary: panel-specific health/state header
  - Primary: one workflow action (resolve/run/publish/accept)
  - Secondary: filters and toggles
  - Details: verbose metadata/log rows collapsed by default
- Status bar
  - Summary: keep critical CRS/QA visible
  - Secondary: move non-critical runtime info to overflow earlier
  - Details: panel route opens for full context

## 5. Implementation order (safest Phase 3 sequence)

1. Left panel shell grouping and layer-row hierarchy first
   - Targets the highest visible density hotspot without changing GIS semantics.
2. Right-dock shell consistency and per-panel summary headers
   - Establishes shared hierarchy pattern before deeper panel edits.
3. Scientific QA and diagnostics summary-first refactor
   - Highest semantic density; keep all caveats but collapse raw detail.
4. Workflow/report/NL query action hierarchy pass
   - Clarifies primary CTA and reduces option clutter.
5. Status bar noise trimming and overflow tuning
   - Preserve critical CRS/QA visibility while reducing routine metadata competition.
6. Final cross-panel scan for duplicated signals (CRS/QA/project/layer)
   - Remove repeated routine signals from high-salience zones, keep warnings prominent.

## Notes

- This prompt intentionally makes no functional/code changes.
- Scientific/GIS/CRS/QA/evidence/export/publish semantics are preserved; this is a structure and readability audit input for Prompt 17+.
