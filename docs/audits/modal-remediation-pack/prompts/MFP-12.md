# MFP-12 — GlobalSearch: combobox/listbox semantics, arrow nav, reflow

| Field | Value |
|---|---|
| Trigger | P12, global-search |
| Priority / Phase | P1 / Phase 2 |
| Depends on | MFP-06 |
| Gate | general |
| Severity | medium |
| Proof required | typecheck-clean, axe-clean, manual-keyboard |

## 1. Why this matters
Findings `GS1`–`GS5`: GlobalSearch mixes incompatible ARIA patterns. The results region is `role="listbox"` but its children are `<button>`s carrying `aria-selected` (GS2) — a listbox's children must be `role="option"`, so screen readers announce a malformed widget. The scope filters use `role="tab"` with no `tabpanel`, `aria-controls`, or roving tabindex (GS3) — they are really filter toggles, not tabs. Arrow navigation moves real DOM focus into rows and dead-ends with no Home/End/wrap (GS4), breaking WCAG **2.1.1 Keyboard** and the APG combobox/listbox patterns. Finally the `palette` size carries a 640px min-width that overflows viewports below ~688px (GS5), failing WCAG **1.4.10 Reflow** at 320px.

## 2. Current state (evidence)
Results container is a listbox of buttons. `src/components/ide/GlobalSearch.tsx:428`:
```tsx
<Results role="listbox" aria-label="Search results">
```
`ResultRow` is a `styled.button` (`:92`) and each row sets `aria-selected` (`:450`, `:494`, `:522`):
```tsx
<ResultRow
  key={`fn-${i}`}
  ref={el => { resultRefs.current[refIdx] = el; }}
  onClick={() => handleOpen(r)}
  aria-label={r.docPath}
  aria-selected={focusIdx === refIdx}
>
```
Scope filters render as tabs without a tabpanel — `src/components/ide/GlobalSearch.tsx:413-424`:
```tsx
<ScopeTabs role="tablist" aria-label="Search scope">
  {(['all', 'files', 'content', 'artifacts'] as Scope[]).map(s => (
    <ScopeBtn key={s} $active={scope === s} role="tab" aria-selected={scope === s} onClick={() => setScope(s)}>
      {scopeLabel(s, s.charAt(0).toUpperCase() + s.slice(1))}
    </ScopeBtn>
  ))}
</ScopeTabs>
```
Arrow nav moves focus into row refs and clamps without wrap/Home/End — `src/components/ide/GlobalSearch.tsx:374-390`:
```tsx
const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
  if (flatResults.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = Math.min(focusIdx + 1, flatResults.length - 1);
    setFocusIdx(next);
    resultRefs.current[next]?.focus();
  } else if (e.key === 'ArrowUp') { ... resultRefs.current[prev]?.focus();
  } else if (e.key === 'Enter' && focusIdx >= 0) { ... handleOpen(flatResults[focusIdx]); }
```
The dialog opens at palette size — `src/components/ide/GlobalSearch.tsx:398`:
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Search" size="palette" variant="palette">
```
`flatResults` (`:365-371`) is the rendered order used to index `resultRefs`; keep that contract.

## 3. Target state
Before: a focus-stealing listbox of buttons + pseudo-tabs that overflow at 320px.
After: the input is `role="combobox"` with `aria-expanded`, `aria-controls` (→ results id), and `aria-activedescendant` (→ active option id); `Results` stays `role="listbox"` but rows become `role="option"` (non-button, with stable `id`s) and selection is driven by `aria-activedescendant` instead of moving DOM focus into rows. Scope filters become a `role="radiogroup"` segmented control with roving tabindex + Home/End. The panel reflows below 688px (lift the 640px floor via MFP-06's parametrized size, or use a non-palette size), optionally wrapping the input in `role="search"`.

## 4. Implementation steps
1. Convert the input to a combobox: add `role="combobox"`, `aria-expanded={totalVisible > 0}`, `aria-controls="global-search-listbox"`, `aria-autocomplete="list"`, and `aria-activedescendant={focusIdx >= 0 ? optionId(focusIdx) : undefined}`. Keep `aria-label="Global search"`.
2. Give `Results` an `id="global-search-listbox"`; convert `ResultRow` rows from `<button>` to elements with `role="option"`, `id={optionId(refIdx)}`, and `aria-selected={focusIdx === refIdx}`. Move click activation to the listbox/option (keep `onClick={() => handleOpen(r)}`); rows no longer take DOM focus, so the `resultRefs.current[*]?.focus()` calls and `&:focus-visible` styling are replaced by `aria-selected` styling (already present at `ResultRow` `:112-115`).
3. Rewrite `handleKeyDown` so ArrowUp/Down update `focusIdx` with wrap, add Home (→ 0) and End (→ `flatResults.length-1`), Enter opens `flatResults[focusIdx]`, and scroll the active option into view via its ref/`scrollIntoView` instead of `.focus()`. Keep the `flatResults`-index contract.
4. Replace the scope `role="tab"`/`role="tablist"` with `role="radiogroup"` (aria-label "Search scope") of `role="radio"` `ScopeBtn`s: `aria-checked={scope===s}`, roving `tabIndex`, ArrowLeft/Right + Home/End to move, and keep `onClick={() => setScope(s)}`. (Alternatively complete the tab pattern with `aria-controls` + a tabpanel — radiogroup is simpler and matches intent.)
5. Make the panel responsive: pass MFP-06's parametrized size so the 640px floor is lifted (or switch `size`), so it is usable at 320px. Optionally wrap `InputWrapper` in `role="search"`.

## 5. Constraints & edge cases
- Keep file/content/artifact grouping aligned with the `flatResults` running index (`idx++` at `:443`, `:487`, `:515`) so `aria-activedescendant` points at the correct option.
- Reset `focusIdx` to -1 on close and on new query (already done at `:261`, `:291`).
- styled-components only (this file is under `src/components/ide/`, not `centerpanel/`).
- `exactOptionalPropertyTypes`: build `aria-activedescendant` as `string | undefined` deliberately, not optional-vs-undefined mismatch.

## 6. Acceptance criteria
- [ ] Input is a combobox; results are `role="option"` under a `role="listbox"`; no `<button aria-selected>` remains.
- [ ] Keyboard nav works end-to-end: Arrows + Home/End + wrap move the active option, Enter opens it, Escape closes the dialog.
- [ ] Scope filters are an operable radiogroup (or completed tab pattern) with roving focus.
- [ ] Usable at 320px (no horizontal overflow).
- [ ] axe clean; `npm run typecheck`, `npm run lint:errors`, `npm run test` pass.

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
npm run test
# gate: general
```

## 8. Tests to add
Add `src/components/ide/__tests__/GlobalSearch.a11y.test.tsx`: mock `indexDocs`/`queryDocs` to return fixed results, open the modal, assert the input has `role="combobox"` with `aria-controls`, assert results are `role="option"` (no button `aria-selected`), drive ArrowDown/ArrowUp/Home/End and assert `aria-activedescendant` follows + wraps, fire Enter and assert `handleOpen` path runs, and run `axe` for no serious violations. Add a reflow check (panel width ≤ viewport at 320px) if jsdom layout allows, else cover in the e2e a11y spec.

## 9. Proof checklist
- [ ] `proofs/MFP-12/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-12/axe.json` — axe results showing no serious/critical violations.
- [ ] `proofs/MFP-12/keyboard.md` — Arrows/Home/End/Enter/Escape verified; combobox activedescendant tracks selection; reflow at 320px noted.
