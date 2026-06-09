# SynapseIDE Urban Analytics — Map Explorer Modal Production UI/UX Audit & Implementation Plan

**Repository:** `SynapseIDE_urban_analytics`  
**Prepared for:** SynapseIDE Urban Analytics Workspace  
**Date:** 2026-06-09  
**Status:** Audit + implementation planning only  
**Code changes:** Not performed  
**Recommended workflow:** Local branch + structured commits, no direct commit to `main` / `master`

---

## 0. How another GPT / developer should use this document

This document is written so that a GPT coding assistant or developer can continue the work without needing to infer missing intent from chat history.

The goal is **not** to redesign the Map Explorer from scratch. The goal is to make the existing Map Explorer modal feel production-grade, professional, technical, and VS Code-like while preserving its GIS, CRS, QA, evidence, analysis, import/export, diagnostics, and publishing semantics.

### Non-negotiable constraints

Any implementation based on this document must follow these constraints:

1. **Treat the local repository as the source of truth.**
2. **Read `.ai-workspace/` context before changing code**, especially:
   - `.ai-workspace/PROJECT_CONTEXT.md`
   - `.ai-workspace/WORKFLOW.md`
   - `.ai-workspace/DECISIONS.md`
   - `.ai-workspace/ARCHITECTURE.md`
   - `.ai-workspace/CUSTOM_GPT_SETUP.md`, if available
3. **Do not commit directly to `main` or `master`.**
4. **Use focused feature/fix/UI branches.**
5. **Preserve existing functionality.**
6. **Do not delete scientific/GIS/CRS/QA/evidence/export semantics to make the UI look cleaner.**
7. **Reduce complexity through hierarchy, grouping, progressive disclosure, spacing, layout discipline, and interaction design.**
8. **Avoid unnecessary dependencies.**
9. **Prefer TypeScript-safe, modular, reversible changes.**
10. **Use local preview server visual inspection when available.**
11. **Do not treat archived plans as active instructions unless the repository explicitly indicates they are current.**
12. **Keep UI restrained: professional, IDE-like, technical, not flashy.**

---

## 1. Executive summary

### 1.1 Overall production readiness assessment

The Map Explorer modal appears to be functionally mature and covered by several release-readiness artifacts and tests, but from a production UI/UX perspective it should still be treated as needing a dedicated stabilization pass.

The current interface likely contains many powerful GIS and analysis capabilities, but the modal risks feeling crowded, high-density, and demo-like rather than calm, professional, and production-grade.

The most important issue is not missing functionality. The issue is **too much functionality competing at the same visual priority level**.

### 1.2 Production-grade verdict

**Current verdict:** Not fully production-grade from a UI/UX standpoint.

**Reason:** The modal appears to have a strong technical foundation, but the audit identifies risks around:

- Crowded command/header surfaces
- Too many visible tool groups
- Right panel / dock overload
- Dense status and diagnostics surfaces
- Small icon-only controls
- Possible floating-control collisions
- Possible short-height viewport clipping
- Z-index/elevation inconsistencies
- Overuse of peer-level panels and badges
- Insufficient progressive disclosure for advanced scientific/evidence/diagnostic content

### 1.3 Main UI/UX risks

The largest risks are:

1. **Visual hierarchy risk**  
   The user may not immediately understand what is primary, secondary, or advanced.

2. **Command overload risk**  
   Too many actions may be visible in the header, toolbar, command surface, or floating controls.

3. **Panel density risk**  
   Left, right, and bottom panels may show too many controls, metadata blocks, or tabs at once.

4. **Map usability risk**  
   The central map canvas may become visually secondary when all panels, controls, legends, status bars, and overlays are active.

5. **Responsive risk**  
   On tablet or short-height desktop screens, important modal content may become clipped, squeezed, or hard to use.

6. **Accessibility risk**  
   Small targets, icon-only actions, complex tab order, dense panels, and popovers can create keyboard and screen-reader friction.

7. **Production perception risk**  
   Diagnostics, QA, evidence, provider, and performance surfaces may look like developer/debug UI if not grouped carefully.

---

## 2. Repository inspection summary

> Note: This section should be re-verified by the implementation GPT/developer directly in the repository before code changes.

### 2.1 Likely Map Explorer related areas

Search and inspect the repository for these terms:

```txt
MapExplorerModal
MapExplorerModalComposition
MapWorkspaceShell
MapTopCommandSurface
MapCanvas
MapCanvasControls
MapToolbar
MapLayerPanel
MapRightDockHost
MapStatusBar
ScientificQAPanel
MapPerformanceDiagnosticsPanel
MapLegend
MapControls
LayerManager
import export publish evidence diagnostics QA CRS legend
```

### 2.2 Important likely component areas

Likely relevant source paths include:

```txt
src/centerpanel/components/MapExplorerModal.tsx
src/centerpanel/components/MapExplorerModalComposition.tsx
src/centerpanel/components/map/
src/components/map/
src/centerpanel/components/map/design/
src/centerpanel/components/map/hooks/
src/centerpanel/components/map/tests/
tests/
e2e/
docs/release/
```

### 2.3 Key architectural assumption

The canonical Map Explorer implementation appears to live under:

```txt
src/centerpanel/components/
src/centerpanel/components/map/
```

Older or shared map components may also exist under:

```txt
src/components/map/
```

Before editing, confirm whether legacy components are still rendered in the Map Explorer modal route or only used elsewhere.

### 2.4 Repository contracts that must not be broken

Implementation should preserve:

- Existing imports/exports unless intentionally refactored
- Modal open/close behavior
- Layer visibility/order/opacity behavior
- Map viewport and selection state
- CRS indicators and warnings
- QA and scientific validation semantics
- Evidence and report surfaces
- Import/export/publish flows
- Diagnostics and performance information
- Existing test IDs used by e2e tests
- Keyboard and accessibility tests
- local preview server deployment compatibility

---

## 3. local preview server visual inspection requirements

A live visual inspection must be performed before production signoff.

### 3.1 Minimum live inspection states

Open the deployed local preview server app and inspect at least the following states:

1. Default workspace before opening Map Explorer
2. Map Explorer modal open
3. Left layer panel open
4. Right inspector panel open
5. Bottom panel open
6. Command bar expanded or overflow menu open
7. Layer import flow open
8. Export/publish dialog open
9. QA/evidence/scientific panel open
10. Diagnostics/logs/performance panel open
11. Popover/dropdown open near top bar
12. Tooltip over toolbar action
13. Modal with dense layer list
14. Modal with no data / empty state
15. Modal loading state
16. Modal error state
17. Disabled action state
18. Short-height viewport state
19. Tablet landscape state
20. Tablet portrait state

### 3.2 Visual inspection questions

For every state, answer:

- Does the modal fit within the viewport?
- Is the close button always visible?
- Are modal controls always in the same place?
- Does any button overlap another button?
- Do floating controls overlap panels?
- Do popovers cover the thing the user needs to click next?
- Does the bottom panel cover important map controls?
- Does the right panel obscure the central workflow?
- Is the main map still usable?
- Are critical CRS/QA warnings visible?
- Does the interface look professional and production-ready?
- Does it match a refined VS Code-like workspace direction?
- Does any debug-like surface appear exposed as final UI?
- Does any feature look clickable but fail to respond?
- Does keyboard focus remain visible?
- Is tab order predictable?
- Can the user escape popovers/dialogs safely?

