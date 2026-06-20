// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertDialogA11y } from '@/test/assertDialogA11y';
import { SettingsModal } from '../SettingsModal';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('SettingsModal a11y (MFP-20)', () => {
  it('satisfies the shared dialog contract (focus trap, Escape, restore)', () => {
    const onClose = vi.fn();

    assertDialogA11y(
      () => render(<SettingsModal open onClose={onClose} />),
      (r) => r.rerender(<SettingsModal open={false} onClose={onClose} />),
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('preserves tablist, provider radiogroup, and model listbox semantics', () => {
    render(<SettingsModal open onClose={() => undefined} />);

    const dialog = screen.getByRole('dialog', { name: /settings/i });
    expect(within(dialog).getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical');
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent)).toContain('General');

    fireEvent.click(within(dialog).getByRole('tab', { name: 'General' }));

    expect(within(dialog).getByRole('radiogroup', { name: /ai provider/i })).toBeDefined();
    expect(within(dialog).getByRole('listbox', { name: /model list/i })).toBeDefined();
  });
});
