// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertDialogA11y } from '@/test/assertDialogA11y';
import { UnsavedChangesDialog } from '../UnsavedChangesDialog';

afterEach(cleanup);

function renderDialog(overrides: Partial<ComponentProps<typeof UnsavedChangesDialog>> = {}) {
  const props: ComponentProps<typeof UnsavedChangesDialog> = {
    fileName: 'analysis.sql',
    onSave: vi.fn(),
    onDiscard: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  return {
    props,
    result: render(<UnsavedChangesDialog {...props} />),
  };
}

describe('UnsavedChangesDialog a11y (MFP-20)', () => {
  it('satisfies the shared dialog contract (focus trap, Escape, restore)', () => {
    const onCancel = vi.fn();

    assertDialogA11y(
      () => render(<UnsavedChangesDialog fileName="analysis.sql" onSave={vi.fn()} onDiscard={vi.fn()} onCancel={onCancel} />),
      (r) => r.unmount(),
    );

    expect(onCancel).toHaveBeenCalled();
  });

  it('has a visible name, description, and keyboard-operable decisions', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: /save changes/i });
    expect(dialog.getAttribute('aria-describedby')).toBe('ucd-desc');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDefined();
    expect(within(dialog).getByRole('button', { name: "Don't Save" })).toBeDefined();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDefined();
  });
});
