// @vitest-environment jsdom

/**
 * MFP-11 — NewProjectModal keyboard-operable template cards. Asserts the grid is
 * a radiogroup of radios, roving tabindex, and keyboard selection (Enter/Space/
 * arrows) move aria-checked. The dialog shell (trap/Escape) is the base Modal.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewProjectModal } from '../NewProjectModal';

afterEach(cleanup);

describe('NewProjectModal template grid a11y (MFP-11)', () => {
  it('renders a named radiogroup of radio cards with one checked', () => {
    render(<NewProjectModal isOpen onClose={() => {}} onCreateProject={vi.fn()} />);
    const group = screen.getByRole('radiogroup', { name: /project template/i });
    const radios = within(group).getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(1);
    expect(radios.filter(r => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    // each radio is described by its description text
    expect(radios[0].getAttribute('aria-describedby')).toBeTruthy();
  });

  it('uses roving tabindex (exactly one tabbable radio)', () => {
    render(<NewProjectModal isOpen onClose={() => {}} onCreateProject={vi.fn()} />);
    const radios = within(screen.getByRole('radiogroup', { name: /project template/i })).getAllByRole('radio');
    expect(radios.filter(r => r.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(radios.filter(r => r.getAttribute('tabindex') === '-1')).toHaveLength(radios.length - 1);
  });

  it('selects a card with Enter and Space', () => {
    render(<NewProjectModal isOpen onClose={() => {}} onCreateProject={vi.fn()} />);
    const radios = within(screen.getByRole('radiogroup', { name: /project template/i })).getAllByRole('radio');
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
    fireEvent.keyDown(radios[0], { key: ' ' });
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
  });

  it('moves selection with arrow keys (roving)', () => {
    render(<NewProjectModal isOpen onClose={() => {}} onCreateProject={vi.fn()} />);
    const radios = within(screen.getByRole('radiogroup', { name: /project template/i })).getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios[1].getAttribute('tabindex')).toBe('0');
    expect(radios[0].getAttribute('tabindex')).toBe('-1');
  });
});
