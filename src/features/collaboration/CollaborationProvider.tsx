import React, { useEffect, useMemo, useRef, useState } from "react";
import { seedProjects } from "@/centerpanel/registry/seed";
import { loadUrbanFromPersist, saveUrbanToPersist } from "@/centerpanel/registry/storage";
import { loadDashboardLibrary, persistDashboardLibrary } from "@/features/dashboard/storage";
import { mergeEmit } from "@/components/StatusBar/statusBus";
import { useCollaborationStore } from "@/store/useCollaborationStore";
import type { CollaborationUser } from "@/types/collaboration";
import { BrowserCollaborationAdapter, CollaborationEngine } from "./engine";
import { normalizeProjectRecordForHistory } from "./projectHistory";
import {
  CollaborationContext,
  type CollaborationContextValue,
  type CollaborationDashboardBridge,
  type CollaborationProjectRegistryBridge,
} from "./context";
import type {
  CollaborationCommentThread,
  CollaborationEngineSnapshot,
  CollaborationNoteDocument,
} from "./types";

const ROOM_ID = "synapse:urban:collaboration:room:v1";
const PROJECT_NOTES_STORAGE_KEY = "synapse.collaboration.notes.v1";
const THREADS_STORAGE_KEY = "synapse.collaboration.threads.v1";

function makeInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function safeLoadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createSessionUser(): CollaborationUser {
  const palette = ["#f59e0b", "#38bdf8", "#34d399", "#fb7185", "#f97316", "#facc15"];
  const names = [
    "Amber Atlas",
    "Civic Echo",
    "Harbor Vector",
    "Metro Cedar",
    "Quartz Signal",
    "Delta Slate",
  ];
  const storageKey = "synapse.collaboration.tab-user.v1";
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) {
      return JSON.parse(existing) as CollaborationUser;
    }
  } catch {
    return {
      id: crypto.randomUUID(),
      name: names[0],
      email: "analyst@synapse.local",
      role: "analyst",
      isOnline: true,
      lastSeen: new Date(),
      color: palette[0],
      avatar: "AA",
    };
  }

  const randomIndex = Math.floor(Math.random() * names.length);
  const name = names[randomIndex] ?? names[0];
  const user: CollaborationUser = {
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@synapse.local`,
    role: "analyst",
    isOnline: true,
    lastSeen: new Date(),
    color: palette[randomIndex % palette.length] ?? palette[0],
    avatar: makeInitials(name),
  };
  sessionStorage.setItem(storageKey, JSON.stringify(user));
  return user;
}

function createInitialSnapshot(currentUser: CollaborationUser): CollaborationEngineSnapshot {
  const persistedProjects = (loadUrbanFromPersist() ?? seedProjects()).map(normalizeProjectRecordForHistory);
  if ((loadUrbanFromPersist() ?? []).length === 0) {
    saveUrbanToPersist(persistedProjects);
  }
  return {
    currentUser,
    projectRegistry: {
      projects: persistedProjects,
      selectedProjectId: persistedProjects[0]?.id,
      filter: {},
      version: 1,
    },
    notes: safeLoadJson<Record<string, CollaborationNoteDocument>>(PROJECT_NOTES_STORAGE_KEY, {}),
    dashboardLibrary: loadDashboardLibrary(),
    threadsByScope: safeLoadJson<Record<string, CollaborationCommentThread[]>>(THREADS_STORAGE_KEY, {}),
    participants: [],
    connection: {
      state: "connected",
      pendingChanges: 0,
    },
  };
}

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const currentUserRef = useRef<CollaborationUser>(createSessionUser());
  const engineRef = useRef<CollaborationEngine | null>(null);
  const [snapshot, setSnapshot] = useState<CollaborationEngineSnapshot>(() => createInitialSnapshot(currentUserRef.current));

  if (!engineRef.current) {
    engineRef.current = new CollaborationEngine(
      ROOM_ID,
      currentUserRef.current.id,
      currentUserRef.current,
      new BrowserCollaborationAdapter(),
      {
        projects: snapshot.projectRegistry.projects,
        notes: snapshot.notes,
        dashboards: snapshot.dashboardLibrary,
        threadsByScope: snapshot.threadsByScope,
      },
    );
  }

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      return undefined;
    }
    const unsubscribe = engine.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });
    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    saveUrbanToPersist(snapshot.projectRegistry.projects);
  }, [snapshot.projectRegistry.projects]);

  useEffect(() => {
    localStorage.setItem(PROJECT_NOTES_STORAGE_KEY, JSON.stringify(snapshot.notes));
  }, [snapshot.notes]);

  useEffect(() => {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(snapshot.threadsByScope));
  }, [snapshot.threadsByScope]);

  useEffect(() => {
    persistDashboardLibrary(snapshot.dashboardLibrary);
  }, [snapshot.dashboardLibrary]);

  useEffect(() => {
    const participants = snapshot.participants.map((presence) => ({
      id: presence.clientId,
      name: presence.name,
      email: `${presence.userId}@synapse.local`,
      avatar: makeInitials(presence.name),
      role: "analyst" as const,
      isOnline: presence.connectionState !== "offline",
      lastSeen: new Date(presence.lastActiveAt),
      color: presence.color,
    }));

    useCollaborationStore.setState({
      currentUser: currentUserRef.current,
      participants,
      presenceData: Object.fromEntries(snapshot.participants.map((presence) => [
        presence.clientId,
        {
          userId: presence.clientId,
          sessionId: ROOM_ID,
          ...(presence.activeSection === undefined ? {} : { activeSection: presence.activeSection }),
          ...(presence.selectionText === undefined
            ? {}
            : {
                cursor: {
                  x: 0,
                  y: 0,
                  element: presence.selectionText,
                },
              }),
          lastActivity: new Date(presence.lastActiveAt),
        },
      ])),
      syncStatus: {
        isConnected: snapshot.connection.state === "connected",
        pendingChanges: snapshot.connection.pendingChanges,
        conflictCount: 0,
        ...(snapshot.connection.lastSyncedAt === undefined
          ? {}
          : { lastSyncTime: new Date(snapshot.connection.lastSyncedAt) }),
        ...(snapshot.connection.state === "paused"
          ? { syncError: "Sync paused" }
          : snapshot.connection.state === "reconnecting"
            ? { syncError: "Reconnecting collaboration room" }
            : {}),
      },
    });

    mergeEmit("collaboration", {
      state: snapshot.connection.state,
      collaborators: snapshot.participants.length,
      pendingChanges: snapshot.connection.pendingChanges,
      ...(snapshot.connection.lastSyncedAt === undefined
        ? {}
        : { lastSyncedAt: snapshot.connection.lastSyncedAt }),
    });
  }, [snapshot]);

  const projectRegistry = useMemo<CollaborationProjectRegistryBridge>(() => ({
    state: snapshot.projectRegistry,
    dispatch: (action) => {
      const engine = engineRef.current;
      if (!engine) {
        return;
      }
      switch (action.type) {
        case "loadSeed":
          action.projects.forEach((project) => engine.addProject(project));
          break;
        case "setFilter":
          engine.setProjectFilter(action.patch);
          break;
        case "selectProject":
          engine.selectProject(action.id);
          break;
        case "selectSession":
          engine.selectSession(action.id);
          break;
        case "addProject":
          engine.addProject(action.project);
          break;
        case "updateProject":
          engine.updateProject(action.id, action.patch);
          break;
        case "deleteProject":
          engine.deleteProject(action.projectId);
          break;
        default:
          break;
      }
    },
    actions: {
      setFilter: (patch) => engineRef.current?.setProjectFilter(patch),
      selectProject: (id) => engineRef.current?.selectProject(id),
      selectSession: (id) => engineRef.current?.selectSession(id),
      addProject: (project) => engineRef.current?.addProject(project),
      updateProject: (id, patch) => engineRef.current?.updateProject(id, patch),
      deleteProject: (projectId) => engineRef.current?.deleteProject(projectId),
    },
  }), [snapshot.projectRegistry]);

  const dashboard = useMemo<CollaborationDashboardBridge>(() => ({
    state: snapshot.dashboardLibrary,
    upsertDashboardDocument: (document, makeActive = true) => engineRef.current?.upsertDashboardDocument(document, makeActive),
    updateDashboardDocument: (dashboardId, updater) => engineRef.current?.updateDashboardDocument(dashboardId, updater),
    setActiveDashboardId: (dashboardId) => engineRef.current?.setActiveDashboardId(dashboardId),
  }), [snapshot.dashboardLibrary]);

  const value = useMemo<CollaborationContextValue>(() => ({
    currentUser: currentUserRef.current,
    snapshot,
    connection: {
      state: snapshot.connection.state,
      pendingChanges: snapshot.connection.pendingChanges,
      ...(snapshot.connection.lastSyncedAt === undefined ? {} : { lastSyncedAt: snapshot.connection.lastSyncedAt }),
      pauseSync: () => engineRef.current?.pauseSync(),
      resumeSync: () => engineRef.current?.resumeSync(),
    },
    projectRegistry,
    dashboard,
    notes: {
      get: (projectId) => snapshot.notes[projectId] ?? { slots: {}, updatedAt: 0 },
      setSlot: (projectId, slotId, value) => engineRef.current?.setNoteSlot(projectId, slotId, value),
    },
    comments: {
      get: (scopeId) => snapshot.threadsByScope[scopeId] ?? [],
      add: (scopeId, anchorLabel, body) => engineRef.current?.addCommentThread(scopeId, anchorLabel, body),
      reply: (scopeId, threadId, body) => engineRef.current?.replyToThread(scopeId, threadId, body),
      setResolved: (scopeId, threadId, resolved) => engineRef.current?.setThreadResolved(scopeId, threadId, resolved),
    },
    updatePresence: (patch) => engineRef.current?.updatePresence(patch),
  }), [dashboard, projectRegistry, snapshot]);

  return React.createElement(CollaborationContext.Provider, { value }, children);
}
