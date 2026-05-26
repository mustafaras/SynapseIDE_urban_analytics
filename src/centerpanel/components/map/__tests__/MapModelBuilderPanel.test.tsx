// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapModelBuilderPanel } from "../modelBuilder";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  fcPolygonsProjected,
  FC_POLYGONS_PROJECTED_COUNT,
} from "./fixtures/gisFixtures";
import type { MapActionEffects } from "@/services/map/actions/MapActionExecutor";
import {
  executeMapModel,
  executeMapModelBatch,
  type MapModelRunResult,
} from "@/services/map/model";
import { createMapProcessingRegistry } from "@/services/map/processing";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function layer(id: string): OverlayLayerConfig {
  return {
    id,
    name: id === "primary" ? "Primary polygons" : "Overlay polygons",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    sourceData: fcPolygonsProjected.featureCollection,
    metadata: {
      featureCount: FC_POLYGONS_PROJECTED_COUNT,
      geometryType: "Polygon",
      dataVersion: `${id}-v1`,
      crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
    },
  };
}

function effectsFor(initial: OverlayLayerConfig[]): MapActionEffects {
  const layers = new Map(initial.map((entry) => [entry.id, entry]));
  let order = initial.map((entry) => entry.id);
  return {
    getLayer: (id) => layers.get(id) ?? null,
    getLayerOrder: () => order,
    addLayer: (entry) => {
      layers.set(entry.id, entry);
      if (!order.includes(entry.id)) order = [...order, entry.id];
    },
    removeLayer: (id) => {
      layers.delete(id);
      order = order.filter((entry) => entry !== id);
    },
    setLayerOrder: (ids) => {
      order = [...ids];
    },
    setLayerStyle: () => {},
    removeReportItem: () => {},
  };
}

function click(testId: string): void {
  const element = host!.querySelector(`[data-testid="${testId}"]`)!;
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function select(testId: string, value: string): void {
  const element = host!.querySelector(`[data-testid="${testId}"]`) as HTMLSelectElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!;
  act(() => {
    setter.call(element, value);
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapModelBuilderPanel", () => {
  it("builds a chained model, saves and deterministically reruns it, then exports", () => {
    const registry = createMapProcessingRegistry();
    const effects = effectsFor([layer("primary"), layer("overlay")]);
    const exportSpy = vi.fn<(result: MapModelRunResult, batchResult: unknown) => void>();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(
        <MapModelBuilderPanel
          visible
          onClose={() => {}}
          tools={registry.list()}
          layers={[
            { id: "primary", name: "Primary polygons" },
            { id: "overlay", name: "Overlay polygons" },
          ]}
          onRun={(model) => executeMapModel(model, registry, effects, { now: () => "2026-05-26T10:00:00.000Z" })}
          onRunBatch={(model, targets) => executeMapModelBatch(model, targets, registry, effects)}
          onExportToIdeAndUrban={exportSpy}
        />,
      );
    });

    click("model-add-step");
    select("model-add-tool", "intersect");
    click("model-add-step");
    click("model-save");

    expect(host.querySelector('[data-testid="model-step-buffer"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="model-step-intersect"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="model-run-result"]')?.getAttribute("data-status")).toBe("applied");
    const firstHash = host.querySelector('[data-testid="model-manifest-hash"]')?.textContent;

    click("model-rerun");
    expect(host.querySelector('[data-testid="model-manifest-hash"]')?.textContent).toBe(firstHash);
    expect(host.querySelector('[data-testid="model-determinism"]')?.textContent).toContain("identical");

    click("model-batch-layer-primary");
    click("model-batch-layer-overlay");
    click("model-run-batch");
    expect(host.querySelector('[data-testid="model-batch-result"]')?.getAttribute("data-status")).toBe("applied");
    expect(host.querySelector('[data-testid="model-batch-result"]')?.textContent).toContain("2 output(s) applied");

    click("model-export");
    expect(exportSpy).toHaveBeenCalledTimes(1);
    expect(exportSpy.mock.calls[0]?.[0].manifestHash).toBeTruthy();
    expect(exportSpy.mock.calls[0]?.[1]).toMatchObject({ status: "applied" });
  });
});
