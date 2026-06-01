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
  onOpenProblems: () => void;
  onOpenAttributes: () => void;
  onOpenTimeline: () => void;
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
        onOpenProblems={callbacks.onOpenProblems}
        onOpenAttributes={callbacks.onOpenAttributes}
        onOpenTimeline={callbacks.onOpenTimeline}
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

describe("MapStatusBar bottom panel routes", () => {
  it("routes QA, selection, review, and performance status items", () => {
    const callbacks = {
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };
    renderStatusBar(callbacks);

    clickStatus("Open QA Problems");
    clickStatus("Open selected feature attributes");
    clickStatus("Open review timeline");
    clickStatus("Open performance diagnostics");

    expect(callbacks.onOpenProblems).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenAttributes).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenTimeline).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenDiagnostics).toHaveBeenCalledTimes(1);
  });
});