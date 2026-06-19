// @vitest-environment jsdom

/**
 * MFP-14 — accessible names across dialogs.
 *
 * WelcomeModal must name its `role="dialog"` from the visible
 * `<h1 id="welcome-modal-title">` via `aria-labelledby` (WCAG 2.5.3 Label in
 * Name / 4.1.2 Name, Role, Value) and must NOT carry a duplicate `aria-label`
 * that could drift from the visible heading.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import WelcomeModal from '../WelcomeModal';

afterEach(cleanup);

describe('WelcomeModal accessible name (MFP-14)', () => {
  it('names the dialog from the visible #welcome-modal-title heading, with no stray aria-label', () => {
    render(<WelcomeModal open onClose={() => undefined} />);

    const dialog = screen.getByRole('dialog');
    // Programmatic name is the visible heading, not a parallel aria-label.
    expect(dialog.getAttribute('aria-labelledby')).toBe('welcome-modal-title');
    expect(dialog.getAttribute('aria-label')).toBeNull();

    const heading = document.getElementById('welcome-modal-title');
    expect(heading).not.toBeNull();
    expect((heading?.textContent ?? '').replace(/\s+/g, ' ').trim()).toContain('Urban Analytics');

    // The accessible-name algorithm (aria-labelledby → heading) must resolve to
    // the visible title text — getByRole's name option exercises that path.
    expect(screen.getByRole('dialog', { name: /Urban Analytics/ })).toBe(dialog);
  });
});
