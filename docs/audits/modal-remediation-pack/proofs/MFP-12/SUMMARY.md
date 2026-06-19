# MFP-12 — Proof summary

**Prompt:** MFP-12 — GlobalSearch: combobox/listbox semantics, arrow nav, reflow
**Gate:** general · **Depends on:** MFP-06 (done) · **Branch:** claude/modal-fix-p12

## Change — `src/components/ide/GlobalSearch.tsx` (GS1–GS5)
- **GS1/GS2 combobox + listbox:** the input is now `role="combobox"` with `aria-expanded`,
  `aria-controls="global-search-listbox"`, `aria-autocomplete="list"`, and
  `aria-activedescendant`. `Results` keeps `role="listbox"` (id set); `ResultRow` changed from
  `styled.button` to `styled.div` and each row is `role="option"` with a stable `id`
  (`global-search-opt-N`) + `aria-selected`. No `<button aria-selected>` remains.
- **GS4 keyboard nav:** rewrote `handleKeyDown` — Arrow Up/Down wrap, Home/End jump, Enter opens;
  selection is tracked via `aria-activedescendant` and the active row is `scrollIntoView`'d
  (guarded `?.()` for jsdom) — **no DOM focus moved into rows**. The combobox input keeps focus
  (added an `inputRef` rAF effect so it claims focus on open over the base Modal's close button).
- **GS3 scope radiogroup:** `ScopeTabs` `role="tablist"`/`role="tab"` → `role="radiogroup"` of
  `role="radio"` with `aria-checked`, roving `tabIndex`, and ArrowLeft/Right/Up/Down + Home/End.
- **GS5 reflow:** kept `size="palette"`; MFP-06 already lifted the floor to
  `min-width: min(640px, 100%)`, so the panel reflows at 320px. Wrapped the input in `role="search"`.
- Contrast: bumped the **local** `RowPath` color `--syn-text-muted` → `--syn-text-secondary`
  (the only axe node — file-path text 4.07:1 on the active row's tinted bg). No shared token touched.

styled-components only; no `any`; `aria-activedescendant` is `string | undefined` deliberately;
the `flatResults` running-index contract is preserved.

## Proofs in this directory
- **`after.png`** — real-Chromium screenshot with seeded results: combobox ("report"), scope
  radiogroup ("All 4" checked), grouped options, first option active via `aria-activedescendant`.
  **(screenshot — per standing request)**
- **`axe.json`** (= `axe-after.json`) — axe-core on the open dialog (4 options, active option set):
  **0 violations** (18 passes). **(axe-clean)**
- **`keyboard.md`** — combobox/arrow/Home/End/Enter/Escape + scope roving checklist. **(manual-keyboard)**
- `typecheck.txt` — clean. **(typecheck-clean)**
- `lint.txt` — `lint:errors` clean.
- `unit-test.txt` — `GlobalSearch.a11y.test.tsx` **4/4**.

## Acceptance
- [x] Input is a combobox; results are `role="option"` under `role="listbox"`; no `<button aria-selected>`.
- [x] Keyboard nav end-to-end: arrows + Home/End + wrap move the active option, Enter opens, Escape closes.
- [x] Scope filters are an operable roving radiogroup.
- [x] Usable at 320px (palette floor `min(640px,100%)` — no horizontal overflow).
- [x] axe clean; `typecheck` / `lint:errors` / unit test pass.
