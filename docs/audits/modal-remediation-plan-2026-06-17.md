# Modal & Dialog System — Remediation Plan

| | |
|---|---|
| **Date** | 2026-06-17 |
| **Companion** | Findings: [`modal-design-audit-2026-06-17.md`](./modal-design-audit-2026-06-17.md) |
| **Goal** | Bring every modal to the WAI-ARIA dialog pattern + WCAG 2.2 AA, on one shared foundation, without regressing the already-strong Map Explorer surfaces |

This plan turns the audit's findings into an executable, dependency-ordered backlog. Each
task lists the **problem**, the **change**, **target files**, a **code sketch** where it
clarifies intent, **acceptance criteria**, and the **tests** that prove it. Finding IDs
(M1, NF2, AS1, MX5, …) refer to the audit.

---

## 1. Strategy & guiding principles

1. **Leverage over volume.** One change to the base `Modal` + a shared hook fixes the
   majority of accessibility defects. Do the foundation first; migrate consumers onto it.
2. **Promote, don't rewrite.** The in-repo `useFocusTrap`, `MapDialogShell`,
   `UnsavedChangesDialog`, and the Map Explorer shell are already correct. Extract and
   reuse them rather than inventing new patterns.
3. **Never regress Map Explorer.** It has the strongest a11y and the most test coverage.
   Foundation changes must keep its e2e a11y suite green.
4. **Ship blockers first.** The two shipping accessibility blockers (AI Settings, Map
   Service) and the `GOLD` runtime bug are quick, high-impact, and independent.
5. **Lock behaviour with tests.** Every foundation change lands with a vitest unit test;
   every migrated modal gets a focus/Escape/axe assertion. Close the §8 coverage gap.
6. **Respect repo conventions.** `reportError` not raw toasts; typed `synapseBus` not
   `CustomEvent`; no `localStorage`; `exactOptionalPropertyTypes`; no Tailwind in
   `centerpanel/`.

---

## 2. Workstreams

| ID | Workstream | Outcome |
|---|---|---|
| **WS-A** | Shared modal foundation | One accessible `Modal` + shared `useFocusTrap`, `useModalA11y`, scroll-lock, inert, z-index tokens |
| **WS-B** | Accessibility blockers | AI Settings & Map Service made conformant; keyboard-operable selectors |
| **WS-C** | Correctness bugs | `GOLD` fix, dead code, unmemoized work, ref-in-deps |
| **WS-D** | Maintainability / decomposition | New File data extraction, Settings & Map Service logic extraction, Map Core decomposition |
| **WS-E** | Layering & orchestration | z-index tokenization, optional lightweight modal manager / Escape stack |
| **WS-F** | Testing & guardrails | Unit + e2e coverage for every modal; lint rules to prevent regression |

---

## 3. Phased roadmap

| Phase | Theme | Tasks | Effort | Risk |
|---|---|---|---|---|
| **Phase 0** | Quick wins (independent, no foundation dependency) | C1, B1, B2, C2 | ~1 day | Low |
| **Phase 1** | Build the foundation | A1, A2, A3, A4, A5, F1 | ~3–4 days | Medium |
| **Phase 2** | Migrate consumers onto the foundation | A6, B3, B4, E1, F2 | ~4–5 days | Medium |
| **Phase 3** | Maintainability & decomposition | D1, D2, D3, D4, E2 | ~2–3 weeks | High (staged) |

---

## 4. Task specifications

### Phase 0 — Quick wins

#### C1 — Fix undefined `GOLD` in Keys *(audit: KeysModal bug, High)*
- **Problem:** `KeysModal.tsx:174` uses `color:GOLD`; `GOLD` is never defined or imported.
- **Change:** Replace with the intended token (the gold accent used elsewhere is
  `--syn-accent`/amber). Use a CSS var with fallback, consistent with the file's other
  `var(--syn-*)` tokens.
- **File:** `src/components/ai/panel/KeysModal.tsx:174`
- **Sketch:**
  ```tsx
  // before:  color:GOLD
  // after:
  color: 'var(--syn-accent-gold, #f5b301)'
  ```
- **Acceptance:** `npm run typecheck` passes (no "Cannot find name 'GOLD'"); the title
  renders in the amber accent; KeysModal opens without a `ReferenceError`.
- **Tests:** add a render smoke test (see F2) asserting the modal mounts.

#### B1 — AI Settings: make it a conformant dialog *(audit: AS1–AS5, High)*
- **Problem:** Unnamed dialog, not portaled, no Escape, no trap, no restore, close button
  unlabeled.
