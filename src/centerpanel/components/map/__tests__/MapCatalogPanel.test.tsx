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
        onAddConnection={async (_draft: MapCatalogConnectionDraft) => ({ ok: true, message: "Added" })}
        onOpenExternalServices={options.onOpenExternalServices}
      />,
    );
  });
}

function click(testId: string): void {
  const element = host!.querySelector(`[data-testid="${testId}"]`)!;
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
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

    click("catalog-open-external-services");
    expect(openExternalServices).toHaveBeenCalledOnce();
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
