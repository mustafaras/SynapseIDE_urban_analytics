import React from "react";

import { MapEmergingHotSpotViz } from "../components/MapEmergingHotSpotViz";
import CrossPanelActions from "./rail/CrossPanelActions";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

const EmergingHotSpotFlow: React.FC = () => {
  const overlayLayers = useMapExplorerStore((state) => state.overlayLayers);

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "auto",
        minHeight: "760px",
      }}
    >
      <div style={{ flex: 1, minHeight: "680px" }}>
        <MapEmergingHotSpotViz
          overlayLayers={overlayLayers}
          visible
          onClose={() => {}}
          presentation="embedded"
          flowId="emerging_hot_spot"
          showMapExplorerShortcut
        />
      </div>
      <CrossPanelActions flowId="emerging_hot_spot" stepLabel="Emerging Hot Spots" />
    </section>
  );
};

export default EmergingHotSpotFlow;
