/**
 * SunlightSimFlow — Workflow wrapper for the Sunlight & Solar Exposure Simulator.
 *
 * Provides the full SunlightSimulatorPanel experience within the Workflows tab.
 */
import React from "react";
import SunlightSimulatorPanel from "../../features/urbanAnalytics/voxcity/SunlightSimulatorPanel";
import CrossPanelActions from "./rail/CrossPanelActions";

const SunlightSimFlow: React.FC = () => {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "1080px",
      }}
    >
      <SunlightSimulatorPanel />
      <CrossPanelActions flowId="sunlight_sim" stepLabel="Sunlight Simulator" />
    </section>
  );
};

export default SunlightSimFlow;
