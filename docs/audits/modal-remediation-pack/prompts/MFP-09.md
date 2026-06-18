# MFP-09 — Make MapServiceDialog keyboard-conformant + fix roles/shadowing

| Field | Value |
|---|---|
| Trigger | P9, map-service |
| Priority / Phase | P0 / Phase 0 |
| Depends on | none |
| Gate | gis |
| Severity | high |
| Proof required | typecheck-clean, manual-keyboard, axe-clean |

## 1. Why this matters
`MapServiceDialog` (`src/centerpanel/components/MapServiceDialog.tsx`) declares `aria-modal="true"` but implements none of the obligations: no focus trap, no Escape, no initial focus, no focus restore (finding MapService). It also renders a `role="listbox"` whose children are `<button>` elements with `aria-pressed` — invalid ARIA, since listbox children must be `role="option"` with `aria-selected`. Separately, `boundsLabel` is both a destructured prop (aliased) and a module-level function, which is a confusing shadow. This fails WCAG 2.1.2 (No Keyboard Trap / keyboard operability), 2.4.3 (Focus Order), and 4.1.2 (Name/Role/Value). Fetch failures also bypass the repo's `reportError` convention. This is P0/Phase 0 with no dependencies.

## 2. Current state (evidence)

```tsx
// src/centerpanel/components/MapServiceDialog.tsx:254-260 — module-level boundsLabel vs the prop alias
function boundsLabel(bounds: [number, number, number, number] | null): string {
  return bounds ? bounds.map((value) => value.toFixed(4)).join(", ") : "No live map extent yet";
}
function scopedBoundsLabel(bounds: [number, number, number, number] | null, labelText?: string | null): string {
  return labelText ? `${labelText}: ${boundsLabel(bounds)}` : boundsLabel(bounds);
}
```

```tsx
// src/centerpanel/components/MapServiceDialog.tsx:287-291 — the prop is aliased to avoid the collision today
export const MapServiceDialog: React.FC<MapServiceDialogProps> = ({
  open,
  bounds,
  boundsLabel: requestBoundsLabel,
  overlayLayers,
```

```tsx
// src/centerpanel/components/MapServiceDialog.tsx:599-619 — listbox with <button> + aria-pressed children
    <div style={layerList} role="listbox" aria-label="Service layer list">
      {items.length === 0 ? (
        <div style={metaLine}>No layers were discovered in the capabilities document.</div>
      ) : items.map((layer) => {
        const key = layerKey(layer);
        const isSelected = selectedSet.has(key);
        return (
          <button
            key={key}
            type="button"
            style={layerRow(isSelected)}
            onClick={() => onSelect(key)}
            aria-pressed={isSelected}
          >
```

```tsx
// src/centerpanel/components/MapServiceDialog.tsx:787-801 — aria-modal with no trap/Escape/restore
  return (
    <div style={overlay} role="presentation" data-testid="map-service-dialog-overlay">
      <section style={dialog} role="dialog" aria-modal="true" aria-label="External map services" data-testid="map-service-dialog">
        <header style={header}>
          ...
          <button type="button" style={closeBtn} onClick={onClose} aria-label="Close external map services dialog">
            <X size={14} />
          </button>
        </header>
```

```tsx
// src/centerpanel/components/MapServiceDialog.tsx:337-339 / 410-411 — fetch failures go to local setError, not reportError
    } catch (requestError) {
      const message = serviceErrorMessage(requestError);
      setError(message);
```

## 3. Target state
The dialog gains trap + Escape + initial focus + restore (via `MapDialogShell` wrapping, which already implements `getFocusableElements` and focus management at `src/centerpanel/components/map/MapDialogShell.tsx:130-146`, or via `useFocusTrap` directly). The layer list uses correct semantics: `role="listbox"` + child `role="option"` with `aria-selected`, OR drops the listbox role for a labelled group of buttons. The module `boundsLabel` function is renamed to eliminate the prop/function collision. Fetch failures route through `reportError`.

