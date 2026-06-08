// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapTopCommandSurface } from "../MapTopCommandSurface";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderSurface(props: Partial<React.ComponentProps<typeof MapTopCommandSurface>> = {}): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapTopCommandSurface
        activeActivityLabel="Analyze"
        projectName="Urban Delta"
        workspaceView="analyze"
        taskLensLabel="Analyst"
        hasUnsavedProjectChanges
        scopeLabel="study area"
        crsLabel="EPSG:3857"
        crsTone="warning"
        activeLayerLabel="Parcels"
        searchSlot={<div>Search slot</div>}
        commandSlot={<div>Command slot</div>}
        trailingSlot={<button type="button">Close</button>}
        {...props}
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

describe("MapTopCommandSurface", () => {
  it("renders project, mode, save, and context chips", () => {
    renderSurface();

    expect(document.querySelector('[data-testid="map-command-center-title"]')?.textContent).toContain("Map Explorer");
    expect(document.querySelector('[data-testid="map-top-command-surface-project"]')?.textContent).toContain("Urban Delta");
    expect(document.querySelector('[data-testid="map-top-command-surface-save-state"]')?.textContent).toContain("Unsaved");
    expect(document.querySelector('[data-testid="map-top-command-surface-scope"]')?.textContent).toContain("study area");
    expect(document.querySelector('[data-testid="map-top-command-surface-layer"]')?.textContent).toContain("Parcels");
  });

  it("opens CRS readiness from the context chip when a caveat is present", () => {
    const onOpenCrsReadiness = vi.fn();
    renderSurface({ onOpenCrsReadiness });

    const crsChip = document.querySelector<HTMLButtonElement>('[data-testid="map-top-command-surface-crs"]');
    expect(crsChip).not.toBeNull();

    act(() => {
      crsChip!.click();
    });

    expect(onOpenCrsReadiness).toHaveBeenCalledTimes(1);
  });
});
