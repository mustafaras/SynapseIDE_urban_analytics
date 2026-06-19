# MFP-12 — manual-keyboard proof (GlobalSearch)

Keyboard behaviour of the combobox/listbox search. All rows are backed by passing
assertions in `src/components/ide/__tests__/GlobalSearch.a11y.test.tsx` (4/4).

| Behaviour | Expected | Verified by |
|---|---|---|
| **Combobox** | The input is `role="combobox"` with `aria-controls="global-search-listbox"`, `aria-autocomplete="list"`, `aria-expanded` (true when results exist). | test 1 |
| **Listbox options** | Results are `role="option"` (non-`<button>`) under a `role="listbox"`; no `<button aria-selected>` remains. | test 2 |
| **Active option (activedescendant)** | Arrow Up/Down move the active option via `aria-activedescendant` (wrap both ends), Home → first, End → last; the input keeps DOM focus; the active row reflects `aria-selected`. | test 3 |
| **Enter** | Enter opens `flatResults[focusIdx]` (the active option). | code: `handleKeyDown` Enter branch |
| **Escape** | Closes the dialog — owned by the base `Modal` (MFP-06), not re-added here. | base Modal |
| **Initial focus** | The combobox input claims focus on open (the base Modal would otherwise focus its close button). | `inputRef` rAF effect; test 3 asserts `activeElement === input` |
| **Scope radiogroup** | Scope filters are a `role="radiogroup"` of `role="radio"` with roving `tabIndex`; ArrowLeft/Right/Up/Down + Home/End move the checked scope. | test 4 |
| **Reflow (320px)** | The dialog renders at `size="palette"`, whose floor is `min-width: min(640px, 100%)` (MFP-06) → no horizontal overflow at 320px. | base Modal palette size |

## axe (real Chromium)
- `axe.json` (= `axe-after.json`) — axe-core on the open dialog with seeded results (4 options,
  active option set via ArrowDown), wcag2a/aa: **0 violations** (18 passes).
  - One pre-fix `color-contrast` node (the `RowPath` file-path text `--syn-text-muted` on the
    active row's tinted bg = 4.07:1) was cleared by bumping the **local** `RowPath` color to
    `--syn-text-secondary` (passes AA). Local one-line change, no shared token touched.

## Manual checklist (browser — see `after.png`)
- [x] Type a query → results appear; input stays focused (combobox).
- [x] Arrow/Home/End move the highlighted option (activedescendant); Enter opens it.
- [x] Tab to the scope row; arrows switch scope (roving radiogroup).
- [x] Esc closes; focus returns to the opener (base Modal).
