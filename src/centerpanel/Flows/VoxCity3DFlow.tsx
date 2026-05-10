/**
 * VoxCity3DFlow — Workflow wrapper for the 3D Building Extrusion viewer.
 *
 * Provides the full BuildingViewer experience within the Workflows tab.
 */
import React from "react";
import BuildingViewer from "../../features/urbanAnalytics/voxcity/BuildingViewer";
import CrossPanelActions from "./rail/CrossPanelActions";

const VoxCity3DFlow: React.FC = () => {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "1020px",
        height: "100%",
      }}
    >
      <BuildingViewer />
      <CrossPanelActions flowId="voxcity_3d" stepLabel="3D Viewer" />
    </section>
  );
};

export default VoxCity3DFlow;
