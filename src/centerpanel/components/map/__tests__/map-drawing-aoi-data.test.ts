/**
 * p07 — Rectangle AOI → fetch real data in bounds.
 *
 * Verifies the bounds-clipped fetch pipeline end to end at the pure-helper
 * layer (the Core handler `handleFetchAoiData` is a thin wrapper that resolves
 * source FeatureCollections and publishes the outcome via `addOverlayLayer`):
 *
 *   draw rectangle → resolve AOI bounds → clip queryable sources → derived layer
 *
 * Honesty contract: when no queryable source intersects (or none exists) the
 * pipeline returns an explicit capability status, never a fabricated layer.
 */

import { describe, expect, it } from "vitest";

import type { DrawnFeature } from "../mapTypes";
import {
  AOI_FETCH_METHOD,
  AOI_FETCH_SOURCE_LAYER_ID_FIELD,
  buildAoiFetchResult,
  resolveAoiFetchBounds,
  type AoiFetchSource,
} from "../controllers/mapExplorerSpatialHelpers";

/* -------------------------------------------------------------------- */
/*  Deterministic local inputs                                          */
/* -------------------------------------------------------------------- */

const CREATED_AT = "2026-06-16T00:00:00.000Z";
const GENERATED_AT = "2026-06-16T10:00:00.000Z";

/** Axis-aligned rectangle AOI as it would arrive from the drawing tool. */
function rectangleAoi(
  id: string,
  [minLng, minLat, maxLng, maxLat]: [number, number, number, number],
  label: string,
): DrawnFeature {
  return {
    id,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ]],
    },
    properties: { label, createdAt: CREATED_AT },
  };
}

function pointFeature(lng: number, lat: number, id: string): GeoJSON.Feature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: { id, name: id },
  };
}

function source(layerId: string, layerName: string, features: GeoJSON.Feature[]): AoiFetchSource {
  return {
    layerId,
    layerName,
    collection: { type: "FeatureCollection", features },
    sourceKind: "imported",
  };
}

// AOI covering roughly Istanbul's European/Asian seam.
const AOI_BOUNDS: [number, number, number, number] = [28.9, 40.9, 29.1, 41.1];

describe("p07 · resolveAoiFetchBounds", () => {
  it("derives bounds + label from a single drawn rectangle", () => {
    const resolved = resolveAoiFetchBounds(
      [rectangleAoi("rect-1", AOI_BOUNDS, "Study area")],
      null,
    );
    expect(resolved).not.toBeNull();
    expect(resolved!.bounds).toEqual(AOI_BOUNDS);
    expect(resolved!.label).toBe("Study area");
    expect(resolved!.featureCount).toBe(1);
  });

  it("prefers the explicitly selected polygon over other drawings", () => {
    const drawn = [
      rectangleAoi("rect-a", [10, 10, 11, 11], "Area A"),
      rectangleAoi("rect-b", AOI_BOUNDS, "Area B"),
    ];
    const resolved = resolveAoiFetchBounds(drawn, "rect-b");
    expect(resolved!.label).toBe("Area B");
    expect(resolved!.bounds).toEqual(AOI_BOUNDS);
    expect(resolved!.featureCount).toBe(1);
  });

  it("merges multiple drawn polygons when nothing is selected", () => {
    const drawn = [
      rectangleAoi("rect-a", [28.9, 40.9, 29.0, 41.0], "Area A"),
      rectangleAoi("rect-b", [29.0, 41.0, 29.1, 41.1], "Area B"),
    ];
    const resolved = resolveAoiFetchBounds(drawn, null);
    expect(resolved!.bounds).toEqual(AOI_BOUNDS);
    expect(resolved!.label).toBe("Drawn AOI (2 areas)");
    expect(resolved!.featureCount).toBe(2);
  });

  it("returns null when no polygon AOI exists", () => {
    const lineOnly: DrawnFeature = {
      id: "line-1",
      geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      properties: { label: "A line", createdAt: CREATED_AT },
    };
    expect(resolveAoiFetchBounds([lineOnly], null)).toBeNull();
    expect(resolveAoiFetchBounds([], null)).toBeNull();
  });
});

