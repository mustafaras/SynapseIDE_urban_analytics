import { create } from "zustand";

export type AccessMode = "edit" | "readonly" | "locked";
export type Role = "analyst" | "planner" | "researcher" | "stakeholder" | "admin"
  // Legacy role kept for backward compat until Phase 6 migration
  | "clinician" | "viewer";

type State = {
  mode: AccessMode;
  role: Role;
  user: string | undefined;
  changedAt: number;
  setMode: (m: AccessMode) => void;
  setRole: (r: Role) => void;
  setUser: (u: string | undefined) => void;
  canEdit: () => boolean;
  isReadOnly: () => boolean;
  isLocked: () => boolean;
  isAdmin: () => boolean;
};

export const useAccessStore = create<State>((set, get) => ({
  mode: "edit",
  role: "analyst",
  user: undefined,
  changedAt: Date.now(),
  setMode: (m) => set({ mode: m, changedAt: Date.now() }),
  setRole: (r) => set({ role: r, changedAt: Date.now() }),
  setUser: (u) => set({ user: u }),
  canEdit: () => get().mode === "edit",
  isReadOnly: () => get().mode !== "edit",
  isLocked: () => get().mode === "locked",
  isAdmin: () => get().role === "admin",
}));
