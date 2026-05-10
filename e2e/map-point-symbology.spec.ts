import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

function createPointSymbologyFixture() {
  const features = Array.from({ length: 24 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    return {
      type: "Feature",
      id: `sensor-${index + 1}`,
      geometry: {
        type: "Point",
        coordinates: [28.965 + column * 0.006, 41.0 + row * 0.006],
      },
      properties: {
        name: `Sensor ${index + 1}`,
        magnitude: 10 + index * 5,
        secondary: 100 - index * 2,
        optionalScore: index % 5 === 0 ? null : index + 1,
      },
    };
  });

  return {
    name: "point-symbols.geojson",
    mimeType: "application/geo+json",
    buffer: Buffer.from(JSON.stringify({ type: "FeatureCollection", features })),
  };
}

test.describe("Map Explorer point symbology", () => {
  test("exposes heatmap, proportional, and graduated symbol controls for an imported point layer", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());

    await triggerDomClick(page.getByRole("button", {
      name: /Import GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, and GPX files|Open spatial data import options/i,
    }));
    const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
    await expect(importHub).toBeVisible();

    const [importChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      importHub.getByRole("button", { name: "Browse Local File" }).click(),
    ]);
    await importChooser.setFiles(createPointSymbologyFixture());

    await expect(page.getByTestId("toast").filter({ hasText: /Imported point-symbols \(24 features\)\./i }).first()).toBeVisible();
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("point-symbols");

    await triggerDomClick(page.getByRole("button", { name: "Open symbology panel for point-symbols" }));
    const symbology = page.getByRole("dialog", { name: "Point symbology configuration" });
    await expect(symbology).toBeVisible();
    await expect(symbology).toContainText("point-symbols");

    await expect(symbology.getByRole("button", { name: "Heatmap" })).toHaveAttribute("aria-pressed", "true");
    await expect(symbology.getByLabel("Weight field")).toContainText("magnitude");
    await symbology.getByLabel("Gradient").selectOption("plasma");
    await expect(symbology.getByLabel("Gradient")).toHaveValue("plasma");
    await expect(symbology.getByLabel(/Radius:/)).toBeVisible();
    await expect(symbology.getByLabel(/Intensity:/)).toBeVisible();
    await expect(symbology.getByLabel(/Opacity:/)).toBeVisible();
    await expect(symbology.getByLabel(/Transition zoom:/)).toBeVisible();
    await expect(symbology.getByLabel("Scale heatmap radius with zoom")).toBeChecked();

    await triggerDomClick(symbology.getByRole("button", { name: "Proportional" }));
    await expect(symbology.getByRole("button", { name: "Proportional" })).toHaveAttribute("aria-pressed", "true");
    await expect(symbology.getByLabel("Value field")).toHaveValue("magnitude");
    await expect(symbology.getByLabel(/Min radius:/)).toBeVisible();
    await expect(symbology.getByLabel(/Max radius:/)).toBeVisible();
    await symbology.getByLabel("Color by").selectOption("attribute");
    await expect(symbology.getByLabel("Secondary attribute")).toHaveValue("secondary");
    await symbology.getByLabel("Sequential ramp").selectOption("Blues");
    await expect(symbology.getByLabel("Sequential ramp")).toHaveValue("Blues");
    await triggerDomClick(symbology.getByLabel("Cluster points at low zoom"));
    await expect(symbology.getByLabel(/Cluster max zoom:/)).toBeVisible();

    await triggerDomClick(symbology.getByRole("button", { name: "Graduated" }));
    await expect(symbology.getByRole("button", { name: "Graduated" })).toHaveAttribute("aria-pressed", "true");
    await symbology.getByLabel("Classification").selectOption("natural-breaks");
    await expect(symbology.getByLabel("Classification")).toHaveValue("natural-breaks");
    await symbology.getByLabel("Classes").selectOption("5");
    await expect(symbology.getByLabel("Classes")).toHaveValue("5");
    await expect(symbology.getByLabel("Sequential ramp")).toBeVisible();
    await expect(symbology.getByText("Legend", { exact: true })).toBeVisible();
    await expect(symbology.getByText(/to/).first()).toBeVisible();
  });
});
