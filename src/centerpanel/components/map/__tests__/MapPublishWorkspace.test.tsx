// @vitest-environment jsdom

import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { MapPublishWorkspace, type MapPublishReadinessItem } from "../publish";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(node: React.ReactNode): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(node);
  });
}

function query(testId: string): Element | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

function click(testId: string): void {
  const element = query(testId);
  if (!element) throw new Error(`${testId} was not rendered`);
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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

describe("MapPublishWorkspace", () => {
  it("exposes the Prompt 14 publish tabs, readiness checklist, and lazy tab bodies", () => {
    const readinessItems: MapPublishReadinessItem[] = [
      { id: "title", label: "Title", status: "ready", detail: "Title recorded.", required: true },
      { id: "visible-layers", label: "Visible layers", status: "ready", detail: "2 visible layers.", required: true },
      { id: "crs", label: "CRS", status: "caveat", detail: "One layer has CRS caveats.", required: true },
      { id: "legend", label: "Legend", status: "ready", detail: "Legend available.", required: true },
      { id: "scale-bar", label: "Scale bar", status: "ready", detail: "Scale bar enabled.", required: true },
      { id: "north-arrow", label: "North arrow", status: "ready", detail: "North arrow enabled.", required: true },
      { id: "attribution", label: "Attribution", status: "ready", detail: "Attribution included.", required: true },
      { id: "qa-caveats", label: "QA caveats", status: "caveat", detail: "Warnings travel with the package." },
      { id: "evidence-ids", label: "Evidence IDs", status: "ready", detail: "map-evidence-1" },
    ];

    const Harness: React.FC = () => {
      const [activeTabId, setActiveTabId] = useState("publish-figure");
      return (
        <MapPublishWorkspace
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          readinessItems={readinessItems}
          figure={<div data-testid="publish-content-figure">Figure content</div>}
          dataExport={<div data-testid="publish-content-data">Data export content</div>}
          report={<div data-testid="publish-content-report">Report content</div>}
          offlinePackage={<div data-testid="publish-content-offline">Offline package content</div>}
          reviewPackage={<div data-testid="publish-content-review">Review package content</div>}
        />
      );
    };

    render(<Harness />);

    expect(query("map-publish-workspace")).not.toBeNull();
    expect(query("map-workbench-sidebar-tab-publish-figure")?.textContent).toContain("Figure");
    expect(query("map-workbench-sidebar-tab-publish-data-export")?.textContent).toContain("Data Export");
    expect(query("map-workbench-sidebar-tab-publish-report")?.textContent).toContain("Report");
    expect(query("map-workbench-sidebar-tab-publish-offline-package")?.textContent).toContain("Offline Package");
    expect(query("map-workbench-sidebar-tab-publish-review-package")?.textContent).toContain("Review Package");
    expect(query("map-publish-readiness-title")?.textContent).toContain("Title");
    expect(query("map-publish-readiness-visible-layers")?.textContent).toContain("Visible layers");
    expect(query("map-publish-readiness-crs")?.textContent).toContain("CRS");
    expect(query("map-publish-readiness-legend")?.textContent).toContain("Legend");
    expect(query("map-publish-readiness-scale-bar")?.textContent).toContain("Scale bar");
    expect(query("map-publish-readiness-north-arrow")?.textContent).toContain("North arrow");
    expect(query("map-publish-readiness-attribution")?.textContent).toContain("Attribution");
    expect(query("map-publish-readiness-qa-caveats")?.textContent).toContain("QA caveats");
    expect(query("map-publish-readiness-evidence-ids")?.textContent).toContain("Evidence IDs");
    expect(query("publish-content-figure")).not.toBeNull();
    expect(query("publish-content-data")).toBeNull();

    click("map-workbench-sidebar-tab-publish-data-export");
    expect(query("publish-content-data")).not.toBeNull();
    expect(query("publish-content-figure")).toBeNull();

    click("map-workbench-sidebar-tab-publish-review-package");
    expect(query("publish-content-review")).not.toBeNull();
    expect(query("publish-content-data")).toBeNull();
  });

  it("P21: renders caveats and evidence sections when provided", () => {
    const readinessItems: MapPublishReadinessItem[] = [
      { id: "layers", label: "Layers", status: "ready", detail: "All layers ready." },
    ];

    const caveats = [
      "This is a preliminary output and should not be used for official reports.",
      "Spatial accuracy is limited to 10 meters at this zoom level.",
    ];

    const evidenceIds = ["evidence-2026-06-10-001", "evidence-2026-06-10-002"];

    const Harness: React.FC = () => {
      const [activeTabId, setActiveTabId] = useState("publish-figure");
      return (
        <MapPublishWorkspace
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          readinessItems={readinessItems}
          caveats={caveats}
          evidenceIds={evidenceIds}
          figure={<div data-testid="publish-content-figure">Figure content</div>}
          dataExport={<div data-testid="publish-content-data">Data export content</div>}
          report={<div data-testid="publish-content-report">Report content</div>}
          offlinePackage={<div data-testid="publish-content-offline">Offline package content</div>}
          reviewPackage={<div data-testid="publish-content-review">Review package content</div>}
        />
      );
    };

    render(<Harness />);

    // Verify readiness section renders
    expect(query("map-publish-readiness")).not.toBeNull();
    expect(query("map-publish-readiness-layers")).not.toBeNull();

    // Verify caveats section renders with proper styling
    expect(query("map-publish-caveats")).not.toBeNull();
    const caveatsSection = query("map-publish-caveats");
    expect(caveatsSection?.textContent).toContain("Caveats & Limitations");
    expect(caveatsSection?.textContent).toContain("preliminary output");
    expect(caveatsSection?.textContent).toContain("Spatial accuracy");

    // Verify evidence section renders
    expect(query("map-publish-evidence")).not.toBeNull();
    const evidenceSection = query("map-publish-evidence");
    expect(evidenceSection?.textContent).toContain("Evidence References");
    expect(evidenceSection?.textContent).toContain("evidence-2026-06-10-001");
    expect(evidenceSection?.textContent).toContain("evidence-2026-06-10-002");
  });

  it("P21: does not render caveats/evidence sections when empty", () => {
    const readinessItems: MapPublishReadinessItem[] = [
      { id: "layers", label: "Layers", status: "ready", detail: "All layers ready." },
    ];

    const Harness: React.FC = () => {
      const [activeTabId, setActiveTabId] = useState("publish-figure");
      return (
        <MapPublishWorkspace
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          readinessItems={readinessItems}
          figure={<div data-testid="publish-content-figure">Figure content</div>}
          dataExport={<div data-testid="publish-content-data">Data export content</div>}
          report={<div data-testid="publish-content-report">Report content</div>}
          offlinePackage={<div data-testid="publish-content-offline">Offline package content</div>}
          reviewPackage={<div data-testid="publish-content-review">Review package content</div>}
        />
      );
    };

    render(<Harness />);

    // Verify caveats and evidence sections do not render when empty
    expect(query("map-publish-caveats")).toBeNull();
    expect(query("map-publish-evidence")).toBeNull();

    // Verify readiness still renders
    expect(query("map-publish-readiness")).not.toBeNull();
  });
});
