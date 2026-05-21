// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { FileNode } from '@/types/state';
import { MAX_HISTORY_CONTENT_CHARS, useEditorStore } from '../editorStore';

const PERSISTED_KEY = 'enhanced-ide-editor-state';

const makeFile = (overrides: Partial<FileNode> & { path: string }): FileNode => ({
  id: overrides.id ?? `file-${overrides.path}`,
  name: overrides.name ?? overrides.path.split('/').pop() ?? overrides.path,
  type: 'file',
  path: overrides.path,
  content: overrides.content ?? '',
  language: overrides.language ?? 'plaintext',
  lastModified: new Date('2026-05-03T00:00:00.000Z'),
  size: overrides.size ?? (overrides.content?.length ?? 0),
});

const resetStore = () => {
  useEditorStore.setState({ tabs: [], activeTabId: null, history: {} });
};

beforeEach(() => {
  resetStore();
  try {
    localStorage.removeItem(PERSISTED_KEY);
  } catch {}
});

describe('editorStore — Prompt 05 tab model', () => {
  it('opens a new tab and marks it active with default origin "user"', () => {
    const file = makeFile({ path: 'src/foo.ts', content: 'export const a = 1;' });
    useEditorStore.getState().openTab(file);

    const state = useEditorStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.activeTabId).toBe(state.tabs[0].id);
    expect(state.tabs[0].origin).toBe('user');
    expect(state.tabs[0].previewMode).toBe(false);
    expect(state.tabs[0].lastAccessedAt).toBeTruthy();
    expect(state.tabs[0].isActive).toBe(true);
  });

  it('deduplicates by path: re-opening same path activates existing tab and repairs fileId', () => {
    const v1 = makeFile({ id: 'file-a-v1', path: 'src/foo.ts', content: 'v1' });
    useEditorStore.getState().openTab(v1);
    const firstTabId = useEditorStore.getState().activeTabId!;

    const v2 = makeFile({ id: 'file-a-v2', path: 'src/foo.ts', content: 'v2' });
    useEditorStore.getState().openTab(v2);

    const state = useEditorStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.activeTabId).toBe(firstTabId);
    // Repaired linkage so saves operate on the live FileNode.
    expect(state.tabs[0].fileId).toBe('file-a-v2');
  });

  it('marks a tab dirty on content edit and exits preview mode', () => {
    const file = makeFile({ path: 'src/foo.ts', content: 'a' });
    useEditorStore.getState().openTab(file, { previewMode: true });
    const tabId = useEditorStore.getState().activeTabId!;
    expect(useEditorStore.getState().tabs[0].previewMode).toBe(true);

    useEditorStore.getState().updateTabContent(tabId, 'a + edited');

    const tab = useEditorStore.getState().tabs[0];
    expect(tab.isDirty).toBe(true);
    expect(tab.previewMode).toBe(false);
  });

  it('saveTab clears dirty flag without losing content', () => {
    const file = makeFile({ path: 'src/foo.ts', content: 'a' });
    useEditorStore.getState().openTab(file);
    const tabId = useEditorStore.getState().activeTabId!;
    useEditorStore.getState().updateTabContent(tabId, 'edited');
    expect(useEditorStore.getState().tabs[0].isDirty).toBe(true);

    useEditorStore.getState().saveTab(tabId);

    const tab = useEditorStore.getState().tabs[0];
    expect(tab.isDirty).toBe(false);
    expect(tab.content).toBe('edited');
  });

  it('preview tab gets replaced when a different preview opens; dirty preview is preserved', () => {
    const a = makeFile({ path: 'src/a.ts', content: 'a' });
    const b = makeFile({ path: 'src/b.ts', content: 'b' });
    useEditorStore.getState().openTab(a, { previewMode: true });
    useEditorStore.getState().openTab(b, { previewMode: true });
    expect(useEditorStore.getState().tabs).toHaveLength(1);
    expect(useEditorStore.getState().tabs[0].path).toBe('src/b.ts');

    // Make it dirty, then open another preview — the dirty preview must NOT be replaced.
    const tabId = useEditorStore.getState().activeTabId!;
    useEditorStore.getState().updateTabContent(tabId, 'b edited');
    const c = makeFile({ path: 'src/c.ts', content: 'c' });
    useEditorStore.getState().openTab(c, { previewMode: true });

    const tabs = useEditorStore.getState().tabs;
    expect(tabs).toHaveLength(2);
    expect(tabs.find(t => t.path === 'src/b.ts')?.isDirty).toBe(true);
    expect(tabs.find(t => t.path === 'src/c.ts')?.previewMode).toBe(true);
  });

  it('stamps origin "ai-plan" with sourcePlanRunId when supplied', () => {
    const file = makeFile({ path: 'src/generated.py', content: '# ai' });
    useEditorStore.getState().openTab(file, { origin: 'ai-plan', sourcePlanRunId: 'pln_123' });

    const tab = useEditorStore.getState().tabs[0];
    expect(tab.origin).toBe('ai-plan');
    expect(tab.sourcePlanRunId).toBe('pln_123');
  });

  it('pin/unpin reorders the tab without losing identity', () => {
    const a = makeFile({ path: 'src/a.ts' });
    const b = makeFile({ path: 'src/b.ts' });
    const c = makeFile({ path: 'src/c.ts' });
    const store = useEditorStore.getState();
    store.openTab(a);
    store.openTab(b);
    store.openTab(c);

    const cId = useEditorStore.getState().tabs.find(t => t.path === 'src/c.ts')!.id;
    store.pinTab(cId);

    const tabs = useEditorStore.getState().tabs;
    expect(tabs[0].path).toBe('src/c.ts');
    expect(tabs[0].isPinned).toBe(true);
    expect(useEditorStore.getState().tabs.find(t => t.id === cId)?.isPinned).toBe(true);

    store.unpinTab(cId);
    expect(useEditorStore.getState().tabs.find(t => t.id === cId)?.isPinned).toBe(false);
  });

  it('closeTab on active tab activates the previous tab and removes its history', () => {
    const a = makeFile({ path: 'src/a.ts' });
    const b = makeFile({ path: 'src/b.ts' });
    const store = useEditorStore.getState();
    store.openTab(a);
    store.openTab(b);
    const bId = useEditorStore.getState().activeTabId!;
    expect(useEditorStore.getState().history[bId]).toBeDefined();

    store.closeTab(bId);

    const state = useEditorStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.activeTabId).toBe(state.tabs[0].id);
    expect(state.history[bId]).toBeUndefined();
  });

  it('persists tabs and activeTabId to localStorage; rehydrates with isActive synced', () => {
    const file = makeFile({ path: 'src/foo.ts', content: 'persist me' });
    useEditorStore.getState().openTab(file);
    useEditorStore.getState().setActiveTab(useEditorStore.getState().tabs[0].id);

    const raw = localStorage.getItem(PERSISTED_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.tabs).toHaveLength(1);
    expect(parsed.state.tabs[0].path).toBe('src/foo.ts');
    expect(parsed.state.activeTabId).toBe(parsed.state.tabs[0].id);
    // Preview mode must NOT survive a hard reload.
    expect(parsed.state.tabs[0].previewMode).toBe(false);
    // Persisted snapshot's isActive is canonicalized to false; live state is rehydrated separately.
    expect(parsed.state.tabs[0].isActive).toBe(false);
  });

  it('rehydrate path: setting state from a persisted snapshot reconciles activeTabId and isActive', async () => {
    // Stage a "previously persisted" snapshot directly in localStorage,
    // then ask the persist middleware to rehydrate the store from it.
    const persistedTabs = [
      {
        id: 'tab:src/a.ts:abc:001',
        fileId: 'file-a',
        name: 'a.ts',
        path: 'src/a.ts',
        content: 'persisted a',
        language: 'typescript',
        isDirty: false,
        isActive: false,
        isPinned: false,
        cursorPosition: { line: 1, column: 1 },
        scrollPosition: { top: 0, left: 0 },
        selections: [],
        origin: 'user',
        previewMode: false,
        lastAccessedAt: '2026-05-03T00:00:00.000Z',
      },
      {
        id: 'tab:src/b.ts:abc:002',
        fileId: 'file-b',
        name: 'b.ts',
        path: 'src/b.ts',
        content: 'persisted b',
        language: 'typescript',
        isDirty: true,
        isActive: false,
        isPinned: false,
        cursorPosition: { line: 1, column: 1 },
        scrollPosition: { top: 0, left: 0 },
        selections: [],
        origin: 'ai-plan',
        previewMode: false,
        lastAccessedAt: '2026-05-03T00:00:00.000Z',
        sourcePlanRunId: 'pln_xyz',
      },
    ];
    localStorage.setItem(
      PERSISTED_KEY,
      JSON.stringify({
        version: 3,
        state: {
          tabs: persistedTabs,
          activeTabId: 'tab:src/b.ts:abc:002',
          history: {},
        },
      })
    );

    await useEditorStore.persist.rehydrate();
    const state = useEditorStore.getState();

    expect(state.tabs).toHaveLength(2);
    expect(state.activeTabId).toBe('tab:src/b.ts:abc:002');
    // onRehydrateStorage re-derives isActive from activeTabId.
    expect(state.tabs.find(t => t.id === 'tab:src/b.ts:abc:002')?.isActive).toBe(true);
    expect(state.tabs.find(t => t.id === 'tab:src/a.ts:abc:001')?.isActive).toBe(false);
    // AI-plan provenance survives the reload.
    expect(state.tabs.find(t => t.id === 'tab:src/b.ts:abc:002')?.origin).toBe('ai-plan');
    expect(state.tabs.find(t => t.id === 'tab:src/b.ts:abc:002')?.sourcePlanRunId).toBe('pln_xyz');
    // Dirty state survives the reload (acceptance: "Dirty state is not lost silently").
    expect(state.tabs.find(t => t.id === 'tab:src/b.ts:abc:002')?.isDirty).toBe(true);
  });

  it('rehydrate path: missing activeTabId falls back to the first tab', async () => {
    localStorage.setItem(
      PERSISTED_KEY,
      JSON.stringify({
        version: 3,
        state: {
          tabs: [
            {
              id: 'tab:src/only.ts:abc:001',
              fileId: 'file-only',
              name: 'only.ts',
              path: 'src/only.ts',
              content: 'only',
              language: 'typescript',
              isDirty: false,
              isActive: false,
              isPinned: false,
              cursorPosition: { line: 1, column: 1 },
              scrollPosition: { top: 0, left: 0 },
              selections: [],
              origin: 'user',
              previewMode: false,
              lastAccessedAt: '2026-05-03T00:00:00.000Z',
            },
          ],
          activeTabId: 'tab:src/missing.ts:abc:999',
          history: {},
        },
      })
    );

    await useEditorStore.persist.rehydrate();
    const state = useEditorStore.getState();

    expect(state.activeTabId).toBe('tab:src/only.ts:abc:001');
    expect(state.tabs[0].isActive).toBe(true);
  });

  it('duplicateTab creates a fresh id and inherits content + history', () => {
    const file = makeFile({ path: 'src/foo.ts', content: 'orig' });
    useEditorStore.getState().openTab(file);
    const originalId = useEditorStore.getState().activeTabId!;
    useEditorStore.getState().addToHistory(originalId, 'snapshot-a', { line: 1, column: 1 });

    useEditorStore.getState().duplicateTab(originalId);

    const tabs = useEditorStore.getState().tabs;
    expect(tabs).toHaveLength(2);
    const copy = tabs.find(t => t.id !== originalId)!;
    expect(copy.id).not.toBe(originalId);
    expect(copy.origin).toBe('duplicate');
    expect(copy.content).toBe('orig');
    expect(useEditorStore.getState().history[copy.id].undo.length).toBe(1);
  });

  it('does not store oversized undo snapshots', () => {
    const file = makeFile({ path: 'src/huge.ts', content: 'small' });
    useEditorStore.getState().openTab(file);
    const tabId = useEditorStore.getState().activeTabId!;

    useEditorStore.getState().addToHistory(tabId, 'x'.repeat(MAX_HISTORY_CONTENT_CHARS + 1), {
      line: 1,
      column: 1,
    });

    expect(useEditorStore.getState().history[tabId]?.undo).toHaveLength(0);
  });

  it('marks restored tabs whose file reference no longer resolves', () => {
    const present = makeFile({ id: 'file-present', path: 'src/present.ts', content: 'ok' });
    const missing = makeFile({ id: 'file-missing', path: 'src/missing.ts', content: 'cached' });
    useEditorStore.getState().openTab(present);
    useEditorStore.getState().openTab(missing);

    useEditorStore.getState().recoverRestoredTabs([present]);

    const state = useEditorStore.getState();
    expect(state.tabs.find(tab => tab.path === 'src/present.ts')?.isMissingFile).toBe(false);
    const missingTab = state.tabs.find(tab => tab.path === 'src/missing.ts');
    expect(missingTab?.isMissingFile).toBe(true);
    expect(missingTab?.restoreMessage).toContain('no longer resolves');

    useEditorStore.getState().recoverRestoredTabs([present, missing]);
    expect(useEditorStore.getState().tabs.find(tab => tab.path === 'src/missing.ts')?.isMissingFile).toBe(false);
  });

  it('closeAllTabs is the only path that wipes persisted state', () => {
    const file = makeFile({ path: 'src/foo.ts' });
    useEditorStore.getState().openTab(file);
    expect(useEditorStore.getState().tabs).toHaveLength(1);

    useEditorStore.getState().closeAllTabs();

    expect(useEditorStore.getState().tabs).toHaveLength(0);
    expect(useEditorStore.getState().activeTabId).toBeNull();
  });
});
