// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MapProcessingToolboxPanel } from "../processing";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  createMapProcessingRegistry,
  previewProcessingTool,
  runProcessingTool,
} from "../../../../services/map/processing";
import type { MapActionEffects } from "../../../../services/map/actions/MapActionExecutor";
import {
  FC_POLYGONS_PROJECTED_COUNT,
  fcPolygonsProjected,
} from "./fixtures/gisFixtures";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function projectedLayer(): OverlayLayerConfig {
  return {
    id: "layer-projected",
    name: "Projected polygons",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: fcPolygonsProjected.featureCollection,
    metadata: {
      featureCount: FC_POLYGONS_PROJECTED_COUNT,
      geometryType: "Polygon",
      fields: ["zone", "area_m2"],
      crsSummary: { crs: fcPolygonsProjected.declaredCrs, status: "known", source: "explicit", notes: [] },
    },
  };
}

function makeEffects(layers: OverlayLayerConfig[]): { effects: MapActionEffects; count: () => number } {
  const store = new Map(layers.map((layer) => [layer.id, layer]));
  let order = layers.map((layer) => layer.id);
  const effects: MapActionEffects = {
    getLayer: (id) => store.get(id) ?? null,
    getLayerOrder: () => [...order],
    addLayer: (layer) => {
      store.set(layer.id, layer);
      order.push(layer.id);
    },
    removeLayer: (id) => {
      store.delete(id);
      order = order.filter((entry) => entry !== id);
    },
    setLayerOrder: (ids) => {
      order = [...ids];
    },
    setLayerStyle: () => {},
    removeReportItem: () => {},
  };
  return { effects, count: () => store.size };
}

function setInputValue(element: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function click(element: Element): void {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function query<T extends Element = Element>(testId: string): T | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});

describe("MapProcessingToolboxPanel", () => {
  function render(effects: MapActionEffects): void {
    const registry = createMapProcessingRegistry();
    const layers = [{ id: "layer-projected", name: "Projected polygons", fields: ["zone", "area_m2"] }];
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(
        <MapProcessingToolboxPanel
          visible
          presentation="embedded"
          onClose={() => {}}
          searchTools={(q) => registry.search(q)}
          layers={layers}
          onPreview={(toolId, params) =>
            previewProcessingTool(toolId, params, effects.getLayer)
          }
          onRun={(toolId, params) => runProcessingTool(toolId, params, effects)}
        />,
      );
    });
  }

  beforeEach(() => {
    render(makeEffects([projectedLayer()]).effects);
  });

  it("lists the three reference tools and filters the list by search", () => {
    expect(query("processing-tool-buffer")).not.toBeNull();
    expect(query("processing-tool-centroid")).not.toBeNull();
    expect(query("processing-tool-attribute-filter")).not.toBeNull();

    const search = query<HTMLInputElement>("processing-tool-search")!;
    setInputValue(search, "buffer");
    expect(query("processing-tool-buffer")).not.toBeNull();
    expect(query("processing-tool-centroid")).toBeNull();
    expect(query("processing-tool-attribute-filter")).toBeNull();
  });

  it("filters by category and renders the GIS parameter/readiness rail", () => {
    click(query("processing-tool-category-filter-geometry")!);
    expect(query("processing-tool-buffer")).not.toBeNull();
    expect(query("processing-tool-centroid")).not.toBeNull();
    expect(query("processing-tool-attribute-filter")).toBeNull();

    click(query("processing-tool-buffer")!);
    expect(query("processing-tool-runtime-chip")?.textContent).toContain("Main-thread preview");
    expect(query("processing-tool-readiness-card")?.textContent).toContain("Preview ready");
    expect(query("processing-tool-readiness-card")?.textContent).toContain("Projected polygons");
    expect(host!.querySelector('[data-parameter-type="layer"]')).not.toBeNull();
    expect(host!.querySelector('[data-parameter-type="number"]')).not.toBeNull();
  });

  it("runs buffer on the projected layer and surfaces an output layer + manifest", () => {
    click(query("processing-tool-buffer")!);
    // projected CRS → not blocked, run enabled
    expect(query("processing-preflight-blocked")).toBeNull();

    const runButton = query<HTMLButtonElement>("processing-tool-run")!;
    expect(runButton.disabled).toBe(false);
    click(runButton);

    const result = query("processing-run-result")!;
    expect(result.getAttribute("data-run-status")).toBe("applied");
    expect(query("processing-run-output-layer")?.textContent).toContain("Buffer");
    expect(query("processing-run-manifest")?.textContent).toMatch(/manifest: manifest-processing-buffer/);
  });
});

describe("MapProcessingToolboxPanel — blocked preflight", () => {
  it("shows the CRS block reason before running when the layer has no CRS", () => {
    const noCrsLayer: OverlayLayerConfig = {
      id: "layer-projected",
      name: "Projected polygons",
      type: "geojson",
      visible: true,
      opacity: 1,
      sourceData: fcPolygonsProjected.featureCollection,
      metadata: { featureCount: FC_POLYGONS_PROJECTED_COUNT, geometryType: "Polygon", fields: ["zone"] },
    };
    const registry = createMapProcessingRegistry();
    const { effects } = makeEffects([noCrsLayer]);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(
        <MapProcessingToolboxPanel
          visible
          presentation="embedded"
          onClose={() => {}}
          searchTools={(q) => registry.search(q)}
          layers={[{ id: "layer-projected", name: "Projected polygons", fields: ["zone"] }]}
          onPreview={(toolId, params) => previewProcessingTool(toolId, params, effects.getLayer)}
          onRun={(toolId, params) => runProcessingTool(toolId, params, effects)}
        />,
      );
    });

    click(query("processing-tool-buffer")!);
    const blocked = query("processing-preflight-blocked");
    expect(blocked).not.toBeNull();
    expect(blocked!.textContent ?? "").toMatch(/CRS/i);
    expect(query<HTMLButtonElement>("processing-tool-run")!.disabled).toBe(true);
  });
});
