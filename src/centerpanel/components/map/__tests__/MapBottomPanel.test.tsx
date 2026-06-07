// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import {
  MapBottomPanelScrollBody,
  MapBottomPanelTasksBody,
  type MapBottomPanelTask,
} from "../bottom";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../");

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

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

describe("MapBottomPanel is retired as a workspace host", () => {
  it("MapBottomPanel is no longer rendered in MapExplorerModalComposition", () => {
    const composition = readRepoFile("src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx");
    // The host shell MapBottomPanel component must not be rendered (check for the tag with attributes/newline)
    expect(composition).not.toMatch(/<MapBottomPanel\b(?!ScrollBody|TasksBody|ActiveBody)/);
    expect(composition).not.toContain("bottomPanelOpen");
    expect(composition).not.toContain("setBottomPanelOpen");
    expect(composition).not.toContain("closeBottomPanel");
  });

  it("MapPanelRailSide no longer includes bottom placement", () => {
    const shell = readRepoFile("src/centerpanel/components/map/MapWorkspaceShell.tsx");
    expect(shell).not.toContain('"left" | "right" | "bottom"');
    expect(shell).toContain('"left" | "right"');
  });

  it("status bar remains as the only bottom edge element", () => {
    const composition = readRepoFile("src/centerpanel/components/map/controllers/MapExplorerModalComposition.tsx");
    expect(composition).toContain("MapStatusBarWithCursor");
    expect(composition).toContain("MapBottomTimeline");
  });
});
