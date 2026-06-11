// @vitest-environment jsdom

/**
 * Unified GIS Command Bar — structural tests.
 *
 * Verifies that the Map Explorer modal renders ONE unified command bar
 * (MapTopCommandSurface with contextBarSlot) and NO permanent second toolbar row
 * (ContextToolbar has been removed from the composition).
 */

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { MapTopCommandSurface } from "../MapTopCommandSurface";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderCommandBar(contextBarSlot?: React.ReactNode): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapTopCommandSurface
        activeActivityLabel="Analyze"
        workspaceView="analyze"
        taskLensLabel="Analyst"
        searchSlot={<div>Search</div>}
        commandSlot={<div>Commands</div>}
        contextBarSlot={contextBarSlot}
      />,
    );
  });
}

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  root = null;
  host?.remove();
  host = null;
  document.body.innerHTML = "";
});

describe("Unified GIS Command Bar", () => {
  it("renders the command surface as a single toolbar element", () => {
    renderCommandBar();
    const toolbar = document.querySelector('[data-testid="map-top-command-surface"]');
    expect(toolbar).not.toBeNull();
    expect(toolbar?.getAttribute("role")).toBe("toolbar");
  });

  it("renders contextBarSlot content within the command bar", () => {
    renderCommandBar(
      <div data-testid="layers-group">
        <button type="button">Layers</button>
        <button type="button">Contents</button>
        <button type="button">Catalog</button>
      </div>,
    );

    const cluster = document.querySelector('[data-testid="map-context-bar-cluster"]');
    expect(cluster).not.toBeNull();

    const layersGroup = document.querySelector('[data-testid="layers-group"]');
    expect(layersGroup).not.toBeNull();

    const buttons = Array.from(cluster!.querySelectorAll("button"));
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("context bar cluster has correct role and label", () => {
    renderCommandBar(<span>Layer controls</span>);
    const cluster = document.querySelector('[data-testid="map-context-bar-cluster"]');
    expect(cluster?.getAttribute("role")).toBe("group");
    expect(cluster?.getAttribute("aria-label")).toBe("Layer context and selection controls");
  });

  it("command bar contains both contextBarSlot and commandSlot in the same element", () => {
    renderCommandBar(<span data-testid="ctx">Layer</span>);
    const bar = document.querySelector('[data-testid="map-top-command-surface"]');
    expect(bar?.querySelector('[data-testid="ctx"]')).not.toBeNull();
  });

  it("does not render context bar cluster when contextBarSlot is absent", () => {
    renderCommandBar();
    expect(document.querySelector('[data-testid="map-context-bar-cluster"]')).toBeNull();
  });
});
