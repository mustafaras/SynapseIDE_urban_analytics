import * as Y from "yjs";
import {
  MAP_ANNOTATION_COLOR_PALETTE,
  type MapAnnotation,
  type MapAnnotationProperties,
  type MapAnnotationStyleSettings,
} from "@/centerpanel/components/map/mapTypes";
import {
  appendMapReviewEvent,
  type MapReviewSession,
} from "../MapReviewSessionService";

export const MAP_REVIEW_COLLABORATION_SCHEMA_VERSION = 1;
export const MAP_REVIEW_COLLABORATION_COMMENT_LIMIT = 400;

const SYNC_ORIGIN = Symbol("map-review-collaboration-sync");
const ANNOTATION_TEXT_LIMIT = 240;
const COMMENT_BODY_LIMIT = 1_200;

export type MapReviewCollaborationConnectionState = "connected" | "local-only" | "offline";
export type MapReviewCollaborationTargetKind = "layer" | "aoi" | "evidence";
export type MapReviewCommentStatus = "open" | "resolved";

export interface MapReviewCollaborationConnectionBadge {
  state: MapReviewCollaborationConnectionState;
  label: "connected" | "local-only" | "offline";
  tone: "ready" | "caveat" | "blocked";
  description: string;
}

export interface MapReviewCollaborationTarget {
  kind: MapReviewCollaborationTargetKind;
  id: string;
  label?: string;
}

export interface MapReviewCollaborationUser {
  userId: string;
  name: string;
  color?: string;
}

export interface MapReviewCollaborationAuthor {
  userId: string;
  name: string;
}

export interface MapReviewCollaborationPresence {
  clientId: string;
  userId: string;
  name: string;
  connectionState: MapReviewCollaborationConnectionState;
  lastActiveAt: string;
  isSelf: boolean;
  color?: string;
  activeTarget?: MapReviewCollaborationTarget;
}

export interface MapReviewPresencePatch {
  name?: string;
  color?: string | null;
  activeTarget?: MapReviewCollaborationTarget | null;
}

export interface MapReviewCollaborativeAnnotation {
  id: string;
  coordinate: [number, number];
  text: string;
  style: MapAnnotationStyleSettings;
  author: MapReviewCollaborationAuthor;
  createdAt: string;
  updatedAt: string;
  layerIds: string[];
  evidenceArtifactIds: string[];
  target?: MapReviewCollaborationTarget;
  leaderTarget?: [number, number] | null;
}

