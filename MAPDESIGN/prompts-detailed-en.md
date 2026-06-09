# Map Explorer Modal - Sequential GPT Implementation Prompt List

Token note:
- Default execution source is `MAPDESIGN/prompts-compact-en.md`.
- Use this detailed file only when a prompt requires extra acceptance nuance or edge-case clarification.
- Keep prompt runs token-efficient by sending `Prompt NN` plus the compact packet instead of pasting full blocks.
- Canonical rule: if compact and detailed wording ever diverge, this detailed file is authoritative for acceptance criteria.

**Repository:** `SynapseIDE_urban_analytics`
**Primary objective:** Apply the Map Explorer modal production UI/UX stabilization plan through small, safe, reversible local branches and commit batches.
**Language requirement:** All implementation notes, local change summaries, test notes, issue descriptions, and developer-facing comments must be written in English.
**Workflow rule:** Never commit directly to `main` or `master`. Use focused branches and prepare review-ready summaries.
**Functional rule:** Preserve all GIS, CRS, QA, evidence, diagnostics, import/export, publish, analytical, map, layer, report, and scientific semantics. Improve structure, hierarchy, layout, accessibility, and production readiness without deleting required functionality.
**Design direction:** Professional VS Code-like workspace UI. Restrained visual effects. No flashy redesign. No unnecessary dependencies.

**Local execution addendum:**

- Run prompts in local mode only. Do not require remote deployment validation for completion.
- Keep progress synchronized with `MAPDESIGN/execution-ledger.md`.
- Follow commit/push and anti-amnesia guardrails from `MAPDESIGN/local-executor.agent.md`.
- Push only when explicitly requested by the user.

---

## Prompt 01 - Build the Map Explorer repository inventory

Map Explorer Local Prompt Executor: Prompt 01

```text
You are working in the local workspace `SynapseIDE_urban_analytics`.

Task:
Create a complete repository inventory for the Map Explorer modal before making any UI changes.

Hard constraints:
- Do not edit files in this prompt.
- Do not commit to `main` or `master`.
- Treat the repository as the source of truth.
- Read the available `.ai-workspace/` context files first:
  - `.ai-workspace/PROJECT_CONTEXT.md`
  - `.ai-workspace/WORKFLOW.md`
  - `.ai-workspace/DECISIONS.md`
  - `.ai-workspace/ARCHITECTURE.md`
  - `.ai-workspace/CUSTOM_GPT_SETUP.md` if present
- If any expected context file is missing, state that clearly and continue with the repository evidence that exists.

Repository search targets:
Search for all files related to:
- Map Explorer modal
- Map Explorer shell
- Map modal
- GIS modal
- center panel map components
- map canvas
- map toolbar
- command bar
- left layer panel
- right inspector dock
- bottom panel
- status bar
- evidence
- diagnostics
- QA
- CRS
- legend
- import/export
- publish/report
- map tests
- e2e tests for layout, accessibility, overlap, smoke, and functional behavior

Expected output:
Produce a Markdown audit note with these sections:

1. Workspace context summary
   - List which `.ai-workspace/` files were found.
   - Summarize the workflow and UI principles that constrain this work.
   - Note any missing context files.

2. Map Explorer component inventory
   - List each relevant component file.
   - For each file, state its likely responsibility.
   - Mark whether it appears canonical, legacy, shared, test-only, or historical/archive-only.

3. Styling and token inventory
   - Identify files that define layout tokens, spacing, z-index, elevation, glass effects, colors, typography, panel dimensions, and responsive behavior.
   - Identify one-off inline styles that may create production risk.

4. State and interaction inventory
   - Identify state hooks, context providers, reducers, props, or controller files that influence modal layout, visible panels, active tools, dock state, import/export, QA, CRS, evidence, diagnostics, or map view state.

5. Test inventory
   - List existing unit/component/e2e tests relevant to Map Explorer.
   - Identify tests that must not be broken.
   - Identify obvious test gaps.

6. Initial risk map
   - List layout, hierarchy, collision, density, accessibility, and responsive risks.
   - Tie each risk to one or more files where possible.

7. Implementation readiness recommendation
   - Confirm whether Phase 1 can start safely.
   - Identify any blocker that must be clarified before edits.

Do not propose code changes yet. This prompt is inventory-only.
```

---

## Prompt 02 - Establish the live and local visual baseline

Map Explorer Local Prompt Executor: Prompt 02

```text
You are working in `SynapseIDE_urban_analytics`.

Task:
Establish a visual baseline for the Map Explorer modal using local repository behavior and the local preview server deployment if available.

Hard constraints:
- Do not make code changes in this prompt.
- Do not commit to `main` or `master`.
- Use repository evidence and the live deployment only.
- If the local preview server app cannot be rendered or accessed, document that as a validation blocker and continue with local/static evidence.

Steps:
1. Read the repository workflow and package scripts.
2. Identify how the app is built and served locally.
3. Identify local preview server workflow configuration.
4. Identify the deployed local preview server URL if it is available from repository settings, workflow output, README, package base path, or deployment metadata.
5. Inspect or plan inspection for:
   - Default Map Explorer modal open state.
   - Left panel visible state.
   - Right dock visible state.
   - Bottom panel/status state.
   - Import/export dialog state.
   - Evidence/QA/diagnostics state.
   - Short-height viewport state.
   - Tablet-width state.

Expected output:
Create a Markdown visual baseline note with these sections:

1. Deployment discovery
   - local preview server workflow path.
   - Build command and base path.
   - Live URL if found.
   - Any access/rendering limitation.

2. Local visual baseline command sequence
   - Install command if needed.
   - Build command.
   - Preview/dev server command.
   - Test command to open or exercise Map Explorer if available.

3. Required screenshot matrix
   Include at least:
   - 1440x900 default modal
   - 1280x720 compact desktop
   - 1366x640 short-height desktop
   - 1024x768 tablet landscape
   - 768x1024 tablet portrait
   - Modal with left panel expanded
   - Modal with right dock expanded
   - Modal with bottom panel/log/evidence visible
   - Modal with import/export or publish dialog visible
   - Modal with diagnostics/QA warning visible

4. Visual acceptance rules
   - No clipped modal controls.
   - No overlapping primary buttons.
   - No floating map controls over docked panels.
   - Close/dock/expand controls remain visible.
   - Primary map surface remains usable.
   - CRS/QA warnings remain visible and understandable.
   - Dialog primary/secondary actions remain accessible.
   - Keyboard focus is visible in all interactive regions.

5. Baseline findings
   - Concrete issues observed.
   - Issues that still require live verification.
   - Whether Phase 1 can proceed.

Do not edit code. This prompt only defines and records the visual baseline.
```

---

## Prompt 03 - Map test contracts and stable selectors

Map Explorer Local Prompt Executor: Prompt 03

```text
You are working in `SynapseIDE_urban_analytics`.

Task:
Identify the current test contracts for the Map Explorer modal and define selector safety rules before layout changes.

Hard constraints:
- Do not perform broad refactors.
- Do not rename existing `data-testid` attributes unless there is a clear test migration plan.
- Do not delete existing tests.
- Do not weaken accessibility or functional tests just to make UI changes pass.
- Do not commit to `main` or `master`.

Steps:
1. Search all tests related to Map Explorer:
   - unit tests
   - component tests
   - Playwright tests
   - smoke tests
   - a11y tests
   - functional e2e tests
   - visual or overlap tests
2. Identify stable selectors used by tests.
3. Identify fragile selectors that depend on exact text labels, nth-child order, or brittle DOM structure.
4. Identify tests that validate:
   - modal opens/closes
   - map canvas remains visible
   - controls are accessible
   - panels open/collapse
   - import/export flows
   - QA/evidence/diagnostics flows
   - no overlap/clipping
   - keyboard navigation
5. Identify missing selectors that should be added before future UI changes.

Expected output:
Produce a Markdown contract note with these sections:

1. Existing test list
   - File path
   - Test purpose
   - Critical selectors
   - Risk level if layout changes

2. Stable selector map
   Define recommended stable selectors for:
   - modal shell
   - modal header
   - close button
   - dock/expand/minimize controls
   - top command surface
   - map canvas
   - left panel
   - right dock
   - bottom panel/status bar
   - floating controls
   - layer rows
   - inspector panel
   - evidence panel
   - diagnostics panel
   - import/export dialog
   - publish/report surface
   - QA/CRS warning surfaces

3. Selector migration rules
   - Preserve existing selectors.
   - Add aliases before replacing selectors.
   - Update tests in the same PR as selector changes.
   - Never rely only on visual text when the component has a stable role/test id.

4. Test gap list
   - Layout gap.
   - Collision gap.
   - Keyboard gap.
   - Responsive gap.
   - Dialog containment gap.
   - QA/evidence semantic gap.

5. Recommendation
   - Whether to add missing selectors in Phase 1.
   - Which selector additions are safe and should be done first.

No code edits unless the repository has an explicit lightweight test-id utility file and the change is limited to documentation comments. Otherwise output analysis only.
```

---

## Prompt 04 - Phase 1: Stabilize layout tokens and modal inset system

Map Explorer Local Prompt Executor: Prompt 04

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 1 - Audit-safe layout fixes.

Goal:
Create a stable layout token and safe-inset model for the Map Explorer modal so panels, map furniture, status bars, popovers, and canvas controls do not compete for space.

Branch:
Create or use `ui/map-modal-layout-stabilization-p1`.

