/**
 * useEditorPrefsStore
 * Persistent editor preferences store.
 * MonacoEditor.tsx subscribes and calls editor.updateOptions() on change.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface EditorPrefs {
  fontSize: number;          // 10–28
  fontFamily: string;
  lineHeight: number;        // 1.2–2.4 (em units)
  tabSize: number;           // 2 | 4 | 8
  insertSpaces: boolean;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  bracketPairColorization: boolean;
  autoSave: boolean;
  formatOnPaste: boolean;
  formatOnSave: boolean;
  stickyScroll: boolean;
  rulers: boolean;           // show 80/120 column rulers
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
  inlineSuggest: boolean;    // copilot-style inline completions
}

export interface EditorPrefsActions {
  setPrefs: (patch: Partial<EditorPrefs>) => void;
  resetToDefaults: () => void;
}

export type EditorPrefsStore = EditorPrefs & EditorPrefsActions;

export const DEFAULT_EDITOR_PREFS: EditorPrefs = {
  fontSize: 14,
  fontFamily: 'Fira Code, Monaco, Menlo, Consolas, monospace',
  lineHeight: 1.55,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: true,
  minimap: true,
  lineNumbers: 'on',
  cursorStyle: 'line',
  renderWhitespace: 'selection',
  bracketPairColorization: true,
  autoSave: true,
  formatOnPaste: false,
  formatOnSave: false,
  stickyScroll: true,
  rulers: true,
  smoothScrolling: true,
  mouseWheelZoom: true,
  inlineSuggest: true,
};

export const useEditorPrefsStore = create<EditorPrefsStore>()(
  persist(
    immer(set => ({
      ...DEFAULT_EDITOR_PREFS,

      setPrefs: patch =>
        set(state => {
          Object.assign(state, patch);
        }),

      resetToDefaults: () =>
        set(state => {
          Object.assign(state, DEFAULT_EDITOR_PREFS);
        }),
    })),
    {
      name: 'synapse.editor.prefs.v1',
      partialize: (s): EditorPrefs => ({
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        lineHeight: s.lineHeight,
        tabSize: s.tabSize,
        insertSpaces: s.insertSpaces,
        wordWrap: s.wordWrap,
        minimap: s.minimap,
        lineNumbers: s.lineNumbers,
        cursorStyle: s.cursorStyle,
        renderWhitespace: s.renderWhitespace,
        bracketPairColorization: s.bracketPairColorization,
        autoSave: s.autoSave,
        formatOnPaste: s.formatOnPaste,
        formatOnSave: s.formatOnSave,
        stickyScroll: s.stickyScroll,
        rulers: s.rulers,
        smoothScrolling: s.smoothScrolling,
        mouseWheelZoom: s.mouseWheelZoom,
        inlineSuggest: s.inlineSuggest,
      }),
    }
  )
);
