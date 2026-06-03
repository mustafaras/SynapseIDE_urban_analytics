// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { MapProcessingToolboxPanel } from "../processing";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  createMapProcessingRegistry,
  previewProcessingTool,
  runProcessingTool,
} from "../../../../services/map/processing";
import type { MapActionEffects } from "../../../../services/map/actions/MapActionExecutor";
import { fcPointsWGS84, fcPolygonsProjected } from "./fixtures/gisFixtures";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function makeEffects(layers: OverlayLayerConfig[]): MapActionEffects {
  const store = new Map(layers.map((layer) => [layer.id, layer]));
  let order = layers.map((layer) => layer.id);
  return {
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
}

const points: OverlayLayerConfig = {
  id: "points",
  name: "Join points",
  type: "geojson",
  visible: true,
  opacity: 1,
  sourceData: fcPointsWGS84,
  metadata: { geometryType: "Point", featureCount: 25, fields: ["id", "name", "value", "date"], crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] } },
};
const polys: OverlayLayerConfig = {
  id: "polys",
  name: "Join polys",
  type: "geojson",
  visible: true,
  opacity: 1,
  sourceData: fcPolygonsProjected.featureCollection,
  metadata: { geometryType: "Polygon", featureCount: 10, fields: ["zone", "area_m2"], crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] } },
};

function query<T extends Element = Element>(testId: string): T | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}
function setInput(el: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function setSelect(el: HTMLSelectElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function click(el: Element): void {
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});

describe("MapProcessingToolboxPanel — service tools (24b)", () => {
  it("runs spatial-join from the UI (points + polygon layer) and shows a manifest", () => {
    const effects = makeEffects([points, polys]);
    const registry = createMapProcessingRegistry();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(
        <MapProcessingToolboxPanel
          visible
          onClose={() => {}}
          searchTools={(q) => registry.search(q)}
          layers={[
            { id: "points", name: "Join points", fields: ["id", "name"] },
            { id: "polys", name: "Join polys", fields: ["zone", "area_m2"] },
          ]}
          onPreview={(toolId, params) => previewProcessingTool(toolId, params, effects.getLayer)}
          onRun={(toolId, params) => runProcessingTool(toolId, params, effects)}
        />,
      );
    });

    setInput(query<HTMLInputElement>("processing-tool-search")!, "spatial join");
    click(query("processing-tool-spatial-join")!);
    setSelect(query<HTMLSelectElement>("processing-param-layer")!, "points");
    setSelect(query<HTMLSelectElement>("processing-param-layerB")!, "polys");

    expect(query("processing-preflight-blocked")).toBeNull();
    const runButton = query<HTMLButtonElement>("processing-tool-run")!;
    expect(runButton.disabled).toBe(false);
    click(runButton);

    const result = query("processing-run-result")!;
    expect(result.getAttribute("data-run-status")).toBe("applied");
    expect(query("processing-run-manifest")?.textContent).toMatch(/manifest-processing-spatial-join/);
  });

  it("lists at least 12 implemented tools and marks stubs as not wired", () => {
    const registry = createMapProcessingRegistry();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(
        <MapProcessingToolboxPanel
          visible
          onClose={() => {}}
          searchTools={(q) => registry.search(q)}
          layers={[{ id: "polys", name: "Join polys", fields: ["zone", "area_m2"] }]}
          onPreview={(toolId, params) => previewProcessingTool(toolId, params, () => null)}
          onRun={() => null}
        />,
      );
    });

    const options = host!.querySelectorAll('[role="option"]');
    const notWired = Array.from(options).filter((option) => /not wired yet/.test(option.textContent ?? ""));
    expect(options.length - notWired.length).toBeGreaterThanOrEqual(12);
    expect(notWired.length).toBeGreaterThan(0);
  });

  it("surfaces the runtime legend and selected worker runtime chip", () => {
    const registry = createMapProcessingRegistry();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(
        <MapProcessingToolboxPanel
          visible
          onClose={() => {}}
          searchTools={(q) => registry.search(q)}
          layers={[{ id: "polys", name: "Join polys", fields: ["zone", "area_m2"] }]}
          onPreview={(toolId, params) => previewProcessingTool(toolId, params, () => null)}
          onRun={() => null}
        />,
      );
    });

    const legend = query("processing-tool-runtime-legend")?.textContent ?? "";
    expect(legend).toContain("Main-thread preview");
    expect(legend).toContain("Background worker");
    expect(legend).toContain("GEOS (wasm)");
    expect(legend).toContain("DuckDB (wasm)");

    setInput(query<HTMLInputElement>("processing-tool-search")!, "worker");
    expect(query("processing-tool-spatial-join")?.textContent).toContain("Background worker");
    click(query("processing-tool-spatial-join")!);
    expect(query("processing-tool-runtime-chip")?.textContent).toContain("Background worker");
  });
});
