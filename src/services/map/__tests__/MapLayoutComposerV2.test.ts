import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  composeMapBook,
  LAYOUT_PRESETS,
  preflightMapFigure,
  restorePageInputsFromMetadata,
  serializeLayoutRestoreMetadata,
  type MapPageInput,
} from "../layout/MapLayoutComposer";
import { fcPolygonsProjected } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

const NOW = new Date("2026-05-27T09:00:00.000Z");

/** Build a minimal overlay layer that passes attribution + CRS preflight. */
function makeLayer(id: string): OverlayLayerConfig {
  return {
    id,
    name: `Layer ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    queryable: true,
    qaStatus: "passed",
    sourceData: fcPolygonsProjected.featureCollection,
    style: { fillColor: "#3794ff", legendEntries: [{ label: `Layer ${id}`, color: "#3794ff" }] },
    provenance: {
      label: "Test source",
      sourceName: "Test source",
      attribution: "© Test",
      license: "CC BY 4.0",
    },
    metadata: {
      geometryType: "Polygon",
      featureCount: fcPolygonsProjected.featureCollection.features.length,
      fields: ["id", "zone", "area_m2"],
      crsSummary: {
        crs: fcPolygonsProjected.declaredCrs ?? "EPSG:32635",
        status: "known",
        source: "explicit",
        notes: [],
      },
      datasetContext: {
        crs: fcPolygonsProjected.declaredCrs ?? "EPSG:32635",
        source: "Test source",
        license: "CC BY 4.0",
        attribution: "© Test",
      },
    },
  };
}

/** Build a layer that FAILS preflight: missing attribution + missing CRS. */
function makeLayerNoAttribution(id: string): OverlayLayerConfig {
  return {
    id,
    name: `Unattributed Layer ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    queryable: true,
    qaStatus: "passed",
    sourceData: fcPolygonsProjected.featureCollection,
    style: { fillColor: "#ff4444" },
    metadata: {
      geometryType: "Polygon",
      featureCount: fcPolygonsProjected.featureCollection.features.length,
      fields: ["id"],
    },
  };
}

function makePageInput(pageNumber: number, layer: OverlayLayerConfig): MapPageInput {
  return {
    pageNumber,
    overlayLayers: [layer],
    title: `Page ${pageNumber} title`,
    dynamicText: `Narrative for page ${pageNumber}`,
    showInsetMap: pageNumber === 2,
    slots: pageNumber === 1 ? [{ kind: "chart", label: "Bar chart" }] : [],
    composition: {
      includeAttribution: true,
      includeLegend: true,
      includeScaleBar: true,
      includeNorthArrow: true,
    },
  };
}

describe("MapLayoutComposerV2", () => {
  it("composeMapBook builds one page per input in order", () => {
    const inputs: MapPageInput[] = [
      makePageInput(2, makeLayer("b")),
      makePageInput(1, makeLayer("a")),
    ];
    const book = composeMapBook(inputs, LAYOUT_PRESETS[0], NOW);

    expect(book.pages).toHaveLength(2);
    // Pages must be sorted by pageNumber ascending
    expect(book.pages[0].pageNumber).toBe(1);
    expect(book.pages[1].pageNumber).toBe(2);
    expect(book.id).toContain("map-book-");
    expect(book.createdAt).toBe(NOW.toISOString());
    expect(book.preset).toBe(LAYOUT_PRESETS[0]);

    // Dynamic text and slots are forwarded correctly
    expect(book.pages[0].dynamicText).toBe("Narrative for page 1");
    expect(book.pages[1].dynamicText).toBe("Narrative for page 2");
    expect(book.pages[0].slots).toHaveLength(1);
    expect(book.pages[0].slots[0]).toMatchObject({ kind: "chart", label: "Bar chart" });
    expect(book.pages[1].showInsetMap).toBe(true);
  });

  it("composeMapBook exportable=false when a page fails preflight", () => {
    const passingInput = makePageInput(1, makeLayer("good"));
    const failingInput = makePageInput(2, makeLayerNoAttribution("bad"));

    const book = composeMapBook([passingInput, failingInput], LAYOUT_PRESETS[1], NOW);

    expect(book.pages).toHaveLength(2);
    // The good page passes
    expect(preflightMapFigure(book.pages[0].figure).ok).toBe(true);
    // The bad page fails
    expect(preflightMapFigure(book.pages[1].figure).ok).toBe(false);
    // Overall book is not exportable
    expect(book.exportable).toBe(false);
  });

  it("serialize/restore round-trips preset index and page config", () => {
    const presetIndex = 2;
    const inputs: MapPageInput[] = [
      makePageInput(1, makeLayer("a")),
      makePageInput(2, makeLayer("b")),
    ];

    const meta = serializeLayoutRestoreMetadata(presetIndex, inputs);

    expect(meta.version).toBe(1);
    expect(meta.presetIndex).toBe(presetIndex);
    expect(meta.pages).toHaveLength(2);
    expect(meta.pages[0].pageNumber).toBe(1);
    expect(meta.pages[1].pageNumber).toBe(2);
    expect(meta.pages[0].title).toBe("Page 1 title");
    expect(meta.pages[0].dynamicText).toBe("Narrative for page 1");
    expect(meta.pages[0].showInsetMap).toBe(false);
    expect(meta.pages[1].showInsetMap).toBe(true);
    expect(meta.pages[0].slots).toHaveLength(1);
    expect(meta.pages[0].includeAttribution).toBe(true);
    expect(meta.pages[0].includeLegend).toBe(true);
    expect(meta.pages[0].includeScaleBar).toBe(true);
    expect(meta.pages[0].includeNorthArrow).toBe(true);

    // Restore
    const overlayLayers = [makeLayer("restored")];
    const restored = restorePageInputsFromMetadata(meta, overlayLayers);

    expect(restored.presetIndex).toBe(presetIndex);
    expect(restored.pages).toHaveLength(2);
    expect(restored.pages[0].pageNumber).toBe(1);
    expect(restored.pages[0].title).toBe("Page 1 title");
    expect(restored.pages[0].dynamicText).toBe("Narrative for page 1");
    expect(restored.pages[1].showInsetMap).toBe(true);
    // All pages get the provided overlay layers
    expect(restored.pages[0].overlayLayers).toBe(overlayLayers);
    expect(restored.pages[1].overlayLayers).toBe(overlayLayers);
  });

  it("export preset honored in book spec", () => {
    const a3Preset = LAYOUT_PRESETS.find((p) => p.pageSize === "A3");
    expect(a3Preset).toBeDefined();

    const input = makePageInput(1, makeLayer("x"));
    const book = composeMapBook([input], a3Preset!, NOW);

    expect(book.preset.pageSize).toBe("A3");
    expect(book.preset.orientation).toBe("landscape");
    expect(book.preset.dpi).toBe(150);
    expect(book.preset.label).toContain("A3");
  });
});
