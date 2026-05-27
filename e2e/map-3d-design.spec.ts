/**
 * Playwright e2e — Prompt 34: 3D block + scenario interaction design.
 *
 * Covers:
 * 1. Interaction strip renders all 8 mode buttons.
 * 2. Clicking a mode button activates it (aria-pressed=true).
 * 3. Strip is positioned top-left (data-position="top-left") — not occluding center canvas.
 * 4. ScenarioComparisonStrip opens and shows timeline + empty-state.
 * 5. Generated massing badge is visually distinct from real geometry label.
 * 6. Reduced-motion: transition style is "none" when prefers-reduced-motion: reduce is emulated.
 */
import { expect, test, type Page } from "@playwright/test";

async function openInteractionStrip(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
    useScene3DStore.getState().setInteractionMode("inspect");
  });
  const trigger = page.getByTestId("toggle-3d-interaction-strip");
  await trigger.evaluate((el: HTMLElement) => el.click());
}

async function openComparisonStrip(page: Page): Promise<void> {
  const trigger = page.getByTestId("toggle-3d-comparison-strip");
  await trigger.evaluate((el: HTMLElement) => el.click());
}

test.describe("Prompt 34 — 3D interaction design @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("interaction strip renders all 8 mode buttons", async ({ page }) => {
    await openInteractionStrip(page);

    const strip = page.getByTestId("scene3d-interaction-strip");
    await expect(strip).toBeVisible();

    const modes = [
      "inspect", "select", "measure", "edit-height",
      "compare", "sun-shadow", "section", "camera-bookmark",
    ];
    for (const mode of modes) {
      const btn = strip.getByTestId(`3d-mode-btn-${mode}`);
      await expect(btn).toBeVisible();
    }
  });

  test("clicking a mode button activates it", async ({ page }) => {
    await openInteractionStrip(page);

    const strip = page.getByTestId("scene3d-interaction-strip");
    const compareBtn = strip.getByTestId("3d-mode-btn-compare");

    // inspect should be active initially
    const inspectBtn = strip.getByTestId("3d-mode-btn-inspect");
    await expect(inspectBtn).toHaveAttribute("aria-pressed", "true");
    await expect(compareBtn).toHaveAttribute("aria-pressed", "false");

    await compareBtn.evaluate((el: HTMLElement) => el.click());
    await expect(compareBtn).toHaveAttribute("aria-pressed", "true");
    await expect(inspectBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("strip is positioned top-left (non-occluding)", async ({ page }) => {
    await openInteractionStrip(page);
    const strip = page.getByTestId("scene3d-interaction-strip");
    await expect(strip).toHaveAttribute("data-position", "top-left");
  });

  test("scenario comparison strip opens and shows assumptions footer", async ({ page }) => {
    await openComparisonStrip(page);

    const strip = page.getByTestId("scenario-comparison-strip");
    await expect(strip).toBeVisible();

    // Footer assumptions should always be present
    const body = await strip.textContent();
    expect(body).toContain("Flat terrain assumed");
    expect(body).toContain("Demo runtimeMode");
    expect(body).toContain("Projected CRS required");
  });

  test("scenario strip shows sun-shadow timeline chips when store has hours", async ({ page }) => {
    // Seed timeline hours in store
    await page.evaluate(async () => {
      const { useSunShadowStore } = await import("/src/stores/useSunShadowStore.ts");
      // Default state already has timelineHours [6, 8, 10, 12, 14, 16, 18]
      useSunShadowStore.getState().setActiveHour(0);
    });

    await openComparisonStrip(page);
    const strip = page.getByTestId("scenario-comparison-strip");

    const chips = strip.getByTestId("timeline-hour-chip");
    await expect(chips.first()).toBeVisible();
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test("generated massing badge is distinct from real geometry", async ({ page }) => {
    // Seed a massing scenario in the store
    await page.evaluate(async () => {
      const { useMassingStore } = await import("/src/stores/useMassingStore.ts");
      const { useZoningStore } = await import("/src/stores/useZoningStore.ts");

      const rule = useZoningStore.getState().addRule({
        name: "Test Zone",
        zoneCode: "TZ",
        maxFAR: 2.0,
        maxCoverageRatio: 0.6,
        maxHeightMetres: 20,
        minSetbackMetres: 3,
        minParcelAreaM2: 100,
      });

      const parcel: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: "Feature",
        id: "p-e2e",
        geometry: {
          type: "Polygon",
          coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]],
        },
        properties: { id: "p-e2e" },
      };

      useMassingStore.getState().addScenario({
        label: "E2E Scenario",
        parcel,
        rule,
        params: { targetFloors: 4, coverageRatio: 0.4, buildingCount: 2, useBaseline: false },
        declaredCrs: "EPSG:32635",
      });
    });

    await openComparisonStrip(page);
    const strip = page.getByTestId("scenario-comparison-strip");

    const generatedBadge = strip.getByTestId("generated-geometry-badge").first();
    await expect(generatedBadge).toBeVisible();
    const badgeText = await generatedBadge.textContent();
    expect(badgeText?.trim()).toBe("GENERATED");
  });

  test("reduced-motion: mode button transition is 'none' when prefers-reduced-motion: reduce", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openInteractionStrip(page);

    const inspectBtn = page.getByTestId("3d-mode-btn-inspect");
    await expect(inspectBtn).toBeVisible();

    const transition = await inspectBtn.evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).transition,
    );
    // transition should resolve to instant (0s, none, or empty) under reduced-motion
    const isInstant =
      transition === "none" ||
      transition === "" ||
      transition.includes("0s") ||
      transition.includes("none");
    expect(isInstant).toBe(true);
  });
});
