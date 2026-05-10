import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  appendMapReviewEvent,
  buildLayerRegistryReviewEvent,
  buildMapReviewContextSnapshot,
  createMapReviewSession,
  exportMapReviewSessionJson,
  exportMapReviewSessionMarkdown,
  filterMapReviewTimelineEvents,
} from "../MapReviewSessionService";

const fixedCreatedAt = "2026-05-02T10:00:00.000Z";

function makeLayer(id: string, visible = true): OverlayLayerConfig {
  return {
    id,
    name: id === "parcels" ? "Policy parcels" : "Transit stops",
    type: "geojson",
    visible,
    opacity: 0.82,
    sourceKind: "imported",
    qaStatus: "passed",
    queryable: true,
    group: "data",
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: `${id}-1`,
          properties: { score: 12 },
          geometry: { type: "Point", coordinates: [29, 41] },
        },
      ],
    },
    metadata: {
      featureCount: 1,
      geometryType: "Point",
      fields: ["score"],
      datasetContext: {
        crs: "EPSG:4326",
        source: "Test fixture",
      },
    },
  };
}

function makeSnapshot() {
  return buildMapReviewContextSnapshot({
    overlayLayers: [makeLayer("parcels"), makeLayer("stops", false)],
    viewport: {
      center: [29, 41],
      zoom: 12,
      bearing: 0,
      pitch: 15,
    },
    currentMapBounds: [28.9, 40.9, 29.1, 41.1],
    selectedFeatureIds: { parcels: ["parcels-1"] },
    activeAoiId: "aoi-1",
    activeAnalysisResultLayerIds: ["hotspot-result"],
    recommendationCount: 3,
  });
}

describe("MapReviewSessionService", () => {
  it("creates lightweight timeline events without storing raw layer datasets", () => {
    const snapshot = makeSnapshot();
    const session = createMapReviewSession({
      projectId: "project-istanbul",
      createdAt: fixedCreatedAt,
      initialSnapshot: snapshot,
    });

    expect(session.events).toHaveLength(1);
    expect(session.metadata.eventCounts.snapshot).toBe(1);
    expect(snapshot.layerSummaries[0]).toEqual({
      layerId: "parcels",
      name: "Policy parcels",
      visible: true,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      featureCount: 1,
      geometryType: "Point",
    });
    expect(JSON.stringify(session)).not.toContain("FeatureCollection");
  });

  it("appends and filters timeline entries by event type, layer, status, date, and text", () => {
    const snapshot = makeSnapshot();
    let session = createMapReviewSession({ createdAt: fixedCreatedAt, initialSnapshot: snapshot });
    session = appendMapReviewEvent(session, {
      type: "query-run",
      status: "applied",
      timestamp: "2026-05-02T10:05:00.000Z",
      title: "Map query published: parcel buffer",
      summary: "Published parcel buffer result after analyst reviewed SQL.",
      layerIds: ["parcels", "query-result"],
      details: {
        sql: "select * from parcels",
        oversizedPreview: Array.from({ length: 40 }, (_, index) => ({ index })),
      },
    });
    session = appendMapReviewEvent(session, {
      type: "qa-event",
      status: "acknowledged",
      timestamp: "2026-05-02T10:10:00.000Z",
      title: "QA caveats acknowledged",
      summary: "Analyst acknowledged one warning.",
      layerIds: ["stops"],
      qaIssueIds: ["qa:stops:missing-crs"],
    });

    expect(filterMapReviewTimelineEvents(session, { type: "query-run" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { layerId: "stops" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { status: "applied" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { startDate: "2026-05-02T10:06:00.000Z" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { query: "reviewed sql" })).toHaveLength(1);
    expect(session.events.find((event) => event.type === "query-run")?.details.oversizedPreview).toHaveLength(24);
  });

  it("builds layer registry review events with affected layer references", () => {
    const event = buildLayerRegistryReviewEvent({
      operation: "toggle",
      layerId: "parcels",
      timestamp: fixedCreatedAt,
      layers: [{
        layerId: "parcels",
        name: "Policy parcels",
        layerType: "geojson",
        group: "data",
        visible: false,
        opacity: 0.82,
        sourceKind: "imported",
        qaStatus: "passed",
        queryable: true,
        featureCount: 1,
      }],
      previousLayers: [{
        layerId: "parcels",
        name: "Policy parcels",
        layerType: "geojson",
        group: "data",
        visible: true,
        opacity: 0.82,
        sourceKind: "imported",
        qaStatus: "passed",
        queryable: true,
        featureCount: 1,
      }],
    }, makeSnapshot());

    expect(event.type).toBe("layer-change");
    expect(event.layerIds).toEqual(["parcels"]);
    expect(event.title).toContain("Policy parcels");
  });

  it("exports deterministic JSON and human-readable Markdown session logs", () => {
    let session = createMapReviewSession({
      projectId: "project-istanbul",
      createdAt: fixedCreatedAt,
      initialSnapshot: makeSnapshot(),
    });
    session = appendMapReviewEvent(session, {
      type: "report-handoff",
      status: "applied",
      timestamp: "2026-05-02T10:15:00.000Z",
      title: "Report handoff inserted: Corridor evidence",
      summary: "Inserted report section with layer references and caveats.",
      layerIds: ["parcels"],
      reportItemIds: ["map-handoff-corridor", "map-handoff-corridor-section"],
    });

    const json = exportMapReviewSessionJson(session);
    const parsed = JSON.parse(json) as { events: Array<{ title: string }> };
    const markdown = exportMapReviewSessionMarkdown(session);

    expect(exportMapReviewSessionJson(session)).toBe(json);
    expect(parsed.events.map((event) => event.title)).toEqual([
      "Review session started",
      "Report handoff inserted: Corridor evidence",
    ]);
    expect(markdown).toContain("# Map review session");
    expect(markdown).toContain("Report Item IDs: map-handoff-corridor, map-handoff-corridor-section");
  });
});
