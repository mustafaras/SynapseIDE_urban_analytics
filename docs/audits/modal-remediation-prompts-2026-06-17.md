# Modal & Dialog System — Execution Prompt Pack (20 Prompts)

| | |
|---|---|
| **Date** | 2026-06-17 |
| **Sources** | [`modal-design-audit-2026-06-17.md`](./modal-design-audit-2026-06-17.md) · [`modal-remediation-plan-2026-06-17.md`](./modal-remediation-plan-2026-06-17.md) |
| **How to use** | Each prompt is a self-contained task for an engineer/agent. Run them in numeric order — later prompts depend on earlier foundation work. Every prompt names exact files + lines, the change, constraints, acceptance criteria, and validation commands. |
| **Canonical pack** | This readable list is superseded by the machine-driven operating pack at [`modal-remediation-pack/`](./modal-remediation-pack/) (22 prompts incl. branding/release, JSON + schema, triggers, anti-amnesia STATE/LEDGER, the `modal-fix` skill, and proof capture). Fire prompts with a trigger like `P8` instead of pasting them. |

### Global constraints (apply to EVERY prompt)
- **TypeScript:** `strict` + `exactOptionalPropertyTypes` — `prop?: string` ≠ `prop: string | undefined`. No silent `any`; use `unknown` + narrowing.
- **State:** Zustand only (no Redux/Context for app state); no direct `localStorage` (use `persist`).
- **Errors:** user-facing failures go through `reportError()` (`src/lib/error-bus.ts`) — never call `showToast` directly for errors.
- **Events:** cross-module messages use typed `synapseBus` (`src/services/synapseBus.ts`) — no untyped `window.dispatchEvent`/`CustomEvent`; payloads carry IDs/refs only.
- **CSS:** no Tailwind anywhere under `src/centerpanel/` (`npm run lint:no-tailwind-centerpanel` is CI-gating). CSS Modules in `centerpanel/`; styled-components in shell/templates.
- **Validation after every change:** `npm run typecheck && npm run lint:errors`. For `src/centerpanel/components/map/**` use the **check-gis-modal** gate; for `src/features/urbanAnalytics/**` use **check-analytics** (`npm run typecheck && npm run test:analytics`).
- **Do not regress Map Explorer** — keep `npm run test:e2e:a11y` and `map-accessibility.test.ts` green.
- Keep each prompt's change in its own commit/PR; do not bundle foundation changes with decomposition.

### Dependency graph
```
P1  P2 ──┬─► P6 ──► P7 ──► P10, P11, P12, P13, P14
P3 ──────┤
P4 ──────┤
P5 ──────┴─► P15
P8 (needs P2)      P16, P17, P18 (independent)
P9 (independent)   P19 (after tests green)
P20 (after P6..P14)
```

---

