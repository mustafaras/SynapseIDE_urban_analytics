# 06 - Validation And Release Gates

Date: 2026-05-22

## Definition Of Done

A Map Explorer production GIS milestone is done only when:

- Behavior is implemented through typed stores/services, not ad hoc component-only state.
- User-facing UI exists for the capability.
- Empty, disabled, warning, and error states name the exact missing prerequisite.
- CRS, provenance, runtime mode, QA, and evidence status are preserved.
- High-impact actions are previewable and auditable.
- Heavy computation is workerized or bounded.
- Tests cover normal, missing-data, blocked, and failure paths.
- Urban Analytics handoffs are contract-tested if touched.
- Premium GIS design, motion, and visual QA gates pass if UI chrome, panels, tables, 3D controls, or evidence styling are touched.
- Documentation states residual limitations truthfully.

## Automated Gates

Run after changes to Map Explorer or Urban Analytics integration:

```bash
npm run typecheck
npm run lint:errors
npm run test:analytics
```

Run after broad Map Explorer changes:

```bash
npm run test
npm run build
```

Run before release-candidate claims:

```bash
npm run validate:rc
```

Targeted Playwright suites should be run for changed surfaces:

- Map modal open/close and layout.
- Layer manager and inspector.
- Import/export.
- Columnar/large data.
- Spatial workflows.
- Scientific QA panel.
- Urban method request handoff.
- Map evidence publication.
- Report handoff.
- Temporal playback.
- VoxCity and 3D handoffs.
- Premium workbench shell, catalog, contents, inspector, table, toolbox, Urban bridge, layout composer, and 3D scene visual states.
- Reduced-motion states for any animated surfaces.
- Accessibility.

## Contract Gates

### Map To Urban

- Empty map context blocks with actionable reason.
- Visible layer with unknown CRS remains unknown in Urban data fitness.
- Demo/synthetic/sample layer remains labeled through evidence/report/dashboard.
- AOI summary includes ID, bbox, geometry family, validation status, and caveats.
- Selection summary includes counts only unless explicit source handle is requested.
- QA blockers are visible and affect readiness.

### Urban To Map

- Method request with missing layer blocks with reason.
- Method request requiring polygon blocks point-only layers.
- Method request requiring CRS blocks missing/wrong CRS.
- Method request requiring AOI prompts user to draw/select one.
- Preview does not mutate layer state.
- Apply creates reproducibility manifest and review timeline entry.
- Published map output links layer ID, run ID, manifest ID, and evidence artifact ID.

## CRS Gates

Every measurement or spatial operation must answer:

- What is the source CRS?
- What is the display CRS?
- What is the execution CRS?
- Is the operation geodesic or planar?
- If planar, is the CRS projected and suitable?
- If CRS is missing, is the operation blocked or explicitly caveated?

Blocked by default:

- Planar area/distance in EPSG:4326.
- Buffer/intersection/difference/union requiring metric correctness when CRS is unknown.
- Urban method execution where layer CRS conflicts with method `requiredCrs`.

Allowed with caveat:

- Geodesic measurement over WGS84 display coordinates.
- Visual-only preview where no metric claims are made.
- External service layer with declared CRS but no local raw geometry, if report/export labels limitations.

## Evidence Gates

Before an output becomes Urban evidence:

- `contextId` exists.
- `artifactId` is stable.
- Source module is explicit.
- Runtime mode is recorded.
- Layer/source/run/manifest references are recorded.
- QA state is recorded.
- CRS state is recorded.
- Demo/synthetic/sample status is recorded.
- Limitations are not empty when metadata is unknown or environment-dependent.

Evidence must not be silently mutated. If state changes:

- Create a superseding artifact, or
- Mark stale/blocked/warning through QA state, or
- Link a new run/manifest.

## UX Gates

All production UI must satisfy:

- The primary map canvas keeps usable space on desktop and mobile.
- Toolbars collapse without hiding required commands.
- Side rails and drawers are keyboard reachable.
- Every icon button has accessible name and tooltip/title.
- Focus is trapped in modal mode and restored on close.
- Reduced motion disables unnecessary animation.
- Text fits in compact panels and buttons.
- No decorative hero or marketing layout appears inside the tool surface.
- No "coming soon" or vague placeholder text is used for production capabilities.
- Thin professional separators, compact density, and restrained accents are used instead of decorative card nesting or large glow effects.
- Urban Analytics evidence states remain visible in Map Explorer rows, inspectors, reports, and exports.

