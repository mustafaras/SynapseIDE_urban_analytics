---
name: screenshot-map-explorer
description: Launch the Urban Analytics Workbench and drive the Map Explorer to capture screenshots of map/layer/inspector UI. Use when asked to "show", "screenshot", "ss al", or visually verify a Map Explorer change (layer rail, layer inspector, style editor, legend overlay, attribute table, workflow drawer) in the real running app.
---

# Screenshot the Map Explorer

Verified recipe for launching this app and driving the Map Explorer to a
state where a UI change is visible, then screenshotting it. Uses the
existing Playwright + Vite infrastructure — no extra setup.

## How it launches

`playwright.config.ts` auto-starts the app: `npx vite --host 127.0.0.1
--port 4173` (the `webServer` block, `reuseExistingServer: true`). You do
**not** start a dev server yourself — just run a Playwright spec and the
server boots (or an existing one is reused). First mount is heavy (~1 min);
that is normal for this app.

## The recipe

Write a temporary spec under `e2e/`, run it, Read the PNGs, then delete the
spec so it does not join the CI e2e suite (`testDir: ./e2e`).

1. **Open the Map Explorer** — it lives behind the Urban Analytics modal.
   Reuse the helpers; do not re-implement navigation:

   ```ts
   import { expect, test } from "@playwright/test";
   import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

   async function openMapExplorer(page) {
     const urbanModal = await openUrbanAnalyticsWorkbench(page);
     await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
     const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
     await expect(mapExplorer).toBeVisible();
     const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
     await triggerDomClick(exploreButton);
     return mapExplorer;
   }
   ```

   Always `await resetWorkbenchState(page)` before `openMapExplorer`, and
   set a wide viewport: `await page.setViewportSize({ width: 1680, height: 1100 })`.

2. **Seed data** by writing to the store directly — the fastest way to get a
   layer on the map without an import flow. Use a numeric field if you need a
   thematic style:

   ```ts
   await page.evaluate(async () => {
     const m = await import("/src/stores/useMapExplorerStore.ts");
     m.useMapExplorerStore.getState().addOverlayLayer({
       id: "demo", name: "District parcels", type: "geojson",
       visible: true, opacity: 0.88, group: "data", sourceKind: "imported",
       sourceData: { type: "FeatureCollection", features: [/* GeoJSON */] },
       metadata: {
         geometryType: "Polygon", featureCount: 12, fields: ["id", "zone", "area_m2"],
         crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
       },
     });
   });
   ```

3. **Drive to the surface, then `page.screenshot`.** Key handles (stable
   `data-testid` / roles):

   | Surface | How to reach it |
   |---|---|
   | Layer rail (+ per-row legend preview) | visible after seeding; `getByRole("list", { name: "Layer list" })` |
   | Layer row | `getByRole("option", { name: /Layer: <name>/i })` |
   | Open inspector | row → `.getByTestId("map-layer-inspect-trigger")` |
   | Inspector panel | `getByTestId("map-layer-inspector")` |
   | Inspector tab | `getByTestId("map-layer-inspector-tab-<id>")` — ids incl. `overview`, `schema`, `crs`, `style` |
   | Style editor | `getByTestId("map-layer-style-editor")`; apply = button `/Apply style/i` |
   | On-map legend overlay (bottom-right) | `getByTestId("map-legend-overlay")` (appears once a styled/visible layer exists) |
   | Attribute table | row → `.getByTestId("...")` table affordance |
   | Close inspector | button `Close layer inspector` (close it before shooting the map so the overlay is unobstructed) |

   ```ts
   await page.screenshot({ path: "e2e/__screens__/<name>.png" });
   ```

## Run + view

```bash
mkdir -p e2e/__screens__
npx playwright test e2e/<your-temp>.spec.ts
```

Then Read each PNG to look at it (a blank/empty map frame means the seed or
navigation failed, not a passing run). When done, delete the temp spec.

## Gotchas (learned)

- Clicks: use `triggerDomClick(locator)` from the helpers, not `.click()` —
  several controls are `role="menuitem"`/`role="option"` inside `<details>`
  menus and the helper dispatches a real DOM click that those need.
- The on-map legend overlay only renders when there is a visible layer whose
  legend resolves; apply a style (or seed a styled layer) first, and close the
  inspector so it does not cover the bottom-right corner.
- A stale `npm run dev` vite with broken HMR can be reused by
  `reuseExistingServer` — if the page looks wrong, kill stray vite on 4173 and
  let Playwright start a clean one.
- Don't leave the temp spec in `e2e/` — it would run in the CI suite.