- **Change:** Portal it; add `aria-labelledby` pointing at a real heading id; consume the
  shared `useFocusTrap` (after A1) or, if landing in Phase 0 before A1, add a local trap +
  restore + Escape (then swap to the hook in A6); give the close button `aria-label`.
- **File:** `src/components/ai/settings/AiSettingsModal.tsx`
- **Sketch:**
  ```tsx
  return createPortal(
    <div className={styles.modal} role="dialog" aria-modal="true"
         aria-labelledby="ai-settings-title" ref={trapRef}
         onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <strong id="ai-settings-title" className={styles.title}>AI Settings</strong>
          <button onClick={onCancel} aria-label="Close AI settings" className={styles.closeBtn}>×</button>
  ```
- **Acceptance:** dialog has an accessible name; Escape closes; Tab cycles within;
  focus returns to the opener on close; axe reports no serious violations.

#### B2 — Map Service: add trap/Escape/restore + fix listbox role *(audit: MapService, High)*
- **Problem:** `aria-modal="true"` with no containment, no Escape, no restore; `listbox`
  with `<button>` children.
- **Change:** Wrap the Service dialog in `MapDialogShell` (which already provides
  trap/Escape/restore and is the established map pattern), OR add the shared hook. Change
  the layer list to `role="listbox"` + `role="option"` children (or drop the listbox role
  and keep buttons in a group).
- **File:** `src/centerpanel/components/MapServiceDialog.tsx:599-619,787-816`
- **Acceptance:** keyboard users can Tab within and Escape out; SR announces options;
  `e2e/map-*` specs still pass.

#### C2 — Remove dead code & fragile shadowing
- **Problem:** `MapStartDialog` unused `dialogRef` (`:176`), unused `onAddDemoPack` (`:42`),
  dead `demoBadge` branch (`:404`); `MapServiceDialog` `boundsLabel` prop/function collision
  (`:254,290`); `MapWorkspaceShell` ignored `_height` param.
- **Change:** Delete dead refs/props/branches; rename the module-level `boundsLabel`
  function to avoid prop shadowing.
- **Acceptance:** `npm run deadcode` shows no new dead exports; typecheck passes.

### Phase 1 — Foundation

#### A1 — Promote `useFocusTrap` to a shared hook *(audit: §5.2, M1/M2)*
- **Change:** Move `centerpanel/components/map/useFocusTrap.ts` → `src/hooks/useFocusTrap.ts`
  unchanged; re-export from the old path to avoid churn in map code.
- **Files:** new `src/hooks/useFocusTrap.ts`; `centerpanel/components/map/useFocusTrap.ts`
  becomes `export * from '@/hooks/useFocusTrap';`
- **Acceptance:** `map-accessibility.test.ts` still passes against the re-export; no import
  changes required in map code.

#### A2 — `useScrollLock` (ref-counted) *(audit: M5)*
- **Problem:** `Modal.tsx:178-186` mutates `document.body.style.overflow` directly; stacked
  modals race.
- **Change:** Add `src/hooks/useScrollLock.ts` keeping a module-level counter so the body
  lock is released only when the last modal closes; store/restore the prior value.
- **Acceptance:** opening two modals then closing one keeps scroll locked; closing the last
  restores the original overflow.

#### A3 — `useInertBackground` *(audit: M6)*
- **Change:** Add `src/hooks/useInertBackground.ts` that sets `inert` (with `aria-hidden`
  fallback) on the app root's siblings while a modal is open — modeled on
  `MapWorkspaceShell.tsx:574-618`, generalized.
- **Acceptance:** while a modal is open, background controls are not reachable by
  Tab/AT; on close the attributes are removed.

#### A4 — Z-index tokens *(audit: §4.3)*
- **Change:** Publish the remaining `constants/design.ts` tiers as CSS vars in
  `styles/theme.ts` (`--z-backdrop`, `--z-popover`, `--z-tooltip`, `--z-toast`). Replace
  hardcoded modal z-indexes with `var(--z-modal)`.
- **Files:** `styles/theme.ts:304`; consumers in Phase 2 (E1).
- **Acceptance:** `color:guard`/lint clean; documented tiers are all reachable as vars.

#### A5 — Rebuild the base `Modal` on the foundation *(audit: M1–M9)*
- **Change:** In `components/molecules/Modal.tsx`:
  - consume `useFocusTrap` (trap + restore), `useScrollLock`, `useInertBackground`;
  - replace the hardcoded `id="modal-title"` with a `useId()`-derived id (M3);
  - scope Escape to the dialog instead of the global `useKeyPress` (M4);
  - add a polite live-region announcement on open (M7);
  - add an optional `describedby`/`ariaLabel` prop; keep the public API backward-compatible.
