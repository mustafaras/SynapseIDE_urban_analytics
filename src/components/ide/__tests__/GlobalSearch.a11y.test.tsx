// @vitest-environment jsdom

/**
 * MFP-12 — GlobalSearch combobox/listbox semantics + keyboard nav (GS1–GS4).
 * The search service is mocked to return fixed filename results.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/search', () => ({
  indexDocs: vi.fn(),
  queryDocs: vi.fn(),
}));
import { queryDocs } from '../../../services/search';
import { GlobalSearch } from '../GlobalSearch';

const mk = (i: number) => ({
  docId: `d${i}`, docName: `File${i}.ts`, docPath: `/src/File${i}.ts`,
  line: 0, preview: '', matchIndex: 0, matchLength: 0, kind: 'filename', isOpen: false,
});

afterEach(cleanup);
beforeEach(() => {
  vi.mocked(queryDocs).mockResolvedValue([mk(1), mk(2), mk(3)]);
});

async function openWithResults() {
  render(<GlobalSearch isOpen onClose={() => {}} />);
  const input = screen.getByRole('combobox', { name: /global search/i });
  fireEvent.change(input, { target: { value: 'File' } });
  await waitFor(() => expect(screen.getAllByRole('option').length).toBe(3));
  return input;
}

describe('GlobalSearch a11y (MFP-12)', () => {
  it('exposes the input as a combobox controlling the results listbox', async () => {
    const input = await openWithResults();
    expect(input.getAttribute('aria-controls')).toBe('global-search-listbox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('listbox').id).toBe('global-search-listbox');
  });

  it('renders results as role=option (no <button aria-selected> listbox children)', async () => {
    await openWithResults();
    const options = screen.getAllByRole('option');
    expect(options.every(o => o.tagName !== 'BUTTON')).toBe(true);
    expect(document.querySelectorAll('button[aria-selected]').length).toBe(0);
  });

  it('drives selection via aria-activedescendant with wrap + Home/End (no DOM focus move)', async () => {
    const input = await openWithResults();
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe('global-search-opt-0');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe('global-search-opt-1');
    fireEvent.keyDown(input, { key: 'End' });
    expect(input.getAttribute('aria-activedescendant')).toBe('global-search-opt-2');
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // wrap to first
    expect(input.getAttribute('aria-activedescendant')).toBe('global-search-opt-0');
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // wrap to last
    expect(input.getAttribute('aria-activedescendant')).toBe('global-search-opt-2');
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input.getAttribute('aria-activedescendant')).toBe('global-search-opt-0');
    // the active option reflects aria-selected, input keeps DOM focus
    expect(screen.getByRole('option', { name: '/src/File1.ts' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(input);
  });

  it('renders the scope filters as a roving radiogroup', async () => {
    await openWithResults();
    const group = screen.getByRole('radiogroup', { name: /search scope/i });
    const radios = within(group).getAllByRole('radio');
    expect(radios.length).toBe(4);
    expect(radios.filter(r => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    expect(radios.filter(r => r.getAttribute('tabindex') === '0')).toHaveLength(1);
    // arrow moves the checked scope
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
  });
});
