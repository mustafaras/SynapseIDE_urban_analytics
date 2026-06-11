// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import {
  MapBottomPanelScrollBody,
  type MapBottomPanelTask,
  MapBottomPanelTasksBody,
} from "../bottom";

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