export interface MapReviewCollaborativeAnnotationInput {
  id?: string;
  coordinate: [number, number];
  text: string;
  style?: Partial<MapAnnotationStyleSettings>;
  author?: MapReviewCollaborationAuthor;
  target?: MapReviewCollaborationTarget;
  layerIds?: string[];
  evidenceArtifactIds?: string[];
  leaderTarget?: [number, number] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MapReviewComment {
  id: string;
  target: MapReviewCollaborationTarget;
  body: string;
  author: MapReviewCollaborationAuthor;
  status: MapReviewCommentStatus;
  createdAt: string;
  updatedAt: string;
  layerIds: string[];
  evidenceArtifactIds: string[];
  annotationIds: string[];
}

export interface MapReviewCommentInput {
  id?: string;
  target: MapReviewCollaborationTarget;
  body: string;
  author?: MapReviewCollaborationAuthor;
  status?: MapReviewCommentStatus;
  layerIds?: string[];
  evidenceArtifactIds?: string[];
  annotationIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MapReviewCommentPatch {
  body?: string;
  status?: MapReviewCommentStatus;
  target?: MapReviewCollaborationTarget;
  layerIds?: string[];
  evidenceArtifactIds?: string[];
  annotationIds?: string[];
  updatedAt?: string;
}

export interface MapReviewCollaborationSnapshot {
  schemaVersion: number;
  sessionId: string;
  connectionState: MapReviewCollaborationConnectionState;
  badge: MapReviewCollaborationConnectionBadge;
  annotations: MapReviewCollaborativeAnnotation[];
  comments: MapReviewComment[];
  presence: MapReviewCollaborationPresence[];
}

export interface MapReviewCollaborationSessionOptions {
  sessionId: string;
  clientId: string;
  user: MapReviewCollaborationUser;
  doc?: Y.Doc;
  initialConnectionState?: MapReviewCollaborationConnectionState;
  now?: () => number;
}

type YjsUpdateHandler = (update: Uint8Array, origin: unknown) => void;

const DEFAULT_ANNOTATION_STYLE: MapAnnotationStyleSettings = {
  fontSize: 16,
  color: MAP_ANNOTATION_COLOR_PALETTE[0],
  bold: true,
  italic: false,
  rotation: 0,
  hasBackground: true,
  leaderLine: false,
};

let autoIdCounter = 0;

function createLocalId(prefix: string): string {
  autoIdCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${autoIdCounter.toString(36)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nowIso(now: () => number): string {
  return new Date(now()).toISOString();
}

function truncateText(value: string, limit: number): string {
  const trimmed = value.trim();
  return trimmed.length <= limit ? trimmed : trimmed.slice(0, limit);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredString(value: unknown, fallback: string): string {
  return optionalString(value) ?? fallback;
}

function finiteNumber(value: unknown, fallback: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numeric));
}

function uniqueStrings(values: readonly unknown[] | undefined, limit = 48): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

function stringList(value: unknown, limit = 48): string[] {
  return Array.isArray(value) ? uniqueStrings(value, limit) : [];
}

function normalizeConnectionState(value: unknown, fallback: MapReviewCollaborationConnectionState): MapReviewCollaborationConnectionState {
  return value === "connected" || value === "local-only" || value === "offline" ? value : fallback;
}

function normalizeTarget(value: unknown): MapReviewCollaborationTarget | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const kind = value.kind === "layer" || value.kind === "aoi" || value.kind === "evidence" ? value.kind : null;
  const id = optionalString(value.id);
  if (!kind || !id) {
    return undefined;
  }
  const label = optionalString(value.label);
  return {
    kind,
    id,
    ...(label ? { label } : {}),
  };
}

function serializeTarget(target: MapReviewCollaborationTarget): MapReviewCollaborationTarget {
  return {
    kind: target.kind,
    id: target.id,
    ...(target.label ? { label: target.label } : {}),
  };
}

function normalizeCoordinate(value: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(value) || value.length < 2) {
    return fallback;
  }
  const longitude = finiteNumber(value[0], fallback[0], -180, 180);
  const latitude = finiteNumber(value[1], fallback[1], -90, 90);
  return [longitude, latitude];
}

function normalizeStyle(value: unknown, fallback: MapAnnotationStyleSettings = DEFAULT_ANNOTATION_STYLE): MapAnnotationStyleSettings {
  const source = isRecord(value) ? value : {};
  return {
    fontSize: finiteNumber(source.fontSize, fallback.fontSize, 8, 72),
    color: requiredString(source.color, fallback.color),
    bold: typeof source.bold === "boolean" ? source.bold : fallback.bold,
    italic: typeof source.italic === "boolean" ? source.italic : fallback.italic,
    rotation: finiteNumber(source.rotation, fallback.rotation, -360, 360),
    hasBackground: typeof source.hasBackground === "boolean" ? source.hasBackground : fallback.hasBackground,
    leaderLine: typeof source.leaderLine === "boolean" ? source.leaderLine : fallback.leaderLine,
  };
}

function normalizeAuthor(value: unknown, fallback: MapReviewCollaborationUser | MapReviewCollaborationAuthor): MapReviewCollaborationAuthor {
  const source = isRecord(value) ? value : {};
  return {
    userId: requiredString(source.userId, "userId" in fallback ? fallback.userId : "reviewer"),
    name: requiredString(source.name, fallback.name),
  };
}

function normalizePresenceRecord(
  value: unknown,
  fallbackClientId: string,
  fallbackUser: MapReviewCollaborationUser,
  fallbackState: MapReviewCollaborationConnectionState,
  selfClientId: string,
): MapReviewCollaborationPresence | null {
  const source = isRecord(value) ? value : {};
  const clientId = optionalString(source.clientId) ?? fallbackClientId;
  if (!clientId) {
    return null;
  }
  const color = optionalString(source.color) ?? fallbackUser.color;
  const activeTarget = normalizeTarget(source.activeTarget);
  return {
    clientId,
    userId: requiredString(source.userId, fallbackUser.userId),
    name: requiredString(source.name, fallbackUser.name),
    connectionState: normalizeConnectionState(source.connectionState, fallbackState),
    lastActiveAt: requiredString(source.lastActiveAt, new Date(0).toISOString()),
    isSelf: clientId === selfClientId,
    ...(color ? { color } : {}),
    ...(activeTarget ? { activeTarget } : {}),
  };
}

function serializePresenceRecord(presence: Omit<MapReviewCollaborationPresence, "isSelf">): Record<string, unknown> {
  return {
    clientId: presence.clientId,
    userId: presence.userId,
    name: presence.name,
    connectionState: presence.connectionState,
    lastActiveAt: presence.lastActiveAt,
    ...(presence.color ? { color: presence.color } : {}),
    ...(presence.activeTarget ? { activeTarget: serializeTarget(presence.activeTarget) } : {}),
  };
}

function normalizeCollaborativeAnnotationRecord(value: unknown): MapReviewCollaborativeAnnotation | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = optionalString(value.id);
  if (!id) {
    return null;
  }
  const createdAt = requiredString(value.createdAt, new Date(0).toISOString());
  const target = normalizeTarget(value.target);
  const leaderTarget = value.leaderTarget === null ? null : normalizeCoordinate(value.leaderTarget, [0, 0]);
  const hasLeaderTarget = value.leaderTarget === null || Array.isArray(value.leaderTarget);
  const layerIds = uniqueStrings([
    ...stringList(value.layerIds),
    ...(target?.kind === "layer" ? [target.id] : []),
  ]);
  const evidenceArtifactIds = uniqueStrings([
    ...stringList(value.evidenceArtifactIds),
    ...(target?.kind === "evidence" ? [target.id] : []),
  ]);
  return {
    id,
    coordinate: normalizeCoordinate(value.coordinate, [0, 0]),
    text: truncateText(requiredString(value.text, "Annotation"), ANNOTATION_TEXT_LIMIT),
    style: normalizeStyle(value.style),
    author: normalizeAuthor(value.author, { userId: "reviewer", name: "Reviewer" }),
    createdAt,
    updatedAt: requiredString(value.updatedAt, createdAt),
    layerIds,
    evidenceArtifactIds,
    ...(target ? { target } : {}),
    ...(hasLeaderTarget ? { leaderTarget } : {}),
  };
}

