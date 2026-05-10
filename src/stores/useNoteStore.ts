import { create } from "zustand";
import type { SessionNoteSlots } from "@/features/urbanAnalytics/lib/types";

// ---------------------------------------------------------------------------
// Urban Analytics Note Store
// ---------------------------------------------------------------------------

/**
 * NoteSlots — union of urban analytics slots plus legacy slots.
 * Legacy keys (summary, plan, refs, outcome, vitals) retained so that
 * SessionPersistence and Note.tsx continue to compile.
 */
export type NoteSlots = SessionNoteSlots & {
  summary: string;
  plan: string;
  refs: string;
  outcome: string;
  vitals: string;
  updatedAt: number;
};

export type SlotKey =
  | "objective"
  | "methodology"
  | "findings"
  | "recommendations"
  | "dataRefs"
  | "limitations"
  // Legacy keys kept for backward compat
  | "summary"
  | "plan"
  | "refs"
  | "outcome"
  | "vitals";

type State = NoteSlots & {
  activeSlot: SlotKey;
  activeNote: string | null;
  autosaveEnabled: boolean;
  lastSaved: number | null;
};

type Actions = {
  setSlot: (k: keyof NoteSlots, v: string) => void;
  append: (k: keyof NoteSlots, v: string) => void;
  clear: () => void;
  clearNote: () => void;
  mergeRefs: (apaBlock: string) => void;
  setActiveSlot: (k: SlotKey) => void;
  save: () => void;
  loadNote: (id: string, slots: Partial<NoteSlots>) => void;
};

const initial: State = {
  // Urban slots
  objective: "",
  methodology: "",
  findings: "",
  recommendations: "",
  dataRefs: "",
  limitations: "",
  // Legacy slots
  summary: "",
  plan: "",
  refs: "",
  outcome: "",
  vitals: "",
  updatedAt: Date.now(),
  activeSlot: "objective",
  activeNote: null,
  autosaveEnabled: true,
  lastSaved: null,
};

const dedupeLines = (s: string) => {
  const uniq = new Set(
    s.split(/\r?\n/).map(t => t.trim()).filter(Boolean)
  );
  return Array.from(uniq).join("\n");
};

export const useNoteStore = create<State & Actions>((set, get) => ({
  ...initial,
  setSlot: (k, v) => set({ [k]: v, updatedAt: Date.now() } as any),
  append: (k, v) => set({ [k]: (get()[k] as string) + (v ? ((get()[k] as string) ? "\n\n" : "") + v : ""), updatedAt: Date.now() } as any),
  clear: () => set({ ...initial, updatedAt: Date.now(), activeSlot: "objective" }),
  clearNote: () => set({ ...initial, updatedAt: Date.now(), activeSlot: "objective" }),
  mergeRefs: (apaBlock) => {
    const next = dedupeLines([(get().refs || "").trim(), (apaBlock || "").trim()].filter(Boolean).join("\n"));
    set({ refs: next, updatedAt: Date.now() });
  },
  setActiveSlot: (k) => set({ activeSlot: k }),
  save: () => set({ lastSaved: Date.now() }),
  loadNote: (id, slots) =>
    set({
      activeNote: id,
      ...slots,
      updatedAt: Date.now(),
    } as any),
}));
