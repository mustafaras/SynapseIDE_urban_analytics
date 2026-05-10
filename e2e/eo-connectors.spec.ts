import { expect, test, type Page } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

function buildClassicTiff(): Buffer {
  const width = 4;
  const height = 4;
  const tileWidth = 4;
  const tileHeight = 4;
  const tilePayload = Uint8Array.from([
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 16,
  ]);

  const fixedTags = [
    { tag: 256, type: 3, count: 1, value: width },
    { tag: 257, type: 3, count: 1, value: height },
    { tag: 258, type: 3, count: 1, value: 8 },
    { tag: 259, type: 3, count: 1, value: 1 },
    { tag: 277, type: 3, count: 1, value: 1 },
    { tag: 322, type: 3, count: 1, value: tileWidth },
    { tag: 323, type: 3, count: 1, value: tileHeight },
    { tag: 339, type: 3, count: 1, value: 1 },
  ];

  const pixelScale = new Uint8Array(24);
  const pixelScaleView = new DataView(pixelScale.buffer);
  [0.01, 0.01, 0].forEach((value, index) => pixelScaleView.setFloat64(index * 8, value, true));

  const tiePoint = new Uint8Array(48);
  const tiePointView = new DataView(tiePoint.buffer);
  [0, 0, 0, 28.94, 41.08, 0].forEach((value, index) => tiePointView.setFloat64(index * 8, value, true));

  const geoKeys = new Uint8Array(16);
  const geoKeyView = new DataView(geoKeys.buffer);
  geoKeyView.setUint16(0, 1, true);
  geoKeyView.setUint16(2, 1, true);
  geoKeyView.setUint16(4, 0, true);
  geoKeyView.setUint16(6, 1, true);
  geoKeyView.setUint16(8, 2048, true);
  geoKeyView.setUint16(10, 0, true);
  geoKeyView.setUint16(12, 1, true);
  geoKeyView.setUint16(14, 4326, true);

  const noData = new TextEncoder().encode("0\0");
  const tileOffsets = new Uint8Array(4);
  const tileByteCounts = new Uint8Array(4);
  new DataView(tileByteCounts.buffer).setUint32(0, tilePayload.byteLength, true);

  const variableTags = [
    { tag: 324, type: 4, count: 1, data: tileOffsets },
    { tag: 325, type: 4, count: 1, data: tileByteCounts },
    { tag: 33550, type: 12, count: 3, data: pixelScale },
    { tag: 33922, type: 12, count: 6, data: tiePoint },
    { tag: 34735, type: 3, count: 8, data: geoKeys },
    { tag: 42113, type: 2, count: noData.length, data: noData },
  ];

  const ifdStart = 8;
  const tagCount = fixedTags.length + variableTags.length;
  const ifdSize = 2 + tagCount * 12 + 4;
  const overflowStart = ifdStart + ifdSize;

  let nextOverflow = overflowStart;
  const offsets = variableTags.map((entry) => {
    if (entry.data.length <= 4) {
      return -1;
    }
    const offset = nextOverflow;
    nextOverflow += entry.data.length;
    return offset;
  });

  const tileDataStart = nextOverflow;
  new DataView(tileOffsets.buffer).setUint32(0, tileDataStart, true);

  const buffer = new ArrayBuffer(tileDataStart + tilePayload.byteLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint16(0, 0x4949, false);
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdStart, true);

  let cursor = ifdStart;
  view.setUint16(cursor, tagCount, true);
  cursor += 2;

  for (const tag of fixedTags) {
    view.setUint16(cursor, tag.tag, true);
    view.setUint16(cursor + 2, tag.type, true);
    view.setUint32(cursor + 4, tag.count, true);
    view.setUint16(cursor + 8, tag.value, true);
    cursor += 12;
  }

  variableTags.forEach((tag, index) => {
    view.setUint16(cursor, tag.tag, true);
    view.setUint16(cursor + 2, tag.type, true);
    view.setUint32(cursor + 4, tag.count, true);
    if (offsets[index]! >= 0) {
      view.setUint32(cursor + 8, offsets[index]!, true);
      bytes.set(tag.data, offsets[index]!);
    } else {
      bytes.set(tag.data, cursor + 8);
    }
    cursor += 12;
  });

  view.setUint32(cursor, 0, true);
  bytes.set(tilePayload, tileDataStart);

  return Buffer.from(buffer);
}

