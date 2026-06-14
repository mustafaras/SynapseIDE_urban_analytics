import React from "react";

import { MAP_COLORS, MAP_RADIUS, MAP_SPACING, mapStyles } from "../mapTokens";
import { MapDialogShell } from "../MapDialogShell";
import type { getCompatibleAoiFlows } from "../../../../services/map/MapAnalysisDispatcher";
import type { resolveFlowDispatchAoiCandidate } from "./mapExplorerSpatialHelpers";

type CompatibleAoiFlow = ReturnType<typeof getCompatibleAoiFlows>[number];
type FlowDispatchAoi = ReturnType<typeof resolveFlowDispatchAoiCandidate>;

interface MapFlowDispatchDialogProps {
  compatibleAoiFlows: CompatibleAoiFlow[];
  flowDispatchAoi: FlowDispatchAoi;
  hasCurrentMapBounds: boolean;
  onClose: () => void;
  onDispatchFlow: (flowId: string) => void;
  onToggleRestrictToMapView: () => void;
  restrictToMapView: boolean;
}

export const MapFlowDispatchDialog: React.FC<MapFlowDispatchDialogProps> = ({
  compatibleAoiFlows,
  flowDispatchAoi,
  hasCurrentMapBounds,
  onClose,
  onDispatchFlow,
  onToggleRestrictToMapView,
  restrictToMapView,
}) => {
  if (!flowDispatchAoi) {
    return null;
  }

  const hasViewFilter = restrictToMapView && hasCurrentMapBounds;

  return (
    <MapDialogShell
      ariaLabel="Choose workflow for map analysis dispatch"
      memoryKey="map-flow-dispatch"
      title={`Route ${flowDispatchAoi.label.toLowerCase()} into a workflow`}
      subtitle="Analyze This Area"
      width={460}
      bodyStyle={{ display: "grid", gap: 14, padding: `0 ${MAP_SPACING.lg} ${MAP_SPACING.lg}` }}
      overlayStyle={{ background: "rgba(0, 0, 0, 0.34)" }}
      onClose={onClose}
    >
        <div style={{ color: "var(--syn-text-muted, rgba(148, 163, 184, 0.9))", fontSize: 12, lineHeight: 1.5 }}>
          Choose a compatible workflow to inspect this AOI in Analyze. Nothing runs yet; the selected workflow opens in CenterPanel with this map-dispatch input attached{hasViewFilter ? " and the current view preserved as a spatial filter" : ""}.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <div
            style={{
              display: "grid",
              gap: 6,
              padding: "12px 14px",
              borderRadius: MAP_RADIUS.sm,
              border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
              background: "rgba(15, 23, 42, 0.42)",
            }}
          >
            <div style={{ color: "var(--syn-text-muted, rgba(148, 163, 184, 0.9))", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              AOI input
            </div>
            <div style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))", fontSize: 13, fontWeight: 600 }}>
              {flowDispatchAoi.label}
            </div>
            <div style={{ color: "var(--syn-text-secondary, rgba(203, 213, 225, 0.92))", fontSize: 12, lineHeight: 1.45 }}>
              {flowDispatchAoi.source === "drawn-aoi"
                ? "Uses the active drawn polygon as workflow launch geometry."
                : "Uses the current visible map extent as workflow launch geometry."}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: "12px 14px",
              borderRadius: MAP_RADIUS.sm,
              border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
              background: "rgba(15, 23, 42, 0.42)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ color: "var(--syn-text-muted, rgba(148, 163, 184, 0.9))", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Map view filter
                </div>
                <div style={{ color: "var(--syn-text-primary, rgba(244, 247, 255, 0.94))", fontSize: 13, fontWeight: 600 }}>
                  {hasViewFilter ? "Current view preserved" : "Full AOI scope"}
                </div>
              </div>
              <button
                type="button"
                style={mapStyles.sidePanelActionButton}
                onClick={onToggleRestrictToMapView}
                data-testid="map-flow-dispatch-filter-toggle"
                aria-label={restrictToMapView ? "Disable current map view restriction" : "Enable current map view restriction"}
              >
                {restrictToMapView ? "Turn filter off" : "Turn filter on"}
              </button>
            </div>
            <div style={{ color: "var(--syn-text-secondary, rgba(203, 213, 225, 0.92))", fontSize: 12, lineHeight: 1.45 }}>
              {hasViewFilter
                ? "The opened workflow keeps the current extent as an additional spatial filter in CenterPanel."
                : "The workflow opens with the AOI only; results are not clipped to the current view unless you turn the filter on."}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {compatibleAoiFlows.map((flow) => (
            <button
              key={flow.id}
              type="button"
              style={{
                display: "grid",
                gap: 4,
                padding: "12px 14px",
                borderRadius: MAP_RADIUS.sm,
                border: "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.32))",
                background: MAP_COLORS.transparent,
                color: "var(--syn-text-secondary, rgba(203, 213, 225, 0.92))",
                textAlign: "left",
                cursor: "pointer",
              }}
              onClick={() => onDispatchFlow(flow.id)}
            >
              <span style={{ color: "var(--syn-interaction-active, #3794ff)", fontSize: 13, fontWeight: 600 }}>{flow.label}</span>
              <span style={{ color: "rgba(255,255,255,0.64)", fontSize: 12, lineHeight: 1.45 }}>{flow.description}</span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 8, color: "var(--syn-text-muted, rgba(148, 163, 184, 0.9))", fontSize: 11 }}>
                <span>AOI attached</span>
                <span>{hasViewFilter ? "View filter preserved" : "Full AOI scope"}</span>
              </span>
            </button>
          ))}
        </div>
    </MapDialogShell>
  );
};
