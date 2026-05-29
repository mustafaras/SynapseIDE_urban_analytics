import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  fcMissingCrs,
  fcPolygonsProjected,
  FC_POLYGONS_PROJECTED_COUNT,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import type { MapActionEffects } from "@/services/map/actions/MapActionExecutor";
import { createConnectionDescriptor } from "@/services/map/sources/MapConnectionRegistry";
import {
  buildUrbanMethodBridgeRequest,
  createMapExtensionRegistry,
  createProcessingRegistryWithExtensions,
  MAP_REFERENCE_EXTENSION_PLUGIN,
  MapExtensionRegistry,
  type MapProcessingToolExtension,
} from "@/services/map/plugins";
import { runProcessingTool } from "@/services/map/processing";

function projectedLayer(): OverlayLayerConfig {
  return {
    id: "layer-projected",
    name: "Projected polygons",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: fcPolygonsProjected.featureCollection,
    metadata: {
      featureCount: FC_POLYGONS_PROJECTED_COUNT,
      geometryType: "Polygon",
      fields: ["zone", "area_m2", "population"],
      crsSummary: { crs: fcPolygonsProjected.declaredCrs, status: "known", source: "explicit", notes: [] },
    },
  };
}

function missingCrsLayer(): OverlayLayerConfig {
  return {
    id: "layer-missing-crs",
    name: "Missing CRS polygons",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: fcMissingCrs.featureCollection,
    metadata: {
      featureCount: fcMissingCrs.featureCollection.features.length,
      geometryType: "Polygon",
      fields: ["zone"],
    },
  };
}

function makeEffects(layers: OverlayLayerConfig[]): { effects: MapActionEffects; all: () => OverlayLayerConfig[] } {
  const store = new Map(layers.map((layer) => [layer.id, layer]));
  let order = layers.map((layer) => layer.id);
  const effects: MapActionEffects = {
    getLayer: (id) => store.get(id) ?? null,
    getLayerOrder: () => [...order],
    addLayer: (layer) => {
      store.set(layer.id, layer);
      order.push(layer.id);
    },
    removeLayer: (id) => {
      store.delete(id);
      order = order.filter((entry) => entry !== id);
    },
    setLayerOrder: (ids) => {
      order = [...ids];
    },
    setLayerStyle: () => {},
    removeReportItem: () => {},
  };
  return { effects, all: () => [...store.values()] };
}

function hasSourceDataKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasSourceDataKey);
  const record = value as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, "sourceData")) return true;
  return Object.values(record).some(hasSourceDataKey);
}