---

## 4. Visual hierarchy diagnosis

### 4.1 Root problem

The Map Explorer modal likely suffers from **priority flattening**.

Priority flattening means that too many surfaces appear equally important:

- Modal title area
- Command bar
- Toolbar
- Floating controls
- Left panel
- Right inspector
- Bottom panel
- Status bar
- QA badges
- CRS badges
- Diagnostics badges
- Export/publish actions
- Evidence controls
- Map canvas controls

When too many areas compete for attention, users cannot quickly answer:

- What am I looking at?
- What is the current map state?
- What is the main next action?
- What is warning me?
- What is optional/advanced?
- Where should I go to inspect, analyze, export, or fix problems?

### 4.2 Desired hierarchy

The desired hierarchy should be:

1. **Map canvas**
   - The central working surface.
   - Must remain visually dominant.

2. **Primary modal shell**
   - Title, close/dock/expand controls, global context.

3. **Primary command groups**
   - View
   - Data
   - Analyze
   - QA/Evidence
   - Export

4. **Left panel**
   - Data/layers/sources organization.

5. **Right panel**
   - Inspector/details/problems/QA/report workflows.

6. **Bottom panel/status**
   - Timeline, logs, diagnostics, runtime state.

7. **Floating controls**
   - Map-local tools such as zoom, draw, measure, legend, scale.

8. **Advanced surfaces**
   - Raw logs, raw evidence, performance diagnostics, provider internals.

### 4.3 Main hierarchy problems to look for

Audit the UI for these symptoms:

- Multiple command bars visible at once
- Too many icon-only actions in top chrome
- Too many tabs in the right dock
- Status bar with too many chips/badges
- CRS/QA/provider/performance badges all competing visually
- Dense metadata visible before summary
- Scientific evidence displayed without summary/caveat hierarchy
- Floating map controls placed near global controls
- Export/publish CTAs competing with analysis CTAs
- Warnings mixed with routine informational metadata
- Panel headers that do not clearly explain the panel’s purpose

---

## 5. Layout and collision audit

### 5.1 Collision risk model

The Map Explorer modal has several independent spatial systems:

- Modal shell
- Header / command bar
- Left sidebar
- Right dock
- Bottom panel
- Status bar
- Central map canvas
- Floating map controls
- Popovers and dropdowns
- Tooltips
- Dialogs
- Map popups
- Legends and scale controls
- Toasts or alerts

These systems need shared layout tokens and safe insets. If each component positions itself independently, collision problems become likely.

### 5.2 Specific collision risks

#### Risk A — Top command bar vs modal controls

**Severity:** High  
**Likely affected components:**

```txt
MapWorkspaceShell
MapTopCommandSurface
MapCanvasControls
MapToolbar
```

**Problem:**  
If title, search, CRS, project, active layer, commands, close/dock/expand controls, and global action buttons all live in the same top area, the header can become overcrowded.

**Symptoms to inspect:**

- Close button pushed too close to toolbar icons
- Search box squeezing title/project information
- CRS/QA badges wrapping or clipping
- Toolbar overflow appearing too late
- Modal title becoming unreadable

**Fix direction:**

- Separate modal controls from map command controls.
- Keep close/dock/expand fixed in the modal shell.
- Move low-frequency commands into overflow.
- Use responsive priority rules for command visibility.

---

#### Risk B — Floating controls vs right dock

**Severity:** High  
**Likely affected components:**

```txt
MapCanvasControls
MapRightDockHost
MapLegend
MapControls
```

**Problem:**  
Floating zoom/draw/measure/legend controls can collide with the right dock when the dock is open.

**Symptoms to inspect:**

- Floating controls hidden under the right panel
- Legend clipped by inspector
- Map popup opening underneath right dock
- Draw/measure tools difficult to access when dock is open

**Fix direction:**

- Use dock-aware inset variables.
- Position map controls relative to available canvas area.
- Move floating controls to a named “map furniture slot.”
- Avoid component-local arbitrary z-index.

---

#### Risk C — Bottom panel vs map controls/status

**Severity:** Medium–High  
**Likely affected components:**

```txt
MapStatusBar
MapCanvasControls
MapWorkspaceShell
Bottom panel components
Timeline/log/evidence panels
```

**Problem:**  
Bottom panel, status bar, scale bar, map attribution, timeline, and diagnostics can compete for bottom space.

**Symptoms to inspect:**

- Scale bar hidden by bottom panel
- Status chips wrap or overflow
- Timeline/log panel consumes too much height
- Map becomes too short on 720px or 640px height
- Bottom panel traps scroll

**Fix direction:**

- Reserve bottom inset for status and panel.
- Collapse bottom panel first in short-height viewports.
- Keep map minimum height.
- Use internal scroll for bottom panel content.
- Pin critical CRS/QA warnings; overflow routine info.

---

#### Risk D — Popovers/dropdowns vs critical content

**Severity:** Medium  
**Likely affected components:**

```txt
MapToolbar
MapTopCommandSurface
MapLayerPanel
MapRightDockHost
Import/export dialogs
Menus/popovers/tooltips
```

**Problem:**  
Menus and tooltips may open over map tools, command buttons, close buttons, or panel content.

**Symptoms to inspect:**

- Tooltip covers the button next to it
- Dropdown opens offscreen
- Menu hides close button
- Popover clipped by modal boundary
- Popover appears behind dock/panel

**Fix direction:**

- Use viewport-aware placement.
- Define popover z-index above panels but below dialogs.
- Add max height and scroll to long menus.
- Ensure Esc closes popovers and returns focus.

---

#### Risk E — Right panel tab overload

**Severity:** High  
**Likely affected components:**

```txt
MapRightDockHost
Inspector panels
QA panels
Diagnostics panels
Report/evidence panels
```

**Problem:**  
Too many right-side tabs or panel options may create horizontal/vertical overflow and weak hierarchy.

**Symptoms to inspect:**

- Too many visible tab buttons
- Tab labels clipped
- Icons without readable labels
- Active tab not obvious
- Important warnings buried in secondary panels

**Fix direction:**

- Show only primary tabs by default.
- Put advanced panels into overflow.
- Use sectioned tabs or activity groups.
- Add panel summaries.

---

## 6. Modal shell and command bar audit

### 6.1 Modal shell expectations

A production modal shell should provide:

- Clear title
- Stable close control
- Stable dock/expand/minimize controls if supported
- Clear boundary between global modal controls and map tools
- Predictable exit behavior
- Unsaved-change protection where needed
- Consistent alignment and spacing
- No visual competition with analytical controls

### 6.2 Problems to inspect

- Are close/minimize/expand/dock controls always in the same location?
- Are those controls visually distinct from map actions?
- Is the close button reachable with keyboard?
- Does Esc close the correct layer first?
- If a dialog/popover is open, does Esc close that before closing the modal?
- Does closing the modal risk losing unsaved imports, sketches, reports, or selections?
- Is the header too dense?
- Are dangerous actions near routine actions?
- Are duplicate actions shown in both header and toolbar?

### 6.3 Recommended command hierarchy

Use this command structure:

