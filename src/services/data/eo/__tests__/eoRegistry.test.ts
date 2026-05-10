import { beforeEach, describe, expect, it } from "vitest";
import type { CatalogItem } from "@/services/data/connectors/types";
import {
  buildEOSourcePublicationArtifacts,
  useEOSourceStore,
} from "..";

function makeCatalogItem(): CatalogItem {
  return {
    id: "S2A_TEST_ITEM",
    collection: "sentinel-2-l2a",
    provider: "stac",
    bbox: [28.94, 41.01, 29.04, 41.08],
    datetime: {
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-03T23:59:59Z",
    },
    cloudCover: 12,
    gsd: 10,
    crs: "EPSG:4326",
    assets: [
      {
        key: "visual",
        title: "Visual COG",
        href: "https://example.com/visual.tif",
        mediaType: "image/tiff; application=geotiff; profile=cloud-optimized",
        extra: {},
      },
    ],
    geometry: {
      type: "Polygon",
      coordinates: [[
        [28.94, 41.01],
        [29.04, 41.01],
        [29.04, 41.08],
        [28.94, 41.08],
        [28.94, 41.01],
      ]],
    },
    properties: {},
    selfLink: "https://example.com/items/S2A_TEST_ITEM",
  };
}

beforeEach(() => {
  useEOSourceStore.getState().clear();
});

describe("EO source registry", () => {
  it("registers STAC items under a shared provenance contract", () => {
    const sources = useEOSourceStore.getState().registerStacItems([makeCatalogItem()]);

    expect(sources).toHaveLength(1);
    expect(sources[0]?.kind).toBe("stac-item");
    expect(sources[0]?.provenance.provider).toBe("stac");
    expect(sources[0]?.provenance.bbox).toEqual([28.94, 41.01, 29.04, 41.08]);
    expect(sources[0]?.provenance.timeRange).toEqual({
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-03T23:59:59Z",
    });
    expect(useEOSourceStore.getState().selectedSourceId).toBe(sources[0]?.id ?? null);
  });

  it("tracks demo sources and publication records without duplicating source selection logic", () => {
    const demoSource = useEOSourceStore.getState().registerDemoSource();
    const artifacts = buildEOSourcePublicationArtifacts(demoSource);

    useEOSourceStore.getState().upsertDatasetEntry(artifacts.datasetEntry);
    const publication = useEOSourceStore.getState().recordPublication({
      sourceId: demoSource.id,
      target: "map-layer",
      label: `${demoSource.title} footprint`,
    });

    expect(demoSource.runtimeState).toBe("demo");
    expect(artifacts.layer.metadata?.eoSource?.isDemo).toBe(true);
    expect(artifacts.completedRun.dataOutputs[0]?.format).toBe("eo-source-metadata");
    expect(useEOSourceStore.getState().datasetEntries).toHaveLength(1);
    expect(useEOSourceStore.getState().publications[0]?.id).toBe(publication.id);
    expect(useEOSourceStore.getState().getSelectedSource()?.id).toBe(demoSource.id);
  });

  it("records connector action history alongside shared source registration", () => {
    const demoSource = useEOSourceStore.getState().registerDemoSource();
    const action = useEOSourceStore.getState().recordConnectorAction({
      provider: demoSource.provider,
      actionKind: "demo-load",
      runtimeState: "demo",
      summary: "Demo raster loaded.",
      sourceId: demoSource.id,
      relatedSourceIds: [demoSource.id],
      sourceRef: demoSource.provenance.sourceRef,
    });

    expect(action.actionKind).toBe("demo-load");
    expect(useEOSourceStore.getState().connectorActions[0]?.sourceId).toBe(demoSource.id);
    expect(useEOSourceStore.getState().connectorActions[0]?.runtimeState).toBe("demo");
  });
});
