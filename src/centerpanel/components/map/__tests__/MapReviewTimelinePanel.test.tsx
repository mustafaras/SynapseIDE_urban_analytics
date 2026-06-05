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
import {
  appendMapReviewEvent,
  createMapReviewSession,
  type MapReviewSession,
} from "@/services/map/MapReviewSessionService";

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

function makeAuditSession(): MapReviewSession {
  let session = createMapReviewSession({ id: "review-session-test", createdAt: "2026-05-30T08:55:00.000Z" });
  session = appendMapReviewEvent(session, {
    type: "layer-change",
    category: "layer-import",
    status: "recorded",
    timestamp: "2026-05-30T09:00:00.000Z",
    title: "Imported parcels",
    summary: "Layer import completed from an external source handle.",
    layerIds: ["parcels"],
    sourceIds: ["source-parcels"],
    evidenceArtifactIds: ["map-evidence-parcels"],
  });
  session = appendMapReviewEvent(session, {
    type: "action-status",
    category: "action-audit",
    status: "applied",
    timestamp: "2026-05-30T09:01:00.000Z",
    title: "Command applied: fit layer",
    summary: "The fit-to-layer command was applied and remains reversible from the timeline.",
    actionIds: ["cmd-fit-layer"],
    details: { commandId: "map.fit-layer" },
    undo: { available: true, actionLabel: "Undo fit layer" },
  });
  session = appendMapReviewEvent(session, {
    type: "qa-event",
    category: "qa-run",
    status: "acknowledged",
    timestamp: "2026-05-30T09:02:00.000Z",
    title: "QA caveats acknowledged",
    summary: "One CRS caveat was acknowledged.",
    qaIssueIds: ["qa:parcels:crs"],
  });
  session = appendMapReviewEvent(session, {
    type: "analysis-dispatch",
    category: "workflow-apply",
    status: "applied",
    timestamp: "2026-05-30T09:03:00.000Z",
    title: "Workflow output applied",
    summary: "A suitability workflow output layer was applied.",
    layerIds: ["parcels", "suitability-output"],
    runIds: ["run-suitability"],
  });
  session = appendMapReviewEvent(session, {
    type: "report-handoff",
    category: "export-report-handoff",
    status: "applied",
    timestamp: "2026-05-30T09:04:00.000Z",
    title: "Report handoff inserted",
    summary: "A report handoff was inserted with evidence references.",
    reportItemIds: ["report-handoff-1"],
    evidenceArtifactIds: ["map-evidence-parcels"],
  });
  session = appendMapReviewEvent(session, {
    type: "action-status",
    category: "export-report-handoff",
    status: "applied",
    timestamp: "2026-05-30T09:05:00.000Z",
    title: "Map export: GEOJSON",
    summary: "Exported GEOJSON with source, layer, and evidence IDs preserved.",
    details: { format: "geojson" },
  });
  session = appendMapReviewEvent(session, {
    type: "action-status",
    category: "action-audit",
    status: "proposed",
    timestamp: "2026-05-30T09:06:00.000Z",
    title: "AI-proposed action: classify parcels",
    summary: "AI-proposed action passed guardrails and requires confirmation.",
    actionIds: ["proposal-classify"],
    details: { proposalId: "proposal-classify", aiGuardrail: { status: "allowed" } },
  });
  session = appendMapReviewEvent(session, {
    type: "action-status",
    category: "export-report-handoff",
    status: "applied",
    timestamp: "2026-05-30T09:07:00.000Z",
    title: "Map export: PACKAGE",
    summary: "Offline package exported with bounded source sidecars.",
    details: { format: "package" },
  });
  return session;
}

