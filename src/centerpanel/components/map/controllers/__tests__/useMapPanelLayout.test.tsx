// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { useMapPanelLayout } from "../useMapPanelLayout";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderPanelLayoutHook(
  options: Parameters<typeof useMapPanelLayout>[0],
) {
  let current: ReturnType<typeof useMapPanelLayout> | null = null;
  const container = document.createElement("div");
  const root = createRoot(container);

  function Harness() {
    current = useMapPanelLayout(options);
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    get current() {
      if (!current) {
        throw new Error("useMapPanelLayout did not render");
      }
      return current;
    },
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

const baseOptions: Parameters<typeof useMapPanelLayout>[0] = {
  mapContainerWidth: 1440,
  showLayerPanel: true,
  showScientificQAPanel: false,
  showUrbanMethodPanel: false,
  showNLQueryPanel: false,
  showWorkflowDrawer: false,
  showReviewTimeline: false,
  hasReportHandoffSource: false,
  activeRightDockRoutePanel: null,
  navigatorStageMode: false,
  navigatorStageMargin: 24,
  layoutPreferences: {
    layerPanelWidth: 320,
    rightPanelWidth: 380,
  },
};

describe("useMapPanelLayout", () => {
  it("prioritizes report handoff over other right dock panels", () => {
    const hook = renderPanelLayoutHook({
      ...baseOptions,
      showScientificQAPanel: true,
      showWorkflowDrawer: true,
      hasReportHandoffSource: true,
    });

    expect(hook.current.requestedRightDockPanel).toBe("report");
    expect(hook.current.dockLayout.activeRightPanel).toBe("report");

    hook.cleanup();
  });

  it("uses navigator insets when the navigator stage is active", () => {
    const hook = renderPanelLayoutHook({
      ...baseOptions,
      navigatorStageMode: true,
      navigatorStageMargin: 32,
    });

    expect(hook.current.navigatorLeftInset).toBe(32);
    expect(hook.current.navigatorRightInset).toBe(32);

    hook.cleanup();
  });

  it("keeps the active Urban method request ahead of workflow and QA rails", () => {
    const hook = renderPanelLayoutHook({
      ...baseOptions,
      showUrbanMethodPanel: true,
      showScientificQAPanel: true,
      showWorkflowDrawer: true,
    });

    expect(hook.current.requestedRightDockPanel).toBe("urbanMethod");
    expect(hook.current.effectiveShowUrbanMethodPanel).toBe(true);
    expect(hook.current.effectiveShowScientificQAPanel).toBe(false);
    expect(hook.current.effectiveShowWorkflowDrawer).toBe(false);

    hook.cleanup();
  });

  it("treats the drawing-modal route as floating — it reserves no right rail (p04 single source)", () => {
    const hook = renderPanelLayoutHook({
      ...baseOptions,
      activeRightDockRoutePanel: "draw",
    });

    // The drawing modal paints over the map; it must not become the docked
    // right panel or shift the center lane.
    expect(hook.current.requestedRightDockPanel).toBeNull();
    expect(hook.current.dockLayout.activeRightPanel).toBeNull();
    expect(hook.current.dockLayout.showDrawPanel).toBe(false);

    hook.cleanup();
  });

  it("reserves the right rail for pins / measure straight from the active route", () => {
    const pinsHook = renderPanelLayoutHook({ ...baseOptions, activeRightDockRoutePanel: "pins" });
    expect(pinsHook.current.requestedRightDockPanel).toBe("pins");
    expect(pinsHook.current.effectiveShowSidebar).toBe(true);
    pinsHook.cleanup();

    const measureHook = renderPanelLayoutHook({ ...baseOptions, activeRightDockRoutePanel: "measure" });
    expect(measureHook.current.requestedRightDockPanel).toBe("measure");
    expect(measureHook.current.effectiveShowMeasurePanel).toBe(true);
    measureHook.cleanup();
  });

  it("lets the active route outrank the legacy QA / workflow layout fallbacks", () => {
    const hook = renderPanelLayoutHook({
      ...baseOptions,
      activeRightDockRoutePanel: "inspect",
      showScientificQAPanel: true,
      showWorkflowDrawer: true,
    });

    expect(hook.current.requestedRightDockPanel).toBe("inspect");

    hook.cleanup();
  });
});
