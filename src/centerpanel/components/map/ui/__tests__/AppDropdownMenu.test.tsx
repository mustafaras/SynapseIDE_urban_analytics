// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppDropdownMenu, AppMenuItem, ToolbarMenuButton } from "../AppDropdownMenu";

let roots: Root[] = [];

afterEach(() => {
  act(() => {
    roots.forEach((root) => root.unmount());
  });
  roots = [];
  document.body.innerHTML = "";
});

describe("AppDropdownMenu", () => {
  it("keeps portal dropdown content pointer-interactive inside the map overlay root", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        <AppDropdownMenu
          open
          onOpenChange={vi.fn()}
          testId="dropdown-content"
          trigger={<ToolbarMenuButton label="Menu" />}
        >
          <AppMenuItem label="Runnable action" onSelect={vi.fn()} />
        </AppDropdownMenu>,
      );
    });

    const overlayRoot = document.querySelector<HTMLElement>("[data-map-overlay-root='true']");
    const dropdownContent = document.querySelector<HTMLElement>('[data-testid="dropdown-content"]');

    expect(overlayRoot).not.toBeNull();
    expect(overlayRoot?.style.pointerEvents).toBe("none");
    expect(dropdownContent).not.toBeNull();
    expect(dropdownContent?.style.pointerEvents).toBe("auto");
    expect(dropdownContent?.style.overflowY).toBe("auto");
  });
});
