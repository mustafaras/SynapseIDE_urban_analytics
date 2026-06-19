// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapStartDialog, type MapStartDialogProps } from "../MapStartDialog";
import { buildMapExplorerContextSummary } from "../mapContextSummary";
import type { OverlayLayerConfig } from "../mapTypes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function emptyContextSummary(overlayLayers: OverlayLayerConfig[] = []) {
  return buildMapExplorerContextSummary({
    center: [29.0, 41.0],
    zoom: 10,
    bearing: 0,
    pitch: 0,
    activeBaseLayer: "streets",
    overlayLayers,
    drawnFeatures: [],
    activeAoiId: undefined,
    selectedFeatureIds: {},
    activeAnalysisResultLayerIds: [],
    scientificQA: null,
    currentMapBounds: null,
    currentMapBoundsUpdatedAt: null,
  });
}

function renderDialog(overrides: Partial<MapStartDialogProps> = {}): {
  onImport: ReturnType<typeof vi.fn>;
  onOpenProject: ReturnType<typeof vi.fn>;
  onContinue: ReturnType<typeof vi.fn>;
  onClose: ReturnType<typeof vi.fn>;
} {
  const onImport = vi.fn();
  const onOpenProject = vi.fn();
  const onContinue = vi.fn();
  const onClose = vi.fn();

  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <MapStartDialog
        reason="no-project"
        selectedProjectId={null}
        lastSavedAt={null}
        overlayLayers={[]}
        contextSummary={emptyContextSummary()}
        onImport={onImport}
        onOpenProject={onOpenProject}
        onContinue={onContinue}
        onClose={onClose}
        {...overrides}
      />,
    );
  });

  return { onImport, onOpenProject, onContinue, onClose };
}

function click(selector: string): void {
  const element = host!.querySelector(selector) as HTMLElement | null;
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("MapStartDialog", () => {
  it("renders the primary real-source actions and readiness strip from empty state", () => {
    renderDialog();

    const text = host!.textContent ?? "";
    expect(text).toContain("Import Data");
    expect(text).toContain("Open Project");
    expect(text).toContain("Continue Empty");
    expect(text).not.toContain("Add Demo Pack");

    // Readiness strip segments.
    expect(text).toContain("Layers");
    expect(text).toContain("AOI");
    expect(text).toContain("QA");
    expect(text).toContain("CRS");
    expect(text).toContain("Mode");
    // Empty/unknown state reads as unknown, not ready.
    expect(text).toContain("Unchecked");
    expect(text).toContain("Local-only");
  });

  it("disables Open Project with a reason when no project is selected", () => {
    renderDialog({ selectedProjectId: null });

    const tiles = Array.from(host!.querySelectorAll("button"));
    const openProject = tiles.find((btn) => btn.textContent?.includes("Open Project"));
    expect(openProject).toBeTruthy();
    expect((openProject as HTMLButtonElement).disabled).toBe(true);
    expect(openProject?.getAttribute("aria-label")).toContain("Select a project first");
  });

  it("enables Open Project when a project is selected", () => {
    const { onOpenProject } = renderDialog({ selectedProjectId: "proj-istanbul" });

    const tiles = Array.from(host!.querySelectorAll("button"));
    const openProject = tiles.find((btn) => btn.textContent?.includes("Open Project")) as HTMLButtonElement;
    expect(openProject.disabled).toBe(false);
    act(() => openProject.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onOpenProject).toHaveBeenCalledOnce();
  });

  it("fires import, continue, and close callbacks", () => {
    const { onImport, onContinue, onClose } = renderDialog();

    const tiles = Array.from(host!.querySelectorAll("button"));
    const findTile = (label: string): HTMLButtonElement =>
      tiles.find((btn) => btn.textContent?.includes(label)) as HTMLButtonElement;

    act(() => findTile("Import Data").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onImport).toHaveBeenCalledOnce();

    click('[aria-label="Close launch dialog"]');
    expect(onClose).toHaveBeenCalledOnce();

    act(() => findTile("Continue Empty").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("uses a single scroll root and exposes a labelled dialog role", () => {
    renderDialog();
    const dialog = host!.querySelector('[data-testid="map-start-dialog"]');
    expect(dialog?.getAttribute("role")).toBe("dialog");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("map-start-dialog-title");

    // The advanced source-support content is collapsed (a <details>), not a nested scroll region.
    const details = host!.querySelector("details");
    expect(details).toBeTruthy();
    expect((details as HTMLDetailsElement).open).toBe(false);
  });

  it("omits aria-modal when the host wrapper owns dialog modality", () => {
    renderDialog({ wrapped: true });

    const dialog = host!.querySelector('[data-testid="map-start-dialog"]');
    expect(dialog?.getAttribute("role")).toBe("dialog");
    expect(dialog?.hasAttribute("aria-modal")).toBe(false);
    expect(host!.querySelector('[class*="tileBadge"]')).toBeNull();
  });
});
