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

  it("keeps former activity rail commands searchable in the command palette", () => {
    renderToolbar({
      layerCount: 1,
      visibleLayerCount: 1,
      scientificQAIssueCount: 1,
      onToggleLayerPanel: vi.fn(),
      onToggleCatalog: vi.fn(),
      onToggleContents: vi.fn(),
      onToggleProcessingToolbox: vi.fn(),
      onToggleFigureComposer: vi.fn(),
      onToggleScientificQAPanel: vi.fn(),
      onExportClick: vi.fn(),
      onSaveProjectClick: vi.fn(),
      onLoadProjectClick: vi.fn(),
      persistenceDisabled: true,
    });

    keydown(window, "k", { ctrlKey: true });
    const input = paletteInput();

    const expectedCommands = [
      { query: "layers", id: "layers" },
      { query: "catalog", id: "catalog" },
      { query: "contents", id: "contents" },
      { query: "processing toolbox", id: "processing-toolbox" },
      { query: "layout figure", id: "figure-composer" },
      { query: "scientific qa", id: "qa" },
      { query: "export geojson", id: "export-geojson" },
    ];

    for (const command of expectedCommands) {
      setInputValue(input, command.query);
      expect(
        document.querySelector<HTMLButtonElement>(`[data-testid="map-command-palette-option-${command.id}"]`),
        command.id,
      ).not.toBeNull();
    }

    setInputValue(input, "save project");
    const saveOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-save-project"]');
    expect(saveOption).not.toBeNull();
    expect(saveOption!.disabled).toBe(true);
    expect(saveOption!.textContent).toContain("Select or create a project before saving map state.");

    setInputValue(input, "load project");
    const loadOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-load-project"]');
    expect(loadOption).not.toBeNull();
    expect(loadOption!.disabled).toBe(true);
    expect(loadOption!.textContent).toContain("Select or create a project before loading map state.");
  });

  it("renders a compact command center while hiding secondary commands from the top belt", () => {
    renderToolbar({
      layerCount: 2,
      visibleLayerCount: 2,
      catalogSourceCount: 3,
      onToggleLayerPanel: vi.fn(),
      onToggleCatalog: vi.fn(),
      onToggleContents: vi.fn(),
      onToggleProcessingToolbox: vi.fn(),
      onToggleFigureComposer: vi.fn(),
      onExportClick: vi.fn(),
      onImageExportClick: vi.fn(),
      onSaveProjectClick: vi.fn(),
      onLoadProjectClick: vi.fn(),
    });

    const commandCenter = document.querySelector<HTMLElement>('[data-testid="map-command-center"]');
    expect(commandCenter).not.toBeNull();
    expect(Number(commandCenter!.dataset.commandRegistryCount)).toBeGreaterThan(8);
    expect(document.querySelector('[data-testid="map-command-center-primary-action"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="map-toolbar-command-command-palette"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="map-toolbar-command-catalog"]')).toBeNull();

    keydown(window, "k", { ctrlKey: true });
    const input = paletteInput();
    setInputValue(input, "catalog");
    expect(document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-catalog"]')).not.toBeNull();
  });

  it("exposes undo and redo commands as buttons, palette entries, and global shortcuts", () => {
    const onUndoMapAction = vi.fn();
    const onRedoMapAction = vi.fn();
    renderToolbar({
      canUndoMapAction: true,
      canRedoMapAction: true,
      undoMapActionLabel: "Restyled layer: parcels",
      redoMapActionLabel: "Edited AOI: study area",
      onUndoMapAction,
      onRedoMapAction,
    });

    keydown(window, "z", { ctrlKey: true });
    keydown(window, "y", { ctrlKey: true });
    expect(onUndoMapAction).toHaveBeenCalledTimes(1);
    expect(onRedoMapAction).toHaveBeenCalledTimes(1);

    keydown(window, "k", { ctrlKey: true });
    const input = paletteInput();
    setInputValue(input, "undo");
    const undoOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-undo-map-action"]');
    expect(undoOption).not.toBeNull();
    expect(undoOption!.textContent).toContain("Ctrl+Z");

    setInputValue(input, "redo");
    const redoOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-redo-map-action"]');
    expect(redoOption).not.toBeNull();
    expect(redoOption!.textContent).toContain("Ctrl+Y");
  });
});
