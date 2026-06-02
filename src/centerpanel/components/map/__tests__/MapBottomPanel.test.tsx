// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapBottomPanel, type MapBottomPanelCoreTabId, type MapBottomPanelTask } from "../bottom";

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

function renderBottomPanel(options: {
  activeTabId?: MapBottomPanelCoreTabId;
  onTabChange?: (tabId: MapBottomPanelCoreTabId) => void;
  onClose?: () => void;
} = {}): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);

  act(() => {
    root!.render(
      <MapBottomPanel
        visible
        activeTabId={options.activeTabId ?? "problems"}
        onTabChange={options.onTabChange ?? (() => {})}
        onClose={options.onClose ?? (() => {})}
        problems={<div data-testid="problems-content">Problems content</div>}
        attributes={<div data-testid="attributes-content">Attributes content</div>}
        timeline={<div data-testid="timeline-content">Timeline content</div>}
        tasks={tasks}
        diagnostics={<div data-testid="diagnostics-content">Diagnostics content</div>}
      />,
    );
  });
}

function tab(tabId: MapBottomPanelCoreTabId): HTMLButtonElement {
  return host!.querySelector(`[data-testid="map-bottom-tab-${tabId}"]`)!;
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapBottomPanel", () => {
  it("renders the active tab content with semantic tabs", () => {
    renderBottomPanel({ activeTabId: "timeline" });

    expect(host!.querySelector('[data-testid="map-bottom-panel"]')?.getAttribute("data-active-bottom-tab")).toBe("timeline");
    expect(tab("timeline").getAttribute("aria-selected")).toBe("true");
    expect(host!.querySelector('[data-testid="timeline-content"]')?.textContent).toContain("Timeline content");
    expect(host!.querySelector('[data-testid="problems-content"]')).toBeNull();
  });

  it("routes pointer tab changes and close actions", () => {
    const onTabChange = vi.fn();
    const onClose = vi.fn();
    renderBottomPanel({ onTabChange, onClose });

    act(() => tab("attributes").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onTabChange).toHaveBeenCalledWith("attributes");

    const closeButton = host!.querySelector('button[aria-label="Close bottom panel"]')!;
    act(() => closeButton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports arrow, Home, and End keyboard navigation", () => {
    const onTabChange = vi.fn();
    renderBottomPanel({ activeTabId: "problems", onTabChange });

    act(() => tab("problems").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    act(() => tab("problems").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
    act(() => tab("problems").dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true })));
    act(() => tab("problems").dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true })));

    expect(onTabChange).toHaveBeenNthCalledWith(1, "attributes");
    expect(onTabChange).toHaveBeenNthCalledWith(2, "diagnostics");
    expect(onTabChange).toHaveBeenNthCalledWith(3, "diagnostics");
    expect(onTabChange).toHaveBeenNthCalledWith(4, "problems");
  });

  it("closes with scoped Escape without bubbling to the modal", () => {
    const onClose = vi.fn();
    renderBottomPanel({ onClose });

    const panel = host!.querySelector('[data-testid="map-bottom-panel"]')!;
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    const bubbleListener = vi.fn();
    document.body.addEventListener("keydown", bubbleListener);

    act(() => panel.dispatchEvent(event));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(bubbleListener).not.toHaveBeenCalled();
    document.body.removeEventListener("keydown", bubbleListener);
  });
});