import React, { createContext, type ReactNode, useContext, useEffect, useMemo, useReducer } from "react";
import { useCollaborativeProjectRegistryOptional } from "@/features/collaboration/hooks";

// ===========================================================================
// Urban Analytics — Project Registry
// ===========================================================================

import type {
  ProjectFilter,
  ProjectRecord,
  ProjectRegistryState,
} from './types';
import { seedProjects } from './seed';
import { loadUrbanFromPersist, saveUrbanToPersist } from './storage';

// ---- Reducer --------------------------------------------------------------

type ProjectAction =
  | { type: 'loadSeed'; projects: ProjectRecord[] }
  | { type: 'setFilter'; patch: Partial<ProjectFilter> }
  | { type: 'selectProject'; id?: string }
  | { type: 'selectSession'; id?: string }
  | { type: 'addProject'; project: ProjectRecord }
  | { type: 'updateProject'; id: string; patch: Partial<ProjectRecord> }
  | { type: 'deleteProject'; projectId: string };

const PROJECT_INITIAL: ProjectRegistryState = {
  projects: [],
  filter: {},
  version: 1,
};

function projectReducer(
  state: ProjectRegistryState,
  action: ProjectAction,
): ProjectRegistryState {
  switch (action.type) {
    case 'loadSeed': {
      const projects = JSON.parse(JSON.stringify(action.projects)) as ProjectRecord[];
      return {
        ...state,
        projects,
        selectedProjectId: projects[0]?.id,
      };
    }
    case 'setFilter':
      return { ...state, filter: { ...state.filter, ...action.patch } };
    case 'selectProject': {
      const next: ProjectRegistryState & Record<string, unknown> = { ...state };
      if (action.id !== undefined) next.selectedProjectId = action.id;
      else delete next.selectedProjectId;
      delete next.selectedSessionId;
      return next as ProjectRegistryState;
    }
    case 'selectSession': {
      const next: ProjectRegistryState & Record<string, unknown> = { ...state };
      if (action.id !== undefined) next.selectedSessionId = action.id;
      else delete next.selectedSessionId;
      return next as ProjectRegistryState;
    }
    case 'addProject': {
      const projects = [
        JSON.parse(JSON.stringify(action.project)) as ProjectRecord,
        ...state.projects,
      ];
      return {
        ...state,
        projects,
        selectedProjectId: action.project.id,
      };
    }
    case 'updateProject': {
      const projects = state.projects.map((p) =>
        p.id === action.id ? { ...p, ...action.patch, updatedAt: new Date().toISOString() } : p,
      );
      return { ...state, projects };
    }
    case 'deleteProject': {
      const projects = state.projects.filter((p) => p.id !== action.projectId);
      const next: ProjectRegistryState & Record<string, unknown> = { ...state, projects };
      if (state.selectedProjectId === action.projectId) {
        next.selectedProjectId = projects[0]?.id;
        delete next.selectedSessionId;
      }
      return next as ProjectRegistryState;
    }
    default:
      return state;
  }
}

// ---- Helpers --------------------------------------------------------------

export function filterProjects(state: ProjectRegistryState): ProjectRecord[] {
  const { filter } = state;
  const q = (filter.search ?? '').trim().toLowerCase();
  return state.projects.filter((p) => {
    const byScale =
      !filter.scaleFilter?.length || filter.scaleFilter.includes(p.scale);
    const byTag =
      !filter.tagFilter?.length || filter.tagFilter.some((t) => (p.tags as string[]).includes(t));
    const byPriority =
      !filter.priorityFilter?.length || filter.priorityFilter.includes(p.priority);
    const bySearch =
      !q ||
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return byScale && byTag && byPriority && bySearch;
  });
}

// ---- Context & Provider ---------------------------------------------------

interface ProjectCtx {
  state: ProjectRegistryState;
  dispatch: React.Dispatch<ProjectAction>;
  actions: {
    setFilter(patch: Partial<ProjectFilter>): void;
    selectProject(id?: string): void;
    selectSession(id?: string): void;
    addProject(project: ProjectRecord): void;
    updateProject(id: string, patch: Partial<ProjectRecord>): void;
    deleteProject(projectId: string): void;
  };
}

const PROJECT_CTX_KEY = '__CCOPILOT_PROJECT_REGISTRY_CONTEXT__' as const;
type GlobalWithProjectCtx = typeof globalThis & {
  [PROJECT_CTX_KEY]?: React.Context<ProjectCtx | null>;
};
const gp = globalThis as GlobalWithProjectCtx;
const ProjectRegistryContext =
  gp[PROJECT_CTX_KEY] ?? createContext<ProjectCtx | null>(null);
gp[PROJECT_CTX_KEY] = ProjectRegistryContext;

export function ProjectRegistryProvider({ children }: { children: ReactNode }) {
  const collaboration = useCollaborativeProjectRegistryOptional();
  const collaborationValue = useMemo<ProjectCtx | null>(() => {
    if (!collaboration) {
      return null;
    }
    return {
      state: collaboration.state,
      dispatch: collaboration.dispatch as React.Dispatch<ProjectAction>,
      actions: collaboration.actions,
    };
  }, [collaboration]);

  const [state, dispatch] = useReducer(
    projectReducer,
    undefined as unknown as ProjectRegistryState,
    () => {
      let projects = loadUrbanFromPersist() ?? [];
      if (projects.length === 0) {
        try {
          const seeded = seedProjects();
          saveUrbanToPersist(seeded);
          projects = seeded;
          console.info(`[ProjectRegistry] Seeded ${projects.length} demo projects (lazy init)`);
        } catch {
          projects = [];
        }
      }
      return {
        ...PROJECT_INITIAL,
        projects,
        selectedProjectId: projects[0]?.id,
      } as ProjectRegistryState;
    },
  );

  useEffect(() => {
    if (collaborationValue) {
      return;
    }
    saveUrbanToPersist(state.projects);
  }, [collaborationValue, state.projects]);

  const actions: ProjectCtx['actions'] = useMemo(
    () => ({
      setFilter(patch) { dispatch({ type: 'setFilter', patch }); },
      selectProject(id) {
        dispatch(
          id !== undefined ? { type: 'selectProject', id } : { type: 'selectProject' },
        );
      },
      selectSession(id) {
        dispatch(
          id !== undefined ? { type: 'selectSession', id } : { type: 'selectSession' },
        );
      },
      addProject(project) { dispatch({ type: 'addProject', project }); },
      updateProject(id, patch) { dispatch({ type: 'updateProject', id, patch }); },
      deleteProject(projectId) { dispatch({ type: 'deleteProject', projectId }); },
    }),
    [],
  );

  const localValue = useMemo<ProjectCtx>(() => ({ state, dispatch, actions }), [state, actions]);
  const value = collaborationValue ?? localValue;
  return React.createElement(ProjectRegistryContext.Provider, { value }, children);
}

export function useProjectRegistry(): ProjectCtx {
  const ctx = useContext(ProjectRegistryContext);
  if (!ctx) throw new Error('useProjectRegistry must be used within <ProjectRegistryProvider>');
  return ctx;
}

export function useProjectRegistryOptional(): ProjectCtx | null {
  try {
    return useContext(ProjectRegistryContext);
  } catch {
    return null;
  }
}

export function ensureProjectSeed(): void {
  const existing = loadUrbanFromPersist();
  if (!existing || existing.length === 0) {
    const seeded = seedProjects();
    saveUrbanToPersist(seeded);
    console.info(`[ProjectRegistry] Seeded ${seeded.length} demo projects`);
  }
}