function serializeCollaborativeAnnotation(annotation: MapReviewCollaborativeAnnotation): Record<string, unknown> {
  return {
    id: annotation.id,
    coordinate: [...annotation.coordinate],
    text: annotation.text,
    style: { ...annotation.style },
    author: { ...annotation.author },
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
    layerIds: [...annotation.layerIds],
    evidenceArtifactIds: [...annotation.evidenceArtifactIds],
    ...(annotation.target ? { target: serializeTarget(annotation.target) } : {}),
    ...(annotation.leaderTarget !== undefined
      ? { leaderTarget: annotation.leaderTarget === null ? null : [...annotation.leaderTarget] }
      : {}),
  };
}

function annotationFromInput(
  input: MapReviewCollaborativeAnnotationInput,
  fallbackUser: MapReviewCollaborationUser,
  timestamp: string,
  existing?: MapReviewCollaborativeAnnotation | null,
): MapReviewCollaborativeAnnotation {
  const id = optionalString(input.id) ?? existing?.id ?? createLocalId("map-annotation");
  const createdAt = input.createdAt ?? existing?.createdAt ?? timestamp;
  const target = input.target ?? existing?.target;
  const layerIds = uniqueStrings([
    ...(input.layerIds ?? existing?.layerIds ?? []),
    ...(target?.kind === "layer" ? [target.id] : []),
  ]);
  const evidenceArtifactIds = uniqueStrings([
    ...(input.evidenceArtifactIds ?? existing?.evidenceArtifactIds ?? []),
    ...(target?.kind === "evidence" ? [target.id] : []),
  ]);
  return {
    id,
    coordinate: normalizeCoordinate(input.coordinate, existing?.coordinate ?? [0, 0]),
    text: truncateText(input.text, ANNOTATION_TEXT_LIMIT),
    style: normalizeStyle(input.style, existing?.style ?? DEFAULT_ANNOTATION_STYLE),
    author: input.author ?? existing?.author ?? normalizeAuthor(undefined, fallbackUser),
    createdAt,
    updatedAt: input.updatedAt ?? timestamp,
    layerIds,
    evidenceArtifactIds,
    ...(target ? { target: serializeTarget(target) } : {}),
    ...(input.leaderTarget !== undefined
      ? { leaderTarget: input.leaderTarget }
      : existing?.leaderTarget !== undefined
        ? { leaderTarget: existing.leaderTarget }
        : {}),
  };
}

