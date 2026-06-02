import {
  MAP_PRIMARY_ACTIVITY_ORDER,
  MAP_TASK_LENSES,
  MAP_UTILITY_ACTIVITY_ORDER,
  getMapActivityDefinition,
} from "./navigation/mapNavigationModel";
import type {
  MapTaskLensDefinition,
  MapTaskLensId,
} from "./navigation/mapNavigationModel";

export type {
  MapActivityDefinition,
  MapActivityId,
  MapTaskLensDefinition,
  MapTaskLensId,
} from "./navigation/mapNavigationModel";

export const MAP_RUNTIME_PRIMARY_ACTIVITY_DEFINITIONS = MAP_PRIMARY_ACTIVITY_ORDER.map(getMapActivityDefinition);
export const MAP_RUNTIME_UTILITY_ACTIVITY_DEFINITIONS = MAP_UTILITY_ACTIVITY_ORDER.map(getMapActivityDefinition);
export const MAP_RUNTIME_TASK_LENSES = MAP_TASK_LENSES;

export const getRuntimeMapActivityDefinition = getMapActivityDefinition;

export function getRuntimeMapTaskLensDefinition(taskLensId: MapTaskLensId): MapTaskLensDefinition {
  const match = MAP_RUNTIME_TASK_LENSES.find((taskLens) => taskLens.id === taskLensId);
  if (!match) {
    throw new Error(`Unknown map task lens: ${taskLensId}`);
  }
  return match;
}
