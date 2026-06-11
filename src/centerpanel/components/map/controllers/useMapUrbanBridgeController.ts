import { type MutableRefObject, useEffect } from "react";
import type maplibregl from "maplibre-gl";

import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import {
  subscribeUrbanToMapMethodRequests,
  type UrbanToMapMethodRequest,
} from "@/services/map/UrbanToMapMethodRequestAdapter";

type MapBoundsTuple = [number, number, number, number];

interface UseMapUrbanBridgeControllerOptions {
  open: boolean;
  reducedMotion: boolean;
  mapInstanceRef: MutableRefObject<maplibregl.Map | null>;
  onUrbanToMapMethodRequest: (request: UrbanToMapMethodRequest) => void;
}

export function applyMapFitBounds(
  map: Pick<maplibregl.Map, "easeTo" | "fitBounds" | "getZoom">,
  bounds: MapBoundsTuple,
  reducedMotion: boolean,
) {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  if (minLng === maxLng && minLat === maxLat) {
    map.easeTo({
      center: [minLng, minLat],
      zoom: Math.max(map.getZoom(), 14),
      duration: reducedMotion ? 0 : 500,
      essential: true,
    });
    return;
  }

  map.fitBounds(
    [[minLng, minLat], [maxLng, maxLat]],
    { padding: 64, duration: reducedMotion ? 0 : 900, essential: true },
  );
}

export function useMapUrbanBridgeController({
  open,
  reducedMotion,
  mapInstanceRef,
  onUrbanToMapMethodRequest,
}: UseMapUrbanBridgeControllerOptions) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handler = (event: Event) => {
      const { bounds } = (event as CustomEvent<{ bounds?: MapBoundsTuple }>).detail ?? {};
      const map = mapInstanceRef.current;
      if (!map || !bounds) {
        return;
      }

      applyMapFitBounds(map, bounds, reducedMotion);
    };

    window.addEventListener("synapse:map:fitBounds", handler);
    return () => window.removeEventListener("synapse:map:fitBounds", handler);
  }, [mapInstanceRef, open, reducedMotion]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const applyPending = () => {
      const map = mapInstanceRef.current;
      if (!map) {
        return;
      }

      const pending = useMapExplorerStore.getState().pendingFitBounds;
      if (!pending) {
        return;
      }

      applyMapFitBounds(map, pending.bounds, reducedMotion);
      useMapExplorerStore.getState().consumePendingFitBounds();
    };

    applyPending();

    const unsubscribe = useMapExplorerStore.subscribe((state, previousState) => {
      if (state.pendingFitBounds !== previousState.pendingFitBounds) {
        applyPending();
      }
    });
    return unsubscribe;
  }, [mapInstanceRef, open, reducedMotion]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    return subscribeUrbanToMapMethodRequests(onUrbanToMapMethodRequest);
  }, [onUrbanToMapMethodRequest, open]);
}
