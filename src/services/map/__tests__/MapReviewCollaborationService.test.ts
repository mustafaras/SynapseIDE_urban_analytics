import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  appendMapReviewCollaborationSnapshotToSession,
  connectMapReviewCollaborationSessions,
  createMapReviewCollaborationSession,
  getMapReviewCollaborationConnectionBadge,
  toMapAnnotation,
} from "../collaboration/MapReviewCollaborationService";
import { createMapReviewSession } from "../MapReviewSessionService";

const reviewerA = { userId: "planner-a", name: "Planner A", color: "#3794ff" };
const reviewerB = { userId: "planner-b", name: "Planner B", color: "#22C55E" };

describe("MapReviewCollaborationService", () => {
  it("syncs lightweight annotations across two Yjs docs", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const clientA = createMapReviewCollaborationSession({
      sessionId: "review-session-1",
      clientId: "client-a",
      user: reviewerA,
      doc: docA,
      now: () => Date.parse("2026-05-30T09:00:00.000Z"),
    });
    const clientB = createMapReviewCollaborationSession({
      sessionId: "review-session-1",
      clientId: "client-b",
      user: reviewerB,
      doc: docB,
      now: () => Date.parse("2026-05-30T09:00:01.000Z"),
    });

    const disconnect = connectMapReviewCollaborationSessions(clientA, clientB);
    const annotation = clientA.upsertAnnotation({
      id: "annotation-shade-note",
      coordinate: [29.02, 41.01],
      text: "Check afternoon shade before evidence approval.",
      target: { kind: "layer", id: "shade-layer", label: "Shade impact" },
      layerIds: ["shade-layer"],
      createdAt: "2026-05-30T09:00:00.000Z",
      updatedAt: "2026-05-30T09:00:00.000Z",
    });

    const clientBSnapshot = clientB.getSnapshot();
    expect(clientBSnapshot.badge.label).toBe("connected");
    expect(clientBSnapshot.annotations).toHaveLength(1);
    expect(clientBSnapshot.annotations[0]).toMatchObject({
      id: "annotation-shade-note",
      coordinate: [29.02, 41.01],
      text: "Check afternoon shade before evidence approval.",
      layerIds: ["shade-layer"],
    });
    expect(toMapAnnotation(annotation).geometry).toEqual({ type: "Point", coordinates: [29.02, 41.01] });
    expect(JSON.stringify(clientBSnapshot)).not.toContain("FeatureCollection");
    expect(JSON.stringify(clientBSnapshot)).not.toContain("sourceData");

    disconnect();
  });

  it("syncs presence updates and marks local-only after disconnect", () => {
    const clientA = createMapReviewCollaborationSession({
      sessionId: "review-session-2",
      clientId: "client-a",
      user: reviewerA,
      doc: new Y.Doc(),
      now: () => Date.parse("2026-05-30T10:00:00.000Z"),
    });
    const clientB = createMapReviewCollaborationSession({
      sessionId: "review-session-2",
      clientId: "client-b",
      user: reviewerB,
      doc: new Y.Doc(),
      now: () => Date.parse("2026-05-30T10:00:02.000Z"),
    });

    const disconnect = connectMapReviewCollaborationSessions(clientA, clientB);
    clientB.updatePresence({ activeTarget: { kind: "evidence", id: "evidence-shadow", label: "Shadow evidence" } });

    const clientAPresence = clientA.getSnapshot().presence;
    expect(clientAPresence).toHaveLength(2);
    expect(clientAPresence.find((presence) => presence.clientId === "client-b")).toMatchObject({
      name: "Planner B",
      connectionState: "connected",
      activeTarget: { kind: "evidence", id: "evidence-shadow", label: "Shadow evidence" },
    });

    disconnect();
    expect(clientA.getSnapshot().badge).toMatchObject({ label: "local-only", state: "local-only", tone: "caveat" });

    clientA.upsertAnnotation({
      id: "annotation-local-only",
      coordinate: [29.03, 41.02],
      text: "This stays on the local client after disconnect.",
      createdAt: "2026-05-30T10:01:00.000Z",
      updatedAt: "2026-05-30T10:01:00.000Z",
    });

    expect(clientB.getSnapshot().annotations.some((annotation) => annotation.id === "annotation-local-only")).toBe(false);
  });

  it("keeps offline state truthful", () => {
    const client = createMapReviewCollaborationSession({
      sessionId: "review-session-3",
      clientId: "client-a",
      user: reviewerA,
      doc: new Y.Doc(),
    });

    expect(client.getSnapshot().badge.label).toBe("local-only");
    client.setConnectionState("offline");
    expect(client.getSnapshot().badge).toEqual(getMapReviewCollaborationConnectionBadge("offline"));
    expect(client.getSnapshot().badge.label).not.toBe("connected");
  });

  it("persists synced annotations and review comments through the review service", () => {
    const clientA = createMapReviewCollaborationSession({
      sessionId: "review-session-4",
      clientId: "client-a",
      user: reviewerA,
      doc: new Y.Doc(),
      now: () => Date.parse("2026-05-30T11:00:00.000Z"),
    });
    const clientB = createMapReviewCollaborationSession({
      sessionId: "review-session-4",
      clientId: "client-b",
      user: reviewerB,
      doc: new Y.Doc(),
      now: () => Date.parse("2026-05-30T11:00:03.000Z"),
    });
    const disconnect = connectMapReviewCollaborationSessions(clientA, clientB);

    clientA.upsertAnnotation({
      id: "annotation-evidence-note",
      coordinate: [29.04, 41.03],
      text: "Evidence needs source caveat before publish.",
      target: { kind: "evidence", id: "map-evidence-shadow", label: "Shadow coverage evidence" },
      createdAt: "2026-05-30T11:00:00.000Z",
      updatedAt: "2026-05-30T11:00:00.000Z",
    });
    clientB.addComment({
      id: "comment-layer-review",
      target: { kind: "layer", id: "shade-layer", label: "Shade impact" },
      body: "Please compare this against the AOI before handoff.",
      annotationIds: ["annotation-evidence-note"],
      createdAt: "2026-05-30T11:00:03.000Z",
      updatedAt: "2026-05-30T11:00:03.000Z",
    });

    const persisted = appendMapReviewCollaborationSnapshotToSession(
      createMapReviewSession({ id: "review-session-4", createdAt: "2026-05-30T10:59:00.000Z" }),
      clientA.getSnapshot(),
    );
    const persistedAgain = appendMapReviewCollaborationSnapshotToSession(persisted, clientA.getSnapshot());

    expect(persisted.events.filter((event) => event.category === "annotation-bookmark")).toHaveLength(2);
    expect(persistedAgain.events).toHaveLength(persisted.events.length);
    expect(persisted.metadata.evidenceArtifactIds).toContain("map-evidence-shadow");
    expect(persisted.events.find((event) => event.title.includes("Review comment"))?.layerIds).toEqual(["shade-layer"]);
    expect(JSON.stringify(persisted)).not.toContain("FeatureCollection");

    disconnect();
  });
});
