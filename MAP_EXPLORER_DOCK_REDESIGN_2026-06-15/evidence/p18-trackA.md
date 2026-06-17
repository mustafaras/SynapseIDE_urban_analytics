# p18 Track A — Cross-Cutting Consistency Pass

Status: done

## Scope
Audited the redesigned surfaces (drawing modal, status bar, right dock, left workspaces, Models tab)
for consistency with the shared `ui/` + `design/` primitives, tokens, and reduced-motion safety,
then harmonized the one real divergence and froze the consistency contract with tests.

## Audit result (per surface)
- **Drawing modal** (`MapDrawingManager.tsx` + `.module.css`): already consistent — shared
  `GisEmptyState` + `GisSectionHeader`, `motionStyles.panelIn`, `role="toolbar"` roving rail, and a
  `@media (prefers-reduced-motion)` block. No change needed.
- **Status bar** (`MapStatusBar.tsx`): consistent — `MAP_TYPOGRAPHY`/`MAP_SPACING` tokens, p17
  left/right cluster grouping + honest interactivity markers, and the persistence spinner stops
  animating under `reducedMotion`. No change needed.
- **Left workspace / catalog** (`catalog/MapCatalogPanel.tsx`): consistent — shared `GisEmptyState`
  and `motionStyles.panelIn`. No change needed.
- **Models builder** (`modelBuilder/MapModelBuilderPanel.tsx`): consistent — shared
  `GisSectionHeader`/`GisPropertyGrid`/`GisStatusChip`/`GisProgressBar` rhythm. Its one-line inline
  hints are intentional for a dense single-column form (a centered full `GisEmptyState` block there
  would fight the dense-premium aesthetic), so they were left as-is.
- **Right dock host** (`MapRightDockHost.tsx`): the **one real divergence** — the full-panel
  fallback empty body was bespoke markup. **Harmonized** to the shared `GisEmptyState` primitive.

## Code changes
- `MapRightDockHost.tsx`: imported `GisEmptyState`; replaced the bespoke `.emptyBody` fallback with
  `<GisEmptyState icon title description data-testid="map-right-dock-empty" />` (keeps the 12rem
  min-height fill). Reduced-motion gating of the host enter/exit motion is unchanged.
- `MapRightDockHost.module.css`: removed the now-unused `.emptyBody` class (dead CSS).
- `__tests__/mapVisualQA.test.ts`: added **"Prompt p18 cross-surface consistency contract"** — 5
  source-level guardrails freezing shared empty states, the shared reduced-motion-safe empty-state
  primitive, the Models `GisSectionHeader` rhythm, one motion system with reduced-motion gating
  across animated surfaces, and the premium tokenized/grouped/reduced-motion-honest status bar.
- `__tests__/map-accessibility.test.ts`: added **"Prompt p18 redesigned-surface reduced-motion +
  keyboard consistency"** — behavioral proof that the status-bar spinner stops animating under
  reduced motion, that actionable segments are keyboard-operable `<button>`s with labels (and inert
  segments are honestly marked non-interactive), plus source-level proof of the drawing modal
  `role="toolbar"` + reduced-motion CSS and the right dock `!reducedMotion` motion gate.
- `__tests__/map-left-panel-responsive-fit.test.ts`: harmonized a pre-existing drift — the
  Models-builder responsive-fit guardrail asserted `max-height: min(22rem, 48vh)` while the rendered
  CSS uses `min(24rem, 50vh)` (both committed together in `343ff01`). Aligned the test to the
  rendered/visually-verified CSS value so the guardrail is meaningful again.

## Verification
- `npx vitest run …/map-accessibility.test.ts …/mapVisualQA.test.ts` -> PASS (84)
- `npx vitest run src/centerpanel/components/map` -> **PASS 930/930 (97 files)**
- `npm run typecheck` -> PASS
- no-Tailwind guard: `powershell`/`pwsh` unavailable in this container (documented env limitation
  since p00); verified manually that the changed files add **no** Tailwind `className="…"` string
  literals (only `className={styles.x}` expressions + `GisEmptyState`), so the guard is unaffected.
- `npm run test:e2e:a11y` -> **5 passed / 1 failed** (ran with the browser pinned to the locally
  provisioned `chromium-1194`, since Playwright 1.59 otherwise looks for build 1217). The single
  failure is the **pre-existing** `Prompt 55 › map-inspector-host` focus-on-open expectation,
  identical to the failure recorded in p17 and unrelated to any surface p18 touched.

## Result
The redesigned surfaces read as one premium system: shared empty states (right dock harmonized),
shared section-header rhythm, one reduced-motion-gated motion system, and honest keyboard
interactivity. The consistency is now frozen by extended a11y + visual-QA tests. Map suite +
typecheck clean; a11y e2e green except the pre-existing inspector-focus scenario.