```txt
Modal shell
├── Left: title + current workspace/project context
├── Center: optional search / command palette trigger
└── Right: modal controls only
    ├── Dock / undock
    ├── Expand / restore
    ├── Minimize, if supported
    └── Close

Map command bar
├── View
│   ├── Basemap
│   ├── Zoom / fit
│   └── Reset view
├── Data
│   ├── Import
│   ├── Services
│   ├── Catalog
│   └── Layers
├── Analyze
│   ├── Query
│   ├── Hotspot / LISA
│   ├── Processing
│   └── Urban method
├── QA / Evidence
│   ├── CRS
│   ├── QA
│   ├── Evidence
│   └── Problems
└── Export
    ├── Export
    ├── Publish
    └── Report
```

### 6.4 Button rules

Every button should follow these rules:

- Minimum desktop target: **32–36px**
- Preferred touch target: **44px**
- Icon-only buttons must have:
  - `aria-label`
  - tooltip
  - visible focus state
  - active state if toggleable
- Dangerous actions must be separated from routine actions.
- Disabled state must explain why, preferably via tooltip or helper text.
- Button groups must have consistent spacing.
- Primary action must be visually unique within each panel/dialog.
- Avoid more than 5–7 visible peer actions in a single group.

---

## 7. Panel-by-panel audit

## 7.1 Left panel / layer panel

### Purpose

The left panel should answer:

- What data/layers are loaded?
- Which layer is active?
- Which layers are visible?
- What are the layer order and opacity?
- Are there layer-level warnings?
- How can the user add, remove, reorder, or inspect data sources?

### Likely affected components

```txt
MapLayerPanel
LayerManager
MapCatalog*
MapContents*
MapImport*
MapService*
Layer rows
Source rows
Legend/layer metadata components
```

### Problems to inspect

- Too many row actions visible at once
- Small layer row buttons
- Hard-to-scan layer names
- Opacity/order controls too compressed
- Visibility/lock/delete/settings actions too close together
- Layer metadata shown before layer identity
- Import/source/catalog controls mixed with layer list
- Empty state not helpful
- Loading state does not reserve layout
- Error state lacks recovery action
- Active layer not visually obvious
- Disabled layer controls not explained
- CRS warnings buried in metadata

### Recommended structure

```txt
Left panel
├── Header
│   ├── Title: Layers
│   ├── Primary action: Add / Import
│   └── Overflow: catalog, services, manage sources
├── Search/filter layers
├── Section: Active layer
│   └── Compact summary + key warnings
├── Section: Layer stack
│   ├── Layer row
│   │   ├── Visibility
│   │   ├── Name
│   │   ├── Geometry/type badge
│   │   ├── CRS/QA warning if relevant
│   │   └── More menu
│   └── ...
├── Section: Sources
│   └── Collapsed by default if many
└── Section: Layer QA
    └── Warnings and fixes
```

### Specific implementation recommendations

- Use row menus for secondary actions.
- Show only visibility, layer name, active indicator, and one warning inline.
- Move opacity, style, metadata, CRS, and delete into expandable details or row menu.
- Keep destructive delete/remove away from visibility toggle.
- Add consistent row height.
- Use text truncation with tooltip for long layer names.
- Make active layer visually clear using border/accent, not color alone.
- Add empty state:
  - Title: “No layers loaded”
  - Body: “Import a dataset or connect a service to begin.”
  - Primary action: “Import data”
  - Secondary action: “Open catalog”
- Add loading skeleton if importing/connecting.
- Add error state with “Retry,” “View details,” and “Remove source” if appropriate.

### Acceptance criteria

- User can identify active layer within 2 seconds.
- User can distinguish visibility vs delete/remove actions.
- Layer list remains usable with 20+ layers.
- Left panel does not create horizontal scroll.
- All layer row controls are keyboard reachable.
- Dense metadata is hidden behind details/menus by default.

---

## 7.2 Right panel / inspector / properties panel

### Purpose

The right panel should answer:

- What is selected?
- What properties does it have?
- Are there problems?
- What QA/evidence/report actions are relevant?
- What advanced diagnostics are available?

### Likely affected components

```txt
MapRightDockHost
Inspector panels
Attributes panel
Problems panel
Timeline panel
Tasks panel
Diagnostics panel
Pins panel
Draw panel
Measure panel
Selection panel
Scientific QA panel
QA panel
Workflow panel
Report panel
Performance panel
Collaboration panel
Urban method panel
```

### Main problem

The right panel appears to expose too many peer-level panels. This creates cognitive overload and makes the dock feel like a second application inside the modal.

### Recommended right dock hierarchy

Visible primary tabs should be limited to:

```txt
Inspect
Layers/Data
Problems
QA
Evidence/Report
Diagnostics
More
```

Secondary or advanced panels should be moved into:

```txt
More / overflow
Command palette
Panel-local actions
Advanced details sections
```

### Panel content rules

Each right panel should start with:

```txt
Panel title
Short one-line purpose
Primary state summary
Critical warnings/errors
Primary action
Secondary details
Advanced/raw details collapsed
```

### Problems to inspect

- Too many tabs visible
- Long labels clipped
- Icons without meaning
- Active tab hard to distinguish
- Inspector data shown without summary
- QA and scientific QA separated in confusing ways
- Performance diagnostics too visible for normal users
- Internal route/source metadata exposed
- Report/evidence actions visually compete with inspection
- Scroll areas nested too deeply

### Specific implementation recommendations

- Group panels into primary and advanced.
- Keep advanced diagnostics collapsed by default.
- Merge related panels where semantics allow:
  - QA + Scientific QA can be related but not flattened.
  - Problems + QA warnings can cross-link.
  - Report + Evidence can share a workflow surface.
- Use sticky panel headers only if they do not consume too much space.
- Add panel summaries:
  - “3 selected features”
  - “2 CRS warnings”
  - “No blocking QA issues”
  - “Report draft ready”
- Use severity badges sparingly.
- Keep raw JSON/logs hidden unless expanded.

### Acceptance criteria

- Visible right dock tabs do not overflow at standard desktop width.
- Keyboard user can move through tabs predictably.
- Active panel is visually obvious.
- Critical warnings appear above routine metadata.
- Diagnostics do not look like unfinished developer UI.
- Right panel does not obscure map controls.

---

## 7.3 Bottom panel / timeline / logs / diagnostics

### Purpose

The bottom panel should provide lower-priority but important workflow and runtime information:

- Timeline
- Logs
- Evidence trail
- Diagnostics
- Processing output
- Task progress
- Review history

### Likely affected components

```txt
MapStatusBar
Timeline panel
Logs panel
Evidence panel
Diagnostics panel
Tasks panel
Bottom dock/panel components
```

### Problems to inspect

- Bottom panel consumes too much vertical space
- Map canvas becomes too short
- Status bar contains too many badges
- Important warnings hidden in overflow
- Logs appear too debug-like
- Timeline/evidence/diagnostics mixed without hierarchy
- Scroll traps in bottom panel
- Scale bar or map attribution covered

### Recommended structure

```txt
Bottom area
├── Status bar
│   ├── View state
│   ├── Data/CRS/QA state
│   └── Runtime/task state
└── Expandable bottom panel
    ├── Timeline
    ├── Evidence
    ├── Logs
    └── Diagnostics
```

### Status bar priority rules

Always visible:

- Current CRS warning if blocking
- QA blocking issue count
- Active task/progress if running
- Provider/offline error if relevant
- Selection count if non-zero

