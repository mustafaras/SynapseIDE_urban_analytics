// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MapBottomPanelScrollBody,
  type MapBottomPanelTask,
  MapBottomPanelTasksBody,
} from "../bottom";
import { MapBottomOutputDrawer, type MapBottomOutputDrawerTabId } from "../shell/MapBottomOutputDrawer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const tasks: MapBottomPanelTask[] = [
  {
    id: "render-budget",
    label: "Render budget",
    status: "complete",
    detail: "Visible layers are inside the declared render budget.",
    meta: "full",
  },
];

function renderNode(node: React.ReactNode): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);

  act(() => {
    root!.render(node);
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapBottomPanelScrollBody and MapBottomPanelTasksBody (right dock reusable bodies)", () => {
  it("renders reusable scroll body and tasks body outside the retired bottom panel shell", () => {
    renderNode(
      <section data-testid="right-dock-body">
        <MapBottomPanelScrollBody data-testid="reusable-scroll-body">
          <MapBottomPanelTasksBody tasks={tasks} />
        </MapBottomPanelScrollBody>
      </section>,
    );

    expect(host!.querySelector('[data-testid="right-dock-body"]')).toBeTruthy();
    expect(host!.querySelector('[data-testid="reusable-scroll-body"]')).toBeTruthy();
    expect(host!.querySelector('[data-testid="map-bottom-panel-tasks"]')?.textContent).toContain("Render budget");
  });

  it("renders empty state when tasks list is empty", () => {
    renderNode(<MapBottomPanelTasksBody tasks={[]} />);
    expect(host!.textContent).toContain("No background tasks");
  });

  it("renders multiple task rows with label, detail, and status", () => {
    const multipleTasks: MapBottomPanelTask[] = [
      { id: "import", label: "Data import", status: "running", detail: "Preparing spatial metadata.", meta: "75%" },
      { id: "render", label: "Render budget", status: "complete", detail: "Within budget.", meta: "full" },
    ];
    renderNode(<MapBottomPanelTasksBody tasks={multipleTasks} />);
    const taskList = host!.querySelector('[data-testid="map-bottom-panel-tasks"]');
    expect(taskList?.textContent).toContain("Data import");
    expect(taskList?.textContent).toContain("Render budget");
    expect(taskList?.textContent).toContain("running");
    expect(taskList?.textContent).toContain("complete");
  });
});

const drawerBodies: Record<MapBottomOutputDrawerTabId, React.ReactNode> = {
  attributes: <div>Attributes body</div>,
  timeline: <div>Timeline body</div>,
  problems: <div>Problems body</div>,
  logs: <div>Logs body</div>,
  evidence: <div>Evidence body</div>,
  review: <div>Review body</div>,
  reports: <div>Reports body</div>,
};

describe("MapBottomOutputDrawer", () => {
  it("stays collapsed until explicitly opened", () => {
    renderNode(
      <MapBottomOutputDrawer
        open={false}
        activeTabId="attributes"
        onTabChange={vi.fn()}
        onClose={vi.fn()}
        childrenByTab={drawerBodies}
        height={320}
        minHeight={176}
        maxHeight={520}
        onHeightChange={vi.fn()}
      />,
    );

    expect(host!.querySelector('[data-testid="map-bottom-output-drawer"]')).toBeNull();
  });

  it("renders output tabs, routes tab clicks, closes on Escape, and resizes by keyboard", () => {
    const onTabChange = vi.fn();
    const onClose = vi.fn();
    const onHeightChange = vi.fn();

    renderNode(
      <MapBottomOutputDrawer
        open
        activeTabId="attributes"
        onTabChange={onTabChange}
        onClose={onClose}
        childrenByTab={drawerBodies}
        height={320}
        minHeight={176}
        maxHeight={520}
        onHeightChange={onHeightChange}
      />,
    );

    expect(host!.querySelector('[data-testid="map-bottom-output-drawer"]')).toBeTruthy();
    expect(host!.textContent).toContain("Attributes");
    expect(host!.textContent).toContain("Reports");

    act(() => {
      host!.querySelector<HTMLButtonElement>('[data-testid="map-output-drawer-tab-problems"]')?.click();
    });
    expect(onTabChange).toHaveBeenCalledWith("problems");

    act(() => {
      host!.querySelector<HTMLElement>('[data-testid="map-bottom-output-drawer-resize-handle"]')?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }),
      );
    });
    expect(onHeightChange).toHaveBeenCalledWith(336);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

