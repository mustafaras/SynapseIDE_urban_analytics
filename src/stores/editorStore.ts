import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { EditorHistory, EditorTab, EditorTabOrigin, FileNode } from '../types/state';

interface OpenTabOptions {
  origin?: EditorTabOrigin;
  previewMode?: boolean;
  sourcePlanRunId?: string;
  /** When true, makes the existing matching tab active without replacing its origin. */
  preserveExistingOrigin?: boolean;
}

interface EditorStore {

  tabs: EditorTab[];
  activeTabId: string | null;
  history: Record<string, EditorHistory>;


  openTab: (file: FileNode, options?: OpenTabOptions) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabDirty: (tabId: string, isDirty: boolean) => void;
  saveTab: (tabId: string) => void;
  promoteToPersistentTab: (tabId: string) => void;


  addToHistory: (
    tabId: string,
    content: string,
    cursorPosition: { line: number; column: number }
  ) => void;
  undo: (tabId: string) => string | null;
  redo: (tabId: string) => string | null;
  canUndo: (tabId: string) => boolean;
  canRedo: (tabId: string) => boolean;


  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  saveDirtyTabs: () => void;


  moveTab: (fromIndex: number, toIndex: number) => void;
  duplicateTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  moveTabLeft: (tabId: string) => void;
  moveTabRight: (tabId: string) => void;
  closeTabsToRight: (tabId: string) => void;

  /** Update name+path of any open tab whose current path matches oldPath (rename/move). */
  renameTabByPath: (oldPath: string, newName: string, newPath: string) => void;
  /** Close the open tab whose path matches (used when the underlying file is deleted). Only closes non-dirty tabs; dirty tabs are left open so the user can decide. */
  closeTabByPath: (path: string) => void;
  /** Mark restored tabs whose file path no longer resolves in the current file tree. */
  recoverRestoredTabs: (files: FileNode[]) => void;
}

const MAX_HISTORY_SIZE = 50;
export const MAX_HISTORY_CONTENT_CHARS = 512 * 1024;
export const MAX_PERSISTED_TABS = 60;

const PERSISTED_KEY = 'enhanced-ide-editor-state';
const PERSISTED_VERSION = 3;

const nowIso = () => new Date().toISOString();

