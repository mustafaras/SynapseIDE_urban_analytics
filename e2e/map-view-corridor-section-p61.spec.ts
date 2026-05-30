/**
 * Playwright e2e — Prompt 61: view corridors + section/cut planes.
 *
 * Proof: define a protected corridor, assert intruding massing highlights;
 * move a section plane, assert the cut readout and highlighted buildings update.
 */
import { expect, test, type Page } from "@playwright/test";
import { resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1680, height: 1100 });
  await resetWorkbenchState(page);
}

async function setRangeValue(page: Page, testId: string, value: number): Promise<void> {
  await page.getByTestId(testId).evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    valueSetter?.call(input, String(nextValue));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

test.describe("Prompt 61 — view corridors + section cuts @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await openMapExplorer(page);
  });

  test("highlights corridor intrusions and updates section cuts", async ({ page }) => {
    await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");

      const collection = {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            id: "protected-view-blocker",
            geometry: {
              type: "Polygon" as const,
              coordinates: [[[40, -5], [50, -5], [50, 5], [40, 5], [40, -5]]],
            },
            properties: { id: "protected-view-blocker", name: "Protected View Blocker", height: 22 },
          },
          {
            type: "Feature" as const,
            id: "outside-corridor",
            geometry: {
              type: "Polygon" as const,
              coordinates: [[[70, 30], [80, 30], [80, 40], [70, 40], [70, 30]]],
            },
            properties: { id: "outside-corridor", name: "Outside Corridor", height: 30 },
          },
          {
            type: "Feature" as const,
            id: "below-sightline",
            geometry: {
              type: "Polygon" as const,
              coordinates: [[[92, -4], [102, -4], [102, 4], [92, 4], [92, -4]]],
            },
            properties: { id: "below-sightline", name: "Below Sightline", height: 2 },
          },
        ],
      };

      const crsSummary = {
        crs: "EPSG:32635",
        status: "known" as const,
        source: "explicit" as const,
        notes: [],
      };
      const sourceHandle = {
        sourceId: "p61-projected-massing-source",
        kind: "imported" as const,
        storageMode: "inline-small" as const,
        restoreStatus: "restored" as const,
        format: "geojson" as const,
        crsSummary,
        featureCount: collection.features.length,
        schemaSummary: {
          fieldCount: 3,
          fields: [
            { name: "id", role: "identifier" as const, type: "string" },
            { name: "name", role: "attribute" as const, type: "string" },
            { name: "height", role: "attribute" as const, type: "number" },
          ],
          source: "explicit" as const,
          notes: [],
        },
        scene3d: {
          sourceKind: "building-footprint-extrusion" as const,
          runtimeMode: "real" as const,
          verticalDatum: {
            status: "known" as const,
            value: "EGM96 geoid height",
            source: "user-declared" as const,
            caveats: [],
          },
          objectCount: collection.features.length,
          lods: ["extruded-footprint"],
          bbox3d: [40, -5, 0, 102, 40, 30] as [number, number, number, number, number, number],
        },
        caveats: [],
        profiledAt: new Date().toISOString(),
      };

      const layerId = "p61-projected-massing-layer";
      const mapStore = useMapExplorerStore.getState();
      mapStore.upsertSourceHandle(sourceHandle);
      mapStore.addOverlayLayer({
        id: layerId,
        name: "P61 Projected Massing",
        type: "geojson",
        visible: true,
        opacity: 0.82,
        group: "analysis",
        sourceKind: "imported",
        queryable: true,
        qaStatus: "passed",
        sourceData: collection,
        metadata: {
          sourceId: sourceHandle.sourceId,
          sourceStorageMode: sourceHandle.storageMode,
          sourceRestoreStatus: sourceHandle.restoreStatus,
          crsSummary,
          featureCount: collection.features.length,
          geometryType: "Polygon",
          fields: ["id", "name", "height"],
        },
      });

      const sceneStore = useScene3DStore.getState();
      sceneStore.setRuntimeMode("3d");
      sceneStore.setActiveLayer(layerId, collection, {
        heightField: "height",
        declaredCrs: "EPSG:32635",
        cityModelSourceHandle: sourceHandle,
      });
      mapStore.open();
    });

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByTestId("toggle-3d-panel"));

    const panel = page.getByTestId("scene3d-panel");
    await expect(panel).toBeVisible();
    await expect(page.getByTestId("scene3d-analysis-crs")).toContainText("EPSG:32635");

    await triggerDomClick(page.getByTestId("scene3d-run-corridor"));
    await expect(page.getByTestId("scene3d-corridor-result")).toHaveAttribute("data-status", "ready");
    await expect(page.getByTestId("scene3d-corridor-result")).toHaveAttribute("data-intrusion-count", "1");
    await expect(page.getByTestId("scene3d-corridor-intrusion-protected-view-blocker")).toBeVisible();
    await expect(page.getByTestId("scene3d-building-protected-view-blocker")).toHaveAttribute("data-corridor-intrusion", "true");

    await triggerDomClick(page.getByTestId("scene3d-run-section"));
    await page.getByTestId("scene3d-section-plane-slider").scrollIntoViewIfNeeded();
    await setRangeValue(page, "scene3d-section-plane-slider", 45);
    await expect(page.getByTestId("scene3d-section-readout")).toHaveAttribute("data-cut-count", "1");
    await expect(page.getByTestId("scene3d-section-readout")).toHaveAttribute("data-retains-context", "true");
    await expect(page.getByTestId("scene3d-section-readout")).toContainText("45.0 m");
    await expect(page.getByTestId("scene3d-building-protected-view-blocker")).toHaveAttribute("data-section-cut", "true");

    await setRangeValue(page, "scene3d-section-plane-slider", 75);
    await expect(page.getByTestId("scene3d-section-readout")).toContainText("75.0 m");
    await expect(page.getByTestId("scene3d-building-outside-corridor")).toHaveAttribute("data-section-cut", "true");

    await page.getByTestId("scene3d-publish-analysis-evidence").scrollIntoViewIfNeeded();
    await triggerDomClick(page.getByTestId("scene3d-publish-analysis-evidence"));
    await expect(page.getByTestId("scene3d-analysis-evidence-published")).toBeVisible();

    const evidence = await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const artifact = useMapExplorerStore.getState().mapEvidenceArtifacts[0];
      return {
        kind: artifact?.kind ?? null,
        executionCrs: artifact?.metadata?.execution_crs ?? null,
        retainsContext: artifact?.metadata?.clip_retains_analyzed_geometry ?? null,
      };
    });
    expect(evidence.kind).toBe("workflow-result");
    expect(evidence.executionCrs).toBe("EPSG:32635");
    expect(evidence.retainsContext).toBe(true);
  });
});