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
import { FC_POLYGONS_PROJECTED_COUNT, fcPolygonsProjected } from "./fixtures/gisFixtures";

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

const projected: OverlayLayerConfig = {
  id: "polys",
  name: "Projected polygons",
  type: "geojson",
  visible: true,
  opacity: 1,
  sourceData: fcPolygonsProjected.featureCollection,
  metadata: {
    featureCount: FC_POLYGONS_PROJECTED_COUNT,
    geometryType: "Polygon",
    fields: ["zone", "area_m2"],
    crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
  },
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
function click(el: Element): void {
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function render(): void {
  const registry = createMapProcessingRegistry();
  const effects = makeEffects([projected]);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapProcessingToolboxPanel
        visible
        onClose={() => {}}
        searchTools={(q) => registry.search(q)}
        layers={[{ id: "polys", name: "Projected polygons", fields: ["zone", "area_m2"] }]}
        onPreview={(toolId, params) => previewProcessingTool(toolId, params, effects.getLayer)}
        onRun={(toolId, params) => runProcessingTool(toolId, params, effects)}
      />,
    );
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});

describe("MapProcessingToolboxPanel — premium styling + blocked states (24c)", () => {
  it("shows a not-yet-wired tool's reason BEFORE any run and disables Run", () => {
    render();
    setInput(query<HTMLInputElement>("processing-tool-search")!, "zonal");
    click(query("processing-tool-raster-zonal-stats")!);

    // No run has happened — the blocked reason is already visible.
    expect(query("processing-run-result")).toBeNull();
    const blocked = query("processing-preflight-blocked");
    expect(blocked).not.toBeNull();
    expect(blocked!.textContent ?? "").toMatch(/not yet wired/i);
    expect(query<HTMLButtonElement>("processing-tool-run")!.disabled).toBe(true);
  });

  it("renders a runtime-mode chip and a completion progress bar after a run", () => {
    render();
    click(query("processing-tool-buffer")!);
    expect(query("processing-tool-runtime-chip")?.textContent).toContain("Main-thread preview");

    click(query<HTMLButtonElement>("processing-tool-run")!);
    expect(query("processing-run-result")?.getAttribute("data-run-status")).toBe("applied");
    expect(query("processing-run-progress")).not.toBeNull();
  });
});
