// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppPopover } from "../AppPopover";

let roots: Root[] = [];

afterEach(() => {
  act(() => {
    roots.forEach((root) => root.unmount());
  });
  roots = [];
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function installImmediateAnimationFrame(): void {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
}

describe("AppPopover", () => {
  it("flips upward and clamps inward near the right edge", async () => {
    installImmediateAnimationFrame();

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === "popover-anchor") {
        return {
          x: 910,
          y: 560,
          top: 560,
          left: 910,
          right: 1030,
          bottom: 590,
          width: 120,
          height: 30,
          toJSON: () => ({}),
        } as DOMRect;
      }

      if (this.dataset.testid === "popover-panel") {
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 160,
          bottom: 220,
          width: 160,
          height: 220,
          toJSON: () => ({}),
        } as DOMRect;
      }

      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    const anchorRef = React.createRef<HTMLButtonElement>();

    await act(async () => {
      root.render(
        <div>
          <button ref={anchorRef} data-testid="popover-anchor" type="button">
            Anchor
          </button>
          <AppPopover
            open
            anchorRef={anchorRef}
            onClose={vi.fn()}
            placement="bottom-end"
            minWidth={140}
            maxWidth={240}
            role="menu"
            testId="popover-panel"
          >
            <div>Menu content</div>
          </AppPopover>
        </div>,
      );
    });

    const popover = document.querySelector<HTMLElement>('[data-testid="popover-panel"]');
    expect(popover).not.toBeNull();
    expect(popover?.dataset.popoverPlacement).toBe("top");
    expect(popover?.style.left).toBe("856px");
  });

  it("caps height to the available short viewport space", async () => {
    installImmediateAnimationFrame();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 400,
    });

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === "popover-anchor") {
        return {
          x: 24,
          y: 220,
          top: 220,
          left: 24,
          right: 144,
          bottom: 250,
          width: 120,
          height: 30,
          toJSON: () => ({}),
        } as DOMRect;
      }

      if (this.dataset.testid === "popover-panel") {
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 220,
          bottom: 300,
          width: 220,
          height: 300,
          toJSON: () => ({}),
        } as DOMRect;
      }

      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    const anchorRef = React.createRef<HTMLButtonElement>();

    await act(async () => {
      root.render(
        <div>
          <button ref={anchorRef} data-testid="popover-anchor" type="button">
            Anchor
          </button>
          <AppPopover
            open
            anchorRef={anchorRef}
            onClose={vi.fn()}
            placement="bottom-start"
            testId="popover-panel"
          >
            <div>Long content</div>
          </AppPopover>
        </div>,
      );
    });

    const popover = document.querySelector<HTMLElement>('[data-testid="popover-panel"]');
    expect(popover).not.toBeNull();
    expect(popover?.dataset.popoverPlacement).toBe("bottom");
    expect(popover?.firstElementChild).not.toBeNull();
    expect((popover?.firstElementChild as HTMLElement | null)?.style.maxHeight).toBe("136px");
  });
});
