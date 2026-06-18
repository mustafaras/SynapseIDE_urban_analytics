// @vitest-environment jsdom

/**
 * MFP-07 — formal foundation suite for the base Modal. Exercises the reusable
 * dialog a11y contract (assertDialogA11y) plus the MFP-06 fixes: unique useId()
 * title ids across instances and the ariaLabel / describedby wiring.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Modal } from '../Modal';
import { assertDialogA11y } from '@/test/assertDialogA11y';

afterEach(cleanup);

const noop = () => {};

describe('Modal foundation (MFP-07)', () => {
  it('satisfies the dialog a11y contract (focus-in, Tab/Shift+Tab wrap, Escape, restore)', () => {
    assertDialogA11y(
      () =>
        render(
          <Modal isOpen title="Contract" onClose={noop} showCloseButton={false}>
            <button>A</button>
            <button>B</button>
          </Modal>,
        ),
      (r) =>
        r.rerender(
          <Modal isOpen={false} title="Contract" onClose={noop} showCloseButton={false}>
            <button>A</button>
            <button>B</button>
          </Modal>,
        ),
    );
  });

  it('assigns a unique useId() title id to each simultaneous modal (no hardcoded modal-title)', () => {
    render(
      <>
        <Modal isOpen title="One" onClose={noop}>x</Modal>
        <Modal isOpen title="Two" onClose={noop}>y</Modal>
      </>,
    );
    const ids = screen
      .getAllByRole('dialog', { hidden: true })
      .map((d) => d.getAttribute('aria-labelledby'));
    expect(ids).toHaveLength(2);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) {
      expect(document.getElementById(id as string)).not.toBeNull();
    }
  });

  it('wires aria-label (not aria-labelledby) and aria-describedby when untitled', () => {
    render(
      <Modal isOpen onClose={noop} ariaLabel="Untitled dialog" describedby="desc-1">
        <p id="desc-1">A description.</p>
        <button>x</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Untitled dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBeNull();
    expect(dialog.getAttribute('aria-describedby')).toBe('desc-1');
  });

  it('prefers aria-labelledby over aria-label when a visible title is present', () => {
    render(
      <Modal isOpen title="Titled" ariaLabel="ignored" onClose={noop}>
        <button>x</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(dialog.getAttribute('aria-label')).toBeNull();
  });
});