describe("MapExtensionRegistry", () => {
  it("rejects duplicate extension ids and processing plugins that shadow core tools", () => {
    const processingExtension = MAP_REFERENCE_EXTENSION_PLUGIN.extensions.find(
      (extension): extension is MapProcessingToolExtension => extension.kind === "processing-tool",
    )!;
    const registry = new MapExtensionRegistry();

    registry.register(processingExtension);
    expect(() => registry.register(processingExtension)).toThrow(/already registered/i);

    const collidingExtension: MapProcessingToolExtension = {
      ...processingExtension,
      extensionId: "processing.buffer-collision",
      contribution: {
        descriptor: { ...processingExtension.contribution.descriptor, toolId: "buffer" },
        executor: {
          ...processingExtension.contribution.executor,
          descriptor: { ...processingExtension.contribution.executor.descriptor, toolId: "buffer" },
        },
      },
    };

    expect(() => new MapExtensionRegistry([{ ...MAP_REFERENCE_EXTENSION_PLUGIN, extensions: [collidingExtension] }])).toThrow(
      /cannot replace core tool/i,
    );
  });

  it("registers and discovers all four reference extension kinds", () => {
    const registry = new MapExtensionRegistry([MAP_REFERENCE_EXTENSION_PLUGIN]);

    expect(registry.listByKind("source-connector")).toHaveLength(1);
    expect(registry.listByKind("renderer")).toHaveLength(1);
    expect(registry.listByKind("processing-tool")).toHaveLength(1);
    expect(registry.listByKind("urban-method-bridge")).toHaveLength(1);
    expect(registry.has("processing.plugin-envelope")).toBe(true);
    expect(registry.list().every((extension) => extension.capability && extension.availabilityStatus)).toBe(true);
  });

  it("exposes source connector providers without mutating the built-in connection path", () => {
    const registry = createMapExtensionRegistry();
    const providers = registry.connectionProviders();

    expect(providers["cityjson-static"]?.serviceKind).toBe("cityjson");
    const descriptor = createConnectionDescriptor(
      {
        sourceId: "source-cityjson-plugin",
        providerId: "cityjson-static",
        serviceKind: "cityjson",
        endpoint: "https://example.test/buildings.city.json",
        title: "Plugin CityJSON",
      },
      providers,
    );

    expect(descriptor.providerId).toBe("cityjson-static");
    expect(descriptor.credentialMode).toBe("not-required");
  });

  it("exposes renderer families and Urban bridge request templates", () => {
    const registry = createMapExtensionRegistry();
    const renderer = registry.rendererFamilies()[0];
    const urbanBridge = registry.urbanMethodBridges()[0]!;

    expect(renderer).toMatchObject({ styleFamily: "dot-density", legendContract: "serialized-legend-v1" });

    const payload = buildUrbanMethodBridgeRequest(urbanBridge, {
      requestId: "plugin-urban-request-1",
      createdAt: "2026-05-29T00:00:00.000Z",
    });
    expect(payload).toMatchObject({
      version: 1,
      requestId: "plugin-urban-request-1",
      methodId: "plugin.walkability-access",
      destinationModule: "map-explorer",
    });
    expect(payload.requestedActions).toContain("preview-map-workflow");
    expect(hasSourceDataKey(payload)).toBe(false);
  });

  it("adds the reference processing-tool plugin to the processing registry", () => {
    const extensionRegistry = createMapExtensionRegistry();
    const processingRegistry = createProcessingRegistryWithExtensions(extensionRegistry);

    expect(processingRegistry.get("plugin-envelope")?.title).toBe("Plugin envelope");
    expect(processingRegistry.search("plugin envelope").map((tool) => tool.toolId)).toEqual(["plugin-envelope"]);
  });

  it("runs the plugin processing tool through preflight, manifest, and command lifecycle", () => {
    const extensionRegistry = createMapExtensionRegistry();
    const { effects, all } = makeEffects([projectedLayer()]);
    const result = runProcessingTool(
      "plugin-envelope",
      { layer: "layer-projected" },
      effects,
      {
        now: () => "2026-05-29T00:00:00.000Z",
        idFactory: () => "plugin-test",
        extensionExecutors: extensionRegistry.processingToolExecutors(),
      },
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("applied");
    expect(result!.command.kind).toBe("workflow.apply");
    expect(result!.manifest?.workflowKind).toBe("processing.plugin-envelope");
    expect(result!.manifest?.qaSummary.status).toBe("passed");
    expect(result!.manifest?.qaSummary.infoCount).toBeGreaterThan(0);
    expect(result!.outputLayer?.metadata?.reproducibilityManifest).toBeDefined();
    expect(all().some((layer) => layer.id === "processing:plugin-envelope:plugin-test")).toBe(true);
  });

  it("keeps plugin tool CRS-gated before apply", () => {
    const extensionRegistry = createMapExtensionRegistry();
    const { effects, all } = makeEffects([missingCrsLayer()]);
    const before = all().length;
    const result = runProcessingTool(
      "plugin-envelope",
      { layer: "layer-missing-crs" },
      effects,
      { extensionExecutors: extensionRegistry.processingToolExecutors() },
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("blocked");
    expect(result!.preview.blockers.join(" ")).toMatch(/CRS/i);
    expect(all()).toHaveLength(before);
  });
});