Can overflow:

- Cursor coordinates
- Zoom level
- Performance details
- Sync metadata
- Non-critical provider name
- Routine layer count
- Unit preferences

### Short-height behavior

For heights under approximately 720px:

- Collapse bottom panel by default.
- Keep status bar compact.
- Ensure map minimum height.
- Move logs/diagnostics into overlay/drawer only when explicitly opened.
- Avoid two stacked bottom surfaces if possible.

### Acceptance criteria

- Bottom panel never hides critical map controls.
- Status bar does not wrap into multiple uncontrolled lines.
- Critical warnings do not disappear into generic overflow.
- Logs and diagnostics are accessible but not visually dominant.
- Short-height viewport remains usable.

---

## 7.4 Central map canvas

### Purpose

The map canvas is the core work surface.

It should support:

- Panning/zooming
- Feature selection
- Layer rendering
- Popups
- Drawing
- Measuring
- Analysis overlays
- Evidence/report interactions
- Error recovery
- Empty and loading states

### Likely affected components

```txt
MapCanvas
MapCanvasControls
MapPopup
MapLegend
MapScale
MapNorthArrow
MapAttribution
MapOverlay components
```

### Problems to inspect

- Canvas visually crowded by surrounding panels
- Floating controls overlap content
- Popup too large
- Popup opens under dock/panel
- Loading state looks broken
- Error state lacks recovery
- Empty state unclear
- Map attribution/scale hidden
- Map does not maintain minimum usable area
- Report/evidence buttons inside popup too prominent or unclear

### Recommended canvas rules

- Map canvas must remain visually dominant.
- Overlays must respect safe insets.
- Popup max height should be capped.
- Popup should be collision-aware.
- Error states should provide:
  - What failed
  - Why it matters
  - Retry/recover action
  - Details link if technical
- Empty states should guide next action:
  - Import data
  - Open catalog
  - Load demo/sample if appropriate
- Loading state should not shift layout dramatically.

### Acceptance criteria

- Map is usable with both left and right panels open.
- Popup does not hide primary modal controls.
- Floating controls remain clickable.
- Error and empty states are clear.
- Canvas has a stable minimum height across tested viewports.

---

## 7.5 Floating controls

### Purpose

Floating controls should provide map-local actions:

- Zoom
- Fit/reset view
- Draw
- Measure
- Select
- Legend
- Basemap
- Scale/north arrow
- Possibly locate/coordinates

### Likely affected components

```txt
MapCanvasControls
MapControls
MapLegend
MapScale
MapNorthArrow
Draw controls
Measure controls
Selection controls
```

### Problems to inspect

- Controls too small
- Multiple floating clusters
- Controls too close to panels
- Controls overlap legend
- Controls overlap bottom panel
- Controls use inconsistent button styles
- Controls have inconsistent hover/focus/active states
- Toggle state unclear
- Tooltips cover controls

### Recommended floating-control layout

Use named slots:

```txt
top-left-map-slot
top-right-map-slot
bottom-left-map-slot
bottom-right-map-slot
center-overlay-slot
```

Each slot should account for:

- Left panel width
- Right dock width
- Header height
- Bottom panel/status height
- Modal padding
- Safe area/inset
- Popover bounds

### Acceptance criteria

- Floating controls never overlap left/right/bottom panels.
- Control clusters are visually consistent.
- Toggle actions expose active state.
- Controls remain keyboard accessible.
- Touch target size is acceptable.

---

## 7.6 Export / publish / evidence surfaces

### Purpose

These surfaces must support responsible analytical output:

- Export map/image/data
- Publish outputs
- Add map/selection to report
- Show evidence trail
- Explain QA/CRS caveats
- Avoid overstating analytical certainty

### Likely affected components

```txt
Export dialogs
Publish dialogs
Report panel
Evidence panel
QA panel
Scientific QA panel
Map popup report actions
```

### Problems to inspect

- Export/publish actions imply readiness when QA/CRS issues exist
- Evidence displayed as raw technical text first
- Caveats hidden too low
- Dialog actions unclear
- Primary/secondary buttons inconsistent
- Long evidence content not scannable
- Scientific results lack confidence/caveat hierarchy
- Publish button too close to cancel/destructive controls

### Recommended evidence hierarchy

```txt
Evidence / QA output
├── Summary
│   ├── What was analyzed
│   ├── Result / status
│   └── Confidence / limitations
├── Blocking issues
├── Warnings
├── Methods
├── Inputs
├── CRS / projection information
├── Reproducibility metadata
└── Raw technical details
```

### Export/publish gating

Before export or publish, show:

- CRS status
- QA status
- Missing data warnings
- Provider limitations
- Analytical caveats
- Whether output is draft or final
- What exactly will be exported/published

### Acceptance criteria

- User understands whether output is safe to publish.
- QA/CRS caveats are visible before final action.
- Evidence is readable in summary form.
- Raw details are available but not dominant.
- Dialogs fit in viewport and have fixed footers.

---

## 7.7 Diagnostics / logs / QA surfaces

### Purpose

Diagnostics and QA surfaces should help the user fix problems, not expose raw implementation state too early.

### Likely affected components

```txt
MapPerformanceDiagnosticsPanel
Diagnostics panel
Problems panel
QA panel
ScientificQAPanel
Logs panel
Status bar QA segments
```

### Problems to inspect

- Diagnostics feel like debug output
- Performance budget language too internal
- Raw logs visible by default
- Too many severity badges
- QA and Problems duplicate information
- Scientific QA lacks user-facing summary
- Warning severity unclear
- Recovery actions missing

### Recommended diagnostics hierarchy

```txt
Diagnostics
├── Blocking issues
├── Warnings
├── Suggested fixes
├── Runtime status
├── Performance summary
└── Advanced developer details
```

### Severity model

Use only clear severity levels:

```txt
Critical / Blocking
Warning
Info
Passed
```

Avoid multiple competing badge systems.

### Acceptance criteria

- User can identify what needs action.
- Developer details are available but collapsed.
- QA status is consistent across panel and status bar.
- Diagnostics do not reduce production polish.
- Recovery actions are visible for failures.

---

## 8. Accessibility and interaction audit

## 8.1 Keyboard navigation risks

### Risks

- Long tab order through all toolbar buttons
- Too many right dock tabs
- Icon-only controls without labels
- Popovers that do not return focus
- Dialogs that do not trap focus
- Esc behavior conflicts between map, popover, dialog, and modal
- Draw/measure tools not fully keyboard operable
- Dense layer rows requiring too many tab stops

### Required behavior

Keyboard order should roughly follow:

```txt
Modal shell
→ Primary command bar
→ Left panel
→ Map canvas/floating controls
→ Right panel
→ Bottom/status panel
→ Dialog/popover if open
```

For popovers/dialogs:

```txt
Open trigger
→ Focus moves into popover/dialog
→ Tab stays within dialog if modal
→ Esc closes topmost layer
→ Focus returns to trigger
```

### Acceptance criteria

- All controls reachable by keyboard.
- Focus is always visible.
- Esc closes the topmost transient UI first.
- Closing a dialog returns focus to its trigger.
- Dock tabs support arrow navigation where appropriate.

---

## 8.2 Focus states

### Problems to inspect

