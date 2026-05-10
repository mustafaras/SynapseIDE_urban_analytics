import { expect, test, type Page } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  openWorkflowById,
  resetWorkbenchState,
  setFormValue,
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

async function seedLiveQueryLayer(page: Page): Promise<void> {
  await page.evaluate(() => {
    const testWindow = window as Window & {
      e2e?: {
        seedGeoJSONLayer?: (input: {
          id?: string;
          name: string;
          datasetTitle?: string;
          sourceLabel?: string;
          featureCollection: GeoJSON.FeatureCollection;
        }) => void;
      };
    };

    testWindow.e2e?.seedGeoJSONLayer?.({
      id: "e2e-live-parcels-layer",
      name: "Imported Parcels Layer",
      datasetTitle: "Imported Parcels",
      sourceLabel: "E2E seeded live layer",
      featureCollection: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.94, 41.01], [28.95, 41.01], [28.95, 41.02], [28.94, 41.02], [28.94, 41.01]]],
            },
            properties: {
              parcel_id: "P-104",
              risk_score: 81,
              name: "Parcel Alpha",
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.951, 41.015], [28.956, 41.015], [28.956, 41.019], [28.951, 41.019], [28.951, 41.015]]],
            },
            properties: {
              parcel_id: "P-208",
              risk_score: 52,
              name: "Parcel Beta",
            },
          },
        ],
      },
    });
  });
}

async function seedObjectDetectionRasterSource(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const eo = await import('/src/services/data/eo/store.ts');
    const width = 32;
    const height = 32;
    const pixelCount = width * height;

    const red = new Float64Array(pixelCount);
    const green = new Float64Array(pixelCount);
    const blue = new Float64Array(pixelCount);

    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        const index = row * width + column;
        red[index] = 20 + column * 2;
        green[index] = 35 + row * 2;
        blue[index] = 15 + ((row + column) % 12);
      }
    }

    eo.useEOSourceStore.getState().registerImportedSource({
      title: 'E2E Imported RGB Raster',
      provider: 'e2e',
      sourceRef: 'e2e://object-detection-rgb-raster',
      bbox: [28.94, 41.01, 28.98, 41.05],
      crs: 'EPSG:4326',
      bandMapping: [
        { key: 'red', source: 'e2e:red', label: 'Red' },
        { key: 'green', source: 'e2e:green', label: 'Green' },
        { key: 'blue', source: 'e2e:blue', label: 'Blue' },
      ],
      analysisRaster: {
        width,
        height,
        bandCount: 3,
        bbox: [28.94, 41.01, 28.98, 41.05],
        data: [red, green, blue],
      },
    });
  });
}

async function installMockObjectDetectionRuntime(page: Page): Promise<void> {
  await page.evaluate(() => {
    let sessionCount = 0;
    const testWindow = window as Window & {
      __SYNAPSE_OBJECT_DETECTION_RUNTIME__?: {
        backend?: 'wasm' | 'webgpu';
        modelId?: string;
        modelSource?: string;
        adapter?: {
          loadModel: (source: string) => Promise<string>;
          run: (_handle: string, _feeds: Record<string, { data: Float32Array; dims: number[] }>) => Promise<Record<string, { data: Float32Array; dims: number[] }>>;
          releaseSession: (_handle: string) => Promise<void>;
          getSessionMemory: (_handle: string) => number;
        };
      };
    };

    testWindow.__SYNAPSE_OBJECT_DETECTION_RUNTIME__ = {
      backend: 'wasm',
      modelId: 'yolo-nano-urban-640',
      modelSource: 'mock://urban-detector.onnx',
      adapter: {
        async loadModel() {
          sessionCount += 1;
          return `runtime-session-${sessionCount}`;
        },
        async run() {
          return {
            output: {
              data: new Float32Array([
                4, 4, 3, 3, 0.95,
                0.95, 0.03, 0.01, 0.01, 0.01,
              ]),
              dims: [1, 1, 10],
            },
          };
        },
        async releaseSession() {},
        getSessionMemory() {
          return 4 * 1024 * 1024;
        },
      },
    };
  });
}

