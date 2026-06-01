import {
  MAP_PRIMARY_ACTIVITY_ORDER,
  MAP_UTILITY_ACTIVITY_ORDER,
  getMapActivityDefinition,
} from "./navigation/mapNavigationModel";

export type { MapActivityDefinition, MapActivityId } from "./navigation/mapNavigationModel";

export const MAP_RUNTIME_PRIMARY_ACTIVITY_DEFINITIONS = MAP_PRIMARY_ACTIVITY_ORDER.map(getMapActivityDefinition);
export const MAP_RUNTIME_UTILITY_ACTIVITY_DEFINITIONS = MAP_UTILITY_ACTIVITY_ORDER.map(getMapActivityDefinition);

export const getRuntimeMapActivityDefinition = getMapActivityDefinition;