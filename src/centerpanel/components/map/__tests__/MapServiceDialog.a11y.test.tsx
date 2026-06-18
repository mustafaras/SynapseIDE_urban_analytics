// @vitest-environment jsdom

/**
 * MFP-09 — MapServiceDialog keyboard conformance. Asserts focus move-in,
 * dialog-scoped Escape, focus restore to the opener, and that the invalid
 * listbox-of-buttons pattern is gone.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapServiceDialog } from '../../MapServiceDialog';

afterEach(cleanup);

const baseProps = {
  bounds: [13.37, 52.51, 13.39, 52.53] as [number, number, number, number],
  overlayLayers: [],
  onAddLayer: vi.fn(),
  onRemoveLayer: vi.fn(),
};

describe('MapServiceDialog a11y (MFP-09)', () => {
  it('moves initial focus into the dialog on open', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    render(<MapServiceDialog open {...baseProps} onClose={vi.fn()} />);
    const overlay = screen.getByTestId('map-service-dialog-overlay');
    expect(overlay.contains(document.activeElement)).toBe(true);
    opener.remove();
  });

  it('closes on Escape (dialog-scoped) and restores focus to the opener on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const onClose = vi.fn();
    const { rerender } = render(<MapServiceDialog open {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId('map-service-dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    rerender(<MapServiceDialog open={false} {...baseProps} onClose={onClose} />);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('does not render the invalid listbox-of-buttons pattern', () => {
    render(<MapServiceDialog open {...baseProps} onClose={vi.fn()} />);
    const overlay = screen.getByTestId('map-service-dialog-overlay');
    expect(overlay.querySelector('[role="listbox"]')).toBeNull();
  });
});
