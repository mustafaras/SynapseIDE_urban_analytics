import type {
  ProjectRecentChange,
  ProjectRecord,
  ProjectRegistryState,
  ProjectReviewArtifactRef,
  ProjectReviewSourceMode,
} from "@/centerpanel/registry/types";
import type { DashboardLibraryState } from "@/features/dashboard/types";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import type { CollaborationUser } from "@/types/collaboration";

export type CollaborationConnectionState = "connected" | "paused" | "reconnecting" | "offline";

export interface CollaborationPresenceState {
  clientId: string;
  userId: string;
  name: string;
  color: string;
  avatar?: string;
  activeScope?: string;
  activeSection?: string;
  activeLabel?: string;
  selectionText?: string;
  connectionState: CollaborationConnectionState;
  lastActiveAt: number;
  isSelf?: boolean;
}

export interface CollaborationReply {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  body: string;
  createdAt: number;
}

export interface CollaborationCommentThread {
  id: string;
  scopeId: string;
  anchorLabel: string;
  body: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  status: "open" | "resolved";
  replies: CollaborationReply[];
}

export interface CollaborationNoteDocument {
  slots: Record<string, string>;
  updatedAt: number;
}

export interface CollaborationConnectionSnapshot {
  state: CollaborationConnectionState;
  pendingChanges: number;
  lastSyncedAt?: number;
}

export interface CollaborationEngineSnapshot {
  currentUser: CollaborationUser;
  projectRegistry: ProjectRegistryState;
  notes: Record<string, CollaborationNoteDocument>;
  dashboardLibrary: DashboardLibraryState;
  threadsByScope: Record<string, CollaborationCommentThread[]>;
  participants: CollaborationPresenceState[];
  connection: CollaborationConnectionSnapshot;
}

export interface CollaborationRoomSeed {
  projects: ProjectRecord[];
  notes?: Record<string, CollaborationNoteDocument>;
  dashboards: DashboardLibraryState;
  threadsByScope?: Record<string, CollaborationCommentThread[]>;
}

export interface ProjectHistoryEventDetail {
  kind: 'report-saved' | 'report-restored' | 'report-updated';
  title: string;
  description: string;
  slotId?: string;
  sourceMode?: ProjectReviewSourceMode;
  artifact: {
    kind: 'report';
    label: string;
    id?: string;
  };
  preview?: string;
}

export interface ProjectHistoryFeedItem {
  id: string;
  changedAt: string;
  title: string;
  description: string;
  slotId?: string;
  sourceMode: ProjectReviewSourceMode;
  artifact: ProjectReviewArtifactRef;
  preview?: string;
  snapshotId?: string;
  flowId?: string;
  kind: ProjectRecentChange['kind'];
}

export interface ProjectHistoryFeedOptions {
  slotId?: string;
  limit?: number;
  completedRuns?: CompletedAnalysisRun[];
}

export type CollaborationEnvelope =
  | {
      type: "doc-update";
      roomId: string;
      clientId: string;
      update: string;
    }
  | {
      type: "presence";
      roomId: string;
      clientId: string;
      presence: CollaborationPresenceState;
    }
  | {
      type: "presence-leave";
      roomId: string;
      clientId: string;
    }
  | {
      type: "resync-request";
      roomId: string;
      clientId: string;
    };

export interface CollaborationAdapter {
  subscribe(roomId: string, handler: (message: CollaborationEnvelope) => void): () => void;
  publish(message: CollaborationEnvelope): void;
  readSnapshots(roomId: string): Record<string, string>;
  writeSnapshot(roomId: string, clientId: string, snapshot: string): void;
  deleteSnapshot(roomId: string, clientId: string): void;
  now(): number;
}