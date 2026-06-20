import { fireEvent, type RenderResult } from '@testing-library/react';
import { expect } from 'vitest';
import { getFocusableElements } from '@/hooks/useFocusTrap';

/**
 * Reusable dialog accessibility contract for any base-`Modal`-derived dialog.
 * Mechanically asserts WCAG 2.4.3 (Focus Order) / 2.1.2 / 4.1.2 expectations:
 *   1. focus moves into the dialog on open;
 *   2. Tab from the last focusable wraps to the first;
 *   3. Shift+Tab from the first wraps to the last;
 *   4. an Escape keydown on the dialog is handled (does not throw);
 *   5. focus restores to the opener once the caller closes the dialog.
 *
 * The dialog is controlled, so the caller supplies how to `open` (returns the
 * RenderResult) and how to `close` it (e.g. rerender with `isOpen={false}`).
 * jsdom does not perform native Tab traversal, so wrap behaviour is driven with
 * `.focus()` + `fireEvent.keyDown` exactly as the trap handler expects.
 *
 * Reused by Modal foundation tests (MFP-07) and consumer-migration tests (MFP-20).
 */
export function assertDialogA11y(open: () => RenderResult, close: (r: RenderResult) => void): void {
  const opener = document.createElement('button');
  opener.textContent = 'opener';
  document.body.appendChild(opener);
  opener.focus();
  expect(document.activeElement).toBe(opener);

  const r = open();
  const dialog = r.getByRole('dialog');

  // 1. initial focus moved into the dialog
  expect(dialog.contains(document.activeElement)).toBe(true);

  const focusables = getFocusableElements(dialog);
  expect(focusables.length).toBeGreaterThanOrEqual(2);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  // 2. Tab from last wraps to first
  last.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(document.activeElement).toBe(first);

  // 3. Shift+Tab from first wraps to last
  first.focus();
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(last);

  // 4. Escape is handled by the dialog-scoped key handler
  fireEvent.keyDown(dialog, { key: 'Escape' });

  // 5. focus restores to the opener on close
  close(r);
  expect(document.activeElement).toBe(opener);

  opener.remove();
}
