import { describe, expect, it } from "vitest";
import type { MapReproducibilityManifest, OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  appendMapReviewEvent,
  buildAnalysisDispatchReviewEvent,
  buildCrsCorrectionReviewEvent,
  buildLayerRegistryReviewEvent,
  buildLayerStyleReviewEvent,
  buildMapExportReviewEvent,
  buildMapReviewContextSnapshot,
  buildSourceRestoreReviewEvent,
  buildUrbanHandoffReviewEvent,
  createMapReviewSession,
  exportMapReviewSessionJson,
  exportMapReviewSessionMarkdown,
  filterMapReviewTimelineEvents,
  MAP_REVIEW_SESSION_EVENT_LIMIT,
  MAP_REVIEW_SESSION_VERSION,
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
      evidenceArtifactId: `map-evidence-layer-${id}`,
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
    expect(session.metadata.categoryCounts["session-snapshot"]).toBe(1);
    expect(session.metadata.evidenceArtifactIds).toEqual(["map-evidence-layer-parcels", "map-evidence-layer-stops"]);
    expect(snapshot.layerSummaries[0]).toEqual({
      layerId: "parcels",
      name: "Policy parcels",
      visible: true,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      featureCount: 1,
      geometryType: "Point",
      evidenceArtifactId: "map-evidence-layer-parcels",
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
        evidenceArtifactId: "map-evidence-query-buffer",
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
    expect(filterMapReviewTimelineEvents(session, { category: "nl-query-decision" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { layerId: "stops" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { evidenceArtifactId: "map-evidence-query-buffer" })).toHaveLength(1);
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
        evidenceArtifactId: "map-evidence-layer-parcels",
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
        evidenceArtifactId: "map-evidence-layer-parcels",
      }],
    }, makeSnapshot());

    expect(event.type).toBe("layer-change");
    expect(event.category).toBe("layer-import");
    expect(event.layerIds).toEqual(["parcels"]);
    expect(event.evidenceArtifactIds).toEqual(["map-evidence-layer-parcels"]);
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
      evidenceArtifactIds: ["map-evidence-layer-parcels"],
      reportItemIds: ["map-handoff-corridor", "map-handoff-corridor-section"],
    });

    const json = exportMapReviewSessionJson(session);
    const parsed = JSON.parse(json) as { events: Array<{ category: string; evidenceArtifactIds: string[]; title: string }> };
    const markdown = exportMapReviewSessionMarkdown(session);

    expect(exportMapReviewSessionJson(session)).toBe(json);
    expect(parsed.events.map((event) => event.title)).toEqual([
      "Review session started",
      "Report handoff inserted: Corridor evidence",
    ]);
    expect(markdown).toContain("# Map review session");
    expect(parsed.events[1]?.category).toBe("export-report-handoff");
    expect(parsed.events[1]?.evidenceArtifactIds).toEqual(["map-evidence-layer-parcels"]);
    expect(markdown).toContain("Audit Category: export-report-handoff");
    expect(markdown).toContain("Evidence Artifact IDs: map-evidence-layer-parcels");
    expect(markdown).toContain("Report Item IDs: map-handoff-corridor, map-handoff-corridor-section");
  });

  it("caps the timeline at MAP_REVIEW_SESSION_EVENT_LIMIT and keeps the most recent events", () => {
    let session = createMapReviewSession({ createdAt: fixedCreatedAt });
    const overflow = 25;
    const totalAppends = MAP_REVIEW_SESSION_EVENT_LIMIT + overflow;

    for (let index = 0; index < totalAppends; index += 1) {
      const isoTimestamp = new Date(Date.UTC(2026, 4, 2, 10, 0, index)).toISOString();
      session = appendMapReviewEvent(session, {
        type: "qa-event",
        status: "recorded",
        timestamp: isoTimestamp,
        title: `Event ${index}`,
        summary: `synthetic event ${index}`,
      });
    }

    expect(session.events.length).toBe(MAP_REVIEW_SESSION_EVENT_LIMIT);
    expect(session.events.at(-1)?.title).toBe(`Event ${totalAppends - 1}`);
    // Oldest synthetic events should have been dropped first.
    expect(session.events.some((event) => event.title === "Event 0")).toBe(false);
  });
});

