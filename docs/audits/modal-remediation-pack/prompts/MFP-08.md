# MFP-08 — Make AiSettingsModal a conformant dialog

| Field | Value |
|---|---|
| Trigger | P8, ai-settings |
| Priority / Phase | P0 / Phase 0 |
| Depends on | MFP-02 |
| Gate | general |
| Severity | high |
| Proof required | typecheck-clean, axe-clean, manual-keyboard, screenshot |

## 1. Why this matters
`AiSettingsModal` (`src/components/ai/settings/AiSettingsModal.tsx`) is an unnamed dialog (findings AS1–AS7): it is not portaled, has no Escape handler, no focus trap or restore, the close button `×` exposes only a `title` attribute (no accessible name), its overlay `z-index:1000` sits below the backdrop/status-bar tier, and the file is riddled with `any`. This fails WCAG 4.1.2 (Name/Role/Value — dialog and close button have no accessible name), 2.1.2 (keyboard can't escape and focus leaks to the page behind), and the repo's "no silent `any`" TypeScript rule. Because it is P0/Phase 0 it ships early; MFP-02 (shared `useFocusTrap`) is its only dependency.

## 2. Current state (evidence)

```tsx
// src/components/ai/settings/AiSettingsModal.tsx:10 — untyped snapshot keys (AS7)
type Snapshot = { provider: ProviderId; model: string | null; sampling: Sampling; keys: Record<string, any> };
```

```tsx
// src/components/ai/settings/AiSettingsModal.tsx:82-85 — any key payloads (AS7)
    const keyPayload: any = {};
    if (draft.apiKey) keyPayload.apiKey = draft.apiKey;
    if (draft.baseUrl) keyPayload.baseUrl = draft.baseUrl;
    await setKey(draft.provider, keyPayload);
```

```tsx
// src/components/ai/settings/AiSettingsModal.tsx:126-128 — more any (AS7, also at L94)
      const keyPayload: any = {};
      if (draft.apiKey) keyPayload.apiKey = draft.apiKey;
      if (draft.baseUrl) keyPayload.baseUrl = draft.baseUrl;
```

```tsx
// src/components/ai/settings/AiSettingsModal.tsx:158-168 — unnamed, un-portaled, no Escape, no trap (AS1/AS2/AS3/AS5)
  return (
    <div
      role='dialog'
      aria-modal='true'
      className={styles.modal}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <strong className={styles.title}>AI Settings</strong>
          <button onClick={onCancel} className={styles.closeBtn} title='Close without reverting committed store state.'>×</button>
        </div>
```

```css
/* src/components/ai/settings/AiSettingsModal.module.css:1-12 — z-index below modal tier (AS6) */
.modal {
  position: fixed;
  inset: 0;
  background: var(--syn-depth-heavy);
  backdrop-filter: blur(10px) brightness(0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(56px,6vw,64px);
  z-index: 1000;
}
```

The component already lives behind `if (!open) return null;` (L102) and aliases `const onCancel = onClose;` (L156).

## 3. Target state
The dialog is portaled to `document.body`, has a programmatic name via `aria-labelledby`, traps + restores focus through the shared hook, closes on Escape, exposes an accessible name on the close button, sits at `var(--z-modal)`, and replaces every `any` with typed shapes from `@/stores/useAiConfigStore.types`.

```tsx
// after (sketch)
return createPortal(
  <div className={styles.modal} role="dialog" aria-modal="true"
       aria-labelledby="ai-settings-title" ref={trapRef}
       onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}>
    <div className={styles.panel}>
      <div className={styles.header}>
        <strong id="ai-settings-title" className={styles.title}>AI Settings</strong>
        <button onClick={onCancel} aria-label="Close AI settings" className={styles.closeBtn}>×</button>
```

## 4. Implementation steps
1. Import `createPortal` from `react-dom` and `useFocusTrap` from `@/hooks/useFocusTrap` (promoted in MFP-02). Inspect `@/stores/useAiConfigStore.types` for the key-payload shape (e.g. the type behind `setKey(provider, payload)`) to replace `any`.
2. Wrap the returned JSX (L158-272) in `createPortal(..., document.body)` (AS4).
3. Add `const { trapRef } = useFocusTrap(open)` near the other hooks (top of component, before the `if (!open) return null`); attach `ref={trapRef}` to the outer `styles.modal` div (AS1/AS2). The hook restores focus to the opener on close.
4. Add `onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}` to the dialog root (AS2).
5. Add `id="ai-settings-title"` to the `<strong className={styles.title}>` heading (L166) and `aria-labelledby="ai-settings-title"` to the dialog root (AS3).
6. Replace the close button's `title='…'` with `aria-label="Close AI settings"` (keep `title` only if a tooltip is still desired alongside the label) (AS5).
7. In `AiSettingsModal.module.css`, change `.modal { z-index: 1000; }` (L11) to `z-index: var(--z-modal);` (AS6).
8. Replace `keys: Record<string, any>` (L10), and the three `const keyPayload: any = {}` (L82, L94 `opt: any`, L126/L138) with the typed payload/option shapes from `useAiConfigStore.types`. Where `buildProviderRequest` needs an options object (L94), type it via the function's parameter type rather than `any`.

## 5. Constraints & edge cases
- No `any` anywhere in the file after the change.
- Keep the existing form behaviour and validation (`computeValidation`, `applyDraftToStore`, `doTest`, `refreshModelsLocal`).
- `useFocusTrap(open)` must be called unconditionally (before the early `return null`) so hook order is stable across renders.
- exactOptionalPropertyTypes: `keyPayload.apiKey`/`baseUrl` are conditionally assigned — type the payload with optional fields, do not pass `undefined` keys.
- Escape currently has no handler; ensure adding one does not double-fire with any global Escape elsewhere (scope it to the dialog root only).

## 6. Acceptance criteria
- [ ] axe: no serious/critical violations on the open modal.
- [ ] Dialog has an accessible name (`aria-labelledby` → visible "AI Settings" heading).
- [ ] Close button has accessible name "Close AI settings".
- [ ] Tab/Shift+Tab cycle within the dialog; Escape closes; focus returns to the opener.
- [ ] Dialog is portaled to `document.body`.
- [ ] Overlay `z-index` is `var(--z-modal)`.
- [ ] `npm run typecheck` clean with no `any` in the file.

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
npm run test
# gate: general
```

## 8. Tests to add
Add `src/components/ai/settings/__tests__/AiSettingsModal.a11y.test.tsx` (also referenced by MFP-20):
```tsx
it('has an accessible name and closes on Escape', () => {
  const onClose = vi.fn();
  render(<AiSettingsModal open onClose={onClose} />);
  const dialog = screen.getByRole('dialog', { name: /ai settings/i }); // aria-labelledby resolves
  expect(within(dialog).getByRole('button', { name: 'Close AI settings' })).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});
it('has no serious axe violations', async () => {
  const { container } = render(<AiSettingsModal open onClose={() => {}} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

## 9. Proof checklist
- [ ] `typecheck-clean` → `proofs/MFP-08/typecheck.txt`
- [ ] `axe-clean` → `proofs/MFP-08/axe.json`
- [ ] `manual-keyboard` → `proofs/MFP-08/keyboard.md` (Tab cycle, Escape, focus-restore)
- [ ] `screenshot` → `proofs/MFP-08/before.png` + `proofs/MFP-08/after.png`
