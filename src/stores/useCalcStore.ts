import { create } from "zustand";
import type {
  IndicatorResult,
  UrbanIndicatorKind,
} from "@/features/urbanAnalytics/lib/types";

// ---------------------------------------------------------------------------
// Legacy re-exports (compatibility stubs)
// ---------------------------------------------------------------------------

export type IndicatorItem = { id: string; label: string };
export const INDICATOR_ITEMS: IndicatorItem[] = [];
export type IndicatorScores = Record<string, 0 | 1 | 2 | 3>;

/** @deprecated */ export type BFCRSItem = IndicatorItem;
/** @deprecated */ export const BFCRS_ITEMS = INDICATOR_ITEMS;
/** @deprecated */ export type BFCRSScores = IndicatorScores;

// ---------------------------------------------------------------------------
// Urban Analytics Calculator Store
// ---------------------------------------------------------------------------

type CalcState = {
  activeCalculator: UrbanIndicatorKind | null;
  inputValues: Record<string, number>;
  results: IndicatorResult[];
  history: IndicatorResult[];
  updatedAt: number;

  // Legacy compat fields (used by SessionPersistence)
  scores: IndicatorScores;
  total: number;
};

type CalcActions = {
  setCalculator: (kind: UrbanIndicatorKind | null) => void;
  setInput: (key: string, value: number) => void;
  compute: (result: IndicatorResult) => void;
  clearResults: () => void;
  addToHistory: (result: IndicatorResult) => void;
  reset: () => void;
  setScore: (id: string, v: 0 | 1 | 2 | 3) => void;
};

const initialCalc: CalcState = {
  activeCalculator: null,
  inputValues: {},
  results: [],
  history: [],
  updatedAt: Date.now(),
  scores: {},
  total: 0,
};

export const useCalcStore = create<CalcState & CalcActions>((set, get) => ({
  ...initialCalc,

  setCalculator: (kind) => set({ activeCalculator: kind, inputValues: {}, results: [], updatedAt: Date.now() }),

  setInput: (key, value) =>
    set((s) => ({ inputValues: { ...s.inputValues, [key]: value }, updatedAt: Date.now() })),

  compute: (result) =>
    set((s) => ({ results: [...s.results, result], updatedAt: Date.now() })),

  clearResults: () => set({ results: [], updatedAt: Date.now() }),

  addToHistory: (result) =>
    set((s) => ({ history: [...s.history, result], updatedAt: Date.now() })),

  reset: () => set({ ...initialCalc, updatedAt: Date.now() }),

  // Legacy compat
  setScore: (id, v) => {
    const prev = get().scores;
    const next = { ...prev, [id]: v };
    const total = Object.values(next).reduce<number>((s, n) => s + Number(n), 0);
    set({ scores: next, total, updatedAt: Date.now() });
  },
}));
