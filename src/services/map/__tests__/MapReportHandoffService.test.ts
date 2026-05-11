import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import type { MapScientificQAState } from "../MapScientificQA";
import {
  buildMapReportHandoffDraft,
  buildPendingReportInsertFromMapHandoff,
  buildReportDocumentFromMapHandoff,
} from "../MapReportHandoffService";

const viewport = {
  center: [29.01, 41.02] as [number, number],
  zoom: 11.25,
  bearing: 3,
  pitch: 20,
};

function layer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "district-risk",
    name: "District flood risk",
    type: "geojson",
    visible: true,
    opacity: 0.82,
    group: "analysis",
    sourceKind: "derived",
    qaStatus: "passed",
    provenance: {
      label: "Istanbul open risk model",
      sourceName: "Istanbul Metropolitan Municipality",
      sourceUrl: "https://data.example.test/flood-risk",
      license: "ODC-BY",
      method: "Getis-Ord Gi* over district exposure index",
      generatedAt: "2025-01-03T00:00:00.000Z",
    },
    style: {
      color: "#f59e0b",
      legendEntries: [
        { label: "Low", color: "#22c55e" },
        { label: "High", color: "#ef4444" },
      ],
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: 39,
      dataVersion: "2025-Q1",
      datasetContext: {
        datasetId: "flood-risk-2025",
        datasetTitle: "Flood Risk Index 2025",
        source: "Istanbul Metropolitan Municipality",
        license: "ODC-BY",
        crs: "EPSG:4326",
        updateDate: "2025-01-03T00:00:00.000Z",
      },
      analysisResult: {
        engine: "GetisOrdGi",
        runId: "run-risk-001",
        runTimestamp: "2025-01-04T00:00:00.000Z",
        parameterSummary: "Gi* fixed-distance band 1500 m",
        inputParameters: { distanceBandMeters: 1500 },
        statisticalSummary: { zMax: 2.7 },
        visualization: {
          type: "choropleth",
          legendEntries: [{ label: "Hot spot", color: "#ef4444", value: "hot" }],
        } as never,
      },
    },
    ...overrides,
  };
}

function qaState(): MapScientificQAState {
  return {
    status: "warning",
    checkedAt: "2025-01-05T00:00:00.000Z",
    issues: [
      {
        id: "qa-1",
        code: "missing-crs",
        category: "crs",
        severity: "warning",
        title: "CRS metadata needs review",
        explanation: "One visible layer relies on assumed CRS metadata.",
        suggestedFix: "Confirm the source CRS before measuring distance.",
        layerId: "demo-buildings",
        layerName: "Demo buildings",
      },
    ],
    layerSummaries: [],
    metadata: {
      generatedBy: "MapScientificQA",
      version: 1,
      signature: "qa-signature",
      visibleLayerCount: 1,
      workerLayerCount: 0,
      issueCounts: { info: 0, warning: 1, error: 0, blocker: 0 },
    },
  };
}

