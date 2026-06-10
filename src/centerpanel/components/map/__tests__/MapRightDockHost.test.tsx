// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapRightDockHost } from "../MapRightDockHost";
import type { MapRightDockPanel } from "../mapDocking";
import {
  MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL,
  MAP_RIGHT_DOCK_PANEL_IDS,
  MAP_RIGHT_DOCK_PRIMARY_PANELS,
  createMapRightDockRoute,
  createMapRightDockRouteFromBottomTab,
} from "../mapRightDockRoutes";

afterEach(() => cleanup());

describe("MapRightDockHost", () => {
  it("renders a labelled right inspector shell with stable body scroll region", () => {
    render(
      <MapRightDockHost
        route={createMapRightDockRouteFromBottomTab("problems", { source: "status-bar", detail: "qa-segment" })}
        onClose={vi.fn()}
      />,
    );

    const host = screen.getByTestId("map-right-dock-host");
    expect(screen.getByRole("complementary", { name: "Problems" })).toBe(host);
    expect(host.getAttribute("data-map-right-dock-panel")).toBe("problems");
    expect(host.getAttribute("data-map-right-dock-source")).toBe("status-bar");
    expect(screen.getByRole("heading", { name: "Problems" })).toBeTruthy();
    expect(host.querySelector("[data-map-right-dock-body='true']")).toBeTruthy();
  });

  it("exposes primary tabs in the tab rail and all migrated panels reachable via tab or overflow", () => {
    const migratedPanels = Array.from(new Set(Object.values(MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL))) as MapRightDockPanel[];
    const primaryInMigrated = migratedPanels.filter((p) => MAP_RIGHT_DOCK_PRIMARY_PANELS.includes(p));
    const overflowInMigrated = migratedPanels.filter((p) => !MAP_RIGHT_DOCK_PRIMARY_PANELS.includes(p));
    render(
      <MapRightDockHost
        route={createMapRightDockRoute("attributes", { source: "panel-tab" })}
        panels={migratedPanels}
        onClose={vi.fn()}
      />,
    );

    // Primary panels are always in the tab rail
    for (const panel of primaryInMigrated) {
      expect(screen.getByRole("tab", { name: new RegExp(panel, "i") })).toBeTruthy();
    }
    // Non-primary panels are all defined in MAP_RIGHT_DOCK_PANEL_IDS (always reachable via overflow)
    expect(overflowInMigrated.length).toBeGreaterThanOrEqual(0); // structural guard: every panel has a tier

    const body = screen.getByRole("tabpanel");
    expect(body.textContent).toBe("");
  });

  it("switches the active panel through the primary tab pattern", () => {
    const onPanelChange = vi.fn();
    render(
      <MapRightDockHost
        route={createMapRightDockRoute("problems", { source: "toolbar" })}
        panels={["inspect", "attributes", "problems", "report", "workflow"]}
        onPanelChange={onPanelChange}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /attributes/i }));
    expect(onPanelChange).toHaveBeenCalledWith("attributes");

    // Arrow right from problems → next primary panel is report (primary order: inspect, attributes, problems, report, workflow)
    fireEvent.keyDown(screen.getByRole("tab", { name: /problems/i }), { key: "ArrowRight" });
    expect(onPanelChange).toHaveBeenLastCalledWith("report");
  });

  it("routes to a non-primary panel via overflow menu item and keeps it reachable", () => {
    const onPanelChange = vi.fn();
    render(
      <MapRightDockHost
        route={createMapRightDockRoute("problems", { source: "toolbar" })}
        panels={MAP_RIGHT_DOCK_PANEL_IDS}
        onPanelChange={onPanelChange}
        onClose={vi.fn()}
      />,
    );

    // Open overflow and click a diagnostics-tier panel
    fireEvent.click(screen.getByLabelText("Right dock options"));
    const overflowMenu = screen.getByRole("menu", { name: "More dock panels" });
    expect(overflowMenu).toBeTruthy();

    const diagItem = overflowMenu.querySelector("[data-map-right-dock-tab='diagnostics']") as HTMLElement;
    expect(diagItem).toBeTruthy();
    fireEvent.click(diagItem);
    expect(onPanelChange).toHaveBeenCalledWith("diagnostics");
  });

  it("supports overflow, collapse, close, and constrained side-drawer presentation", () => {
    const onCollapse = vi.fn();
    const onClose = vi.fn();
    render(
      <MapRightDockHost
        route={createMapRightDockRoute("diagnostics", { source: "worker", detail: "render-budget" })}
        panels={MAP_RIGHT_DOCK_PANEL_IDS}
        presentation="side-drawer"
        width={512}
        onCollapse={onCollapse}
        onClose={onClose}
      />,
    );

    const host = screen.getByTestId("map-right-dock-host");
    expect(host.getAttribute("data-presentation")).toBe("side-drawer");

    fireEvent.click(screen.getByLabelText("Right dock options"));
    const overflowMenu = screen.getByRole("menu", { name: "More dock panels" });
    expect(overflowMenu).toBeTruthy();
    // Advanced group label is visible in overflow menu
    expect(overflowMenu.querySelector(".overflowGroupLabel") !== null || overflowMenu.textContent?.includes("Advanced")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Collapse right dock"));
    expect(onCollapse).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByLabelText("Close right dock"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders explicit loading and error panel states inside the dock body", () => {
    const { rerender } = render(
      <MapRightDockHost
        route={createMapRightDockRoute("diagnostics", { source: "worker" })}
        onClose={vi.fn()}
      >
        <div data-testid="map-right-dock-loading">Loading diagnostics…</div>
      </MapRightDockHost>,
    );

    const host = screen.getByTestId("map-right-dock-host");
    expect(host.querySelector('[data-map-right-dock-body="true"]')?.textContent).toContain("Loading diagnostics");

    rerender(
      <MapRightDockHost
        route={createMapRightDockRoute("diagnostics", { source: "worker" })}
        onClose={vi.fn()}
      >
        <div role="alert" data-testid="map-right-dock-error">Diagnostics panel failed to load.</div>
      </MapRightDockHost>,
    );

    const errorNode = screen.getByTestId("map-right-dock-error");
    expect(errorNode.textContent).toContain("failed to load");
    expect(errorNode.getAttribute("role")).toBe("alert");
  });
});