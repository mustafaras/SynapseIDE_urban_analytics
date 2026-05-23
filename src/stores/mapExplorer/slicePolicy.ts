import type { MapExplorerState } from "../useMapExplorerStore";
import { aoiSlicePolicy } from "./slices/aoi";
import { bridgeSlicePolicy } from "./slices/bridge";
import { evidenceSlicePolicy } from "./slices/evidence";
import { layersSlicePolicy } from "./slices/layers";
import { layoutSlicePolicy } from "./slices/layout";
import { qaSlicePolicy } from "./slices/qa";
import { reviewSlicePolicy } from "./slices/review";
import { selectionSlicePolicy } from "./slices/selection";
import { sourcesSlicePolicy } from "./slices/sources";
import { temporalSlicePolicy } from "./slices/temporal";
import type { MapExplorerSliceId, MapExplorerSlicePolicy } from "./slices/types";
import { viewportSlicePolicy } from "./slices/viewport";

export type { MapExplorerPersistenceMode, MapExplorerSliceId, MapExplorerSlicePolicy } from "./slices/types";

export const MAP_EXPLORER_SLICE_ORDER: readonly MapExplorerSliceId[] = [
  "viewport",
  "layers",
  "sources",
  "selection",
  "aoi",
  "qa",
  "evidence",
  "review",
  "temporal",
  "layout",
  "bridge",
];

export const MAP_EXPLORER_SLICE_POLICIES: readonly MapExplorerSlicePolicy[] = [
  viewportSlicePolicy,
  layersSlicePolicy,
  sourcesSlicePolicy,
  selectionSlicePolicy,
  aoiSlicePolicy,
  qaSlicePolicy,
  evidenceSlicePolicy,
  reviewSlicePolicy,
  temporalSlicePolicy,
  layoutSlicePolicy,
  bridgeSlicePolicy,
];

function uniqueStateKeys(keys: readonly (keyof MapExplorerState)[]): readonly (keyof MapExplorerState)[] {
  return Array.from(new Set(keys));
}

export const MAP_EXPLORER_PERSISTED_STATE_KEYS = uniqueStateKeys(
  MAP_EXPLORER_SLICE_POLICIES.flatMap((policy) => policy.persistedKeys),
);

export const MAP_EXPLORER_TRANSIENT_STATE_KEYS = uniqueStateKeys(
  MAP_EXPLORER_SLICE_POLICIES.flatMap((policy) => policy.transientKeys),
);

export const MAP_EXPLORER_HEAVY_GEOMETRY_KEYS = uniqueStateKeys(
  MAP_EXPLORER_SLICE_POLICIES.flatMap((policy) => policy.heavyGeometryKeys),
);

export function getMapExplorerSlicePolicy(id: MapExplorerSliceId): MapExplorerSlicePolicy {
  const policy = MAP_EXPLORER_SLICE_POLICIES.find((entry) => entry.id === id);
  if (!policy) {
    throw new Error(`Unknown Map Explorer slice: ${id}`);
  }
  return policy;
}