function normalizeCommentStatus(value: unknown, fallback: MapReviewCommentStatus): MapReviewCommentStatus {
  return value === "resolved" || value === "open" ? value : fallback;
}

function normalizeCommentRecord(value: unknown): MapReviewComment | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = optionalString(value.id);
  const target = normalizeTarget(value.target);
  if (!id || !target) {
    return null;
  }
  const createdAt = requiredString(value.createdAt, new Date(0).toISOString());
  return {
    id,
    target,
    body: truncateText(requiredString(value.body, "Review comment"), COMMENT_BODY_LIMIT),
    author: normalizeAuthor(value.author, { userId: "reviewer", name: "Reviewer" }),
    status: normalizeCommentStatus(value.status, "open"),
    createdAt,
    updatedAt: requiredString(value.updatedAt, createdAt),
    layerIds: uniqueStrings([
      ...stringList(value.layerIds),
      ...(target.kind === "layer" ? [target.id] : []),
    ]),
    evidenceArtifactIds: uniqueStrings([
      ...stringList(value.evidenceArtifactIds),
      ...(target.kind === "evidence" ? [target.id] : []),
    ]),
    annotationIds: stringList(value.annotationIds),
  };
}

function serializeComment(comment: MapReviewComment): Record<string, unknown> {
  return {
    id: comment.id,
    target: serializeTarget(comment.target),
    body: comment.body,
    author: { ...comment.author },
    status: comment.status,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    layerIds: [...comment.layerIds],
    evidenceArtifactIds: [...comment.evidenceArtifactIds],
    annotationIds: [...comment.annotationIds],
  };
}

function commentFromInput(
  input: MapReviewCommentInput,
  fallbackUser: MapReviewCollaborationUser,
  timestamp: string,
): MapReviewComment {
  const target = serializeTarget(input.target);
  return {
    id: optionalString(input.id) ?? createLocalId("map-review-comment"),
    target,
    body: truncateText(input.body, COMMENT_BODY_LIMIT),
    author: input.author ?? normalizeAuthor(undefined, fallbackUser),
    status: input.status ?? "open",
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    layerIds: uniqueStrings([...(input.layerIds ?? []), ...(target.kind === "layer" ? [target.id] : [])]),
    evidenceArtifactIds: uniqueStrings([...(input.evidenceArtifactIds ?? []), ...(target.kind === "evidence" ? [target.id] : [])]),
    annotationIds: uniqueStrings(input.annotationIds ?? []),
  };
}

function targetSummary(target: MapReviewCollaborationTarget | undefined): string {
  if (!target) {
    return "map review";
  }
  return target.label ?? `${target.kind} ${target.id}`;
}

function sortByUpdatedAt<T extends { id: string; updatedAt: string; createdAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt) || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
}

function hasCollaborationRecord(session: MapReviewSession, recordKey: string): boolean {
  return session.events.some((event) => event.details.collaborationRecordKey === recordKey);
}