- Focus ring hidden by glass background
- Focus ring too subtle
- Hover state exists but focus state does not
- Active state and focus state look the same
- Disabled controls still focusable incorrectly
- Tool mode active state unclear

### Recommended focus rules

- Use strong visible outline.
- Do not rely only on color.
- Use `:focus-visible`.
- Preserve focus contrast in dark and high-contrast modes.
- Toggle buttons should expose active state visually and semantically.

---

## 8.3 Contrast risks

### Problems to inspect

- Low-opacity text over translucent panels
- Glassmorphism reducing readability
- Subtle borders disappearing
- Status chip text too low contrast
- Disabled states too faint
- Warning colors insufficiently distinct
- Map overlays behind translucent panels affecting text clarity

### Recommended contrast rules

- Body text should meet WCAG AA.
- Critical text and button labels must exceed minimum contrast.
- Warnings/errors require icon + text, not color alone.
- Avoid placing small text on busy map backgrounds without solid backing.

---

## 8.4 Disabled-state risks

### Problems to inspect

- Disabled action shown without explanation
- Disabled state only opacity-based
- Disabled buttons still look clickable
- User cannot discover required prerequisite
- Export/publish disabled without QA reason

### Recommended disabled-state pattern

```txt
Disabled button
├── Visual disabled state
├── aria-disabled or disabled as appropriate
├── Tooltip/helper: why unavailable
└── Link/action to fix prerequisite if possible
```

Example:

```txt
Publish disabled
Reason: Resolve 2 blocking QA issues before publishing.
Action: Open QA panel
```

---

## 8.5 Responsive risks

### Desktop risks

- Header overcrowding
- Right dock too wide
- Status bar chip overflow
- Popovers overlapping modal controls

### Tablet landscape risks

- Command groups wrap/clutter
- Left and right panels leave too little map width
- Tooltips/popovers clipped
- Target sizes too small

### Tablet portrait risks

- Side panels must collapse or become drawers
- Header must prioritize title, close, command palette
- Floating controls need larger touch targets

### Short-height risks

- Bottom panel consumes map
- Dialogs clipped vertically
- Popovers extend offscreen
- Map minimum height not preserved

### Acceptance criteria

- No horizontal page overflow.
- Modal content remains accessible.
- Close control remains visible.
- Map remains usable.
- Panels collapse/adapt predictably.
- Dialogs scroll internally with fixed footer actions.

---

## 9. Production-level design principles for the fix

## 9.1 Spacing system

Use a consistent 4px-based spacing scale.

Recommended tokens:

```txt
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-5: 20px
space-6: 24px
space-8: 32px
```

Recommended usage:

```txt
Panel inner padding: 12px or 16px
Panel section gap: 12px
Dense row gap: 4px–8px
Button group gap: 4px–8px
Modal shell padding: 12px–16px
Dialog content padding: 16px
Dialog footer gap: 8px
```

Avoid arbitrary one-off values unless required by map geometry.

---

## 9.2 Button grouping

Rules:

1. One primary action per panel/dialog.
2. No more than 5–7 visible peer actions in a toolbar group.
3. Use overflow for low-frequency commands.
4. Keep destructive actions separated.
5. Keep modal controls separate from map controls.
6. Icon-only actions require tooltip + `aria-label`.
7. Toggle buttons require visible active state.
8. Disabled buttons require reason.

Recommended group model:

```txt
View group
Data group
Analyze group
QA/Evidence group
Export group
More group
```

---

## 9.3 Modal control hierarchy

Modal controls should be:

- Fixed in top-right modal shell
- Consistently ordered
- Visually smaller than primary workflow CTAs but still easy to hit
- Not mixed with toolbar actions
- Keyboard accessible
- Safe with unsaved state

Recommended order:

```txt
Dock / undock
Expand / restore
Minimize, if supported
Close
```

Close should remain visually findable and should not move between states.

---

## 9.4 Panel density rules

Each panel should use this structure:

```txt
Panel title
One-line explanation
Critical status / warning summary
Primary action
Main content
Secondary metadata
Advanced details collapsed
```

Avoid:

- Raw logs first
- Dense badges before explanation
- Nested accordions inside nested accordions
- Multiple competing CTAs
- Long unstructured text
- Metadata chips wrapping across several lines

---

## 9.5 Progressive disclosure rules

### Default visible

- Map
- Essential layer list
- Current CRS/QA status
- Primary commands
- Active selection summary

### Secondary visible on demand

- Inspector details
- Analysis configuration
- Evidence summary
- Report controls
- Timeline/log summary

### Advanced hidden by default

- Raw logs
- Raw evidence
- Performance internals
- Provider internals
- Developer/test details
- Full metadata dumps

---

## 9.6 Z-index / elevation discipline

Use named elevation tokens.

Recommended model:

```txt
map-base: 0
map-overlay: 10
panel: 20
panel-sticky: 25
command-bar: 30
dropdown: 40
popover: 50
tooltip: 60
dialog-backdrop: 70
dialog: 80
toast: 90
```

Rules:

- Do not use arbitrary z-index values inside canonical modal components.
- Do not let tooltips cover critical modal controls.
- Dialogs must always appear above popovers.
- Popovers must appear above panels but below dialogs.
- Floating controls must respect panel insets.

---

## 9.7 Typography scale

Recommended scale:

```txt
Modal title: 14–16px semibold
Panel title: 13–14px semibold
Section title: 12–13px semibold
Body: 12–13px regular
Metadata: 11–12px
Monospace technical metadata: 11–12px
Button label: 12–13px
```

Rules:

- Avoid excessive all-caps.
- Keep long labels readable.
- Use truncation with tooltip only where necessary.
- Avoid mixing many font weights in one panel.

---

## 9.8 Color and accent restraint

Rules:

- Use accent color for active/selected/focused states.
- Use semantic colors for warnings/errors/success.
- Do not use many unrelated accent colors.
- Avoid decorative glow or heavy blur.
- Use glassmorphism only when it improves depth without reducing readability.
- Critical statuses must use text + icon + color, not color alone.

---

## 10. Staged implementation plan

This plan intentionally breaks the work into small, reversible branches.

---

# Phase 1 — Audit-safe layout stabilization

## Branch

```txt
ui/map-modal-layout-stabilization-p1
```

## Goal

Stabilize modal geometry and map safe areas without changing functionality or reorganizing major UX concepts.

## Target files/components

```txt
src/centerpanel/components/map/MapWorkspaceShell.tsx
src/centerpanel/components/map/MapCanvasControls.tsx
src/centerpanel/components/map/MapStatusBar.tsx
src/centerpanel/components/map/design/mapTokens.ts
src/centerpanel/components/map/MapLegend.tsx
src/centerpanel/components/map/MapRightDockHost.tsx
src/centerpanel/components/map/MapLayerPanel.tsx
src/components/map/MapControls.tsx
src/components/map/LayerManager.tsx
```

Before editing `src/components/map/*`, verify whether these legacy/shared components are actually rendered inside the Map Explorer modal. If not, avoid touching them in Phase 1 unless needed.

## Specific changes

1. Define canonical layout variables:
   - top command height
   - left panel width
   - right dock width
   - bottom panel height
   - status bar height
   - map safe insets

2. Ensure floating controls use safe insets.

3. Ensure legend and scale/north controls use safe insets.

