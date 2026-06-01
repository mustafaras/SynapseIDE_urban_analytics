/**
 * Prompt 45 — Floating raster layer inspector panel.
 *
 * Shows: metadata summary, band selector, color ramp picker, opacity,
 * ramp legend, histogram, QA status, and caveats.
 *
 * No Tailwind; all styles via mapTokens inline.
 */
import React, { useCallback, useEffect, useRef } from "react";
import { useRasterLayerStore } from "../../../../stores/useRasterLayerStore";
import { MAP_COLORS, MAP_TYPOGRAPHY, resolveMapPaintColor } from "../mapTokens";
import { GisStatusChip } from "../ui/GisStatusChip";
import { GisEmptyState } from "../ui/GisEmptyState";
import { GisProgressBar } from "../ui/GisProgressBar";
import { GisSectionHeader } from "../ui/GisSectionHeader";
import { GisIconButton } from "../ui/GisIconButton";
import { RasterHistogramChart } from "./RasterHistogramChart";
import { RasterLegend, RAMP_OPTIONS } from "./RasterLegend";
import { COLOR_RAMP_STOPS, computeHistogram } from "../../../../services/map/raster/RasterHistogramEngine";
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
  presentation?: "floating" | "embedded";
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

function noDataStatusToChip(noData: number | null | undefined): GisStatusKey {
  return noData !== null && noData !== undefined ? "ready" : "caveat";
}

function crsStatusToChip(epsgCode: string | null | undefined): GisStatusKey {
  return epsgCode ? "ready" : "blocked";
}

function drawRasterEvidencePreview(
  canvas: HTMLCanvasElement,
  rampId: ColorRampId,
  noDataDeclared: boolean,
  validCount: number,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = resolveMapPaintColor(MAP_COLORS.bgWorkspace);
  context.fillRect(0, 0, width, height);

  const gradient = context.createLinearGradient(10, 0, width - 10, 0);
  for (const [pct, color] of COLOR_RAMP_STOPS[rampId]) {
    gradient.addColorStop(Number.parseFloat(pct) / 100, color);
  }

  context.fillStyle = gradient;
  context.fillRect(10, 12, width - 20, height - 38);
  context.strokeStyle = resolveMapPaintColor(MAP_COLORS.hairlineStrong);
  context.lineWidth = 1;
  context.strokeRect(10, 12, width - 20, height - 38);

  if (noDataDeclared) {
    context.save();
    context.strokeStyle = resolveMapPaintColor(MAP_COLORS.textMuted);
    context.setLineDash([4, 4]);
    for (let offset = -height; offset < width; offset += 12) {
      context.beginPath();
      context.moveTo(offset, height - 12);
      context.lineTo(offset + height, 12);
      context.stroke();
    }
    context.restore();
  }

  context.fillStyle = resolveMapPaintColor(noDataDeclared ? MAP_COLORS.textSecondary : MAP_COLORS.caveatText);
  context.font = "11px ui-monospace, SFMono-Regular, Consolas, monospace";
  context.fillText(noDataDeclared ? "noData mask declared" : "noData missing", 12, height - 11);
  context.fillText(`${validCount.toLocaleString()} valid px`, Math.max(12, width - 118), height - 11);
}

/* ------------------------------------------------------------------ */
/*  Panel                                                               */
/* ------------------------------------------------------------------ */

export const RasterLayerPanel: React.FC<RasterLayerPanelProps> = ({
  layerId,
  layerName = "Raster layer",
  visible = true,
  onClose,
  presentation = "floating",
}) => {
  const state = useRasterLayerStore((s) => s.layers[layerId]);
  const updateRenderConfig = useRasterLayerStore((s) => s.updateRenderConfig);
  const updateHistogram = useRasterLayerStore((s) => s.updateHistogram);
  const rasterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewMetadata = state?.inspection?.metadata;
  const previewHistogram = state?.histogram;
  const previewRampId = state?.renderConfig.colorRamp;

  useEffect(() => {
    if (!visible || !rasterCanvasRef.current || !previewMetadata || !previewHistogram || !previewRampId) {
      return;
    }
    drawRasterEvidencePreview(
      rasterCanvasRef.current,
      previewRampId,
      previewMetadata.noData !== null,
      previewHistogram.stats.validCount,
    );
  }, [previewHistogram, previewMetadata, previewRampId, visible]);

  /* Hooks must come before any early returns */
  const handleBandChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value, 10);
      updateRenderConfig(layerId, { selectedBandIndex: idx });
      const insp = state?.inspection;
      if (insp) {
        const bs = insp.bandSamples[idx];
        if (bs) {
          const h = computeHistogram(bs.samples, insp.metadata?.noData ?? null, 32);
          updateHistogram(layerId, h);
        }
      }
    },
    [layerId, state, updateRenderConfig, updateHistogram],
  );

  const handleRampChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateRenderConfig(layerId, { colorRamp: e.target.value as ColorRampId });
    },
    [layerId, updateRenderConfig],
  );

  const handleOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateRenderConfig(layerId, { opacity: parseFloat(e.target.value) });
    },
    [layerId, updateRenderConfig],
  );

  if (!visible) return null;
  if (!state) return null;

  const { inspection, qa, renderConfig, histogram, parsing, parseError } = state;
  const meta = inspection?.metadata;
  const embedded = presentation === "embedded";

  /* ── Styles ── */
  const floatingPanelStyle: React.CSSProperties = {
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
  const embeddedPanelStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    background: MAP_COLORS.bgPanel,
    border: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: 4,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: "12px",
    color: MAP_COLORS.text,
    overflow: "hidden",
  };
  const panelStyle = embedded ? embeddedPanelStyle : floatingPanelStyle;

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

  const stateChipRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  };

  const evidenceCanvasStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "3.4 / 1",
    display: "block",
    border: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: 3,
    background: MAP_COLORS.bgWorkspace,
    marginTop: 8,
  };

  return (
    <div
      style={panelStyle}
      role={embedded ? "region" : "dialog"}
      aria-label="Raster layer panel"
      data-presentation={presentation}
      data-testid="raster-layer-panel"
    >
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
            <div style={stateChipRowStyle} data-testid="raster-state-chips">
              <GisStatusChip
                status={qaStatusToChip(qa?.status)}
                label={`QA ${qa?.status ?? "unknown"}`}
                density="compact"
                data-testid="raster-state-qa-chip"
              />
              <GisStatusChip
                status={crsStatusToChip(meta.epsgCode)}
                label={meta.epsgCode ? `CRS ${meta.epsgCode}` : "CRS missing"}
                density="compact"
                data-testid="raster-state-crs-chip"
              />
              <GisStatusChip
                status={noDataStatusToChip(meta.noData)}
                label={meta.noData !== null ? "noData declared" : "noData missing"}
                density="compact"
                data-testid="raster-state-nodata-chip"
              />
              <GisStatusChip
                status={meta.sampled ? "caveat" : "ready"}
                label={meta.sampled ? "sampled stats" : "full stats"}
                density="compact"
                data-testid="raster-state-sampling-chip"
              />
            </div>
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
            <canvas
              ref={rasterCanvasRef}
              width={480}
              height={142}
              style={evidenceCanvasStyle}
              data-testid="raster-evidence-canvas"
              aria-label="Raster evidence preview canvas"
            />
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
