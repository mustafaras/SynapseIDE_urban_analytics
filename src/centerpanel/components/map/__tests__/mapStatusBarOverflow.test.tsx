// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapStatusBar } from "../MapStatusBar";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderStatusBar(width: number): void {
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
        layoutWidthOverride={width}
        {...callbacks}
      />,
    );
  });
}

function getVisibleSegmentIds(): string[] {
  return Array.from(host!.querySelectorAll<HTMLElement>("[data-map-status-segment]:not([data-map-status-overflow='true'])"))
    .map((node) => node.dataset.mapStatusSegment)
    .filter((value): value is string => Boolean(value) && value !== "overflow");
}

function getOverflowSegmentIds(): string[] {
  return Array.from(host!.querySelectorAll<HTMLElement>("[data-map-status-overflow='true'][data-map-status-segment]"))
    .map((node) => node.dataset.mapStatusSegment)
    .filter((value): value is string => Boolean(value));
}

function getAllSegmentIdsFromMeasureLayer(): string[] {
  return Array.from(host!.querySelectorAll<HTMLElement>("[data-map-status-measure-segment]"))
    .map((node) => node.dataset.mapStatusMeasureSegment)
    .filter((value): value is string => Boolean(value));
}

function openOverflowMenuIfPresent(): boolean {
  const trigger = host!.querySelector<HTMLElement>("[data-map-status-segment='overflow']");
  if (!trigger) {
    return false;
  }
  act(() => {
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  return true;
}

afterEach(() => {
  if (root) {
    act(() => {
      root!.unmount();
    });
  }
  host?.remove();
  root = null;
  host = null;
});

describe("MapStatusBar overflow partition", () => {
  it("keeps partition exhaustive and disjoint across representative widths", () => {
    const widths = [1600, 900, 620, 420, 320];

    for (const width of widths) {
      renderStatusBar(width);

      const allIds = getAllSegmentIdsFromMeasureLayer();
      const visibleIds = getVisibleSegmentIds();
      const hasOverflow = openOverflowMenuIfPresent();
      const overflowIds = hasOverflow ? getOverflowSegmentIds() : [];

      const unionIds = new Set([...visibleIds, ...overflowIds]);
      const duplicateInVisible = visibleIds.length !== new Set(visibleIds).size;
      const duplicateInOverflow = overflowIds.length !== new Set(overflowIds).size;
      const intersectionCount = visibleIds.filter((id) => overflowIds.includes(id)).length;

      expect(duplicateInVisible).toBe(false);
      expect(duplicateInOverflow).toBe(false);
      expect(intersectionCount).toBe(0);
      expect(unionIds.size).toBe(new Set(allIds).size);
      expect(new Set(allIds).size).toBeGreaterThan(0);
      expect(visibleIds.length + overflowIds.length).toBe(new Set(allIds).size);

      act(() => {
        root!.unmount();
      });
      host?.remove();
      root = null;
      host = null;
    }
  });

  it("renders overflow menu entries exactly for overflow segments", () => {
    renderStatusBar(420);

    const hasOverflow = openOverflowMenuIfPresent();
    expect(hasOverflow).toBe(true);

    const overflowIds = getOverflowSegmentIds();
    const overflowCountFromMarker = Number(host!.querySelector("[data-map-status-bar='true']")?.getAttribute("data-map-status-overflow-count") ?? "0");

    expect(overflowIds.length).toBeGreaterThan(0);
    expect(overflowIds.length).toBe(overflowCountFromMarker);

    const menuItems = host!.querySelectorAll("[role='menu'] [role='menuitem']");
    expect(menuItems.length).toBe(overflowIds.length);
  });

  it("keeps More trigger visibility in sync with overflow count", () => {
    renderStatusBar(2200);

    const trigger = host!.querySelector("[data-map-status-segment='overflow']");
    const overflowCountFromMarker = Number(host!.querySelector("[data-map-status-bar='true']")?.getAttribute("data-map-status-overflow-count") ?? "0");

    if (overflowCountFromMarker === 0) {
      expect(trigger).toBeNull();
      return;
    }

    expect(trigger).toBeTruthy();
  });

  it("keeps QA segment accessible under tight width", () => {
    renderStatusBar(320);

    const hasOverflow = openOverflowMenuIfPresent();

    const qaVisible = host!.querySelector("[data-map-status-segment='qa']:not([data-map-status-overflow='true'])");
    const qaOverflow = hasOverflow
      ? host!.querySelector("[data-map-status-overflow='true'][data-map-status-segment='qa']")
      : null;

    expect(Boolean(qaVisible) || Boolean(qaOverflow)).toBe(true);
  });
});