async function mockStacAndCog(page: Page): Promise<void> {
  const tiff = buildClassicTiff();

  await page.route("https://planetarycomputer.microsoft.com/api/stac/v1/search", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/geo+json",
      headers: {
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({
        type: "FeatureCollection",
        numberMatched: 1,
        features: [
          {
            id: "S2A_TEST_ITEM",
            type: "Feature",
            collection: "sentinel-2-l2a",
            bbox: [28.94, 41.01, 29.04, 41.08],
            geometry: {
              type: "Polygon",
              coordinates: [
                [[28.94, 41.01], [29.04, 41.01], [29.04, 41.08], [28.94, 41.08], [28.94, 41.01]],
              ],
            },
            properties: {
              datetime: "2026-03-05T10:30:00Z",
              "eo:cloud_cover": 9.2,
              gsd: 10,
              "proj:epsg": 4326,
            },
            assets: {
              visual: {
                href: "https://example.com/visual.tif",
                type: "image/tiff; application=geotiff; profile=cloud-optimized",
                title: "Visual COG",
                roles: ["data"],
              },
            },
            links: [
              { rel: "self", href: "https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a/items/S2A_TEST_ITEM" },
            ],
          },
        ],
      }),
    });
  });

  await page.route("https://example.com/visual.tif", async (route) => {
    await route.fulfill({
      status: 206,
      body: tiff,
      headers: {
        "content-type": "image/tiff",
        "access-control-allow-origin": "*",
        "accept-ranges": "bytes",
      },
    });
  });
}

test.describe("EO connector operator panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
  });

  test("lists STAC results, inspects a COG asset, and publishes the selected EO source", async ({ page }) => {
    await mockStacAndCog(page);
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    const eoNav = urbanModal.getByTestId("tools-nav-eo");
    await expect(eoNav).toBeVisible();
    await triggerDomClick(eoNav);

    const eoPanel = urbanModal.getByTestId("tools-card-eo");
    await expect(eoPanel).toBeVisible();

    await urbanModal.getByTestId("eo-envelope-select").selectOption("custom-bbox");
    await triggerDomClick(urbanModal.getByTestId("eo-stac-search"));

    await expect(urbanModal.getByTestId("eo-stac-matched")).toContainText(/Matched 1/i);
    await expect(urbanModal.getByTestId("eo-stac-results")).toContainText(/S2A_TEST_ITEM/i);

    await triggerDomClick(urbanModal.getByRole("button", { name: "Select item" }).first());
    await expect(urbanModal.getByTestId("eo-selected-source-title")).toContainText(/S2A_TEST_ITEM/i);

    await triggerDomClick(urbanModal.getByRole("button", { name: "Inspect selected asset as COG" }).first());
    await expect(urbanModal.getByTestId("eo-cog-metadata")).toContainText(/Dimensions:/i);
    await expect(urbanModal.getByTestId("eo-cog-sample")).toContainText(/Sample window:/i);
    await expect(urbanModal.getByTestId("eo-selected-source-title")).toContainText(/COG Asset/i);
    await expect(urbanModal.getByTestId("eo-activity-history")).toContainText(/COG inspect/i);

    await triggerDomClick(urbanModal.getByTestId("eo-publish-map"));
    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" });
    await expect(mapExplorer).toBeVisible();
  });

  test("shows truthful credential-missing state for Sentinel Hub without credentials", async ({ page }) => {
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    const eoNav = urbanModal.getByTestId("tools-nav-eo");
    await expect(eoNav).toBeVisible();
    await triggerDomClick(eoNav);

    const eoPanel = urbanModal.getByTestId("tools-card-eo");
    await expect(eoPanel).toBeVisible();

    await urbanModal.getByTestId("eo-envelope-select").selectOption("custom-bbox");
    await triggerDomClick(urbanModal.getByTestId("eo-sentinel-run"));
    await expect(urbanModal.getByTestId("eo-sentinel-credential-state")).toContainText(/credential-missing/i);
    await expect(urbanModal.getByTestId("eo-selected-source-state")).toContainText(/credential-missing/i);
  });
});
