// @vitest-environment jsdom

/**
 * Prompt 05 — Sidebar Host.
 *
 * Proves the single contextual sidebar host:
 *   1. renders the active activity title + content in one sidebar
 *   2. switches between Overview / Data / Layers content via the tab strip
 *   3. keeps import, catalog, layer stack, and contents entry points reachable
 *   4. shows an empty state for empty tabs
 *   5. fires close and collapse callbacks
 *   6. collapses to a slim rail with an expand affordance
 *   7. exposes accessible tablist / tabpanel wiring
 */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MapWorkbenchSidebar,
  type MapWorkbenchSidebarTab,
} from "@/centerpanel/components/map/sidebar";

afterEach(() => cleanup());

function buildActivityTabs(): MapWorkbenchSidebarTab[] {
  return [
    {
      id: "overview-readiness",
      label: "Readiness",
      render: () => <div data-testid="content-cockpit">Overview cockpit</div>,
    },
    {
      id: "data-import",
      label: "Import",
      render: () => (
        <div>
          <button type="button" data-testid="entry-import">
            Add data
          </button>
          <button type="button" data-testid="entry-catalog">
            Open catalog
          </button>
        </div>
      ),
    },
    {
      id: "layers-stack",
      label: "Stack",
      render: () => (
        <div>
          <div data-testid="content-layer-stack">Layer stack</div>
          <button type="button" data-testid="entry-contents">
            Open contents
          </button>
        </div>
      ),
    },
  ];
}

describe("MapWorkbenchSidebar", () => {
  it("renders the activity title and active tab content in one sidebar", () => {
    render(
      <MapWorkbenchSidebar
        title="Overview"
        tabs={buildActivityTabs()}
        activeTabId="overview-readiness"
        onTabChange={vi.fn()}
      />,
    );

    const sidebars = screen.getAllByTestId("map-workbench-sidebar");
    expect(sidebars).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Overview" })).toBeDefined();
    expect(screen.getByTestId("content-cockpit")).toBeDefined();
  });

  it("switches active tab content when a tab is selected", () => {
    function Harness() {
      const [activeId, setActiveId] = React.useState("overview-readiness");
      return (
        <MapWorkbenchSidebar
          title="Workbench"
          tabs={buildActivityTabs()}
          activeTabId={activeId}
          onTabChange={setActiveId}
        />
      );
    }
    render(<Harness />);

    expect(screen.getByTestId("content-cockpit")).toBeDefined();

    fireEvent.click(screen.getByTestId("map-workbench-sidebar-tab-data-import"));
    expect(screen.getByTestId("entry-import")).toBeDefined();
    expect(screen.getByTestId("entry-catalog")).toBeDefined();

    fireEvent.click(screen.getByTestId("map-workbench-sidebar-tab-layers-stack"));
    expect(screen.getByTestId("content-layer-stack")).toBeDefined();
    expect(screen.getByTestId("entry-contents")).toBeDefined();
  });

  it("keeps import, catalog, layer stack, and contents reachable across activities", () => {
    function Harness() {
      const [activeId, setActiveId] = React.useState("data-import");
      return (
        <MapWorkbenchSidebar
          title="Data"
          tabs={buildActivityTabs()}
          activeTabId={activeId}
          onTabChange={setActiveId}
        />
      );
    }
    render(<Harness />);

    expect(screen.getByTestId("entry-import")).toBeDefined();
    expect(screen.getByTestId("entry-catalog")).toBeDefined();

    fireEvent.click(screen.getByTestId("map-workbench-sidebar-tab-layers-stack"));
    expect(screen.getByTestId("content-layer-stack")).toBeDefined();
    expect(screen.getByTestId("entry-contents")).toBeDefined();
  });

  it("renders an empty state for an empty tab", () => {
    const tabs: MapWorkbenchSidebarTab[] = [
      {
        id: "data-health",
        label: "Source Health",
        isEmpty: true,
        emptyTitle: "No sources connected",
        emptyDescription: "Import data or connect a service to populate health.",
        render: () => <div data-testid="should-not-render">unexpected</div>,
      },
    ];
    render(
      <MapWorkbenchSidebar
        title="Data"
        tabs={tabs}
        activeTabId="data-health"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("map-workbench-sidebar-empty")).toBeDefined();
    expect(screen.getByText("No sources connected")).toBeDefined();
    expect(screen.queryByTestId("should-not-render")).toBeNull();
  });

  it("fires close and collapse callbacks", () => {
    const onClose = vi.fn();
    const onToggleCollapse = vi.fn();
    render(
      <MapWorkbenchSidebar
        title="Layers"
        tabs={buildActivityTabs()}
        activeTabId="layers-stack"
        onTabChange={vi.fn()}
        onClose={onClose}
        onToggleCollapse={onToggleCollapse}
      />,
    );

    fireEvent.click(screen.getByTestId("map-workbench-sidebar-collapse"));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("map-workbench-sidebar-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders a slim collapsed rail with an expand affordance", () => {
    const onToggleCollapse = vi.fn();
    render(
      <MapWorkbenchSidebar
        title="Layers"
        tabs={buildActivityTabs()}
        activeTabId="layers-stack"
        onTabChange={vi.fn()}
        onToggleCollapse={onToggleCollapse}
        collapsed
      />,
    );

    const sidebar = screen.getByTestId("map-workbench-sidebar");
    expect(sidebar.getAttribute("data-collapsed")).toBe("true");
    expect(screen.queryByTestId("content-layer-stack")).toBeNull();

    fireEvent.click(screen.getByTestId("map-workbench-sidebar-expand"));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("exposes accessible tablist and tabpanel wiring", () => {
    render(
      <MapWorkbenchSidebar
        title="Overview"
        tabs={buildActivityTabs()}
        activeTabId="overview-readiness"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("tablist", { name: "Overview sections" })).toBeDefined();
    const activeTab = screen.getByRole("tab", { name: "Readiness" });
    expect(activeTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel")).toBeDefined();
  });

  it("renders a single-tab activity without the tab strip", () => {
    const tabs: MapWorkbenchSidebarTab[] = [
      {
        id: "extensions-registry",
        label: "Registry",
        render: () => <div data-testid="content-extensions">Extensions</div>,
      },
    ];
    render(
      <MapWorkbenchSidebar
        title="Extensions"
        tabs={tabs}
        activeTabId="extensions-registry"
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("tabpanel")).toBeDefined();
    expect(screen.getByTestId("content-extensions")).toBeDefined();
  });
});
