import React from "react";

import { MapEmergingHotSpotViz } from "../components/MapEmergingHotSpotViz";
import styles from "../styles/flows.module.css";
import CrossPanelActions from "./rail/CrossPanelActions";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

const EmergingHotSpotFlow: React.FC = () => {
  const overlayLayers = useMapExplorerStore((state) => state.overlayLayers);

  return (
    <section className={styles.embeddedWorkflowSurface}>
      <div className={styles.embeddedWorkflowVizFrame}>
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