describe("MapReportHandoffService", () => {
  it("serializes visible layer references, legend, narrative citations, and reproducibility metadata", () => {
    const draft = buildMapReportHandoffDraft({
      overlayLayers: [layer()],
      viewport,
      currentMapBounds: [28.9, 40.9, 29.2, 41.2],
      baseLayerName: "Charcoal street atlas",
      snapshot: {
        dataUrl: "data:image/png;base64,abc",
        width: 420,
        height: 260,
        scaleBarLabel: "1 km",
        northArrowBearing: 3,
        attributionText: "Sources: IMM open data",
      },
      createdAt: "2025-01-06T00:00:00.000Z",
    });

    expect(draft.title).toBe("Current map evidence");
    expect(draft.snapshot.visibleLayerNames).toEqual(["District flood risk"]);
    expect(draft.snapshot.legendItems.map((item) => item.label)).toContain("Low");
    expect(draft.narrative).toContain("{{cite:map-layer-district-risk}}");
    expect(draft.publicationReadiness.status).toBe("ready-with-caveats");
    expect(draft.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        layerId: "district-risk",
        citationId: "map-layer-district-risk",
        crs: "EPSG:4326",
      }),
    ]));
    expect(draft.reproducibility.map((item) => item.label)).toEqual(expect.arrayContaining(["Viewport bounds", "Methods", "Data lineage", "Publication readiness"]));
  });

  it("builds a report insertion payload with screenshot figure and structured reference table", () => {
    const draft = buildMapReportHandoffDraft({
      overlayLayers: [layer()],
      viewport,
      snapshot: {
        dataUrl: "data:image/png;base64,abc",
        width: 420,
        height: 260,
      },
      createdAt: "2025-01-06T00:00:00.000Z",
    });
    const insert = buildPendingReportInsertFromMapHandoff(draft);
    const figure = insert.sections[0].blocks.find((block) => block.kind === "figure");
    const referenceTable = insert.sections[1].blocks.find((block) => block.kind === "table");

    expect(insert.source).toBe("map-report-handoff:map-view");
    expect(insert.citations).toHaveLength(1);
    expect(figure).toEqual(expect.objectContaining({
      assetType: "map",
      dataUrl: "data:image/png;base64,abc",
      width: 420,
      height: 260,
    }));
    expect(referenceTable).toEqual(expect.objectContaining({
      columns: ["Type", "ID", "Label", "Source", "CRS", "Timestamp", "Citation"],
      rows: expect.arrayContaining([expect.objectContaining({ ID: "district-risk" })]),
    }));
    expect(insert.sections[1].blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "bullet_list",
        items: expect.arrayContaining([expect.stringContaining("Publication readiness:")]),
      }),
    ]));
  });

  it("blocks report handoff readiness when formal prerequisites are missing", () => {
    const draft = buildMapReportHandoffDraft({
      overlayLayers: [],
      viewport,
      snapshot: {
        scaleBarLabel: null,
        northArrowBearing: null,
        attributionText: "",
        legendItems: [],
      },
      createdAt: "2025-01-06T00:00:00.000Z",
    });

    expect(draft.publicationReadiness.status).toBe("blocked");
    expect(draft.publicationReadiness.blockers.map((check) => check.criterion)).toEqual(expect.arrayContaining([
      "visible-layer",
      "legend",
      "attribution-license",
    ]));
    expect(draft.caveats).toEqual(expect.arrayContaining([expect.stringContaining("Show at least one overlay layer")]));
  });

  it("links map report sections back to review timeline events when available", () => {
    const draft = buildMapReportHandoffDraft({
      overlayLayers: [layer()],
      viewport,
      createdAt: "2025-01-06T00:00:00.000Z",
    });
    const insert = buildPendingReportInsertFromMapHandoff(draft, {
      mapReviewEventIds: ["map-review:2025-01-06:report-handoff"],
    });

    expect(insert.mapReviewEventIds).toEqual(["map-review:2025-01-06:report-handoff"]);
    expect(insert.sections.every((section) => section.mapReviewEventIds?.includes("map-review:2025-01-06:report-handoff"))).toBe(true);
    expect(insert.sections[1].blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "bullet_list",
        items: expect.arrayContaining(["Map review event ID: map-review:2025-01-06:report-handoff"]),
      }),
    ]));
  });

  it("builds a focused report document for direct map evidence PDF export", () => {
    const draft = buildMapReportHandoffDraft({
      overlayLayers: [layer()],
      viewport,
      snapshot: {
        dataUrl: "data:image/png;base64,abc",
        width: 420,
        height: 260,
      },
      options: {
        snapshotFrame: "landscape",
        snapshotFit: "cover",
      },
      createdAt: "2025-01-06T00:00:00.000Z",
    });
    const document = buildReportDocumentFromMapHandoff(draft);

    expect(document.name).toBe("Current map evidence");
    expect(document.sectionOrder).toEqual(document.sections.map((section) => section.id));
    expect(document.sections[0].title).toContain("Map Finding");
    expect(document.sections[1].title).toContain("Reproducibility");
    expect(document.sections[1].blocks.some((block) => block.kind === "table")).toBe(true);
  });

  it("keeps selected feature and layer scope explicit in references", () => {
    const hiddenLayer = layer({ id: "object-detections", name: "Detected roof objects", visible: false });
    const draft = buildMapReportHandoffDraft({
      overlayLayers: [hiddenLayer, layer({ id: "visible-context", name: "Visible context" })],
      viewport,
      source: {
        scope: "feature",
        layerId: "object-detections",
        featureId: "det-42",
        title: "Detected roof object feature finding",
        coordinate: [29.04, 41.03],
        properties: { detection_class: "roof object", confidence: 0.91 },
      },
      createdAt: "2025-01-06T00:00:00.000Z",
    });

    expect(draft.scope).toBe("feature");
    expect(draft.references[0]).toEqual(expect.objectContaining({
      kind: "feature",
      layerId: "object-detections",
      featureId: "det-42",
      label: "roof object",
    }));
    expect(draft.snapshot.visibleLayerNames[0]).toBe("Detected roof objects");
  });

  it("includes QA warnings only when requested while preserving sample-data caveats", () => {
    const demoLayer = layer({
      id: "demo-buildings",
      name: "Demo buildings",
      sourceKind: "demo",
      metadata: {
        geometryType: "Polygon",
        featureCount: 4,
        scientificQA: {
          status: "warning",
          issueIds: ["qa-1"],
          badges: ["sample_data", "missing_crs"],
          checkedAt: "2025-01-05T00:00:00.000Z",
          featureIssueCount: 1,
          usedWorker: false,
          caveats: ["Synthetic sample footprints."],
          signature: "demo-signature",
        },
      },
    });

    const withoutQa = buildMapReportHandoffDraft({
      overlayLayers: [demoLayer],
      viewport,
      scientificQA: qaState(),
      options: { includeQaWarnings: false },
      createdAt: "2025-01-06T00:00:00.000Z",
    });
    const withQa = buildMapReportHandoffDraft({
      overlayLayers: [demoLayer],
      viewport,
      scientificQA: qaState(),
      options: { includeQaWarnings: true },
      createdAt: "2025-01-06T00:00:00.000Z",
    });

    expect(withoutQa.caveats.some((caveat) => caveat.includes("demo/sample data"))).toBe(true);
    expect(withoutQa.caveats.some((caveat) => caveat.includes("CRS metadata needs review"))).toBe(false);
    expect(withQa.caveats.some((caveat) => caveat.includes("CRS metadata needs review"))).toBe(true);
  });
});