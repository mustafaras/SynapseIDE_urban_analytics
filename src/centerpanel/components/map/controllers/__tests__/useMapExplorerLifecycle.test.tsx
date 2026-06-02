// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMapExplorerLifecycle } from "../useMapExplorerLifecycle";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Harness({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { trapRef } = useMapExplorerLifecycle({ open, onClose });

  return open ? (
    <div ref={trapRef}>
      <button type="button">Inside map modal</button>
    </div>
  ) : null;
}

describe("useMapExplorerLifecycle", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it("activates the focus trap and restores focus when closed", () => {
    const opener = document.createElement("button");
    opener.type = "button";
    opener.textContent = "Open map";
    document.body.appendChild(opener);
    opener.focus();

    act(() => {
      root.render(<Harness open onClose={() => undefined} />);
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(document.activeElement?.textContent).toBe("Inside map modal");

    act(() => {
      root.render(<Harness open={false} onClose={() => undefined} />);
    });

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("routes Escape to onClose while open", () => {
    const onClose = vi.fn();

    act(() => {
      root.render(<Harness open onClose={onClose} />);
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close the modal when an inner layer already handled Escape", () => {
    const onClose = vi.fn();

    act(() => {
      root.render(<Harness open onClose={onClose} />);
    });

    const event = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    event.preventDefault();
    window.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });
});
