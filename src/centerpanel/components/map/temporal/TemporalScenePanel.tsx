import React from "react";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { usePrefersReducedMotion } from "../design";
import { GisStatusChip } from "../ui";
import { TemporalPlayerPanel } from "./TemporalPlayerPanel";
import { type TemporalFrameExportPayload, useTemporalLayerStore } from "@/stores/useTemporalLayerStore";

export interface TemporalScenePanelProps {
  activeLayer: OverlayLayerConfig;
  temporalLayers: readonly OverlayLayerConfig[];
  onLayerChange?: (layerId: string) => void;
  onExportFrame?: (payload: TemporalFrameExportPayload) => void;
}

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.md,
};

const sectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.md,
  background: MAP_COLORS.bg,
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
};

const kickerStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const selectLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const selectStyle: React.CSSProperties = {
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const metadataGridStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
};

const metadataCellStyle: React.CSSProperties = {
  display: "grid",
  gap: "2px",
};

const metadataKeyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const metadataValueStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

const caveatListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "1rem",
  display: "grid",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

function runtimeModeStatus(mode: string): GisStatusKey {
  switch (mode) {
    case "live":
      return "ready";
    case "demo":
      return "demo";
    case "synthetic":
      return "synthetic";
    default:
      return "unknown";
  }
}

function formatPlaybackMode(mode: string): string {
  return mode === "continuous" ? "Continuous" : "Snapshot";
}

