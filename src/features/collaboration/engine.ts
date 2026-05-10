import * as Y from "yjs";
import type { ProjectRecord, ProjectRegistryState } from "@/centerpanel/registry/types";
import type {
  DashboardDocument,
  DashboardLibraryState,
  DashboardWidget,
  DashboardWidgetConfig,
  DashboardWidgetStyle,
} from "@/features/dashboard/types";
import type { CollaborationUser } from "@/types/collaboration";
import type {
  CollaborationAdapter,
  CollaborationCommentThread,
  CollaborationConnectionState,
  CollaborationEngineSnapshot,
  CollaborationEnvelope,
  CollaborationNoteDocument,
  CollaborationPresenceState,
  CollaborationReply,
  CollaborationRoomSeed,
} from "./types";
import {
  normalizeProjectRecentChanges,
  normalizeProjectSnapshots,
} from "./projectHistory";

const LOCAL_ORIGIN = Symbol("collaboration-local");
const REMOTE_ORIGIN = Symbol("collaboration-remote");
const BOOTSTRAP_ORIGIN = Symbol("collaboration-bootstrap");
const RESYNC_ORIGIN = Symbol("collaboration-resync");
const PRESENCE_STALE_MS = 16_000;
const HEARTBEAT_MS = 4_000;
const FIELD_ID = "id";

function uint8ToBase64(value: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  }
  let binary = "";
  value.forEach((entry) => {
    binary += String.fromCharCode(entry);
  });
  return btoa(binary);
}

