/* ==================================================================== */
/*  Real OSM city loader                                                 */
/*                                                                        */
/*  Replaces the synthetic teaching geometry with REAL OpenStreetMap     */
/*  data (buildings + roads, © ODbL) for a CRS-safe central window of    */
/*  a catalog city. The public Overpass endpoint cannot serve a whole    */
/*  dense city, so the window is clamped to the connector's area cap     */
/*  (~4 km²) — real geometry that aligns with the actual street grid.    */
/*                                                                        */
/*  The deterministic synthetic catalog stays intact as an offline       */
/*  fallback; callers decide when to fall back (e.g. when OSM is          */
/*  unreachable). Layers are honestly labelled `sourceKind: "external"`   */
/*  with ODbL attribution.                                                */
/* ==================================================================== */

import type { OverlayLayerConfig } from "../../../centerpanel/components/map/mapTypes";
import { useMapExplorerStore } from "../../../stores/useMapExplorerStore";
import { MapDataImportError } from "../../map/MapDataImporter";
import {
  clampOverpassBounds,
  createOsmBuildingsLayerConfig,
  createOsmRoadsLayerConfig,
  fetchOverpassBuildingsForBounds,
  fetchOverpassRoadsForBounds,
} from "../../map/ExternalServiceConnector";
import { getTeachingDatasetById } from "./catalog";
import type { TeachingDatasetId } from "./types";

export interface RealOsmCityLoadResult {
  datasetId: TeachingDatasetId;
  city: string;
  /** The clamped, CRS-safe window actually queried from Overpass. */
  window: [number, number, number, number];
  layers: OverlayLayerConfig[];
  buildingCount: number;
  roadCount: number;
  wasClamped: boolean;
}

export interface RealOsmCityLoadOptions {
  /** Injectable for tests; defaults to the real Overpass connector. */
  buildingsFetcher?: typeof fetchOverpassBuildingsForBounds;
  roadsFetcher?: typeof fetchOverpassRoadsForBounds;
  timeoutMs?: number;
}

function renamedForCity(layer: OverlayLayerConfig, city: string): OverlayLayerConfig {
  return { ...layer, name: `${city} — ${layer.name}`, group: "data" };
}

/**
 * Build (but do not mount) the real OSM buildings + roads layers for a
 * catalog city, querying a CRS-safe central window. Pure aside from the
 * injected fetchers, so it is unit-testable without network access.
 */
export async function buildRealOsmCityLayers(
  datasetId: TeachingDatasetId,
  options: RealOsmCityLoadOptions = {},
): Promise<RealOsmCityLoadResult> {
  const dataset = getTeachingDatasetById(datasetId);
  if (!dataset) {
    throw new MapDataImportError(`Unknown teaching dataset: ${datasetId}.`);
  }

  const windowInfo = clampOverpassBounds(dataset.spatialExtent.bounds);
  const buildingsFetcher = options.buildingsFetcher ?? fetchOverpassBuildingsForBounds;
  const roadsFetcher = options.roadsFetcher ?? fetchOverpassRoadsForBounds;
  const fetchOptions = options.timeoutMs != null ? { timeoutMs: options.timeoutMs } : {};

  const [buildings, roads] = await Promise.all([
    buildingsFetcher(windowInfo.clampedBounds, fetchOptions),
    roadsFetcher(windowInfo.clampedBounds, fetchOptions),
  ]);

  const layers: OverlayLayerConfig[] = [
    renamedForCity(createOsmRoadsLayerConfig(roads), dataset.city),
    renamedForCity(createOsmBuildingsLayerConfig(buildings), dataset.city),
  ];

  return {
    datasetId,
    city: dataset.city,
    window: windowInfo.clampedBounds,
    layers,
    buildingCount: buildings.featureCollection.features.length,
    roadCount: roads.featureCollection.features.length,
    wasClamped: windowInfo.wasClamped,
  };
}

/**
 * Fetch real OSM data for a catalog city and mount it into the Map
 * Explorer workspace, centring the viewport on the queried window.
 */
export async function loadRealOsmCityIntoMapWorkspace(
  datasetId: TeachingDatasetId,
  options: RealOsmCityLoadOptions = {},
): Promise<RealOsmCityLoadResult> {
  const result = await buildRealOsmCityLayers(datasetId, options);
  const state = useMapExplorerStore.getState();
  for (const layer of result.layers) {
    state.addOverlayLayer(layer);
  }
  const [west, south, east, north] = result.window;
  useMapExplorerStore.setState({
    isOpen: true,
    center: [Number(((west + east) / 2).toFixed(6)), Number(((south + north) / 2).toFixed(6))],
    zoom: 14,
    bearing: 0,
    pitch: 0,
  });
  return result;
}
