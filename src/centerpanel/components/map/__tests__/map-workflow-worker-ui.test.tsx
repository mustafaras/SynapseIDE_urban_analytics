// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapWorkflowDrawer } from "../MapWorkflowDrawer";
import { buildMapWorkflowContext } from "../../../../services/map/MapWorkflowService";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const context = buildMapWorkflowContext([]);

describe("MapWorkflowDrawer worker execution UI", () => {
  it("renders a progress bar + cancel control while a workflow runs in a worker", () => {
    const onCancelWorkflow = vi.fn();
    act(() => {
      root?.render(
        <MapWorkflowDrawer
          visible
          context={context}
          onClose={() => {}}
          onApply={() => {}}
          onCancelWorkflow={onCancelWorkflow}
          workflowExecution={{ status: "running", percent: 42, stage: "Buffering features", detail: "5,000 / 12,000" }}
        />,
      );
    });

    const progress = host?.querySelector('[data-testid="map-workflow-progress"]');
    expect(progress).not.toBeNull();
    expect(progress?.getAttribute("aria-valuenow")).toBe("42");

    const cancel = host?.querySelector('[data-testid="map-workflow-cancel"]') as HTMLButtonElement | null;
    expect(cancel).not.toBeNull();
    act(() => cancel?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onCancelWorkflow).toHaveBeenCalledTimes(1);
  });

  it("surfaces an explicit failure state", () => {
    act(() => {
      root?.render(
        <MapWorkflowDrawer
          visible
          context={context}
          onClose={() => {}}
          onApply={() => {}}
          workflowExecution={{ status: "failed", percent: 0, error: "geos overlay failed" }}
        />,
      );
    });

    const error = host?.querySelector('[data-testid="map-workflow-error"]');
    expect(error).not.toBeNull();
    expect(error?.textContent).toContain("geos overlay failed");
    // No progress bar once failed.
    expect(host?.querySelector('[data-testid="map-workflow-progress"]')).toBeNull();
  });
});