## Design And Motion Gates

All production UI must satisfy the design system in `11_PREMIUM_VSCODE_GIS_DESIGN_SYSTEM.md`, the motion spec in `12_MOTION_AND_3D_INTERACTION_SPEC.md`, and the implementation blueprint in `13_DESIGN_IMPLEMENTATION_BLUEPRINT.md`.

Required checks:

- Map Explorer shell uses a professional VS Code-style workbench layout: activity rail, top command bar, docks, center canvas, bottom panel, and status bar.
- Map/scene canvas remains the dominant surface and is not hidden by oversized panels.
- Activity rail active state uses a thin accent indicator, not a large filled button.
- Catalog, contents tree, layer inspector, attribute table, processing toolbox, layout composer, Urban bridge, and 3D panels share one visual language.
- Icon-only controls have labels and tooltips.
- Hover/focus/selection states do not resize rows, buttons, tabs, or table cells.
- All animations have `prefers-reduced-motion` fallbacks.
- 3D controls do not obscure selected buildings, blocks, parcels, or scenario geometry.
- 2D and 3D canvases pass nonblank rendering checks where automated screenshots are available.
- Long layer names, CRS labels, source names, field names, method names, and warning text do not overlap neighboring UI.
- Demo/sample/synthetic, unknown, stale, environment-dependent, blocked, caveat, running, and ready states are visible before publish/export/analysis actions.

## Performance Budgets

Initial target budgets:

| Area | Budget |
| --- | --- |
| Map modal open with no heavy layers | Under 1.5s on typical laptop dev build. |
| Pan/zoom interaction | No persistent main-thread stalls above 100ms from app code. |
| Source profiling sample | Bounded sample size with visible progress. |
| Worker transfer | Progress state for transfers above 50 MB. |
| Layer stack | Usable with at least 50 metadata-only layers. |
| Feature selection | Responsive for visible/queryable layer sample; large table virtualized. |
| Export | Shows progress and failure recovery for PDF/PNG/data package. |

Budgets should be tightened after baseline measurement.

## Manual QA Checklist

### Baseline Map

- Open and close Map Explorer repeatedly.
- Switch basemaps.
- Pan/zoom/rotate/pitch and confirm viewport persists.
- Use keyboard navigation.
- Confirm focus trap and Escape behavior.

### Data And Layers

- Import small GeoJSON.
- Import CSV point data.
- Import or mock columnar data.
- Add external service layer and test failure state.
- Toggle visibility, reorder, change opacity.
- Inspect source/provenance/schema/CRS.

### CRS And QA

- Load a layer with known CRS.
- Load a layer with missing CRS.
- Try metric operation on missing/geographic CRS.
- Run scientific QA.
- Confirm blockers and caveats appear in layer manager, QA panel, Urban context, report handoff.

### Urban Integration

- Open Urban method requiring map layer.
- Send method request to Map.
- Focus compatible layer.
- Draw/select AOI.
- Preview workflow.
- Apply workflow.
- Publish output to Urban evidence tray.
- Open evidence from tray back into Map.

### Reporting

- Add map view to report.
- Add feature popup to report.
- Add analysis layer to report.
- Export figure/package.
- Confirm legend, scale, CRS, attribution, QA caveats, runtime mode, and source list.

### Failure Modes

- Broken external URL.
- Missing source on project restore.
- Worker failure.
- Malformed GeoJSON.
- Large file over budget.
- Unknown CRS.
- Demo/synthetic source.

## Release Readiness Scorecard

| Area | Required For RC |
| --- | --- |
| Monolith risk reduced | Yes |
| Source registry | Yes |
| CRS preflight | Yes |
| Unified Map/Urban bridge | Yes |
| Layer inspector | Yes |
| QA command gates | Yes |
| Report/export metadata | Yes |
| Accessibility smoke | Yes |
| Premium design and motion gate | Yes |
| Large-data truthful limits | Yes |
| External-service limitations | Yes |
| Known risks doc | Yes |

## Documentation Gates

Before claiming production-grade GIS:

- Update architecture docs.
- Update user workflow guide.
- Update known risks and limitations.
- Add source format support matrix.
- Add CRS/QA method note.
- Add Map/Urban bridge contract note.
- Add or update GIS design system, motion, and visual QA notes when UI surfaces change.
- Add validation summary with exact commands and dates.