Hard constraints:
- Do not redesign the modal.
- Do not remove features.
- Do not delete GIS, CRS, QA, evidence, diagnostics, import/export, publish, analytical, or map semantics.
- Do not introduce dependencies.
- Do not commit directly to `main` or `master`.
- Keep changes small and reversible.

Target files:
Inspect and update only if relevant:
- `src/centerpanel/components/map/design/mapTokens.ts`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapCanvasControls.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- any local Map Explorer layout style/module files
- tests only if selectors or layout assertions need safe updates

Specific implementation requirements:
1. Define or consolidate tokens for:
   - modal chrome height
   - top command height
   - left panel width
   - right dock width
   - bottom panel/status height
   - map overlay safe inset
   - popover/dialog max height
   - z-index/elevation names if already supported
2. Prefer CSS custom properties or existing token patterns used by the repository.
3. Avoid arbitrary one-off pixel values inside components where a shared token is appropriate.
4. Make the safe-inset model readable and maintainable.
5. Keep legacy compatibility if older components still consume older variables.
6. Do not change visual styling beyond what is necessary for layout stability.

Expected output:
After implementation, provide:

1. What changed
   - Short explanation of token/inset changes.

2. Files changed
   - Exact paths.

3. Risks
   - Any component that may visually shift.

4. Test notes
   - Commands run.
   - Commands not run and why.

5. Follow-up
   - Which Phase 1 prompt should run next.

Validation commands:
Run what is available in the repo:
- `npm run typecheck`
- `npm run lint:errors`
- targeted tests if present
- `npm run build` if token changes affect runtime styling

Acceptance criteria:
- Shared layout variables exist or are clarified.
- Components can consume safe-area values consistently.
- No functionality is removed.
- TypeScript and lint pass or failures are documented as pre-existing.
```

---

## Prompt 05 - Phase 1: Stabilize modal shell grid and safe-area placement

Map Explorer Local Prompt Executor: Prompt 05

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 1 - Audit-safe layout fixes.

Goal:
Make the Map Explorer modal shell layout predictable across header, left panel, center map, right dock, bottom panel, and status surfaces.

Branch:
Use `ui/map-modal-layout-stabilization-p1`.

Hard constraints:
- Preserve all current Map Explorer functionality.
- Do not move features into unrelated routes.
- Do not create a new modal architecture.
- Do not remove panels or controls.
- Do not commit directly to `main` or `master`.

Target files:
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- shell-level layout styles or token files
- any component that directly calculates dock width/height/inset
- related layout tests

Specific implementation requirements:
1. Inspect current modal shell structure.
2. Make shell regions explicit:
   - header/chrome region
   - top command region if separate
   - left dock region
   - center map region
   - right dock region
   - bottom/status region
3. Ensure center map canvas receives remaining usable space.
4. Ensure side panels do not overlap center map content except through intentional overlay modes.
5. Ensure bottom/status regions do not cover critical map controls.
6. Ensure close/dock/expand controls remain visible at all supported viewport sizes.
7. Avoid aggressive visual changes. This is layout stabilization, not redesign.
8. Use existing class naming and token conventions where possible.

Expected output:
Provide a change-summary:
- What changed
- Files changed
- Risks
- Validation commands run
- Screenshots or visual states checked if available
- Follow-up recommendations

Validation:
- `npm run typecheck`
- `npm run lint:errors`
- existing Map Explorer tests if available
- local visual check of modal open state if possible

Acceptance criteria:
- Modal shell regions are easier to reason about.
- Map canvas remains the primary usable surface.
- Panels do not unintentionally cover modal controls.
- No semantic surfaces are removed.
```

---

## Prompt 06 - Phase 1: Apply map furniture safe-zone rules

Map Explorer Local Prompt Executor: Prompt 06

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 1 - Audit-safe layout fixes.

Goal:
Make floating map furniture respect modal panels and safe insets.

Branch:
Use `ui/map-modal-layout-stabilization-p1`.

Hard constraints:
- Do not delete map controls.
- Do not hide required controls permanently.
- Do not remove legend, scale, north arrow, zoom, draw, measure, layer, QA, CRS, or map navigation semantics.
- Do not introduce a positioning library.
- Do not commit directly to `main` or `master`.

Target files:
Inspect and update as needed:
- `src/centerpanel/components/map/MapCanvasControls.tsx`
- `src/centerpanel/components/map/MapLegend.tsx`
- `src/centerpanel/components/map/MapStatusBar.tsx`
- canonical map canvas overlay components
- legacy `src/components/map/*` only if they are rendered inside the modal route
- map layout token files

Specific implementation requirements:
1. Identify all floating controls rendered over the map.
2. Classify them:
   - navigation controls
   - analysis controls
   - draw/measure controls
   - legend/scale/north arrow
   - status/QA/CRS controls
   - popups/tooltips
3. Make each category use safe inset values.
4. Prevent top floating controls from colliding with the command bar.
5. Prevent right floating controls from sitting under the right dock.
6. Prevent bottom floating controls from colliding with status/bottom panels.
7. Ensure map furniture remains reachable by keyboard.
8. Do not change the underlying map behavior.

Expected output:
- List every floating map control found.
- State which controls were changed.
- State which controls still need later migration.
- Provide change summary, risks, test notes, and follow-up.

Validation:
- Typecheck
- Lint
- Existing map tests
- Manual visual check:
  - default modal
  - left panel open
  - right dock open
  - bottom panel/status visible
  - short-height viewport

Acceptance criteria:
- Floating controls do not overlap core modal regions.
- Control placement is token-based or safe-inset-based.
- No feature is removed.
```

---

## Prompt 07 - Phase 1: Add containment rules for popups, tooltips, dropdowns, and dialogs

Map Explorer Local Prompt Executor: Prompt 07

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 1 - Audit-safe layout fixes.

Goal:
Prevent popups, tooltips, menus, dropdowns, and dialogs from covering critical controls or rendering outside the modal viewport.

Branch:
Use `ui/map-modal-layout-stabilization-p1`.

Hard constraints:
- Do not replace the existing UI library.
- Do not add new dependencies.
- Do not remove existing menu/dialog content.
- Do not disable workflows.
- Do not commit directly to `main` or `master`.

Target files:
Search and update relevant files:
- map popups in `MapCanvas`
- import/export dialogs
- publish/report dialogs
- command menus
- toolbar dropdowns
- layer panel menus
- right dock menus
- QA/evidence popovers
- tooltip components
- shared overlay or portal utilities
- tests covering overlay behavior

Specific implementation requirements:
1. Identify overlay types and their positioning method.
2. Ensure overlays have max width and max height appropriate to the modal.
3. Ensure long content scrolls internally instead of escaping the viewport.
4. Ensure modal close controls are not covered by routine popovers.
5. Ensure critical dialog actions remain visible or fixed in the dialog footer.
6. Ensure Escape behavior is not broken.
7. Ensure focus remains inside dialogs where appropriate.
8. Avoid broad visual redesign.

Expected output:
- Overlay inventory.
- Changes made.
- Risks.
- Test notes.
- Known follow-up items.

Validation:
- Typecheck
- Lint
- Targeted overlay/dialog tests if present
- Manual states:
  - map feature popup with many attributes
  - toolbar dropdown near right edge
  - import/export dialog
  - publish/report dialog
  - QA/evidence popover
  - short-height viewport

Acceptance criteria:
- Overlays do not clip critical actions.
- Long overlay content is scrollable.
- Keyboard Escape and focus behavior remain intact.
```

---

## Prompt 08 - Phase 1: Make the status bar production-readable

Map Explorer Local Prompt Executor: Prompt 08

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 1 - Audit-safe layout fixes.

Goal:
Improve Map Explorer status bar readability and priority handling without removing any status semantics.

Branch:
Use `ui/map-modal-layout-stabilization-p1`.

Hard constraints:
- Do not remove CRS, QA, provider, sync, performance, selection, task, layer, measure, draw, cursor, viewport, or project status semantics.
- Do not hide critical warnings in overflow.
- Do not turn the status bar into a decorative area.
- Do not commit directly to `main` or `master`.

Target files:
- `src/centerpanel/components/map/MapStatusBar.tsx`
- status-related styles/tokens
- tests for status bar or layout overlap

Specific implementation requirements:
1. Inventory all status segments.
2. Classify them by priority:
   - critical warning/blocker
   - user-actionable current state
   - contextual metadata
   - low-priority runtime information
3. Ensure critical CRS/QA/provider warnings are visible and not hidden by low-priority metadata.
4. Group status segments into readable clusters:
   - view/map state
   - data/CRS/QA state
   - runtime/performance/sync state
5. Preserve existing overflow behavior if it works, but make overflow priority explicit.
6. Avoid making the status bar taller unless absolutely necessary.
7. Ensure short-height layouts remain usable.

Expected output:
- Status segment inventory.
- Priority rules added or clarified.
- Files changed.
- Risks.
- Validation and follow-up.

Validation:
- Typecheck
- Lint
- status bar tests if present
- manual check:
  - many layers
  - active selection
  - active measure/draw
  - CRS warning
  - QA warning
  - provider warning
  - narrow/short viewport

