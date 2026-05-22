// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { DEFAULT_MAP_REPORT_HANDOFF_OPTIONS } from "@/services/map/MapReportHandoffService";
import { useMapReportController } from "../useMapReportController";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderReportControllerHook() {
  let current: ReturnType<typeof useMapReportController> | null = null;
  const container = document.createElement("div");
  const root = createRoot(container);

  function Harness() {
    current = useMapReportController();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    get current() {
      if (!current) {
        throw new Error("useMapReportController did not render");
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

describe("useMapReportController", () => {
  it("owns report handoff options and export busy states", () => {
    const hook = renderReportControllerHook();

    expect(hook.current.reportHandoffOptions).toBe(DEFAULT_MAP_REPORT_HANDOFF_OPTIONS);
    expect(hook.current.isGeneratingReportHandoffSnapshot).toBe(false);
    expect(hook.current.isExportingReportHandoffPdf).toBe(false);

    act(() => {
      hook.current.setIsGeneratingReportHandoffSnapshot(true);
      hook.current.setIsExportingReportHandoffPdf(true);
    });

    expect(hook.current.isGeneratingReportHandoffSnapshot).toBe(true);
    expect(hook.current.isExportingReportHandoffPdf).toBe(true);

    hook.cleanup();
  });
});