## 4. Implementation steps
1. Wrap the dialog body (L787-816) in `MapDialogShell` (provides trap + Escape + restore), OR call `useFocusTrap(open)` from `@/hooks/useFocusTrap` (post-MFP-02), attach `trapRef` to the `<section role="dialog">`, and add `onKeyDown` Escape handling. Ensure initial focus lands inside on open and restores to the opener on close. If wrapping in `MapDialogShell`, avoid a double `aria-modal`/`role="dialog"`.
2. Fix `renderCapabilities` (L591-623): change the container to keep `role="listbox"` and convert each `<button>` child to `role="option"` with `aria-selected={isSelected}` (and `tabIndex` per roving/listbox keyboard pattern), OR remove `role="listbox"` and present a labelled `group` of real buttons. Drop the invalid `aria-pressed` on listbox children.
3. Rename the module-level `boundsLabel` function (L254) to e.g. `formatBoundsLabel`, updating its caller `scopedBoundsLabel` (L258-260) and any other references, so it no longer shadows the `boundsLabel` prop. The prop alias `requestBoundsLabel` (L290) may then be simplified.
4. Route fetch/service failures (the `catch` blocks at L337-339, L410-411, and the `serviceErrorMessage` paths) through `reportError` from `@/lib/error-bus` (source `'adapter'`, a stable `code`, the message as `detail`) — this seeds the MFP-19 pattern. Keep the in-dialog `setError` for the visible inline message if desired, but the error must also emit through `reportError`.

## 5. Constraints & edge cases
- `centerpanel/` = no Tailwind; CSS Modules / inline style objects only (`lint:no-tailwind-centerpanel` gates CI). The file uses inline style objects from `mapTokens` — keep that pattern.
- Use `reportError`, never a raw toast, for error conditions.
- Listbox keyboard pattern: if you keep `role="listbox"`, options need arrow-key navigation and a single tab stop; the simpler conformant path is a labelled button group if full listbox interaction is out of scope.
- Do not regress the existing `data-testid` hooks (`map-service-dialog`, `map-service-dialog-overlay`) used by map e2e specs.
- Tab handler and Escape must be scoped to the dialog, not global, to avoid stealing keys from the map canvas.

## 6. Acceptance criteria
- [ ] Keyboard users can Tab within the dialog and Escape out; focus restores to the opener.
- [ ] Initial focus lands inside the dialog on open.
- [ ] Screen readers announce layer options correctly (`role="option"` + `aria-selected`, or labelled buttons — no `listbox`+`button`+`aria-pressed`).
- [ ] `boundsLabel` no longer collides between prop and module function.
- [ ] Fetch failures route through `reportError`.
- [ ] `map-*` vitest specs pass; `lint:no-tailwind-centerpanel` green.

## 7. Validation
```bash
npm run typecheck
npm run lint:no-tailwind-centerpanel
npx vitest run src/centerpanel/components/map
# gate: gis
```

## 8. Tests to add
Extend a map a11y spec (e.g. under `src/centerpanel/components/map/__tests__/`) or add coverage to the existing `map-accessibility` test:
```tsx
it('traps focus and closes on Escape', () => {
  render(<MapServiceDialog open {...props} onClose={onClose} />);
  const dialog = screen.getByTestId('map-service-dialog');
  expect(dialog.contains(document.activeElement)).toBe(true);
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});
it('renders layer options with option role + aria-selected (no aria-pressed listbox buttons)', () => {
  render(<MapServiceDialog open {...withCapabilities} />);
  const opts = screen.getAllByRole('option');
  expect(opts[0]).toHaveAttribute('aria-selected');
});
```

## 9. Proof checklist
- [ ] `typecheck-clean` → `proofs/MFP-09/typecheck.txt`
- [ ] `axe-clean` → `proofs/MFP-09/axe.json` (or map e2e a11y output)
- [ ] `manual-keyboard` → `proofs/MFP-09/keyboard.md` (Tab cycle, Escape, focus-restore, option navigation)
