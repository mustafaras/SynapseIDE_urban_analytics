// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProcessingToolDescriptor } from "@/services/map/contracts/gisContracts";
import { MapToolbar } from "../MapToolbar";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const bufferTool: ProcessingToolDescriptor = {
  toolId: "buffer",
  title: "Buffer",
  category: "Geometry",
  summary: "Expand each feature by a fixed distance to produce buffer polygons.",
  parameters: [
    { key: "layer", label: "Input layer", type: "layer", required: true },
    { key: "distanceMeters", label: "Distance (meters)", type: "number", required: true, defaultValue: 100 },
  ],
  requiresCrs: true,
  executionMode: "main-preview",
  qaGated: true,
  urbanMethodIds: [],
  implemented: true,
};

const kernelDensityTool: ProcessingToolDescriptor = {
  toolId: "kernel-density",
  title: "Kernel density",
  category: "Statistics",
  summary: "Heatmap surface from point density. Wiring lands in a later toolbox slice.",
  parameters: [{ key: "layer", label: "Input layer", type: "layer", required: true }],
  requiresCrs: true,
  executionMode: "worker",
  qaGated: false,
  urbanMethodIds: [],
  implemented: false,
};

function renderToolbar(props: Partial<React.ComponentProps<typeof MapToolbar>> = {}): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapToolbar
        pinMode={false}
        onTogglePinMode={vi.fn()}
        showSidebar={false}
        onToggleSidebar={vi.fn()}
        pinCount={0}
        {...props}
      />,
    );
  });
}

function setInputValue(element: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function keydown(target: EventTarget, key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });
}

function paletteInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Search map commands"]');
  expect(input).not.toBeNull();
  return input!;
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  host?.remove();
  host = null;
  document.body.innerHTML = "";
});

describe("MapToolbar command palette", () => {
  it("lists registered processing tools and dispatches one from the keyboard", () => {
    const onRunProcessingToolCommand = vi.fn();
    renderToolbar({
      processingTools: [bufferTool, kernelDensityTool],
      processingLayerOptions: [{ id: "layer-projected", name: "Projected parcels", fields: ["zone"] }],
      onRunProcessingToolCommand,
    });

    keydown(window, "k", { ctrlKey: true });
    const input = paletteInput();
    setInputValue(input, "bufr");

    const bufferOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-processing:buffer"]');
    expect(bufferOption).not.toBeNull();
    expect(bufferOption!.textContent).toContain("Tool: Geometry");
    expect(bufferOption!.textContent).toContain("Enter");

    keydown(input, "Enter");

    expect(onRunProcessingToolCommand).toHaveBeenCalledWith("buffer", {
      layer: "layer-projected",
      distanceMeters: 100,
    });
  });

  it("keeps disabled processing commands searchable with visible reasons", () => {
    renderToolbar({
      processingTools: [bufferTool, kernelDensityTool],
      processingLayerOptions: [],
      onRunProcessingToolCommand: vi.fn(),
    });

    keydown(window, "k", { ctrlKey: true });
    const input = paletteInput();
    setInputValue(input, "buffer");

    const bufferOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-processing:buffer"]');
    expect(bufferOption).not.toBeNull();
    expect(bufferOption!.disabled).toBe(true);
    expect(bufferOption!.textContent).toMatch(/Add a map layer/i);

    setInputValue(input, "kernel density");
    const kernelOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-processing:kernel-density"]');
    expect(kernelOption).not.toBeNull();
    expect(kernelOption!.disabled).toBe(true);
    expect(kernelOption!.textContent).toMatch(/not wired/i);
  });
});
