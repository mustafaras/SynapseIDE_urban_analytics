// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  MapCatalogPanel,
  type MapCatalogActionResult,
  type MapCatalogConnectionDraft,
  type MapCatalogItem,
  type MapCatalogLayerInsertion,
  type MapDataActivitySectionId,
} from "../catalog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function brokenSource(): SourceHandle {
  return {
    sourceId: "missing-parcels",
    kind: "imported",
    storageMode: "metadata-only",
    restoreStatus: "unavailable",
    format: "geojson",
    crsSummary: { crs: null, status: "unknown", source: "unknown", notes: ["Source unavailable."] },
    featureCount: null,
    caveats: ["Replacement data is required."],
    profiledAt: "2026-05-26T10:00:00.000Z",
  };
}

function renderPanel(options: {
  sourceHandles?: SourceHandle[];
  layers?: OverlayLayerConfig[];
  activeSection?: MapDataActivitySectionId;
  onBrowseSources?: () => void;
  onAddDemoPack?: (insertion: MapCatalogLayerInsertion) => void;
  onRepairSource?: (item: MapCatalogItem) => void;
  onOpenExternalServices?: () => void;
  onAddConnection?: (draft: MapCatalogConnectionDraft) => Promise<MapCatalogActionResult>;
} = {}): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapCatalogPanel
        visible
        presentation={options.activeSection ? "embedded" : "floating"}
        activeSection={options.activeSection}
        sourceHandles={options.sourceHandles ?? []}
        layers={options.layers ?? []}
        onClose={() => {}}
        onBrowseSources={options.onBrowseSources ?? (() => {})}
        onAddDemoPack={options.onAddDemoPack ?? (() => {})}
        onRepairSource={options.onRepairSource ?? (() => {})}
        onReconnectSource={async () => ({ ok: false, message: "Unavailable" } satisfies MapCatalogActionResult)}
        onAddConnection={options.onAddConnection ?? (async (_draft: MapCatalogConnectionDraft) => ({ ok: true, message: "Added" }))}
        onOpenExternalServices={options.onOpenExternalServices}
      />,
    );
  });
}