function renderPanel(
  snapshot: MapReviewCollaborationSnapshot,
  session: MapReviewSession = createMapReviewSession({ id: snapshot.sessionId, createdAt: "2026-05-30T08:55:00.000Z" }),
): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);

  act(() => {
    root!.render(
      <MapReviewTimelinePanel
        visible
        presentation="embedded"
        session={session}
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

function clickTab(tab: "timeline" | "comments" | "collaboration" | "audit-export"): void {
  const button = host!.querySelector<HTMLButtonElement>(`[data-review-tab="${tab}"]`);
  expect(button).not.toBeNull();
  act(() => {
    button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapReviewTimelinePanel collaboration surface", () => {
  it("renders the Review workspace tabs", () => {
    renderPanel(makeSnapshot("local-only"), makeAuditSession());

    expect(host!.textContent).toContain("Review workspace");
    expect(host!.querySelector('[data-review-tab="timeline"]')?.textContent).toContain("Timeline");
    expect(host!.querySelector('[data-review-tab="comments"]')?.textContent).toContain("Comments");
    expect(host!.querySelector('[data-review-tab="collaboration"]')?.textContent).toContain("Collaboration");
    expect(host!.querySelector('[data-review-tab="audit-export"]')?.textContent).toContain("Audit Export");
  });

  it.each([
    ["connected", "Live sync"],
    ["local-only", "Local-only"],
    ["offline", "Offline"],
  ] as const)("renders distinct %s collaboration status", (state, label) => {
    renderPanel(makeSnapshot(state));
    clickTab("collaboration");

    const surface = host!.querySelector('[data-testid="map-review-collaboration"]');
    expect(surface?.getAttribute("data-collaboration-state")).toBe(state);
    expect(host!.querySelector('[data-testid="map-review-collaboration-state"]')?.textContent).toContain(label);
  });

  it("shows comments by target ID and evidence ID", () => {
    renderPanel(makeSnapshot("connected"));
    clickTab("comments");

    expect(host!.textContent).toContain("Shade impact / layer:shade-layer");
    expect(host!.textContent).toContain("Comment comment-layer-review");
    expect(host!.textContent).toContain("Annotation annotation-evidence-note");
    expect(host!.textContent).toContain("Evidence map-evidence-shadow");
  });

  it("shows presence, annotation links, and explicit payload limits", () => {
    renderPanel(makeSnapshot("connected"));
    clickTab("collaboration");

    expect(host!.textContent).toContain("Planner A (you)");
    expect(host!.textContent).toContain("Annotation annotation-evidence-note");
    expect(host!.textContent).toContain("Comment cap 400");
    expect(host!.textContent).toContain("Source bytes, raw datasets, raster cells, layer geometry, and worker tables are excluded");
  });

  it("shows audit lanes and export bounds without adding payload data", () => {
    renderPanel(makeSnapshot("offline"), makeAuditSession());
    clickTab("audit-export");

    expect(host!.querySelector('[data-testid="map-review-audit-export"]')).not.toBeNull();
    expect(host!.textContent).toContain("Imports");
    expect(host!.textContent).toContain("Commands");
    expect(host!.textContent).toContain("QA Events");
    expect(host!.textContent).toContain("Workflow Outputs");
    expect(host!.textContent).toContain("Report Handoffs");
    expect(host!.textContent).toContain("Exports");
    expect(host!.textContent).toContain("AI-Proposed Actions");
    expect(host!.textContent).toContain("Package Exports");
    expect(host!.textContent).toContain("comments 1 of 400");
    expect(host!.textContent).toContain("It does not export raw source bytes, heavy geometry, raster cells, 3D payloads, worker tables, or collaboration transport documents.");
  });

  it("does not render raw geometry or source bytes from unexpected snapshot fields", () => {
    const snapshot = {
      ...makeSnapshot("connected"),
      sourceData: { type: "FeatureCollection", features: [{ geometry: { type: "Point", coordinates: [29.04, 41.03] } }] },
      geometry: { type: "Point", coordinates: [29.04, 41.03] },
    } as unknown as MapReviewCollaborationSnapshot;

    renderPanel(snapshot);
    clickTab("comments");
    clickTab("collaboration");
    clickTab("audit-export");

    expect(host!.textContent).not.toContain("FeatureCollection");
    expect(host!.textContent).not.toContain("sourceData");
    expect(host!.textContent).not.toContain("29.04");
    expect(host!.textContent).not.toContain("41.03");
  });
});