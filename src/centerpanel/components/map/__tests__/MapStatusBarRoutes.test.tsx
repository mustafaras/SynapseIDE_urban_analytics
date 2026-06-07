// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapStatusBar } from "../MapStatusBar";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderStatusBar(callbacks: {
  onOpenCrsReadiness: () => void;
  onOpenProblems: () => void;
  onOpenAttributes: () => void;
  onOpenSelection: () => void;
  onOpenMeasurements: () => void;
  onOpenTimeline: () => void;
  onOpenCollaboration: () => void;
  onOpenDiagnostics: () => void;
}): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);

  act(() => {
    root!.render(
      <MapStatusBar
        zoom={11}
        selectedFeatureCount={3}
        qaStatus="warning"
        qaIssueCount={2}
        reviewEventCount={5}
        performanceMode="preview"
        performanceIssueCount={1}
        onOpenCrsReadiness={callbacks.onOpenCrsReadiness}
        onOpenProblems={callbacks.onOpenProblems}
        onOpenAttributes={callbacks.onOpenAttributes}
        onOpenSelection={callbacks.onOpenSelection}
        onOpenMeasurements={callbacks.onOpenMeasurements}
        onOpenTimeline={callbacks.onOpenTimeline}
        onOpenCollaboration={callbacks.onOpenCollaboration}
        onOpenDiagnostics={callbacks.onOpenDiagnostics}
      />,
    );
  });
}

function clickStatus(label: string): void {
  const button = host!.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapStatusBar right-dock routes", () => {
  it("routes CRS, QA, selection, measurements, review, collaboration, and performance status items", () => {
    const callbacks = {
      onOpenCrsReadiness: vi.fn(),
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenSelection: vi.fn(),
      onOpenMeasurements: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenCollaboration: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };
    renderStatusBar(callbacks);

    clickStatus("Open CRS readiness");
    clickStatus("Open QA Problems");
    clickStatus("Open selected feature details");
    clickStatus("Open measurement results");
    clickStatus("Open Review collaboration (local-only)");
    clickStatus("Open review timeline");
    clickStatus("Open performance diagnostics");

    expect(callbacks.onOpenCrsReadiness).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenProblems).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenAttributes).not.toHaveBeenCalled();
    expect(callbacks.onOpenSelection).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMeasurements).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenCollaboration).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenTimeline).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenDiagnostics).toHaveBeenCalledTimes(1);
  });
});
