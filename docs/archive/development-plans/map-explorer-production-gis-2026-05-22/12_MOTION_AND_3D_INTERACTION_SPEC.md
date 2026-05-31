# 12 - Motion And 3D Interaction Spec

Date: 2026-05-22
Status: interaction design plan
Scope: define the animation, transition, feedback, and 3D interaction rules for a professional GIS Map Explorer.

## Purpose

Motion should help the analyst understand state changes without making the workbench feel theatrical. Map Explorer needs subtle interaction feedback for professional 2D GIS tasks, Urban Analytics handoffs, and 3D block/digital twin workflows.

This spec defines the motion layer that should be reused across Map Explorer, Urban Analytics integration, and Synapse IDE-adjacent surfaces.

## Motion Principles

### 1. Motion Confirms, It Does Not Perform

Motion is used to confirm:

- Selection.
- Focus.
- Panel open/close.
- Tool readiness.
- Processing progress.
- Layer visibility changes.
- Map-to-Urban or Urban-to-Map handoff.
- 2D/3D scene transitions.
- Scenario comparison.

Motion is not used for decoration.

### 2. Fast For UI, Slower For Spatial Context

UI chrome should respond quickly. Spatial transitions need enough time for the user to understand where the camera or selection moved.

Recommended durations:

- Hover and press: 80-120ms.
- Row selection and tab underline: 120-180ms.
- Tooltip/popover reveal: 120-180ms.
- Inspector or dock transition: 160-240ms.
- Bottom panel resize affordance: 180-260ms.
- Map feature focus pulse: 240-420ms.
- Camera fly-to for 2D: 350-650ms.
- Camera orbit/fly-to for 3D: 500-900ms.
- Scenario comparison crossfade: 220-450ms.
- Processing progress updates: continuous but non-jumpy.

### 3. Respect Reduced Motion

All nonessential animation must be disabled or reduced under `prefers-reduced-motion: reduce`.

Reduced-motion alternatives:

- Instant panel state changes.
- No camera fly-to; use direct viewport jump with focus outline.
- No feature pulse; use static selection outline.
- No animated progress stripes; use numeric progress or determinate bar.
- No scenario crossfade; use immediate switch with changed-state highlight.

### 4. Motion Must Preserve Spatial Accuracy

GIS users need trust in spatial position and scale.

Do not:

- Animate geometry in ways that imply false movement.
- Animate feature positions except for legitimate temporal playback.
- Morph polygons between unrelated layers.
- Animate scale or area values without showing final exact values.

Do:

- Animate viewport movement.
- Fade layer opacity when toggling visibility.
- Highlight selected features.
- Use ghost previews for pending geometry operations.
- Animate progress of processing, loading, and timeline playback.

## Easing Tokens

Reuse existing easing concepts:

- `--rp-ease: cubic-bezier(.2, .7, .2, 1)` from Urban Analytics panel rhythm.
- `--syn-easing-bauhaus` where already defined.
- Standard ease for short UI transitions.

Recommended aliases:

- `--gis-ease-standard: cubic-bezier(.2, .7, .2, 1)`
- `--gis-ease-enter: cubic-bezier(.16, 1, .3, 1)`
- `--gis-ease-exit: cubic-bezier(.7, 0, .84, 0)`
- `--gis-ease-camera: cubic-bezier(.2, .8, .2, 1)`

Recommended duration aliases:

- `--gis-duration-fast: 100ms`
- `--gis-duration-base: 160ms`
- `--gis-duration-panel: 220ms`
- `--gis-duration-spatial: 520ms`
- `--gis-duration-spatial-slow: 760ms`

## Interaction Feedback Patterns

### Rail And Toolbar Buttons

States:

- Idle: muted icon.
- Hover: icon brightens.
- Active: icon bright plus 2px left or bottom accent.
- Disabled: muted opacity, tooltip explains why.
- Running: tiny status dot or spinner if needed.

Motion:

- Color transition 100-120ms.
- Active accent bar scale/fade 120-180ms.
- Avoid icon scale animation.

### Tree Rows And List Rows

Applicable surfaces:

- Catalog.
- Contents tree.
- Processing toolbox.
- Model step list.
- Evidence list.
- Scenario list.

Motion:

- Hover background 100-120ms.
- Left accent bar scaleY 160-180ms.
- Warning/status chip color transition 120ms.
- Expand/collapse 160-220ms when not reduced-motion.

Rules:

- Row height must not change on hover.
- Warnings cannot rely on animated icons only.
- Active row remains visually stable while the map redraws.

### Tabs

Applicable surfaces:

- Layer inspector.
- Bottom panel.
- Layout composer.
- Tool detail.
- Urban bridge panel.

Motion:

