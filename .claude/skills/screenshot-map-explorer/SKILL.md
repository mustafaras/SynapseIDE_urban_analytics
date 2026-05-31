---
name: screenshot-map-explorer
description: Launch the Urban Analytics Workbench and capture Map Explorer or GIS modal screenshots for premium visual QA. Use when asked to show, screenshot, visually verify, compare, or prove Map Explorer UI changes including activity rail, command center, sidebar, inspector, bottom panel, map canvas, legend, QA chips, motion, reduced-motion, high-contrast, or viewport behavior.
---

# Screenshot the Map Explorer

Use this to produce visual proof for Map Explorer work. It is especially important for `GIS_MODAL_PREMIUM_UI_PLAN_2026-05-31` prompts that change visible UI, motion, density, accessibility, or layout.

## Launch Model

`playwright.config.ts` starts Vite automatically on `127.0.0.1:4173` with `reuseExistingServer: true`. Do not start a separate dev server unless Playwright cannot boot one. First mount can take about a minute.

Use a temporary spec under `e2e/`, write screenshots to `e2e/__screens__/`, inspect the PNGs, then delete the temporary spec. Screenshots are generated artifacts and must not be committed.

## Open the GIS Modal

Reuse helpers; do not reimplement the Urban Analytics path.

```ts
import { expect, test } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function openMapExplorer(page) {
  await resetWorkbenchState(page);
  await page.setViewportSize({ width: 1680, height: 1100 });

  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(
    urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }),
  );

  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  return mapExplorer;
}
```

## Seed Useful Map State

Seed directly through `useMapExplorerStore` when the goal is visual proof, not import-flow testing.

```ts
await page.evaluate(async () => {
  const m = await import("/src/stores/useMapExplorerStore.ts");
  m.useMapExplorerStore.getState().addOverlayLayer({
    id: "visual-proof-layer",
    name: "Long district parcel readiness layer",
    type: "geojson",
    visible: true,
    opacity: 0.88,
    group: "data",
    sourceKind: "imported",
    sourceData: { type: "FeatureCollection", features: [] },
    metadata: {
      geometryType: "Polygon",
      featureCount: 12,
      fields: ["id", "zone", "area_m2"],
      crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
    },
  });
});
```

For scientific truthfulness screenshots, include at least one state that should remain visible: unknown CRS, user-declared CRS, demo, synthetic, sample, generated, external, metadata-only, unavailable, noData, or QA blocker.

## Premium Visual QA Matrix

Capture only the states relevant to the prompt, but prefer this matrix for layout work:

```ts
const viewports = [
  { name: "desktop", width: 1680, height: 1100 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "short", width: 1280, height: 600 },
];
```

Proof targets:

- active activity rail state is obvious and keyboard focus is visible
- command center does not wrap into the canvas
- left sidebar and right inspector do not cover map controls
- bottom panel does not cover the status bar
- long layer/source names wrap without pushing action controls
- demo/CRS/QA/provider chips remain visible in compact rows
- map canvas is nonblank when data is seeded
- reduced motion disables non-essential animation
- high contrast does not rely on color alone

Reduced-motion capture:

```ts
await page.emulateMedia({ reducedMotion: "reduce" });
await page.screenshot({ path: "e2e/__screens__/pNN-reduced-motion.png" });
```

High-contrast capture, where supported by the installed Playwright version:

```ts
await page.emulateMedia({ forcedColors: "active" });
await page.screenshot({ path: "e2e/__screens__/pNN-high-contrast.png" });
```

## Stable Handles

Prefer roles and existing `data-testid` values:

| Surface | Handle |
| --- | --- |
| Map Explorer dialog | `getByRole("dialog", { name: "Map Explorer" })` |
| Layer list | `getByRole("list", { name: "Layer list" })` |
| Layer row | `getByRole("option", { name: /Layer:/i })` |
| Inspect layer | `getByTestId("map-layer-inspect-trigger")` |
| Layer inspector | `getByTestId("map-layer-inspector")` |
| Inspector tab | `getByTestId("map-layer-inspector-tab-<id>")` |
| Style editor | `getByTestId("map-layer-style-editor")` |
| Legend overlay | `getByTestId("map-legend-overlay")` |

Use `triggerDomClick(locator)` for controls inside details/menu/listbox patterns.

## Run and Inspect

```bash
npx playwright test e2e/<temporary-visual-proof>.spec.ts
```

Then inspect each PNG. A blank map frame, clipped header, hidden disabled reason, or missing caveat chip is a failed visual proof even if the Playwright command exits successfully.

## Closeout

- Delete the temporary spec.
- Leave `e2e/__screens__/` uncommitted.
- Record screenshot names and what they prove in the GIS modal ledger.
- If screenshots expose a defect outside the current prompt, log it as residual risk or a blocker instead of silently expanding scope.