export function getMapReviewCollaborationConnectionBadge(
  state: MapReviewCollaborationConnectionState,
): MapReviewCollaborationConnectionBadge {
  if (state === "connected") {
    return {
      state,
      label: "connected",
      tone: "ready",
      description: "Collaboration transport is connected; lightweight review annotations, comments, and presence can sync.",
    };
  }
  if (state === "offline") {
    return {
      state,
      label: "offline",
      tone: "blocked",
      description: "No collaboration transport is available; edits remain on this client only.",
    };
  }
  return {
    state: "local-only",
    label: "local-only",
    tone: "caveat",
    description: "This review session is editable locally, but changes are not being synced to other clients.",
  };
}

export function toMapAnnotation(annotation: MapReviewCollaborativeAnnotation): MapAnnotation {
  const properties: MapAnnotationProperties = {
    ...annotation.style,
    text: annotation.text,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
    ...(annotation.leaderTarget !== undefined ? { leaderTarget: annotation.leaderTarget } : {}),
  };
  return {
    type: "Feature",
    id: annotation.id,
    properties,
    geometry: {
      type: "Point",
      coordinates: [...annotation.coordinate],
    },
  };
}

export function appendMapReviewCollaborationSnapshotToSession(
  session: MapReviewSession,
  snapshot: MapReviewCollaborationSnapshot,
): MapReviewSession {
  let nextSession = session;

  for (const annotation of snapshot.annotations) {
    const recordKey = `annotation:${annotation.id}:${annotation.updatedAt}`;
    if (hasCollaborationRecord(nextSession, recordKey)) {
      continue;
    }
    nextSession = appendMapReviewEvent(nextSession, {
      type: "annotation",
      category: "annotation-bookmark",
      status: "recorded",
      timestamp: annotation.updatedAt,
      title: `Collaborative annotation: ${targetSummary(annotation.target)}`,
      summary: `${annotation.author.name} shared annotation ${annotation.id}: ${annotation.text}`,
      layerIds: annotation.layerIds,
      evidenceArtifactIds: annotation.evidenceArtifactIds,
      annotationIds: [annotation.id],
      details: {
        collaborationSchemaVersion: MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
        collaborationRecordKey: recordKey,
        collaborationRecordType: "annotation",
        targetKind: annotation.target?.kind ?? null,
        targetId: annotation.target?.id ?? null,
        authorUserId: annotation.author.userId,
        authorName: annotation.author.name,
        connectionState: snapshot.connectionState,
      },
    });
  }

  for (const comment of snapshot.comments) {
    const recordKey = `comment:${comment.id}:${comment.updatedAt}:${comment.status}`;
    if (hasCollaborationRecord(nextSession, recordKey)) {
      continue;
    }
    nextSession = appendMapReviewEvent(nextSession, {
      type: "annotation",
      category: "annotation-bookmark",
      status: comment.status === "resolved" ? "resolved" : "recorded",
      timestamp: comment.updatedAt,
      title: `Review comment: ${targetSummary(comment.target)}`,
      summary: `${comment.author.name} commented on ${targetSummary(comment.target)}: ${comment.body}`,
      layerIds: comment.layerIds,
      evidenceArtifactIds: comment.evidenceArtifactIds,
      annotationIds: comment.annotationIds,
      details: {
        collaborationSchemaVersion: MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
        collaborationRecordKey: recordKey,
        collaborationRecordType: "comment",
        commentId: comment.id,
        commentStatus: comment.status,
        targetKind: comment.target.kind,
        targetId: comment.target.id,
        authorUserId: comment.author.userId,
        authorName: comment.author.name,
        connectionState: snapshot.connectionState,
      },
    });
  }

  return nextSession;
}

export class MapReviewCollaborationSession {
  private readonly doc: Y.Doc;

  private readonly annotationsMap: Y.Map<unknown>;

  private readonly commentsMap: Y.Map<unknown>;

  private readonly presenceMap: Y.Map<unknown>;

  private readonly listeners = new Set<(snapshot: MapReviewCollaborationSnapshot) => void>();

  private readonly now: () => number;

  private readonly sessionId: string;

  private readonly clientId: string;

  private readonly user: MapReviewCollaborationUser;

  private connectionState: MapReviewCollaborationConnectionState;

