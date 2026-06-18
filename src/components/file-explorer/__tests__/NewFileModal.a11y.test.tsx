// @vitest-environment jsdom

/**
 * MFP-10 — NewFileModal accessibility. Asserts the dialog boundary is the panel
 * (NF1), each selection step is a keyboard-operable radiogroup of radios (NF2),
 * focus moves into the dialog and Escape closes (NF3).
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NewFileModal from '../NewFileModal';

afterEach(cleanup);

const baseProps = { onClose: vi.fn(), onCreateFile: vi.fn(), sidebarWidth: 300 };

describe('NewFileModal a11y (MFP-10)', () => {
  it('puts the dialog boundary (role=dialog + accessible name) on the panel, not the overlay', () => {
    render(<NewFileModal isOpen {...baseProps} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Create New File' });
    // the dismiss overlay is role=presentation, so getByRole('dialog') is the panel
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('renders the category step as a radiogroup of keyboard-operable radios with one checked', () => {
    render(<NewFileModal isOpen {...baseProps} onClose={vi.fn()} />);
    const group = screen.getByRole('radiogroup', { name: 'File category' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
    // real <button> elements → Tab-reachable + Enter/Space operable natively
    expect(radios.every(r => r.tagName === 'BUTTON')).toBe(true);
    expect(radios.filter(r => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
  });

  it('advances category -> language via control activation (keyboard-equivalent)', () => {
    render(<NewFileModal isOpen {...baseProps} onClose={vi.fn()} />);
    const group = screen.getByRole('radiogroup', { name: 'File category' });
    const firstRadio = within(group).getAllByRole('radio')[0];
    firstRadio.focus();
    fireEvent.click(firstRadio); // models Enter/Space activation of a native button
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeTruthy();
  });

  it('moves initial focus into the dialog and closes on Escape', () => {
    const onClose = vi.fn();
    render(<NewFileModal isOpen {...baseProps} onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: 'Create New File' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