4. Add stable landmark wrappers if missing:
   - `data-testid="map-explorer-modal"`
   - `data-testid="map-shell"`
   - `data-testid="map-command-bar"`
   - `data-testid="map-left-panel"`
   - `data-testid="map-right-dock"`
   - `data-testid="map-bottom-panel"`
   - `data-testid="map-canvas"`
   - `data-testid="map-floating-controls"`

5. Ensure modal content uses `min-height: 0` in flex children where scrolling is required.

6. Add or verify internal scroll areas for panels.

7. Prevent uncontrolled horizontal overflow.

## Risks

- Existing visual tests may need updates.
- Map canvas dimensions may change.
- Safe inset changes may affect popup positioning.
- Existing CSS assumptions may conflict with new layout tokens.

## Validation steps

Run:

```bash
npm run typecheck
npm run lint:errors
npm run test
npm run build
npm run test:e2e:smoke
npm run test:e2e:a11y
```

Manual check:

- Modal opens.
- Close button remains visible.
- Left/right/bottom panels do not overlap.
- Floating controls remain clickable.
- Map remains usable at 1366×640.

## Acceptance criteria

- No visible overlap between primary surfaces.
- No horizontal overflow.
- Map canvas keeps a usable area.
- Panel content scrolls internally.
- Existing functionality unchanged.

---

# Phase 2 — Header and command bar simplification

## Branch

```txt
ui/map-modal-command-bar-p2
```

## Goal

Clarify the relationship between modal shell controls, command bar actions, map-local tools, and overflow commands.

## Target files/components

```txt
MapWorkspaceShell
MapTopCommandSurface
MapCanvasControls
MapToolbar
Command palette / command menu components
Modal control components
Shared icon button components
```

## Specific changes

1. Separate modal controls from map commands.

2. Establish canonical command groups:

```txt
View
Data
Analyze
QA / Evidence
Export
More
```

3. Move low-frequency commands into overflow:
   - Plugins
   - Advanced processing
   - Diagnostics
   - Collaboration
   - Experimental sync
   - Rare export variants
   - Developer-like tools

4. Keep essential commands visible:
   - Search / command palette
   - Layers
   - Import
   - Analyze/query
   - QA status
   - Export/report

5. Increase small toolbar target sizes.

6. Ensure every icon-only command has:
   - Tooltip
   - `aria-label`
   - Focus state
   - Active state if toggleable

7. Add responsive command priority:
   - Full labels on wide desktop
   - Compact labels on medium desktop
   - Icons + overflow on tablet
   - Command palette-first on narrow layouts

## Risks

- Users may need to find moved commands in overflow.
- Tests expecting direct button visibility may need adjustment.
- Command grouping may expose duplicated labels.

## Validation steps

Run:

```bash
npm run typecheck
npm run lint:errors
npm run test:e2e:functional
npm run test:e2e:a11y
```

Manual check:

- All previous commands still accessible.
- Modal controls are stable.
- Header does not wrap unexpectedly.
- Keyboard order remains logical.
- Tooltip/focus states work.

## Acceptance criteria

- Header is readable at first glance.
- Modal controls are not visually confused with map tools.
- No more than 5–7 visible peer actions per command group.
- All commands remain reachable.

---

# Phase 3 — Panel hierarchy and density cleanup

## Branch

```txt
ui/map-modal-panel-density-p3
```

## Goal

Make left, right, bottom, evidence, QA, and diagnostics panels easier to scan without removing required technical content.

## Target files/components

```txt
MapLayerPanel
MapRightDockHost
Inspector panel components
Attributes panel components
Problems panel components
ScientificQAPanel
QA panel components
Evidence panel components
Report panel components
Diagnostics panel components
MapPerformanceDiagnosticsPanel
MapStatusBar
```

## Specific changes

### Left panel

- Add clear sections:
  - Layers
  - Sources
  - Contents
  - Selection
  - Layer QA
- Hide secondary layer row actions behind row menu.
- Make active layer visually obvious.
- Add better empty/loading/error states.
- Separate destructive actions.

### Right panel

- Limit visible primary tabs.
- Move advanced panels into overflow.
- Add summary-first structure to each panel.
- Collapse raw details by default.
- Use consistent severity grouping.

### Bottom/status

- Prioritize critical QA/CRS/provider/task status.
- Move routine metadata into overflow.
- Keep logs/diagnostics collapsed unless opened.
- Make bottom panel height predictable and resizable if supported.

### Evidence/QA

- Structure evidence:
  - Summary
  - Blocking issues
  - Warnings
  - Methods
  - Inputs
  - CRS
  - Raw details
- Avoid raw technical output as first visible content.

## Risks

- Users may perceive moved content as missing.
- E2E tests may rely on visible labels.
- Panel restructuring can introduce scroll/focus bugs.

## Validation steps

Run:

```bash
npm run typecheck
npm run lint:errors
npm run test
npm run test:e2e:functional
npm run test:e2e:a11y
```

Manual check:

- Identify active layer quickly.
- Open each right dock panel.
- Confirm advanced content still reachable.
- Confirm warnings visible.
- Confirm no nested scroll trap.

## Acceptance criteria

- Panels are scannable.
- Important warnings are prominent.
- Advanced details are accessible but not dominant.
- Scientific/evidence semantics preserved.
- Existing workflows still work.

---

# Phase 4 — Collision, z-index, and scroll hardening

## Branch

```txt
fix/map-modal-collision-zindex-p4
```

## Goal

Eliminate overlap, clipping, scroll traps, and inconsistent stacking behavior.

## Target files/components

```txt
mapTokens.ts
MapWorkspaceShell
MapCanvasControls
MapLegend
MapStatusBar
MapRightDockHost
MapLayerPanel
Popover/menu/tooltip components
Import/export/publish dialogs
Map popup components
```

## Specific changes

1. Replace arbitrary z-index values with named tokens.

2. Define stacking order:

```txt
map-base
map-overlay
panel
panel-sticky
command-bar
dropdown
popover
tooltip
dialog-backdrop
dialog
toast
```

3. Make menus/popovers viewport-aware.

4. Add max height and scroll behavior to long menus.

5. Ensure dialogs:
   - Fit within viewport
   - Have scrollable content
   - Have fixed footer actions
   - Do not hide close/cancel buttons

6. Ensure map popups:
   - Cap height
   - Avoid opening under right/left panels
   - Remain dismissible
   - Do not hide critical controls

7. Add regression tests for:
   - no clipped primary action
   - no hidden close control
   - no overlay on floating controls
   - no horizontal overflow

## Risks

- Stacking changes can break existing popovers.
- Dialog behavior may vary between browsers.
- Screenshot tests may need updates.

## Validation steps

Run:

```bash
npm run typecheck
npm run lint:errors
npm run test:e2e:smoke
npm run test:e2e:a11y
npm run test:e2e:functional
```

Manual viewports:

```txt
1440x900
1366x768
1366x640
1280x720
1024x768
768x1024
```

## Acceptance criteria

- No modal control is hidden.
- No primary action is clipped.
- Popovers stay inside viewport.
- Dialogs scroll correctly.
- Map controls stay clickable.
- No horizontal overflow.

---

# Phase 5 — Accessibility and responsive hardening

## Branch

```txt
fix/map-modal-a11y-responsive-p5
```

