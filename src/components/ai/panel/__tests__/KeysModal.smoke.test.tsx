// @vitest-environment jsdom

/**
 * MFP-01 render smoke — proves KeysModal mounts without the undefined-`GOLD`
 * ReferenceError that previously crashed the Provider Keys modal on mount.
 */
import { render } from '@testing-library/react';
import { KeysModal } from '../KeysModal';

it('mounts without a ReferenceError and exposes the dialog title', () => {
  const { getByTestId } = render(<KeysModal open onClose={() => {}} />);
  const dialog = getByTestId('keys-modal');
  expect(dialog.getAttribute('role')).toBe('dialog');
  // title node is the aria-labelledby target; its presence proves render did not throw
  expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
});