test.describe("GeoAI land-cover real-data upgrade", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
  });

  test("keeps demo mode explicit and saves the completed run", async ({ page }) => {
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    await triggerDomClick(urbanModal.getByTestId("tools-nav-geoai"));
    await expect(urbanModal.getByTestId("tools-card-geoai")).toBeVisible();
    await expect(urbanModal.getByTestId("geoai-land-cover-mode")).toContainText(/Demo source/i);

    await triggerDomClick(urbanModal.getByTestId("geoai-land-cover-run"));
    await expect(urbanModal.getByTestId("geoai-land-cover-notice")).toContainText(/Demo source classification published/i);
    await expect(page.getByRole("dialog", { name: "Map Explorer" })).toBeVisible();

    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    const reviewFlow = await openWorkflowById(urbanModal, "review");
    await expect(reviewFlow).toContainText(/GeoAI Land Cover/i);
  });

  test("runs land-cover classification against a real COG-backed EO source and persists review output", async ({ page }) => {
    await mockStacAndCog(page);
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    await triggerDomClick(urbanModal.getByTestId("tools-nav-eo"));
    await expect(urbanModal.getByTestId("tools-card-eo")).toBeVisible();

    await urbanModal.getByTestId("eo-envelope-select").selectOption("custom-bbox");
    await triggerDomClick(urbanModal.getByTestId("eo-stac-search"));
    await expect(urbanModal.getByTestId("eo-stac-results")).toContainText(/S2A_TEST_ITEM/i);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Select item" }).first());
    await triggerDomClick(urbanModal.getByRole("button", { name: "Inspect selected asset as COG" }).first());
    await expect(urbanModal.getByTestId("eo-selected-source-title")).toContainText(/COG Asset/i);

    await triggerDomClick(urbanModal.getByTestId("tools-nav-geoai"));
    await expect(urbanModal.getByTestId("tools-card-geoai")).toBeVisible();
    await urbanModal.getByTestId("geoai-land-cover-source-select").evaluate((node) => {
      const select = node as HTMLSelectElement;
      const option = Array.from(select.options).find((entry) => entry.text.includes("COG Asset"));
      if (!option) {
        throw new Error("COG analysis source option was not available.");
      }
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(urbanModal.getByTestId("geoai-land-cover-mode")).toContainText(/Real source/i);
    await expect(urbanModal.getByTestId("geoai-land-cover-readiness")).toContainText(/analysis-ready/i);

    await triggerDomClick(urbanModal.getByTestId("geoai-land-cover-run"));
    await expect(urbanModal.getByTestId("geoai-land-cover-notice")).toContainText(/Real source classification published/i);
    await expect(page.getByRole("dialog", { name: "Map Explorer" })).toBeVisible();

    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    const reviewFlow = await openWorkflowById(urbanModal, "review");
    await expect(reviewFlow).toContainText(/GeoAI Land Cover/i);
  });

  test("runs live spatial SQL against a real seeded map layer and publishes the accepted result", async ({ page }) => {
    await resetWorkbenchState(page);
    await seedLiveQueryLayer(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    await triggerDomClick(urbanModal.getByTestId("tools-nav-geoai"));
    await expect(urbanModal.getByTestId("tools-card-geoai")).toBeVisible();
    await expect(urbanModal.getByTestId("geoai-query-mode")).toContainText(/Live project data/i);
    await expect(urbanModal.getByTestId("geoai-query-readiness")).toContainText(/table/i);
    await expect(urbanModal.getByTestId("geoai-query-dataset-e2e-live-parcels-layer")).toContainText(/Imported Parcels Layer/i);

    await setFormValue(urbanModal.getByTestId("geoai-query-input"), "Find parcels where risk score > 70");
    await triggerDomClick(urbanModal.getByTestId("geoai-query-run"));
    await expect(urbanModal.getByTestId("geoai-query-notice")).toContainText(/Live project data query published/i);
    await expect(page.getByRole("dialog", { name: "Map Explorer" })).toBeVisible();

    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    const reviewFlow = await openWorkflowById(urbanModal, "review");
    await expect(reviewFlow).toContainText(/GeoAI Spatial Query/i);
  });

  test("keeps safe live-query rejection explicit without switching to demo data", async ({ page }) => {
    await resetWorkbenchState(page);
    await seedLiveQueryLayer(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    await triggerDomClick(urbanModal.getByTestId("tools-nav-geoai"));
    await expect(urbanModal.getByTestId("tools-card-geoai")).toBeVisible();
    await expect(urbanModal.getByTestId("geoai-query-mode")).toContainText(/Live project data/i);
    await expect(urbanModal.getByTestId("geoai-query-readiness")).toContainText(/table/i);

    await urbanModal.getByTestId("geoai-query-input").fill("DROP TABLE parcels");
    await triggerDomClick(urbanModal.getByTestId("geoai-query-run"));

    await expect(urbanModal.getByTestId("geoai-query-result")).toContainText(/Rejected/i);
    await expect(urbanModal.getByTestId("geoai-query-mode")).toContainText(/Live project data/i);
  });

  test("launches a mocked-real object detection run from the workflow surface", async ({ page }) => {
    await mockStacAndCog(page);
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    await triggerDomClick(urbanModal.getByTestId("tools-nav-eo"));
    await expect(urbanModal.getByTestId("tools-card-eo")).toBeVisible();

    await urbanModal.getByTestId("eo-envelope-select").selectOption("custom-bbox");
    await triggerDomClick(urbanModal.getByTestId("eo-stac-search"));
    await expect(urbanModal.getByTestId("eo-stac-results")).toContainText(/S2A_TEST_ITEM/i);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Select item" }).first());
    await triggerDomClick(urbanModal.getByRole("button", { name: "Inspect selected asset as COG" }).first());
    await expect(urbanModal.getByTestId("eo-selected-source-title")).toContainText(/COG Asset/i);

    await installMockObjectDetectionRuntime(page);

    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    const objectDetectionFlow = await openWorkflowById(urbanModal, "object_detection");
    await expect(objectDetectionFlow.getByTestId("object-detector-mode")).toContainText(/Real model/i);

    await objectDetectionFlow.getByTestId("object-detector-source-select").evaluate((node) => {
      const select = node as HTMLSelectElement;
      const option = Array.from(select.options).find((entry) => entry.text.includes("COG Asset"));
      if (!option) {
        throw new Error("COG source option was not available in the object detector.");
      }
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(objectDetectionFlow.getByTestId("object-detector-readiness")).toContainText(/Ready to run/i);
    await triggerDomClick(objectDetectionFlow.getByTestId("object-detector-run"));

    await expect(objectDetectionFlow.getByTestId("object-detector-notice")).toContainText(/Real model detection published/i);
    await expect(page.getByRole("dialog", { name: "Map Explorer" })).toBeVisible();

    const reviewFlow = await openWorkflowById(urbanModal, "review");
    await expect(reviewFlow).toContainText(/Object Detection/i);
  });

  test("launches a local smoke-model object detection run from the workflow surface", async ({ page }) => {
    await resetWorkbenchState(page);
    await seedObjectDetectionRasterSource(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    const toolboxTab = urbanModal.getByTestId("cp-tab-toolbox");
    await triggerDomClick(toolboxTab);
    await expect(toolboxTab).toHaveAttribute("aria-selected", "true");

    const workflowsTab = urbanModal.getByTestId("cp-tab-workflows");
    await triggerDomClick(workflowsTab);
    await expect(workflowsTab).toHaveAttribute("aria-selected", "true");

    const objectDetectionFlow = await openWorkflowById(urbanModal, "object_detection");
    await expect(objectDetectionFlow.getByTestId("object-detector-mode")).toContainText(/Real model/i);

    await objectDetectionFlow.getByTestId("object-detector-source-select").evaluate((node) => {
      const select = node as HTMLSelectElement;
      const option = Array.from(select.options).find((entry) => entry.text.includes("E2E Imported RGB Raster"));
      if (!option) {
        throw new Error("The seeded imported raster option was not available in the object detector.");
      }
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(objectDetectionFlow.getByTestId("object-detector-readiness")).toContainText(/Ready to run/i);
    await triggerDomClick(objectDetectionFlow.getByTestId("object-detector-run"));

    await expect(objectDetectionFlow.getByTestId("object-detector-notice")).toContainText(/Real model detection published/i);
    await expect(objectDetectionFlow).toContainText(/Detected classes/i);
    await expect(objectDetectionFlow).toContainText(/Vehicle/i);
    await expect(page.getByRole("dialog", { name: "Map Explorer" })).toBeVisible();

    const reviewFlow = await openWorkflowById(urbanModal, "review");
    await expect(reviewFlow).toContainText(/Object Detection/i);
  });
});
