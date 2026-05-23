import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  applySourceHandleToLayer,
  createImportSourceHandle,
  mapSourceRestoreStatusToLayerRestoreState,
  mapSourceStorageModeToLayerPersistenceSource,
  MapSourceRegistry,
  sanitizeSourceHandleForPersistence,
} from "../sources/MapSourceRegistry";

function makeLayer(overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return {
    id: "layer-source-registry",
    name: "Source registry layer",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    metadata: {
      featureCount: 2,
      fields: ["name", "value"],
      crsSummary: {
        crs: "EPSG:4326",
        status: "known",
        source: "import-source",
        notes: [],
      },
      schemaSummary: {
        fieldCount: 2,
        fields: [
          { name: "name", role: "attribute", type: "string" },
          { name: "value", role: "attribute", type: "number" },
        ],
        source: "feature-collection",
        notes: [],
      },
      importSource: {
        format: "geojson",
        fileName: "source.geojson",
        sourceName: "source.geojson",
        importedAt: "2026-05-22T00:00:00.000Z",
        importedFeatureCount: 2,
        sourceConfidence: "declared",
        workerTransferStatus: "not-required",
        caveats: ["License unknown."],
      },
    },
    ...overrides,
  };
}

describe("MapSourceRegistry", () => {
  it("performs CRUD over lightweight source handles", () => {
    const handle = createImportSourceHandle({
      layer: makeLayer(),
      format: "geojson",
      sourceSizeBytes: 512,
      profiledAt: "2026-05-22T00:00:00.000Z",
    });
    const registry = new MapSourceRegistry();

    registry.upsert(handle);
    expect(registry.list()).toHaveLength(1);
    expect(registry.get(handle.sourceId)).toMatchObject({ sourceId: handle.sourceId, storageMode: "inline-small" });

    registry.upsert({ ...handle, restoreStatus: "recoverable", sourceRef: "cache-key" });
    expect(registry.get(handle.sourceId)?.restoreStatus).toBe("recoverable");

    expect(registry.remove(handle.sourceId)).toBe(true);
    expect(registry.get(handle.sourceId)).toBeNull();
  });

  it("maps storage and restore status into existing layer persistence semantics", () => {
    expect(mapSourceStorageModeToLayerPersistenceSource("inline-small")).toBe("inline");
    expect(mapSourceStorageModeToLayerPersistenceSource("worker-table")).toBe("metadata");
    expect(mapSourceStorageModeToLayerPersistenceSource("url-refetch")).toBe("url");
    expect(mapSourceRestoreStatusToLayerRestoreState("restored")).toBe("restored");
    expect(mapSourceRestoreStatusToLayerRestoreState("recoverable")).toBe("metadata-only");
    expect(mapSourceRestoreStatusToLayerRestoreState("unavailable")).toBe("stale-reference");
  });

  it("sanitizes non-inline source handles to unavailable when only metadata is persisted", () => {
    const liveHandle = createImportSourceHandle({
      layer: makeLayer(),
      format: "geojson",
      sourceSizeBytes: 1_200_000,
      profiledAt: "2026-05-22T00:00:00.000Z",
    });
    expect(liveHandle.storageMode).toBe("metadata-only");
    expect(liveHandle.restoreStatus).toBe("restored");

    const persistedHandle = sanitizeSourceHandleForPersistence(liveHandle);
    const layer = applySourceHandleToLayer(makeLayer(), persistedHandle, {
      snapshotVersion: 3,
      savedAt: "2026-05-22T00:00:00.000Z",
    });

    expect(persistedHandle.restoreStatus).toBe("unavailable");
    expect(layer.metadata?.persistence).toMatchObject({
      sourcePersistence: "metadata",
      restoreState: "stale-reference",
      sourceRestoreStatus: "unavailable",
    });
  });
});