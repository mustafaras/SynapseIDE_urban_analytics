// ---------------------------------------------------------------------------
// Urban Analytics — Project Registry Types (primary)
// ---------------------------------------------------------------------------

import type {
  BoundingBox,
  CoordinateReferenceSystem,
  IndicatorResult,
  SessionType,
  UrbanScale,
  UrbanTag,
} from '@/features/urbanAnalytics/lib/types';

/** Urban analytics project record — primary type for the urban domain. */
export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  scale: UrbanScale;
  area_km2?: number;
  bbox?: BoundingBox;
  crs: CoordinateReferenceSystem;
  tags: UrbanTag[];
  priority: 1 | 2 | 3 | 4 | 5;
  climateVulnerability?: 'low' | 'medium' | 'high' | 'critical';
  dataCompleteness?: number; // 0-100 percentage
  sessionsCount: number;
  lastSessionDate?: string;
  indicators: IndicatorResult[];
  reportSnapshots?: ProjectReviewSnapshot[];
  recentChanges?: ProjectRecentChange[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectReviewSourceMode = 'real' | 'demo' | 'mixed' | 'unknown';

export type ProjectReviewArtifactKind = 'note-slot' | 'report' | 'analysis-run' | 'snapshot';

export interface ProjectReviewArtifactRef {
  kind: ProjectReviewArtifactKind;
  label: string;
  id?: string;
  flowId?: string;
}

export interface ProjectReviewSnapshot {
  id: string;
  createdAt: string;
  label: string;
  summary: string;
  slots: Record<string, string>;
  sourceMode: ProjectReviewSourceMode;
  artifact: ProjectReviewArtifactRef;
}

export interface ProjectRecentChange {
  id: string;
  changedAt: string;
  kind: 'snapshot-created' | 'report-saved' | 'report-restored' | 'report-updated' | 'analysis-run';
  title: string;
  description: string;
  slotId?: string;
  sourceMode: ProjectReviewSourceMode;
  artifact: ProjectReviewArtifactRef;
  preview?: string;
}

/** A single analysis session record — replaces legacy Encounter. */
export interface SessionRecord {
  id: string;
  type: SessionType;
  date: string;
  datasetsUsed: string[];
  methodsApplied: string[];
  indicatorResults: IndicatorResult[];
}

/** Summary view for project list rendering. */
export interface ProjectListItem {
  id: string;
  name: string;
  scale: UrbanScale;
  tags: UrbanTag[];
  priority: 1 | 2 | 3 | 4 | 5;
  sessionsCount: number;
  lastSessionDate?: string;
  dataCompleteness?: number;
  climateVulnerability?: 'low' | 'medium' | 'high' | 'critical';
}

/** Filter for project registry list. */
export interface ProjectFilter {
  scaleFilter?: UrbanScale[];
  tagFilter?: UrbanTag[];
  priorityFilter?: (1 | 2 | 3 | 4 | 5)[];
  search?: string;
}

/** State shape for the urban project registry. */
export interface ProjectRegistryState {
  projects: ProjectRecord[];
  selectedProjectId?: string;
  selectedSessionId?: string;
  filter: ProjectFilter;
  version: 1;
}

// ---------------------------------------------------------------------------
// Generic / Shared Types
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  label: string;
  createdAt: number;
  due?: number;
  done?: boolean;
}

export interface SessionNoteSlots {
  summary?: string;
  plan?: string;
  refs?: string;
  outcome?: string;
  vitals?: string;

  outcomes?: Array<{
    flowId: string;
    insertedAt: number;
    paragraph: string;
  }>;

  refsList?: string[];
}

/** @deprecated Use SessionNoteSlots */
export type EncounterSlots = SessionNoteSlots;

export interface CompletedRun {
  runId?: string;
  flowId: string;
  label: string;
  insertedAt: number;
  paragraph: string;
  paragraphPreview?: string;
  paragraphFull?: string;
}

// ---------------------------------------------------------------------------
// Legacy Compatibility Aliases
// These map old names to new types so existing consumers compile cleanly.
// ---------------------------------------------------------------------------

/** @deprecated Use ProjectRecord["priority"] */
export type RiskLevel = 1 | 2 | 3 | 4 | 5;

/** @deprecated Use UrbanTag instead */
export type Tag = string;

/** @deprecated Use IndicatorResult instead */
export type AssessmentKind = string;

/** @deprecated Use IndicatorResult instead */
export interface Assessment {
  id: string;
  kind: string;
  when: number;
  score: number;
}

/** @deprecated Use IndicatorResult instead */
export interface ScoreDelta {
  kind: string;
  latest?: number;
  previous?: number;
  delta?: number;
}

/** @deprecated Use SessionRecord instead */
export interface Encounter {
  id: string;
  when: number;
  location?: string;
  noteSlots: SessionNoteSlots;
  sessionMsTotal?: number;
  flags?: Record<string, boolean>;
  completedFlows?: string[];
  completedRuns?: CompletedRun[];
  snapshots?: Array<{ id: string; when: number; slots: SessionNoteSlots }>;
}

/** @deprecated Use ProjectRecord instead */
export interface Patient {
  id: string;
  name?: string;
  age?: number;
  sex?: "F" | "M" | "X";
  risk: RiskLevel;
  grade?: number;
  tags: string[];
  assessments: Assessment[];
  encounters: Encounter[];
  tasks?: Task[];
  [key: string]: unknown;
}

/** @deprecated Use ProjectFilter instead */
export interface Filter {
  cohorts: Array<string>;
  risk?: RiskLevel[];
  tags?: string[];
  status?: { overdue?: boolean; activeFlow?: boolean; newResults?: boolean };
  search?: string;
}

/** @deprecated Use ProjectRegistryState instead */
export interface RegistryState {
  projects: Patient[];
  selectedProjectId?: string;
  selectedSessionId?: string;
  filter: Filter;
  version: 1;
}
