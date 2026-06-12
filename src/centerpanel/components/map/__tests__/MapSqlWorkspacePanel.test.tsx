// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeatureCollection } from "geojson";
import { MapSqlWorkspacePanel } from "../sql";
import { toSqlTableName } from "../sql/SqlWorkspaceBody";
import type { OverlayLayerConfig } from "../mapTypes";

const loadGeoJSON = vi.fn().mockResolvedValue(undefined);

vi.mock("@/engine/spatial-db", () => ({
  SQLEditor: ({ onSendToMap }: { onSendToMap?: (geojson: FeatureCollection) => void }) => (
    <button
      type="button"
      data-testid="sql-editor-stub"
      onClick={() => onSendToMap?.({ type: "FeatureCollection", features: [] })}
    >
      editor
    </button>
  ),
  useSpatialDB: () => ({
    ready: true,
    error: null,
    loadGeoJSON,
    tables: [],
  }),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const featureCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [29, 41] },
      properties: { name: "stop" },
    },
  ],
};

function layer(id: string, name: string, overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id,
    name,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: featureCollection,
    ...overrides,
  };
}

async function renderPanel(props: Partial<React.ComponentProps<typeof MapSqlWorkspacePanel>> = {}): Promise<void> {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(
      <MapSqlWorkspacePanel
        visible
        overlayLayers={[]}
        onSendToMap={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );
  });
  // let the lazy body chunk and the layer-load effect settle
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

function query(testId: string): Element | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  host?.remove();
  host = null;
  loadGeoJSON.mockClear();
});

describe("MapSqlWorkspacePanel", () => {
  it("renders nothing when not visible", async () => {
    await renderPanel({ visible: false });
    expect(query("map-sql-workspace-panel")).toBeNull();
  });

  it("renders the panel chrome and lazily mounts the SQL editor", async () => {
    await renderPanel({ overlayLayers: [layer("a", "Roads 2024")] });
    expect(query("map-sql-workspace-panel")).not.toBeNull();
    expect(query("sql-editor-stub")).not.toBeNull();
    expect(query("map-sql-workspace-status")?.textContent).toContain("roads_2024");
    expect(loadGeoJSON).toHaveBeenCalledWith("roads_2024", featureCollection);
  });

  it("only loads GeoJSON FeatureCollection layers into DuckDB", async () => {
    await renderPanel({
      overlayLayers: [
        layer("a", "Districts"),
        layer("b", "Basemap tiles", { type: "raster-tile", sourceData: "https://tiles.example/{z}/{x}/{y}.png" }),
      ],
    });
    expect(loadGeoJSON).toHaveBeenCalledTimes(1);
    expect(loadGeoJSON).toHaveBeenCalledWith("districts", featureCollection);
  });

  it("forwards Send to Map results to the runtime handler", async () => {
    const onSendToMap = vi.fn();
    await renderPanel({ onSendToMap });
    await act(async () => {
      (query("sql-editor-stub") as HTMLButtonElement).click();
    });
    expect(onSendToMap).toHaveBeenCalledWith({ type: "FeatureCollection", features: [] });
  });
});

describe("toSqlTableName", () => {
  it("normalizes layer names into safe SQL identifiers", () => {
    expect(toSqlTableName("Roads 2024")).toBe("roads_2024");
    expect(toSqlTableName("  İstanbul / Bölge-7 ")).toBe("i_stanbul_b_lge_7");
    expect(toSqlTableName("2024 parcels")).toBe("layer_2024_parcels");
    expect(toSqlTableName("***")).toBe("layer");
  });
});
