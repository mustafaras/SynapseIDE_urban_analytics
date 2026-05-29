/**
 * Prompt 45 — Floating raster layer inspector panel.
 *
 * Shows: metadata summary, band selector, color ramp picker, opacity,
 * ramp legend, histogram, QA status, and caveats.
 *
 * No Tailwind; all styles via mapTokens inline.
 */
import React, { useCallback } from "react";
import { useRasterLayerStore } from "../../../../stores/useRasterLayerStore";
import { MAP_COLORS, MAP_STATUS_TOKENS, MAP_TYPOGRAPHY } from "../mapTokens";
import { GisStatusChip } from "../ui/GisStatusChip";
import { GisEmptyState } from "../ui/GisEmptyState";
import { GisProgressBar } from "../ui/GisProgressBar";
import { GisSectionHeader } from "../ui/GisSectionHeader";
import { GisIconButton } from "../ui/GisIconButton";
import { RasterHistogramChart } from "./RasterHistogramChart";
import { RasterLegend, RAMP_OPTIONS } from "./RasterLegend";
import { computeHistogram } from "../../../../services/map/raster/RasterHistogramEngine";
import type { ColorRampId } from "../../../../services/map/raster/RasterHistogramEngine";
import type { GisStatusKey } from "../mapTokens";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface RasterLayerPanelProps {
  layerId: string;
  layerName?: string;
  visible?: boolean;
  onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  QA status → chip key                                                */
/* ------------------------------------------------------------------ */

function qaStatusToChip(status: string | undefined): GisStatusKey {
  if (status === "passed") return "ready";
  if (status === "warning") return "caveat";
  if (status === "failed") return "blocked";
  return "unknown";
}

/* ------------------------------------------------------------------ */
/*  Panel                                                               */
/* ------------------------------------------------------------------ */

export const RasterLayerPanel: React.FC<RasterLayerPanelProps> = ({
  layerId,
  layerName = "Raster layer",
  visible = true,
  onClose,
}) => {
  const state = useRasterLayerStore((s) => s.layers[layerId]);
  const updateRenderConfig = useRasterLayerStore((s) => s.updateRenderConfig);
  const updateHistogram = useRasterLayerStore((s) => s.updateHistogram);

  if (!visible) return null;
  if (!state) return null;

  const { inspection, qa, renderConfig, histogram, parsing, parseError } = state;
  const meta = inspection?.metadata;

  /* Band selector handler */
  const handleBandChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value, 10);
      updateRenderConfig(layerId, { selectedBandIndex: idx });

      // Recompute histogram for the newly selected band
      if (inspection) {
        const bs = inspection.bandSamples[idx];
        if (bs) {
          const h = computeHistogram(bs.samples, meta?.noData ?? null, 32);
          updateHistogram(layerId, h);
        }
      }
    },
    [layerId, inspection, meta, updateRenderConfig, updateHistogram],
  );

  /* Color ramp handler */
  const handleRampChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateRenderConfig(layerId, { colorRamp: e.target.value as ColorRampId });
    },
    [layerId, updateRenderConfig],
  );

  /* Opacity handler */
  const handleOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateRenderConfig(layerId, { opacity: parseFloat(e.target.value) });
    },
    [layerId, updateRenderConfig],
  );

  /* ── Styles ── */
  const panelStyle: React.CSSProperties = {
    position: "absolute",
    right: 8,
    top: 60,
    width: 300,
    background: MAP_COLORS.bgPanel,
    border: `1px solid ${MAP_COLORS.hairlineStrong}`,
    borderRadius: 4,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: "12px",
    color: MAP_COLORS.text,
    zIndex: 30,
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    background: MAP_COLORS.bgHeader,
    borderBottom: `1px solid ${MAP_COLORS.hairline}`,
  };

  const bodyStyle: React.CSSProperties = {
    padding: "10px",
    maxHeight: 520,
    overflowY: "auto",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: MAP_COLORS.textSecondary,
    minWidth: 70,
  };

  const selectStyle: React.CSSProperties = {
    flex: 1,
    background: MAP_COLORS.bg,
    border: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: 3,
    color: MAP_COLORS.text,
    fontSize: "11px",
    padding: "2px 6px",
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
  };

  const sectionGap: React.CSSProperties = { marginBottom: 12 };

  return (
    <div style={panelStyle} data-testid="raster-layer-panel">
      {/* Header */}
      <div style={headerStyle}>
        <span
          style={{ fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold, fontSize: "12px" }}
          data-testid="raster-panel-title"
        >
          {layerName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <GisStatusChip
            status={qaStatusToChip(qa?.status)}
            label={qa?.status ?? "unknown"}
            density="compact"
            data-testid="raster-qa-status-chip"
          />
          {onClose && (
            <GisIconButton
              label="Close raster panel"
              icon={<span aria-hidden>✕</span>}
              onClick={onClose}
              data-testid="raster-panel-close"
            />
          )}
        </div>
      </div>

      <div style={bodyStyle}>
        {/* Parsing state */}
        {parsing && (
          <div style={{ marginBottom: 10 }}>
            <GisProgressBar
              value={undefined}
              label="Parsing GeoTIFF…"
              data-testid="raster-parse-progress"
            />
            <div style={{ fontSize: "11px", color: MAP_COLORS.textMuted, marginTop: 4 }}>
              Parsing GeoTIFF…
            </div>
          </div>
        )}

        {/* Parse error */}
        {parseError && !parsing && (
          <GisEmptyState
            title="Parse error"
            description={parseError}
            data-testid="raster-parse-error"
          />
        )}

        {/* Not yet loaded */}
        {!inspection && !parsing && !parseError && (
          <GisEmptyState
            title="Not loaded"
            description="Load a GeoTIFF file to inspect band statistics."
            data-testid="raster-not-loaded"
          />
        )}

        {/* Metadata summary */}
        {meta && (
          <div style={sectionGap}>
            <GisSectionHeader title="Metadata" level={4} />
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 8px", fontSize: "11px", marginTop: 6 }}>
              <span style={{ color: MAP_COLORS.textMuted }}>Dimensions</span>
              <span data-testid="raster-meta-dimensions">{meta.width} × {meta.height} px</span>
              <span style={{ color: MAP_COLORS.textMuted }}>Bands</span>
              <span data-testid="raster-meta-bands">{meta.bandCount}</span>
              <span style={{ color: MAP_COLORS.textMuted }}>CRS</span>
              <span data-testid="raster-meta-crs">
                {meta.epsgCode ?? (
                  <span style={{ color: MAP_COLORS.caveatText }}>not declared</span>
                )}
              </span>
              <span style={{ color: MAP_COLORS.textMuted }}>noData</span>
              <span data-testid="raster-meta-nodata">
                {meta.noData !== null ? String(meta.noData) : (
                  <span style={{ color: MAP_COLORS.caveatText }}>not declared</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Render config */}
        {meta && (
          <div style={sectionGap}>
            <GisSectionHeader title="Display" level={4} />

            {/* Band selector */}
            {meta.bandCount > 1 && (
              <div style={{ ...rowStyle, marginTop: 8 }}>
                <span style={labelStyle}>Band</span>
                <select
                  style={selectStyle}
                  value={renderConfig.selectedBandIndex}
                  onChange={handleBandChange}
                  data-testid="raster-band-select"
                >
                  {meta.bands.map((b) => (
                    <option key={b.index} value={b.index}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Color ramp */}
            <div style={rowStyle}>
              <span style={labelStyle}>Color ramp</span>
              <select
                style={selectStyle}
                value={renderConfig.colorRamp}
                onChange={handleRampChange}
                data-testid="raster-ramp-select"
              >
                {RAMP_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Opacity */}
            <div style={rowStyle}>
              <span style={labelStyle}>Opacity</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={renderConfig.opacity}
                onChange={handleOpacityChange}
                data-testid="raster-opacity-slider"
                style={{ flex: 1 }}
              />
              <span
                style={{ width: 32, textAlign: "right", fontSize: "11px", color: MAP_COLORS.textMuted }}
                data-testid="raster-opacity-value"
              >
                {Math.round(renderConfig.opacity * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        {meta && histogram && (
          <div style={sectionGap}>
            <GisSectionHeader title="Legend" level={4} />
            <RasterLegend
              rampId={renderConfig.colorRamp}
              stats={histogram.stats}
              noData={meta.noData}
              style={{ marginTop: 8 }}
              data-testid="raster-legend"
            />
          </div>
        )}

        {/* Histogram */}
        {histogram && (
          <div style={sectionGap}>
            <GisSectionHeader title="Histogram" level={4} />
            <RasterHistogramChart
              histogram={histogram}
              chartHeight={80}
              style={{ marginTop: 6 }}
              data-testid="raster-histogram"
            />
            <div
              style={{ fontSize: "10px", color: MAP_COLORS.textMuted, marginTop: 4 }}
              data-testid="raster-histogram-sample-count"
            >
              {meta?.sampled ? "sampled" : "full"} · {histogram.sampledCount.toLocaleString()} valid px
            </div>
          </div>
        )}

        {/* QA caveats */}
        {qa && qa.caveats.length > 0 && (
          <div style={sectionGap}>
            <GisSectionHeader title="QA" level={4} />
            <ul
              style={{
                margin: "6px 0 0",
                padding: "0 0 0 14px",
                fontSize: "10px",
                color: MAP_COLORS.caveatText,
                lineHeight: 1.5,
              }}
              data-testid="raster-qa-caveats"
            >
              {qa.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Parse caveats */}
        {inspection && inspection.caveats.length > 0 && (
          <div style={sectionGap}>
            <ul
              style={{
                margin: "4px 0 0",
                padding: "0 0 0 14px",
                fontSize: "10px",
                color: MAP_COLORS.textMuted,
                lineHeight: 1.5,
              }}
              data-testid="raster-parse-caveats"
            >
              {inspection.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RasterLayerPanel;
