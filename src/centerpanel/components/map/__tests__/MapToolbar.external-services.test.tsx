// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapToolbar } from "../MapToolbar";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let roots: Root[] = [];

afterEach(() => {
  act(() => {
    roots.forEach((root) => root.unmount());
  });
  roots = [];
  document.body.innerHTML = "";
});

describe("MapToolbar external services", () => {
  it("renders the external service command in the toolbar", () => {
    const html = renderToStaticMarkup(
      <MapToolbar
        pinMode={false}
        onTogglePinMode={vi.fn()}
        showSidebar
        onToggleSidebar={vi.fn()}
        pinCount={0}
        onOpenExternalServices={vi.fn()}
      />,
    );

    expect(html).toContain("Open external map services dialog");
    expect(html).toContain("Services");
  });

  it("lists external services inside the Advanced menu", async () => {
    const onOpenExternalServices = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        <MapToolbar
          pinMode={false}
          onTogglePinMode={vi.fn()}
          showSidebar={false}
          onToggleSidebar={vi.fn()}
          pinCount={0}
          onImportClick={vi.fn()}
          onOpenExternalServices={onOpenExternalServices}
        />,
      );
    });

    const overflowButton = document.querySelector<HTMLButtonElement>(
      'button[data-testid="map-command-center-overflow"]',
    );
    expect(overflowButton).not.toBeNull();

    await act(async () => {
      overflowButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const commandMenu = document.querySelector<HTMLElement>('[role="menu"][aria-label="Advanced commands"]');
    expect(commandMenu?.textContent).toContain("External Services");

    const externalServicesButton = Array.from(commandMenu?.querySelectorAll<HTMLButtonElement>("button") ?? [])
      .find((button) => button.textContent?.includes("External Services"));
    expect(externalServicesButton).toBeDefined();

    await act(async () => {
      externalServicesButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onOpenExternalServices).toHaveBeenCalledTimes(1);
  });

  it("opens the command palette with Ctrl+K and runs a searchable command", async () => {
    const onImportClick = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        <MapToolbar
          pinMode={false}
          onTogglePinMode={vi.fn()}
          showSidebar={false}
          onToggleSidebar={vi.fn()}
          pinCount={0}
          onImportClick={onImportClick}
        />,
      );
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    });

    const input = document.querySelector<HTMLInputElement>('input[aria-label="Search map commands"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute("placeholder")).toContain("import geojson");

    const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-label="Map command palette"]');
    const importButton = Array.from(dialog?.querySelectorAll<HTMLButtonElement>("button") ?? [])
      .find((button) => button.textContent?.includes("Import"));
    expect(importButton).toBeDefined();

    await act(async () => {
      importButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onImportClick).toHaveBeenCalledTimes(1);
  });

  it("does not render dead export controls without callbacks and explains disabled export", () => {
    const noCallbackHtml = renderToStaticMarkup(
      <MapToolbar
        pinMode={false}
        onTogglePinMode={vi.fn()}
        showSidebar={false}
        onToggleSidebar={vi.fn()}
        pinCount={0}
        exportDisabled={false}
      />,
    );
    expect(noCallbackHtml).not.toContain("Export visible map data as GeoJSON");

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    act(() => {
      root.render(
        <MapToolbar
          pinMode={false}
          onTogglePinMode={vi.fn()}
          showSidebar={false}
          onToggleSidebar={vi.fn()}
          pinCount={0}
          onExportClick={vi.fn()}
          exportDisabled
        />,
      );
    });

    const publishGroupButton = document.querySelector<HTMLButtonElement>(
      'button[data-testid="map-command-group-publish"]',
    );
    if (publishGroupButton) {
      act(() => {
        publishGroupButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    }

    const exportButton = document.querySelector<HTMLButtonElement>('[data-map-command-id="export-geojson"]');
    expect(exportButton).not.toBeNull();
    expect(exportButton?.getAttribute("aria-label")).toContain("Export visible map data as GeoJSON");
    expect(exportButton?.getAttribute("aria-label")).toContain("Add pins, drawings, or visible overlay layers before exporting GeoJSON.");
  });
});