## Prompt 1 — Fix the `GOLD` runtime bug + token the Keys overlay
**Files:** `src/components/ai/panel/KeysModal.tsx`
**Problem (audit: KeysModal bug, High; §4.3):** Line 174 renders `style={{ … color:GOLD }}`,
but `GOLD` is **never defined or imported** anywhere in `src/` (only `GOLDEN_RATIO`/
`GOLDEN_PAIRS` exist). This throws `ReferenceError`/fails `tsc`. Separately, the overlay
hardcodes `z-index: 2200` (`:21`), below the modal tier (occludable).
**Do:**
1. Replace `color:GOLD` (`:174`) with a CSS-variable amber token consistent with the
   file's existing `var(--syn-*)` usage, e.g. `color: 'var(--syn-accent-gold, #f5b301)'`.
   Confirm there is no intended `GOLD` import to restore (grep `GOLD` repo-wide first).
2. Leave the z-index change to **Prompt 15** (tokenization is centralized there) — but note
   it here so it isn't missed.
**Constraints:** no new `any`; keep the title's existing inline-style shape.
**Acceptance:** `npm run typecheck` passes with no "Cannot find name 'GOLD'"; KeysModal
mounts without a runtime error; title shows the amber accent.
**Validate:** `npm run typecheck && npm run lint:errors`.

---

## Prompt 2 — Promote `useFocusTrap` to a shared hook
**Files:** new `src/hooks/useFocusTrap.ts`; `src/centerpanel/components/map/useFocusTrap.ts`
**Problem (audit: §5.2):** The correct, reusable trap (re-queries focusables per Tab,
filters hidden/`aria-hidden`/negative-tabindex, captures+restores opener with
`document.contains` guard, wraps both directions, skip-link-aware `activate()`) is buried
under `map/`, so non-map modals reimplement it. There are 6+ trap copies.
**Do:**
1. Move the file contents to `src/hooks/useFocusTrap.ts` **unchanged** (keep
   `FOCUSABLE_SELECTOR`, `getFocusableElements`, `useFocusTrap`, the `data-map-skip-link`
   handling).
2. Replace the old path with a re-export: `export * from '@/hooks/useFocusTrap';` so no map
   imports change.
**Constraints:** no behavioural change; keep named exports identical.
**Acceptance:** `src/centerpanel/components/map/__tests__/map-accessibility.test.ts` passes
unchanged; `useMapExplorerLifecycle.ts` still resolves the hook.
**Validate:** check-gis-modal gate + `npm run typecheck`.

---

## Prompt 3 — Add a ref-counted `useScrollLock`
**Files:** new `src/hooks/useScrollLock.ts`
**Problem (audit: M5):** `Modal.tsx:178-186` mutates `document.body.style.overflow`
directly; two stacked modals race and the first to close restores scroll while another is
open.
**Do:** Implement `useScrollLock(active: boolean)` with a **module-level counter**: on the
first lock, save the prior `overflow` and set `hidden`; release only when the counter
returns to 0, restoring the saved value.
**Acceptance:** unit test — opening two locks then releasing one keeps `overflow:hidden`;
releasing the last restores the original value.
**Validate:** `npm run typecheck && npm run test -- src/hooks`.

---

## Prompt 4 — Add `useInertBackground`
**Files:** new `src/hooks/useInertBackground.ts`
**Problem (audit: M6):** Only Map Explorer inerts the background; the base `Modal` and most
bespoke modals leave the app reachable by AT.
**Do:** Implement `useInertBackground(active)` that, while active, sets `inert` (with
`aria-hidden="true"` fallback for older engines) on the app root's **siblings**, excluding
the modal/portal root and known overlay roots — mirror the exclusion logic in
`MapWorkspaceShell.tsx:574-618,594-599`, generalized. Clean up on deactivate.
**Acceptance:** unit test — while active, a background button is not in the tab order /
`inert`; after deactivate the attributes are gone.
**Validate:** `npm run typecheck && npm run test -- src/hooks`.

---

## Prompt 5 — Publish the full z-index scale as CSS variables
**Files:** `src/styles/theme.ts` (around `:304`), referencing `src/constants/design.ts:323-336`
**Problem (audit: §4.3):** The scale (`backdrop:1040, statusBar:9999, modal:10050,
popover:10060, tooltip:10070, toast:10080`) is defined but **only `--z-modal` is wired**, so
bespoke modals hardcode raw numbers.
**Do:** Publish `--z-backdrop`, `--z-popover`, `--z-tooltip`, `--z-toast` (and a
`--z-system-banner` tier above `toast` for the global gold bars) as CSS vars sourced from
`DESIGN_TOKENS.zIndex`. Do not change consumers here (Prompt 15 does that).
**Acceptance:** all documented tiers are reachable as CSS vars; `npm run color:guard` clean.
**Validate:** `npm run typecheck && npm run color:guard`.

---

## Prompt 6 — Rebuild the base `Modal` on the new foundation
**Files:** `src/components/molecules/Modal.tsx` **Depends on:** P2, P3, P4, P5
**Problem (audit: M1–M9):** No focus trap (`:189-199`), no focus restore, hardcoded
`id="modal-title"` (`:214,217`), global unscoped Escape/click (`:162-168`), direct body
scroll mutation, no inert, no live region, palette `min-width:640px` reflow floor (`:101`),
token bypass `#121212` (`:65`).
**Do:**
1. Consume `useFocusTrap(isOpen)` (attach `trapRef` to the panel) → trap + restore (M1/M2).
2. Replace body-scroll effect with `useScrollLock(isOpen && preventBodyScroll)` (M5).
3. Add `useInertBackground(isOpen)` (M6).
4. Replace hardcoded `id="modal-title"` with a `useId()`-derived id (M3).
5. Scope Escape to the dialog (keydown on the panel/overlay) instead of global
   `useKeyPress('Escape')`; keep `closeOnEscape`/`closeOnOverlayClick` props (M4).
6. Add a polite `aria-live` announcement of open (M7).
7. Add optional `ariaLabel` + `describedby` props (used when `title` is absent); render
   `aria-labelledby` only when titled, else `aria-label`. **Keep the public API backward-
   compatible** — existing callers must not break.
8. Source the palette surface from `SYNAPSE_OVERLAY.surface` (M8); reduce/parametrize the
   `min-width:640px` floor so the dialog can reflow (M9) — see P12/P16 for the consumers
   that need it.
**Constraints:** backward-compatible props; respect `prefers-reduced-motion` for the
slide/fade.
**Acceptance:** Command Palette, Global Search, New Project, Settings gain trap + restore +
inert with **no per-consumer change**; Escape + overlay-click still close; two simultaneous
base Modals no longer emit duplicate `modal-title` ids; Map Explorer e2e a11y still green.
**Validate:** `npm run typecheck && npm run lint:errors && npm run test:e2e:a11y`.

---

## Prompt 7 — Foundation unit tests
**Files:** new `src/components/molecules/__tests__/Modal.test.tsx`,
`src/hooks/__tests__/useFocusTrap.test.ts`, `useScrollLock.test.ts`, `useInertBackground.test.ts`
**Depends on:** P6
**Do:** Add a reusable `assertDialogA11y(render)` helper and tests asserting: initial focus
moves in; Tab/Shift+Tab wrap; focus restores to the opener on close; Escape closes;
scroll-lock ref-counting; background inert toggling; **unique title ids across two Modal
instances**; `ariaLabel`/`describedby` wiring.
**Acceptance:** new tests pass; coverage policy (`src/config/coveragePolicy.json`) satisfied.
**Validate:** `npm run test -- src/components/molecules src/hooks`.

---

## Prompt 8 — Make `AiSettingsModal` a conformant dialog
**Files:** `src/components/ai/settings/AiSettingsModal.tsx`, `./AiSettingsModal.module.css`
**Depends on:** P2 (or P6) **Problem (audit: AS1–AS7, High):** Unnamed dialog (`:159-166`),
**not portaled** (`:158`), **no Escape**, **no focus trap/restore**, close button `×` has
only `title` (`:167`), `z-index:1000` below backdrop/statusbar (`module.css:11`), pervasive
`any` (`:10,82-85,126-128`).
**Do:**
1. Portal the dialog to `document.body` (`createPortal`).
2. Add a real heading id and `aria-labelledby="ai-settings-title"` (AS3).
3. Consume `useFocusTrap` for trap + restore; add Escape-to-close on the dialog (AS1/AS2).
4. Give the close button `aria-label="Close AI settings"` (AS5).
5. Set the overlay `z-index: var(--z-modal)` (AS6).
6. Replace `Record<string, any>`/`keyPayload: any` with typed shapes from
   `useAiConfigStore.types` (AS7) — no `any`.
**Acceptance:** axe reports no serious violations; dialog has an accessible name; Tab cycles
within; Escape closes; focus returns to the opener; `typecheck` clean with no `any`.
**Validate:** `npm run typecheck && npm run lint:errors && npm run test`.

---

## Prompt 9 — Make `MapServiceDialog` keyboard-conformant + fix roles/shadowing
**Files:** `src/centerpanel/components/MapServiceDialog.tsx`
**Problem (audit: MapService, High):** `aria-modal="true"` (`:789`) with **no trap, no
Escape, no initial focus, no restore**; `role="listbox"` with `<button>` children
(`:599-619`); `boundsLabel` is both a prop and a module function (`:254,290`).
**Do:**
1. Wrap the dialog body in `MapDialogShell` (the established map pattern that already
   provides trap + Escape + restore), or consume `useFocusTrap` directly if the shell's
   chrome is unwanted.
2. Fix the layer list: use `role="listbox"` + child `role="option"` (with
   `aria-selected`), or drop the listbox role and present buttons in a labelled group.
3. Rename the module-level `boundsLabel` function to remove the prop/function collision.
4. Route any fetch failures through `reportError` (sets up Prompt 19's pattern).
**Constraints:** centerpanel = no Tailwind; CSS Modules only.
**Acceptance:** keyboard users Tab within and Escape out; SR announces options; `map-*` e2e
specs pass.
**Validate:** check-gis-modal gate.

---

## Prompt 10 — `NewFileModal`: correct dialog role, keyboard selectors, focus
**Files:** `src/components/file-explorer/NewFileModal.tsx` **Depends on:** P6
**Problem (audit: NF1–NF3, NF5):** `role="dialog"`/`aria-modal` on the click-to-close
**overlay** (`:783-788`) instead of the panel (`:790`); category/language/template are
clickable `<div>`s with no role/tabindex/keydown (`:829-833,849-853,864-868`) → mouse-only;
no focus trap/restore (focus enters only at the filename step `:457-466`); dead inline
`&:hover`/`&:focus` pseudo-selectors (`:585,632,720`).
**Do:**
1. Move `role="dialog"`/`aria-modal`/`aria-label` onto the panel (NF1).
2. Convert each selection group to a `role="radiogroup"` of keyboard-operable
   `role="radio"` (or real `<button>`) items: `tabIndex`, Enter/Space, `aria-checked`,
   accessible labels/descriptions (NF2).
3. Add focus-trap + restore (reuse `useFocusTrap`, or render the panel via the rebuilt base
   `Modal` if feasible) (NF3).
4. Remove the dead pseudo-selectors; move hover/focus styling to a CSS Module or styled
   component (NF5).
**Acceptance:** the full category→language→template→filename flow is operable by keyboard
alone; axe clean; SR boundary is the panel.
**Validate:** `npm run typecheck && npm run lint:errors && npm run test`.

---

## Prompt 11 — `NewProjectModal`: keyboard-operable template cards
**Files:** `src/components/molecules/NewProjectModal.tsx` **Depends on:** P6
**Problem (audit: NewProject):** `TemplateCard` is a clickable `<div onClick>` (`:161-172`)
with no `role`/`tabIndex`/key handler/`aria-checked` and no description for AT; inherits the
base Modal's gaps (now fixed by P6).
**Do:** Convert the template grid to a `role="radiogroup"` (`aria-label="Project template"`)
with each card a keyboard-operable `role="radio"` (Enter/Space, `aria-checked`,
`aria-describedby` → its description text). Keep the existing visual styling.
**Acceptance:** template selection works by keyboard; axe clean.
**Validate:** `npm run typecheck && npm run lint:errors`.

---

## Prompt 12 — `GlobalSearch`: fix listbox/tab semantics, arrow nav, reflow
**Files:** `src/components/ide/GlobalSearch.tsx` **Depends on:** P6
**Problem (audit: GS1–GS5):** Built on base Modal → no trap/restore (fixed by P6 + this);
`role="listbox"` with `<button>` children + `aria-selected` (`:428,450`) is invalid (GS2);
incomplete tab pattern (`role="tab"` with no `tabpanel`/`aria-controls`/roving, `:413-424`)
— really filter toggles (GS3); arrow nav dead-ends once a row is focused, no Home/End/wrap
(`:374-390`) (GS4); palette `min-width:640px` overflows <688px (GS5).
**Do:**
1. Adopt a proper **combobox + listbox** pattern: input `role="combobox"` with
   `aria-expanded`/`aria-controls`/`aria-activedescendant`; results `role="listbox"` with
   children `role="option"` (not buttons), selection via `aria-activedescendant` rather than
   moving DOM focus into rows — this also fixes the arrow dead-end (GS4).
2. Replace the scope `role="tab"` set with a segmented control / `role="radiogroup"` (or
   complete the tab pattern with `aria-controls`); add roving + Home/End (GS3).
3. Make the panel responsive (lift the 640px floor via P6's parametrized size, or use a
   non-palette size) (GS5). Optionally wrap the input region in `role="search"`.
**Acceptance:** axe clean; keyboard nav works end-to-end (arrows/Home/End/Enter/Escape);
usable at 320px.
**Validate:** `npm run typecheck && npm run lint:errors && npm run test`.

---

## Prompt 13 — Migrate bespoke focus traps onto the shared hook
**Files:** `src/components/ai/panel/KeysModal.tsx`, `src/components/ide/UnsavedChangesDialog.tsx`,
`src/features/urbanAnalytics/WelcomeModal.tsx`, `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`,
`src/centerpanel/components/map/MapDialogShell.tsx` **Depends on:** P2
**Problem (audit: M4 dupes, MX4, UA1):** Five hand-rolled traps duplicate `useFocusTrap`.
`WelcomeModal` even copies the selector/query helpers (`:60-82`). `UrbanAnalyticsModal`
binds its trap listener to the **modal element, not `document`** (`:805`), so it can't
recapture escaped focus.
**Do:** Replace each hand-rolled trap with `useFocusTrap`. Delete `WelcomeModal`'s
`FOCUSABLE_MODAL_SELECTOR`/`getFocusableModalElements`. For `UrbanAnalyticsModal`, the hook's
document-level capture fixes UA1. Keep each modal's existing focus-restore semantics
(the hook already restores).
**Constraints:** centerpanel/urbanAnalytics gates apply; no behavioural regression.
**Acceptance:** all five keep trap + restore; one audited trap path remains; bundle does not
grow.
**Validate:** check-gis-modal + check-analytics gates + `npm run test:e2e:a11y`.

---

## Prompt 14 — Standardize accessible names across all dialogs
**Files:** `src/components/ai/settings/AiSettingsModal.tsx`, `src/features/urbanAnalytics/WelcomeModal.tsx`,
`src/centerpanel/components/map/MapDialogShell.tsx` (+ audit any remaining `aria-label`-only dialogs)
**Problem (audit: AS3, Welcome, MapDialogShell, B3):** Inconsistent naming — AI Settings
unnamed (handled in P8); `WelcomeModal` uses `aria-label` while a visible
`<h1 id="welcome-modal-title">` (`:708`) is never referenced (`:596-598`); `MapDialogShell`
uses `aria-label` only — its visible `<h2>` title (`:338`) is not wired, so all 7 shell
dialogs lack a programmatic title.
**Do:**
1. `WelcomeModal`: set `aria-labelledby="welcome-modal-title"` and drop the duplicate
   `aria-label`.
2. `MapDialogShell`: generate a title id, render it on the `<h2>`, and set
   `aria-labelledby` on the dialog — propagating a real name to all shell-based dialogs.
3. Verify every `role="dialog"` in the repo has either `aria-labelledby` (preferred) or
   `aria-label`.
**Acceptance:** axe "dialog has accessible name" passes for every modal; names point at
visible headings where present.
**Validate:** `npm run typecheck && npm run test:e2e:a11y`.

---

## Prompt 15 — Apply z-index tokens to bespoke modals
**Files:** `src/components/ai/panel/KeysModal.tsx` (`:21`),
`src/components/ai/settings/AiSettingsModal.module.css` (`:11`),
`src/components/ide/UnsavedChangesDialog.tsx` (`:144`),
`src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` (`:1291`),
`src/features/urbanAnalytics/WelcomeModal.tsx` (`:945`), `src/components/ide/EnhancedIDE.tsx` (`:1696`)
**Depends on:** P5 **Problem (audit: §4.3):** Five z-index strategies; concrete occlusion
bugs — AI Settings `1000` (below backdrop/statusbar), Keys `2200`, Unsaved `9999` (statusbar
tier, below modal). Gold bars use `2147483648`.
**Do:** Replace modal overlay z-indexes with `var(--z-modal)`; replace the global gold-bar
values with `var(--z-system-banner)` (from P5). Leave `UrbanAnalyticsModal`'s deliberate
`10049` (documented one-below-modal) unless it now conflicts.
**Acceptance:** no modal can be occluded by the status bar/backdrop; visual QA unchanged
(`screenshot-map-explorer` / `color:guard` spot-check); no raw z-index literals remain in
these modal overlays.
**Validate:** `npm run typecheck && npm run color:guard`.

---

## Prompt 16 — `SettingsModal`: extract logic, fix anti-patterns, enable reflow
**Files:** `src/components/settings/SettingsModal.tsx`
**Problem (audit: Settings monolith, M9):** ~19 `useState`; render-injected inline `<style>`
(`:690-728`); **hand-rolled virtualization reading `scrollTop` during render** (`:829-894`);
**network key verification embedded** (`testOpenAI/Anthropic/Gemini`, `:613-631`); brittle
`globalThis.__KEY_ROUTER_SUSPENDED__` (`:188-201,563-564`); ref-in-deps anti-patterns
(`:448,573`); fixed `height:560px` + base `min-width:640px` reflow floor (`:17-21`).
**Do:**
1. Extract key-verification into a service module (e.g. `src/services/ai/verifyProviderKey.ts`)
   with its own unit tests; the component only calls it.
2. Replace hand-rolled virtualization with a small tested `useVirtualList` hook (or a
   vetted lib already in the chunk budget) — no `scrollTop` reads during render.
3. Remove the `globalThis.__KEY_ROUTER_SUSPENDED__` flag in favor of a scoped keydown
   handler.
4. Fix the ref-in-deps effects (`:448,573`) — don't list `ref.current`/ref objects as
   reactive deps.
5. Allow reflow: lift the `560px`/`640px` floor so the modal is usable on short/narrow
   viewports (coordinate with P6's parametrized size).
**Constraints:** preserve the strong tab/radio/listbox ARIA already present; no `localStorage`.
**Acceptance:** component shrinks; verification + virtualization have unit tests; usable at
320px; ARIA semantics unchanged.
**Validate:** `npm run typecheck && npm run lint:errors && npm run test`.

---

## Prompt 17 — Urban Analytics + Welcome: reduced-motion, typed events, cleanups
**Files:** `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx`, `src/features/urbanAnalytics/WelcomeModal.tsx`
**Problem (audit: UA3–UA5, Welcome reduced-motion):**
- Close `setTimeout`s ignore `prefers-reduced-motion` (`WelcomeModal.tsx:466`,
  `UrbanAnalyticsModal.tsx:521`) — keyboard users wait for an animation that isn't running.
- `UrbanAnalyticsModal` dispatches **untyped** `window.dispatchEvent(new CustomEvent('synapse:…'))`
  (`:687-756`) instead of the typed `synapseBus`.
- File-wide `eslint-disable jsx-a11y/no-noninteractive-element-interactions` (`:1`).
- Leftover `aria-hidden={false}` on `.midCol` (`:966`).
**Do:**
1. Gate both close-delay `setTimeout`s on `prefers-reduced-motion` (skip the delay when
   reduced).
2. Replace the `CustomEvent` dispatches with typed `synapseBus.emit(...)`; if an event name
   is missing, add it to `SynapseBusEventMap` (`src/types/synapse-bus.ts`) — IDs/refs only,
   no heavy payloads.
3. Correct the dialog root's interaction handlers so the file-wide a11y-lint suppression can
   be removed (or narrow it to the specific line with justification).
4. Delete the no-op `aria-hidden={false}`.
**Acceptance:** reduced-motion users get instant close; no untyped cross-module events; lint
suppression removed/narrowed; check-analytics green.
**Validate:** check-analytics (`npm run typecheck && npm run test:analytics`).

---

## Prompt 18 — Map dialog family: dead code, responsive grids, memoization
**Files:** `src/centerpanel/components/map/MapStartDialog.tsx`,
`src/centerpanel/components/MapExportDialog.tsx`, `src/centerpanel/components/MapColumnarImportDialog.tsx`,
`src/centerpanel/components/MapCsvImportDialog.tsx`, `src/centerpanel/components/map/MapWorkspaceShell.tsx`
**Problem (audit §6.4):**
- `MapStartDialog`: unused `dialogRef` (`:176`), declared-but-unused `onAddDemoPack` (`:42`),
  dead `demoBadge` branch (`:404`); risk of double `aria-modal` when wrapped.
- `MapExportDialog` body grid `minmax(360px,…) minmax(320px,…)` = 680px min (`:31`) and
  `MapColumnarImportDialog` `1.15fr/0.85fr` (`:54`) **don't stack** on narrow viewports.
- `MapCsvImportDialog` calls `profileCsvImportSession` **unmemoized every render** (`:131-134`).
- `MapWorkspaceShell` `MapPanelRail`/`getPanelRailStyle` ignore the `_height`/`height` param.
**Do:**
1. Remove the dead ref/prop/branch in `MapStartDialog`; ensure it doesn't set `aria-modal`
   when wrapped by a parent dialog.
2. Make the two grids responsive (auto-fit/stacking under a breakpoint) so they reflow.
3. Wrap the CSV profiling in `useMemo` keyed on its inputs.
4. Either use or remove the ignored height param.
**Constraints:** centerpanel = no Tailwind, CSS Modules only.
**Acceptance:** `npm run deadcode` shows no new dead exports; the two dialogs are usable at
320px; CSV dialog no longer reprofiles on every render.
**Validate:** check-gis-modal gate + `npm run deadcode`.

---

## Prompt 19 — Decompose `MapExplorerModalRuntimeCore` (staged)
**Files:** `src/centerpanel/components/map/controllers/MapExplorerModalRuntimeCore.tsx` (6,791 lines),
`…/MapExplorerModalRuntimeView.tsx`, `…/MapExplorerModal.tsx`, `…/MapExplorerModalRoot.tsx`,
`…/MapExplorerModalRuntime.tsx` **Depends on:** P20 tests green
**Problem (audit: MX1–MX3, MX5–MX6):** God-component (~325 hooks); ~170-field View props
spread in one JSX element (`View.tsx:37-208`; `Core:6609`); three pure passthrough files;
**51 direct `toast*` calls, 0 `reportError`** (`Core:137`); no top-level shell error
boundary; eager analysis-service web + `SAMPLE_BUILDINGS` + `SpatialDB` (`Core:21,46-48,112`).
**Do (each step its own PR, behind green tests):**
1. Collapse the three passthrough files into one.
2. Replace the ~170-prop View interface with grouped context objects / per-panel context
   providers; continue lifting panel state into the existing controller hooks.
3. Route the 51 `toast*` error calls through `reportError` (keep success/info toasts).
4. Add a top-level shell error boundary (in addition to the per-panel `MapPanelErrorBoundary`).
5. Lazy-load the eager analysis-service web where not needed on open; verify with
   `npm run perf:budgets`.
**Constraints:** **must not regress** Map a11y/e2e; do not bundle with foundation changes.
**Acceptance:** Core shrinks materially; View prop surface grouped; errors go through the
bus; modal open time improves (perf budgets); a11y/e2e suites green.
**Validate:** check-gis-modal gate + `npm run test:e2e` + `npm run perf:budgets`.

---

## Prompt 20 — Test coverage + regression guardrails
**Files:** new `__tests__` for the untested modals; extend `e2e/accessibility-audit.spec.ts`;
ESLint config **Depends on:** P6–P14
**Problem (audit: §8):** Modal-a11y tests exist **only** for Map Explorer. Untested: base
`Modal`, `GlobalSearch`, `KeysModal`, `SettingsModal`, `AiSettingsModal`, `WelcomeModal`,
`UrbanAnalyticsModal`, `UnsavedChangesDialog`, `MapServiceDialog`, `MapStartDialog`.
**Do:**
1. Add unit tests using the shared `assertDialogA11y` helper (from P7) for each untested
   modal: role/name, initial focus, Tab/Shift+Tab wrap, focus restore, Escape.
2. Extend `e2e/accessibility-audit.spec.ts` with a parametrized loop that opens each app
   modal, runs axe (no serious/critical), verifies scoped Escape returns focus to the
   trigger, and checks reflow at 320px.
3. Add CI guardrails: an ESLint rule (or `color:guard`-style check) forbidding **raw
   z-index literals in modal files** (must use a token), and a lint check that any
   `role="dialog"` has an accessible name. Keep `lint:no-tailwind-centerpanel` green.
**Acceptance:** every modal has ≥1 focus/Escape/axe test; guardrails fail on a regression;
`npm run validate:rc` passes.
**Validate:** `npm run validate:rc`.

---

## Coverage map (every audit finding → prompt)

| Finding(s) | Prompt |
|---|---|
| KeysModal `GOLD` bug | P1 |
| `useFocusTrap` mislocated (§5.2) | P2 |
| M5 scroll-lock race | P3, P6 |
| M6 background inert | P4, P6 |
| §4.3 z-index scale unwired | P5, P15 |
| M1–M9 base Modal | P6 |
| foundation tests gap | P7 |
| AS1–AS7 AI Settings | P8 (+P14 name, P15 z-index) |
| MapService no-trap/role/shadowing | P9 (+P19 reportError) |
| NF1–NF3, NF5 New File | P10 |
| NewProject cards | P11 |
| GS1–GS5 Global Search | P12 |
| M4 dupes / MX4 / UA1 traps | P13 |
| AS3 / Welcome / MapDialogShell naming (B3) | P14 |
| z-index occlusion (Keys/Unsaved/AI/gold bars) | P15 |
| Settings monolith + M9 reflow | P16 |
| reduced-motion / UA3–UA5 | P17 |
| MapStart dead code / Export+Columnar reflow / CSV memo / Workspace param | P18 |
| MX1–MX3, MX5–MX6 Map Core | P19 |
| §8 test gaps + guardrails | P20 |
| NF4 template extraction, MX7, MapStart `aria-modal` double | P10/P18/P19 (folded) |

All audit findings (High → Low) are assigned. Run P1–P20 in order; P19 is the only
large/staged effort and should land last behind a green suite.
