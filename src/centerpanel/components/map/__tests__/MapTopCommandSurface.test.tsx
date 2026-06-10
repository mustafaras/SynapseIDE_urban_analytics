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
        utilitySlot={<button type="button">Bookmarks</button>}
        modalControlSlot={(
          <>
            <button type="button">Dock</button>
            <button type="button">Minimize</button>
            <button type="button">Expand</button>
            <button type="button">Close</button>
          </>
        )}
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

  it("keeps utility and modal controls separated with stable modal-control order", () => {
    renderSurface();

    const utilityHost = document.querySelector('[data-testid="map-top-command-surface-utility-controls"]');
    const modalControlHost = document.querySelector('[data-testid="map-top-command-surface-modal-controls"]');

    expect(utilityHost?.textContent).toContain("Bookmarks");
    expect(modalControlHost).not.toBeNull();

    const modalLabels = Array.from(modalControlHost!.querySelectorAll("button")).map((button) => button.textContent?.trim());
    expect(modalLabels).toEqual(["Dock", "Minimize", "Expand", "Close"]);
  });

  it("keeps modal controls keyboard-focusable in a predictable sequence", () => {
    renderSurface();

    const buttons = Array.from(document.querySelectorAll('[data-testid="map-top-command-surface-modal-controls"] button'));
    expect(buttons).toHaveLength(4);

    buttons[0]?.focus();
    expect(document.activeElement).toBe(buttons[0]);

    buttons[1]?.focus();
    expect(document.activeElement).toBe(buttons[1]);

    buttons[2]?.focus();
    expect(document.activeElement).toBe(buttons[2]);

    buttons[3]?.focus();
    expect(document.activeElement).toBe(buttons[3]);
  });

  it("keeps long metadata readable via titles and normalizes CRS chip values", () => {
    const longProject = "City Resilience Program - Coastal Flood Adaptation and Mobility Prioritization";
    const longLayer = "Parcels and Building Footprints from Regional Cadastre 2026 Baseline";

    renderSurface({
      projectName: longProject,
      crsLabel: "CRS EPSG:3857",
      activeLayerLabel: longLayer,
      activeLayerTitle: longLayer,
    });

    const projectChip = document.querySelector<HTMLElement>('[data-testid="map-top-command-surface-project"]');
    const crsChip = document.querySelector<HTMLElement>('[data-testid="map-top-command-surface-crs"]');
    const layerChip = document.querySelector<HTMLElement>('[data-testid="map-top-command-surface-layer"]');

    expect(projectChip).not.toBeNull();
    expect(projectChip?.getAttribute("title")).toBe(longProject);

    expect(crsChip).not.toBeNull();
    expect(crsChip?.textContent).toContain("EPSG:3857");
    expect(crsChip?.textContent).not.toContain("CRS EPSG:3857");

    expect(layerChip).not.toBeNull();
    expect(layerChip?.getAttribute("title")).toBe(longLayer);
  });

  it("renders contextBarSlot content when provided", () => {
    renderSurface({
      contextBarSlot: <div data-testid="test-context-bar">Layer controls</div>,
    });

    const cluster = document.querySelector('[data-testid="map-context-bar-cluster"]');
    expect(cluster).not.toBeNull();
    const inner = document.querySelector('[data-testid="test-context-bar"]');
    expect(inner?.textContent).toBe("Layer controls");
  });

  it("does not render context bar cluster when contextBarSlot is omitted", () => {
    renderSurface();
    expect(document.querySelector('[data-testid="map-context-bar-cluster"]')).toBeNull();
  });
});
