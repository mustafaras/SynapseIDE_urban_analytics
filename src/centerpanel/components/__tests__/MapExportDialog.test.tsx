// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MapExportDialog } from "../MapExportDialog";
import { DEFAULT_MAP_COMPOSITION_OPTIONS, type MapPublicationReadiness } from "@/services/map/MapExportService";

const blockedReadiness: MapPublicationReadiness = {
  id: "readiness-blocked",
  status: "blocked",
  mode: "publication-export",
  checkedAt: "2026-04-11T20:31:45.000Z",
  visibleLayerCount: 0,
  hasTitle: true,
  hasLegend: false,
  hasScaleBar: true,
  hasNorthArrow: true,
  hasAttribution: true,
  qaBlockingIssueCount: 0,
  caveats: ["Show at least one overlay layer before creating a formal map output."],
  blockers: [{
    criterion: "visible-layer",
    label: "Visible layer",
    status: "blocked",
    required: true,
    message: "Show at least one overlay layer before creating a formal map output.",
    affectedLayerIds: [],
    issueIds: [],
  }],
  warnings: [],
  checks: [],
  acknowledgedIssueIds: [],
};

describe("MapExportDialog", () => {
  it("renders the full publication export control surface and preview", () => {
    const html = renderToStaticMarkup(
      React.createElement(MapExportDialog, {
        open: true,
        compositionOptions: {
          ...DEFAULT_MAP_COMPOSITION_OPTIONS,
          format: "pdf",
          dpi: 300,
          pageSize: "a4",
          title: "Transit Access Brief",
          subtitle: "Publication draft",
          includeGraticule: true,
        },
        legendAvailable: true,
        visibleLayerCount: 3,
        previewUrl: "data:image/png;base64,preview",
        isGeneratingPreview: false,
        isExporting: false,
        onCompositionChange: vi.fn(),
        onClose: vi.fn(),
        onExport: vi.fn(),
      }),
    );

    expect(html).toContain("Publication Composition");
    expect(html).toContain("Format");
    expect(html).toContain("PDF");
    expect(html).toContain("PNG");
    expect(html).toContain("SVG");
    expect(html).toContain("DPI");
    expect(html).toContain("300");
    expect(html).toContain("Page size");
    expect(html).toContain("A4");
    expect(html).toContain("Margin (mm)");
    expect(html).toContain("Title block");
    expect(html).toContain("Scale bar");
    expect(html).toContain("North arrow");
    expect(html).toContain("Auto legend");
    expect(html).toContain("Locator inset");
    expect(html).toContain("Graticule");
    expect(html).toContain("Attribution");
    expect(html).toContain("Attribution position");
    expect(html).toContain("Transit Access Brief");
    expect(html).toContain("Publication draft");
    expect(html).toContain("Map export preview");
    expect(html).toContain("Print frame");
    expect(html).toContain("Download PDF");
  });

  it("shows publication readiness blockers and disables formal export", () => {
    const html = renderToStaticMarkup(
      React.createElement(MapExportDialog, {
        open: true,
        compositionOptions: DEFAULT_MAP_COMPOSITION_OPTIONS,
        legendAvailable: false,
        visibleLayerCount: 0,
        readiness: blockedReadiness,
        previewUrl: null,
        isGeneratingPreview: false,
        isExporting: false,
        onCompositionChange: vi.fn(),
        onClose: vi.fn(),
        onExport: vi.fn(),
      }),
    );

    expect(html).toContain("Publication readiness");
    expect(html).toContain("blocked");
    expect(html).toContain("Show at least one overlay layer before creating a formal map output.");
    expect(html).toContain("Export blocked");
    expect(html).toContain("disabled=\"\"");
  });
});
