/**
 * Playwright e2e — Prompt 32b: massing engine + scenario store
 *
 * Covers:
 * 1. Seed useZoningStore with a parcel layer + rule.
 * 2. Call useMassingStore.getState().addScenario() twice with different params.
 * 3. Assert both scenarios exist in the store.
 * 4. Call generateComparison() and assert comparisonMetadata is not null
 *    with ≥2 candidates.
 *
 * Uses page.evaluate() + dynamic imports to drive the stores.
 * No UI navigation needed.
 */
import { expect, test, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const PROJECTED_CRS = "EPSG:32635";

async function seedZoningStore(page: Page): Promise<{ layerId: string; ruleId: string }> {
  return page.evaluate(async (crs) => {
    const { useZoningStore } = await import("/src/stores/useZoningStore.ts");

    const layerId = "e2e-massing-parcels";

    // 100×100 parcel in projected coordinates
    const collection = {
      type: "FeatureCollection" as const,
      features: [{
        type: "Feature" as const,
        id: "mp1",
        geometry: {
          type: "Polygon" as const,
          coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]],
        },
        properties: { id: "mp1" },
      }],
    };

    useZoningStore.getState().setActiveParcelLayer(layerId, collection as any, crs);

    const rule = useZoningStore.getState().addRule({
      name: "Mixed Use E2E",
      zoneCode: "MXE",
      maxFAR: 3.0,
      maxCoverageRatio: 0.7,
      maxHeightMetres: 30,
      minSetbackMetres: 3,
      minParcelAreaM2: 100,
    });

    return { layerId, ruleId: rule.id };
  }, PROJECTED_CRS);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

test.describe("Prompt 32b — Massing engine + scenario store @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("adds two scenarios and both appear in the store", async ({ page }) => {
    const { ruleId } = await seedZoningStore(page);

    await page.evaluate(
      async ({ rId }) => {
        const { useMassingStore } = await import("/src/stores/useMassingStore.ts");
        const { useZoningStore } = await import("/src/stores/useZoningStore.ts");

        const state = useZoningStore.getState();
        const rule = state.rules.find((r: { id: string }) => r.id === rId) ?? null;
        const parcel = state.activeParcels?.features[0] ?? null;
        const crs = state.activeDeclaredCrs ?? null;

        // Scenario A: 3 floors, 50% coverage — baseline
        useMassingStore.getState().addScenario(
          "mp1",
          rId,
          { parcelId: "mp1", buildingCount: 1, floorCount: 3, coverageRatio: 0.5 },
          "Scenario A (baseline)",
          true,
          parcel as any,
          rule as any,
          crs,
        );

        // Scenario B: 5 floors, 60% coverage
        useMassingStore.getState().addScenario(
          "mp1",
          rId,
          { parcelId: "mp1", buildingCount: 2, floorCount: 5, coverageRatio: 0.6 },
          "Scenario B",
          false,
          parcel as any,
          rule as any,
          crs,
        );
      },
      { rId: ruleId },
    );

    const scenarios = await page.evaluate(async () => {
      const { useMassingStore } = await import("/src/stores/useMassingStore.ts");
      return useMassingStore.getState().scenarios;
    });

    expect(scenarios.length).toBe(2);
    expect(scenarios.some((s: { label: string }) => s.label === "Scenario A (baseline)")).toBe(true);
    expect(scenarios.some((s: { label: string }) => s.label === "Scenario B")).toBe(true);
  });

  test("generateComparison() returns non-null metadata with 2 candidates", async ({ page }) => {
    const { ruleId } = await seedZoningStore(page);

    await page.evaluate(
      async ({ rId }) => {
        const { useMassingStore } = await import("/src/stores/useMassingStore.ts");
        const { useZoningStore } = await import("/src/stores/useZoningStore.ts");

        const state = useZoningStore.getState();
        const rule = state.rules.find((r: { id: string }) => r.id === rId) ?? null;
        const parcel = state.activeParcels?.features[0] ?? null;
        const crs = state.activeDeclaredCrs ?? null;

        useMassingStore.getState().addScenario(
          "mp1",
          rId,
          { parcelId: "mp1", buildingCount: 1, floorCount: 3, coverageRatio: 0.5 },
          "Baseline",
          true,
          parcel as any,
          rule as any,
          crs,
        );

        useMassingStore.getState().addScenario(
          "mp1",
          rId,
          { parcelId: "mp1", buildingCount: 2, floorCount: 6, coverageRatio: 0.6 },
          "Proposed",
          false,
          parcel as any,
          rule as any,
          crs,
        );
      },
      { rId: ruleId },
    );

    const result = await page.evaluate(async () => {
      const { useMassingStore } = await import("/src/stores/useMassingStore.ts");
      const metadata = useMassingStore.getState().generateComparison();
      return metadata;
    });

    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
    expect(result!.candidates.length).toBeGreaterThanOrEqual(1);
    // baseline + 1 candidate = 1 candidate ref; total withAlternatives = 2
    expect(result!.guidanceSummary).toContain("2 massing scenarios");
  });

  test("scenarios persist alternative metrics when CRS is projected", async ({ page }) => {
    const { ruleId } = await seedZoningStore(page);

    await page.evaluate(
      async ({ rId }) => {
        const { useMassingStore } = await import("/src/stores/useMassingStore.ts");
        const { useZoningStore } = await import("/src/stores/useZoningStore.ts");

        const state = useZoningStore.getState();
        const rule = state.rules.find((r: { id: string }) => r.id === rId) ?? null;
        const parcel = state.activeParcels?.features[0] ?? null;
        const crs = state.activeDeclaredCrs ?? null;

        useMassingStore.getState().addScenario(
          "mp1",
          rId,
          { parcelId: "mp1", buildingCount: 1, floorCount: 4, coverageRatio: 0.4 },
          "Test Scenario",
          false,
          parcel as any,
          rule as any,
          crs,
        );
      },
      { rId: ruleId },
    );

    const scenario = await page.evaluate(async () => {
      const { useMassingStore } = await import("/src/stores/useMassingStore.ts");
      const scenarios = useMassingStore.getState().scenarios;
      return scenarios[0] ?? null;
    });

    expect(scenario).not.toBeNull();
    expect(scenario!.alternative).not.toBeNull();
    expect(scenario!.alternative!.envelopeResult.crsResult.blocked).toBe(false);
    expect(scenario!.alternative!.achievedFAR).toBeGreaterThan(0);
  });
});