- Active underline 120-160ms.
- Content fade 120-180ms.
- No large slide transitions for dense panels.

Rules:

- Tab labels must remain readable during transition.
- Focus state must be immediate and visible.

### Menus, Popovers, And Context Menus

Motion:

- Fade/scale from 98% to 100% over 120-160ms.
- No bounce.
- No long shadows that obscure the map.

Rules:

- Context menus must feel IDE-native.
- Menus should close instantly on command execution.
- Disabled menu items must show reason in tooltip or subtext.

### Resizers And Panel Docks

Motion:

- Resizer hover color 120-150ms.
- Panel open/close 180-240ms.
- Resize preview appears quickly, no decorative motion.

Rules:

- User-driven resize should track pointer directly, not animate behind it.
- After resize ends, snap/settle can use 120ms if needed.

### Attribute Table

Motion:

- Row selection background 100-140ms.
- Sort header indicator 120ms.
- Filter chip add/remove 120-160ms.
- Loading skeleton only for real asynchronous loading, not for local instant changes.

Rules:

- Virtualized rows must not jump on selection.
- Sticky headers must remain stable.
- Table-to-map focus should coordinate with feature highlight.

### Processing Toolbox

Motion:

- Tool run progress bar updates smoothly.
- Validation states transition 120-180ms.
- Log entries can fade in 120ms.
- Cancel state changes immediately.

Rules:

- Progress must not imply precision if unknown; use indeterminate only when duration/progress are unknown.
- Blocked run button should not pulse. It should explain why.

### Urban Analytics Handoff

Events:

- Urban method requests "Prepare in Map".
- Map publishes derived layer.
- Map publishes evidence.
- Urban highlights missing prerequisites.
- Evidence becomes stale after source/style/parameters change.

Motion:

- Handoff chip appears in command bar or bridge panel over 160-220ms.
- Target layer row receives a short static/animated accent.
- Evidence publication success can show a compact status flash 180-300ms.

Rules:

- Handoff animation must not hide caveats.
- Demo/sample/environment state remains visible after success.

## Spatial Feedback Patterns

### Feature Selection

2D:

- Selected feature outline appears immediately.
- Optional focus pulse fades out over 240-420ms.
- Selection count updates in status bar.

3D:

- Selected building/block uses outline or emissive edge highlight.
- Inspector opens or updates without covering selected geometry.
- Camera recenter is optional; do not force orbit unless user requests "focus".

Reduced motion:

- No pulse.
- Static outline plus status update.

### Hover Identify

2D:

- Lightweight hover outline.
- Cursor coordinate and feature hint in status bar.
- Popup only on click or deliberate identify tool.

3D:

- Raycast hover highlight should be subtle and performant.
- Avoid heavy tooltip tracking over dense extrusions.

### Measurement And Drawing

Motion:

- Vertex handles appear immediately.
- Segment preview follows pointer directly.
- Snap indicator fades in/out 80-120ms.
- Measurement label updates without animating numeric values.

Rules:

- Do not smooth geometry in a way that hides actual vertex placement.
- Snapping must show exact target/source.

### Geometry Operation Preview

Operations:

- Buffer.
- Intersect.
- Difference.
- Union.
- Clip.
- Dissolve.
- Zoning envelope.
- Buildable area.

Motion:

- Preview layer fades in 160-240ms.
- Parameter changes debounce and update preview with a clear pending state.
- Apply action shows progress and final layer creation.

Rules:

- Preview is visually distinct from committed output.
- CRS blockers appear before preview.
- Unknown or approximate preview state is labeled.

### Temporal Playback

Applicable to:

- Time-enabled layers.
- Sun/shadow.
- Traffic/accessibility scenarios.
- Phased development/massing scenarios.

Motion:

- Timeline scrub is direct.
- Playback uses fixed ticks and visible timestamp.
- Layer transitions can use opacity crossfade 160-300ms.

Rules:

- Exact time/date must be visible.
- Playback speed must be controllable.
- Reduced motion keeps timeline step changes instant.

## 3D Interaction Model

### 3D Scene Modes

Recommended modes:

- Inspect.
- Select.
- Measure.
- Edit height.
- Compare scenarios.
- Sun/shadow.
- Section/cut plane.
- Camera bookmark.

Mode UI:

- Compact mode strip near top-left or left dock.
- Active mode uses accent bar and label.
- Dangerous modes like edit height require explicit enablement.

### Camera Controls

Controls:

- Orbit.
- Pan.
- Zoom.
- Tilt.
- Reset north.
- Reset pitch.
- Fit selected.
- Save bookmark.
- Switch 2D/3D.

Motion:

- Camera commands use 500-900ms easing unless reduced-motion.
- User drag/orbit is immediate.
- Bookmark transitions show destination label and cancel affordance.

