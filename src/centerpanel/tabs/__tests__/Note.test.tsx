// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import type { ProjectRecord } from "@/centerpanel/registry/types";
import { saveUrbanToPersist } from "@/centerpanel/registry/storage";
import { ProjectRegistryProvider } from "@/centerpanel/registry/state";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";
import { useFlowStore } from "@/stores/useFlowStore";
import { RecentChanges } from "../RecentChanges";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeProject(): ProjectRecord {
  return {
    id: "project-report-history",
    name: "Corridor Review",
    description: "Project seeded for Note history rendering.",
    scale: "city",
    crs: "EPSG:4326",
    tags: ["climate"],
    priority: 3,
    sessionsCount: 1,
    indicators: [],
    reportSnapshots: [
      {
        id: "snap-1",
        createdAt: "2026-04-24T11:50:00.000Z",
        label: "Corridor Review snapshot",
        summary: "Objective captured before report edits.",
        slots: {
          objective: "Objective captured before report edits.",
        },
        sourceMode: "real",
        artifact: {
          kind: "snapshot",
          label: "Corridor Review snapshot",
          id: "snap-1",
        },
      },
    ],
    recentChanges: [
      {
        id: "change-report-save",
        changedAt: "2026-04-24T12:05:00.000Z",
        kind: "report-saved",
        title: "Saved corridor review",
        description: "Persisted the structured report for review.",
        sourceMode: "real",
        artifact: {
          kind: "report",
          label: "Corridor Review",
          id: "report-1",
        },
      },
    ],
    createdAt: "2026-04-24T11:30:00.000Z",
    updatedAt: "2026-04-24T12:05:00.000Z",
  };
}

function makeCompletedRun(): CompletedAnalysisRun {
  return {
    runId: "run-1",
    flowId: "emerging_hot_spot",
    label: "Emerging Hot Spots Run",
    insertedAt: "2026-04-24T12:10:00.000Z",
    paragraph: "Real source run published to the map.",
    paragraphPreview: "Real source run published to the map.",
    paragraphFull: "Real source run published to the map and was saved for review.",
    mapOutputs: [
      {
        id: "map-1",
        type: "choropleth",
        geojson: { type: "FeatureCollection", features: [] },
        title: "Emerging Hot Spots",
        engineBridge: {
          domain: "spatial-stats",
          engine: "EmergingHotSpots",
          runTimestamp: "2026-04-24T12:10:00.000Z",
          parameters: {
            sourceRuntimeMode: "real-source",
            sourceKind: "imported-raster",
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

function mountRecentChanges(onDiff: (snapshotId: string) => void) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root, onDiff };
}

async function clickCompare(container: HTMLElement): Promise<void> {
  const compareButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Compare"));
  await act(async () => {
    compareButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  localStorage.clear();
  saveUrbanToPersist([makeProject()]);
  useFlowStore.getState().reset();
  useFlowStore.setState({ completedRuns: [makeCompletedRun()] });
});

describe("RecentChanges", () => {
  it("renders snapshots, report saves, and analytical runs and opens compare for snapshots", async () => {
    const onDiff = vi.fn();
    const { container, root } = mountRecentChanges(onDiff);

    await act(async () => {
      root.render(
        <ProjectRegistryProvider>
          <RecentChanges slot="objective" projectId="project-report-history" onDiff={onDiff} />
        </ProjectRegistryProvider>,
      );
    });

    const history = container.querySelector('[data-testid="note-recent-changes"]');
    expect(history?.textContent).toContain("Saved corridor review");
    expect(history?.textContent).toContain("Emerging Hot Spots Run");
    expect(history?.textContent).toContain("Real data");
    expect(history?.textContent).toContain("1 snapshots");

    await clickCompare(container);
    expect(onDiff).toHaveBeenCalledWith("snap-1");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
