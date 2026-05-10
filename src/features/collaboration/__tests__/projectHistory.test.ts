import { describe, expect, it } from "vitest";
import type { ProjectRecord } from "@/centerpanel/registry/types";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import {
  appendProjectSnapshot,
  buildProjectHistoryFeed,
  createProjectSnapshot,
  normalizeProjectRecordForHistory,
} from "../projectHistory";

function makeProject(): ProjectRecord {
  const now = new Date("2026-04-24T12:00:00.000Z").toISOString();
  return {
    id: "project-history",
    name: "Harbor Heat Review",
    description: "Project history seed",
    scale: "city",
    crs: "EPSG:4326",
    tags: ["climate"],
    priority: 3,
    sessionsCount: 1,
    indicators: [],
    createdAt: now,
    updatedAt: now,
  };
}

function makeCompletedRun(): CompletedAnalysisRun {
  return {
    runId: "run-hotspot-1",
    flowId: "emerging_hot_spot",
    label: "Emerging Hot Spots Run",
    insertedAt: "2026-04-24T12:15:00.000Z",
    paragraph: "Demo source run captured a persistent hot spot corridor.",
    paragraphPreview: "Demo source run captured a persistent hot spot corridor.",
    paragraphFull: "Demo source run captured a persistent hot spot corridor and saved map output.",
    mapOutputs: [
      {
        id: "map-output-1",
        type: "choropleth",
        geojson: { type: "FeatureCollection", features: [] },
        title: "Emerging Hot Spots",
        engineBridge: {
          domain: "spatial-stats",
          engine: "EmergingHotSpots",
          runTimestamp: "2026-04-24T12:15:00.000Z",
          parameters: {
            sourceRuntimeMode: "demo-source",
            sampleMode: true,
          },
          statisticalSummary: {},
          visualization: {
            kind: "temporal",
            title: "Emerging Hot Spots",
          },
        },
      },
    ],
    chartOutputs: [],
    dataOutputs: [],
  };
}

describe("projectHistory", () => {
  it("creates project snapshots and exposes them in the recent change feed", () => {
    const baseProject = makeProject();
    const snapshot = createProjectSnapshot({
      label: "Harbor Heat Review snapshot",
      slots: {
        objective: "Compare April heat observations against the prior quarter.",
        findings: "Heat concentrations intensified around the logistics corridor.",
      },
      sourceMode: "real",
      now: "2026-04-24T12:05:00.000Z",
    });

    const nextProject = { ...baseProject, ...appendProjectSnapshot(baseProject, snapshot) };
    const feed = buildProjectHistoryFeed(nextProject, { slotId: "objective" });

    expect(nextProject.reportSnapshots?.[0]?.id).toBe(snapshot.id);
    expect(nextProject.recentChanges?.[0]?.kind).toBe("snapshot-created");
    expect(feed[0]?.snapshotId).toBe(snapshot.id);
    expect(feed[0]?.sourceMode).toBe("real");
  });

  it("normalizes legacy persisted timestamps and malformed history payloads safely", () => {
    const project = makeProject();
    const normalized = normalizeProjectRecordForHistory({
      ...project,
      reportSnapshots: [
        {
          id: "legacy-snapshot",
          when: 1704067200000,
          slots: { objective: "Legacy objective" },
          label: "Legacy snapshot",
          sourceMode: "demo",
          artifact: { kind: "snapshot", label: "Legacy snapshot" },
        } as never,
      ],
      recentChanges: [
        {
          id: "legacy-change",
          changedAt: 1704067200000,
          kind: "report-saved",
          title: "Legacy report save",
          description: "Saved during a prior schema version.",
          sourceMode: "real",
          artifact: { kind: "report", label: "Legacy report" },
        } as never,
        {
          id: "invalid-change",
          changedAt: "not-a-date",
          kind: "unknown-kind",
        } as never,
      ],
    });

    expect(normalized.reportSnapshots).toHaveLength(1);
    expect(normalized.reportSnapshots?.[0]?.createdAt).toBe(new Date(1704067200000).toISOString());
    expect(normalized.recentChanges).toHaveLength(1);
    expect(normalized.recentChanges?.[0]?.changedAt).toBe(new Date(1704067200000).toISOString());
  });

  it("surfaces completed analytical runs in the history feed with truthful source mode detection", () => {
    const feed = buildProjectHistoryFeed(makeProject(), {
      completedRuns: [makeCompletedRun()],
      limit: 3,
    });

    expect(feed[0]?.kind).toBe("analysis-run");
    expect(feed[0]?.title).toContain("Emerging Hot Spots Run");
    expect(feed[0]?.sourceMode).toBe("demo");
    expect(feed[0]?.flowId).toBe("emerging_hot_spot");
  });
});
