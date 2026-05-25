import React from "react";
import { AlertTriangle, BadgeCheck, CircleAlert, Layers3, X } from "lucide-react";

import type { UrbanToMapMethodRequestPayload } from "@/services/map/contracts/gisContracts";
import { preflight as runCrsPreflight } from "@/services/map/crs/CrsPreflight";
import type {
  UrbanToMapLayerCompatibility,
  UrbanToMapMethodRequestPreview,
  UrbanToMapPreviewStatus,
} from "@/services/map/bridge/MapUrbanBridgeService";

import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "./mapTokens";

interface MapUrbanMethodCompatibilityRailProps {
  visible: boolean;
  request: UrbanToMapMethodRequestPayload | null;
  preview: UrbanToMapMethodRequestPreview | null;
  presentation?: "right-rail" | "bottom-drawer";
  width?: number;
  onClose: () => void;
  onFocusLayer: (layerId: string) => void;
  onPreviewWorkflow: () => void;
}

const STATUS_LABELS: Record<UrbanToMapPreviewStatus, string> = {
  ready: "Ready",
  "needs-review": "Needs review",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<UrbanToMapPreviewStatus, string> = {
  ready: MAP_COLORS.success,
  "needs-review": MAP_COLORS.warning,
  blocked: MAP_COLORS.error,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const labelStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const copyStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  margin: 0,
  paddingLeft: MAP_SPACING.lg,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const buttonStyle: React.CSSProperties = {
  ...mapStyles.buttonBase,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  minHeight: "2rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
};

function getPanelStyle(
  presentation: "right-rail" | "bottom-drawer",
  width?: number,
): React.CSSProperties {
  if (presentation === "bottom-drawer") {
    return {
      ...mapStyles.sidePanelSurface,
      position: "absolute",
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      height: "min(30rem, 62%)",
      borderTop: MAP_STROKES.hairlineStrong,
      zIndex: MAP_Z_INDEX.symbologyPanel,
      overflow: "hidden",
    };
  }

  return {
    ...mapStyles.sidePanelSurface,
    position: "absolute",
    top: MAP_SPACING.zero,
    right: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: `${width ?? 448}px`,
    maxWidth: "calc(100% - 2rem)",
    borderLeft: MAP_STROKES.hairlineSubtle,
    zIndex: MAP_Z_INDEX.symbologyPanel,
    overflow: "hidden",
  };
}

function statusCopy(status: UrbanToMapPreviewStatus): string {
  if (status === "blocked") {
    return "Resolve all listed prerequisites before previewing a workflow.";
  }
  if (status === "needs-review") {
    return "Review warnings before opening a workflow preview.";
  }
  return "Map-side prerequisites are available for workflow preview.";
}

function getCrsStatus(
  request: UrbanToMapMethodRequestPayload,
  layer: UrbanToMapLayerCompatibility,
) {
  return runCrsPreflight(
    {
      id: `urban-method-${request.requestId}-${layer.layerId}`,
      label: request.methodLabel ?? request.methodId,
      metric: "visual",
      executionKind: "geodesic",
      requiredCrs: request.requirements?.layer?.requiredCrs ?? null,
    },
    [{ id: layer.layerId, name: layer.name, crs: layer.crs }],
  );
}

function requirementSummary(request: UrbanToMapMethodRequestPayload): string[] {
  const layer = request.requirements?.layer;
  const summaries: string[] = [];
  if (layer?.geometryTypes?.length) {
    summaries.push(`Requires ${layer.geometryTypes.join(" or ")} geometry.`);
  }
  if (layer?.requiredFields?.length) {
    summaries.push(`Required fields: ${layer.requiredFields.join(", ")}.`);
  }
  if (layer?.requiredCrs) {
    summaries.push(`Required CRS: ${layer.requiredCrs}.`);
  }
  if (request.requirements?.aoi?.required) {
    summaries.push("AOI required.");
  }
  return summaries;
}

export function MapUrbanMethodCompatibilityRail({
  visible,
  request,
  preview,
  presentation = "right-rail",
  width,
  onClose,
  onFocusLayer,
  onPreviewWorkflow,
}: MapUrbanMethodCompatibilityRailProps) {
  if (!visible || !request || !preview) {
    return null;
  }

  const summaries = requirementSummary(request);
  const workflowDisabled = preview.status === "blocked" || !preview.workflowDraftRequest;
  const statusColor = STATUS_COLORS[preview.status];

  return (
    <aside
      aria-label="Urban method compatibility rail"
      data-testid="map-urban-method-compatibility-rail"
      style={getPanelStyle(presentation, width)}
    >
      <header style={{ ...sectionStyle, gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "start" }}>
        <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
          <span style={labelStyle}>Urban method request</span>
          <h2 style={{ margin: 0, color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.sm, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
            {preview.methodLabel}
          </h2>
          <span style={copyStyle}>{request.methodId}</span>
        </div>
        <button type="button" aria-label="Close method compatibility rail" onClick={onClose} style={buttonStyle}>
          <X size={15} />
        </button>
      </header>

      <div style={{ height: "calc(100% - 7.75rem)", overflowY: "auto" }}>
        <section style={sectionStyle} data-testid="map-urban-method-status">
          <div style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.sm, color: statusColor }}>
            {preview.status === "ready" ? <BadgeCheck size={17} /> : preview.status === "blocked" ? <CircleAlert size={17} /> : <AlertTriangle size={17} />}
            <strong style={{ fontSize: MAP_TYPOGRAPHY.fontSize.sm }}>{STATUS_LABELS[preview.status]}</strong>
          </div>
          <p style={copyStyle}>{statusCopy(preview.status)}</p>
        </section>

        <section style={sectionStyle}>
          <span style={labelStyle}>Requirements</span>
          {summaries.length > 0 ? (
            <ul style={listStyle}>
              {summaries.map((summary) => <li key={summary}>{summary}</li>)}
            </ul>
          ) : (
            <p style={copyStyle}>No explicit layer, CRS, or AOI constraints were declared by this method.</p>
          )}
          <p style={copyStyle}>
            AOI status: {preview.aoiPreview.activeAoiId
              ? `Selected (${preview.aoiPreview.activeAoiId}).`
              : request.requirements?.aoi?.required
                ? "Missing required AOI."
                : "Not required."}
          </p>
          {request.methodValidity ? (
            <p style={copyStyle}>
              Method validity: {request.methodValidity.status}; capability {request.methodValidity.capabilityStatus.replace(/_/g, " ")}.
            </p>
          ) : null}
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: MAP_SPACING.sm }}>
            <Layers3 size={15} color={MAP_COLORS.textSecondary} />
            <span style={labelStyle}>Compatible layers</span>
          </div>
          {preview.compatibleLayers.length === 0 ? (
            <p style={copyStyle}>No map layers are available for compatibility assessment.</p>
          ) : preview.compatibleLayers.map((layer) => {
            const crs = getCrsStatus(request, layer);
            return (
              <article
                key={layer.layerId}
                data-testid={`map-urban-method-layer-${layer.layerId}`}
                style={{
                  display: "grid",
                  gap: MAP_SPACING.sm,
                  padding: MAP_SPACING.sm,
                  border: MAP_STROKES.hairlineSubtle,
                  borderRadius: MAP_RADIUS.sm,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: MAP_SPACING.sm, alignItems: "center" }}>
                  <strong style={{ color: MAP_COLORS.text, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>{layer.name}</strong>
                  <span style={{ color: STATUS_COLORS[layer.status], fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                    {STATUS_LABELS[layer.status]}
                  </span>
                </div>
                <p style={copyStyle}>Geometry: {layer.geometryFamilies.join(", ")}.</p>
                <p style={copyStyle}>
                  Missing fields: {layer.missingRequiredFields.length > 0 ? layer.missingRequiredFields.join(", ") : "None"}.
                </p>
                <div data-testid={`map-urban-method-crs-${layer.layerId}`} style={{ display: "grid", gap: MAP_SPACING.xs }}>
                  <p style={copyStyle}>CRS status: {crs.blocked ? "Blocked" : "Ready"} ({layer.crs ?? "unknown"}).</p>
                  {crs.reason ? <p style={{ ...copyStyle, color: MAP_COLORS.error }}>{crs.reason}</p> : null}
                </div>
                {layer.reasons.length > 0 ? (
                  <ul style={{ ...listStyle, color: MAP_COLORS.error }}>
                    {layer.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                ) : null}
                {layer.warnings.length > 0 ? (
                  <ul style={{ ...listStyle, color: MAP_COLORS.warning }}>
                    {layer.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                ) : null}
                <button
                  type="button"
                  style={buttonStyle}
                  data-testid={`map-urban-method-focus-${layer.layerId}`}
                  onClick={() => onFocusLayer(layer.layerId)}
                >
                  Focus layer
                </button>
              </article>
            );
          })}
        </section>

        <section style={sectionStyle}>
          <span style={labelStyle}>Blockers and warnings</span>
          {preview.missingPrerequisites.length === 0 ? (
            <p style={copyStyle}>No blocking prerequisites.</p>
          ) : (
            <ul style={{ ...listStyle, color: MAP_COLORS.error }}>
              {preview.missingPrerequisites.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          )}
          {preview.warnings.length > 0 ? (
            <ul style={{ ...listStyle, color: MAP_COLORS.warning }}>
              {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}
        </section>

        <section style={sectionStyle}>
          <span style={labelStyle}>QA blockers</span>
          {preview.qaBlockers.length === 0 ? (
            <p style={copyStyle}>No scientific QA blockers reported for the requested layers.</p>
          ) : (
            <ul style={{ ...listStyle, color: MAP_COLORS.error }}>
              {preview.qaBlockers.map((issue) => <li key={issue.issueId}>{issue.title}</li>)}
            </ul>
          )}
        </section>
      </div>

      <footer style={{ ...sectionStyle, position: "absolute", bottom: 0, left: 0, right: 0, background: MAP_COLORS.bgPanel }}>
        <button
          type="button"
          style={{
            ...buttonStyle,
            opacity: workflowDisabled ? 0.45 : 1,
            color: workflowDisabled ? MAP_COLORS.textSecondary : MAP_COLORS.text,
          }}
          disabled={workflowDisabled}
          data-testid="map-urban-method-preview-workflow"
          onClick={onPreviewWorkflow}
          title={workflowDisabled ? "Resolve blocked prerequisites before previewing a workflow." : "Open map workflow preview."}
        >
          Preview workflow
        </button>
      </footer>
    </aside>
  );
}
