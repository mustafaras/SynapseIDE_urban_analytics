// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FolderOpen, Upload } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapPremiumMenuBar } from "../shell";
import type { MapPremiumMenuModel, MapPremiumQuickActionModel } from "../shell/mapMenuModel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const menus: MapPremiumMenuModel[] = [
  {
    id: "project",
    label: "Project",
    shortLabel: "Project",
    title: "Project menu",
    icon: <FolderOpen aria-hidden="true" />,
    sections: [{ id: "workspace", items: [] }],
    triggerTestId: "map-premium-menu-project",
    menuTestId: "map-premium-menu-content-project",
  },
  {
    id: "add-data",
    label: "Add Data",
    shortLabel: "Data",
    title: "Add data menu",
    icon: <Upload aria-hidden="true" />,
    sections: [{ id: "imports", items: [] }],
    triggerTestId: "map-premium-menu-add-data",
    menuTestId: "map-premium-menu-content-add-data",
  },
];

const quickActions: MapPremiumQuickActionModel[] = [];

function renderMenuBar(width: number): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(<MapPremiumMenuBar menus={menus} quickActions={quickActions} width={width} />);
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
  vi.clearAllMocks();
});

describe("MapPremiumMenuBar", () => {
  it("keeps grouped menu triggers visible at desktop command widths", () => {
    renderMenuBar(683);

    expect(document.querySelector('[data-testid="map-premium-menu-compact"]')).toBeNull();
    expect(document.querySelector('[data-testid="map-premium-menu-project"]')?.textContent).toContain("Project");
    expect(document.querySelector('[data-testid="map-premium-menu-add-data"]')?.textContent).toContain("Data");
  });

  it("uses the hamburger fallback only for genuinely constrained command widths", () => {
    // Single-row command bar keeps menus visible down to ~420px; the hamburger
    // fallback is reserved for genuinely tiny widths below that.
    renderMenuBar(400);

    expect(document.querySelector('[data-testid="map-premium-menu-compact"]')?.textContent).toContain("Menu");
    expect(document.querySelector('[data-testid="map-premium-menu-project"]')).toBeNull();
  });
});