Rules:

- Do not auto-rotate by default.
- Camera changes must not trigger accidental edits.
- Keyboard alternatives must exist for reset, fit selected, and mode switching.

### Building And Block Selection

3D selected object states:

- Hover: subtle edge or tint.
- Selected: visible outline plus inspector sync.
- Related/filtered: dim nonmatching objects.
- Blocked/QA issue: semantic marker or inspector warning, not large red overlays.

Inspector fields:

- Height source.
- Floors.
- Footprint area.
- Gross floor area.
- FAR.
- Coverage.
- Zoning rule.
- Scenario.
- Vertical CRS/terrain assumption.
- Data mode: real/demo/sample/synthetic/unknown.

### Zoning Envelope Interaction

Visual layers:

- Parcel boundary.
- Setback lines.
- Buildable area.
- Height plane.
- Envelope volume.
- Existing building.
- Proposed massing.
- Violation markers.

Motion:

- Parameter changes update envelope after debounce.
- Preview volume fades to new state, but final metrics update exactly.
- Violations appear immediately when rules fail.

Rules:

- Use projected CRS for area/offsets.
- Label vertical assumptions.
- Do not present generated massing as existing building stock.

### Massing Scenario Interaction

Scenario controls:

- Baseline.
- Proposed A/B/C.
- Difference mode.
- Split compare.
- Ghost overlay.
- Metrics table.

Motion:

- Scenario switch crossfade 220-450ms.
- Difference mode can fade nonselected scenario to lower opacity.
- Metrics values should update directly; avoid animated counting for scientific values.

Rules:

- Scenario colors must remain stable across views and reports.
- Source, rules, assumptions, and QA state must travel with every scenario.

### Sun And Shadow Interaction

Controls:

- Date.
- Time.
- Time range.
- Time step.
- Playback speed.
- Analysis surface.
- Shadow accumulation mode.

Motion:

- Timeline playback is smooth but precise.
- Shadow layer updates at fixed time steps.
- Loading/progress visible for expensive calculations.

Rules:

- Display timezone/date/time explicitly.
- Show whether result is approximate, demo, environment-dependent, or computed from real geometry.
- Do not hide calculation limitations.

### Section And View Corridor Interaction

Controls:

- Draw section line.
- Adjust plane height.
- Toggle clip.
- View corridor start/end.
- Export profile.

Motion:

- Clip plane moves directly with control.
- Preview profile updates after debounce.

Rules:

- View corridors and sections must cite CRS and elevation assumptions.

## Animation Inventory

Required named animation patterns:

- `gisFadeIn`: content reveal, 120-180ms.
- `gisPanelIn`: dock/panel open, 180-240ms.
- `gisAccentGrow`: row active bar, 160-180ms.
- `gisStatusFlash`: successful publication or update, 180-300ms.
- `gisFeaturePulse`: selected map/scene feature, 240-420ms.
- `gisProgressIndeterminate`: unknown progress only.
- `gisLayerFade`: visibility/preview layer opacity, 160-240ms.

Avoid:

- Shimmer sweeps on buttons.
- Large glowing panels.
- Infinite pulsing warnings.
- Bouncy drawer transitions.
- Scaling rail icons.
- Animated counters for scientific metrics.

## Motion Acceptance Criteria

Motion work is complete when:

- Every animated state has a reason tied to user understanding.
- Reduced motion has been tested.
- UI transitions do not resize stable controls.
- Attribute table and contents tree do not jump during hover/selection.
- 2D and 3D selection feedback is visible but not distracting.
- Camera transitions are interruptible.
- Scenario and sun/shadow transitions preserve exact metadata and visible timestamps.
- Processing progress distinguishes determinate from indeterminate work.

## Visual Test Targets

Add Playwright or equivalent screenshot coverage for:

- Map Explorer shell open at desktop.
- Map Explorer shell at narrow/tablet width.
- Catalog with healthy, missing, demo, and external sources.
- Contents tree with grouped layers and warnings.
- Attribute table with selected rows.
- Layer inspector blocked by unknown CRS.
- Processing toolbox running and blocked states.
- Urban bridge panel with ready/warning/blocked method request.
- Layout composer with QA caveats.
- 2.5D building extrusion nonblank canvas.
- 3D block scenario comparison.
- Sun/shadow timeline.
- Reduced-motion mode.

## Developer Handoff Notes

Implementation should prefer:

- CSS Modules for Map Explorer components.
- Existing Synapse/IDE CSS variables through a GIS alias layer.
- Lucide icons for controls.
- Typed state for animation modes, not ad hoc class toggles.
- `prefers-reduced-motion` blocks in every new CSS Module that introduces animation.
- Canvas-pixel checks for 3D nonblank rendering.

