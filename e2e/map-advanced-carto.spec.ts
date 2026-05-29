import { expect, test } from "@playwright/test";
import { resetWorkbenchState } from "./helpers/urbanAnalytics";

/**
 * Prompt 48 — advanced cartography renderers with QA caveats.
 *
 * Proof: apply a bivariate renderer to fcPolygonsProjected and assert the
 * serialized 2x2 legend is what report/export surfaces receive; then apply
 * dot-density without area normalization and assert the caveat is emitted.
 */
test.describe("Map Explorer — advanced cartography @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkbenchState(page);
  });

  test("bivariate legend and dot-density caveat serialize from fcPolygonsProjected", async ({ page }) => {
    const proof = await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const { buildMapCompositionLegendItems } = await import("/src/services/map/MapExportService.ts");
      const { generateMapCartographyReview } = await import("/src/services/map/MapCartographyAdvisor.ts");
      const {
        DOT_DENSITY_NORMALIZATION_CAVEAT,
        getSerializedAdvancedCartographySpecFromStyle,
      } = await import("/src/services/map/cartography/AdvancedCartographyEngine.ts");
      const {
        buildLayerStyleUpdate,
        getDefaultLayerStyleOptions,
      } = await import("/src/centerpanel/components/map/inspector/style/legendContract.ts");
      const { fcPolygonsProjected } = await import("/src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts");

      const sourceData = {
        ...fcPolygonsProjected.featureCollection,
        features: fcPolygonsProjected.featureCollection.features.map((feature, index) => ({
          ...feature,
          properties: {
            ...(feature.properties ?? {}),
            risk_score: 10 + index * 4,
            population: 1_000 + index * 500,
          },
        })),
      };
      const layer = {
        id: "e2e-advanced-polygons",
        name: "E2E advanced polygons",
        type: "geojson" as const,
        visible: true,
        opacity: 0.9,
        sourceKind: "imported" as const,
        sourceData,
        metadata: {
          geometryType: "Polygon",
          featureCount: sourceData.features.length,
          fields: ["id", "zone", "area_m2", "risk_score", "population"],
          crsSummary: {
            crs: fcPolygonsProjected.declaredCrs,
            status: "known" as const,
            source: "explicit" as const,
            notes: [],
          },
        },
      };

      const bivariateUpdate = buildLayerStyleUpdate(layer, {
        ...getDefaultLayerStyleOptions(layer),
        mode: "bivariate-choropleth",
        field: "area_m2",
        secondaryField: "risk_score",
      }, "2026-05-29T00:00:00.000Z");
      const bivariateLayer = {
        ...layer,
        opacity: bivariateUpdate.opacity,
        style: bivariateUpdate.style,
        metadata: {
          ...layer.metadata,
          ...bivariateUpdate.metadataPatch,
        },
      };
      useMapExplorerStore.getState().addOverlayLayer(bivariateLayer);
      const bivariateLegend = buildMapCompositionLegendItems([bivariateLayer]);

      const dotUpdate = buildLayerStyleUpdate(layer, {
        ...getDefaultLayerStyleOptions(layer),
        mode: "dot-density",
        field: "population",
        dotValuePerDot: 1_000,
      }, "2026-05-29T00:00:00.000Z");
      const dotLayer = {
        ...layer,
        id: "e2e-dot-density-polygons",
        name: "E2E dot density polygons",
        opacity: dotUpdate.opacity,
        style: dotUpdate.style,
        metadata: {
          ...layer.metadata,
          ...dotUpdate.metadataPatch,
        },
      };
      useMapExplorerStore.getState().addOverlayLayer(dotLayer);
      const review = generateMapCartographyReview([dotLayer], {
        now: new Date("2026-05-29T00:00:00.000Z"),
      });
      const dotSpec = getSerializedAdvancedCartographySpecFromStyle(dotLayer.style);

      return {
        bivariateCellCount: bivariateLegend.filter((item) => item.kind === "bivariate").length,
        bivariateGridCoordinates: bivariateUpdate.legendSpec.entries
          .filter((entry) => entry.kind === "bivariate" && !entry.noData)
          .map((entry) => `${entry.gridColumn}:${entry.gridRow}`)
          .sort(),
        dotMode: dotSpec?.mode,
        dotLegendHasCaveat: dotUpdate.warnings.includes(DOT_DENSITY_NORMALIZATION_CAVEAT),
        advisorHasCaveat: review.recommendations.some((entry) => entry.type === "advanced-renderer-caveat"),
      };
    });

    expect(proof.bivariateCellCount).toBe(4);
    expect(proof.bivariateGridCoordinates).toEqual(["1:1", "1:2", "2:1", "2:2"]);
    expect(proof.dotMode).toBe("dot-density");
    expect(proof.dotLegendHasCaveat).toBe(true);
    expect(proof.advisorHasCaveat).toBe(true);
  });
});