  private destroyed = false;

  private readonly handleSharedChange = (): void => {
    this.notify();
  };

  constructor(options: MapReviewCollaborationSessionOptions) {
    this.doc = options.doc ?? new Y.Doc();
    this.annotationsMap = this.doc.getMap<unknown>("mapReview.annotations");
    this.commentsMap = this.doc.getMap<unknown>("mapReview.comments");
    this.presenceMap = this.doc.getMap<unknown>("mapReview.presence");
    this.now = options.now ?? Date.now;
    this.sessionId = options.sessionId;
    this.clientId = options.clientId;
    this.user = {
      userId: options.user.userId,
      name: options.user.name,
      ...(options.user.color ? { color: options.user.color } : {}),
    };
    this.connectionState = options.initialConnectionState ?? "local-only";

    this.annotationsMap.observe(this.handleSharedChange);
    this.commentsMap.observe(this.handleSharedChange);
    this.presenceMap.observe(this.handleSharedChange);
    this.touchPresence();
  }

  getYDoc(): Y.Doc {
    return this.doc;
  }

  getConnectionState(): MapReviewCollaborationConnectionState {
    return this.connectionState;
  }

  setConnectionState(state: MapReviewCollaborationConnectionState): void {
    if (this.destroyed) {
      return;
    }
    this.connectionState = state;
    this.touchPresence();
    this.notify();
  }

  updatePresence(patch: MapReviewPresencePatch = {}): void {
    if (this.destroyed) {
      return;
    }
    const existing = normalizePresenceRecord(
      this.presenceMap.get(this.clientId),
      this.clientId,
      this.user,
      this.connectionState,
      this.clientId,
    );
    const hasActiveTargetPatch = Object.prototype.hasOwnProperty.call(patch, "activeTarget");
    const activeTarget = hasActiveTargetPatch
      ? patch.activeTarget
        ? serializeTarget(patch.activeTarget)
        : undefined
      : existing?.activeTarget;
    const nextUser: MapReviewCollaborationUser = {
      userId: this.user.userId,
      name: patch.name ?? existing?.name ?? this.user.name,
      ...(patch.color === null
        ? {}
        : patch.color
          ? { color: patch.color }
          : existing?.color
            ? { color: existing.color }
            : this.user.color
              ? { color: this.user.color }
              : {}),
    };
    const presence: Omit<MapReviewCollaborationPresence, "isSelf"> = {
      clientId: this.clientId,
      userId: nextUser.userId,
      name: nextUser.name,
      connectionState: this.connectionState,
      lastActiveAt: nowIso(this.now),
      ...(nextUser.color ? { color: nextUser.color } : {}),
      ...(activeTarget ? { activeTarget } : {}),
    };
    this.presenceMap.set(this.clientId, serializePresenceRecord(presence));
    this.notify();
  }

  upsertAnnotation(input: MapReviewCollaborativeAnnotationInput): MapReviewCollaborativeAnnotation {
    const timestamp = input.updatedAt ?? nowIso(this.now);
    const existing = input.id ? normalizeCollaborativeAnnotationRecord(this.annotationsMap.get(input.id)) : null;
    const annotation = annotationFromInput(input, this.user, timestamp, existing);
    this.annotationsMap.set(annotation.id, serializeCollaborativeAnnotation(annotation));
    return annotation;
  }

  removeAnnotation(annotationId: string): void {
    this.annotationsMap.delete(annotationId);
  }

  addComment(input: MapReviewCommentInput): MapReviewComment {
    const timestamp = input.updatedAt ?? nowIso(this.now);
    const comment = commentFromInput(input, this.user, timestamp);
    this.commentsMap.set(comment.id, serializeComment(comment));
    return comment;
  }

