// @vitest-environment jsdom

import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { type MapSceneStatusChip, MapSceneWorkspace } from "../scene";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(node: React.ReactNode): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(node);
  });
}

function query(testId: string): Element | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

function click(testId: string): void {
  const element = query(testId);
  if (!element) throw new Error(`${testId} was not rendered`);
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  host?.remove();
  root = null;
  host = null;
});

describe("MapSceneWorkspace", () => {
  it("exposes the Prompt 13 scene tabs, status chips, and lazy tab bodies", () => {
    const statusChips: MapSceneStatusChip[] = [
      { id: "source-mode", label: "Source mode: raster", status: "ready" },
      { id: "crs", label: "CRS: EPSG:32635", status: "ready" },
      { id: "vertical-datum", label: "Vertical datum: EGM96", status: "ready" },
      { id: "sample-generated", label: "Sample/generated: full stats", status: "ready" },
      { id: "sync-state", label: "Sync: synced", status: "ready" },
    ];

    const Harness: React.FC = () => {
      const [activeTabId, setActiveTabId] = useState("scene-raster");
      return (
        <MapSceneWorkspace
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          statusChips={statusChips}
          raster={<div data-testid="scene-content-raster">Raster content</div>}
          temporal={<div data-testid="scene-content-temporal">Temporal content</div>}
          scene3d={<div data-testid="scene-content-3d">3D content</div>}
          zoning={<div data-testid="scene-content-zoning">Zoning content</div>}
          massing={<div data-testid="scene-content-massing">Massing content</div>}
          sunShadow={<div data-testid="scene-content-sunshadow">Sun content</div>}
          voxCity={<div data-testid="scene-content-voxcity">VoxCity content</div>}
        />
      );
    };

    render(<Harness />);

    expect(query("map-scene-workspace")).not.toBeNull();
    expect(query("map-workbench-sidebar-tab-scene-raster")?.textContent).toContain("Raster");
    expect(query("map-workbench-sidebar-tab-scene-temporal")?.textContent).toContain("Temporal");
    expect(query("map-workbench-sidebar-tab-scene-3d")?.textContent).toContain("3D Scene");
    expect(query("map-workbench-sidebar-tab-scene-zoning")?.textContent).toContain("Zoning");
    expect(query("map-workbench-sidebar-tab-scene-massing")?.textContent).toContain("Massing");
    expect(query("map-workbench-sidebar-tab-scene-sun-shadow")?.textContent).toContain("Sun/Shadow");
    expect(query("map-workbench-sidebar-tab-scene-voxcity")?.textContent).toContain("VoxCity");
    expect(query("map-scene-status-source-mode")?.textContent).toContain("Source mode");
    expect(query("map-scene-status-crs")?.textContent).toContain("CRS");
    expect(query("map-scene-status-vertical-datum")?.textContent).toContain("Vertical datum");
    expect(query("map-scene-status-sample-generated")?.textContent).toContain("Sample/generated");
    expect(query("map-scene-status-sync-state")?.textContent).toContain("Sync");
    expect(query("scene-content-raster")).not.toBeNull();
    expect(query("scene-content-3d")).toBeNull();

    click("map-workbench-sidebar-tab-scene-3d");
    expect(query("scene-content-3d")).not.toBeNull();
    expect(query("scene-content-raster")).toBeNull();

    click("map-workbench-sidebar-tab-scene-voxcity");
    expect(query("scene-content-voxcity")).not.toBeNull();
    expect(query("scene-content-3d")).toBeNull();
  });
});

