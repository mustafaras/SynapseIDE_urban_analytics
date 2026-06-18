# MFP-08 — manual-keyboard proof (AiSettingsModal)

Keyboard / focus behaviour of the rebuilt `AiSettingsModal`. The first three rows
are backed by passing assertions in
`src/components/ai/settings/__tests__/AiSettingsModal.a11y.test.tsx` (5/5).

| Behaviour | Expected | Verified by |
|---|---|---|
| **Accessible name** | Dialog is named "AI Settings" via `aria-labelledby` → the visible `<strong id={useId}>` heading. | test: `getByRole('dialog', { name: /ai settings/i })` resolves |
| **Close button name** | The `×` button exposes the accessible name "Close AI settings" (was `title`-only). | test: `getByRole('button', { name: 'Close AI settings' })` |
| **Escape** | `Escape` closes the dialog via a handler scoped to the dialog root (not a global window listener). | test: `fireEvent.keyDown(dialog, {key:'Escape'})` → `onClose` called |
| **Focus move-in** | On open, focus moves into the dialog (first focusable). | test: `dialog.contains(document.activeElement)` |
| **Focus restore** | On close, the shared `useFocusTrap` restores focus to the opener. | `useFocusTrap(open)` capture/restore (proven in MFP-02/07) |
| **Tab / Shift+Tab** | Focus cycles within the dialog; cannot leak to the page behind. | `useFocusTrap` wrap handler (proven in MFP-02/07) |
| **Portal** | Dialog is portaled to `document.body`. | test: `dialog.parentElement === document.body` |

## Manual checklist (browser)
- [x] Tab from the last control wraps to the first; Shift+Tab from the first wraps to the last.
- [x] Esc closes; focus returns to the trigger that opened the modal.
- [x] The `×` button is announced as "Close AI settings".
- [x] Screen reader announces the dialog as "AI Settings".
- [x] The request-preview `<pre>` is keyboard-reachable (tabIndex=0, labelled).

The close button's focus ring after open is visible in `after.png` (focus moved into the dialog).
