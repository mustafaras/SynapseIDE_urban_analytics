# MFP-10 — NewFileModal: correct dialog role, keyboard selectors, focus, data extraction

| Field | Value |
|---|---|
| Trigger | P10, new-file |
| Priority / Phase | P1 / Phase 2 |
| Depends on | MFP-06 |
| Gate | general |
| Severity | high |
| Proof required | typecheck-clean, axe-clean, manual-keyboard, screenshot |

## 1. Why this matters
`NewFileModal` (`src/components/file-explorer/NewFileModal.tsx`) puts `role="dialog"`/`aria-modal`/`aria-label` on the **click-to-close overlay** rather than the panel (NF1), so the AT dialog boundary includes the dismiss backdrop. Its category, language, and template choices are clickable `<div onClick>` elements with no `role`, `tabIndex`, or key handler — mouse-only, keyboard-inoperable (NF2). It has no focus trap or restore (NF3). It inlines ~470 lines of static template data (NF4), and it carries dead inline `&:hover`/`&:focus` pseudo-selectors that React never applies (NF5). This fails WCAG 4.1.2 (Name/Role/Value), 2.1.1 (Keyboard), and 2.4.3 (Focus Order). Depends on MFP-06 so it can render through (or mirror) the rebuilt base Modal.

## 2. Current state (evidence)

```tsx
// src/components/file-explorer/NewFileModal.tsx:17-21 — ~470 lines of static template data inlined (NF4 start)
const getTemplateContentByLanguage = (
  languageId: string,
  templateId: string,
  fileName: string
): string => {
```

```tsx
// src/components/file-explorer/NewFileModal.tsx:585-589 — dead inline &:hover pseudo-selector (NF5)
    closeButton: {
      ...
      transition: 'var(--syn-transition-medium)',
      '&:hover': {
        background: 'color-mix(in srgb, var(--syn-interaction-active) 16%, transparent)',
```

```tsx
// also dead pseudo-selectors at categoryCard '&:hover' (L632), languageItem '&:hover' (L671),
// templateItem '&:hover' (L703), fileNameInput '&:focus' (L720), button '&:hover' (L744),
// primaryButton '&:hover' (L754) — inline style objects don't support pseudo-selectors.
```

```tsx
// src/components/file-explorer/NewFileModal.tsx:782-799 — dialog role on the click-to-close overlay, not the panel (NF1)
  const modalContent = (
    <div
      style={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create New File"
    >
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
```

```tsx
// src/components/file-explorer/NewFileModal.tsx:828-833 — category options are clickable <div>s (NF2)
                <div
                  key={categoryId}
                  style={styles.categoryCard}
                  onClick={() => handleCategorySelect(categoryId)}
                >
// language items: L849-853 same pattern; template items: L864-868 same pattern.
```

```tsx
// src/components/file-explorer/NewFileModal.tsx:762-774 — hand-rolled Escape + direct body-scroll, no trap/restore (NF3)
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);
```

The static data symbols are `getTemplateContentByLanguage` (L17-88), `LANGUAGE_CATEGORIES` (L91-…), and `TEMPLATE_TYPES` (the `r/haskell/assembly` tail ends at L388).

## 3. Target state
`role="dialog"`/`aria-modal`/`aria-label` move onto the panel (`styles.modal`). Each selection group becomes a `role="radiogroup"` of keyboard-operable `role="radio"` (or real `<button>`) controls with `aria-checked`, `tabIndex`, and Enter/Space handling. Focus is trapped and restored (via `useFocusTrap`, or by rendering through the rebuilt base Modal from MFP-06). The static data moves to `src/components/file-explorer/newFileTemplates.ts` and is lazy-loaded. Dead pseudo-selectors are removed and hover/focus styling moves to a CSS Module / styled-component.

```tsx
// after (sketch)
<div role="radiogroup" aria-label="File template">
  {templates.map(t => (
    <button type="button" role="radio" aria-checked={selected === t.id}
            onClick={() => select(t.id)} key={t.id}>{t.name}</button>
  ))}
</div>
```