- **Sketch:**
  ```tsx
  const titleId = useId();
  const { trapRef } = useFocusTrap(isOpen);
  useScrollLock(isOpen && preventBodyScroll);
  useInertBackground(isOpen);
  // ...
  <ModalContainer ref={trapRef} role="dialog" aria-modal="true"
    aria-labelledby={title ? titleId : undefined}
    aria-label={!title ? ariaLabel : undefined}
    aria-describedby={describedby}>
  ```
- **Acceptance:** Command Palette, Global Search, New Project, Settings automatically gain
  trap + restore + inert with no per-consumer change; existing behaviour (Escape, overlay
  click) preserved; **Map Explorer e2e a11y suite stays green**.

#### F1 — Foundation unit tests
- **Change:** Add `Modal.test.tsx` and `useFocusTrap`/`useScrollLock`/`useInertBackground`
  tests asserting: initial focus, Tab/Shift+Tab wrap, focus restore, Escape, scroll-lock
  ref-counting, background inert toggling, unique title ids across two instances.

### Phase 2 — Migrate consumers

#### A6 — Migrate bespoke traps onto the shared hook *(audit: M4 dupes, MX4)*
- **Change:** Replace the hand-rolled traps in `KeysModal`, `UnsavedChangesDialog`,
  `WelcomeModal`, `UrbanAnalyticsModal`, and `MapDialogShell` with `useFocusTrap`. Delete
  `WelcomeModal`'s `FOCUSABLE_MODAL_SELECTOR`/`getFocusableModalElements` (`:60-82`). Fix
  Urban's `document`-vs-element listener (UA1) by adopting the hook's document-level capture.
- **Acceptance:** all five keep trap+restore behaviour; one audited code path remains;
  bundle shrinks slightly.

#### B3 — Standardize accessible naming *(audit: AS3, Welcome, MapDialogShell)*
- **Change:** Every dialog uses `aria-labelledby` → its visible heading; add
  `aria-describedby` where a subtitle exists. Wire `WelcomeModal`'s existing
  `welcome-modal-title` (`:708`). Add `aria-labelledby` to `MapDialogShell` (`:338`) so all
  seven shell dialogs get programmatic titles.
- **Acceptance:** axe "dialog has accessible name" passes for all modals.

#### B4 — Keyboard-operable selector cards *(audit: NF1–NF3, NewProject)*
- **Change:**
  - `NewFileModal`: move `role="dialog"`/`aria-modal` from the overlay to the panel (NF1);
    convert category/language/template `<div onClick>` to a `radiogroup` of `role="radio"`
    (or real `<button>`s) with `tabIndex`, Enter/Space, `aria-checked`, labels (NF2); rely
    on the base Modal (after migration) for trap/restore (NF3).
  - `NewProjectModal`: convert `TemplateCard` `<div onClick>` (`:161-172`) to
    `role="radio"` within a `radiogroup`, keyboard-operable, with descriptions for AT.
- **Sketch:**
  ```tsx
  <div role="radiogroup" aria-label="File template">
    {templates.map(t => (
      <button type="button" role="radio" aria-checked={selected === t.id}
              onClick={() => select(t.id)} key={t.id}>{t.name}</button>
    ))}
  </div>
  ```
- **Acceptance:** the entire selection flow is operable by keyboard alone; axe clean.

#### E1 — Apply z-index tokens to bespoke modals *(audit: §4.3)*
- **Change:** Replace raw z-indexes with the A4 tokens: `KeysModal` 2200, `AiSettingsModal`
  1000, `UnsavedChangesDialog` 9999 → `var(--z-modal)`; gold bars → a defined top tier
  (`--z-toast`+ or a new `--z-system-banner`) rather than `2147483648`.
- **Acceptance:** no modal can be occluded by the status bar/backdrop; visual QA unchanged.

#### F2 — Per-modal a11y tests *(audit: §8)*
- **Change:** Add focus/Escape/axe assertions (vitest + jsdom/axe, or Playwright) for the
  previously-untested modals: `Modal`, `GlobalSearch`, `KeysModal`, `SettingsModal`,
  `AiSettingsModal`, `WelcomeModal`, `UrbanAnalyticsModal`, `UnsavedChangesDialog`,
  `MapServiceDialog`, `MapStartDialog`. Extend `e2e/accessibility-audit.spec.ts`.

### Phase 3 — Maintainability & decomposition

