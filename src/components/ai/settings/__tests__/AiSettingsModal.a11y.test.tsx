// @vitest-environment jsdom

/**
 * MFP-08 — AiSettingsModal conformant-dialog a11y. Asserts the fixes AS1–AS6:
 * accessible dialog name, named close button, dialog-scoped Escape, portal to
 * body, and initial focus moved into the dialog. (Also referenced by MFP-20.)
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertDialogA11y } from '@/test/assertDialogA11y';
import { AiSettingsModal } from '../AiSettingsModal';

afterEach(cleanup);

describe('AiSettingsModal a11y (MFP-08)', () => {
  it('satisfies the shared dialog contract (focus trap, Escape, restore)', () => {
    const onClose = vi.fn();

    assertDialogA11y(
      () => render(<AiSettingsModal open onClose={onClose} />),
      (r) => r.rerender(<AiSettingsModal open={false} onClose={onClose} />),
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('exposes an accessible dialog name via aria-labelledby', () => {
    render(<AiSettingsModal open onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /ai settings/i });
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('names the close button "Close AI settings"', () => {
    render(<AiSettingsModal open onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /ai settings/i });
    expect(within(dialog).getByRole('button', { name: 'Close AI settings' })).toBeDefined();
  });

  it('closes on Escape via the dialog-scoped handler', () => {
    const onClose = vi.fn();
    render(<AiSettingsModal open onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog', { name: /ai settings/i }), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('is portaled to document.body', () => {
    render(<AiSettingsModal open onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /ai settings/i });
    expect(dialog.parentElement).toBe(document.body);
  });

  it('moves focus into the dialog on open', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    render(<AiSettingsModal open onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /ai settings/i });
    expect(dialog.contains(document.activeElement)).toBe(true);
    opener.remove();
  });
});
