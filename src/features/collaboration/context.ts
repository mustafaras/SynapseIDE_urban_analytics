import { createContext, type Dispatch } from "react";
import type { ProjectFilter, ProjectRecord, ProjectRegistryState } from "@/centerpanel/registry/types";
import type { DashboardDocument, DashboardLibraryState } from "@/features/dashboard/types";
import type { CollaborationUser } from "@/types/collaboration";
import type {
  CollaborationCommentThread,
  CollaborationConnectionState,
  CollaborationEngineSnapshot,
  CollaborationNoteDocument,
  CollaborationPresenceState,
} from "./types";

export type CollaborationProjectAction =
  | { type: "loadSeed"; projects: ProjectRecord[] }
  | { type: "setFilter"; patch: Partial<ProjectFilter> }
  | { type: "selectProject"; id?: string }
  | { type: "selectSession"; id?: string }
  | { type: "addProject"; project: ProjectRecord }
  | { type: "updateProject"; id: string; patch: Partial<ProjectRecord> }
  | { type: "deleteProject"; projectId: string };

export interface CollaborationProjectRegistryBridge {
  state: ProjectRegistryState;
  dispatch: Dispatch<CollaborationProjectAction>;
  actions: {
    setFilter(patch: Partial<ProjectFilter>): void;
    selectProject(id?: string): void;
    selectSession(id?: string): void;
    addProject(project: ProjectRecord): void;
    updateProject(id: string, patch: Partial<ProjectRecord>): void;
    deleteProject(projectId: string): void;
  };
}

export interface CollaborationDashboardBridge {
  state: DashboardLibraryState;
  upsertDashboardDocument(document: DashboardDocument, makeActive?: boolean): void;
  updateDashboardDocument(dashboardId: string, updater: (dashboard: DashboardDocument) => DashboardDocument): void;
  setActiveDashboardId(dashboardId: string | null): void;
}

export interface CollaborationContextValue {
  currentUser: CollaborationUser;
  snapshot: CollaborationEngineSnapshot;
  connection: {
    state: CollaborationConnectionState;
    pendingChanges: number;
    lastSyncedAt?: number;
    pauseSync(): void;
    resumeSync(): void;
  };
  projectRegistry: CollaborationProjectRegistryBridge;
  dashboard: CollaborationDashboardBridge;
  notes: {
    get(projectId: string): CollaborationNoteDocument;
    setSlot(projectId: string, slotId: string, value: string): void;
  };
  comments: {
    get(scopeId: string): CollaborationCommentThread[];
    add(scopeId: string, anchorLabel: string, body: string): void;
    reply(scopeId: string, threadId: string, body: string): void;
    setResolved(scopeId: string, threadId: string, resolved: boolean): void;
  };
  updatePresence(patch: Partial<CollaborationPresenceState>): void;
}

export const CollaborationContext = createContext<CollaborationContextValue | null>(null);