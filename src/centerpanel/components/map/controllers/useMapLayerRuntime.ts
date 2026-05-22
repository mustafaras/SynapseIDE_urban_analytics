import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

export function useMapLayerRuntime() {
  const overlayLayers = useMapExplorerStore((state) => state.overlayLayers);
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const updateLayerMetadata = useMapExplorerStore((state) => state.updateLayerMetadata);
  const removeOverlayLayer = useMapExplorerStore((state) => state.removeOverlayLayer);
  const toggleLayerVisibility = useMapExplorerStore((state) => state.toggleLayerVisibility);
  const setLayerOpacity = useMapExplorerStore((state) => state.setLayerOpacity);
  const reorderLayers = useMapExplorerStore((state) => state.reorderLayers);

  return {
    overlayLayers,
    addOverlayLayer,
    updateLayerMetadata,
    removeOverlayLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    reorderLayers,
  };
}