## Goal

Ensure the modal is usable with keyboard, screen readers, reduced motion, high contrast, and tablet/short-height layouts.

## Target files/components

```txt
Shared button components
Icon button components
Toolbar components
MapRightDockHost
MapLayerPanel
Dialog components
Popover/menu components
Focus trap utilities
Announcer/live region utilities
Responsive CSS/tokens
```

## Specific changes

1. Keyboard:
   - Verify tab order.
   - Add roving tabindex for right dock tabs if missing.
   - Ensure Esc closes topmost overlay first.
   - Ensure focus returns to trigger.

2. ARIA:
   - Add/verify `aria-label` for icon-only controls.
   - Use `aria-expanded` for expandable sections.
   - Use `aria-selected` for tabs.
   - Use `aria-pressed` for toggle tools.
   - Use `aria-disabled` or `disabled` correctly.

3. Focus:
   - Add visible focus ring.
   - Ensure focus ring works on glass/translucent backgrounds.
   - Keep active state distinct from focus.

4. Contrast:
   - Audit low-opacity text.
   - Strengthen panel backgrounds where text overlays map.
   - Avoid color-only warning states.

5. Motion:
   - Respect `prefers-reduced-motion`.
   - Avoid unnecessary animated panel transitions.

6. Responsive:
   - Tablet layout collapse rules.
   - Short-height bottom panel collapse.
   - Touch target size increase.
   - Command overflow priority.

## Risks

- Larger controls may create new overflow.
- ARIA changes may expose incorrect semantics if not tested.
- Responsive breakpoints may require visual tuning.

## Validation steps

Run:

```bash
npm run typecheck
npm run lint:errors
npm run test:e2e:a11y
npm run test:e2e:functional
```

Manual accessibility check:

- Keyboard-only full workflow.
- Screen reader spot check for:
  - Modal title
  - Close button
  - Toolbar actions
  - Layer rows
  - Right dock tabs
  - Dialogs
- Reduced motion.
- High contrast.
- 200% browser zoom if practical.

## Acceptance criteria

- Keyboard-only user can complete core workflows.
- Focus is always visible.
- Icon-only actions are understandable.
- Disabled actions explain prerequisites.
- Short-height and tablet states remain usable.

---

# Phase 6 — Final visual QA and regression tests

## Branch

```txt
test/map-modal-visual-qa-p6
```

## Goal

Confirm the stabilized modal is production-ready across repository build and local preview server deployment.

## Target files/components

```txt
e2e visual tests
Map Explorer smoke tests
Map Explorer accessibility tests
Release checklist docs
local preview server preview notes
```

## Specific changes

1. Add or update e2e checks for:
   - Modal default open state
   - Left panel open
   - Right dock open
   - Bottom panel open
   - Dense layer list
   - Empty state
   - Error state
   - Import dialog
   - Export/publish dialog
   - QA/evidence panel
   - Diagnostics panel
   - Short-height viewport
   - Tablet viewport
   - Popover/dropdown open
   - Tooltip/focus state

2. Add explicit layout assertions:
   - Close button visible
   - No horizontal overflow
   - Primary action visible
   - Floating controls clickable
   - Panels not overlapping
   - Dialog footer visible
   - Critical warnings visible

3. Update release notes/checklist only after visual confirmation.

## Risks

- Visual tests may be brittle.
- Browser differences can cause minor layout changes.
- local preview server deployment timing can delay visual QA.

## Validation steps

Run full RC validation:

```bash
npm run typecheck
npm run lint:errors
npm run test
npm run build
npm run test:e2e:smoke
npm run test:e2e:a11y
npm run test:e2e:functional
npm run validate:rc
```

local preview server manual validation:

- Open deployed app.
- Open Map Explorer.
- Repeat visual checklist.
- Capture screenshots.
- Compare with local build.
- Document any differences.

## Acceptance criteria

- Local and local preview server render consistently.
- No critical overlap/clipping.
- Core workflows pass.
- Accessibility baseline passes.
- Modal feels professional, restrained, and production-ready.

---

## 11. Suggested GPT implementation prompts

Use these prompts one phase at a time. Do not ask one GPT to implement all phases at once.

---

### Prompt for Phase 1

```md
You are the SynapseIDE Urban Analytics Workspace Assistant.

Repository:
SynapseIDE_urban_analytics

Task:
Implement Phase 1 of the Map Explorer modal UI stabilization plan.

Before editing:
1. Read `.ai-workspace/PROJECT_CONTEXT.md`.
2. Read `.ai-workspace/WORKFLOW.md`.
3. Read `.ai-workspace/DECISIONS.md`.
4. Read `.ai-workspace/ARCHITECTURE.md`.
5. Search the repository for Map Explorer modal components.
6. Do not commit directly to main/master.

Goal:
Stabilize layout geometry and safe insets for the Map Explorer modal without changing functionality.

Create branch:
ui/map-modal-layout-stabilization-p1

Focus files:
- MapWorkspaceShell
- MapCanvasControls
- MapStatusBar
- mapTokens
- MapLegend
- MapRightDockHost
- MapLayerPanel
- Any legacy map controls only if they are actually rendered in the modal

Required changes:
- Define canonical map shell layout variables.
- Ensure left/right/bottom panels and floating controls do not overlap.
- Ensure panel content uses internal scroll and min-height: 0 where needed.
- Ensure modal close/control area remains visible.
- Add or preserve stable data-testid landmarks.
- Do not remove GIS, CRS, QA, evidence, export, or diagnostics features.

Validation:
Run typecheck, lint, tests, build, and relevant e2e tests where possible.

Output:
Prepare a change summary with:
- What changed
- Files changed
- Risks
- Test notes
- Follow-up recommendations
```

---

### Prompt for Phase 2

```md
You are the SynapseIDE Urban Analytics Workspace Assistant.

Repository:
SynapseIDE_urban_analytics

Task:
Implement Phase 2 of the Map Explorer modal UI stabilization plan.

Create branch:
ui/map-modal-command-bar-p2

Goal:
Simplify and clarify the Map Explorer modal header and command bar without removing functionality.

Focus:
- Modal shell controls
- MapTopCommandSurface
- MapToolbar
- MapCanvasControls
- Command grouping
- Overflow behavior
- Icon-only button accessibility

Required changes:
- Separate modal controls from map commands.
- Group commands into View, Data, Analyze, QA/Evidence, Export, More.
- Move low-frequency commands into overflow.
- Preserve access to all existing commands.
- Standardize icon-only actions with tooltip, aria-label, focus state, and active state.
- Improve hit target sizing.
- Avoid direct commit to main/master.

Validation:
Run typecheck, lint, functional e2e, a11y e2e, and manual keyboard checks.

Output:
Prepare change summary with changed files, risks, test notes, and follow-up.
```

---

### Prompt for Phase 3

