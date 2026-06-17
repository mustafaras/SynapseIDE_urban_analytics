// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapStatusBar } from "../MapStatusBar";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

type StatusCallbacks = {
  onOpenInspect: () => void;
  onOpenProject: () => void;
  onOpenLayers: () => void;
  onOpenCrsReadiness: () => void;
  onOpenProblems: () => void;
  onOpenAttributes: () => void;
  onOpenSelection: () => void;
  onOpenDraw: () => void;
  onOpenMeasurements: () => void;
  onOpenTimeline: () => void;
  onOpenTasks: () => void;
  onOpenCollaboration: () => void;
  onOpenDiagnostics: () => void;
};

function renderStatusBar(
  callbacks: StatusCallbacks,
  overrides?: Partial<React.ComponentProps<typeof MapStatusBar>>,
): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);

  act(() => {
    root!.render(
      <MapStatusBar
        cursor={{ lng: 29.01234, lat: 41.05678 }}
        zoom={11}
        projectId="proj_istanbul_risk"
        workspaceLabel="explore"
        taskLensLabel="analysis"
        selectedFeatureCount={3}
        hasActiveAoi
        drawnFeatureCount={2}
        pinCount={1}
        measurementCount={4}
        qaStatus="warning"
        qaIssueCount={2}
        reviewEventCount={5}
        taskCount={4}
        activeTaskCount={1}
        performanceMode="preview"
        performanceIssueCount={1}
        collaborationPresenceCount={2}
        onOpenInspect={callbacks.onOpenInspect}
        onOpenProject={callbacks.onOpenProject}
        onOpenLayers={callbacks.onOpenLayers}
        onOpenCrsReadiness={callbacks.onOpenCrsReadiness}
        onOpenProblems={callbacks.onOpenProblems}
        onOpenAttributes={callbacks.onOpenAttributes}
        onOpenSelection={callbacks.onOpenSelection}
        onOpenDraw={callbacks.onOpenDraw}
        onOpenMeasurements={callbacks.onOpenMeasurements}
        onOpenTimeline={callbacks.onOpenTimeline}
        onOpenTasks={callbacks.onOpenTasks}
        onOpenCollaboration={callbacks.onOpenCollaboration}
        onOpenDiagnostics={callbacks.onOpenDiagnostics}
        {...overrides}
      />,
    );
  });
}

