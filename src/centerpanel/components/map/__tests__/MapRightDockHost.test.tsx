// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapRightDockHost } from "../MapRightDockHost";
import type { MapRightDockPanel } from "../mapDocking";
import {
  MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL,
  MAP_RIGHT_DOCK_PANEL_IDS,
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

  it("exposes tabs for every migrated right-dock destination without visible placeholder body text", () => {
    const migratedPanels = Array.from(new Set(Object.values(MAP_MIGRATED_BOTTOM_TAB_TO_RIGHT_DOCK_PANEL))) as MapRightDockPanel[];
    render(
      <MapRightDockHost
        route={createMapRightDockRoute("attributes", { source: "panel-tab" })}
        panels={migratedPanels}
        onClose={vi.fn()}
      />,
    );

    for (const panel of migratedPanels) {
      expect(screen.getByRole("tab", { name: new RegExp(panel === "qa" ? "QA" : panel, "i") })).toBeTruthy();
    }
    const body = screen.getByRole("tabpanel");
    expect(body.textContent).toBe("");
  });

  it("switches the active panel through the tab pattern", () => {
    const onPanelChange = vi.fn();
    render(
      <MapRightDockHost
        route={createMapRightDockRoute("problems", { source: "toolbar" })}
        panels={["problems", "diagnostics", "attributes"]}
        onPanelChange={onPanelChange}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /diagnostics/i }));
    expect(onPanelChange).toHaveBeenCalledWith("diagnostics");

    fireEvent.keyDown(screen.getByRole("tab", { name: /problems/i }), { key: "ArrowRight" });
    expect(onPanelChange).toHaveBeenLastCalledWith("diagnostics");
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
    expect(screen.getByRole("menu", { name: "Right dock route details" })).toBeTruthy();
    expect(screen.getByText("Worker")).toBeTruthy();
    expect(screen.getByText("render-budget")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Collapse right dock"));
    expect(onCollapse).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByLabelText("Close right dock"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});