Acceptance criteria:
- Critical warnings remain visible.
- Status content is grouped and scannable.
- No status semantics are removed.
```

---

## Prompt 09 - Phase 1: Add or update layout regression tests

Map Explorer Local Prompt Executor: Prompt 09

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 1 - Audit-safe layout fixes.

Goal:
Add or update tests that protect the Map Explorer shell from overlap, clipping, and unreachable controls.

Branch:
Use `ui/map-modal-layout-stabilization-p1`.

Hard constraints:
- Do not delete existing tests.
- Do not weaken tests to hide regressions.
- Do not rely only on screenshots if DOM/layout assertions can be stable.
- Do not commit directly to `main` or `master`.

Target files:
- existing Map Explorer e2e tests
- Playwright tests for smoke, a11y, layout, overlap, clipped text, or functional map modal behavior
- test helpers/selectors
- package scripts only if an existing script needs a clear alias

Specific test requirements:
Add or update coverage for:
1. Modal open state has visible shell, header, map canvas, close control.
2. Left panel open state does not cover modal close controls or right dock controls.
3. Right dock open state does not cover map floating controls.
4. Bottom/status panel does not cover map controls.
5. Short-height viewport still exposes close control and a usable map canvas.
6. Import/export dialog keeps primary/secondary actions reachable.
7. QA/CRS warning surfaces remain visible when present.
8. Floating controls do not overlap one another at baseline desktop viewport.

Preferred validation style:
- Use `data-testid` where available.
- Use role/name queries for user-facing controls.
- Use bounding-box overlap checks only where necessary.
- Avoid fragile text-only selectors for labels likely to change.

Expected output:
- Tests added or updated.
- Selectors used.
- Any missing stable selectors.
- Commands run.
- Known limitations.

Validation:
Run the most specific e2e/layout test first.
Then run:
- `npm run typecheck`
- `npm run lint:errors`
- relevant e2e suite
- `npm run build` if needed

Acceptance criteria:
- Tests fail meaningfully on overlap/clipping regressions.
- Tests do not require live external map providers unless already mocked.
- Phase 1 branch is ready for PR review.
```

---

## Prompt 10 - Phase 2: Inventory header and command surfaces

Map Explorer Local Prompt Executor: Prompt 10

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 2 - Header and command bar simplification.

Goal:
Inventory all Map Explorer header, command, toolbar, and modal control surfaces before changing command hierarchy.

Branch:
Create or use `ui/map-modal-command-bar-p2`.

Hard constraints:
- Do not edit code in this prompt unless only adding documentation notes.
- Do not remove commands.
- Do not change command behavior.
- Do not commit directly to `main` or `master`.

Target areas:
Search for:
- modal header
- command bar
- top command surface
- toolbar
- command palette
- map controls
- modal controls
- close/minimize/dock/expand buttons
- search controls
- CRS/project/active layer indicators
- overflow menus

Expected output:
Create a Markdown command inventory with:

1. Command surface list
   For each surface:
   - file path
   - visible role
   - command types shown
   - whether it is global, contextual, panel-local, or map-overlay

2. Command duplication map
   Identify duplicate or near-duplicate actions such as:
   - layers
   - import
   - export
   - QA
   - diagnostics
   - reset layout
   - search
   - selection
   - draw/measure
   - publish/report

3. Primary/secondary command classification
   Classify commands into:
   - always visible
   - visible only when relevant
   - overflow menu
   - command palette
   - panel-local action
   - advanced/developer-only

4. Modal control audit
   Evaluate:
   - close placement
   - dock placement
   - expand/minimize placement
   - visual separation from map tools
   - unsafe exit risks

5. Phase 2 implementation recommendation
   - Which commands should remain visible.
   - Which should move to overflow.
   - Which should become panel-local.
   - Which need clearer labels or tooltips.

No code changes yet. This prompt prepares the command simplification implementation.
```

---

## Prompt 11 - Phase 2: Stabilize header and modal control hierarchy

Map Explorer Local Prompt Executor: Prompt 11

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 2 - Header and command bar simplification.

Goal:
Make modal title, context indicators, and modal controls predictable, calm, and production-grade.

Branch:
Use `ui/map-modal-command-bar-p2`.

Hard constraints:
- Do not remove close/dock/expand/minimize behavior if it exists.
- Do not change unsaved-work behavior unless it is clearly broken and covered by tests.
- Do not mix modal controls with map tools.
- Do not introduce new dependencies.
- Do not commit directly to `main` or `master`.

Target files:
- `src/centerpanel/components/MapExplorerModal.tsx`
- `src/centerpanel/components/MapExplorerModalComposition.tsx`
- `src/centerpanel/components/map/MapWorkspaceShell.tsx`
- `src/centerpanel/components/map/MapTopCommandSurface.tsx`
- related modal control components and tests

Specific implementation requirements:
1. Ensure the modal control cluster has a stable top-right location.
2. Ensure close/dock/expand/minimize controls have:
   - accessible labels
   - visible focus state
   - clear hit target
   - consistent order
3. Separate modal-level controls from map-level controls.
4. Keep title/breadcrumb concise.
5. Move non-modal actions out of the modal control cluster.
6. Preserve all existing behavior.
7. Add tests if control order/visibility is now guaranteed.

Expected output:
review-ready summary:
- What changed
- Files changed
- Risks
- Test notes
- Follow-up recommendations

Validation:
- Typecheck
- Lint
- modal open/close tests
- keyboard test for modal controls
- manual visual check at desktop, tablet, short-height viewports

Acceptance criteria:
- Modal controls are always findable.
- Modal controls do not compete with map tools.
- Header looks like a professional workspace shell, not a crowded demo toolbar.
```

---

## Prompt 12 - Phase 2: Regroup toolbar actions into visible, overflow, and contextual commands

Map Explorer Local Prompt Executor: Prompt 12

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 2 - Header and command bar simplification.

Goal:
Reduce visible toolbar density while preserving all commands through clear visible, overflow, command-palette, or contextual placement.

Branch:
Use `ui/map-modal-command-bar-p2`.

Hard constraints:
- Do not delete commands.
- Do not remove feature entry points.
- Do not bury critical CRS/QA warnings.
- Do not introduce dependencies.
- Do not commit directly to `main` or `master`.

Target files:
- `src/centerpanel/components/map/MapToolbar.tsx`
- `src/centerpanel/components/map/MapTopCommandSurface.tsx`
- command palette components
- contextual panel action components
- toolbar tests

Specific implementation requirements:
1. Define command groups:
   - View
   - Data
   - Analyze
   - Evidence/QA
   - Export/Publish
   - Advanced
2. Keep only high-frequency commands visible by default.
3. Move secondary commands into overflow or command palette.
4. Move context-specific actions into their relevant panel when possible.
5. Keep dangerous/reset actions separated from routine actions.
6. Ensure all icon-only commands have tooltips and accessible names.
7. Ensure keyboard navigation still reaches all commands.
8. Preserve command handlers and analytics semantics.

Suggested visible commands:
- search or command palette trigger
- layer/data entry point
- primary analyze entry point
- QA/evidence status/action entry point
- export/publish entry point
- view/reset or layout menu as overflow, not a visually dominant button unless already justified

Expected output:
- Command grouping table.
- Commands moved to overflow or contextual locations.
- Files changed.
- Risks.
- Test notes.
- Follow-up.

Validation:
- Typecheck
- Lint
- toolbar/command tests
- e2e smoke for common workflows:
  - open layer panel
  - import data
  - run/open analysis
  - open QA/evidence
  - export/publish/report
  - reset layout if available

Acceptance criteria:
- Visible toolbar density is reduced.
- Every existing command remains reachable.
- Primary vs secondary actions are clearer.
```

---

## Prompt 13 - Phase 2: Standardize icon-only buttons and action affordances

Map Explorer Local Prompt Executor: Prompt 13

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 2 - Header and command bar simplification.

Goal:
Make icon-only buttons production-ready across the Map Explorer modal.

Branch:
Use `ui/map-modal-command-bar-p2`.

Hard constraints:
- Do not replace the icon system.
- Do not add dependencies.
- Do not remove buttons.
- Do not make disabled buttons look active.
- Do not commit directly to `main` or `master`.

Target files:
Search all Map Explorer components for icon-only buttons:
- toolbar buttons
- modal controls
- layer row buttons
- floating map controls
- panel tab buttons
- dock buttons
- dialog buttons
- dropdown triggers
- close buttons

Specific implementation requirements:
1. Create or use a consistent button primitive if one already exists.
2. Ensure icon-only buttons have:
   - `aria-label` or accessible name
   - tooltip where appropriate
   - visible focus state
   - hover/active/pressed state
   - disabled state that is not color-only
   - minimum target size suitable for production desktop
3. Do not force every button to be large if it breaks density; prefer a clear desktop minimum and a touch-mode adjustment.
4. Ensure pressed/toggled map tools use semantic state such as `aria-pressed` where appropriate.
5. Ensure destructive actions are visually separated and clearly labeled.
6. Add tests for accessible names if coverage exists.

Expected output:
- Button inventory.
- Shared rules applied.
- Files changed.
- Risks.
- Test notes.
- Follow-up.

Validation:
- Typecheck
- Lint
- accessibility tests
- keyboard-only spot check
- manual check of hover/focus/disabled/active states

Acceptance criteria:
- Icon-only buttons are understandable.
- Focus is visible.
- Disabled states are clear.
- Map tool state is semantically exposed where possible.
```

---

## Prompt 14 - Phase 2: Calm search, CRS, project, and active layer indicators in the header

Map Explorer Local Prompt Executor: Prompt 14

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 2 - Header and command bar simplification.

Goal:
Make search, CRS, project, and active layer information readable without making the header feel overcrowded.

Branch:
Use `ui/map-modal-command-bar-p2`.