describe("MapReviewSessionService Prompt 20 — expanded audit coverage + export reconstruction", () => {
  it("records first-class source and run identifiers on every event (v3)", () => {
    const event = buildSourceRestoreReviewEvent({
      layerId: "parcels",
      layerName: "Policy parcels",
      sourceId: "source-parcels",
      restoreStatus: "restored",
    });
    let session = createMapReviewSession({ createdAt: fixedCreatedAt });
    session = appendMapReviewEvent(session, event);

    const recorded = session.events[0];
    expect(session.version).toBe(MAP_REVIEW_SESSION_VERSION);
    expect(recorded?.version).toBe(MAP_REVIEW_SESSION_VERSION);
    expect(recorded?.sourceIds).toEqual(["source-parcels"]);
    expect(recorded?.runIds).toEqual([]);
    expect(recorded?.category).toBe("source-restore");
    expect(recorded?.status).toBe("resolved");
  });

  it("covers import, source-restore, style, CRS, analysis, report, export, and Urban handoff with attributed IDs", () => {
    const manifest = {
      manifestId: "run-buffer-001",
      workflowId: "workflow-buffer",
      status: "applied",
      operation: "buffer",
      workflowKind: "buffer",
      inputLayerIds: ["parcels"],
      sourceLayerIds: ["parcels"],
      outputLayerIds: ["parcels-buffer"],
    } as unknown as MapReproducibilityManifest;

    const sourceRestore = buildSourceRestoreReviewEvent({
      layerId: "parcels",
      layerName: "Policy parcels",
      sourceId: "source-parcels",
      restoreStatus: "unavailable",
    });
    expect(sourceRestore.category).toBe("source-restore");
    expect(sourceRestore.status).toBe("failed");
    expect(sourceRestore.sourceIds).toEqual(["source-parcels"]);

    const style = buildLayerStyleReviewEvent({
      layerId: "parcels",
      layerName: "Policy parcels",
      styleMode: "choropleth",
      classificationMethod: "quantile",
      classCount: 5,
      sourceId: "source-parcels",
    });
    expect(style.category).toBe("cartography-review");
    expect(style.layerIds).toEqual(["parcels"]);

    const crs = buildCrsCorrectionReviewEvent({
      layerId: "parcels",
      layerName: "Policy parcels",
      declaredCrs: "EPSG:32635",
      provenance: "user-declared",
      caveat: "Not verified against source metadata.",
      sourceId: "source-parcels",
    });
    expect(crs.category).toBe("crs-correction");
    expect(crs.details?.declaredCrs).toBe("EPSG:32635");

    const analysis = buildAnalysisDispatchReviewEvent({
      title: "Buffer applied: 250 m",
      summary: "Applied a 250 m buffer to policy parcels.",
      method: "buffer",
      manifest,
      evidenceArtifactIds: ["map-evidence-buffer"],
      sourceIds: ["source-parcels"],
    });
    expect(analysis.type).toBe("analysis-dispatch");
    expect(analysis.category).toBe("workflow-apply");
    expect(analysis.runIds).toEqual(["run-buffer-001"]);
    expect(analysis.layerIds).toEqual(expect.arrayContaining(["parcels", "parcels-buffer"]));

    const handoff = buildUrbanHandoffReviewEvent({
      direction: "map-to-urban",
      method: "Moran's I",
      requestId: "urban-req-1",
      layerIds: ["parcels-buffer"],
      sourceIds: ["source-parcels"],
      evidenceArtifactIds: ["map-evidence-buffer"],
      runIds: ["run-buffer-001"],
    });
    expect(handoff.category).toBe("urban-sync");
    expect(handoff.runIds).toEqual(["run-buffer-001"]);

    const exportEvent = buildMapExportReviewEvent({
      format: "geojson",
      scope: "analysis-output",
      layerIds: ["parcels-buffer"],
      sourceIds: ["source-parcels"],
      runIds: ["run-buffer-001"],
      evidenceArtifactIds: ["map-evidence-buffer"],
    });
    expect(exportEvent.category).toBe("export-report-handoff");
    expect(exportEvent.title).toContain("GEOJSON");
    expect(exportEvent.details?.format).toBe("geojson");
    expect(exportEvent.runIds).toEqual(["run-buffer-001"]);
  });

  it("exports a deterministic JSON audit with the expected ordered event sequence and source/layer/run/evidence IDs", () => {
    let session = createMapReviewSession({
      projectId: "project-istanbul",
      createdAt: fixedCreatedAt,
      initialSnapshot: makeSnapshot(),
    });
    session = appendMapReviewEvent(session, {
      ...buildSourceRestoreReviewEvent({
        layerId: "parcels",
        layerName: "Policy parcels",
        sourceId: "source-parcels",
        restoreStatus: "restored",
      }),
      timestamp: "2026-05-02T10:02:00.000Z",
    });
    session = appendMapReviewEvent(session, {
      ...buildCrsCorrectionReviewEvent({
        layerId: "parcels",
        layerName: "Policy parcels",
        declaredCrs: "EPSG:32635",
        provenance: "user-declared",
        sourceId: "source-parcels",
      }),
      timestamp: "2026-05-02T10:04:00.000Z",
    });
    session = appendMapReviewEvent(session, {
      ...buildAnalysisDispatchReviewEvent({
        title: "Buffer applied: 250 m",
        summary: "Applied a 250 m buffer.",
        method: "buffer",
        inputLayerIds: ["parcels"],
        outputLayerIds: ["parcels-buffer"],
        runId: "run-buffer-001",
        evidenceArtifactIds: ["map-evidence-buffer"],
        sourceIds: ["source-parcels"],
      }),
      timestamp: "2026-05-02T10:06:00.000Z",
    });
    session = appendMapReviewEvent(session, {
      ...buildMapExportReviewEvent({
        format: "geojson",
        scope: "analysis-output",
        layerIds: ["parcels-buffer"],
        sourceIds: ["source-parcels"],
        runIds: ["run-buffer-001"],
        evidenceArtifactIds: ["map-evidence-buffer"],
      }),
      timestamp: "2026-05-02T10:08:00.000Z",
    });

    const json = exportMapReviewSessionJson(session);
    // Deterministic: re-export equals the first export.
    expect(exportMapReviewSessionJson(session)).toBe(json);

    const parsed = JSON.parse(json) as {
      metadata: { sourceIds: string[]; runIds: string[]; evidenceArtifactIds: string[] };
      events: Array<{ title: string; category: string; sourceIds: string[]; runIds: string[]; layerIds: string[]; evidenceArtifactIds: string[] }>;
    };

    // Ordering is preserved (snapshot first, then the four chronological events).
    expect(parsed.events.map((event) => event.title)).toEqual([
      "Review session started",
      "Source restore (restored): Policy parcels",
      "Declared CRS EPSG:32635: Policy parcels",
      "Buffer applied: 250 m",
      "Map export (analysis-output): GEOJSON",
    ]);
    expect(parsed.events.map((event) => event.category)).toEqual([
      "session-snapshot",
      "source-restore",
      "crs-correction",
      "workflow-apply",
      "export-report-handoff",
    ]);

    // Source / layer / run / evidence IDs survive the round-trip on the events.
    const analysisEvent = parsed.events.find((event) => event.title === "Buffer applied: 250 m");
    expect(analysisEvent?.runIds).toEqual(["run-buffer-001"]);
    expect(analysisEvent?.layerIds).toEqual(expect.arrayContaining(["parcels", "parcels-buffer"]));
    expect(analysisEvent?.evidenceArtifactIds).toEqual(["map-evidence-buffer"]);

    // And they are aggregated at the session metadata level for reconstruction.
    expect(parsed.metadata.sourceIds).toContain("source-parcels");
    expect(parsed.metadata.runIds).toContain("run-buffer-001");
    expect(parsed.metadata.evidenceArtifactIds).toContain("map-evidence-buffer");
  });

  it("renders source and run identifier rows in the Markdown export", () => {
    let session = createMapReviewSession({ createdAt: fixedCreatedAt });
    session = appendMapReviewEvent(session, {
      ...buildAnalysisDispatchReviewEvent({
        title: "Buffer applied: 250 m",
        summary: "Applied a 250 m buffer.",
        runId: "run-buffer-001",
        inputLayerIds: ["parcels"],
        outputLayerIds: ["parcels-buffer"],
        sourceIds: ["source-parcels"],
        evidenceArtifactIds: ["map-evidence-buffer"],
      }),
      timestamp: "2026-05-02T10:06:00.000Z",
    });

    const markdown = exportMapReviewSessionMarkdown(session);
    expect(markdown).toContain("- Source IDs: source-parcels");
    expect(markdown).toContain("- Run IDs: run-buffer-001");
    expect(markdown).toContain("Evidence Artifact IDs: map-evidence-buffer");
  });

  it("filters timeline events by source and run identifiers", () => {
    let session = createMapReviewSession({ createdAt: fixedCreatedAt });
    session = appendMapReviewEvent(session, buildSourceRestoreReviewEvent({
      layerId: "parcels",
      layerName: "Policy parcels",
      sourceId: "source-parcels",
      restoreStatus: "restored",
      timestamp: "2026-05-02T10:02:00.000Z",
    }));
    session = appendMapReviewEvent(session, buildAnalysisDispatchReviewEvent({
      title: "Buffer applied",
      summary: "Buffer.",
      runId: "run-buffer-001",
      outputLayerIds: ["parcels-buffer"],
      timestamp: "2026-05-02T10:06:00.000Z",
    }));

    expect(filterMapReviewTimelineEvents(session, { sourceId: "source-parcels" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { runId: "run-buffer-001" })).toHaveLength(1);
    expect(filterMapReviewTimelineEvents(session, { query: "run-buffer-001" })).toHaveLength(1);
  });
});
