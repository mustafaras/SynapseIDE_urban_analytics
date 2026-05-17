import { create } from "zustand";

export type DashboardRailView =
  | "outline"
  | "templates"
  | "library"
  | "saved";

interface DashboardUIState {
  view: DashboardRailView;
  activeDashboardId: string | null;
  selectedWidgetId: string | null;
  setView: (view: DashboardRailView) => void;
  setActiveDashboardId: (id: string | null) => void;
  setSelectedWidgetId: (id: string | null) => void;
}

export const useDashboardUIStore = create<DashboardUIState>((set) => ({
  view: "outline",
  activeDashboardId: null,
  selectedWidgetId: null,
  setView: (view) => set({ view }),
  setActiveDashboardId: (activeDashboardId) => set({ activeDashboardId }),
  setSelectedWidgetId: (selectedWidgetId) => set({ selectedWidgetId }),
}));