export const TemporalScenePanel: React.FC<TemporalScenePanelProps> = ({
  activeLayer,
  temporalLayers,
  onLayerChange,
  onExportFrame,
}) => {
  const playbackMode = useTemporalLayerStore((state) => state.playbackMode);
  const runtimeMode = useTemporalLayerStore((state) => state.runtimeMode);
  const timeField = useTemporalLayerStore((state) => state.timeField);
  const sourceFields = useTemporalLayerStore((state) => state.sourceFields);
  const temporalEvidenceId = useTemporalLayerStore((state) => state.temporalEvidenceId);
  const prefersReducedMotion = usePrefersReducedMotion();

  const visualization = activeLayer.metadata?.analysisResult?.visualization?.kind === "temporal"
    ? activeLayer.metadata.analysisResult.visualization
    : null;
  const temporalFrames = visualization?.temporalFrames ?? [];
  const firstFrame = temporalFrames[0] ?? null;
  const lastFrame = temporalFrames.length > 0 ? temporalFrames[temporalFrames.length - 1] ?? null : null;
  const crsSummary = activeLayer.metadata?.crsSummary ?? activeLayer.metadata?.registry?.crsSummary;
  const sourceLayerCount = activeLayer.metadata?.analysisResult?.sourceLayerIds?.length ?? 0;
  const metadataCaveats = React.useMemo(() => {
    const caveats: string[] = [];
    if (!timeField) {
      caveats.push("Time field not recorded; playback order follows the published frame sequence.");
    }
    if (!crsSummary?.crs) {
      caveats.push("CRS is not recorded on this temporal layer; compare frames visually until projection metadata is declared.");
    }
    if (runtimeMode === "unknown") {
      caveats.push("Temporal source mode is not recorded; treat playback provenance as unverified until the layer source is declared.");
    }
    if (sourceLayerCount === 0) {
      caveats.push("Source layer lineage is not attached to this temporal output.");
    }
    if (prefersReducedMotion) {
      caveats.push("Reduced motion is active; autoplay remains disabled and frame stepping stays manual.");
    }
    return caveats;
  }, [crsSummary?.crs, prefersReducedMotion, runtimeMode, sourceLayerCount, timeField]);

  return (
    <div style={panelStyle} data-testid="map-scene-temporal-panel">
      <section style={sectionStyle}>
        <div style={headerRowStyle}>
          <div style={{ display: "grid", gap: MAP_SPACING.xs, minWidth: 0 }}>
            <span style={kickerStyle}>Temporal playback</span>
            <h3 style={titleStyle}>{activeLayer.name}</h3>
            <p style={descriptionStyle}>
              {visualization?.title ?? "Playback uses the active temporal layer, preserves frame export references, and keeps missing metadata caveats explicit."}
            </p>
          </div>
          <div style={chipRowStyle}>
            <GisStatusChip
              status={runtimeModeStatus(runtimeMode)}
              label={`Source: ${runtimeMode}`}
              density="compact"
              data-testid="map-scene-temporal-runtime"
            />
            <GisStatusChip
              status={playbackMode === "continuous" ? "ready" : "caveat"}
              label={`Mode: ${formatPlaybackMode(playbackMode)}`}
              density="compact"
              data-testid="map-scene-temporal-mode"
            />
            {prefersReducedMotion ? (
              <GisStatusChip
                status="caveat"
                label="Reduced motion on"
                density="compact"
                data-testid="map-scene-temporal-reduced-motion"
              />
            ) : null}
          </div>
        </div>

        {temporalLayers.length > 1 ? (
          <label style={selectLabelStyle}>
            Temporal layer
            <select
              aria-label="Temporal layer"
              value={activeLayer.id}
              onChange={(event) => onLayerChange?.(event.target.value)}
              style={selectStyle}
              data-testid="map-scene-temporal-layer-select"
            >
              {temporalLayers.map((layer) => (
                <option key={layer.id} value={layer.id}>{layer.name}</option>
              ))}
            </select>
          </label>
        ) : null}

        <div style={metadataGridStyle} data-testid="map-scene-temporal-summary">
          <div style={metadataCellStyle}>
            <span style={metadataKeyStyle}>Frames</span>
            <span style={metadataValueStyle}>
              {temporalFrames.length > 0
                ? `${temporalFrames.length} (${firstFrame?.label ?? firstFrame?.key ?? "—"} to ${lastFrame?.label ?? lastFrame?.key ?? "—"})`
                : "No frames loaded"}
            </span>
          </div>
          <div style={metadataCellStyle}>
            <span style={metadataKeyStyle}>Time field</span>
            <span style={metadataValueStyle}>{timeField ?? "Not recorded"}</span>
          </div>
          <div style={metadataCellStyle}>
            <span style={metadataKeyStyle}>Source fields</span>
            <span style={metadataValueStyle}>{sourceFields.length > 0 ? `${sourceFields.length} field(s)` : "Not profiled"}</span>
          </div>
          <div style={metadataCellStyle}>
            <span style={metadataKeyStyle}>Temporal evidence</span>
            <span style={metadataValueStyle}>{activeLayer.metadata?.temporalEvidence?.temporalEvidenceId ?? temporalEvidenceId}</span>
          </div>
          <div style={metadataCellStyle}>
            <span style={metadataKeyStyle}>CRS</span>
            <span style={metadataValueStyle}>{crsSummary?.crs ?? "Not recorded"}</span>
          </div>
          <div style={metadataCellStyle}>
            <span style={metadataKeyStyle}>Source lineage</span>
            <span style={metadataValueStyle}>{sourceLayerCount > 0 ? `${sourceLayerCount} layer(s)` : "Not recorded"}</span>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <span style={sectionTitleStyle}>Controls</span>
        <TemporalPlayerPanel visible onExportFrame={onExportFrame} />
      </section>

      <section style={sectionStyle}>
        <div style={headerRowStyle}>
          <span style={sectionTitleStyle}>Metadata caveats</span>
          <GisStatusChip
            status={metadataCaveats.length > 0 ? "caveat" : "ready"}
            label={metadataCaveats.length > 0 ? `${metadataCaveats.length} caveat${metadataCaveats.length === 1 ? "" : "s"}` : "Metadata recorded"}
            density="compact"
            data-testid="map-scene-temporal-caveat-chip"
          />
        </div>
        {metadataCaveats.length > 0 ? (
          <ul style={caveatListStyle} data-testid="map-scene-temporal-caveats">
            {metadataCaveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        ) : (
          <p style={descriptionStyle} data-testid="map-scene-temporal-caveats-clear">
            Time field, provenance, and frame export references are present for the current temporal layer.
          </p>
        )}
      </section>
    </div>
  );
};