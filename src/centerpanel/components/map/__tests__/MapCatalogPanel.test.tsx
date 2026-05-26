// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import {
  MapCatalogPanel,
  type MapCatalogActionResult,
  type MapCatalogConnectionDraft,
  type MapCatalogItem,
  type MapCatalogLayerInsertion,
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
  onAddDemoPack?: (insertion: MapCatalogLayerInsertion) => void;
  onRepairSource?: (item: MapCatalogItem) => void;
} = {}): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapCatalogPanel
        visible
        sourceHandles={options.sourceHandles ?? []}
        layers={[]}
        onClose={() => {}}
        onBrowseSources={() => {}}
        onAddDemoPack={options.onAddDemoPack ?? (() => {})}
        onRepairSource={options.onRepairSource ?? (() => {})}
        onReconnectSource={async () => ({ ok: false, message: "Unavailable" } satisfies MapCatalogActionResult)}
        onAddConnection={async (_draft: MapCatalogConnectionDraft) => ({ ok: true, message: "Added" })}
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
