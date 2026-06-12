import React from "react";

import { ChunkLoadBoundary } from "@/utils/lazyWithRetry";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { MapExplorerModal as MapExplorerModalComponent } from "./MapExplorerModal";

export function MapExplorerHost(): React.ReactElement | null {
  const isMapOpen = useMapExplorerStore((state) => state.isOpen);
  const closeMap = useMapExplorerStore((state) => state.close);

  if (!isMapOpen) {
    return null;
  }

  return (
    <ChunkLoadBoundary
      compact
      title="Map Explorer unavailable"
      message="The Map Explorer did not load. Retry after the dev server reconnects, or reload the app if it persists."
    >
      <MapExplorerModalComponent open={isMapOpen} onClose={closeMap} />
    </ChunkLoadBoundary>
  );
}

export default MapExplorerHost;