```md
You are the SynapseIDE Urban Analytics Workspace Assistant.

Repository:
SynapseIDE_urban_analytics

Task:
Implement Phase 3 of the Map Explorer modal UI stabilization plan.

Create branch:
ui/map-modal-panel-density-p3

Goal:
Improve panel hierarchy and reduce density in left, right, bottom, QA, evidence, diagnostics, and report surfaces while preserving all semantics.

Focus:
- MapLayerPanel
- MapRightDockHost
- Inspector / attributes / problems panels
- QA / Scientific QA panels
- Evidence / report panels
- Diagnostics / performance panels
- MapStatusBar

Required changes:
- Left panel: better sections and row actions.
- Right dock: fewer visible primary tabs, overflow for advanced panels.
- Bottom/status: critical warnings visible, routine metadata overflowed.
- Evidence/QA: summary-first hierarchy.
- Diagnostics: user-actionable summary first, raw details collapsed.
- Do not delete advanced scientific or GIS information.

Validation:
Run typecheck, lint, unit/component tests, functional e2e, a11y e2e, and manual panel scan checks.

Output:
Prepare change summary.
```

---

### Prompt for Phase 4

```md
You are the SynapseIDE Urban Analytics Workspace Assistant.

Repository:
SynapseIDE_urban_analytics

Task:
Implement Phase 4 of the Map Explorer modal UI stabilization plan.

Create branch:
fix/map-modal-collision-zindex-p4

Goal:
Fix overlap, clipping, z-index, popover, dialog, and scroll behavior in the Map Explorer modal.

Focus:
- mapTokens
- MapWorkspaceShell
- MapCanvasControls
- MapLegend
- MapStatusBar
- MapRightDockHost
- MapLayerPanel
- Popovers/menus/tooltips
- Import/export/publish dialogs
- Map popups

Required changes:
- Replace arbitrary z-index values with named tokens where practical.
- Ensure popovers and menus stay inside viewport.
- Ensure dialogs have max height, internal scroll, and fixed footer.
- Ensure map popups do not render under panels.
- Ensure floating controls remain clickable.
- Add or update e2e assertions for overlap/clipping.

Validation:
Run typecheck, lint, smoke e2e, functional e2e, a11y e2e, and viewport checks.

Output:
Prepare change summary.
```

---

### Prompt for Phase 5

```md
You are the SynapseIDE Urban Analytics Workspace Assistant.

Repository:
SynapseIDE_urban_analytics

Task:
Implement Phase 5 of the Map Explorer modal UI stabilization plan.

Create branch:
fix/map-modal-a11y-responsive-p5

Goal:
Harden accessibility and responsive behavior for the Map Explorer modal.

Focus:
- Shared buttons
- Icon buttons
- Toolbars
- Right dock tabs
- Layer rows
- Dialogs
- Menus/popovers
- Focus trap utilities
- Responsive styles/tokens

Required changes:
- Ensure visible focus states.
- Add/verify aria-labels for icon-only controls.
- Add aria-expanded/selected/pressed where appropriate.
- Ensure focus returns after dialogs/popovers.
- Improve keyboard order.
- Respect reduced motion.
- Improve high contrast behavior.
- Improve tablet and short-height layouts.

Validation:
Run typecheck, lint, a11y e2e, functional e2e, keyboard-only manual pass, reduced-motion check, high-contrast check.

Output:
Prepare change summary.
```

---

### Prompt for Phase 6

```md
You are the SynapseIDE Urban Analytics Workspace Assistant.

Repository:
SynapseIDE_urban_analytics

Task:
Implement Phase 6 of the Map Explorer modal UI stabilization plan.

Create branch:
test/map-modal-visual-qa-p6

Goal:
Add final visual QA and regression coverage for the stabilized Map Explorer modal.

Focus:
- e2e visual tests
- smoke tests
- a11y tests
- release checklist docs
- local preview server visual review notes

Required checks:
- Modal default state
- Left panel
- Right dock
- Bottom panel
- Floating controls
- Import dialog
- Export/publish dialog
- QA/evidence panel
- Diagnostics panel
- Empty/loading/error/disabled states
- Desktop/tablet/short-height viewports

Validation:
Run full RC validation:
npm run typecheck
npm run lint:errors
npm run test
npm run build
npm run test:e2e:smoke
npm run test:e2e:a11y
npm run test:e2e:functional
npm run validate:rc

Also perform local preview server visual inspection.

Output:
Prepare change summary and final production-readiness recommendation.
```

---

## 12. Local change summary template

Every branch should produce a local change summary in this exact structure:

```md
## What changed

- ...

## Files changed

- `path/to/file.tsx`
- `path/to/file.css`

## Risks

- ...

## Test notes

Commands run:

- `npm run typecheck`
- `npm run lint:errors`
- ...

Manual checks:

- ...

## Follow-up recommendations

- ...
```

---

## 13. Final recommendation

### Recommended path

Use a **dedicated UI stabilization branch sequence**.

Start with:

```txt
ui/map-modal-layout-stabilization-p1
```

Then continue in order:

```txt
ui/map-modal-command-bar-p2
ui/map-modal-panel-density-p3
fix/map-modal-collision-zindex-p4
fix/map-modal-a11y-responsive-p5
test/map-modal-visual-qa-p6
```

### Do not fork yet

A fork is not justified unless the team decides to do a large experimental redesign or risky architectural rewrite.

### Do not do a full redesign yet

The better approach is:

- Stabilize layout
- Clarify command hierarchy
- Improve panel density
- Fix collisions
- Harden accessibility/responsiveness
- Add regression coverage
- Validate on local preview server

### Production signoff rule

The Map Explorer modal should only be considered production-grade after:

1. All staged fixes are complete or consciously deferred.
2. Full validation passes.
3. local preview server visual inspection passes.
4. Desktop/tablet/short-height viewports pass.
5. No critical overlap/clipping remains.
6. Primary workflows remain functional.
7. Scientific/GIS/CRS/QA/evidence/export semantics are preserved.

---

## 14. Quick checklist for the next GPT

Before doing any implementation, the next GPT should answer these questions:

```txt
[ ] Did I read .ai-workspace context?
[ ] Did I inspect current Map Explorer files?
[ ] Did I identify canonical vs legacy map components?
[ ] Did I create the correct branch?
[ ] Did I avoid main/master?
[ ] Did I preserve all functionality?
[ ] Did I avoid deleting scientific/GIS/QA/evidence semantics?
[ ] Did I keep changes small and reversible?
[ ] Did I run typecheck/lint/tests where possible?
[ ] Did I prepare a change-summary?
[ ] Did I document risks?
[ ] Did I include local preview server visual validation where applicable?
```

---

## 15. Appendix — Terms and intended meanings

### Map Explorer modal

The full modal workspace for map exploration, GIS analysis, layers, QA, evidence, export, diagnostics, and report/publish workflows.

### Modal shell

Outer modal frame, including top-level title, close/dock/expand/minimize controls, and modal boundary.

### Command bar

Global map command area for high-level actions such as View, Data, Analyze, QA/Evidence, Export.

### Floating controls

Map-local controls positioned over the map canvas, such as zoom, draw, measure, legend, scale, and selection tools.

### Left panel

Layer/data/source organization surface.

### Right dock

Inspector, properties, problems, QA, evidence, report, diagnostics, and advanced workflow surface.

### Bottom panel

Timeline, logs, diagnostics, evidence trail, task output, or runtime panel below the map.

### Status bar

Compact persistent state display for map/view/data/QA/runtime status.

### Progressive disclosure

Keeping essential information visible while moving advanced or raw technical content behind expanders, overflow menus, or panel details.

### Production-grade UI

A UI that is readable, stable, accessible, responsive, predictable, visually restrained, and ready for real users rather than only demos.