function base64ToUint8Array(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isYMap(value: unknown): value is Y.Map<unknown> {
  return value instanceof Y.Map;
}

function isYArray(value: unknown): value is Y.Array<unknown> {
  return value instanceof Y.Array;
}

function isYText(value: unknown): value is Y.Text {
  return value instanceof Y.Text;
}

function getOrCreateMap(parent: Y.Map<unknown>, key: string): Y.Map<unknown> {
  const existing = parent.get(key);
  if (isYMap(existing)) {
    return existing;
  }
  const created = new Y.Map();
  parent.set(key, created);
  return created;
}

function getOrCreateArray(parent: Y.Map<unknown>, key: string): Y.Array<unknown> {
  const existing = parent.get(key);
  if (isYArray(existing)) {
    return existing;
  }
  const created = new Y.Array();
  parent.set(key, created);
  return created;
}

function getOrCreateText(parent: Y.Map<unknown>, key: string, initialValue = ""): Y.Text {
  const existing = parent.get(key);
  if (isYText(existing)) {
    return existing;
  }
  const created = new Y.Text(initialValue);
  parent.set(key, created);
  return created;
}

function replaceYText(target: Y.Text, nextValue: string): void {
  const currentValue = target.toString();
  if (currentValue === nextValue) {
    return;
  }

  let prefixLength = 0;
  while (
    prefixLength < currentValue.length
    && prefixLength < nextValue.length
    && currentValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength + prefixLength < currentValue.length
    && suffixLength + prefixLength < nextValue.length
    && currentValue[currentValue.length - 1 - suffixLength] === nextValue[nextValue.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const removeCount = currentValue.length - prefixLength - suffixLength;
  const insertText = nextValue.slice(prefixLength, nextValue.length - suffixLength);

  if (removeCount > 0) {
    target.delete(prefixLength, removeCount);
  }
  if (insertText) {
    target.insert(prefixLength, insertText);
  }
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readTextValue(parent: Y.Map<unknown>, key: string, fallback = ""): string {
  const existing = parent.get(key);
  if (isYText(existing)) {
    return existing.toString();
  }
  return typeof existing === "string" ? existing : fallback;
}

function arrayFromIterator<T>(value: IterableIterator<T>): T[] {
  return Array.from(value);
}

function sortByCreatedAt<T extends { createdAt: number; id: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
}

function reconcileOrderArray(target: Y.Array<unknown>, nextIds: string[]): void {
  for (let index = target.length - 1; index >= 0; index -= 1) {
    const currentId = target.get(index);
    if (typeof currentId === "string" && !nextIds.includes(currentId)) {
      target.delete(index, 1);
    }
  }

  const working = target.toArray().filter((entry): entry is string => typeof entry === "string");
  nextIds.forEach((id, nextIndex) => {
    const currentIndex = working.indexOf(id);
    if (currentIndex === -1) {
      target.insert(nextIndex, [id]);
      working.splice(nextIndex, 0, id);
      return;
    }
    if (currentIndex !== nextIndex) {
      target.delete(currentIndex, 1);
      target.insert(nextIndex, [id]);
      working.splice(currentIndex, 1);
      working.splice(nextIndex, 0, id);
    }
  });
}

function projectRecordFromMap(source: Y.Map<unknown>): ProjectRecord {
  const areaKm2 = optionalNumber(source.get("area_km2"));
  const bboxValue = parseJsonValue<number[] | undefined>(source.get("bbox"), undefined);
  const bbox = Array.isArray(bboxValue) && bboxValue.length === 4
    ? [bboxValue[0] ?? 0, bboxValue[1] ?? 0, bboxValue[2] ?? 0, bboxValue[3] ?? 0] as [number, number, number, number]
    : undefined;
  const climateVulnerability = optionalString(source.get("climateVulnerability")) as ProjectRecord["climateVulnerability"] | undefined;
  const dataCompleteness = optionalNumber(source.get("dataCompleteness"));
  const lastSessionDate = optionalString(source.get("lastSessionDate"));
  const reportSnapshots = normalizeProjectSnapshots(parseJsonValue(source.get("reportSnapshots"), undefined));
  const recentChanges = normalizeProjectRecentChanges(parseJsonValue(source.get("recentChanges"), undefined));
  const project: ProjectRecord = {
    id: String(source.get(FIELD_ID) ?? ""),
    name: readTextValue(source, "name"),
    description: readTextValue(source, "description"),
    scale: String(source.get("scale") ?? "city") as ProjectRecord["scale"],
    crs: String(source.get("crs") ?? "EPSG:4326") as ProjectRecord["crs"],
    tags: parseJsonValue<ProjectRecord["tags"]>(source.get("tags"), []),
    priority: Number(source.get("priority") ?? 3) as ProjectRecord["priority"],
    sessionsCount: Number(source.get("sessionsCount") ?? 0),
    indicators: parseJsonValue<ProjectRecord["indicators"]>(source.get("indicators"), []),
    createdAt: String(source.get("createdAt") ?? new Date().toISOString()),
    updatedAt: String(source.get("updatedAt") ?? new Date().toISOString()),
  };
  if (areaKm2 !== undefined) {
    project.area_km2 = areaKm2;
  }
  if (bbox !== undefined) {
    project.bbox = bbox;
  }
  if (climateVulnerability !== undefined) {
    project.climateVulnerability = climateVulnerability;
  }
  if (dataCompleteness !== undefined) {
    project.dataCompleteness = dataCompleteness;
  }
  if (lastSessionDate !== undefined) {
    project.lastSessionDate = lastSessionDate;
  }
  if (reportSnapshots.length > 0) {
    project.reportSnapshots = reportSnapshots;
  }
  if (recentChanges.length > 0) {
    project.recentChanges = recentChanges;
  }
  return project;
}

function applyProjectSnapshot(target: Y.Map<unknown>, project: ProjectRecord): void {
  target.set(FIELD_ID, project.id);
  replaceYText(getOrCreateText(target, "name", project.name), project.name);
  replaceYText(getOrCreateText(target, "description", project.description), project.description);
  target.set("scale", project.scale);
  if (project.area_km2 === undefined) {
    target.delete("area_km2");
  } else {
    target.set("area_km2", project.area_km2);
  }
  if (project.bbox === undefined) {
    target.delete("bbox");
  } else {
    target.set("bbox", JSON.stringify(project.bbox));
  }
  target.set("crs", project.crs);
  target.set("tags", JSON.stringify(project.tags));
  target.set("priority", project.priority);
  if (project.climateVulnerability === undefined) {
    target.delete("climateVulnerability");
  } else {
    target.set("climateVulnerability", project.climateVulnerability);
  }
  if (project.dataCompleteness === undefined) {
    target.delete("dataCompleteness");
  } else {
    target.set("dataCompleteness", project.dataCompleteness);
  }
  target.set("sessionsCount", project.sessionsCount);
  if (project.lastSessionDate === undefined) {
    target.delete("lastSessionDate");
  } else {
    target.set("lastSessionDate", project.lastSessionDate);
  }
  target.set("indicators", JSON.stringify(project.indicators));
  if (!project.reportSnapshots || project.reportSnapshots.length === 0) {
    target.delete("reportSnapshots");
  } else {
    target.set("reportSnapshots", JSON.stringify(normalizeProjectSnapshots(project.reportSnapshots)));
  }
  if (!project.recentChanges || project.recentChanges.length === 0) {
    target.delete("recentChanges");
  } else {
    target.set("recentChanges", JSON.stringify(normalizeProjectRecentChanges(project.recentChanges)));
  }
  target.set("createdAt", project.createdAt);
  target.set("updatedAt", project.updatedAt);
}

function widgetFromMap(source: Y.Map<unknown>): DashboardWidget {
  const subtitle = optionalString(source.get("subtitle"));
  const bindingId = optionalString(source.get("bindingId"));
  const body = optionalString(source.get("body"));
  const style = parseJsonValue<DashboardWidgetStyle | undefined>(source.get("style"), undefined);
  const config: DashboardWidgetConfig = {
    title: String(source.get("title") ?? "Widget"),
  };
  if (subtitle !== undefined) {
    config.subtitle = subtitle;
  }
  if (bindingId !== undefined) {
    config.bindingId = bindingId;
  }
  if (body !== undefined) {
    config.body = body;
  }
  if (style !== undefined) {
    config.style = style;
  }
  return {
    id: String(source.get(FIELD_ID) ?? "widget"),
    type: String(source.get("type") ?? "text") as DashboardWidget["type"],
    layout: {
      x: Number(source.get("layoutX") ?? 0),
      y: Number(source.get("layoutY") ?? 0),
      w: Number(source.get("layoutW") ?? 4),
      h: Number(source.get("layoutH") ?? 3),
    },
    config,
  };
}

function applyWidgetSnapshot(target: Y.Map<unknown>, widget: DashboardWidget): void {
  target.set(FIELD_ID, widget.id);
  target.set("type", widget.type);
  target.set("layoutX", widget.layout.x);
  target.set("layoutY", widget.layout.y);
  target.set("layoutW", widget.layout.w);
  target.set("layoutH", widget.layout.h);
  target.set("title", widget.config.title);
  if (widget.config.subtitle === undefined) {
    target.delete("subtitle");
  } else {
    target.set("subtitle", widget.config.subtitle);
  }
  if (widget.config.bindingId === undefined) {
    target.delete("bindingId");
  } else {
    target.set("bindingId", widget.config.bindingId);
  }
  if (widget.config.body === undefined) {
    target.delete("body");
  } else {
    target.set("body", widget.config.body);
  }
  if (widget.config.style === undefined) {
    target.delete("style");
  } else {
    target.set("style", JSON.stringify(widget.config.style));
  }
}

function dashboardDocumentFromMap(source: Y.Map<unknown>): DashboardDocument {
  const widgetsValue = source.get("widgets");
  const widgetsMap = isYMap(widgetsValue) ? widgetsValue : null;
  const widgetOrderValue = source.get("widgetOrder");
  const widgetOrder = isYArray(widgetOrderValue)
    ? widgetOrderValue.toArray().filter((entry): entry is string => typeof entry === "string")
    : [];
  const widgetIds = new Set(widgetOrder);
  const remaining = widgetsMap ? arrayFromIterator(widgetsMap.keys()).filter((id) => !widgetIds.has(id)).sort() : [];
  const orderedWidgets = [...widgetOrder, ...remaining]
    .map((widgetId) => widgetsMap?.get(widgetId))
    .filter(isYMap)
    .map((widget) => widgetFromMap(widget));

  const templateId = optionalString(source.get("templateId")) as DashboardDocument["templateId"] | undefined;
  return {
    id: String(source.get(FIELD_ID) ?? "dashboard"),
    name: String(source.get("name") ?? "Urban Dashboard"),
    description: String(source.get("description") ?? ""),
    templateId: templateId ?? null,
    createdAt: String(source.get("createdAt") ?? new Date().toISOString()),
    updatedAt: String(source.get("updatedAt") ?? new Date().toISOString()),
    columns: Number(source.get("columns") ?? 12),
    widgets: orderedWidgets,
    tags: parseJsonValue<string[]>(source.get("tags"), ["custom"]),
  };
}

function applyDashboardSnapshot(target: Y.Map<unknown>, dashboard: DashboardDocument): void {
  target.set(FIELD_ID, dashboard.id);
  target.set("name", dashboard.name);
  target.set("description", dashboard.description);
  if (dashboard.templateId === undefined || dashboard.templateId === null) {
    target.delete("templateId");
  } else {
    target.set("templateId", dashboard.templateId);
  }
  target.set("createdAt", dashboard.createdAt);
  target.set("updatedAt", dashboard.updatedAt);
  target.set("columns", dashboard.columns);
  target.set("tags", JSON.stringify(dashboard.tags));

  const widgetsMap = getOrCreateMap(target, "widgets");
  const widgetOrder = getOrCreateArray(target, "widgetOrder");
  const nextIds = dashboard.widgets.map((widget) => widget.id);
  reconcileOrderArray(widgetOrder, nextIds);
  const nextIdSet = new Set(nextIds);

  arrayFromIterator(widgetsMap.keys()).forEach((widgetId) => {
    if (!nextIdSet.has(widgetId)) {
      widgetsMap.delete(widgetId);
    }
  });

  dashboard.widgets.forEach((widget) => {
    const existing = widgetsMap.get(widget.id);
    const widgetMap = isYMap(existing) ? existing : new Y.Map<unknown>();
    applyWidgetSnapshot(widgetMap, widget);
    if (!isYMap(existing)) {
      widgetsMap.set(widget.id, widgetMap);
    }
  });
}

function threadFromMap(source: Y.Map<unknown>): CollaborationCommentThread {
  const repliesValue = source.get("replies");
  const repliesArray = isYArray(repliesValue) ? repliesValue : null;
  const resolvedAt = optionalNumber(source.get("resolvedAt"));
  const resolvedBy = optionalString(source.get("resolvedBy"));
  const thread: CollaborationCommentThread = {
    id: String(source.get(FIELD_ID) ?? "thread"),
    scopeId: String(source.get("scopeId") ?? "scope"),
    anchorLabel: String(source.get("anchorLabel") ?? "Context"),
    body: String(source.get("body") ?? ""),
    authorId: String(source.get("authorId") ?? "user"),
    authorName: String(source.get("authorName") ?? "Collaborator"),
    authorColor: String(source.get("authorColor") ?? "#f59e0b"),
    createdAt: Number(source.get("createdAt") ?? Date.now()),
    updatedAt: Number(source.get("updatedAt") ?? Date.now()),
    status: String(source.get("status") ?? "open") as CollaborationCommentThread["status"],
    replies: repliesArray
      ? sortByCreatedAt(
        repliesArray
          .toArray()
          .filter(isYMap)
          .map((reply) => ({
            id: String(reply.get(FIELD_ID) ?? "reply"),
            authorId: String(reply.get("authorId") ?? "user"),
            authorName: String(reply.get("authorName") ?? "Collaborator"),
            authorColor: String(reply.get("authorColor") ?? "#f59e0b"),
            body: String(reply.get("body") ?? ""),
            createdAt: Number(reply.get("createdAt") ?? Date.now()),
          })),
      )
      : [],
  };
  if (resolvedAt !== undefined) {
    thread.resolvedAt = resolvedAt;
  }
  if (resolvedBy !== undefined) {
    thread.resolvedBy = resolvedBy;
  }
  return thread;
}

function applyThreadSnapshot(target: Y.Map<unknown>, thread: CollaborationCommentThread): void {
  target.set(FIELD_ID, thread.id);
  target.set("scopeId", thread.scopeId);
  target.set("anchorLabel", thread.anchorLabel);
  target.set("body", thread.body);
  target.set("authorId", thread.authorId);
  target.set("authorName", thread.authorName);
  target.set("authorColor", thread.authorColor);
  target.set("createdAt", thread.createdAt);
  target.set("updatedAt", thread.updatedAt);
  target.set("status", thread.status);
  if (thread.resolvedAt === undefined) {
    target.delete("resolvedAt");
  } else {
    target.set("resolvedAt", thread.resolvedAt);
  }
  if (thread.resolvedBy === undefined) {
    target.delete("resolvedBy");
  } else {
    target.set("resolvedBy", thread.resolvedBy);
  }

  const repliesArray = getOrCreateArray(target, "replies");
  while (repliesArray.length > 0) {
    repliesArray.delete(0, repliesArray.length);
  }
  thread.replies.forEach((reply) => {
    const replyMap = new Y.Map<unknown>();
    replyMap.set(FIELD_ID, reply.id);
    replyMap.set("authorId", reply.authorId);
    replyMap.set("authorName", reply.authorName);
    replyMap.set("authorColor", reply.authorColor);
    replyMap.set("body", reply.body);
    replyMap.set("createdAt", reply.createdAt);
    repliesArray.push([replyMap]);
  });
}

export class BrowserCollaborationAdapter implements CollaborationAdapter {
  private channels = new Map<string, BroadcastChannel>();

  subscribe(roomId: string, handler: (message: CollaborationEnvelope) => void): () => void {
    const channel = this.ensureChannel(roomId);
    const listener = (event: MessageEvent<CollaborationEnvelope>) => {
      handler(event.data);
    };
    channel.addEventListener("message", listener);
    return () => {
      channel.removeEventListener("message", listener);
    };
  }

  publish(message: CollaborationEnvelope): void {
    this.ensureChannel(message.roomId).postMessage(message);
  }

  readSnapshots(roomId: string): Record<string, string> {
    const prefix = `${roomId}:client:`;
    const snapshots: Record<string, string> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(prefix)) {
        continue;
      }
      const clientId = key.slice(prefix.length);
      const payload = localStorage.getItem(key);
      if (payload) {
        snapshots[clientId] = payload;
      }
    }
    return snapshots;
  }

  writeSnapshot(roomId: string, clientId: string, snapshot: string): void {
    try {
      localStorage.setItem(`${roomId}:client:${clientId}`, snapshot);
    } catch {
      // Storage quota exceeded — purge old collaboration snapshots and retry once
      try {
        const prefix = `${roomId}:client:`;
        Object.keys(localStorage)
          .filter((k) => k.startsWith(prefix) && !k.endsWith(clientId))
          .forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(`${roomId}:client:${clientId}`, snapshot);
      } catch {
        // Still full — skip persistence silently; in-memory state is intact
      }
    }
  }

  deleteSnapshot(roomId: string, clientId: string): void {
    localStorage.removeItem(`${roomId}:client:${clientId}`);
  }

  now(): number {
    return Date.now();
  }

  private ensureChannel(roomId: string): BroadcastChannel {
    const existing = this.channels.get(roomId);
    if (existing) {
      return existing;
    }
    const channel = new BroadcastChannel(`synapse-collaboration:${roomId}`);
    this.channels.set(roomId, channel);
    return channel;
  }
}

export function createMemoryCollaborationAdapter(): CollaborationAdapter {
  const subscribers = new Map<string, Set<(message: CollaborationEnvelope) => void>>();
  const snapshots = new Map<string, Map<string, string>>();
  return {
    subscribe(roomId, handler) {
      const roomSubscribers = subscribers.get(roomId) ?? new Set<(message: CollaborationEnvelope) => void>();
      roomSubscribers.add(handler);
      subscribers.set(roomId, roomSubscribers);
      return () => {
        roomSubscribers.delete(handler);
      };
    },
    publish(message) {
      subscribers.get(message.roomId)?.forEach((handler) => {
        handler(message);
      });
    },
    readSnapshots(roomId) {
      return Object.fromEntries((snapshots.get(roomId) ?? new Map()).entries());
    },
    writeSnapshot(roomId, clientId, snapshot) {
      const roomSnapshots = snapshots.get(roomId) ?? new Map<string, string>();
      roomSnapshots.set(clientId, snapshot);
      snapshots.set(roomId, roomSnapshots);
    },
    deleteSnapshot(roomId, clientId) {
      snapshots.get(roomId)?.delete(clientId);
    },
    now() {
      return Date.now();
    },
  };
}

export class CollaborationEngine {
  private doc = new Y.Doc();

  private projectRoot = this.doc.getMap<unknown>("projectRegistry");

  private noteRoot = this.doc.getMap<unknown>("notes");

  private dashboardRoot = this.doc.getMap<unknown>("dashboards");

  private threadRoot = this.doc.getMap<unknown>("threads");

  private listeners = new Set<(snapshot: CollaborationEngineSnapshot) => void>();

  private remotePresence = new Map<string, CollaborationPresenceState>();

  private heartbeatId: ReturnType<typeof setInterval> | null = null;

  private cleanupId: ReturnType<typeof setInterval> | null = null;

  private connectionState: CollaborationConnectionState = "connected";

  private pendingChanges = 0;

  private lastSyncedAt?: number;

  private destroyed = false;

  private readonly localPresence: CollaborationPresenceState;

  private readonly unsubscribeTransport: () => void;

  private readonly roomId: string;

  private readonly clientId: string;

  private readonly currentUser: CollaborationUser;

  private readonly adapter: CollaborationAdapter;

  constructor(
    roomId: string,
    clientId: string,
    currentUser: CollaborationUser,
    adapter: CollaborationAdapter,
    seed: CollaborationRoomSeed,
  ) {
    this.roomId = roomId;
    this.clientId = clientId;
    this.currentUser = currentUser;
    this.adapter = adapter;
    this.localPresence = {
      clientId,
      userId: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      ...(currentUser.avatar === undefined ? {} : { avatar: currentUser.avatar }),
      connectionState: "connected",
      lastActiveAt: adapter.now(),
      isSelf: true,
    };

    this.doc.on("update", (update, origin) => {
      if (origin === BOOTSTRAP_ORIGIN) {
        this.persistSnapshot();
        this.notify();
        return;
      }

      if (origin === LOCAL_ORIGIN) {
        this.persistSnapshot();
        if (this.connectionState === "paused") {
          this.pendingChanges += 1;
        } else {
          this.publishFullState(update);
          this.pendingChanges = 0;
          this.lastSyncedAt = this.adapter.now();
        }
        this.notify();
        return;
      }

      if (origin === REMOTE_ORIGIN || origin === RESYNC_ORIGIN) {
        this.persistSnapshot();
        this.lastSyncedAt = this.adapter.now();
        if (origin === RESYNC_ORIGIN) {
          this.pendingChanges = 0;
        }
        this.notify();
      }
    });

    this.unsubscribeTransport = this.adapter.subscribe(this.roomId, (message) => {
      this.handleEnvelope(message);
    });

    const snapshots = this.adapter.readSnapshots(this.roomId);
    if (Object.keys(snapshots).length === 0) {
      this.seedDocument(seed);
    } else {
      this.applySnapshots(snapshots, RESYNC_ORIGIN);
    }

    this.persistSnapshot();
    this.publishPresence();
    this.startTimers();
    this.notify();
  }

  private getProjectItems(): Y.Map<unknown> {
    return getOrCreateMap(this.projectRoot, "projects");
  }

  private getProjectOrder(): Y.Array<unknown> {
    return getOrCreateArray(this.projectRoot, "projectOrder");
  }

  private getProjectMeta(): Y.Map<unknown> {
    return getOrCreateMap(this.projectRoot, "meta");
  }

  private getDashboardItems(): Y.Map<unknown> {
    return getOrCreateMap(this.dashboardRoot, "items");
  }

  private getDashboardOrder(): Y.Array<unknown> {
    return getOrCreateArray(this.dashboardRoot, "order");
  }

  private getDashboardMeta(): Y.Map<unknown> {
    return getOrCreateMap(this.dashboardRoot, "meta");
  }

  getSnapshot(): CollaborationEngineSnapshot {
    return {
      currentUser: this.currentUser,
      projectRegistry: this.buildProjectRegistrySnapshot(),
      notes: this.buildNotesSnapshot(),
      dashboardLibrary: this.buildDashboardSnapshot(),
      threadsByScope: this.buildThreadsSnapshot(),
      participants: this.buildPresenceSnapshot(),
      connection: {
        state: this.connectionState,
        pendingChanges: this.pendingChanges,
        ...(this.lastSyncedAt === undefined ? {} : { lastSyncedAt: this.lastSyncedAt }),
      },
    };
  }

  subscribe(listener: (snapshot: CollaborationEngineSnapshot) => void): () => void {
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
    this.adapter.publish({ type: "presence-leave", roomId: this.roomId, clientId: this.clientId });
    this.unsubscribeTransport();
    if (this.heartbeatId) {
      clearInterval(this.heartbeatId);
    }
    if (this.cleanupId) {
      clearInterval(this.cleanupId);
    }
    this.doc.destroy();
  }

  pauseSync(): void {
    this.connectionState = "paused";
    this.localPresence.connectionState = "paused";
    this.localPresence.lastActiveAt = this.adapter.now();
    this.adapter.publish({
      type: "presence",
      roomId: this.roomId,
      clientId: this.clientId,
      presence: {
        ...this.localPresence,
        connectionState: "paused",
        isSelf: false,
      },
    });
    this.notify();
  }

  resumeSync(): void {
    this.connectionState = "reconnecting";
    this.localPresence.connectionState = "reconnecting";
    this.notify();
    this.applySnapshots(this.adapter.readSnapshots(this.roomId), RESYNC_ORIGIN);
    this.connectionState = "connected";
    this.localPresence.connectionState = "connected";
    this.pendingChanges = 0;
    this.lastSyncedAt = this.adapter.now();
    this.publishFullState();
    this.publishEnvelope({ type: "resync-request", roomId: this.roomId, clientId: this.clientId });
    this.publishPresence();
    this.notify();
  }

  updatePresence(patch: Partial<CollaborationPresenceState>): void {
    Object.assign(this.localPresence, patch, {
      clientId: this.clientId,
      userId: this.currentUser.id,
      name: this.currentUser.name,
      color: this.currentUser.color,
      avatar: this.currentUser.avatar,
      lastActiveAt: this.adapter.now(),
      connectionState: this.connectionState,
      isSelf: true,
    });
    this.publishPresence();
    this.notify();
  }

  addProject(project: ProjectRecord): void {
    this.doc.transact(() => {
      const projectItems = this.getProjectItems();
      const projectOrder = this.getProjectOrder();
      const projectMeta = this.getProjectMeta();
      const projectMap = new Y.Map<unknown>();
      projectItems.set(project.id, projectMap);
      applyProjectSnapshot(projectMap, project);
      projectOrder.insert(0, [project.id]);
      projectMeta.set("selectedProjectId", project.id);
    }, LOCAL_ORIGIN);
  }

  updateProject(projectId: string, patch: Partial<ProjectRecord>): void {
    const existing = this.getProjectItems().get(projectId);
    if (!isYMap(existing)) {
      return;
    }
    this.doc.transact(() => {
      if (patch.name !== undefined) {
        replaceYText(getOrCreateText(existing, "name", patch.name), patch.name);
      }
      if (patch.description !== undefined) {
        replaceYText(getOrCreateText(existing, "description", patch.description), patch.description);
      }
      if (patch.scale !== undefined) {
        existing.set("scale", patch.scale);
      }
      if (patch.area_km2 !== undefined) {
        existing.set("area_km2", patch.area_km2);
      }
      if (patch.bbox !== undefined) {
        existing.set("bbox", JSON.stringify(patch.bbox));
      }
      if (patch.crs !== undefined) {
        existing.set("crs", patch.crs);
      }
      if (patch.tags !== undefined) {
        existing.set("tags", JSON.stringify(patch.tags));
      }
      if (patch.priority !== undefined) {
        existing.set("priority", patch.priority);
      }
      if (patch.climateVulnerability !== undefined) {
        existing.set("climateVulnerability", patch.climateVulnerability);
      }
      if (patch.dataCompleteness !== undefined) {
        existing.set("dataCompleteness", patch.dataCompleteness);
      }
      if (patch.sessionsCount !== undefined) {
        existing.set("sessionsCount", patch.sessionsCount);
      }
      if (patch.lastSessionDate !== undefined) {
        existing.set("lastSessionDate", patch.lastSessionDate);
      }
      if (patch.indicators !== undefined) {
        existing.set("indicators", JSON.stringify(patch.indicators));
      }
      if (patch.reportSnapshots !== undefined) {
        existing.set("reportSnapshots", JSON.stringify(normalizeProjectSnapshots(patch.reportSnapshots)));
      }
      if (patch.recentChanges !== undefined) {
        existing.set("recentChanges", JSON.stringify(normalizeProjectRecentChanges(patch.recentChanges)));
      }
      existing.set("updatedAt", new Date(this.adapter.now()).toISOString());
    }, LOCAL_ORIGIN);
  }

  deleteProject(projectId: string): void {
    this.doc.transact(() => {
      const projectItems = this.getProjectItems();
      const projectOrder = this.getProjectOrder();
      const projectMeta = this.getProjectMeta();
      projectItems.delete(projectId);
      const current = projectOrder.toArray();
      const index = current.findIndex((entry) => entry === projectId);
      if (index >= 0) {
        projectOrder.delete(index, 1);
      }
      const selectedProjectId = projectMeta.get("selectedProjectId");
      if (selectedProjectId === projectId) {
        const nextSelected = projectOrder.get(0);
        if (typeof nextSelected === "string") {
          projectMeta.set("selectedProjectId", nextSelected);
        } else {
          projectMeta.delete("selectedProjectId");
        }
      }
    }, LOCAL_ORIGIN);
  }

  selectProject(projectId?: string): void {
    this.doc.transact(() => {
      const projectMeta = this.getProjectMeta();
      if (projectId === undefined) {
        projectMeta.delete("selectedProjectId");
      } else {
        projectMeta.set("selectedProjectId", projectId);
      }
      projectMeta.delete("selectedSessionId");
    }, LOCAL_ORIGIN);
  }

  selectSession(sessionId?: string): void {
    this.doc.transact(() => {
      const projectMeta = this.getProjectMeta();
      if (sessionId === undefined) {
        projectMeta.delete("selectedSessionId");
      } else {
        projectMeta.set("selectedSessionId", sessionId);
      }
    }, LOCAL_ORIGIN);
  }

  setProjectFilter(patch: Partial<ProjectRegistryState["filter"]>): void {
    const projectMeta = this.getProjectMeta();
    const current = parseJsonValue<ProjectRegistryState["filter"]>(projectMeta.get("filter"), {});
    this.doc.transact(() => {
      projectMeta.set("filter", JSON.stringify({ ...current, ...patch }));
    }, LOCAL_ORIGIN);
  }

  getNoteDocument(projectId: string): CollaborationNoteDocument {
    return this.buildNotesSnapshot()[projectId] ?? { slots: {}, updatedAt: 0 };
  }

  setNoteSlot(projectId: string, slotId: string, value: string): void {
    const noteMap = this.getOrCreateProjectNoteMap(projectId);
    this.doc.transact(() => {
      replaceYText(getOrCreateText(noteMap, slotId, value), value);
      noteMap.set("updatedAt", this.adapter.now());
    }, LOCAL_ORIGIN);
  }

  upsertDashboardDocument(document: DashboardDocument, makeActive = true): void {
    this.doc.transact(() => {
      const dashboardItems = this.getDashboardItems();
      const dashboardOrder = this.getDashboardOrder();
      const dashboardMeta = this.getDashboardMeta();
      const existing = dashboardItems.get(document.id);
      const dashboardMap = isYMap(existing) ? existing : new Y.Map<unknown>();
      if (!isYMap(existing)) {
        dashboardItems.set(document.id, dashboardMap);
      }
      applyDashboardSnapshot(dashboardMap, document);
      reconcileOrderArray(dashboardOrder, [document.id, ...dashboardOrder.toArray().filter((entry): entry is string => typeof entry === "string" && entry !== document.id)]);
      if (makeActive) {
        dashboardMeta.set("activeDashboardId", document.id);
      }
    }, LOCAL_ORIGIN);
  }

  setActiveDashboardId(dashboardId: string | null): void {
    this.doc.transact(() => {
      const dashboardMeta = this.getDashboardMeta();
      if (!dashboardId) {
        dashboardMeta.delete("activeDashboardId");
      } else {
        dashboardMeta.set("activeDashboardId", dashboardId);
      }
    }, LOCAL_ORIGIN);
  }

  updateDashboardDocument(dashboardId: string, updater: (dashboard: DashboardDocument) => DashboardDocument): void {
    const existing = this.getDashboardItems().get(dashboardId);
    if (!isYMap(existing)) {
      return;
    }
    const current = dashboardDocumentFromMap(existing);
    const next = updater(current);
    this.doc.transact(() => {
      applyDashboardSnapshot(existing, next);
    }, LOCAL_ORIGIN);
  }

  addCommentThread(scopeId: string, anchorLabel: string, body: string): void {
    const threadArray = this.getOrCreateThreadArray(scopeId);
    const timestamp = this.adapter.now();
    const thread: CollaborationCommentThread = {
      id: crypto.randomUUID(),
      scopeId,
      anchorLabel,
      body,
      authorId: this.currentUser.id,
      authorName: this.currentUser.name,
      authorColor: this.currentUser.color,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "open",
      replies: [],
    };
    this.doc.transact(() => {
      const threadMap = new Y.Map<unknown>();
      threadArray.insert(threadArray.length, [threadMap]);
      applyThreadSnapshot(threadMap, thread);
    }, LOCAL_ORIGIN);
  }

  replyToThread(scopeId: string, threadId: string, body: string): void {
    const thread = this.findThread(scopeId, threadId);
    if (!thread) {
      return;
    }
    const repliesArray = getOrCreateArray(thread, "replies");
    const reply: CollaborationReply = {
      id: crypto.randomUUID(),
      authorId: this.currentUser.id,
      authorName: this.currentUser.name,
      authorColor: this.currentUser.color,
      body,
      createdAt: this.adapter.now(),
    };
    this.doc.transact(() => {
      const replyMap = new Y.Map<unknown>();
      replyMap.set(FIELD_ID, reply.id);
      replyMap.set("authorId", reply.authorId);
      replyMap.set("authorName", reply.authorName);
      replyMap.set("authorColor", reply.authorColor);
      replyMap.set("body", reply.body);
      replyMap.set("createdAt", reply.createdAt);
      repliesArray.push([replyMap]);
      thread.set("updatedAt", this.adapter.now());
    }, LOCAL_ORIGIN);
  }

  setThreadResolved(scopeId: string, threadId: string, resolved: boolean): void {
    const thread = this.findThread(scopeId, threadId);
    if (!thread) {
      return;
    }
    this.doc.transact(() => {
      thread.set("status", resolved ? "resolved" : "open");
      if (resolved) {
        thread.set("resolvedAt", this.adapter.now());
        thread.set("resolvedBy", this.currentUser.name);
      } else {
        thread.delete("resolvedAt");
        thread.delete("resolvedBy");
      }
      thread.set("updatedAt", this.adapter.now());
    }, LOCAL_ORIGIN);
  }

  private buildProjectRegistrySnapshot(): ProjectRegistryState {
    const projectOrder = this.getProjectOrder();
    const projectItems = this.getProjectItems();
    const projectMeta = this.getProjectMeta();
    const order = projectOrder.toArray().filter((entry): entry is string => typeof entry === "string");
    const knownIds = new Set(order);
    const unorderedIds = arrayFromIterator(projectItems.keys()).filter((entry) => !knownIds.has(entry)).sort();
    const projects = [...order, ...unorderedIds]
      .map((projectId) => projectItems.get(projectId))
      .filter(isYMap)
      .map((project) => projectRecordFromMap(project));

    const selectedProjectId = optionalString(projectMeta.get("selectedProjectId"));
    const selectedSessionId = optionalString(projectMeta.get("selectedSessionId"));
    const snapshot: ProjectRegistryState = {
      projects,
      filter: parseJsonValue<ProjectRegistryState["filter"]>(projectMeta.get("filter"), {}),
      version: 1,
    };
    if (selectedProjectId !== undefined) {
      snapshot.selectedProjectId = selectedProjectId;
    }
    if (selectedSessionId !== undefined) {
      snapshot.selectedSessionId = selectedSessionId;
    }
    return snapshot;
  }

  private buildNotesSnapshot(): Record<string, CollaborationNoteDocument> {
    const notes: Record<string, CollaborationNoteDocument> = {};
    arrayFromIterator(this.noteRoot.keys()).forEach((projectId) => {
      const entry = this.noteRoot.get(projectId);
      if (!isYMap(entry)) {
        return;
      }
      const slots: Record<string, string> = {};
      arrayFromIterator(entry.keys()).forEach((slotId) => {
        if (slotId === "updatedAt") {
          return;
        }
        const value = entry.get(slotId);
        if (isYText(value)) {
          slots[slotId] = value.toString();
        }
      });
      notes[projectId] = {
        slots,
        updatedAt: Number(entry.get("updatedAt") ?? 0),
      };
    });
    return notes;
  }

  private buildDashboardSnapshot(): DashboardLibraryState {
    const dashboardOrder = this.getDashboardOrder();
    const dashboardItems = this.getDashboardItems();
    const dashboardMeta = this.getDashboardMeta();
    const order = dashboardOrder.toArray().filter((entry): entry is string => typeof entry === "string");
    const knownIds = new Set(order);
    const unorderedIds = arrayFromIterator(dashboardItems.keys()).filter((entry) => !knownIds.has(entry)).sort();
    const dashboards = [...order, ...unorderedIds]
      .map((dashboardId) => dashboardItems.get(dashboardId))
      .filter(isYMap)
      .map((dashboard) => dashboardDocumentFromMap(dashboard));

    const activeDashboardId = optionalString(dashboardMeta.get("activeDashboardId"));
    return {
      version: 1,
      dashboards,
      activeDashboardId: activeDashboardId ?? dashboards[0]?.id ?? null,
    };
  }

  private buildThreadsSnapshot(): Record<string, CollaborationCommentThread[]> {
    const byScope: Record<string, CollaborationCommentThread[]> = {};
    arrayFromIterator(this.threadRoot.keys()).forEach((scopeId) => {
      const entry = this.threadRoot.get(scopeId);
      if (!isYArray(entry)) {
        return;
      }
      byScope[scopeId] = sortByCreatedAt(entry.toArray().filter(isYMap).map((thread) => threadFromMap(thread)));
    });
    return byScope;
  }

  private buildPresenceSnapshot(): CollaborationPresenceState[] {
    const now = this.adapter.now();
    const participants = [
      { ...this.localPresence, lastActiveAt: now, connectionState: this.connectionState, isSelf: true },
      ...Array.from(this.remotePresence.values())
        .filter((presence) => now - presence.lastActiveAt <= PRESENCE_STALE_MS)
        .map((presence) => ({ ...presence, isSelf: false })),
    ];
    return participants.sort((left, right) => Number(Boolean(right.isSelf)) - Number(Boolean(left.isSelf)) || right.lastActiveAt - left.lastActiveAt);
  }

  private publishFullState(update?: Uint8Array): void {
    this.publishEnvelope({
      type: "doc-update",
      roomId: this.roomId,
      clientId: this.clientId,
      update: uint8ToBase64(update ?? Y.encodeStateAsUpdate(this.doc)),
    });
  }

  private publishPresence(): void {
    this.publishEnvelope({
      type: "presence",
      roomId: this.roomId,
      clientId: this.clientId,
      presence: {
        ...this.localPresence,
        connectionState: this.connectionState,
        lastActiveAt: this.adapter.now(),
        isSelf: false,
      },
    });
  }

  private publishEnvelope(message: CollaborationEnvelope): void {
    if (this.connectionState === "paused") {
      return;
    }
    this.adapter.publish(message);
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => {
      listener(snapshot);
    });
  }

  private seedDocument(seed: CollaborationRoomSeed): void {
    this.doc.transact(() => {
      const projectItems = this.getProjectItems();
      const projectOrder = this.getProjectOrder();
      const projectMeta = this.getProjectMeta();
      const dashboardItems = this.getDashboardItems();
      const dashboardOrder = this.getDashboardOrder();
      const dashboardMeta = this.getDashboardMeta();

      reconcileOrderArray(projectOrder, seed.projects.map((project) => project.id));
      seed.projects.forEach((project) => {
        const map = new Y.Map<unknown>();
        projectItems.set(project.id, map);
        applyProjectSnapshot(map, project);
      });
      if (seed.projects[0]) {
        projectMeta.set("selectedProjectId", seed.projects[0].id);
      }
      projectMeta.set("filter", JSON.stringify({}));
      seed.dashboards.dashboards.forEach((dashboard) => {
        const map = new Y.Map<unknown>();
        dashboardItems.set(dashboard.id, map);
        applyDashboardSnapshot(map, dashboard);
      });
      reconcileOrderArray(dashboardOrder, seed.dashboards.dashboards.map((dashboard) => dashboard.id));
      if (seed.dashboards.activeDashboardId) {
        dashboardMeta.set("activeDashboardId", seed.dashboards.activeDashboardId);
      }
      Object.entries(seed.notes ?? {}).forEach(([projectId, note]) => {
        const noteMap = new Y.Map<unknown>();
        Object.entries(note.slots).forEach(([slotId, slotValue]) => {
          noteMap.set(slotId, new Y.Text(slotValue));
        });
        noteMap.set("updatedAt", note.updatedAt);
        this.noteRoot.set(projectId, noteMap);
      });
      Object.entries(seed.threadsByScope ?? {}).forEach(([scopeId, threads]) => {
        const threadArray = new Y.Array<unknown>();
        this.threadRoot.set(scopeId, threadArray);
        threads.forEach((thread) => {
          const threadMap = new Y.Map<unknown>();
          threadArray.push([threadMap]);
          applyThreadSnapshot(threadMap, thread);
        });
      });
    }, BOOTSTRAP_ORIGIN);
  }

  private applySnapshots(snapshots: Record<string, string>, origin: symbol): void {
    Object.values(snapshots).forEach((snapshot) => {
      try {
        Y.applyUpdate(this.doc, base64ToUint8Array(snapshot), origin);
      } catch {
        // Ignore malformed snapshots and continue applying the rest.
      }
    });
  }

  private persistSnapshot(): void {
    this.adapter.writeSnapshot(this.roomId, this.clientId, uint8ToBase64(Y.encodeStateAsUpdate(this.doc)));
  }

  private handleEnvelope(message: CollaborationEnvelope): void {
    if (message.clientId === this.clientId || message.roomId !== this.roomId) {
      return;
    }
    if (this.connectionState === "paused" && message.type !== "presence-leave") {
      return;
    }
    switch (message.type) {
      case "doc-update": {
        Y.applyUpdate(this.doc, base64ToUint8Array(message.update), REMOTE_ORIGIN);
        break;
      }
      case "presence": {
        this.remotePresence.set(message.clientId, { ...message.presence, clientId: message.clientId, isSelf: false });
        this.notify();
        break;
      }
      case "presence-leave": {
        this.remotePresence.delete(message.clientId);
        this.notify();
        break;
      }
      case "resync-request": {
        this.publishFullState();
        break;
      }
      default:
        break;
    }
  }

  private startTimers(): void {
    this.heartbeatId = setInterval(() => {
      if (this.connectionState === "paused") {
        return;
      }
      this.publishPresence();
    }, HEARTBEAT_MS);

    this.cleanupId = setInterval(() => {
      const now = this.adapter.now();
      Array.from(this.remotePresence.entries()).forEach(([clientId, presence]) => {
        if (now - presence.lastActiveAt > PRESENCE_STALE_MS) {
          this.remotePresence.delete(clientId);
        }
      });
      this.notify();
    }, HEARTBEAT_MS);
  }

  private getOrCreateProjectNoteMap(projectId: string): Y.Map<unknown> {
    const existing = this.noteRoot.get(projectId);
    if (isYMap(existing)) {
      return existing;
    }
    const created = new Y.Map<unknown>();
    this.noteRoot.set(projectId, created);
    return created;
  }

  private getOrCreateThreadArray(scopeId: string): Y.Array<unknown> {
    const existing = this.threadRoot.get(scopeId);
    if (isYArray(existing)) {
      return existing;
    }
    const created = new Y.Array<unknown>();
    this.threadRoot.set(scopeId, created);
    return created;
  }

  private findThread(scopeId: string, threadId: string): Y.Map<unknown> | null {
    return this.getOrCreateThreadArray(scopeId)
      .toArray()
      .filter(isYMap)
      .find((thread) => thread.get(FIELD_ID) === threadId) ?? null;
  }
}