Hard constraints:
- Do not remove CRS visibility.
- Do not hide QA or CRS warnings.
- Do not remove active layer or project context if currently available.
- Do not delete search.
- Do not commit directly to `main` or `master`.

Target files:
- `MapTopCommandSurface`
- `MapWorkspaceShell`
- `MapToolbar`
- active layer/project/CRS indicator components
- status bar if some information should move there
- relevant tests

Specific implementation requirements:
1. Identify all header metadata:
   - project/workspace
   - active layer
   - CRS
   - QA state
   - search
   - mode/tool state
2. Decide which belongs in:
   - header title/breadcrumb
   - compact status chip
   - command surface
   - status bar
   - panel detail
3. Keep warnings visible, but reduce routine metadata noise.
4. Prefer compact labels and predictable truncation.
5. Ensure truncated content has tooltip or accessible full label if needed.
6. Avoid duplicating the same CRS/QA/project signal in multiple visible places unless there is a reason.

Expected output:
- Metadata placement map.
- Changes made.
- Files changed.
- Risks.
- Test notes.
- Follow-up.

Validation:
- Typecheck
- Lint
- tests for CRS/QA visibility if present
- visual checks with long project name and long layer name
- narrow viewport check

Acceptance criteria:
- Header is calmer.
- Critical CRS/QA states remain visible.
- Search remains usable.
- Long labels do not break layout.
```

---

## Prompt 15 - Phase 2: Add or update command/header regression tests

Map Explorer Local Prompt Executor: Prompt 15

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 2 - Header and command bar simplification.

Goal:
Protect the new modal header and command hierarchy with tests.

Branch:
Use `ui/map-modal-command-bar-p2`.

Hard constraints:
- Do not delete existing test coverage.
- Do not weaken tests for convenience.
- Do not make tests depend on external provider availability.
- Do not commit directly to `main` or `master`.

Test requirements:
Add or update tests for:
1. Modal header renders with stable title/context.
2. Close control is visible and keyboard reachable.
3. Dock/expand/minimize controls are visible if supported.
4. Visible command groups render.
5. Overflow commands remain reachable.
6. All icon-only visible commands have accessible names.
7. Search remains reachable and usable.
8. CRS/QA warnings remain visible when present.
9. Dangerous/reset actions are not visually grouped with primary routine commands.
10. Header does not clip at compact desktop width.

Target files:
- Map Explorer e2e tests
- accessibility tests
- toolbar/command unit tests if present
- test helpers/selectors

Expected output:
- Tests added/updated.
- Selectors used.
- Commands run.
- Known limitations.
- change summary for Phase 2.

Validation:
Run:
- `npm run typecheck`
- `npm run lint:errors`
- relevant command/header tests
- relevant accessibility tests
- build if needed

Acceptance criteria:
- Tests validate command reachability without forcing every command to remain visible.
- Header regressions are caught.
- Phase 2 branch is ready for PR review.
```

---

## Prompt 16 - Phase 3: Audit panel density and information architecture

Map Explorer Local Prompt Executor: Prompt 16

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Audit every Map Explorer panel before changing layout or density.

Branch:
Create or use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not edit code in this prompt unless only adding audit documentation.
- Do not remove scientific, GIS, CRS, QA, evidence, diagnostics, export, publish, or analytical information.
- Do not simplify by deleting required details.
- Do not commit directly to `main` or `master`.

Panels to audit:
- left panel/layer panel
- layer rows
- catalog/source/import areas
- right dock
- inspector/properties
- attributes
- problems
- timeline
- tasks
- diagnostics
- pins
- draw/measure
- selection
- scientific QA
- QA
- workflow
- report
- performance
- collaboration
- urban method
- evidence surfaces
- export/publish surfaces
- bottom panel/status/log surfaces

Expected output:
Create a Markdown panel audit with:

1. Panel inventory
   - path
   - responsibility
   - visible sections
   - interaction density
   - current risks

2. Density rating
   Rate each panel:
   - Low
   - Medium
   - High
   - Excessive

3. Production readability issues
   Identify:
   - weak grouping
   - too many peer actions
   - long unstructured text
   - overuse of chips/badges
   - hard-to-scan labels
   - unclear primary actions
   - debug-like details
   - scientific details without hierarchy

4. Proposed hierarchy
   For each panel:
   - summary content
   - primary action
   - secondary action
   - collapsible details
   - advanced/raw data

5. Implementation order
   Recommend the safest order for Phase 3 edits.

No functional changes in this prompt.
```

---

## Prompt 17 - Phase 3: Improve left panel and layer panel grouping

Map Explorer Local Prompt Executor: Prompt 17

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Make the left panel/layer panel easier to scan while preserving all layer, source, catalog, CRS, QA, selection, and import semantics.

Branch:
Use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not remove layer operations.
- Do not remove source/catalog/import entry points.
- Do not remove CRS/QA warnings.
- Do not remove layer metadata; move details into progressive disclosure if needed.
- Do not commit directly to `main` or `master`.

Target files:
- `src/centerpanel/components/map/MapLayerPanel.tsx`
- layer list/row components
- catalog/source/import panel components
- left dock shell components
- tests related to layers/import/catalog

Specific implementation requirements:
1. Structure the left panel into clear sections:
   - Layers
   - Sources
   - Contents
   - Selection
   - Layer QA
2. Ensure each section has:
   - clear title
   - concise summary state
   - primary action if relevant
   - collapsible details for advanced metadata
3. Keep active layer visually clear.
4. Keep visibility/order/opacity controls available.
5. Prevent routine metadata from overwhelming layer names.
6. Avoid showing every row action at the same visual weight.
7. Preserve keyboard navigation and focus order.

Expected output:
- Summary of grouping changes.
- Files changed.
- Risks.
- Test notes.
- Follow-up.

Validation:
- Typecheck
- Lint
- layer panel tests
- import/source tests if affected
- manual check:
  - no layers state
  - one layer
  - many layers
  - active layer
  - layer warning
  - narrow panel width

Acceptance criteria:
- Left panel is scannable.
- All layer actions remain reachable.
- CRS/QA layer warnings remain visible.
- No layer functionality is removed.
```

---

## Prompt 18 - Phase 3: Reduce layer row action density and improve touch/focus behavior

Map Explorer Local Prompt Executor: Prompt 18

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Make layer row actions easier to understand and operate without deleting functionality.

Branch:
Use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not remove visibility, ordering, opacity, rename, inspect, zoom, duplicate, remove, or metadata actions if they exist.
- Do not make destructive actions easier to trigger accidentally.
- Do not rely only on hover for keyboard users.
- Do not commit directly to `main` or `master`.

Target files:
- layer row components
- `MapLayerPanel`
- legacy `LayerManager` only if still active in Map Explorer
- shared button/menu components
- layer row tests

Specific implementation requirements:
1. Identify all row actions.
2. Classify actions:
   - primary row actions
   - secondary row actions
   - destructive actions
   - advanced metadata actions
3. Keep only the highest-value row actions visible by default.
4. Move secondary actions into a row menu.
5. Keep row menu reachable by keyboard.
6. Make destructive actions clearly separated inside the menu.
7. Ensure visible row controls meet production target size expectations.
8. Preserve opacity and ordering controls without overcrowding the row.
9. Make active/focused/selected layer states visually distinct.

Expected output:
- Layer row action classification.
- UI changes made.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- layer row tests
- keyboard check:
  - tab to row
  - open row menu
  - activate visibility
  - adjust opacity if available
  - reach destructive action intentionally

Acceptance criteria:
- Layer rows are less crowded.
- All previous row actions remain reachable.
- Destructive actions are safer.
- Keyboard and focus behavior remain usable.
```

---

## Prompt 19 - Phase 3: Apply right dock primary/secondary hierarchy

Map Explorer Local Prompt Executor: Prompt 19

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Make the right dock feel like a professional inspector/activity panel rather than a crowded list of equal tabs.

Branch:
Use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not delete any right dock panel.
- Do not remove inspector, attributes, problems, timeline, tasks, diagnostics, pins, draw, measure, selection, scientific QA, QA, workflow, report, performance, collaboration, or urban method semantics if present.
- Do not make advanced panels unreachable.
- Do not commit directly to `main` or `master`.

Target files:
- `src/centerpanel/components/map/MapRightDockHost.tsx`
- right dock tab/list components
- inspector/properties components
- tests for right dock behavior

Specific implementation requirements:
1. Classify dock panels:
   - primary panels
   - contextual panels
   - advanced panels
   - diagnostics/developer-style panels
2. Keep only a small number of primary panels visible by default.
3. Move secondary panels to overflow, grouped menu, command palette, or contextual activation.
4. Keep all panels reachable.
5. Preserve active panel state and deep-link/state behavior if present.
6. Use clear labels for panel groups.
7. Avoid exposing internal legacy/source/activity metadata as normal user-facing content.
8. Ensure keyboard navigation still reaches every dock panel.

Suggested visible primary panels:
- Inspect
- Layers/Attributes or Properties
- Problems/QA
- Evidence/Report
- Tools/Workflow
- Diagnostics only if required by product mode

Expected output:
- Panel classification table.
- Visible vs overflow changes.
- Files changed.
- Risks.
- Test notes.
- Follow-up.

Validation:
- Typecheck
- Lint
- right dock tests
- keyboard check for tab/arrow behavior
- visual check at desktop and tablet widths

Acceptance criteria:
- Right dock has clearer hierarchy.
- All panels remain reachable.
- Primary panels are not visually drowned by advanced panels.
```