  updateComment(commentId: string, patch: MapReviewCommentPatch): MapReviewComment | null {
    const existing = normalizeCommentRecord(this.commentsMap.get(commentId));
    if (!existing) {
      return null;
    }
    const target = patch.target ?? existing.target;
    const updated: MapReviewComment = {
      ...existing,
      target,
      body: patch.body === undefined ? existing.body : truncateText(patch.body, COMMENT_BODY_LIMIT),
      status: patch.status ?? existing.status,
      updatedAt: patch.updatedAt ?? nowIso(this.now),
      layerIds: uniqueStrings([
        ...(patch.layerIds ?? existing.layerIds),
        ...(target.kind === "layer" ? [target.id] : []),
      ]),
      evidenceArtifactIds: uniqueStrings([
        ...(patch.evidenceArtifactIds ?? existing.evidenceArtifactIds),
        ...(target.kind === "evidence" ? [target.id] : []),
      ]),
      annotationIds: uniqueStrings(patch.annotationIds ?? existing.annotationIds),
    };
    this.commentsMap.set(commentId, serializeComment(updated));
    return updated;
  }

  getSnapshot(): MapReviewCollaborationSnapshot {
    const annotations = sortByUpdatedAt(
      Array.from(this.annotationsMap.values())
        .map(normalizeCollaborativeAnnotationRecord)
        .filter((annotation): annotation is MapReviewCollaborativeAnnotation => annotation !== null),
    );
    const comments = sortByUpdatedAt(
      Array.from(this.commentsMap.values())
        .map(normalizeCommentRecord)
        .filter((comment): comment is MapReviewComment => comment !== null),
    ).slice(-MAP_REVIEW_COLLABORATION_COMMENT_LIMIT);
    const presence = Array.from(this.presenceMap.values())
      .map((entry) => normalizePresenceRecord(entry, this.clientId, this.user, this.connectionState, this.clientId))
      .filter((entry): entry is MapReviewCollaborationPresence => entry !== null)
      .sort((left, right) => Number(right.isSelf) - Number(left.isSelf) || left.name.localeCompare(right.name) || left.clientId.localeCompare(right.clientId));

    return {
      schemaVersion: MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
      sessionId: this.sessionId,
      connectionState: this.connectionState,
      badge: getMapReviewCollaborationConnectionBadge(this.connectionState),
      annotations,
      comments,
      presence,
    };
  }

  subscribe(listener: (snapshot: MapReviewCollaborationSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.annotationsMap.unobserve(this.handleSharedChange);
    this.commentsMap.unobserve(this.handleSharedChange);
    this.presenceMap.unobserve(this.handleSharedChange);
    this.presenceMap.delete(this.clientId);
    this.listeners.clear();
  }

  private touchPresence(): void {
    this.updatePresence({});
  }

  private notify(): void {
    if (this.destroyed || this.listeners.size === 0) {
      return;
    }
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export function connectMapReviewCollaborationSessions(
  left: MapReviewCollaborationSession,
  right: MapReviewCollaborationSession,
): () => void {
  left.setConnectionState("connected");
  right.setConnectionState("connected");

  const leftDoc = left.getYDoc();
  const rightDoc = right.getYDoc();

  Y.applyUpdate(rightDoc, Y.encodeStateAsUpdate(leftDoc), SYNC_ORIGIN);
  Y.applyUpdate(leftDoc, Y.encodeStateAsUpdate(rightDoc), SYNC_ORIGIN);

  const forwardLeftToRight: YjsUpdateHandler = (update, origin) => {
    if (origin === SYNC_ORIGIN) {
      return;
    }
    Y.applyUpdate(rightDoc, update, SYNC_ORIGIN);
  };
  const forwardRightToLeft: YjsUpdateHandler = (update, origin) => {
    if (origin === SYNC_ORIGIN) {
      return;
    }
    Y.applyUpdate(leftDoc, update, SYNC_ORIGIN);
  };

  leftDoc.on("update", forwardLeftToRight);
  rightDoc.on("update", forwardRightToLeft);

  return () => {
    leftDoc.off("update", forwardLeftToRight);
    rightDoc.off("update", forwardRightToLeft);
    left.setConnectionState("local-only");
    right.setConnectionState("local-only");
  };
}

export function createMapReviewCollaborationSession(
  options: MapReviewCollaborationSessionOptions,
): MapReviewCollaborationSession {
  return new MapReviewCollaborationSession(options);
}
