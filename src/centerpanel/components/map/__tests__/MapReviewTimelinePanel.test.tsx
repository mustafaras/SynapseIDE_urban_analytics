// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapReviewTimelinePanel } from "../MapReviewTimelinePanel";
import {
  getMapReviewCollaborationConnectionBadge,
  MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
  type MapReviewCollaborationConnectionState,
  type MapReviewCollaborationSnapshot,
} from "@/services/map/collaboration/MapReviewCollaborationService";
import { createMapReviewSession } from "@/services/map/MapReviewSessionService";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function makeSnapshot(state: MapReviewCollaborationConnectionState): MapReviewCollaborationSnapshot {
  return {
    schemaVersion: MAP_REVIEW_COLLABORATION_SCHEMA_VERSION,
    sessionId: "review-session-test",
    connectionState: state,
    badge: getMapReviewCollaborationConnectionBadge(state),
    presence: [{
      clientId: "client-a",
      userId: "planner-a",
      name: "Planner A",
      color: "#3794ff",
      connectionState: state,
      lastActiveAt: "2026-05-30T09:00:00.000Z",
      isSelf: true,
      activeTarget: { kind: "layer", id: "shade-layer", label: "Shade impact" },
    }],
    comments: [{
      id: "comment-layer-review",
      target: { kind: "layer", id: "shade-layer", label: "Shade impact" },
      body: "Please compare this against the AOI before handoff.",
      author: { userId: "planner-a", name: "Planner A" },
      status: "open",
      createdAt: "2026-05-30T09:02:00.000Z",
      updatedAt: "2026-05-30T09:02:00.000Z",
      layerIds: ["shade-layer"],
      evidenceArtifactIds: ["map-evidence-shadow"],
      annotationIds: ["annotation-evidence-note"],
    }],
    annotations: [{
      id: "annotation-evidence-note",
      coordinate: [29.04, 41.03],
      text: "Evidence needs source caveat before publish.",
      style: {
        fontSize: 16,
        color: "#f59e0b",
        bold: true,
        italic: false,
        rotation: 0,
        hasBackground: true,
        leaderLine: false,
      },
      author: { userId: "planner-a", name: "Planner A" },
      createdAt: "2026-05-30T09:01:00.000Z",
      updatedAt: "2026-05-30T09:01:00.000Z",
      layerIds: ["shade-layer"],
      evidenceArtifactIds: ["map-evidence-shadow"],
      target: { kind: "evidence", id: "map-evidence-shadow", label: "Shadow evidence" },
    }],
  };
}

function renderPanel(snapshot: MapReviewCollaborationSnapshot): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);

  act(() => {
    root!.render(
      <MapReviewTimelinePanel
        visible
        presentation="embedded"
        session={createMapReviewSession({ id: snapshot.sessionId, createdAt: "2026-05-30T08:55:00.000Z" })}
        collaborationSnapshot={snapshot}
        overlayLayers={[]}
        qaState={null}
        onClose={() => undefined}
        onRecordEvent={() => undefined}
        onUpdateEventStatus={() => undefined}
        onClearSession={() => undefined}
        onAnnounce={vi.fn()}
      />,
    );
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapReviewTimelinePanel collaboration surface", () => {
  it.each([
    ["connected", "Live sync"],
    ["local-only", "Local-only"],
    ["offline", "Offline"],
  ] as const)("renders distinct %s collaboration status", (state, label) => {
    renderPanel(makeSnapshot(state));

    const surface = host!.querySelector('[data-testid="map-review-collaboration"]');
    expect(surface?.getAttribute("data-collaboration-state")).toBe(state);
    expect(host!.querySelector('[data-testid="map-review-collaboration-state"]')?.textContent).toContain(label);
  });

  it("shows presence, comments by target ID, and annotation/evidence links", () => {
    renderPanel(makeSnapshot("connected"));

    expect(host!.textContent).toContain("Planner A (you)");
    expect(host!.textContent).toContain("Shade impact / layer:shade-layer");
    expect(host!.textContent).toContain("Comment comment-layer-review");
    expect(host!.textContent).toContain("Annotation annotation-evidence-note");
    expect(host!.textContent).toContain("Evidence map-evidence-shadow");
  });

  it("does not render raw geometry or source bytes from unexpected snapshot fields", () => {
    const snapshot = {
      ...makeSnapshot("connected"),
      sourceData: { type: "FeatureCollection", features: [{ geometry: { type: "Point", coordinates: [29.04, 41.03] } }] },
      geometry: { type: "Point", coordinates: [29.04, 41.03] },
    } as unknown as MapReviewCollaborationSnapshot;

    renderPanel(snapshot);

    expect(host!.textContent).not.toContain("FeatureCollection");
    expect(host!.textContent).not.toContain("sourceData");
    expect(host!.textContent).not.toContain("29.04");
    expect(host!.textContent).not.toContain("41.03");
  });
});