#### D1 — Extract New File templates *(audit: NF4–NF5)*
- **Change:** Move `getTemplateContentByLanguage`, `LANGUAGE_CATEGORIES`, `TEMPLATE_TYPES`
  to `src/components/file-explorer/newFileTemplates.ts`; lazy-load. Remove dead inline
  `&:hover`/`&:focus` pseudo-selectors (use CSS modules/styled instead).
- **Acceptance:** `NewFileModal.tsx` drops ~470 lines; chunk budget unaffected/improved.

#### D2 — Extract Settings logic *(audit: Settings monolith)*
- **Change:** Move network key-verification (`testOpenAI/Anthropic/Gemini` `:613-631`) into
  a service; replace hand-rolled virtualization with a library (or extract a tested
  `useVirtualList`); remove the `globalThis.__KEY_ROUTER_SUSPENDED__` flag in favor of a
  scoped handler; fix ref-in-deps (`:448,573`).
- **Acceptance:** Settings component shrinks; verification has its own unit tests.

#### D3 — Extract Map Service logic *(audit: MapService)*
- **Change:** Move WMS/WFS/OSM/CityJSON fetch + projection + LOD logic (`:349-583`) into a
  service/hook; route failures through `reportError` (MX5 alignment); keep the dialog
  presentational.
- **Acceptance:** dialog `useState` count drops materially; logic is unit-tested.

#### D4 — Decompose Map Explorer Core *(audit: MX1–MX3, MX5–MX6)*
- **Change (staged):** collapse the three passthrough files; replace the ~170-prop View
  interface with grouped context objects / per-panel context providers; continue lifting
  state into the existing controller hooks; lazy-load the eager analysis-service web; add a
  top-level shell error boundary; replace the 51 direct `toast*` calls with `reportError`.
- **Acceptance:** Core shrinks meaningfully; View prop surface grouped; Map a11y/e2e suites
  stay green; boot/open time improves (verify with `npm run perf:budgets`).

#### E2 — Lightweight modal orchestration *(audit: §4.1)*
- **Change (optional):** introduce a minimal `useModalManager`/Escape-stack utility (not
  Context-for-app-state — a tiny Zustand slice or stack hook) so overlapping modals are
  sequenced and Escape closes only the topmost. Reflow fixes: lift the Settings 640px floor
  (M9) and make `MapExportDialog`/`MapColumnarImportDialog` grids stack on narrow viewports.
- **Acceptance:** stacked modals behave predictably; dialogs usable at 320px.

#### Misc — Reduced-motion & conventions
- Gate `WelcomeModal` (`:466`) and `UrbanAnalyticsModal` (`:521`) close `setTimeout`s on
  `prefers-reduced-motion` (skip the delay). Replace Urban's `CustomEvent`s with
  `synapseBus` (UA4); remove the file-wide a11y-lint suppression once the dialog root is
  corrected (UA3). Memoize `MapCsvImportDialog`'s `profileCsvImportSession` (`:131`).

---

## 5. Per-modal migration checklist

| Modal | Onto base Modal? | Trap (hook) | Name | Selectors | z-index | Tests | Other |
|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| Command Palette | already | A5 | ok | ok | token | F2 | — |
| Global Search | already | A5 | →labelledby | listbox→option (GS2), tab pattern (GS3), arrow nav (GS4), reflow (GS5) | token | F2 | — |
| New File | optional | A5/local | →panel (NF1) | radiogroup (NF2) | token | F2 | extract data (D1) |
| New Project | already | A5 | ok | radiogroup (B4) | token | F2 | — |
| Unsaved Changes | keep bespoke | A6 | ok | ok | →`--z-modal` (E1) | F2 | tokens for colours |
| Keys | keep bespoke | A6 | ok | ok | →`--z-modal` (E1) | F2 | **GOLD (C1)** |
| AI Settings | keep bespoke | B1/A6 | **add (AS3)** | n/a | →`--z-modal` (E1) | F2 | portal, Esc, `any` (D2-style) |
| Settings | already | A5 | ok | ok | token | F2 | reflow (M9), extract (D2) |
| Welcome | keep bespoke | A6 (dedupe) | wire title (B3) | ok | top tier (E1) | F2 | reduced-motion |
| Urban Analytics | keep bespoke | A6 (UA1) | ok | ok | 10049 ok | F2 | synapseBus (UA4), suppression (UA3) |
| Map Explorer shell | bespoke (good) | keep hook | ok | ok | ok | extend | decompose (D4) |
| Map Service | →MapDialogShell | B2 | ok | listbox→option | n/a | F2 | extract (D3) |
| Map Start | wrap | parent trap | ok | ok | n/a | F2 | dead code (C2) |
| Shell content dialogs (×7) | keep | shell | add labelledby (B3) | ok | n/a | smoke | reflow: Export/Columnar (E2), memo CSV |

