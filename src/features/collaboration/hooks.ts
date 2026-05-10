import { useContext, useMemo } from "react";
import {
  CollaborationContext,
  type CollaborationContextValue,
  type CollaborationDashboardBridge,
  type CollaborationProjectRegistryBridge,
} from "./context";
import type { CollaborationCommentThread, CollaborationPresenceState } from "./types";

export function useCollaborationOptional(): CollaborationContextValue | null {
  return useContext(CollaborationContext);
}

export function useCollaboration(): CollaborationContextValue {
  const context = useCollaborationOptional();
  if (!context) {
    throw new Error("useCollaboration must be used within <CollaborationProvider>");
  }
  return context;
}

export function useCollaborativeProjectRegistryOptional(): CollaborationProjectRegistryBridge | null {
  return useCollaborationOptional()?.projectRegistry ?? null;
}

export function useCollaborativeDashboardOptional(): CollaborationDashboardBridge | null {
  return useCollaborationOptional()?.dashboard ?? null;
}

export function useScopePresence(scopeId?: string): CollaborationPresenceState[] {
  const collaboration = useCollaborationOptional();
  return useMemo(() => {
    if (!collaboration) {
      return [];
    }
    return collaboration.snapshot.participants.filter((presence) => (scopeId ? presence.activeScope === scopeId : true));
  }, [collaboration, scopeId]);
}

export function useSectionPresence(scopeId: string | undefined, sectionId: string | undefined): CollaborationPresenceState[] {
  const participants = useScopePresence(scopeId);
  return useMemo(
    () => participants.filter((presence) => (sectionId ? presence.activeSection === sectionId : true)),
    [participants, sectionId],
  );
}

export function useScopeThreads(scopeId: string): CollaborationCommentThread[] {
  const collaboration = useCollaborationOptional();
  return useMemo(() => collaboration?.comments.get(scopeId) ?? [], [collaboration, scopeId]);
}