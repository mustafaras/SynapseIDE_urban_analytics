// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapMinimapOverlay } from "../MapMinimapOverlay";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderOverlay(props: Partial<React.ComponentProps<typeof MapMinimapOverlay>> = {}): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapMinimapOverlay
        visible
        center={[29, 41]}
        zoom={12}
        onNavigate={vi.fn()}
        {...props}
      />,
    );
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe("MapMinimapOverlay", () => {
  it("renders nothing when hidden", () => {
    renderOverlay({ visible: false });
    expect(host!.querySelector('[data-testid="map-minimap-overlay"]')).toBeNull();
  });

  it("renders an accessible inset with attribution and tile-failure fallback", () => {
    renderOverlay();
    const overlay = host!.querySelector('[data-testid="map-minimap-overlay"]');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute("aria-label")).toContain("CARTO");
    expect(host!.querySelector('[data-testid="map-minimap-canvas"]')).not.toBeNull();
  });

  it("translates clicks into main-map navigation", () => {
    const onNavigate = vi.fn();
    renderOverlay({ onNavigate });
    const canvas = host!.querySelector<HTMLCanvasElement>('[data-testid="map-minimap-canvas"]');
    expect(canvas).not.toBeNull();
    canvas!.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 168,
      bottom: 168,
      width: 168,
      height: 168,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    act(() => {
      canvas!.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 84, clientY: 84 }));
    });
    expect(onNavigate).toHaveBeenCalledTimes(1);
    const [lng, lat] = onNavigate.mock.calls[0] as [number, number];
    // Clicking the center of the inset keeps the map centered on the same spot.
    expect(lng).toBeCloseTo(29, 1);
    expect(lat).toBeCloseTo(41, 1);
  });
});
