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
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WelcomeModal from '../WelcomeModal';

afterEach(cleanup);

beforeEach(() => {
  const canvasContext: Partial<CanvasRenderingContext2D> = {
    setTransform: () => undefined,
    clearRect: () => undefined,
    beginPath: () => undefined,
    ellipse: () => undefined,
    stroke: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    lineWidth: 1,
    strokeStyle: '',
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '',
  };
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: (contextId: string) => (
      contextId === '2d' ? canvasContext as CanvasRenderingContext2D : null
    ),
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
});

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
