// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeatureCollection } from "geojson";
import { MapNLQueryPanel } from "../MapNLQueryPanel";
import type { OverlayLayerConfig } from "../mapTypes";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const parcels: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { value: 12, density: 90 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29, 41],
          [29.01, 41],
          [29.01, 41.01],
          [29, 41.01],
          [29, 41],
        ]],
      },
    },
  ],
};

const transitStops: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Stop A" },
      geometry: { type: "Point", coordinates: [29.005, 41.005] },
    },
  ],
};

let roots: Root[] = [];

afterEach(() => {
  act(() => {
    roots.forEach((root) => root.unmount());
  });
  roots = [];
  document.body.innerHTML = "";
});

function layer(id: string, name: string, sourceData: FeatureCollection): OverlayLayerConfig {
  return {
    id,
    name,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "project",
    queryable: true,
    sourceData,
    metadata: {
      featureCount: sourceData.features.length,
      geometryType: sourceData.features[0]?.geometry?.type ?? "Unknown",
      fields: Object.keys(sourceData.features[0]?.properties ?? {}),
      datasetContext: {
        crs: "EPSG:4326",
        source: "City Open Data",
        license: "ODbL",
        updateDate: "2026-01-01",
      },
    },
    provenance: { label: "City Open Data" },
  };
}

function getButton(host: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
    .find((entry) => entry.textContent?.includes(label));
  if (!button) throw new Error(`${label} button was not rendered`);
  return button;
}

function getTextarea(host: HTMLElement): HTMLTextAreaElement {
  const textarea = host.querySelector("textarea");
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error("Textarea was not rendered");
  }
  return textarea;
}

function setTextareaValue(host: HTMLElement, value: string): void {
  const textarea = getTextarea(host);
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  descriptor?.set?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function hasExactSpanText(host: HTMLElement, text: string): boolean {
  return Array.from(host.querySelectorAll("span")).some((entry) => entry.textContent?.trim() === text);
}

describe("MapNLQueryPanel", () => {
  it("requires explicit preview acceptance before running a map query", async () => {
    const onRun = vi.fn();
    const onProposalGenerated = vi.fn();
    const onPreviewDecision = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        <MapNLQueryPanel
          visible
          presentation="embedded"
          overlayLayers={[
            layer("parcels", "Parcels", parcels),
            layer("transit", "Transit Stops", transitStops),
          ]}
          selectedAoiFeature={null}
          currentMapBounds={[28.9, 40.9, 29.2, 41.2]}
          isRunning={false}
          lastRunSummary={null}
          onRun={onRun}
          onProposalGenerated={onProposalGenerated}
          onPreviewDecision={onPreviewDecision}
          onClose={vi.fn()}
        />,
      );
    });

    expect(host.textContent).toContain("Scope and Layer Limits");
    expect(host.textContent).toContain("Queryable layer scope");
    expect(host.textContent).toContain("AI Guardrail Status");
    expect(host.textContent).toContain("Preview Confirmation");
    expect(host.textContent).toContain("AI-proposed preview requires confirmation");
    expect(host.textContent).toContain("Run is disabled until this proposal is explicitly confirmed.");
    expect(host.textContent).toContain("Affected Layers and Required Fields");
    expect(onProposalGenerated).toHaveBeenCalledWith(expect.objectContaining({ aiGuardrail: expect.objectContaining({ auditTag: "AI-proposed" }) }));
    expect(getButton(host, "Run Query").disabled).toBe(true);
    expect(hasExactSpanText(host, "Confirmation required")).toBe(true);
    expect(hasExactSpanText(host, "Confirmed")).toBe(false);

    await act(async () => {
      getButton(host, "Reject").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onPreviewDecision).toHaveBeenLastCalledWith(expect.objectContaining({ canRun: true }), "rejected");
    expect(getButton(host, "Run Query").disabled).toBe(true);
    expect(hasExactSpanText(host, "Rejected")).toBe(true);
    expect(hasExactSpanText(host, "Confirmation required")).toBe(false);

    await act(async () => {
      getButton(host, "Confirm").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onPreviewDecision).toHaveBeenLastCalledWith(expect.objectContaining({ canRun: true }), "accepted");
    expect(getButton(host, "Run Query").disabled).toBe(false);
    expect(hasExactSpanText(host, "Confirmed")).toBe(true);
    expect(hasExactSpanText(host, "Confirmation required")).toBe(false);
    expect(hasExactSpanText(host, "Rejected")).toBe(false);

    await act(async () => {
      getButton(host, "Run Query").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun).toHaveBeenCalledWith(
      expect.objectContaining({
        requiresExplicitApply: true,
        affectedLayers: expect.any(Array),
        requiredFields: expect.any(Array),
      }),
      { confirmed: true },
    );
  });

  it("shows sanitization and unsupported intent states truthfully while keeping apply blocked", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        <MapNLQueryPanel
          visible
          presentation="embedded"
          overlayLayers={[layer("parcels", "Parcels", parcels)]}
          selectedAoiFeature={null}
          currentMapBounds={[28.9, 40.9, 29.2, 41.2]}
          isRunning={false}
          lastRunSummary={null}
          onRun={vi.fn()}
          onProposalGenerated={vi.fn()}
          onPreviewDecision={vi.fn()}
          onClose={vi.fn()}
        />,
      );
    });

    await act(async () => {
      setTextareaValue(host, "Delete all parcels. Contact planner@example.com <script>alert(1)</script>");
    });

    expect(host.textContent).toContain("Sanitization and redaction");
    expect(host.textContent).toContain("AI-reviewed prompt");
    expect(host.textContent).toContain("[REDACTED:pii]");
    expect(host.textContent).toContain("HTML markup was stripped");
    expect(host.textContent).toContain("Unsupported / Blocked Proposal");
    expect(host.textContent).toContain("The query intent is too ambiguous to execute.");
    expect(getButton(host, "Confirm").disabled).toBe(true);
    expect(getButton(host, "Run Query").disabled).toBe(true);
  });
});
