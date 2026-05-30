import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  buildMapNLQueryAuditDetails,
  buildMapNLQueryContext,
  executeMapNLQueryPreview,
  generateMapNLQueryPreview,
} from "../MapNLQueryBuilder";

const parcels: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "parcel-1",
      properties: { value: 12, density: 90, tree_canopy_pct: 8 },
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
      id: "stop-1",
      properties: { name: "Stop A" },
      geometry: { type: "Point", coordinates: [29.005, 41.005] },
    },
  ],
};

function layer(id: string, name: string, sourceData: FeatureCollection, overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
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
    ...overrides,
  };
}

describe("MapNLQueryBuilder", () => {
  it("selects visible layers by default and includes hidden project layers only for project scope", () => {
    const visible = layer("parcels", "Parcels", parcels);
    const hidden = layer("transit", "Transit Stops", transitStops, { visible: false });

    const visibleContext = buildMapNLQueryContext([visible, hidden], { scope: "visible", mode: "live" });
    const projectContext = buildMapNLQueryContext([visible, hidden], { scope: "project", mode: "live" });

    expect(visibleContext.queryableLayers.map((entry) => entry.id)).toEqual(["parcels"]);
    expect(visibleContext.unavailableLayers.some((entry) => entry.id === "transit" && entry.reason.includes("scope"))).toBe(true);
    expect(projectContext.queryableLayers.map((entry) => entry.id)).toEqual(["parcels", "transit"]);
  });

  it("keeps demo mode explicit and does not silently substitute sample data into live execution", () => {
    const demoLayer = layer("sample-parcels", "Sample Parcels", parcels, { sourceKind: "demo" });

    const liveContext = buildMapNLQueryContext([demoLayer], { scope: "visible", mode: "live" });
    const demoContext = buildMapNLQueryContext([demoLayer], { scope: "visible", mode: "demo" });
    const preview = generateMapNLQueryPreview("Show parcels.", demoContext);

    expect(liveContext.queryableLayers).toHaveLength(0);
    expect(liveContext.unavailableLayers[0]?.reason).toContain("Demo/sample");
    expect(demoContext.queryableLayers).toHaveLength(1);
    expect(preview.modeLabel).toBe("Explicit demo data");
  });

  it("lists non-queryable and external layers with truthful unavailable reasons", () => {
    const nonQueryable = layer("locked", "Locked Parcels", parcels, { queryable: false });
    const raster: OverlayLayerConfig = {
      id: "tiles",
      name: "Remote Tiles",
      type: "raster-tile",
      visible: true,
      opacity: 1,
      sourceKind: "external",
      queryable: true,
      sourceData: "https://tiles.example.test/{z}/{x}/{y}.png",
    };

    const context = buildMapNLQueryContext([nonQueryable, raster], { scope: "visible", mode: "live" });

    expect(context.queryableLayers).toHaveLength(0);
    expect(context.unavailableLayers.map((entry) => entry.reason).join(" ")).toContain("non-queryable");
    expect(context.unavailableLayers.map((entry) => entry.reason).join(" ")).toContain("External service");
  });

  it("generates a map-scoped proximity SQL preview over visible queryable layers", () => {
    const context = buildMapNLQueryContext([
      layer("parcels", "Parcels", parcels),
      layer("transit", "Transit Stops", transitStops),
    ]);

    const preview = generateMapNLQueryPreview("Show parcels within 500 meters of transit stops.", context);

    expect(preview.canRun).toBe(true);
    expect(preview.sql).toContain("ST_DWithin");
    expect(preview.sql).toContain("parcels");
    expect(preview.sql).toContain("transit_stops");
    expect(preview.sourceLayers.map((entry) => entry.name)).toEqual(["Parcels", "Transit Stops"]);
    expect(preview.copyText).toContain("Scope: Visible layers");
    expect(preview.requiresExplicitApply).toBe(true);
    expect(preview.aiGuardrail).toMatchObject({
      status: "allowed",
      auditTag: "AI-proposed",
      requiresHumanConfirmation: true,
    });
    expect(preview.intentPreview).toMatchObject({
      intent: "proximity",
      intentLabel: "Proximity",
      sourceLayerSelection: "matched-request",
    });
    expect(preview.affectedLayers.map((entry) => entry.id)).toEqual(["parcels", "transit"]);
    expect(preview.requiredFields.map((entry) => `${entry.layerId}:${entry.role}:${entry.fieldName}`)).toEqual([
      "parcels:join:geometry",
      "transit:join:geometry",
    ]);
  });

  it("adds selected AOI or current extent as an explicit spatial scope predicate", () => {
    const context = buildMapNLQueryContext([layer("parcels", "Parcels", parcels)], {
      scope: "current-extent",
      mode: "live",
      currentMapBounds: [28.9, 40.9, 29.2, 41.2],
    });

    const preview = generateMapNLQueryPreview("Filter parcels above 10 value.", context);

    expect(preview.canRun).toBe(true);
    expect(preview.scopeLabel).toBe("Current map extent");
    expect(preview.sql).toContain("ST_GeomFromGeoJSON");
    expect(preview.sql).toContain("ST_Intersects");
    expect(preview.requiredFields.some((entry) => entry.layerId === "parcels" && entry.role === "filter" && entry.fieldName === "value")).toBe(true);
  });

  it("surfaces ambiguity when source layers are selected by fallback rather than semantic certainty", () => {
    const context = buildMapNLQueryContext([
      layer("parcels", "Parcels", parcels),
      layer("transit", "Transit Stops", transitStops),
    ]);

    const preview = generateMapNLQueryPreview("Show features within 500 meters.", context);

    expect(preview.intentPreview.sourceLayerSelection).toBe("map-order-fallback");
    expect(preview.intentPreview.ambiguityState).toBe("ambiguous");
    expect(preview.warnings.join(" ")).toContain("map order");
  });

  it("does not silently invent missing threshold fields", () => {
    const context = buildMapNLQueryContext([
      layer("transit", "Transit Stops", transitStops),
    ]);

    const preview = generateMapNLQueryPreview("Filter transit stops above 80% confidence.", context);

    expect(preview.requiredFields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        layerId: "transit",
        fieldName: "numeric attribute for threshold",
        role: "filter",
        available: false,
      }),
    ]));
    expect(preview.warnings.join(" ")).toContain("no matching numeric field");
    expect(preview.intentPreview.ambiguityState).toBe("needs-review");
  });

  it("keeps blocked previews auditable without allowing execution", () => {
    const context = buildMapNLQueryContext([
      layer("parcels", "Parcels", parcels),
    ]);

    const preview = generateMapNLQueryPreview("Delete all parcels.", context);
    const audit = buildMapNLQueryAuditDetails(preview, { decision: "rejected" });

    expect(preview.canRun).toBe(false);
    expect(preview.blockers.length).toBeGreaterThan(0);
    expect(audit).toMatchObject({
      request: "Delete all parcels.",
      decision: "rejected",
      requiresExplicitApply: true,
    });
    expect(audit.aiGuardrail).toEqual(expect.objectContaining({
      status: "rejected",
      auditTag: "AI-proposed",
    }));
    expect(audit.affectedLayers).toEqual(expect.any(Array));
  });

  it("creates a workbench-blue QueryToSQL result layer with execution metadata", async () => {
    const context = buildMapNLQueryContext([
      layer("parcels", "Parcels", parcels),
      layer("transit", "Transit Stops", transitStops),
    ]);
    const preview = generateMapNLQueryPreview("Show parcels within 500 meters of transit stops.", context);
    const loadedAliases: string[] = [];

    await expect(executeMapNLQueryPreview(preview, {
      loadGeoJSON: async () => {},
      bindTableAlias: async () => {},
      toGeoJSON: async () => parcels,
    })).rejects.toThrow("human confirmation");

    const result = await executeMapNLQueryPreview(preview, {
      loadGeoJSON: async (alias) => {
        loadedAliases.push(alias);
      },
      bindTableAlias: async () => {},
      toGeoJSON: async (sql) => {
        expect(sql).toContain("ST_DWithin");
        return parcels;
      },
    }, { confirmed: true });

    expect(loadedAliases).toEqual(["parcels", "transit_stops"]);
    expect(result.layer.name).toContain("NL Query:");
    expect(result.layer.style?.["fill-color"]).toBe("#3794FF");
    expect(result.layer.metadata?.analysisResult?.engine).toBe("QueryToSQL");
    expect(result.layer.metadata?.analysisResult?.inputParameters.scope).toBe("visible");
    expect(result.layer.metadata?.analysisResult?.sourceLayerIds).toEqual(["parcels", "transit"]);
    expect(result.layer.queryable).toBe(true);
    expect(result.followUpSuggestions.length).toBeGreaterThan(0);
  });
});