---

## Prompt 20 - Phase 3: Make inspector and properties panels summary-first

Map Explorer Local Prompt Executor: Prompt 20

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Make inspector/properties content easier to scan by presenting summary first, actions second, and raw/advanced details later.

Branch:
Use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not remove attributes, geometry, CRS, QA, source, evidence, or analytical metadata.
- Do not hide warnings behind closed accordions.
- Do not remove editing/inspection actions.
- Do not commit directly to `main` or `master`.

Target files:
- inspector panel components
- attributes/properties components
- selection detail components
- QA/evidence detail components if embedded in inspector
- tests for inspection/selection

Specific implementation requirements:
1. For selected feature/layer/project:
   - show identity/title first
   - show critical warning state next
   - show primary action
   - show core metadata
   - show detailed attributes in a structured area
   - show raw/source details collapsed
2. Avoid long unstructured paragraphs.
3. Use section headers and compact tables/lists where appropriate.
4. Ensure empty selection state is useful.
5. Ensure loading and error states are explicit.
6. Ensure technical details remain available.

Expected output:
- Inspector hierarchy before/after summary.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- inspector/selection tests
- manual states:
  - no selection
  - one selected feature
  - multiple selected features
  - feature with many attributes
  - feature with warning/error
  - loading/error state

Acceptance criteria:
- Inspector is summary-first.
- Warnings remain visible.
- Raw technical detail is available but not visually dominant.
```

---

## Prompt 21 - Phase 3: Organize evidence, export, and publish surfaces with progressive disclosure

Map Explorer Local Prompt Executor: Prompt 21

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Make evidence, export, publish, and report surfaces production-trustworthy without overstating analytical readiness.

Branch:
Use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not remove evidence, export, publish, report, CRS, QA, caveat, provider, provenance, or analytical metadata.
- Do not hide critical warnings.
- Do not claim external/provider execution depth that the repository does not support.
- Do not commit directly to `main` or `master`.

Target files:
Search and update relevant:
- evidence panels
- export dialogs
- publish dialogs
- report/figure composer surfaces
- QA/caveat components
- provenance/source detail components
- tests for export/publish/evidence

Specific implementation requirements:
1. Organize evidence into:
   - summary
   - readiness status
   - key caveats
   - methods/provenance
   - raw details
2. Organize export/publish dialogs into:
   - target/format selection
   - readiness checks
   - caveats
   - options
   - primary/secondary actions
3. Keep dialog footers stable and actions reachable.
4. Use truthful language:
   - avoid implying validated production analytics where only visible or mocked surfaces exist
   - separate completed checks from pending checks
   - distinguish provider-gated features from local/demo features
5. Preserve all export/publish options.
6. Ensure long evidence content scrolls internally.

Expected output:
- Evidence/export/publish hierarchy summary.
- Language changes if any.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- export/publish tests
- evidence/QA tests
- manual states:
  - ready state
  - warning state
  - provider-gated state
  - validation failed state
  - long evidence state

Acceptance criteria:
- Evidence is easier to evaluate.
- Export/publish actions are not misleading.
- Critical caveats are visible.
- Functionality is preserved.
```

---

## Prompt 22 - Phase 3: Make diagnostics, logs, QA, and performance panels production-appropriate

Map Explorer Local Prompt Executor: Prompt 22

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Keep diagnostics powerful but make them read as production operational surfaces rather than exposed developer internals.

Branch:
Use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not remove diagnostics, logs, QA, performance, provider, or recovery information.
- Do not hide critical errors.
- Do not expose test-only/debug-only controls as production actions.
- Do not commit directly to `main` or `master`.

Target files:
- diagnostics panels
- performance diagnostics panel
- QA panels
- log panels
- problems panel
- error recovery components
- tests for diagnostics/QA/performance

Specific implementation requirements:
1. Classify diagnostics:
   - blockers
   - warnings
   - informational status
   - developer/raw detail
2. Show blockers and warnings first.
3. Keep raw logs collapsed by default.
4. Use user-actionable language for production view.
5. Move technical internals into an advanced/details section.
6. Ensure recovery actions are clear and safe.
7. Do not show test seam wording or mock/debug labels in normal production UI unless clearly intentional.
8. Preserve performance budget and provider state semantics.

Expected output:
- Diagnostics classification.
- Changes made.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- diagnostics/QA tests
- manual states:
  - no issues
  - warning
  - blocker/error
  - provider unavailable
  - performance warning
  - raw log expanded

Acceptance criteria:
- Diagnostics are severity-first.
- Raw logs are available but not dominant.
- Production users see actionable language.
- Debug-like surfaces are contained.
```

---

## Prompt 23 - Phase 3: Add or update panel density regression tests

Map Explorer Local Prompt Executor: Prompt 23

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 3 - Panel hierarchy and density cleanup.

Goal:
Add tests that protect panel hierarchy, visibility, and preserved functionality after density cleanup.

Branch:
Use `ui/map-modal-panel-density-p3`.

Hard constraints:
- Do not delete tests.
- Do not weaken functional coverage.
- Do not assert exact visual text where a stable role/test id is more appropriate.
- Do not commit directly to `main` or `master`.

Test requirements:
Add or update tests for:
1. Left panel section structure.
2. Active layer visibility.
3. Layer row menu reachability.
4. Destructive layer action separation if applicable.
5. Right dock primary panels visible.
6. Right dock secondary panels reachable through overflow or equivalent.
7. Inspector summary-first content.
8. Evidence warnings and caveats visible.
9. Export/publish primary actions reachable.
10. Diagnostics blockers/warnings visible before raw logs.
11. Raw logs/details still reachable.
12. Empty/loading/error states for panels.

Target files:
- layer panel tests
- right dock tests
- inspector tests
- evidence/export/publish tests
- diagnostics/QA tests
- e2e tests if component-level coverage is not enough

Expected output:
- Test files changed.
- Behavior covered.
- Commands run.
- Known limitations.
- Phase 3 change summary.

Validation:
Run:
- Typecheck
- Lint
- targeted tests
- relevant e2e tests
- build if applicable

Acceptance criteria:
- Tests prove features were preserved.
- Tests protect the new hierarchy.
- Phase 3 branch is ready for PR review.
```

---

## Prompt 24 - Phase 4: Unify z-index and elevation discipline

Map Explorer Local Prompt Executor: Prompt 24

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 4 - Collision, z-index, and scroll fixes.

Goal:
Replace ad hoc Map Explorer stacking behavior with named elevation/z-index rules.

Branch:
Create or use `fix/map-modal-collision-zindex-p4`.

Hard constraints:
- Do not introduce a new styling framework.
- Do not add dependencies.
- Do not remove overlays, popovers, dialogs, panels, or controls.
- Do not commit directly to `main` or `master`.

Target files:
- `src/centerpanel/components/map/design/mapTokens.ts`
- modal shell styles
- map overlay controls
- popover/menu/dropdown/dialog components
- legacy map controls only if used in Map Explorer
- tests for overlap/collision

Specific implementation requirements:
1. Inventory z-index values used in Map Explorer-related files.
2. Define named layers, for example:
   - canvas
   - map furniture
   - panel
   - command bar
   - dropdown
   - popover
   - dialog
   - toast
   - modal chrome
3. Replace local magic z-index numbers where safe.
4. Keep compatibility with existing global app layering.
5. Ensure dialogs are above popovers.
6. Ensure modal controls are not hidden by routine overlays.
7. Ensure tooltips do not block critical interactions.
8. Avoid unrelated styling changes.

Expected output:
- Z-index inventory.
- Named elevation model.
- Changes made.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- overlap/collision tests
- manual overlay checks:
  - toolbar dropdown
  - layer row menu
  - map popup
  - import/export dialog
  - right dock popover
  - tooltip near modal controls

Acceptance criteria:
- Named layering is clear.
- Critical controls remain accessible.
- No overlay unexpectedly sits above dialogs.
```

---

## Prompt 25 - Phase 4: Strengthen popover, dropdown, and menu collision behavior

Map Explorer Local Prompt Executor: Prompt 25

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 4 - Collision, z-index, and scroll fixes.

Goal:
Make menus, popovers, dropdowns, and tooltips collision-aware within the Map Explorer modal.

Branch:
Use `fix/map-modal-collision-zindex-p4`.

Hard constraints:
- Do not introduce an overlay positioning dependency.
- Do not remove menu items.
- Do not disable existing interactions.
- Do not commit directly to `main` or `master`.

Target files:
- toolbar dropdown/menu components
- layer row menus
- right dock overflow menus
- command palette/menu components
- QA/evidence popovers
- tooltip wrappers
- shared overlay utilities

Specific implementation requirements:
1. Identify overlays that can render near viewport edges.
2. Add or enforce placement fallback:
   - flip vertically if insufficient space below
   - align inward near right edge
   - cap max height
   - allow internal scroll
3. Ensure keyboard navigation remains valid after placement changes.
4. Ensure focus does not move behind open popovers.
5. Ensure tooltips do not cover the control they describe.
6. Keep implementation simple and local.

Expected output:
- Overlay collision fixes.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- targeted overlay tests
- manual checks:
  - top-right toolbar menu
  - bottom-right menu
  - layer row menu near bottom of panel
  - right dock overflow near right edge
  - QA/evidence popover with long content

Acceptance criteria:
- Overlays remain inside the modal viewport.
- Menu items remain reachable.
- Keyboard behavior is not degraded.
```

