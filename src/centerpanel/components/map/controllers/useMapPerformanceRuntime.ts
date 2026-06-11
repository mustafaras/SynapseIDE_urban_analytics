import { useCallback, useEffect, useState } from "react";

import {
  getMapTelemetryEvents,
  subscribeMapTelemetryEvents,
} from "../../../../services/map/observability";
import type { MapPerformanceTimingMetric } from "../../../../services/map/MapPerformanceDiagnostics";
import type { MapRightDockRouteSource } from "../mapRightDockRoutes";
import { analyticsWorkerPool } from "../../../../workers/pool";

interface UseMapPerformanceRuntimeInput {
  announce: (message: string) => void;
  openDiagnosticsRightDock: (announcement?: string, routeSource?: MapRightDockRouteSource) => void;
}

export function useMapPerformanceRuntime({
  announce,
  openDiagnosticsRightDock,
}: UseMapPerformanceRuntimeInput) {
  const [performanceTimings, setPerformanceTimings] = useState<MapPerformanceTimingMetric[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState(() => getMapTelemetryEvents());

  useEffect(() => subscribeMapTelemetryEvents(() => setTelemetryEvents(getMapTelemetryEvents())), []);

  const recordPerformanceTiming = useCallback((metric: MapPerformanceTimingMetric) => {
    setPerformanceTimings((previous) => [...previous.slice(-19), metric]);
  }, []);

  const handleRetryWorkerJob = useCallback((jobId: string) => {
    const handle = analyticsWorkerPool.retryJob(jobId);
    if (!handle) {
      announce("Worker retry is unavailable for that task");
      return;
    }
    void handle.promise.catch(() => undefined);
    openDiagnosticsRightDock("Worker retry queued in diagnostics", "worker");
  }, [announce, openDiagnosticsRightDock]);

  return {
    handleRetryWorkerJob,
    performanceTimings,
    recordPerformanceTiming,
    telemetryEvents,
  };
}