## 4. Implementation steps
1. Move `role="dialog"`, `aria-modal="true"`, `aria-label="Create New File"` from the overlay `<div>` (L783-788) onto the panel `<div style={styles.modal}>` (L790). Keep `onClick={onClose}` on the overlay for click-to-dismiss, but the dialog boundary is now the panel (NF1).
2. Convert the three selection groups to accessible radio groups (NF2):
   - Category grid (L827-843): wrap in `role="radiogroup" aria-label="File category"`; make each card a `<button type="button" role="radio" aria-checked={selectedCategory === categoryId}>` (or `<div>` with `role`, `tabIndex`, `onKeyDown` for Enter/Space).
   - Language list (L847-858): `role="radiogroup" aria-label="Language"`, each item `role="radio"` `aria-checked={selectedLanguage === language.id}`.
   - Template list (L861-874): `role="radiogroup" aria-label="File template"`, each item `role="radio"` `aria-checked={selectedTemplate === template.id}`.
   Ensure each control has an accessible label (the visible name) and is reachable by Tab + operable by Enter/Space.
3. Add focus trap + restore: either replace the hand-rolled effect (L762-774) with `useFocusTrap(isOpen)` from `@/hooks/useFocusTrap` and remove the manual body-scroll mutation in favor of `useScrollLock` (MFP-03), OR render the whole modal through the rebuilt base `Modal` (MFP-06) which already provides trap/restore/scroll-lock/inert. Preserve the `requestAnimationFrame` filename-input autofocus (L457-466).
4. Extract `getTemplateContentByLanguage`, `LANGUAGE_CATEGORIES`, and `TEMPLATE_TYPES` (L17-388) into `src/components/file-explorer/newFileTemplates.ts`; import the lightweight metadata (`LANGUAGE_CATEGORIES`, `TEMPLATE_TYPES`) statically and lazy-`import()` the heavy `getTemplateContentByLanguage` only when a file is actually created (NF4) to keep the chunk budget.
5. Remove the dead inline pseudo-selectors at L585, L632, L671, L703, L720, L744, L754; move hover/focus styling into a CSS Module (e.g. `NewFileModal.module.css`) or styled-component (NF5).

## 5. Constraints & edge cases
- Keep the wizard step flow: `category → language → template → filename` (`step` state, `handleCategorySelect`/`handleLanguageSelect`/`handleTemplateSelect`).
- Lazy import must keep the chunk budget — verify with `npm run perf:budgets`.
- This file lives under `src/components/file-explorer/`, not `centerpanel/`, so Tailwind/CSS-Module restriction differs; follow shell conventions (CSS Modules or styled-components are both acceptable here, but match nearby files).
- `exactOptionalPropertyTypes`: when narrowing `TEMPLATE_TYPES[lang]` keep the `?.[...]` guards intact.
- Radio-group semantics: only one `aria-checked={true}` per group at a time; arrow-key roving is ideal but Tab-reachable Enter/Space-operable radios are the minimum bar.

## 6. Acceptance criteria
- [ ] The `category → language → template → filename` flow is fully operable by keyboard alone.
- [ ] axe reports no serious/critical violations.
- [ ] The SR dialog boundary is the panel (not the dismiss overlay).
- [ ] Focus is trapped within the modal and restored to the opener on close.
- [ ] `NewFileModal.tsx` shrinks materially (static data moved to `newFileTemplates.ts`).
- [ ] Dead `&:hover`/`&:focus` inline pseudo-selectors removed.
- [ ] `npm run perf:budgets` passes (lazy import keeps the chunk budget).

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
npm run test
npm run perf:budgets
# gate: general
```

## 8. Tests to add
```tsx
it('selects category/language/template by keyboard', () => {
  render(<NewFileModal isOpen onClose={() => {}} onCreateFile={() => {}} sidebarWidth={300} />);
  const dialog = screen.getByRole('dialog', { name: 'Create New File' }); // now on the panel
  const groups = within(dialog).getAllByRole('radiogroup');
  const firstRadio = within(groups[0]).getAllByRole('radio')[0];
  firstRadio.focus(); fireEvent.keyDown(firstRadio, { key: 'Enter' });
  expect(firstRadio).toHaveAttribute('aria-checked', 'true');
});
it('traps focus and has no serious axe violations', async () => {
  const { container } = render(<NewFileModal isOpen onClose={() => {}} onCreateFile={() => {}} sidebarWidth={300} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

## 9. Proof checklist
- [ ] `typecheck-clean` → `proofs/MFP-10/typecheck.txt`
- [ ] `axe-clean` → `proofs/MFP-10/axe.json`
- [ ] `manual-keyboard` → `proofs/MFP-10/keyboard.md` (category→language→template→filename by keyboard, Escape, focus-restore)
- [ ] `screenshot` → `proofs/MFP-10/before.png` + `proofs/MFP-10/after.png`
