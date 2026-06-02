// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProcessingToolDescriptor } from "@/services/map/contracts/gisContracts";
import { useMapToolbarPreferencesStore } from "../../../../stores/useMapToolbarPreferencesStore";
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

const intersectTool: ProcessingToolDescriptor = {
  toolId: "intersect",
  title: "Intersect",
  category: "Overlay",
  summary: "Intersect two projected layers and preserve overlapping features.",
  parameters: [
    { key: "inputLayer", label: "Input layer", type: "layer", required: true },
    { key: "overlayLayer", label: "Overlay layer", type: "layer", required: true },
  ],
  requiresCrs: true,
  executionMode: "worker",
  qaGated: true,
  urbanMethodIds: [],
  implemented: true,
};

const spatialJoinTool: ProcessingToolDescriptor = {
  toolId: "spatial-join",
  title: "Spatial join",
  category: "Overlay",
  summary: "Join target and join layer attributes using spatial relationships and field schema checks.",
  parameters: [
    { key: "targetLayer", label: "Target layer", type: "layer", required: true },
    { key: "joinLayer", label: "Join layer", type: "layer", required: true },
  ],
  requiresCrs: true,
  executionMode: "worker",
  qaGated: true,
  urbanMethodIds: [],
  implemented: true,
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
  useMapToolbarPreferencesStore.setState({ density: "expert", taskLens: "analyst" });
  window.localStorage.clear();
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

  it("groups Prompt 24 GIS command taxonomy results and finds representative search terms", () => {
    renderToolbar({
      layerCount: 2,
      visibleLayerCount: 2,
      catalogSourceCount: 3,
      nlQueryLayerCount: 2,
      scientificQAIssueCount: 2,
      scientificQABlockerCount: 1,
      workflowReadyCount: 2,
      reviewEventCount: 1,
      performanceIssueCount: 1,
      pluginExtensionCount: 1,
      voxCityFootprintCount: 4,
      drawnFeatureCount: 1,
      measurementCount: 1,
      annotationCount: 1,
      processingTools: [bufferTool, intersectTool, spatialJoinTool, kernelDensityTool],
      processingLayerOptions: [
        { id: "projected-parcels", name: "Projected parcels", fields: ["zone", "population"] },
        { id: "projected-districts", name: "Projected districts", fields: ["district_id"] },
      ],
      onImportClick: vi.fn(),
      onOpenExternalServices: vi.fn(),
      onToggleLayerPanel: vi.fn(),
      onToggleCatalog: vi.fn(),
      onToggleContents: vi.fn(),
      onToggleScientificQAPanel: vi.fn(),
      onToggleNLQueryPanel: vi.fn(),
      onToggleWorkflowDrawer: vi.fn(),
      onToggleProcessingToolbox: vi.fn(),
      onToggleModelBuilder: vi.fn(),
      onToggleChoroplethPanel: vi.fn(),
      onToggleClusterViz: vi.fn(),
      onToggleHotSpotViz: vi.fn(),
      onToggleEmergingHotSpotViz: vi.fn(),
      onToggleViewportSync: vi.fn(),
      onToggleVoxCityOverlayPanel: vi.fn(),
      onToggleRestrictToMapView: vi.fn(),
      onSetDrawTool: vi.fn(),
      onToggleDrawPanel: vi.fn(),
      onToggleAnnotationMode: vi.fn(),
      onSetMeasureTool: vi.fn(),
      onToggleMeasurePanel: vi.fn(),
      onToggleFigureComposer: vi.fn(),
      onExportClick: vi.fn(),
      onImageExportClick: vi.fn(),
      onExportPackageClick: vi.fn(),
      onAddToReportClick: vi.fn(),
      onToggleReviewTimeline: vi.fn(),
      onTogglePerformanceDiagnostics: vi.fn(),
      onTogglePluginPanel: vi.fn(),
      onSaveProjectClick: vi.fn(),
      onLoadProjectClick: vi.fn(),
      onRunProcessingToolCommand: vi.fn(),
    });

    keydown(window, "k", { ctrlKey: true });
    const input = paletteInput();

    const expectedCommands = [
      { query: "source catalog", id: "catalog", group: "data" },
      { query: "WMS", id: "services", group: "data" },
      { query: "GeoJSON", id: "import", group: "data" },
      { query: "GeoParquet", id: "import", group: "data" },
      { query: "Shapefile", id: "import", group: "data" },
      { query: "GeoTIFF", id: "import", group: "data" },
      { query: "field schema", id: "contents", group: "contents" },
      { query: "CRS projection", id: "qa", group: "qa" },
      { query: "buffer", id: "processing:buffer", group: "analyze" },
      { query: "intersect", id: "processing:intersect", group: "analyze" },
      { query: "join", id: "processing:spatial-join", group: "analyze" },
      { query: "LISA", id: "lisa", group: "analyze" },
      { query: "Gi*", id: "hotspot", group: "analyze" },
      { query: "3D terrain", id: "sync", group: "scene" },
      { query: "noData", id: "qa", group: "qa" },
      { query: "attribution", id: "figure-composer", group: "publish" },
      { query: "review pins", id: "pins", group: "review" },
      { query: "diagnostics render budget", id: "performance-diagnostics", group: "diagnostics" },
      { query: "extensions source connector", id: "plugin-registry", group: "extensions" },
      { query: "Ctrl+K", id: "command-palette", group: "project" },
    ];

    for (const command of expectedCommands) {
      setInputValue(input, command.query);
      expect(
        document.querySelector<HTMLElement>(`[data-testid="map-command-palette-group-${command.group}"]`),
        command.group,
      ).not.toBeNull();
      expect(
        document.querySelector<HTMLButtonElement>(`[data-testid="map-command-palette-option-${command.id}"]`),
        command.query,
      ).not.toBeNull();
    }

    setInputValue(input, "kernel density");
    const disabledOption = document.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-processing:kernel-density"]');
    expect(disabledOption).not.toBeNull();
    expect(disabledOption!.disabled).toBe(true);
    expect(disabledOption!.textContent).toMatch(/not wired/i);
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

  it("exposes Prompt 17 task lens and layout recovery commands in the command palette", () => {
    const onTaskLensChange = vi.fn();
    const onResetLayout = vi.fn();
    const onCollapsePanels = vi.fn();
    const onFocusMapCanvas = vi.fn();
    const onRestoreDefaultWidths = vi.fn();
    renderToolbar({
      layerCount: 1,
      visibleLayerCount: 1,
      onTaskLensChange,
      onResetLayout,
      onCollapsePanels,
      onFocusMapCanvas,
      onRestoreDefaultWidths,
    });

    const runPaletteCommand = (query: string, id: string): void => {
      keydown(window, "k", { ctrlKey: true });
      const input = paletteInput();
      setInputValue(input, query);
      const option = document.querySelector<HTMLButtonElement>(`[data-testid="map-command-palette-option-${id}"]`);
      expect(option, id).not.toBeNull();
      act(() => {
        option!.click();
      });
    };

    runPaletteCommand("publisher lens", "task-lens-publisher");
    expect(onTaskLensChange).toHaveBeenCalledWith("publisher");

    runPaletteCommand("reset layout", "reset-layout");
    runPaletteCommand("collapse all panels", "collapse-panels");
    runPaletteCommand("focus map canvas", "focus-map-canvas");
    runPaletteCommand("restore default widths", "restore-default-widths");
    runPaletteCommand("switch density", "switch-density");

    expect(onResetLayout).toHaveBeenCalledTimes(1);
    expect(onCollapsePanels).toHaveBeenCalledTimes(1);
    expect(onFocusMapCanvas).toHaveBeenCalledTimes(1);
    expect(onRestoreDefaultWidths).toHaveBeenCalledTimes(1);
    expect(useMapToolbarPreferencesStore.getState().density).toBe("compact");
  });

  it("switches visible task lenses without requiring map data callbacks", () => {
    const onTaskLensChange = vi.fn();
    renderToolbar({ onTaskLensChange });

    const commandCenter = document.querySelector<HTMLElement>('[data-testid="map-command-center"]');
    expect(commandCenter?.dataset.taskLens).toBe("analyst");

    const reviewerLens = document.querySelector<HTMLButtonElement>('[data-testid="map-task-lens-reviewer"]');
    expect(reviewerLens).not.toBeNull();
    act(() => {
      reviewerLens!.click();
    });

    expect(onTaskLensChange).toHaveBeenCalledWith("reviewer");
    expect(useMapToolbarPreferencesStore.getState().taskLens).toBe("reviewer");
    expect(commandCenter?.dataset.taskLens).toBe("reviewer");
  });
});
