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
  showSidebar: false,
  showDrawPanel: false,
  showMeasurePanel: false,
  showScientificQAPanel: false,
  showNLQueryPanel: false,
  showWorkflowDrawer: false,
  showReviewTimeline: false,
  hasReportHandoffSource: false,
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
});