function click(testId: string): void {
  const element = host!.querySelector(`[data-testid="${testId}"]`)!;
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function changeValue(testId: string, value: string): void {
  const element = host!.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapCatalogPanel", () => {
  it("keeps unavailable sources visible and exposes a repair action", () => {
    const repair = vi.fn<(item: MapCatalogItem) => void>();
    renderPanel({ sourceHandles: [brokenSource()], onRepairSource: repair });

    const item = host!.querySelector('[data-testid="catalog-item-source-missing-parcels"]');
    expect(item?.textContent).toContain("Unavailable");
    expect(item?.textContent).toContain("Repair source");

    click("catalog-repair-source-missing-parcels");
    expect(repair).toHaveBeenCalledWith(expect.objectContaining({
      sourceId: "missing-parcels",
      health: "unavailable",
    }));
  });

  it("keeps the Add Data section truthful and opens the modal-owned file picker", () => {
    const browse = vi.fn<() => void>();
    renderPanel({ activeSection: "add-data", onBrowseSources: browse });

    expect(host!.textContent).toContain("Shapefile");
    expect(host!.textContent).toContain("GeoPackage");
    expect(host!.textContent).toContain("skipped-row diagnostics");
    expect(host!.textContent).toContain("Columnar preview");

    click("catalog-browse-source");
    expect(browse).toHaveBeenCalledOnce();
  });

  it("lets the Connections section trigger external services and keeps provider caveats visible", () => {
    const openExternalServices = vi.fn<() => void>();
    renderPanel({ activeSection: "connections", onOpenExternalServices: openExternalServices });

    expect(host!.textContent).toContain("External-provider caveats");
    expect(host!.textContent).toContain("No credentials or secrets are stored");
    expect(host!.textContent).toContain("provider rate limits");
    expect(host!.textContent).toContain("License note");
    expect(host!.textContent).toContain("Attribution");

    click("catalog-open-external-services");
    expect(openExternalServices).toHaveBeenCalledOnce();
  });

  it("submits secret-free endpoint metadata with license and attribution notes", async () => {
    const addConnection = vi.fn<(draft: MapCatalogConnectionDraft) => Promise<MapCatalogActionResult>>()
      .mockResolvedValue({ ok: true, message: "Added" });
    renderPanel({ activeSection: "connections", onAddConnection: addConnection });

    changeValue("catalog-connection-endpoint", "https://example.test/wms");
    changeValue("catalog-connection-license", "CC BY 4.0");
    changeValue("catalog-connection-attribution", "Example GIS Office");

    await act(async () => {
      host!.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(addConnection).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: "https://example.test/wms",
      license: "CC BY 4.0",
      attribution: "Example GIS Office",
    }));
  });

  it("labels every source restore and external dependency state distinctly", () => {
    const offlineLayer: OverlayLayerConfig = {
      id: "offline-wms-layer",
      name: "Offline WMS",
      type: "raster-tile",
      visible: true,
      opacity: 1,
      sourceKind: "external",
      metadata: {
        sourceId: "offline-wms",
        externalService: {
          kind: "wms",
          endpoint: "https://example.invalid/wms",
          dependencyStatus: "offline",
          offlineReason: "Provider returned HTTP 503.",
        },
      },
    };
    renderPanel({
      activeSection: "source-health",
      layers: [offlineLayer],
      sourceHandles: [
        {
          sourceId: "external-ref",
          kind: "external",
          storageMode: "external-service",
          restoreStatus: "external-reference",
          format: "wms",
          sourceRef: "https://example.test/wms",
          crsSummary: { crs: null, status: "unknown", source: "external-service", notes: [] },
          featureCount: null,
          caveats: ["External service availability must be checked."],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
        {
          sourceId: "metadata-only-source",
          kind: "imported",
          storageMode: "metadata-only",
          restoreStatus: "metadata-only",
          format: "geojson",
          crsSummary: { crs: null, status: "unknown", source: "unknown", notes: [] },
          featureCount: null,
          caveats: ["Raw geometry is not available."],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
        {
          sourceId: "recoverable-source",
          kind: "imported",
          storageMode: "worker-table",
          restoreStatus: "recoverable",
          workerTableName: "worker:recoverable-source",
          crsSummary: { crs: null, status: "unknown", source: "unknown", notes: [] },
          featureCount: 5,
          caveats: ["Rehydrate before analysis."],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
        brokenSource(),
        {
          sourceId: "offline-wms",
          kind: "external",
          storageMode: "external-service",
          restoreStatus: "external-reference",
          format: "wms",
          sourceRef: "https://example.invalid/wms",
          crsSummary: { crs: null, status: "unknown", source: "external-service", notes: [] },
          featureCount: null,
          caveats: ["External service availability must be checked."],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
        {
          sourceId: "demo-source",
          kind: "demo",
          storageMode: "inline-small",
          restoreStatus: "restored",
          format: "geojson",
          crsSummary: { crs: "EPSG:3857", status: "known", source: "import-source", notes: [] },
          featureCount: 3,
          caveats: ["Synthetic demo source."],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
      ],
    });

    expect(host!.textContent).toContain("External reference");
    expect(host!.textContent).toContain("Metadata only");
    expect(host!.textContent).toContain("Recoverable");
    expect(host!.textContent).toContain("Unavailable");
    expect(host!.textContent).toContain("Offline");
    expect(host!.textContent).toContain("Demo / synthetic");
    expect(host!.querySelector('[data-testid="catalog-readiness-offline"]')?.textContent).toContain("1");
  });

  it("summarizes source readiness counts without hiding metadata-only or demo records", () => {
    const externalLayer: OverlayLayerConfig = {
      id: "live-wms-layer",
      name: "Live WMS",
      type: "raster-tile",
      visible: true,
      opacity: 1,
      sourceKind: "external",
      metadata: {
        sourceId: "live-wms",
        externalService: {
          kind: "wms",
          endpoint: "https://example.test/wms",
          dependencyStatus: "live",
        },
      },
    };
    renderPanel({
      activeSection: "source-health",
      layers: [externalLayer],
      sourceHandles: [
        {
          sourceId: "restored-source",
          kind: "imported",
          storageMode: "inline-small",
          restoreStatus: "restored",
          crsSummary: { crs: "EPSG:3857", status: "known", source: "import-source", notes: [] },
          featureCount: 12,
          caveats: [],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
        {
          sourceId: "recoverable-source",
          kind: "imported",
          storageMode: "indexeddb-local",
          restoreStatus: "recoverable",
          crsSummary: { crs: null, status: "unknown", source: "unknown", notes: [] },
          featureCount: null,
          caveats: [],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
        brokenSource(),
        {
          sourceId: "live-wms",
          kind: "external",
          storageMode: "external-service",
          restoreStatus: "external-reference",
          format: "wms",
          crsSummary: { crs: null, status: "unknown", source: "unknown", notes: [] },
          featureCount: null,
          caveats: ["External service availability must be checked."],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
        {
          sourceId: "demo-source",
          kind: "demo",
          storageMode: "inline-small",
          restoreStatus: "restored",
          format: "geojson",
          crsSummary: { crs: "EPSG:3857", status: "known", source: "import-source", notes: [] },
          featureCount: 3,
          caveats: ["Synthetic demo source."],
          profiledAt: "2026-05-26T10:00:00.000Z",
        },
      ],
    });

    expect(host!.querySelector('[data-testid="catalog-readiness-restoredLive"]')?.textContent).toContain("2");
    expect(host!.querySelector('[data-testid="catalog-readiness-recoverable"]')?.textContent).toContain("1");
    expect(host!.querySelector('[data-testid="catalog-readiness-unavailable"]')?.textContent).toContain("1");
    expect(host!.querySelector('[data-testid="catalog-readiness-external"]')?.textContent).toContain("1");
    expect(host!.querySelector('[data-testid="catalog-readiness-metadataOnly"]')?.textContent).toContain("1");
    expect(host!.querySelector('[data-testid="catalog-readiness-demoSynthetic"]')?.textContent).toContain("1");
  });

  it("labels the demo pack and emits source-linked layers when it is added", () => {
    const addDemoPack = vi.fn<(insertion: MapCatalogLayerInsertion) => void>();
    renderPanel({ onAddDemoPack: addDemoPack });

    expect(host!.textContent).toContain("DEMO / SYNTHETIC");
    expect(host!.textContent).toContain("Not observational data");
    click("catalog-add-demo-pack");

    const insertion = addDemoPack.mock.calls[0]?.[0];
    expect(insertion?.layers).toHaveLength(9);
    expect(insertion?.sourceHandles).toHaveLength(9);
    expect(insertion?.sourceHandles.every((handle) =>
      handle.kind === "demo" && handle.restoreStatus === "restored",
    )).toBe(true);
    expect(insertion?.layers.every((layer) =>
      layer.sourceKind === "demo" && Boolean(layer.metadata?.sourceId),
    )).toBe(true);
  });
});
