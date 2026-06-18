// @vitest-environment jsdom

/**
 * MFP-06 — base Modal accessibility rebuild. Deterministic jsdom evidence for
 * the foundation behaviours (M1–M9): focus move-in + restore, focus-trap wrap,
 * unique useId() title ids, dialog-scoped Escape, overlay-click close, and the
 * inerted background. Complements the Playwright a11y audit.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Modal } from '../Modal';

afterEach(cleanup);

describe('Modal a11y foundation (MFP-06)', () => {
  it('moves focus into the dialog on open and restores it to the opener on close', () => {
    const opener = document.createElement('button');
    opener.textContent = 'open';
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const { rerender } = render(
      <Modal isOpen title="T" onClose={() => {}}>
        <button>A</button>
        <button>B</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    // focus is now inside the dialog (not the opener)
    expect(dialog.contains(document.activeElement)).toBe(true);

    rerender(
      <Modal isOpen={false} title="T" onClose={() => {}}>
        <button>A</button>
        <button>B</button>
      </Modal>,
    );
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('gives each simultaneous Modal a unique title id (no hardcoded modal-title)', () => {
    render(
      <>
        <Modal isOpen title="One" onClose={() => {}}>x</Modal>
        <Modal isOpen title="Two" onClose={() => {}}>y</Modal>
      </>,
    );
    // Use { hidden: true } so the inerted/aria-hidden sibling dialog is counted
    // too — the second modal correctly inerts the first (stacked semantics).
    const ids = screen
      .getAllByRole('dialog', { hidden: true })
      .map((d) => d.getAttribute('aria-labelledby'));
    expect(ids).toHaveLength(2);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(2); // unique useId() ids, not a hardcoded "modal-title"
    // and the rendered title node actually carries that id
    for (const id of ids) {
      expect(document.getElementById(id as string)).not.toBeNull();
    }
  });

  it('wraps focus with the trap (Shift+Tab from first → last, Tab from last → first)', () => {
    render(
      <Modal isOpen title="T" onClose={() => {}} showCloseButton={false}>
        <button>A</button>
        <button>B</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const focusables = Array.from(dialog.querySelectorAll('button'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('closes on Escape only when closeOnEscape is set, and the handler is dialog-scoped', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen title="T" onClose={onClose} closeOnEscape={false}>
        <button>A</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <Modal isOpen title="T" onClose={onClose} closeOnEscape>
        <button>A</button>
      </Modal>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on overlay backdrop click but not on clicks inside the panel', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="T" onClose={onClose}>
        <button>inside</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog); // click inside the panel — must NOT close
    expect(onClose).not.toHaveBeenCalled();

    const overlay = dialog.parentElement as HTMLElement; // the backdrop
    fireEvent.click(overlay); // click the backdrop — closes
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('inerts a background sibling while open and restores it on close', () => {
    const bg = document.createElement('div');
    bg.innerHTML = '<button id="bg-btn">behind</button>';
    document.body.appendChild(bg);

    const { rerender } = render(
      <Modal isOpen title="T" onClose={() => {}}>
        <button>A</button>
      </Modal>,
    );
    expect(bg.hasAttribute('inert')).toBe(true);
    expect(bg.getAttribute('aria-hidden')).toBe('true');

    rerender(
      <Modal isOpen={false} title="T" onClose={() => {}}>
        <button>A</button>
      </Modal>,
    );
    expect(bg.hasAttribute('inert')).toBe(false);
    expect(bg.hasAttribute('aria-hidden')).toBe(false);
    bg.remove();
  });
});