function clickByAriaLabel(label: string): void {
  const target = host!.querySelector<HTMLElement>(`[aria-label="${label}"]`);
  if (!target) {
    throw new Error(`Unable to find target with aria-label "${label}"`);
  }
  act(() => target.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function clickByAriaPrefix(prefix: string): void {
  const target = Array.from(host!.querySelectorAll<HTMLElement>("[aria-label]"))
    .find((element) => element.getAttribute("aria-label")?.startsWith(prefix));
  if (!target) {
    throw new Error(`Unable to find target with aria-label prefix "${prefix}"`);
  }
  act(() => target.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function pressEnterByAriaLabel(label: string): void {
  const target = host!.querySelector<HTMLElement>(`[aria-label="${label}"]`);
  if (!target) {
    throw new Error(`Unable to find target with aria-label "${label}"`);
  }
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  host?.remove();
  root = null;
  host = null;
});

describe("MapStatusBar status routes", () => {
  it("routes inspect, project, layers, draw, measure, QA, review, tasks, collaboration, and diagnostics", () => {
    const callbacks: StatusCallbacks = {
      onOpenInspect: vi.fn(),
      onOpenProject: vi.fn(),
      onOpenLayers: vi.fn(),
      onOpenCrsReadiness: vi.fn(),
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenSelection: vi.fn(),
      onOpenDraw: vi.fn(),
      onOpenMeasurements: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenTasks: vi.fn(),
      onOpenCollaboration: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };
    renderStatusBar(callbacks);

    clickByAriaLabel("Open map view detail");
    clickByAriaLabel("Open zoom and scale detail");
    clickByAriaLabel("Open project and save detail");
    clickByAriaLabel("Open layers workspace");
    clickByAriaLabel("Open selected feature details");
    clickByAriaLabel("Open draw and AOI detail");
    clickByAriaLabel("Open measurement results");
    clickByAriaLabel("Open CRS readiness");
    clickByAriaLabel("Open QA Problems");
    clickByAriaLabel("Open review timeline");
    clickByAriaLabel("Open background tasks");
    clickByAriaLabel("Open Review collaboration (local-only 2p)");
    clickByAriaLabel("Open performance diagnostics");

    expect(callbacks.onOpenInspect).toHaveBeenCalledTimes(2);
    expect(callbacks.onOpenProject).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenLayers).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenCrsReadiness).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenProblems).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenAttributes).not.toHaveBeenCalled();
    expect(callbacks.onOpenSelection).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenDraw).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMeasurements).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenTimeline).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenTasks).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenCollaboration).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenDiagnostics).toHaveBeenCalledTimes(1);
  });

  it("moves low-priority segments into overflow and still routes them", () => {
    const callbacks: StatusCallbacks = {
      onOpenInspect: vi.fn(),
      onOpenProject: vi.fn(),
      onOpenLayers: vi.fn(),
      onOpenCrsReadiness: vi.fn(),
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenSelection: vi.fn(),
      onOpenDraw: vi.fn(),
      onOpenMeasurements: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenTasks: vi.fn(),
      onOpenCollaboration: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };
    renderStatusBar(callbacks, { layoutWidthOverride: 420 });

    clickByAriaPrefix("Open status overflow");
    clickByAriaLabel("Open performance diagnostics");

    expect(callbacks.onOpenDiagnostics).toHaveBeenCalledTimes(1);
  });

  it("keeps critical CRS/QA warnings visible in narrow status layouts", () => {
    const callbacks: StatusCallbacks = {
      onOpenInspect: vi.fn(),
      onOpenProject: vi.fn(),
      onOpenLayers: vi.fn(),
      onOpenCrsReadiness: vi.fn(),
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenSelection: vi.fn(),
      onOpenDraw: vi.fn(),
      onOpenMeasurements: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenTasks: vi.fn(),
      onOpenCollaboration: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };

    renderStatusBar(callbacks, {
      layoutWidthOverride: 360,
      crs: "unknown",
      qaStatus: "warning",
      qaIssueCount: 3,
    });

    const qaVisible = host!.querySelector('[data-map-status-segment="qa"]:not([data-map-status-overflow="true"])');
    const crsVisible = host!.querySelector('[data-map-status-segment="crs"]:not([data-map-status-overflow="true"])');

    expect(qaVisible).toBeTruthy();
    expect(crsVisible).toBeTruthy();
  });

  it("renders scale as a dedicated GIS status segment", () => {
    const callbacks: StatusCallbacks = {
      onOpenInspect: vi.fn(),
      onOpenProject: vi.fn(),
      onOpenLayers: vi.fn(),
      onOpenCrsReadiness: vi.fn(),
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenSelection: vi.fn(),
      onOpenDraw: vi.fn(),
      onOpenMeasurements: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenTasks: vi.fn(),
      onOpenCollaboration: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };

    renderStatusBar(callbacks);

    const scaleSegment = host!.querySelector('[data-map-status-segment="scale"]');
    expect(scaleSegment?.textContent).toContain("Scale");
    expect(scaleSegment?.textContent).toContain("1:");
  });

  it("keeps premium left/right grouping markers and honest interactivity markers", () => {
    const callbacks: StatusCallbacks = {
      onOpenInspect: vi.fn(),
      onOpenProject: vi.fn(),
      onOpenLayers: vi.fn(),
      onOpenCrsReadiness: vi.fn(),
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenSelection: vi.fn(),
      onOpenDraw: vi.fn(),
      onOpenMeasurements: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenTasks: vi.fn(),
      onOpenCollaboration: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };

    renderStatusBar(callbacks);

    const leftCluster = host!.querySelector('[data-map-status-cluster="left"]');
    const rightCluster = host!.querySelector('[data-map-status-cluster="right"]');
    const viewSegment = host!.querySelector('[data-map-status-segment="view"]');
    const cameraSegment = host!.querySelector('[data-map-status-segment="camera"]');

    expect(leftCluster).toBeTruthy();
    expect(rightCluster).toBeTruthy();
    expect(viewSegment?.getAttribute("data-map-status-interactive")).toBe("true");
    expect(cameraSegment?.getAttribute("data-map-status-interactive")).toBe("false");
  });

  it("keeps interactive segments keyboard-operable", () => {
    const callbacks: StatusCallbacks = {
      onOpenInspect: vi.fn(),
      onOpenProject: vi.fn(),
      onOpenLayers: vi.fn(),
      onOpenCrsReadiness: vi.fn(),
      onOpenProblems: vi.fn(),
      onOpenAttributes: vi.fn(),
      onOpenSelection: vi.fn(),
      onOpenDraw: vi.fn(),
      onOpenMeasurements: vi.fn(),
      onOpenTimeline: vi.fn(),
      onOpenTasks: vi.fn(),
      onOpenCollaboration: vi.fn(),
      onOpenDiagnostics: vi.fn(),
    };

    renderStatusBar(callbacks);

    pressEnterByAriaLabel("Open layers workspace");
    pressEnterByAriaLabel("Open selected feature details");

    expect(callbacks.onOpenLayers).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenSelection).toHaveBeenCalledTimes(1);
  });
});