---

## 6. Testing strategy

- **Unit (vitest + jsdom + axe):** one shared `assertDialogA11y(render)` helper checking
  role/name, initial focus, Tab/Shift+Tab wrap, focus restore, Escape. Apply to every modal
  in F1/F2.
- **E2E (Playwright):** extend `e2e/accessibility-audit.spec.ts` with a parametrized loop
  that opens each app modal, runs axe (no serious/critical), verifies scoped Escape returns
  focus to the trigger, and checks reflow at 320px.
- **Guardrails:** add an ESLint rule/CI check forbidding raw `z-index` numbers in modal
  files (must use a token), and a lint check that any `role="dialog"` has an accessible
  name. Keep `lint:no-tailwind-centerpanel` green.

---

## 7. Prioritized backlog

| Pri | Task | Workstream | Effort | Impact | Depends on |
|---|---|---|---|---|---|
| **P0** | C1 fix `GOLD` | WS-C | XS | crash/typecheck | — |
| **P0** | B1 AI Settings conformant | WS-B | S | blocker | (A1 ideal) |
| **P0** | B2 Map Service trap/Esc | WS-B | S | blocker | — |
| **P0** | A1 promote `useFocusTrap` | WS-A | XS | enables A5/A6 | — |
| **P1** | A2/A3/A4 scroll-lock/inert/z-tokens | WS-A | S–M | foundation | — |
| **P1** | A5 rebuild base `Modal` | WS-A | M | fixes 4+ modals | A1–A4 |
| **P1** | F1 foundation tests | WS-F | S | regression guard | A5 |
| **P1** | B4 keyboard selectors | WS-B | S | WCAG 2.1.1 | A5 |
| **P1** | B3 standardize naming | WS-B | S | WCAG 4.1.2 | A5 |
| **P2** | A6 migrate bespoke traps | WS-A | M | dedupe | A1, A5 |
| **P2** | E1 apply z-tokens | WS-E | S | occlusion bugs | A4 |
| **P2** | F2 per-modal tests | WS-F | M | close coverage gap | A5 |
| **P2** | C2 dead code | WS-C | XS | hygiene | — |
| **P3** | D1 New File data extract | WS-D | S | maintainability | B4 |
| **P3** | D2 Settings extract | WS-D | M | maintainability | — |
| **P3** | D3 Map Service extract | WS-D | M | maintainability | B2 |
| **P3** | D4 Map Core decomposition | WS-D | L | maintainability/perf | tests green |
| **P3** | E2 orchestration + reflow | WS-E | M | UX/stacking | A5 |

**Why this order:** P0 items are tiny, independent, and either remove a crash or close a
shipping accessibility blocker. A1 is a file move that unlocks the foundation. P1 builds and
tests the shared foundation, fixing Command Palette, Global Search, New Project, and
Settings in one pass, then closes the keyboard/naming WCAG blockers. P2 consolidates the
duplicates, fixes layering, and backfills tests. P3 is the higher-effort maintainability
work (notably the Map Core decomposition) that should proceed incrementally behind a green
test suite so accessibility never regresses.

---

## 8. Risks & rollback

| Risk | Mitigation |
|---|---|
| A5 changes the shared `Modal` used by many surfaces | Keep the public prop API backward-compatible; land behind F1 unit tests + the existing Map e2e a11y suite; ship A5 in its own PR |
| Inert/`aria-hidden` hides something legitimately interactive | Exclude the modal root + known overlay roots (mirror `MapWorkspaceShell.tsx:594-599`); verify with axe + manual SR pass |
| Map Core decomposition (D4) is large and risky | Stage it: passthrough collapse → prop grouping → state lift → lazy imports, each behind green tests; do not bundle with foundation changes |
| Z-index retokenization shifts stacking | Visual QA via `screenshot-map-explorer`/`color:guard`; change one tier at a time |

---

## 9. Definition of done

- Every `role="dialog"` has an accessible name, focus trap, focus restore, and Escape.
- Background is inert while any modal is open.
- No modal uses a raw z-index literal; none can be occluded by the status bar/backdrop.
- All primary actions are keyboard-operable (no div-as-button).
- `GOLD` and dead code removed; `typecheck`, `lint:errors`, `deadcode` clean.
- Every modal has at least one focus/Escape/axe test; `e2e:a11y` green.
- `validate:rc` passes.