describe("p07 · buildAoiFetchResult", () => {
  it("publishes a bounds-clipped derived layer with provenance (real fetch)", () => {
    const sources = [
      source("parcels", "Parcels", [
        pointFeature(29.0, 41.0, "inside-1"), // inside AOI
        pointFeature(29.05, 41.02, "inside-2"), // inside AOI
        pointFeature(30.0, 42.0, "outside-1"), // outside AOI
      ]),
    ];

    const outcome = buildAoiFetchResult(sources, AOI_BOUNDS, {
      aoiLabel: "Study area",
      generatedAt: GENERATED_AT,
      layerId: "aoi-fetch-fixed",
    });

    expect(outcome.status).toBe("fetched");
    if (outcome.status !== "fetched") return;

    // Only the two in-bounds features survive the clip.
    expect(outcome.featureCount).toBe(2);
    expect(outcome.sourceLayerCount).toBe(1);
    expect(outcome.layer.sourceKind).toBe("derived");
    expect(outcome.layer.queryable).toBe(true);
    expect(outcome.layer.type).toBe("geojson");

    // Provenance is explicit and traceable.
    expect(outcome.provenance.capabilityStatus).toBe("implemented");
    expect(outcome.provenance.method).toBe(AOI_FETCH_METHOD);
    expect(outcome.provenance.generatedAt).toBe(GENERATED_AT);
    expect(outcome.provenance.aoiBounds).toEqual(AOI_BOUNDS);
    expect(outcome.layer.provenance?.method).toBe(AOI_FETCH_METHOD);
    expect(outcome.layer.provenance?.sourceLayerIds).toEqual(["parcels"]);
    expect(outcome.layer.metadata?.bounds).toEqual(AOI_BOUNDS);
    expect(outcome.layer.metadata?.featureCount).toBe(2);

    // Each clipped feature carries its source-layer trace, and excludes the outside one.
    const collection = outcome.layer.sourceData as GeoJSON.FeatureCollection;
    expect(collection.features).toHaveLength(2);
    const ids = collection.features.map((feature) => feature.id);
    expect(ids).toContain("inside-1");
    expect(ids).toContain("inside-2");
    expect(ids).not.toContain("outside-1");
    for (const feature of collection.features) {
      expect(feature.properties?.[AOI_FETCH_SOURCE_LAYER_ID_FIELD]).toBe("parcels");
    }
  });

  it("merges multiple queryable sources and clips each to bounds", () => {
    const sources = [
      source("layer-a", "Layer A", [pointFeature(29.0, 41.0, "a-in"), pointFeature(31, 43, "a-out")]),
      source("layer-b", "Layer B", [pointFeature(29.02, 41.03, "b-in")]),
    ];
    const outcome = buildAoiFetchResult(sources, AOI_BOUNDS, { aoiLabel: "Study area" });
    expect(outcome.status).toBe("fetched");
    if (outcome.status !== "fetched") return;
    expect(outcome.featureCount).toBe(2);
    expect(outcome.sourceLayerCount).toBe(2);
    expect(outcome.layer.provenance?.sourceLayerIds).toEqual(["layer-a", "layer-b"]);
  });

  it("returns an honest residual_gap when no feature falls inside the AOI", () => {
    const sources = [source("parcels", "Parcels", [pointFeature(30.0, 42.0, "outside-1")])];
    const outcome = buildAoiFetchResult(sources, AOI_BOUNDS, { aoiLabel: "Study area" });

    expect(outcome.status).toBe("empty");
    if (outcome.status !== "empty") return;
    expect(outcome.provenance.capabilityStatus).toBe("residual_gap");
    expect(outcome.provenance.sourceLayerIds).toEqual(["parcels"]);
    expect(outcome.reason).toContain("AOI bounds");
    // No fabricated layer is produced.
    expect(outcome).not.toHaveProperty("layer");
  });

  it("returns an honest environment_dependent outcome when no queryable source is loaded", () => {
    const outcomeNoSources = buildAoiFetchResult([], AOI_BOUNDS, { aoiLabel: "Study area" });
    expect(outcomeNoSources.status).toBe("no-source");
    if (outcomeNoSources.status !== "no-source") return;
    expect(outcomeNoSources.provenance.capabilityStatus).toBe("environment_dependent");
    expect(outcomeNoSources.provenance.sourceLayerIds).toEqual([]);

    // Empty FeatureCollections count as "no usable source", not as data.
    const outcomeEmptyCollection = buildAoiFetchResult(
      [source("empty", "Empty layer", [])],
      AOI_BOUNDS,
      { aoiLabel: "Study area" },
    );
    expect(outcomeEmptyCollection.status).toBe("no-source");
  });
});

describe("p07 · end-to-end AOI fetch pipeline", () => {
  it("draws a rectangle, resolves bounds, and produces a clipped derived layer", () => {
    const drawn = [rectangleAoi("rect-1", AOI_BOUNDS, "Downtown AOI")];
    const resolved = resolveAoiFetchBounds(drawn, null);
    expect(resolved).not.toBeNull();

    const sources = [
      source("sensors", "Sensors", [
        pointFeature(29.0, 41.0, "s-in"),
        pointFeature(28.95, 40.95, "s-in-2"),
        pointFeature(35.0, 39.0, "s-out"),
      ]),
    ];

    const outcome = buildAoiFetchResult(sources, resolved!.bounds, {
      aoiLabel: resolved!.label,
      generatedAt: GENERATED_AT,
    });

    expect(outcome.status).toBe("fetched");
    if (outcome.status !== "fetched") return;
    expect(outcome.featureCount).toBe(2);
    expect(outcome.layer.name).toContain("Downtown AOI");
    expect(outcome.layer.sourceKind).toBe("derived");
    expect(outcome.layer.provenance?.generatedAt).toBe(GENERATED_AT);
    expect(outcome.provenance.capabilityStatus).toBe("implemented");
  });
});
