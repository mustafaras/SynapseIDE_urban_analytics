/**
 * Playwright e2e — Prompt 33: Sun/Shadow analysis timeline + evidence assumptions
 *
 * Covers:
 * 1. Solar positions: noon > morning altitude; night < 0
 * 2. Shadow analysis: 10m building at 45° → ~10m shadow, runtimeMode="demo"
 * 3. Store timeline scrub: scenarios are added and have assumptions
 *
 * Uses page.evaluate() + dynamic imports. No UI navigation needed.
 */
import { expect, test } from "@playwright/test";

test.describe("Prompt 33 — sun/shadow timeline + evidence assumptions @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("solar positions: noon > morning, night below horizon", async ({ page }) => {
    const positions = await page.evaluate(async () => {
      const { computeSolarPosition } = await import(
        "/src/services/map/scene3d/SolarPositionService.ts"
      );
      const morning = computeSolarPosition(41.0, 28.9, "2026-06-21T08:00:00Z");
      const noon = computeSolarPosition(41.0, 28.9, "2026-06-21T10:00:00Z");
      const night = computeSolarPosition(41.0, 28.9, "2026-06-21T00:00:00Z");
      return { morning, noon, night };
    });

    expect(positions.noon.altitudeDeg).toBeGreaterThan(positions.morning.altitudeDeg);
    expect(positions.night.altitudeDeg).toBeLessThan(0);
  });

  test("shadow analysis: 10m building, 45° sun → ~10m shadow, demo mode", async ({ page }) => {
    const shadow = await page.evaluate(async () => {
      const { computeShadowAnalysis } = await import(
        "/src/services/map/scene3d/SunShadowEngine.ts"
      );
      const building = {
        type: "Feature" as const,
        id: "b1",
        geometry: {
          type: "Polygon" as const,
          coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        },
        properties: {},
      };
      const solar = { altitudeDeg: 45, azimuthDeg: 180, zenithDeg: 45 };
      const result = computeShadowAnalysis({
        buildings: [building as any],
        heightsM: [10],
        parcelAreaM2: 10_000,
        solarPosition: solar,
        dateTime: "2026-06-21T12:00:00Z",
        geometrySource: "user-provided" as const,
      });
      return {
        shadowLengthM: result.buildingResults[0]?.shadowLengthM,
        sunBelowHorizon: result.sunBelowHorizon,
        runtimeMode: result.assumptions.runtimeMode,
        solarModel: result.assumptions.solarModel,
        verticalDatum: result.assumptions.verticalDatum,
        caveatsCount: result.caveats.length,
      };
    });

    // tan(45°) = 1 → shadow length = height / 1 = 10m
    expect(shadow.shadowLengthM).toBeCloseTo(10, 0);
    expect(shadow.sunBelowHorizon).toBe(false);
    expect(shadow.runtimeMode).toBe("demo");
    expect(shadow.solarModel).toBe("simplified-declination-hour-angle");
    expect(shadow.verticalDatum).toBe("assumed-flat-terrain");
    expect(shadow.caveatsCount).toBeGreaterThan(0);
  });

  test("store: addScenario, setActiveHour, scenarios have assumptions", async ({ page }) => {
    const storeResult = await page.evaluate(async () => {
      const { useSunShadowStore } = await import("/src/stores/useSunShadowStore.ts");
      const building = {
        type: "Feature" as const,
        id: "b1",
        geometry: {
          type: "Polygon" as const,
          coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        },
        properties: {},
      };

      const store = useSunShadowStore.getState();
      store.addScenario([building as any], [10], 10_000, "E2E morning test");

      // setActiveHour to index 0 (first hour, e.g. 6am)
      store.setActiveHour(0);
      const state0 = useSunShadowStore.getState();
      const sc0 = state0.scenarios[0];

      // setActiveHour to index 3 (midday)
      useSunShadowStore.getState().setActiveHour(3);
      const state1 = useSunShadowStore.getState();
      const sc1 = state1.scenarios[0];

      return {
        scenarioCount: state1.scenarios.length,
        hasAssumptions: !!sc0?.result?.assumptions,
        assumptionsSolarModel: sc0?.result?.assumptions?.solarModel,
        assumptionsRuntimeMode: sc0?.result?.assumptions?.runtimeMode,
        assumptionsPresent: !!sc1?.result?.assumptions,
        activeHourIndex: state1.activeHourIndex,
        timelineHoursLength: state1.timelineHours.length,
      };
    });

    expect(storeResult.scenarioCount).toBeGreaterThanOrEqual(1);
    expect(storeResult.hasAssumptions).toBe(true);
    expect(storeResult.assumptionsSolarModel).toBe("simplified-declination-hour-angle");
    expect(storeResult.assumptionsRuntimeMode).toBe("demo");
    expect(storeResult.assumptionsPresent).toBe(true);
    expect(storeResult.activeHourIndex).toBe(3);
    expect(storeResult.timelineHoursLength).toBeGreaterThan(0);
  });

  test("publishEvidence returns payload with expected fields", async ({ page }) => {
    const evidenceResult = await page.evaluate(async () => {
      const { useSunShadowStore } = await import("/src/stores/useSunShadowStore.ts");
      const building = {
        type: "Feature" as const,
        id: "b2",
        geometry: {
          type: "Polygon" as const,
          coordinates: [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]],
        },
        properties: {},
      };

      const store = useSunShadowStore.getState();
      const scenario = store.addScenario([building as any], [8], 5000, "Evidence test");
      const payload = useSunShadowStore.getState().publishEvidence(scenario.id);

      return {
        hasEvidenceId: typeof payload.evidenceId === "string" && payload.evidenceId.length > 0,
        runtimeMode: payload.runtimeMode,
        solarModel: payload.solarModel,
        crs: payload.crs,
        hasCaveats: payload.caveats.length > 0,
        coverageRatioInRange:
          payload.shadowCoverageRatio >= 0 && payload.shadowCoverageRatio <= 1,
      };
    });

    expect(evidenceResult.hasEvidenceId).toBe(true);
    expect(evidenceResult.runtimeMode).toBe("demo");
    expect(evidenceResult.solarModel).toBe("simplified-declination-hour-angle");
    expect(evidenceResult.crs).toBe("EPSG:4326");
    expect(evidenceResult.hasCaveats).toBe(true);
    expect(evidenceResult.coverageRatioInRange).toBe(true);
  });
});
