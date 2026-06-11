import { describe, expect, it } from "vitest";
import { fcMissingCrs } from "./fixtures/gisFixtures";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  buildUserDeclaredCrsSummary,
  normalizeLayerRegistryMetadata,
  resolveOverlayLayerCrsSummary,
  USER_DECLARED_CRS_CAVEAT,
} from "../mapLayerMetadata";

function missingCrsLayer(): OverlayLayerConfig {
  return {
    id: "missing-crs-parcels",
    name: "Missing CRS parcels",
    type: "geojson",
    visible: true,
    opacity: 1,
    group: "data",
    sourceKind: "imported",
    sourceData: fcMissingCrs.featureCollection,
    metadata: {
      geometryType: "Polygon",
      featureCount: fcMissingCrs.featureCollection.features.length,
    },
  };
}

function withDeclaredCrs(layer: OverlayLayerConfig, crs: string): OverlayLayerConfig {
  return { ...layer, metadata: { ...layer.metadata, crsSummary: buildUserDeclaredCrsSummary(crs) } };
}

describe("user-declared CRS (Prompt 8)", () => {
  it("starts missing for a layer with no CRS metadata (fcMissingCrs)", () => {
    expect(resolveOverlayLayerCrsSummary(missingCrsLayer()).status).toBe("missing");
  });

  it("builds a caveated, non-authoritative summary with a normalized code", () => {
    const summary = buildUserDeclaredCrsSummary("epsg:32635");
    expect(summary.crs).toBe("EPSG:32635");
    expect(summary.status).toBe("known");
    expect(summary.source).toBe("user-declared");
    expect(summary.notes).toContain(USER_DECLARED_CRS_CAVEAT);
  });

  it("preserves provenance + caveat through the resolver (never upgrades to explicit)", () => {
    const summary = resolveOverlayLayerCrsSummary(withDeclaredCrs(missingCrsLayer(), "EPSG:32635"));
    expect(summary.crs).toBe("EPSG:32635");
    expect(summary.source).toBe("user-declared");
    expect(summary.status).toBe("known");
    expect(summary.notes).toContain(USER_DECLARED_CRS_CAVEAT);
  });

  it("keeps the caveat once normalized into registry metadata", () => {
    const registry = normalizeLayerRegistryMetadata(withDeclaredCrs(missingCrsLayer(), "EPSG:32635"));
    expect(registry.crsSummary.source).toBe("user-declared");
    expect(registry.crsSummary.status).toBe("known");
    expect(registry.crsSummary.notes).toContain(USER_DECLARED_CRS_CAVEAT);
  });

  it("re-resolving a resolved summary stays caveated (idempotent; caveat never dropped)", () => {
    const declared = withDeclaredCrs(missingCrsLayer(), "EPSG:32635");
    const once = resolveOverlayLayerCrsSummary(declared);
    const twice = resolveOverlayLayerCrsSummary({
      ...declared,
      metadata: { ...declared.metadata, crsSummary: once },
    });
    expect(twice.source).toBe("user-declared");
    expect(twice.notes).toContain(USER_DECLARED_CRS_CAVEAT);
  });
});
