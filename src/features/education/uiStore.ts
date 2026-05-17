import { create } from "zustand";
import type { EducationPanelView } from "./types";

interface EducationUIState {
  view: EducationPanelView;
  selectedPathId: string | null;
  selectedExplainerId: string | null;
  setView: (view: EducationPanelView) => void;
  setSelectedPathId: (id: string | null) => void;
  setSelectedExplainerId: (id: string | null) => void;
}

export const useEducationUIStore = create<EducationUIState>((set) => ({
  view: "paths",
  selectedPathId: null,
  selectedExplainerId: null,
  setView: (view) => set({ view }),
  setSelectedPathId: (selectedPathId) => set({ selectedPathId }),
  setSelectedExplainerId: (selectedExplainerId) => set({ selectedExplainerId }),
}));
