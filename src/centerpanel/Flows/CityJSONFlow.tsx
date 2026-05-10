/**
 * CityJSONFlow — Workflow wrapper for CityJSON Viewer.
 *
 * Embeds the CityJSONViewer within the Flows/Workflow tab infrastructure.
 */
import CityJSONViewer from "../../features/urbanAnalytics/voxcity/CityJSONViewer";
import CrossPanelActions from "./rail/CrossPanelActions";

export default function CityJSONFlow() {
  return (
    <section style={{ height: "auto", minHeight: "820px", display: "flex", flexDirection: "column" }}>
      <CityJSONViewer />
      <CrossPanelActions flowId="cityjson_loader" stepLabel="CityJSON Viewer" />
    </section>
  );
}
