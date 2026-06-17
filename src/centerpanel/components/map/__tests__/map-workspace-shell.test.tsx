// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapWorkspaceShell } from "../MapWorkspaceShell";

describe("MapWorkspaceShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not close on modal backdrop click", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MapWorkspaceShell mode="modal" onClose={onClose}>
        <div>Workspace content</div>
      </MapWorkspaceShell>,
    );

    const backdrop = container.querySelector('[data-map-workspace-shell="modal"]');
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop as HTMLElement);

    expect(onClose).not.toHaveBeenCalled();
  });
});
