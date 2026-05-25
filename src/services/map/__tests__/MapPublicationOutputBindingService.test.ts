import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  buildMapDashboardBinding,
  buildMapEducationReference,
  buildMapPublicationEvidenceArtifact,
} from "../MapPublicationOutputBindingService";

const createdAt = "2026-05-12T14:30:00.000Z";

function layer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "access-layer",
    name: "Transit Access Index",
    type: "geojson",
    visible: true,
    opacity: 1,
    queryable: true,
    sourceKind: "project",
    provenance: {
      label: "City mobility model",
      sourceName: "Mobility planning team",
      license: "ODbL",
      attribution: "City mobility planning team",
    },
    metadata: {
      evidenceArtifactId: "map-evidence-access",
      crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
      schemaSummary: {
        fieldCount: 2,
        fields: [{ name: "district", role: "identifier" }, { name: "access_score", role: "attribute", type: "number" }],
        source: "explicit",
        notes: [],
      },
      geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 24, source: "explicit", notes: [] },
      licenseAttribution: {
        license: "ODbL",
        attribution: "City mobility planning team",
        sourceName: "Mobility planning team",
        requiresAttribution: true,
        source: "explicit",
        notes: [],
      },
      scientificQA: {
        status: "passed",
        issueIds: [],
        badges: [],
        checkedAt: createdAt,
        featureIssueCount: 0,
        usedWorker: false,
        caveats: [],
        signature: "qa-access",
      },
    },
    ...overrides,
  } as OverlayLayerConfig;
}

