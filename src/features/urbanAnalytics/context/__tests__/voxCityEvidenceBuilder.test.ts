import { describe, expect, it } from "vitest";

import {
  buildVoxCityScenarioArtifactIds,
  registerVoxCityScenarioEvidence,
} from "../voxCityEvidenceBuilder";
import type { UrbanEvidenceArtifact } from "../../lib/types";

function createBaseInput(overrides?: Partial<Parameters<typeof registerVoxCityScenarioEvidence>[0]>) {
  const ids = buildVoxCityScenarioArtifactIds("run-123", "sunlight_exposure");
  return {
    scenarioArtifactId: ids.scenarioArtifactId,
    mapReferenceArtifactId: ids.mapReferenceArtifactId,
    title: "Sunlight Scenario",
    summary: "Scenario summary",
    sourceId: "source-1",
    flowId: "sunlight_sim",
    linkedRunId: "run-123",
    linkedLayerId: "layer-123",
    linkedSourceLayerIds: ["source-layer-1"],
    context: null,
    runtimeMode: "real" as const,
    metadata: {
      simulationType: "sunlight_exposure" as const,
      modelReference: {
        kind: "cityjson" as const,
        sourceId: "source-1",
        title: "Model",
        runtimeMode: "real" as const,
        featureCount: 1,
        ingestMethod: "import" as const,
      },
      spatialReference: {
        crs: null,
      },
      scenarioParameters: {
        sample_count: 1,
      },
      assumptions: ["deterministic sun path"],
      uncertainty: ["simplified shading"],
      outputReferences: {
        runId: "run-123",
        mapLayerId: "layer-123",
        dataOutputIds: ["data-output-1"],
        chartOutputIds: [],
      },
    },
    tags: ["voxcity", "solar"],
    registerEvidenceArtifact: (_draft: unknown): UrbanEvidenceArtifact => ({
      id: "artifact-created",
      kind: "workflow-run",
      title: "placeholder",
      summary: "placeholder",
      sourceId: "source-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      tags: [],
      metadata: {},
      linkedArtifactIds: [],
    }),
    ...overrides,
  };
}

describe("voxCityEvidenceBuilder", () => {
  it("marks sample runtime artifacts with warning QA state and limitation", () => {
    const created: UrbanEvidenceArtifact[] = [];

    registerVoxCityScenarioEvidence(
      createBaseInput({
        runtimeMode: "sample",
        registerEvidenceArtifact: (draft) => {
          const artifact: UrbanEvidenceArtifact = {
            id: draft.id,
            kind: draft.kind,
            title: draft.title,
            summary: draft.summary,
            sourceId: draft.sourceId,
            flowId: draft.flowId,
            linkedRunId: draft.linkedRunId,
            linkedLayerId: draft.linkedLayerId,
            linkedSourceLayerIds: draft.linkedSourceLayerIds,
            linkedArtifactIds: draft.linkedArtifactIds,
            contextId: draft.contextId,
            qa: draft.qa,
            tags: draft.tags,
            metadata: draft.metadata,
            createdAt: draft.createdAt,
          };
          created.push(artifact);
          return artifact;
        },
      }),
    );

    const scenarioArtifact = created.find((artifact) => artifact.kind === "workflow-run");
    expect(scenarioArtifact).toBeDefined();
    expect(scenarioArtifact?.qa?.state).toBe("warning");
    expect(scenarioArtifact?.qa?.limitations.some((entry) => entry.includes("sample/demo geometry"))).toBe(true);
  });

  it("creates bidirectional linkage between scenario and map reference artifacts", () => {
    const created: UrbanEvidenceArtifact[] = [];

    registerVoxCityScenarioEvidence(
      createBaseInput({
        registerEvidenceArtifact: (draft) => {
          const artifact: UrbanEvidenceArtifact = {
            id: draft.id,
            kind: draft.kind,
            title: draft.title,
            summary: draft.summary,
            sourceId: draft.sourceId,
            flowId: draft.flowId,
            linkedRunId: draft.linkedRunId,
            linkedLayerId: draft.linkedLayerId,
            linkedSourceLayerIds: draft.linkedSourceLayerIds,
            linkedArtifactIds: draft.linkedArtifactIds,
            contextId: draft.contextId,
            qa: draft.qa,
            tags: draft.tags,
            metadata: draft.metadata,
            createdAt: draft.createdAt,
          };
          created.push(artifact);
          return artifact;
        },
      }),
    );

    const scenarioArtifact = created.find((artifact) => artifact.kind === "workflow-run");
    const mapArtifact = created.find((artifact) => artifact.kind === "map-layer");

    expect(scenarioArtifact?.linkedArtifactIds).toContain(mapArtifact?.id ?? "");
    expect(mapArtifact?.linkedArtifactIds).toContain(scenarioArtifact?.id ?? "");
  });
});
