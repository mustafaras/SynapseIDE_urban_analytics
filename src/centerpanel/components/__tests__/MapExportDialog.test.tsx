// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MapExportDialog } from "../MapExportDialog";
import { DEFAULT_MAP_COMPOSITION_OPTIONS } from "@/services/map/MapExportService";

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
});