describe("MapPublicationOutputBindingService", () => {
  it("builds immutable publication evidence with complete scalar traceability", () => {
    const artifact = buildMapPublicationEvidenceArtifact({
      layer: layer({ sourceKind: "demo" }),
      sourceModule: "urban-analytics",
      urbanEvidenceId: "urban-evidence-access",
      linkedRunId: "run-access-1",
      linkedWorkflowId: "accessibility",
      linkedArtifactIds: ["urban-evidence-access"],
      runtimeMode: "demo",
      manifestReferenceId: "urban-run-manifest:run-access-1",
      contextId: "context-access-1",
      crsSummary: {
        declaredCrs: "EPSG:3857",
        displayCrs: "EPSG:4326",
        sourceLayerCrs: [{ layerId: "access-layer", crs: "EPSG:3857" }],
        missingLayerIds: [],
        notes: [],
      },
      qa: {
        state: "warning",
        caveats: ["Demo output must remain labelled."],
      },
      createdAt,
    });

    expect(artifact.state).toBe("published");
    expect(artifact.urbanEvidenceId).toBe("urban-evidence-access");
    expect(artifact.linkedRunId).toBe("run-access-1");
    expect(artifact.linkedWorkflowId).toBe("accessibility");
    expect(artifact.linkedArtifactIds).toContain("urban-evidence-access");
    expect(artifact.qa.state).toBe("warning");
    expect(artifact.provenance.crsSummary?.declaredCrs).toBe("EPSG:3857");
    expect(artifact.metadata).toMatchObject({
      runtimeMode: "demo",
      isDemo: true,
      isSynthetic: false,
      manifestId: "urban-run-manifest:run-access-1",
      contextId: "context-access-1",
    });
    expect(Object.prototype.hasOwnProperty.call(artifact, "sourceData")).toBe(false);
  });

  it("builds a static dashboard map binding with QA and provenance traceability", () => {
    const binding = buildMapDashboardBinding({
      layer: layer(),
      evidenceArtifacts: [],
      createdAt,
    });

    expect(binding.bindingMode).toBe("static-snapshot");
    expect(binding.refreshMode).toBe("static");
    expect(binding.isLive).toBe(false);
    expect(binding.dashboardBinding.kind).toBe("map");
    expect(binding.dashboardBinding.traceability?.sourceArtifactId).toBe("map-evidence-access");
    expect(binding.dashboardBinding.traceability?.qaState).toBe("valid");
    expect(binding.dashboardBinding.traceability?.dataFields).toEqual(["district", "access_score"]);
    expect(binding.dashboardBinding.traceability?.visualEncodingSummary).toContain("geojson layer");
    expect(binding.dashboardBinding.traceability?.sourceContextLabel).toContain("Mobility planning team");
    expect(binding.dataFields).toEqual(["district", "access_score"]);
    expect(binding.visualEncodingSummary).toContain("geometry Polygon");
    expect(binding.sourceContext).toMatchObject({
      sourceName: "Mobility planning team",
      crsLabel: "CRS EPSG:3857",
      publicationReadinessStatus: "ready",
    });
    expect(binding.dashboardBinding.traceability?.provenanceNotes.join(" ")).toContain("lightweight output binding descriptor");
    expect(binding.dashboardBinding.areas[0]).toMatchObject({
      id: "access-layer",
      formattedValue: "24 features",
      status: "improving",
    });
  });

  it("labels uncertain dashboard bindings as static warnings instead of live output", () => {
    const binding = buildMapDashboardBinding({
      layer: layer({
        metadata: {
          geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 12, source: "explicit", notes: [] },
          scientificQA: {
            status: "warning",
            issueIds: ["qa-crs-warning"],
            badges: ["missing_crs"],
            checkedAt: createdAt,
            featureIssueCount: 0,
            usedWorker: false,
            caveats: ["CRS was not declared by source metadata."],
            signature: "qa-warning",
          },
        },
      }),
      createdAt,
    });

    expect(binding.isLive).toBe(false);
    expect(binding.liveStateLabel).toContain("Static map binding");
    expect(binding.dashboardBinding.traceability?.refreshMode).toBe("static");
    expect(binding.dashboardBinding.traceability?.qaState).toBe("warning");
    expect(binding.dashboardBinding.traceability?.qaLimitations).toContain("CRS was not declared by source metadata.");
  });

  it("routes hot spot layers to the education methodology reference without claiming a live link", () => {
    const reference = buildMapEducationReference({
      layer: layer({
        id: "hotspot-layer",
        name: "Getis-Ord Hot Spot Result",
        metadata: {
          analysisResult: {
            engine: "GetisOrdGi",
            algorithmWorkflowId: "getis_ord_gi_star",
            runTimestamp: createdAt,
            parameterSummary: "Queen contiguity hot spot analysis",
            inputParameters: {},
            statisticalSummary: {},
            visualization: { kind: "hotspot", title: "Hot spot z-score", valueField: "gi_z_score" },
          },
        },
      }),
      requestedAt: 1_777_777,
      createdAt,
    });

    expect(reference.bindingMode).toBe("static-reference");
    expect(reference.isLive).toBe(false);
    expect(reference.target.pathId).toBe("spatial_statistics_planners");
    expect(reference.target.explainerId).toBe("getis_ord_gi");
    expect(reference.focusRequest).toMatchObject({
      view: "paths",
      pathId: "spatial_statistics_planners",
      explainerId: "getis_ord_gi",
      requestedAt: 1_777_777,
    });
  });

  it("carries publication-readiness QA into education references while remaining static", () => {
    const reference = buildMapEducationReference({
      layer: layer(),
      publicationReadiness: {
        id: "pub-readiness-1",
        status: "blocked",
        mode: "public-map",
        checkedAt: createdAt,
        visibleLayerCount: 1,
        hasTitle: true,
        hasLegend: true,
        hasScaleBar: true,
        hasNorthArrow: true,
        hasAttribution: true,
        qaBlockingIssueCount: 1,
        caveats: ["CRS QA blocker unresolved"],
        blockers: [],
        warnings: [],
        checks: [],
        acknowledgedIssueIds: [],
      },
      createdAt,
    });

    expect(reference.bindingMode).toBe("static-reference");
    expect(reference.isLive).toBe(false);
    expect(reference.qa.state).toBe("blocked");
    expect(reference.metadata.publicationReadinessStatus).toBe("blocked");
  });
});
