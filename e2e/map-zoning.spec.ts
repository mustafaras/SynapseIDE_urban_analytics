/**
 * Playwright e2e — Prompt 31: block/parcel model + zoning rule engine
 *
 * Covers:
 * 1. Add a zoning rule to the rule library.
 * 2. Assign the rule to a parcel — assert metrics (FAR/coverage) appear.
 * 3. Assert execution CRS label is shown (not "blocked").
 * 4. Geographic CRS (EPSG:4326) parcels → metrics blocked with CRS caveat.
 */
import { expect, test, type Page } from "@playwright/test";

const PARCEL_LAYER_ID = "e2e-zoning-parcels";

async function seedParcelLayer(page: Page, declaredCrs: string | null): Promise<void> {
  await page.evaluate(
    async ({ layerId, crs }) => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      const collection = {
        type: "FeatureCollection" as const,
        features: Array.from({ length: 4 }, (_, i) => ({
          type: "Feature" as const,
          id: String(i + 1),
          geometry: {
            type: "Polygon" as const,
            coordinates: [[
              [i * 100, 0],
              [i * 100 + 80, 0],
              [i * 100 + 80, 120],
              [i * 100, 120],
              [i * 100, 0],
            ]],
          },
          properties: { id: i + 1 },
        })),
      };
      useZoningStore.getState().setActiveParcelLayer(layerId, collection as any, crs);
    },
    { layerId: PARCEL_LAYER_ID, crs: declaredCrs },
  );
}

async function addTestRule(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
    const rule = useZoningStore.getState().addRule({
      name: "Mixed Use 1",
      zoneCode: "MX1",
      maxFAR: 3.0,
      maxCoverageRatio: 0.7,
      maxHeightMetres: 20,
      minSetbackMetres: 2,
      minParcelAreaM2: 100,
    });
    return rule.id;
  });
}

test.describe("Prompt 31 — Zoning rule engine @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("add a rule and verify it appears in the store", async ({ page }) => {
    const ruleId = await addTestRule(page);
    const rules = await page.evaluate(async () => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      return useZoningStore.getState().rules;
    });
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules.some((r) => r.id === ruleId)).toBe(true);
    expect(rules.find((r) => r.id === ruleId)?.zoneCode).toBe("MX1");
  });

  test("assign a rule to a parcel and verify metrics + CRS label", async ({ page }) => {
    await seedParcelLayer(page, "EPSG:32635");
    const ruleId = await addTestRule(page);

    await page.evaluate(async (rId) => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      useZoningStore.getState().assignRule("1", rId);
    }, ruleId);

    const state = await page.evaluate(async () => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      const s = useZoningStore.getState();
      const assignment = s.assignments.find((a) => String(a.parcelFeatureId) === "1");
      return {
        assigned: !!assignment,
        metrics: assignment?.metrics ?? null,
        executionCrs: assignment?.metrics?.crsResult.executionCrs ?? null,
        blocked: assignment?.metrics?.crsResult.blocked ?? null,
      };
    });

    expect(state.assigned).toBe(true);
    expect(state.blocked).toBe(false);
    expect(state.metrics?.existingFAR).not.toBeNull();
    expect(state.metrics?.existingCoverage).not.toBeNull();
    // CRS label should be a projected CRS code
    expect(state.executionCrs).toBeTruthy();
    expect(state.executionCrs).not.toBe("blocked");
  });

  test("geographic CRS (EPSG:4326) blocks metric compute", async ({ page }) => {
    await seedParcelLayer(page, "EPSG:4326");
    const ruleId = await addTestRule(page);

    await page.evaluate(async (rId) => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      useZoningStore.getState().assignRule("1", rId);
    }, ruleId);

    const result = await page.evaluate(async () => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      const s = useZoningStore.getState();
      const assignment = s.assignments.find((a) => String(a.parcelFeatureId) === "1");
      return {
        blocked: assignment?.metrics?.crsResult.blocked ?? null,
        far: assignment?.metrics?.existingFAR ?? "none",
        caveats: assignment?.metrics?.caveats ?? [],
      };
    });

    expect(result.blocked).toBe(true);
    expect(result.far).toBe(null);
    expect(result.caveats.length).toBeGreaterThan(0);
  });

  test("FAR/coverage math is correct with known geometry", async ({ page }) => {
    // 100×100 parcel + 40×40 building with 2 floors
    // FAR = (40×40×2)/(100×100) = 3200/10000 = 0.32
    // coverage = (40×40)/(100×100) = 1600/10000 = 0.16
    await page.evaluate(async (layerId) => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      const collection = {
        type: "FeatureCollection" as const,
        features: [{
          type: "Feature" as const,
          id: "p1",
          geometry: {
            type: "Polygon" as const,
            coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]],
          },
          properties: { id: "p1" },
        }],
      };
      useZoningStore.getState().setActiveParcelLayer(layerId, collection as any, "EPSG:32635");
      const building: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[10, 10], [50, 10], [50, 50], [10, 50], [10, 10]]],
        },
        properties: { floors: 2 },
      };
      useZoningStore.getState().assignRule("p1", "none-rule", [building as any]);
    }, PARCEL_LAYER_ID + "-math");

    // Since we passed a non-existent rule ID ("none-rule"), rule will be null.
    // The area and coverage should still be computed.
    const metrics = await page.evaluate(async () => {
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");
      const s = useZoningStore.getState();
      const assignment = s.assignments.find((a) => String(a.parcelFeatureId) === "p1");
      return assignment?.metrics ?? null;
    });

    expect(metrics).not.toBeNull();
    expect(metrics?.parcelAreaM2).toBe(10_000);
    // building footprint = 40×40 = 1600, floors = 2 (from properties)
    expect(metrics?.buildingFootprintAreaM2).toBeCloseTo(1_600, 0);
    expect(metrics?.existingFAR).toBeCloseTo(0.32, 2);
    expect(metrics?.existingCoverage).toBeCloseTo(0.16, 2);
  });
});
