// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { useMapWorkflowController } from "../useMapWorkflowController";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderWorkflowControllerHook() {
  let current: ReturnType<typeof useMapWorkflowController> | null = null;
  const container = document.createElement("div");
  const root = createRoot(container);

  function Harness() {
    current = useMapWorkflowController();
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    get current() {
      if (!current) {
        throw new Error("useMapWorkflowController did not render");
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

describe("useMapWorkflowController", () => {
  it("owns workflow drawer and preview state", () => {
    const hook = renderWorkflowControllerHook();

    expect(hook.current.showWorkflowDrawer).toBe(false);
    expect(hook.current.workflowPreview).toBeNull();

    act(() => {
      hook.current.setShowWorkflowDrawer(true);
      hook.current.setWorkflowPreview({ id: "preview-1" } as never);
    });

    expect(hook.current.showWorkflowDrawer).toBe(true);
    expect(hook.current.workflowPreview).toEqual({ id: "preview-1" });

    hook.cleanup();
  });
});
