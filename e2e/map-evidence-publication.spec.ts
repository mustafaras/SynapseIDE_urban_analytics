import { expect, test, type Page } from "@playwright/test";

import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedEvidencePublicationRun(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const [{ useUrbanContextStore }, { useFlowStore }] = await Promise.all([
      import("/src/features/urbanAnalytics/useUrbanContextStore.ts"),
      import("/src/stores/useFlowStore.ts"),
    ]);
    useUrbanContextStore.getState().createContext({ studyAreaId: "e2e-evidence-area" });
    const contextId = useUrbanContextStore.getState().context?.contextId;
    if (!contextId) throw new Error("Evidence publication context was not created.");
    const run = {
      runId: "e2e-evidence-run",
      flowId: "site-suitability",
      label: "E2E evidence run",
      insertedAt: "2026-05-25T09:00:00.000Z",
      paragraph: "Map evidence output prepared.",
      paragraphPreview: "Map evidence output",
      paragraphFull: "Map evidence output prepared.",
      mapOutputs: [{
        id: "published-output",
        type: "choropleth",
        title: "Evidence publication output",
        geojson: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[29, 41], [29.02, 41], [29.02, 41.02], [29, 41.02], [29, 41]]],
            },
            properties: { value: 1 },
          }],
        },
      }],
      chartOutputs: [],
      dataOutputs: [],
    };
    useFlowStore.getState().upsertCompletedRun(run);
    useFlowStore.getState().registerManifest({
      runId: run.runId,
      flowId: "site-suitability",
      contextId,
      inputs: {},
      parameters: {},
      methodValidity: null,
      dataFitness: null,
      mapArtifactIds: [],
      codeArtifactIds: [],
      reportInsertIds: [],
      dashboardBindingIds: [],
      indicatorResultIds: [],
      runtimeMode: "demo",
      readiness: null,
      createdAt: "2026-05-25T09:00:00.000Z",
    });
    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: "e2e-evidence-run-artifact",
      kind: "workflow-run",
      title: "E2E workflow evidence publication",
      state: "active",
      sourceModule: "urban-analytics",
      linkedContextId: contextId,
      linkedRunId: run.runId,
      provenance: { runId: run.runId, flowId: "site-suitability" },
      qa: { state: "warning", warnings: ["Demo fixture."], limitations: [] },
    });
  });
}

test.describe("Map evidence publication", () => {
  test("marks a published evidence card stale and appends a successor after a map edit", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await seedEvidencePublicationRun(page);

    const tray = urbanModal.locator(".ua-evidence-tray");
    await triggerDomClick(tray.locator(".ua-evidence-toggle"));
    const workflowRow = tray.locator(".ua-evidence-row", { hasText: "E2E workflow evidence publication" });
    await expect(workflowRow).toBeVisible();
    await expect(workflowRow.getByRole("button", { name: "Publish" })).toBeEnabled();
    await page.evaluate(async () => {
      const [{ publishUrbanRunOutputsToMap }, { useFlowStore }] = await Promise.all([
        import("/src/features/urbanAnalytics/context/mapEvidencePublisher.ts"),
        import("/src/stores/useFlowStore.ts"),
      ]);
      const run = useFlowStore.getState().completedRuns.find((entry) => entry.runId === "e2e-evidence-run");
      if (!run) throw new Error("Evidence publication run was not registered.");
      publishUrbanRunOutputsToMap(run);
    });

    const mapLayerRows = tray.locator(".ua-evidence-row", { hasText: "Map layer: Evidence publication output" });
    await expect(mapLayerRows.first()).toBeVisible();
    const artifactCountBeforeEdit = await mapLayerRows.count();

    await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const layerId = "urban-pub-e2e-evidence-run-published-output";
      const layer = useMapExplorerStore.getState().overlayLayers.find((entry) => entry.id === layerId);
      if (!layer) throw new Error("Published evidence layer was not found.");
      useMapExplorerStore.getState().updateLayerMetadata(layerId, {
        metadata: {
          ...(layer.metadata ?? {}),
          dataVersion: "edited-v2",
        },
      });
    });

    await expect(mapLayerRows).toHaveCount(artifactCountBeforeEdit + 1);
    await expect(mapLayerRows.filter({ hasText: "Stale" }).first()).toBeVisible();
    await expect(mapLayerRows.filter({ hasText: "Superseding evidence reference after map source change" }).first()).toBeVisible();
    await expect.poll(async () => page.evaluate(async () => {
      const { useUrbanContextStore } = await import("/src/features/urbanAnalytics/useUrbanContextStore.ts");
      return useUrbanContextStore.getState().evidenceArtifacts
        .filter((artifact) => artifact.mapLayerId === "urban-pub-e2e-evidence-run-published-output")
        .filter((artifact) => artifact.state === "stale").length;
    })).toBeGreaterThan(0);
    await expect.poll(async () => page.evaluate(async () => {
      const { useUrbanContextStore } = await import("/src/features/urbanAnalytics/useUrbanContextStore.ts");
      return useUrbanContextStore.getState().evidenceArtifacts.some((artifact) =>
        artifact.mapLayerId === "urban-pub-e2e-evidence-run-published-output"
        && artifact.metadata?.sourceDataVersion === "edited-v2"
        && typeof artifact.metadata?.supersedesArtifactId === "string",
      );
    })).toBe(true);
  });
});
