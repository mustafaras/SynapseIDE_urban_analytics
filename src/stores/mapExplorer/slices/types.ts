import type { MapExplorerState } from "../../useMapExplorerStore";

export type MapExplorerSliceId =
  | "viewport"
  | "layers"
  | "sources"
  | "selection"
  | "aoi"
  | "qa"
  | "evidence"
  | "review"
  | "temporal"
  | "layout"
  | "bridge";

export type MapExplorerPersistenceMode = "persisted" | "transient" | "mixed";

export interface MapExplorerSlicePolicy {
  id: MapExplorerSliceId;
  label: string;
  persistence: MapExplorerPersistenceMode;
  stateKeys: readonly (keyof MapExplorerState)[];
  actionKeys: readonly (keyof MapExplorerState)[];
  persistedKeys: readonly (keyof MapExplorerState)[];
  transientKeys: readonly (keyof MapExplorerState)[];
  heavyGeometryKeys: readonly (keyof MapExplorerState)[];
  rationale: string;
}

export function defineMapExplorerSlicePolicy(policy: MapExplorerSlicePolicy): MapExplorerSlicePolicy {
  return policy;
}