const generateTabId = (path: string) => {
  const safePath = path && path.length > 0 ? path : 'untitled';
  // Path-prefixed ID keeps tab identity meaningful in logs & devtools while still
  // being unique across rapid duplicate-opens that happen within the same ms.
  return `tab:${safePath}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
};

function isHistorySnapshotPersistable(content: string): boolean {
  return content.length <= MAX_HISTORY_CONTENT_CHARS;
}

function capHistoryEntries<T>(entries: T[]): T[] {
  return entries.length > MAX_HISTORY_SIZE ? entries.slice(-MAX_HISTORY_SIZE) : entries;
}

function walkFilePaths(files: FileNode[], paths = new Set<string>()): Set<string> {
  for (const file of files) {
    paths.add(file.path);
    paths.add(file.path.replace(/^\/+/, ''));
    if (file.children?.length) walkFilePaths(file.children, paths);
  }
  return paths;
}

function selectTabsForPersistence(tabs: EditorTab[], activeTabId: string | null): EditorTab[] {
  const keep = new Map<string, EditorTab>();
  for (const tab of tabs) {
    if (tab.id === activeTabId || tab.isDirty || tab.isPinned) {
      keep.set(tab.id, tab);
    }
  }

  const byRecent = [...tabs].sort((a, b) => {
    const aTs = a.lastAccessedAt ? Date.parse(a.lastAccessedAt) : 0;
    const bTs = b.lastAccessedAt ? Date.parse(b.lastAccessedAt) : 0;
    return bTs - aTs;
  });

  for (const tab of byRecent) {
    if (keep.size >= MAX_PERSISTED_TABS) break;
    keep.set(tab.id, tab);
  }

  return tabs.filter(tab => keep.has(tab.id));
}

export const useEditorStore = create<EditorStore>()(
  persist(
    immer((set, get) => ({
      tabs: [],
      activeTabId: null,
      history: {},

      openTab: (file, options) =>
        set(state => {
          const existingTab = state.tabs.find(tab => tab.path === file.path);

          if (existingTab) {
            existingTab.isActive = true;
            existingTab.lastAccessedAt = nowIso();
            // If the existing tab was a preview and the caller is opening it again
            // without an explicit preview directive, promote to a persistent tab.
            if (existingTab.previewMode && options?.previewMode !== true) {
              existingTab.previewMode = false;
            }
            // Refresh provenance only if the caller didn't ask to preserve it and
            // the new origin is "stronger" (ai-plan > bridge > user > duplicate).
            if (!options?.preserveExistingOrigin && options?.origin) {
              existingTab.origin = options.origin;
              if (options.sourcePlanRunId) {
                existingTab.sourcePlanRunId = options.sourcePlanRunId;
              }
            }
            // If the on-disk file was rotated (different fileId for same path),
            // repair the linkage so subsequent saves operate on the live node.
            if (existingTab.fileId !== file.id) {
              existingTab.fileId = file.id;
            }
            state.tabs.forEach(tab => {
              tab.isActive = tab.id === existingTab.id;
            });
            state.activeTabId = existingTab.id;
            return;
          }

          // If there's a preview-mode tab and we're opening a new file in preview,
          // replace the previous preview tab in place to mirror VS Code behavior.
          if (options?.previewMode) {
            const existingPreview = state.tabs.find(tab => tab.previewMode && !tab.isDirty);
            if (existingPreview) {
              existingPreview.id = generateTabId(file.path);
              existingPreview.fileId = file.id;
              existingPreview.name = file.name;
              existingPreview.path = file.path;
              existingPreview.content = file.content || '';
              existingPreview.language = file.language || 'plaintext';
              existingPreview.cursorPosition = { line: 1, column: 1 };
              existingPreview.scrollPosition = { top: 0, left: 0 };
              existingPreview.selections = [];
              existingPreview.isDirty = false;
              existingPreview.isActive = true;
              existingPreview.previewMode = true;
              existingPreview.origin = options.origin || 'user';
              if (options.sourcePlanRunId) {
                existingPreview.sourcePlanRunId = options.sourcePlanRunId;
              } else {
                delete existingPreview.sourcePlanRunId;
              }
              existingPreview.lastAccessedAt = nowIso();

              state.tabs.forEach(tab => {
                tab.isActive = tab.id === existingPreview.id;
              });
              state.activeTabId = existingPreview.id;
              return;
            }
          }

          const newTab: EditorTab = {
            id: generateTabId(file.path),
            fileId: file.id,
            name: file.name,
            path: file.path,
            content: file.content || '',
            language: file.language || 'plaintext',
            isDirty: false,
            isActive: true,
            isPinned: false,
            cursorPosition: { line: 1, column: 1 },
            scrollPosition: { top: 0, left: 0 },
            selections: [],
            origin: options?.origin || 'user',
            previewMode: options?.previewMode === true,
            lastAccessedAt: nowIso(),
            ...(options?.sourcePlanRunId
              ? { sourcePlanRunId: options.sourcePlanRunId }
              : {}),
          };

          state.tabs.forEach(tab => {
            tab.isActive = false;
          });

          state.tabs.push(newTab);
          state.activeTabId = newTab.id;

          if (!state.history[newTab.id]) {
            state.history[newTab.id] = {
              undo: [],
              redo: [],
            };
          }
        }),

      closeTab: tabId =>
        set(state => {
          const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
          if (tabIndex === -1) return;

          const isActiveTab = state.activeTabId === tabId;
          state.tabs.splice(tabIndex, 1);


          delete state.history[tabId];


          if (isActiveTab && state.tabs.length > 0) {
            const newActiveIndex = Math.max(0, tabIndex - 1);
            const newActiveTab = state.tabs[newActiveIndex];
            state.activeTabId = newActiveTab.id;
            state.tabs.forEach(tab => {
              tab.isActive = tab.id === newActiveTab.id;
              if (tab.isActive) tab.lastAccessedAt = nowIso();
            });
          } else if (state.tabs.length === 0) {
            state.activeTabId = null;
          }
        }),

      setActiveTab: tabId =>
        set(state => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab) return;

          state.tabs.forEach(t => {
            t.isActive = t.id === tabId;
          });
          tab.lastAccessedAt = nowIso();
          state.activeTabId = tabId;
        }),

      updateTabContent: (tabId, content) =>
        set(state => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab) return;

          tab.content = content;
          tab.isDirty = true;
          // Editing a preview tab promotes it to a persistent tab, matching
          // standard IDE conventions and preventing accidental replacement.
          if (tab.previewMode) {
            tab.previewMode = false;
          }
          tab.lastAccessedAt = nowIso();
        }),

      markTabDirty: (tabId, isDirty) =>
        set(state => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.isDirty = isDirty;
          }
        }),

      saveTab: tabId =>
        set(state => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.isDirty = false;
          }
        }),

      promoteToPersistentTab: tabId =>
        set(state => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (tab && tab.previewMode) {
            tab.previewMode = false;
          }
        }),

      addToHistory: (tabId, content, cursorPosition) =>
        set(state => {
          if (!isHistorySnapshotPersistable(content)) return;
          if (!state.history[tabId]) {
            state.history[tabId] = { undo: [], redo: [] };
          }

          const history = state.history[tabId];


          history.undo.push({
            id: `history-${Date.now()}`,
            timestamp: new Date(),
            content,
            cursorPosition,
          });


          if (history.undo.length > MAX_HISTORY_SIZE) {
            history.undo.shift();
          }


          history.redo = [];
        }),

      undo: tabId => {
        const state = get();
        const history = state.history[tabId];
        if (!history || history.undo.length === 0) return null;

        const currentTab = state.tabs.find(t => t.id === tabId);
        if (!currentTab) return null;

        set(draft => {
          const draftHistory = draft.history[tabId];
          const draftTab = draft.tabs.find(t => t.id === tabId);

          if (!draftHistory || !draftTab) return;

          if (isHistorySnapshotPersistable(draftTab.content)) {
            draftHistory.redo.push({
              id: `redo-${Date.now()}`,
              timestamp: new Date(),
              content: draftTab.content,
              cursorPosition: draftTab.cursorPosition,
            });
            if (draftHistory.redo.length > MAX_HISTORY_SIZE) {
              draftHistory.redo.shift();
            }
          }


          const previousState = draftHistory.undo.pop();
          if (previousState) {
            draftTab.content = previousState.content;
            draftTab.cursorPosition = previousState.cursorPosition;
            draftTab.isDirty = true;
          }
        });

        return get().tabs.find(t => t.id === tabId)?.content || null;
      },

      redo: tabId => {
        const state = get();
        const history = state.history[tabId];
        if (!history || history.redo.length === 0) return null;

        set(draft => {
          const draftHistory = draft.history[tabId];
          const draftTab = draft.tabs.find(t => t.id === tabId);

          if (!draftHistory || !draftTab) return;

          if (isHistorySnapshotPersistable(draftTab.content)) {
            draftHistory.undo.push({
              id: `undo-${Date.now()}`,
              timestamp: new Date(),
              content: draftTab.content,
              cursorPosition: draftTab.cursorPosition,
            });
            if (draftHistory.undo.length > MAX_HISTORY_SIZE) {
              draftHistory.undo.shift();
            }
          }


          const nextState = draftHistory.redo.pop();
          if (nextState) {
            draftTab.content = nextState.content;
            draftTab.cursorPosition = nextState.cursorPosition;
            draftTab.isDirty = true;
          }
        });

        return get().tabs.find(t => t.id === tabId)?.content || null;
      },

      canUndo: tabId => {
        const state = get();
        return (state.history[tabId]?.undo.length || 0) > 0;
      },

      canRedo: tabId => {
        const state = get();
        return (state.history[tabId]?.redo.length || 0) > 0;
      },

      closeAllTabs: () =>
        set(state => {
          state.tabs = [];
          state.activeTabId = null;
          state.history = {};
        }),

      closeOtherTabs: tabId =>
        set(state => {
          const keepTab = state.tabs.find(tab => tab.id === tabId);
          if (!keepTab) return;


          Object.keys(state.history).forEach(id => {
            if (id !== tabId) {
              delete state.history[id];
            }
          });

          state.tabs = [keepTab];
          state.activeTabId = tabId;
          keepTab.isActive = true;
        }),

      saveDirtyTabs: () =>
        set(state => {
          state.tabs.forEach(tab => {
            if (tab.isDirty) {
              tab.isDirty = false;
            }
          });
        }),

      moveTab: (fromIndex, toIndex) =>
        set(state => {
          if (
            fromIndex < 0 ||
            fromIndex >= state.tabs.length ||
            toIndex < 0 ||
            toIndex >= state.tabs.length
          ) {
            return;
          }
          const [movedTab] = state.tabs.splice(fromIndex, 1);
          state.tabs.splice(toIndex, 0, movedTab);
        }),

      moveTabLeft: tabId =>
        set(state => {
          const i = state.tabs.findIndex(t => t.id === tabId);
          if (i <= 0) return;
          const target = i - 1;
          const [t] = state.tabs.splice(i, 1);
          state.tabs.splice(target, 0, t);
        }),

      moveTabRight: tabId =>
        set(state => {
          const i = state.tabs.findIndex(t => t.id === tabId);
          if (i < 0 || i >= state.tabs.length - 1) return;
          const target = i + 1;
          const [t] = state.tabs.splice(i, 1);
          state.tabs.splice(target, 0, t);
        }),

      closeTabsToRight: tabId =>
        set(state => {
          const i = state.tabs.findIndex(t => t.id === tabId);
          if (i < 0) return;
          const toClose = state.tabs.slice(i + 1).map(t => t.id);
          toClose.forEach(id => {
            const idx = state.tabs.findIndex(t => t.id === id);
            if (idx >= 0) state.tabs.splice(idx, 1);
            delete state.history[id];
          });
          state.activeTabId = tabId;
        }),

      pinTab: tabId =>
        set(state => {
          const i = state.tabs.findIndex(t => t.id === tabId);
          if (i < 0) return;
          state.tabs[i].isPinned = true;

          const pinnedCount = state.tabs.filter(t => t.isPinned).length - 1;
          const [t] = state.tabs.splice(i, 1);
          state.tabs.splice(Math.max(0, pinnedCount), 0, t);
        }),

      unpinTab: tabId =>
        set(state => {
          const i = state.tabs.findIndex(t => t.id === tabId);
          if (i < 0) return;
          state.tabs[i].isPinned = false;

          const pinnedCount = state.tabs.filter(t => t.isPinned).length;
          const [t] = state.tabs.splice(i, 1);
          state.tabs.splice(pinnedCount, 0, t);
        }),

      duplicateTab: tabId =>
        set(state => {
          const originalTab = state.tabs.find(tab => tab.id === tabId);
          if (!originalTab) return;

          const duplicatedTab: EditorTab = {
            ...originalTab,
            id: generateTabId(originalTab.path),
            name: `${originalTab.name} (Copy)`,
            isActive: true,
            // Duplicate is a fresh in-memory copy of the buffer; its dirty state
            // matches the original (clean copy of clean buffer = clean).
            isDirty: originalTab.isDirty,
            isPinned: false,
            origin: 'duplicate',
            previewMode: false,
            lastAccessedAt: nowIso(),
          };


          state.tabs.forEach(tab => {
            tab.isActive = false;
          });

          state.tabs.push(duplicatedTab);
          state.activeTabId = duplicatedTab.id;


          state.history[duplicatedTab.id] = {
            undo: capHistoryEntries([...(state.history[tabId]?.undo || [])]),
            redo: [],
          };
        }),

      renameTabByPath: (oldPath, newName, newPath) =>
        set(state => {
          for (const tab of state.tabs) {
            if (tab.path === oldPath) {
              tab.name = newName;
              tab.path = newPath;
              if (tab.isMissingFile) {
                tab.isMissingFile = false;
                delete tab.restoreMessage;
              }
            }
          }
        }),

      closeTabByPath: path =>
        set(state => {
          const tab = state.tabs.find(t => t.path === path);
          if (!tab || tab.isDirty) return;
          const idx = state.tabs.indexOf(tab);
          const wasActive = state.activeTabId === tab.id;
          state.tabs.splice(idx, 1);
          delete state.history[tab.id];
          if (wasActive) {
            const next = state.tabs[Math.max(0, idx - 1)];
            if (next) {
              next.isActive = true;
              state.activeTabId = next.id;
            } else {
              state.activeTabId = null;
            }
          }
        }),

      recoverRestoredTabs: files =>
        set(state => {
          const knownPaths = walkFilePaths(files);
          let changed = false;

          for (const tab of state.tabs) {
            const normalizedPath = tab.path.replace(/^\/+/, '');
            const resolves = knownPaths.has(tab.path) || knownPaths.has(normalizedPath);
            if (!resolves) {
              const message = `Restored tab "${tab.path}" no longer resolves to a file in the current workspace tree. The buffer is preserved; recreate or reopen the file to clear this warning.`;
              if (!tab.isMissingFile || tab.restoreMessage !== message) {
                tab.isMissingFile = true;
                tab.restoreMessage = message;
                changed = true;
              }
            } else if (tab.isMissingFile !== false || tab.restoreMessage) {
              tab.isMissingFile = false;
              delete tab.restoreMessage;
              changed = true;
            }
          }

          if (!changed) return;
        }),
    })),
    {
      name: PERSISTED_KEY,
      version: PERSISTED_VERSION,
      partialize: state => ({
        tabs: selectTabsForPersistence(state.tabs, state.activeTabId).map(tab => ({
          ...tab,
          // Re-derive on restore from `activeTabId` so the persisted snapshot is canonical.
          isActive: false,
          // Preview tabs do not survive a hard reload — they were ephemeral by design.
          // If the user wanted them, they would have been promoted to persistent.
          previewMode: false,
        })),
        activeTabId: state.activeTabId,
        history: Object.fromEntries(
          selectTabsForPersistence(state.tabs, state.activeTabId).map(tab => [
            tab.id,
            {
              undo: capHistoryEntries((state.history[tab.id]?.undo ?? []).filter(entry =>
                isHistorySnapshotPersistable(entry.content)
              )),
              redo: capHistoryEntries((state.history[tab.id]?.redo ?? []).filter(entry =>
                isHistorySnapshotPersistable(entry.content)
              )),
            },
          ])
        ),
      }),
      migrate: (persisted: unknown, fromVersion) => {
        if (fromVersion < 3) {
          return {
            tabs: [],
            activeTabId: null,
            history: {},
          } satisfies Partial<EditorStore>;
        }

        // v1 → v2: previously the partialize wrote `isActive: false` for every tab and
        // omitted `activeTabId`. We now persist `activeTabId` directly; for old payloads
        // we infer it (no-op safe default).
        if (!persisted || typeof persisted !== 'object') return persisted as unknown;
        const payload = persisted as { tabs?: EditorTab[]; activeTabId?: string | null };
        if (fromVersion < 2 && payload.tabs && payload.activeTabId === undefined) {
          payload.activeTabId = null;
        }
        return payload;
      },
      onRehydrateStorage: () => (rehydrated, error) => {
        if (error || !rehydrated) return;
        // Reconcile activeTabId: if persisted activeTabId points at a missing tab,
        // fall back to the first tab to keep the editor surface non-empty.
        const tabs = rehydrated.tabs || [];
        const known = new Set(tabs.map(t => t.id));
        if (rehydrated.activeTabId && !known.has(rehydrated.activeTabId)) {
          rehydrated.activeTabId = tabs[0]?.id ?? null;
        }
        // Stamp `isActive` from `activeTabId` so consumers that rely on the flag stay correct.
        for (const t of tabs) {
          t.isActive = t.id === rehydrated.activeTabId;
        }
      },
    }
  )
);


export const useActiveTab = () => {
  const tabs = useEditorStore(s => s.tabs);
  const activeTabId = useEditorStore(s => s.activeTabId);
  return tabs.find(tab => tab.id === activeTabId) || null;
};

export const useDirtyTabs = () => {
  const tabs = useEditorStore(s => s.tabs);
  return tabs.filter(tab => tab.isDirty);
};

export const useTabActions = () => {
  const openTab = useEditorStore(s => s.openTab);
  const closeTab = useEditorStore(s => s.closeTab);
  const setActiveTab = useEditorStore(s => s.setActiveTab);
  const updateTabContent = useEditorStore(s => s.updateTabContent);
  const saveTab = useEditorStore(s => s.saveTab);
  const closeAllTabs = useEditorStore(s => s.closeAllTabs);
  const closeOtherTabs = useEditorStore(s => s.closeOtherTabs);
  const saveDirtyTabs = useEditorStore(s => s.saveDirtyTabs);
  const moveTab = useEditorStore(s => s.moveTab);
  const duplicateTab = useEditorStore(s => s.duplicateTab);
  const pinTab = useEditorStore(s => s.pinTab);
  const unpinTab = useEditorStore(s => s.unpinTab);
  const moveTabLeft = useEditorStore(s => s.moveTabLeft);
  const moveTabRight = useEditorStore(s => s.moveTabRight);
  const promoteToPersistentTab = useEditorStore(s => s.promoteToPersistentTab);
  const renameTabByPath = useEditorStore(s => s.renameTabByPath);
  const closeTabByPath = useEditorStore(s => s.closeTabByPath);

  return {
    openTab,
    closeTab,
    setActiveTab,
    updateTabContent,
    saveTab,
    closeAllTabs,
    closeOtherTabs,
    saveDirtyTabs,
    moveTab,
    duplicateTab,
    pinTab,
    unpinTab,
    moveTabLeft,
    moveTabRight,
    promoteToPersistentTab,
    renameTabByPath,
    closeTabByPath,
  };
};

export const useEditorHistory = (tabId: string) => {
  const addToHistoryFn = useEditorStore(s => s.addToHistory);
  const undoFn = useEditorStore(s => s.undo);
  const redoFn = useEditorStore(s => s.redo);
  const canUndoFn = useEditorStore(s => s.canUndo);
  const canRedoFn = useEditorStore(s => s.canRedo);

  return {
    addToHistory: (content: string, cursorPosition: { line: number; column: number }) =>
      addToHistoryFn(tabId, content, cursorPosition),
    undo: () => undoFn(tabId),
    redo: () => redoFn(tabId),
    canUndo: canUndoFn(tabId),
    canRedo: canRedoFn(tabId),
  };
};
