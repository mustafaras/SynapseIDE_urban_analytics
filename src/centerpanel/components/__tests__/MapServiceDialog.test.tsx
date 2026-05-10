// @vitest-environment jsdom

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MapServiceDialog } from "../MapServiceDialog";

describe("MapServiceDialog", () => {
  it("renders visible tabs for external map service ingestion and management", () => {
    const html = renderToStaticMarkup(
      <MapServiceDialog
        open
        bounds={[13.37, 52.51, 13.39, 52.53]}
        overlayLayers={[]}
        onAddLayer={vi.fn()}
        onRemoveLayer={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain("External Map Services");
    expect(html).toContain("WMS / WMTS");
    expect(html).toContain("WFS");
    expect(html).toContain("XYZ");
    expect(html).toContain("OSM Buildings");
    expect(html).toContain("CityJSON URL");
    expect(html).toContain("Manager (0)");
  });
});