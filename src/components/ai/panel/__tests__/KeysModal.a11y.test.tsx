// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertDialogA11y } from '@/test/assertDialogA11y';
import { KeysModal } from '../KeysModal';

afterEach(cleanup);

describe('KeysModal a11y (MFP-20)', () => {
  it('satisfies the shared dialog contract (focus trap, Escape, restore)', () => {
    const onClose = vi.fn();

    assertDialogA11y(
      () => render(<KeysModal open onClose={onClose} />),
      (r) => r.rerender(<KeysModal open={false} onClose={onClose} />),
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('preserves provider tab semantics and named action buttons', () => {
    render(<KeysModal open onClose={() => undefined} />);

    const dialog = screen.getByRole('dialog', { name: /provider keys/i });
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(within(dialog).getByRole('tablist', { name: /providers/i })).toBeDefined();
    expect(within(dialog).getAllByRole('tab')).toHaveLength(4);
    expect(within(dialog).getByRole('button', { name: /cancel and close keys modal/i })).toBeDefined();
    expect(within(dialog).getByRole('button', { name: /save provider keys/i })).toBeDefined();
  });
});
