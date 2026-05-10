import React from "react";
import ObjectDetectorPanel from "../components/ObjectDetectorPanel";
import CrossPanelActions from "./rail/CrossPanelActions";

const ObjectDetectionFlow: React.FC = () => {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        height: "auto",
        minHeight: "760px",
      }}
    >
      <ObjectDetectorPanel />
      <CrossPanelActions flowId="object_detection" stepLabel="YOLO-Nano Object Detection" />
    </section>
  );
};

export default ObjectDetectionFlow;
