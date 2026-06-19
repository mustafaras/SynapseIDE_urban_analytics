// @vitest-environment jsdom

/**
 * MFP-13 — KeysModal now consumes the shared useFocusTrap (the bespoke Tab loop +
 * manual restore were removed). Proves the migration preserves focus move-in and
 * focus-restore to the opener. (The Tab/Shift+Tab wrap is covered by the canonical
 * useFocusTrap.test.ts; jsdom's getComputedStyle makes styled-components ordering
 * unreliable for an in-component wrap assertion.)
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { KeysModal } from '../KeysModal';

afterEach(cleanup);

it('moves focus into the dialog on open and restores it to the opener on close', () => {
  const opener = document.createElement('button');
  document.body.appendChild(opener);
  opener.focus();

  const { getByTestId, rerender } = render(<KeysModal open onClose={() => {}} />);
  const dialog = getByTestId('keys-modal');
  expect(dialog.getAttribute('role')).toBe('dialog');
  expect(dialog.contains(document.activeElement)).toBe(true); // focus moved in (shared hook)

  rerender(<KeysModal open={false} onClose={() => {}} />);
  expect(document.activeElement).toBe(opener); // shared hook restored the opener
  opener.remove();
});

it('exposes the dialog accessible title', () => {
  const { getByTestId } = render(<KeysModal open onClose={() => {}} />);
  expect(getByTestId('keys-modal').getAttribute('aria-labelledby')).toBeTruthy();
});