---

## Prompt 26 - Phase 4: Fix scroll containment and short-height viewport behavior

Map Explorer Local Prompt Executor: Prompt 26

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 4 - Collision, z-index, and scroll fixes.

Goal:
Ensure Map Explorer content remains accessible in short-height and dense-panel states.

Branch:
Use `fix/map-modal-collision-zindex-p4`.

Hard constraints:
- Do not hide required content permanently.
- Do not remove panels.
- Do not create scroll traps.
- Do not commit directly to `main` or `master`.

Target files:
- modal shell
- left panel
- right dock
- bottom panel
- status bar
- dialogs
- evidence/diagnostics panels
- import/export/publish dialogs
- CSS/token files

Specific implementation requirements:
1. Identify scroll containers.
2. Ensure there is one clear scroll region per panel body.
3. Keep panel headers and important actions stable where appropriate.
4. Keep dialog actions reachable in short-height viewports.
5. Prevent the body/page behind the modal from becoming the primary scroll target.
6. Ensure map canvas does not shrink below a practical minimum if avoidable.
7. If collapse behavior exists, prefer collapsing non-critical bottom surfaces before shrinking the map too far.
8. Add max-height rules for dense panels and dialogs.

Expected output:
- Scroll containment map.
- Changes made.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- short-height e2e/manual check at 1366x640 and 1280x600
- tablet portrait check
- dialog scroll check
- keyboard tab check inside scrollable panels

