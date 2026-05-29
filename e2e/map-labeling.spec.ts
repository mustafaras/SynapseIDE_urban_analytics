import { expect, test } from "@playwright/test";
import { resetWorkbenchState } from "./helpers/urbanAnalytics";

/**
 * Prompt 47 — labeling engine, collision handling, and scale ranges.
 *
 * Proof: enable `name` labels on the canonical fcPointsWGS84 fixture,
 * zoom below the label scale range, and assert overlapping label candidates
 * are culled while the serialized report/export legend carries the label rule.
 */
test.describe("Map Explorer — labeling engine @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkbenchState(page);
  });

  test("name labels serialize, gate by zoom, and cull overlap", async ({ page }) => {
    const proof = await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const { buildMapCompositionLegendItems } = await import("/src/services/map/MapExportService.ts");
      const {
        buildLayerStyleUpdate,
        getDefaultLayerStyleOptions,
      } = await import("/src/centerpanel/components/map/inspector/style/legendContract.ts");
      const {
        cullOverlappingLabelCandidates,
        getSerializedMapLabelSpecFromStyle,
        isLabelVisibleAtZoom,
      } = await import("/src/services/map/labels/MapLabelEngine.ts");
      const { fcPointsWGS84 } = await import("/src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts");

      const layer = {
        id: "e2e-label-points",
        name: "E2E label points",
        type: "geojson" as const,
        visible: true,
        opacity: 0.9,
        sourceKind: "imported" as const,
        sourceData: fcPointsWGS84,
        metadata: {
          geometryType: "Point",
          featureCount: fcPointsWGS84.features.length,
          fields: ["id", "name", "value", "date"],
          crsSummary: {
            crs: "EPSG:4326",
            status: "known" as const,
            source: "explicit" as const,
            notes: [],
          },
        },
      };
      const update = buildLayerStyleUpdate(layer, {
        ...getDefaultLayerStyleOptions(layer),
        mode: "single",
        labelsEnabled: true,
        labelField: "name",
        labelCollisionPolicy: "hide-on-overlap",
        labelMinZoom: 11,
        labelMaxZoom: 16,
      }, "2026-05-23T00:00:00.000Z");
      useMapExplorerStore.getState().addOverlayLayer({
        ...layer,
        opacity: update.opacity,
        style: update.style,
        metadata: {
          ...layer.metadata,
          ...update.metadataPatch,
        },
      });

      const storedLayer = useMapExplorerStore.getState().overlayLayers.find((entry) => entry.id === layer.id)!;
      const labelSpec = getSerializedMapLabelSpecFromStyle(storedLayer.style)!;
      const candidates = fcPointsWGS84.features.slice(0, 5).map((feature, index) => ({
        id: String(feature.properties?.id ?? index),
        text: String(feature.properties?.name ?? ""),
        x: 20 + (index < 3 ? index * 6 : index * 70),
        y: 20,
        width: 68,
        height: 14,
        priority: Number(feature.properties?.value ?? 0),
      }));
      const culled = cullOverlappingLabelCandidates(candidates, labelSpec.collisionPolicy);
      const legend = buildMapCompositionLegendItems([storedLayer]);

      return {
        labelField: labelSpec.field,
        zoomOutVisible: isLabelVisibleAtZoom(labelSpec, 9),
        labelZoomVisible: isLabelVisibleAtZoom(labelSpec, 12),
        visibleCount: culled.visible.length,
        hiddenCount: culled.hidden.length,
        legendHasLabelRule: legend.some((item) => item.kind === "label" && item.label === "Labels: name"),
      };
    });

    expect(proof.labelField).toBe("name");
    expect(proof.zoomOutVisible).toBe(false);
    expect(proof.labelZoomVisible).toBe(true);
    expect(proof.hiddenCount).toBeGreaterThan(0);
    expect(proof.visibleCount).toBeLessThan(5);
    expect(proof.legendHasLabelRule).toBe(true);
  });
});
