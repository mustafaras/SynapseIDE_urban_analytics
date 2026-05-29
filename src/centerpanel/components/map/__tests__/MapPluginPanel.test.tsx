// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMapExtensionRegistry } from "@/services/map/plugins";
import { MapPluginPanel } from "../plugins";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderPanel(): void {
  const registry = createMapExtensionRegistry();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapPluginPanel
        visible
        extensions={registry.list()}
        onClose={vi.fn()}
      />,
    );
  });
}

function query(testId: string): Element | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe("MapPluginPanel", () => {
  it("lists each registered extension kind with availability text", () => {
    renderPanel();

    expect(query("map-plugin-panel")).not.toBeNull();
    expect(query("map-plugin-extension-source.cityjson-static")?.getAttribute("data-kind")).toBe("source-connector");
    expect(query("map-plugin-extension-renderer.dot-density-reference")?.getAttribute("data-kind")).toBe("renderer");
    expect(query("map-plugin-extension-processing.plugin-envelope")?.textContent).toMatch(/available/i);
    expect(query("map-plugin-extension-urban.walkability-reference")?.textContent).toMatch(/walkability readiness bridge/i);
  });
});