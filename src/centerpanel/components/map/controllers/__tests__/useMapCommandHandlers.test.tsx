// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { useMapCommandHandlers, type MapToolbarCommandKind } from "../useMapCommandHandlers";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderCommandHandlers(callbacks: Record<MapToolbarCommandKind, () => void>) {
  let current: ReturnType<typeof useMapCommandHandlers> | null = null;
  const container = document.createElement("div");
  const root = createRoot(container);

  function Harness() {
    current = useMapCommandHandlers({
      onImport: callbacks.import,
      onDataExport: callbacks["data-export"],
      onImageExport: callbacks["image-export"],
      onReportHandoff: callbacks["report-handoff"],
      onProjectSave: callbacks["project-save"],
      onProjectLoad: callbacks["project-load"],
    });
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    get current() {
      if (!current) {
        throw new Error("useMapCommandHandlers did not render");
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

describe("useMapCommandHandlers", () => {
  it("dispatches toolbar commands to the matching action", () => {
    const callbacks: Record<MapToolbarCommandKind, () => void> = {
      import: vi.fn(),
      "data-export": vi.fn(),
      "image-export": vi.fn(),
      "report-handoff": vi.fn(),
      "project-save": vi.fn(),
      "project-load": vi.fn(),
    };
    const hook = renderCommandHandlers(callbacks);

    act(() => {
      hook.current.runCommand("image-export");
      hook.current.runCommand("project-save");
      hook.current.importData();
    });

    expect(callbacks["image-export"]).toHaveBeenCalledTimes(1);
    expect(callbacks["project-save"]).toHaveBeenCalledTimes(1);
    expect(callbacks.import).toHaveBeenCalledTimes(1);
    expect(callbacks["data-export"]).not.toHaveBeenCalled();
    expect(callbacks["report-handoff"]).not.toHaveBeenCalled();
    expect(callbacks["project-load"]).not.toHaveBeenCalled();

    hook.cleanup();
  });
});