Acceptance criteria:
- No critical content is inaccessible.
- Dialog actions remain reachable.
- The map remains usable in short-height states.
- No scroll trap is introduced.
```

---

## Prompt 27 - Phase 4: Reconcile legacy map controls with canonical modal controls

Map Explorer Local Prompt Executor: Prompt 27

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 4 - Collision, z-index, and scroll fixes.

Goal:
Identify and resolve conflicts between legacy map control components and the canonical Map Explorer modal controls.

Branch:
Use `fix/map-modal-collision-zindex-p4`.

Hard constraints:
- Do not delete legacy components unless they are confirmed unused and removal is separately justified.
- Do not break routes outside Map Explorer.
- Do not remove controls from the Map Explorer user experience.
- Do not commit directly to `main` or `master`.

Target files:
Search for:
- `src/components/map/*`
- `src/centerpanel/components/map/*`
- any imports of legacy `MapControls`, `LayerManager`, or similar components
- map modal composition files
- tests that render legacy controls

Specific implementation requirements:
1. Determine whether legacy map controls are rendered inside the Map Explorer modal.
2. If legacy controls are active in the modal:
   - make them consume canonical safe insets
   - align target size and focus rules
   - prevent z-index conflicts
   - avoid duplicate controls with canonical equivalents
3. If legacy controls are not active:
   - document that they are outside the modal path
   - do not edit them unless necessary
4. Do not remove functionality without tests and explicit reasoning.
5. Update tests if the modal now uses a single canonical control path.

Expected output:
- Legacy vs canonical control map.
- Changes made or documented non-changes.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- Map Explorer smoke tests
- routes/tests that might use legacy controls
- manual modal check for duplicated controls

Acceptance criteria:
- Map Explorer does not show duplicate/competing controls.
- Legacy components do not override modal z-index/inset rules if active.
- External routes remain safe.
```

---

## Prompt 28 - Phase 4: Add collision, z-index, and scroll regression tests

Map Explorer Local Prompt Executor: Prompt 28

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 4 - Collision, z-index, and scroll fixes.

Goal:
Add tests that prevent reintroduction of Map Explorer overlap, clipping, z-index, and scroll regressions.

Branch:
Use `fix/map-modal-collision-zindex-p4`.

Hard constraints:
- Do not delete existing e2e tests.
- Do not make tests flaky through unnecessary pixel-perfect screenshots.
- Do not depend on live external map services.
- Do not commit directly to `main` or `master`.

Test requirements:
Add or update tests for:
1. Header controls are not covered by overlays.
2. Toolbar menu remains within viewport.
3. Layer row menu remains within panel or modal bounds.
4. Right dock overflow menu remains visible.
5. Map popup does not cover modal close controls.
6. Dialog footer actions remain reachable in short-height viewport.
7. Bottom/status panel does not cover floating map controls.
8. Scrollable panel body can be reached by keyboard.
9. Modal body does not create page-level scroll trap.
10. At least one short-height viewport scenario.

Expected output:
- Tests added/updated.
- Selectors and assertions used.
- Commands run.
- Known limitations.
- Phase 4 change summary.

Validation:
Run:
- Typecheck
- Lint
- targeted e2e suite
- accessibility suite if focus/scroll changes are involved
- build if needed

Acceptance criteria:
- Collision regressions fail tests.
- Tests are stable enough for CI.
- Phase 4 branch is ready for PR review.
```

---

## Prompt 29 - Phase 5: Audit keyboard and focus model

Map Explorer Local Prompt Executor: Prompt 29

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 5 - Accessibility and responsive hardening.

Goal:
Audit keyboard navigation, focus management, ARIA state, and modal interaction behavior before implementation.

Branch:
Create or use `fix/map-modal-a11y-responsive-p5`.

Hard constraints:
- Do not edit code in this prompt unless only adding audit documentation.
- Do not remove controls.
- Do not weaken accessibility tests.
- Do not commit directly to `main` or `master`.

Audit areas:
- modal open focus
- modal close focus return
- Escape key behavior
- focus trap
- command bar tab order
- toolbar roving behavior
- right dock tab behavior
- left panel keyboard behavior
- layer row keyboard behavior
- map canvas keyboard behavior
- floating controls
- dialogs
- popovers/menus
- disabled controls
- aria-expanded/pressed/selected/current
- live regions or announcements if present

Expected output:
Create a Markdown accessibility audit with:

1. Keyboard route map
   - Expected tab order through major regions.
   - Current evidence from code/tests.

2. Focus management map
   - On modal open.
   - On modal close.
   - On dialog open/close.
   - On menu open/close.
   - On panel switch.

3. ARIA state map
   - Buttons
   - Toggle tools
   - Tabs
   - Accordions
   - Menus
   - Dialogs
   - Disabled controls

4. Risks
   - Missing focus trap.
   - Weak focus visibility.
   - Long tab order.
   - Non-semantic icon buttons.
   - Disabled-state ambiguity.
   - Screen-reader-unfriendly structure.

5. Implementation order
   Recommend the safest order for Phase 5.

No functional changes in this prompt.
```

---

## Prompt 30 - Phase 5: Strengthen modal focus trap, Escape, and return-focus behavior

Map Explorer Local Prompt Executor: Prompt 30

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 5 - Accessibility and responsive hardening.

Goal:
Make Map Explorer modal focus behavior predictable and production-grade.

Branch:
Use `fix/map-modal-a11y-responsive-p5`.

Hard constraints:
- Do not break modal open/close behavior.
- Do not remove Escape behavior unless there is an explicit nested dialog conflict and tests cover the new behavior.
- Do not trap users inside a broken state.
- Do not commit directly to `main` or `master`.

Target files:
- `MapExplorerModal`
- `MapExplorerModalComposition`
- focus trap utilities/hooks
- modal shell components
- dialog components
- e2e accessibility tests

Specific implementation requirements:
1. On modal open, focus should move to a meaningful element:
   - modal heading
   - first primary control
   - or previously active region if reopening
2. Focus should remain inside the modal while it is open.
3. Nested dialogs/menus should handle Escape first.
4. Escape should close the topmost dismissible layer, not unexpectedly discard work.
5. On close, focus should return to the trigger if possible.
6. If unsaved changes exist, preserve any existing confirmation behavior.
7. Ensure focus ring is visible.

Expected output:
- Focus behavior summary.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- accessibility/e2e tests
- keyboard manual test:
  - open modal
  - tab through header
  - open dialog
  - press Escape
  - close modal
  - verify focus return

Acceptance criteria:
- Focus is predictable.
- Escape does not produce unsafe exit.
- Keyboard users can enter, operate, and leave the modal.
```

---

## Prompt 31 - Phase 5: Apply roving tabindex and ARIA state to dock and toolbar systems

Map Explorer Local Prompt Executor: Prompt 31

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 5 - Accessibility and responsive hardening.

Goal:
Improve keyboard navigation for right dock tabs, toolbar command groups, and toggle tools.

Branch:
Use `fix/map-modal-a11y-responsive-p5`.

Hard constraints:
- Do not remove keyboard access to any command.
- Do not add complex abstractions unless the repository already has a pattern for it.
- Do not commit directly to `main` or `master`.

Target files:
- right dock tab components
- toolbar components
- map tool toggles
- command group components
- tests for keyboard/a11y

Specific implementation requirements:
1. For tab-like dock controls:
   - use appropriate roles if already aligned with app conventions
   - expose selected state
   - support arrow-key movement if tablist behavior is used
   - keep only the active or focused tab in the tab sequence if using roving tabindex
2. For toggle tools:
   - expose pressed state
   - make active state visible
3. For menu triggers:
   - expose expanded state
   - connect menu relationship where practical
4. For disabled commands:
   - ensure disabled state is semantic and visible
5. Keep implementation consistent with existing component conventions.

Expected output:
- Components updated.
- ARIA states added or improved.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- accessibility tests
- keyboard manual test:
  - right dock navigation
  - toolbar command movement
  - toggle draw/measure/selection tools
  - menu open/close

Acceptance criteria:
- Keyboard navigation is shorter and more predictable.
- Active/pressed/selected states are exposed.
- Disabled controls are understandable.
```

---

## Prompt 32 - Phase 5: Harden contrast, reduced motion, high contrast, and touch targets

Map Explorer Local Prompt Executor: Prompt 32

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 5 - Accessibility and responsive hardening.

Goal:
Improve visual accessibility and interaction reliability across Map Explorer.

Branch:
Use `fix/map-modal-a11y-responsive-p5`.

Hard constraints:
- Do not introduce a new design system.
- Do not use flashy visual effects.
- Do not remove glassmorphism entirely unless it directly harms readability.
- Do not commit directly to `main` or `master`.

Target files:
- design tokens
- modal shell styles
- button styles
- panel styles
- status chip styles
- warning/error styles
- map overlay control styles
- tests for a11y/visual states

Specific implementation requirements:
1. Contrast:
   - check text over translucent surfaces
   - strengthen low-contrast metadata
   - ensure warnings/errors are readable
2. Reduced motion:
   - respect `prefers-reduced-motion`
   - avoid required information depending on animation
3. High contrast:
   - ensure boundaries, focus, and state indicators remain visible
   - do not rely on subtle blur or opacity alone
4. Touch targets:
   - improve target sizes for icon buttons and row actions
   - add responsive/touch-mode adjustment if appropriate
5. Disabled states:
   - do not use opacity alone
   - preserve accessible names

Expected output:
- Accessibility hardening summary.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- accessibility tests
- manual checks:
  - dark theme
  - high contrast mode if practical
  - reduced motion
  - touch/tablet viewport
  - disabled controls
  - warning/error chips

Acceptance criteria:
- UI remains restrained and professional.
- Focus and state are visible.
- Touch targets are safer.
- Motion and transparency do not block usability.
```

---

## Prompt 33 - Phase 5: Harden responsive panel collapse and tablet behavior

Map Explorer Local Prompt Executor: Prompt 33

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 5 - Accessibility and responsive hardening.

Goal:
Make the Map Explorer modal usable at compact desktop, tablet, and short-height sizes.

Branch:
Use `fix/map-modal-a11y-responsive-p5`.

Hard constraints:
- Do not remove panels.
- Do not hide required warnings.
- Do not make map canvas unusable.
- Do not commit directly to `main` or `master`.

Target files:
- modal shell
- left panel
- right dock
- bottom panel/status bar
- command bar
- map furniture
- responsive tokens/styles
- responsive e2e tests

Specific implementation requirements:
1. Define responsive behavior for:
   - desktop
   - compact desktop
   - tablet landscape
   - tablet portrait
   - short-height desktop
2. Prefer collapsing secondary panels before shrinking map canvas too far.
3. Ensure left and right panels have usable collapsed states.
4. Ensure command bar overflows rather than clipping.
5. Ensure status bar prioritizes critical warnings.
6. Ensure modal controls remain visible.
7. Ensure dialogs fit and scroll.
8. Ensure touch targets are adequate.

Expected output:
- Responsive behavior summary.
- Files changed.
- Risks.
- Test notes.

Validation:
- Typecheck
- Lint
- responsive e2e/manual check:
  - 1440x900
  - 1280x720
  - 1366x640
  - 1024x768
  - 768x1024

Acceptance criteria:
- No horizontal overflow.
- No clipped modal controls.
- Map remains usable.
- Panels collapse/adapt predictably.
```

---

## Prompt 34 - Phase 5: Add accessibility and responsive regression tests

Map Explorer Local Prompt Executor: Prompt 34

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 5 - Accessibility and responsive hardening.

Goal:
Add tests that protect keyboard, focus, ARIA, contrast-relevant states, and responsive behavior.

Branch:
Use `fix/map-modal-a11y-responsive-p5`.

Hard constraints:
- Do not remove existing a11y tests.
- Do not ignore serious accessibility violations.
- Do not depend on external providers.
- Do not commit directly to `main` or `master`.

Test requirements:
Add or update tests for:
1. Modal focus on open.
2. Focus trap inside modal.
3. Escape behavior for modal and nested dialogs.
4. Return focus after close.
5. Visible focus on modal controls.
6. Icon-only buttons have accessible names.
7. Toggle tools expose pressed state.
8. Dock tabs expose selected state.
9. Menus expose expanded state.
10. Disabled controls are not keyboard traps.
11. Reduced-motion mode does not hide information.
12. Tablet/compact viewport keeps close control and map canvas visible.
13. Short-height viewport keeps dialog actions reachable.

Expected output:
- Tests added/updated.
- Commands run.
- Failures and fixes.
- Known limitations.
- Phase 5 change summary.

Validation:
Run:
- Typecheck
- Lint
- accessibility tests
- responsive/layout tests
- smoke tests
- build if needed

Acceptance criteria:
- Keyboard and focus regressions fail tests.
- Responsive regressions fail tests.
- Phase 5 branch is ready for PR review.
```

---

## Prompt 35 - Phase 6: Create final visual QA matrix and screenshot states

Map Explorer Local Prompt Executor: Prompt 35

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 6 - Final visual QA and regression validation.

Goal:
Create a final visual QA matrix that proves the Map Explorer modal is production-ready after the previous phases.

Branch:
Create or use `test/map-modal-visual-qa-p6`.

Hard constraints:
- Do not make functional UI changes in this prompt unless a blocking visual bug is found and fixed with a minimal patch.
- Do not ignore visual blockers.
- Do not certify production readiness without local preview server or local visual evidence.
- Do not commit directly to `main` or `master`.

Screenshot/state matrix:
Create or update visual/e2e states for:
1. Modal default open state.
2. Left layer panel expanded.
3. Right inspector dock expanded.
4. Bottom panel/status/log/evidence visible.
5. Toolbar overflow open.
6. Layer row menu open.
7. Map popup with many attributes.
8. Import dialog.
9. Export dialog.
10. Publish/report dialog.
11. Evidence panel with warnings.
12. QA/CRS warning state.
13. Diagnostics/performance warning state.
14. Loading state.
15. Error state.
16. Empty state.
17. Disabled action state.
18. Keyboard focus state on modal controls.
19. 1440x900 viewport.
20. 1280x720 viewport.
21. 1366x640 short-height viewport.
22. 1024x768 tablet landscape.
23. 768x1024 tablet portrait.

Expected output:
- Visual QA matrix document or test update.
- Screenshot/test state list.
- Any blockers found.
- Any minimal fixes made.
- Test notes.

Validation:
- Run targeted visual/e2e tests.
- Run accessibility tests if focus/visibility issues are touched.
- Run typecheck/lint/build if any code changes are made.

Acceptance criteria:
- The QA matrix covers all critical modal states.
- Every critical state has a pass/fail result.
- Blocking visual issues are clearly listed and not hidden.
```

---

## Prompt 36 - Phase 6: Compare local build variants (dev vs preview)

Map Explorer Local Prompt Executor: Prompt 36

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 6 - Final visual QA and regression validation.

Goal:
Compare local runtime variants (`npm run dev` and local preview build) for Map Explorer modal behavior.

Branch:
Use `test/map-modal-visual-qa-p6`.

Hard constraints:
- Do not mark comparison as verified if either local runtime variant cannot be accessed.
- Do not change build/workflow configuration unless a clear local build bug is found.
- Do not commit directly to `main` or `master`.

Steps:
1. Build the app locally using repository scripts.
2. Run the app with `npm run dev`.
3. Run local preview for production build (if available in scripts).
4. Compare:
   - modal opens
   - base path assets load
   - map explorer route/view is reachable
   - header and controls render consistently
   - panels do not overlap
   - dialogs fit
   - icons/fonts/styles load
   - tests and runtime behavior agree
5. If either local runtime variant cannot be inspected, document:
   - attempted command
   - failure mode
   - whether local build passed
   - what must be checked manually later

Expected output:
- Local build result.
- Runtime command matrix checked.
- Visual comparison summary.
- Differences found.
- Build/runtime or asset issues.
- Final blockers.

Validation:
Run:
- `npm run build`
- `npm run dev` smoke check
- preview command if available
- relevant e2e/smoke tests
- manual local runtime checks

Acceptance criteria:
- Local runtime variants match closely.
- Base path does not break assets.
- No variant-specific modal layout regression is observed.
- Any unverified item is explicitly listed.
```

---

## Prompt 37 - Phase 6: Run full validation and prepare release notes

Map Explorer Local Prompt Executor: Prompt 37

```text
You are working in `SynapseIDE_urban_analytics`.

Phase:
Phase 6 - Final visual QA and regression validation.

Goal:
Run the full repository validation baseline and prepare release notes for the Map Explorer modal UI/UX stabilization work.

Branch:
Use `test/map-modal-visual-qa-p6`.

Hard constraints:
- Do not claim tests passed unless they were run.
- Do not hide failing tests.
- Do not call the UI production-grade if critical visual or accessibility blockers remain.
- Do not commit directly to `main` or `master`.

Validation commands:
Run the available equivalents from `package.json`, preferably:
- `npm run typecheck`
- `npm run lint:errors`
- `npm run test`
- `npm run build`
- `npm run test:e2e:smoke`
- `npm run test:e2e:a11y`
- `npm run test:e2e:functional`
- `npm run validate:rc`

If a command is missing, state that it is missing and use the closest available command.

Release note content:
Create a release note or review-ready validation note with:

1. Summary
   - What the stabilization series changed.
   - Whether production readiness improved.
   - Remaining caveats.

2. Branches/PRs included
   - Phase 1 branch
   - Phase 2 branch
   - Phase 3 branch
   - Phase 4 branch
   - Phase 5 branch
   - Phase 6 branch

3. Files changed by area
   - shell/layout
   - command/header
   - left panel
   - right dock
   - bottom/status
   - evidence/export/publish
   - diagnostics/QA
   - accessibility
   - responsive
   - tests

4. Validation results
   - command
   - pass/fail/skipped
   - notes

5. Known risks
   - provider-gated flows
   - live local preview server verification gaps
   - external map service variability
   - screenshot flakiness
   - browser differences

6. Final recommendation
   - merge order
   - whether any phase must be revised
   - whether a production signoff is justified

Expected output:
- Release/validation note created or updated.
- Full validation results.
- Remaining blockers.
- Final change summary.

Acceptance criteria:
- Validation status is honest.
- No unverified claim is presented as verified.
- Release note is useful for reviewers.
```

---

## Prompt 38 - Final merge plan and PR chain recommendation

Map Explorer Local Prompt Executor: Prompt 38

```text
You are working in `SynapseIDE_urban_analytics`.

Task:
Prepare the final branch and PR chain plan for the Map Explorer modal stabilization work.

Hard constraints:
- Do not perform additional code changes unless a merge blocker is found and the user explicitly requests fixes.
- Do not recommend squashing unrelated phases together if review risk is high.
- Do not recommend a fork unless the work became a risky redesign or architectural rewrite.
- Do not commit directly to `main` or `master`.

Input to review:
- Phase 1 branch: `ui/map-modal-layout-stabilization-p1`
- Phase 2 branch: `ui/map-modal-command-bar-p2`
- Phase 3 branch: `ui/map-modal-panel-density-p3`
- Phase 4 branch: `fix/map-modal-collision-zindex-p4`
- Phase 5 branch: `fix/map-modal-a11y-responsive-p5`
- Phase 6 branch: `test/map-modal-visual-qa-p6`

Expected output:
Create a final Markdown merge plan with:

1. Executive recommendation
   Choose one:
   - small targeted fixes only
   - dedicated UI stabilization branch chain
   - larger Map Explorer modal refactor branch
   - fork only if absolutely necessary

2. Recommended merge order
   Explain why each branch should merge before the next:
   - Phase 1 layout tokens/insets
   - Phase 2 command/header
   - Phase 3 panel density
   - Phase 4 collision/z-index/scroll
   - Phase 5 accessibility/responsive
   - Phase 6 final validation

3. Per-change summary
   For each branch:
   - What changed
   - Files changed
   - Risks
   - Test notes
   - Follow-up

4. Cross-PR risks
   - conflicts
   - selector changes
   - visual snapshot updates
   - responsive behavior interactions
   - provider-gated features
   - local preview server differences

5. Reviewer checklist
   - Map remains usable
   - modal controls visible
   - no overlaps
   - command hierarchy clear
   - panels scannable
   - CRS/QA/evidence preserved
   - export/publish truthful
   - diagnostics production-appropriate
   - keyboard/focus usable
   - responsive behavior stable

6. Final production-readiness statement
   State one of:
   - ready for production UI signoff
   - ready after listed blockers
   - not production-ready yet
   - cannot be certified because live visual verification is missing

Acceptance criteria:
- The merge plan is concrete.
- Reviewers can follow it without reconstructing the full audit.
- The plan preserves the repository workflow and avoids direct commits to main/master.
```

---

## Prompt 39 - Optional: Split an oversized phase into smaller PRs

Map Explorer Local Prompt Executor: Prompt 39

```text
You are working in `SynapseIDE_urban_analytics`.

Task:
If any phase branch became too large or risky, split it into smaller PRs.

Hard constraints:
- Use this prompt only if a previous phase branch is too large for review.
- Do not rewrite unrelated history unless the repository workflow explicitly allows it.
- Do not drop tests.
- Do not commit directly to `main` or `master`.

When to use this:
Use this prompt if:
- a phase changes too many unrelated files
- tests become hard to review
- visual changes are mixed with structural changes
- accessibility changes are mixed with panel hierarchy changes
- reviewers cannot understand the PR safely

Expected output:
Create a split plan with:

1. Oversized branch
   - branch name
   - reason it is too large

2. Proposed smaller branches
   Examples:
   - `ui/map-modal-layout-tokens`
   - `ui/map-modal-shell-grid`
   - `ui/map-modal-floating-controls`
   - `ui/map-modal-status-priority`
   - `test/map-modal-layout-regression`

3. File ownership per smaller branch
   - exact files or component groups

4. Test ownership per smaller branch
   - which tests move with which PR

5. Merge order
   - dependency order
   - conflict risks

6. Reviewer notes
   - what each PR should focus on
   - what should not be reviewed in that PR

Acceptance criteria:
- Each smaller PR is focused.
- Each PR remains independently testable.
- No functionality is lost.
```

---

## Prompt 40 - Optional: Create a blocker-only fix prompt

Map Explorer Local Prompt Executor: Prompt 40

```text
You are working in `SynapseIDE_urban_analytics`.

Task:
Create and apply a blocker-only fix for a specific Map Explorer production blocker.

Hard constraints:
- Use this only for one clearly identified blocker.
- Do not mix multiple unrelated fixes.
- Do not perform opportunistic cleanup.
- Do not introduce dependencies.
- Do not commit directly to `main` or `master`.

Required input:
Before applying the fix, state:
- blocker title
- affected file(s)
- reproduction steps
- expected behavior
- actual behavior
- severity
- why it blocks production readiness

Branch:
Use a branch name like:
- `fix/map-modal-close-control-clipping`
- `fix/map-modal-dialog-footer-hidden`
- `fix/map-modal-right-dock-overlap`
- `fix/map-modal-keyboard-trap`

Implementation requirements:
1. Make the smallest safe fix.
2. Add or update a regression test.
3. Run targeted validation.
4. Do not touch unrelated surfaces.

Expected output:
- Blocker summary
- Root cause
- Files changed
- Test added/updated
- Commands run
- Residual risk
- change summary

Acceptance criteria:
- The blocker is fixed.
- Regression test fails before and passes after when practical.
- No unrelated UI changes are introduced.
```

---

## Prompt 41 - Optional: Create a reviewer-ready visual QA checklist only

Map Explorer Local Prompt Executor: Prompt 41

```text
You are working in `SynapseIDE_urban_analytics`.

Task:
Create a reviewer-ready visual QA checklist for the Map Explorer modal without changing code.

Hard constraints:
- Do not edit production code.
- Do not claim live verification unless performed.
- Do not omit known limitations.

Expected output:
Create a Markdown checklist with:

1. Environment
   - local dev URL
   - local preview URL
   - local preview server URL
   - browser/version
   - viewport sizes

2. Modal shell checks
   - close visible
   - dock/expand visible
   - title readable
   - no clipped header

3. Layout checks
   - left panel
   - right dock
   - bottom panel
   - map canvas
   - floating controls
   - popovers
   - dialogs

4. Panel checks
   - layers
   - inspector
   - evidence
   - QA/CRS
   - diagnostics
   - export/publish

5. Accessibility checks
   - keyboard navigation
   - focus visibility
   - Escape behavior
   - screen reader labels
   - disabled states
   - reduced motion
   - high contrast

6. Responsive checks
   - desktop
   - compact desktop
   - short-height
   - tablet landscape
   - tablet portrait

7. Pass/fail table
   - state
   - result
   - evidence
   - blocker if any

Acceptance criteria:
- A reviewer can use the checklist directly during PR review.
- The checklist does not require reading the whole audit first.
```

---

## Prompt 42 - Optional: Prepare a single consolidated PR description after all phases

Map Explorer Local Prompt Executor: Prompt 42

```text
You are working in `SynapseIDE_urban_analytics`.

Task:
Prepare a consolidated PR description for the full Map Explorer modal UI/UX stabilization series.

Hard constraints:
- Do not make new code changes.
- Do not invent validation results.
- Do not hide known risks.
- Do not claim production readiness if blockers remain.

Expected output:
Write a PR description with:

# Summary
Explain the Map Explorer modal stabilization work in 3-5 sentences.

# What changed
Group by:
- Layout and modal shell
- Header and command bar
- Left panel/layer panel
- Right dock/inspector
- Bottom/status/evidence/diagnostics
- Floating controls and overlays
- Accessibility and responsive behavior
- Tests and validation

# Files changed
List important files by area.

# Why this approach
Explain:
- small reversible changes
- preserved functionality
- no unnecessary dependencies
- VS Code-like professional workspace direction
- progressive disclosure instead of deleting complexity

# Risks
Include:
- visual regression risk
- provider-gated flows
- external map provider variability
- test flakiness
- possible conflicts with active branches
- local preview server differences

# Test notes
Use actual results only:
- typecheck
- lint
- unit tests
- build
- smoke e2e
- a11y e2e
- functional e2e
- validate:rc
- manual visual QA
- local preview server review

# Reviewer checklist
Include:
- modal controls visible
- no overlap
- map usable
- commands reachable
- panels scannable
- QA/CRS/evidence preserved
- export/publish truthful
- diagnostics production-appropriate
- keyboard/focus accessible
- responsive states stable

# Follow-up
List any non-blocking future work.

Acceptance criteria:
- The PR description is honest, complete, and reviewer-ready.
- It does not include unnecessary narrative.
- It matches the staged implementation plan.
```
