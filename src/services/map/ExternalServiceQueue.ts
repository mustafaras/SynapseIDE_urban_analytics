import {
  cacheOverpassBuildingsResult,
  fetchOverpassBuildingsForBounds,
  getCachedOverpassBuildingsForBounds,
} from "./ExternalServiceConnector";
import {
  createInlineTaskHandle,
  enqueueWorkerTask,
  type BackgroundTaskHandle,
  type BackgroundTaskViewAction,
} from "@/workers/pool";

export interface OverpassQueueOptions {
  viewAction?: BackgroundTaskViewAction;
  timeoutMs?: number;
  bypassCache?: boolean;
}

function hasWorkerSupport(): boolean {
  return typeof Worker !== "undefined";
}

export function executeOverpassBuildingsAsync(
  bounds: [number, number, number, number],
  options: OverpassQueueOptions = {},
): BackgroundTaskHandle<"external/overpass-buildings"> {
  const cached = options.bypassCache ? null : getCachedOverpassBuildingsForBounds(bounds);
  if (cached) {
    return createInlineTaskHandle("external/overpass-buildings", () => cached);
  }

  if (!hasWorkerSupport()) {
    return createInlineTaskHandle(
      "external/overpass-buildings",
      () => fetchOverpassBuildingsForBounds(bounds, {
        ...(options.bypassCache ? { bypassCache: true } : {}),
        ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
      }),
    );
  }

  const input = {
    bounds,
    ...(options.bypassCache ? { bypassCache: true } : {}),
  };
  const handle = enqueueWorkerTask("external/overpass-buildings", input, {
    title: "OSM Buildings · Overpass",
    description: "Fetch live OpenStreetMap building footprints for the current map view",
    timeoutMs: options.timeoutMs ?? 45_000,
    viewAction: options.viewAction,
  });

  return {
    ...handle,
    promise: handle.promise.then((result) => {
      cacheOverpassBuildingsResult(result);
      return result;
    }),
  };
}
