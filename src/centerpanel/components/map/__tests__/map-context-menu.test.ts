import { describe, expect, it } from "vitest";
import type { DrawnFeature, OverlayLayerConfig } from "../mapTypes";
import { MapContextMenu } from "../../MapContextMenu";
import {
  clampContextMenuPosition,
  collectVisibleBounds,
  formatCoordinatePair,
} from "../contextMenuUtils";

describe("MapContextMenu helpers", () => {
  it("exports the component", () => {
    expect(MapContextMenu).toBeDefined();
    expect(typeof MapContextMenu).toBe("function");
  });

  it("clamps menu position within the container", () => {
    expect(
      clampContextMenuPosition({
        x: 620,
        y: 460,
        menuWidth: 180,
        menuHeight: 120,
        containerWidth: 640,
        containerHeight: 480,
      }),
    ).toEqual({ x: 452, y: 352 });
  });

  it("formats clipboard coordinates as lat, lng with 6 decimals", () => {
    expect(formatCoordinatePair([2.3522, 48.8566])).toBe("48.856600, 2.352200");
  });

  it("collects bounds from pins, drawings, and visible overlay layers", () => {
    const drawnFeatures: DrawnFeature[] = [
      {
        id: "polygon-1",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [1, 1],
              [2, 1],
              [2, 2],
              [1, 2],
              [1, 1],
            ],
          ],
        },
        properties: {
          label: "AOI",
          createdAt: "2026-04-10T00:00:00.000Z",
        },
      },
    ];

    const overlayLayers: OverlayLayerConfig[] = [
      {
        id: "visible-layer",
        name: "Visible",
        type: "geojson",
        visible: true,
        opacity: 1,
        metadata: { bounds: [-5, -4, -3, -2] },
      },
      {
        id: "hidden-layer",
        name: "Hidden",
        type: "geojson",
        visible: false,
        opacity: 1,
        metadata: { bounds: [-100, -100, 100, 100] },
      },
    ];

    expect(
      collectVisibleBounds({
        pins: [{ id: "pin-1", lng: 4, lat: 5, label: "Pin" }],
        drawnFeatures,
        overlayLayers,
      }),
    ).toEqual([-5, -4, 4, 5]);
  });

  it("returns null when there is nothing visible to fit", () => {
    expect(
      collectVisibleBounds({
        pins: [],
        drawnFeatures: [],
        overlayLayers: [],
      }),
    ).toBeNull();
  });
});
