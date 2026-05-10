// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { FileNode } from '@/types/state';
import { useFileExplorerStore } from '../fileExplorerStore';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal FileNode for testing without relying on sampleFiles. */
const makeFileNode = (overrides: Partial<FileNode> & { id: string; path: string }): FileNode => ({
  name: overrides.path.split('/').pop() ?? overrides.id,
  type: 'file',
  size: 0,
  lastModified: new Date('2026-05-06T00:00:00.000Z'),
  ...overrides,
});

const makeFolderNode = (
  overrides: Partial<FileNode> & { id: string; path: string },
): FileNode => ({
  name: overrides.path.split('/').pop() ?? overrides.id,
  type: 'folder',
  size: 0,
  lastModified: new Date('2026-05-06T00:00:00.000Z'),
  children: [],
  ...overrides,
});

/** Reset store to a clean, known state (empty file list) before each test. */
const resetStore = () => {
  useFileExplorerStore.getState().clearFiles();
};

beforeEach(() => {
  resetStore();
  try { localStorage.clear(); } catch {}
});

// ── addFile ───────────────────────────────────────────────────────────────────

describe('fileExplorerStore — addFile (Prompt 10 / 28)', () => {
  it('adds a file to the root when no parentPath is given', () => {
    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'f1', path: 'src/a.ts' }));

    const files = useFileExplorerStore.getState().files;
    expect(files.some(f => f.id === 'f1')).toBe(true);
  });

  it('adds a file inside a folder when parentPath matches', () => {
    useFileExplorerStore
      .getState()
      .addFile(makeFolderNode({ id: 'dir-1', path: 'src' }));

    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'f2', path: 'src/b.ts' }), 'src');

    const folder = useFileExplorerStore.getState().files.find(f => f.id === 'dir-1');
    expect(folder?.children?.some(c => c.id === 'f2')).toBe(true);
  });

  it('auto-generates an id when none provided', () => {
    const nodeWithoutId = { path: 'src/auto.ts', type: 'file' as const, name: 'auto.ts',
      size: 0, lastModified: new Date() };
    useFileExplorerStore.getState().addFile(nodeWithoutId as FileNode);

    const files = useFileExplorerStore.getState().files;
    expect(files.some(f => f.name === 'auto.ts')).toBe(true);
  });
});

// ── deleteFile ────────────────────────────────────────────────────────────────

describe('fileExplorerStore — deleteFile (Prompt 10 / 28)', () => {
  it('removes a root-level file', () => {
    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'del-1', path: 'src/del.ts' }));
    useFileExplorerStore.getState().deleteFile('del-1');

    expect(
      useFileExplorerStore.getState().files.some(f => f.id === 'del-1'),
    ).toBe(false);
  });

  it('removes a nested file while leaving siblings intact', () => {
    useFileExplorerStore
      .getState()
      .addFile(makeFolderNode({ id: 'dir-del', path: 'src' }));
    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'sib-1', path: 'src/a.ts' }), 'src');
    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'sib-2', path: 'src/b.ts' }), 'src');

    useFileExplorerStore.getState().deleteFile('sib-1');

    const folder = useFileExplorerStore.getState().files.find(f => f.id === 'dir-del');
    expect(folder?.children?.some(c => c.id === 'sib-1')).toBe(false);
    expect(folder?.children?.some(c => c.id === 'sib-2')).toBe(true);
  });

  it('also removes the deleted file from selectedFiles', () => {
    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'sel-del', path: 'sel.ts' }));
    useFileExplorerStore.getState().selectFile('sel-del');

    expect(useFileExplorerStore.getState().selectedFiles).toContain('sel-del');

    useFileExplorerStore.getState().deleteFile('sel-del');
    expect(useFileExplorerStore.getState().selectedFiles).not.toContain('sel-del');
  });
});

// ── renameFile ────────────────────────────────────────────────────────────────

describe('fileExplorerStore — renameFile (Prompt 10 / 28)', () => {
  it('updates the file name and path accordingly', () => {
    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'ren-1', path: 'src/old.ts', name: 'old.ts' }));

    useFileExplorerStore.getState().renameFile('ren-1', 'new.ts');

    const file = useFileExplorerStore.getState().getFileById('ren-1');
    expect(file?.name).toBe('new.ts');
    expect(file?.path).toBe('src/new.ts');
  });

  it('is a no-op for a non-existent id', () => {
    const before = useFileExplorerStore.getState().files.length;
    expect(() =>
      useFileExplorerStore.getState().renameFile('does-not-exist', 'whatever.ts'),
    ).not.toThrow();
    expect(useFileExplorerStore.getState().files.length).toBe(before);
  });
});

// ── updateFile ────────────────────────────────────────────────────────────────

describe('fileExplorerStore — updateFile (Prompt 09 / 28)', () => {
  it('applies partial updates to a file', () => {
    useFileExplorerStore
      .getState()
      .addFile(makeFileNode({ id: 'upd-1', path: 'src/upd.ts', content: 'old' }));

    useFileExplorerStore.getState().updateFile('upd-1', { content: 'new', isDirty: true });

    const file = useFileExplorerStore.getState().getFileById('upd-1');
    expect(file?.content).toBe('new');
    expect(file?.isDirty).toBe(true);
  });
});

// ── selection ─────────────────────────────────────────────────────────────────

describe('fileExplorerStore — selection (Prompt 10 / 28)', () => {
  it('single-select replaces previous selection', () => {
    useFileExplorerStore.getState().addFile(makeFileNode({ id: 'selA', path: 'a.ts' }));
    useFileExplorerStore.getState().addFile(makeFileNode({ id: 'selB', path: 'b.ts' }));

    useFileExplorerStore.getState().selectFile('selA');
    useFileExplorerStore.getState().selectFile('selB');

    expect(useFileExplorerStore.getState().selectedFiles).toEqual(['selB']);
  });

  it('multi-select adds to selection', () => {
    useFileExplorerStore.getState().addFile(makeFileNode({ id: 'mselA', path: 'a.ts' }));
    useFileExplorerStore.getState().addFile(makeFileNode({ id: 'mselB', path: 'b.ts' }));

    useFileExplorerStore.getState().selectFile('mselA', true);
    useFileExplorerStore.getState().selectFile('mselB', true);

    expect(useFileExplorerStore.getState().selectedFiles).toContain('mselA');
    expect(useFileExplorerStore.getState().selectedFiles).toContain('mselB');
  });

  it('multi-select toggles off an already-selected item', () => {
    useFileExplorerStore.getState().addFile(makeFileNode({ id: 'tselA', path: 'a.ts' }));
    useFileExplorerStore.getState().selectFile('tselA', true);
    useFileExplorerStore.getState().selectFile('tselA', true); // toggle off

    expect(useFileExplorerStore.getState().selectedFiles).not.toContain('tselA');
  });

  it('clearSelection empties the selection', () => {
    useFileExplorerStore.getState().addFile(makeFileNode({ id: 'clrA', path: 'a.ts' }));
    useFileExplorerStore.getState().selectFile('clrA');
    useFileExplorerStore.getState().clearSelection();

    expect(useFileExplorerStore.getState().selectedFiles).toHaveLength(0);
  });
});

// ── search query clamping ─────────────────────────────────────────────────────

describe('fileExplorerStore — search query clamping (Prompt 28)', () => {
  it('clamps search query to MAX_FILE_SEARCH_QUERY_CHARS (200)', () => {
    const longQuery = 'x'.repeat(250);
    useFileExplorerStore.getState().setSearchQuery(longQuery);
    expect(useFileExplorerStore.getState().searchQuery.length).toBeLessThanOrEqual(200);
  });
});
