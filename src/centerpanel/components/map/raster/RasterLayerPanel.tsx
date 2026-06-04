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

function formatInteger(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatStatValue(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Math.abs(value) >= 10) return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function formatFileSize(sizeBytes: number | undefined): string {
  if (sizeBytes === undefined) return "size unknown";
  if (sizeBytes < 1024) return `${sizeBytes.toLocaleString()} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`;
  return `${(sizeBytes / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
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
  const selectedBand = meta?.bands.find((band) => band.index === renderConfig.selectedBandIndex) ?? meta?.bands[0];
  const selectedBandSample = inspection?.bandSamples.find((band) => band.bandIndex === renderConfig.selectedBandIndex)
    ?? inspection?.bandSamples[0];
  const totalPixelCount = meta ? meta.width * meta.height : 0;
  const sampledPixelCount = meta ? meta.sampleWidth * meta.sampleHeight : 0;
  const sampleModeLabel = meta?.sampled ? "sampled stats only" : "full stats";
  const sampleWindowLabel = meta
    ? meta.sampled
      ? `${formatInteger(sampledPixelCount)} sampled px of ${formatInteger(totalPixelCount)}`
      : `${formatInteger(sampledPixelCount)} px full extent`
    : "not loaded";
  const noDataValue = meta?.noData;
  const noDataDeclared = noDataValue !== null && noDataValue !== undefined;
  const noDataLabel = noDataDeclared ? `noData ${formatStatValue(noDataValue)}` : "noData missing";
  const noDataStateLabel = noDataDeclared ? "noData declared" : "noData missing";
  const crsLabel = meta?.epsgCode ? `CRS ${meta.epsgCode}` : "CRS missing";
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

  const evidenceSummaryStyle: React.CSSProperties = {
    marginTop: 8,
    padding: 8,
    border: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: 4,
    background: MAP_COLORS.bgWorkspace,
  };

  const factGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "88px minmax(0, 1fr)",
    gap: "4px 10px",
    fontSize: "11px",
    lineHeight: 1.35,
  };

  const factLabelStyle: React.CSSProperties = {
    color: MAP_COLORS.textMuted,
    minWidth: 0,
  };

  const factValueStyle: React.CSSProperties = {
    color: MAP_COLORS.text,
    minWidth: 0,
    overflowWrap: "anywhere",
  };

  const caveatNoteStyle: React.CSSProperties = {
    marginTop: 8,
    padding: "6px 8px",
    border: `1px solid ${MAP_COLORS.caveatText}`,
    borderRadius: 4,
    background: MAP_COLORS.caveat,
    color: MAP_COLORS.caveatText,
    fontSize: "10px",
    lineHeight: 1.45,
  };

  const bandListStyle: React.CSSProperties = {
    display: "grid",
    gap: 6,
    maxHeight: 130,
    overflowY: "auto",
    marginTop: 8,
  };

  const bandRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 8,
    alignItems: "center",
    padding: "6px 8px",
    border: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: 4,
    background: MAP_COLORS.bgWorkspace,
  };

  const visualContextStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
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

        {/* Source and evidence summary */}
        {meta && (
          <div style={sectionGap}>
            <GisSectionHeader title="Raster evidence" level={4} />
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
                label={noDataStateLabel}
                density="compact"
                data-testid="raster-state-nodata-chip"
              />
              <GisStatusChip
                status={meta.sampled ? "caveat" : "ready"}
                label={sampleModeLabel}
                density="compact"
                data-testid="raster-state-sampling-chip"
              />
            </div>
            <div style={evidenceSummaryStyle} data-testid="raster-source-summary">
              <div style={factGridStyle}>
                <span style={factLabelStyle}>Source</span>
                <span style={factValueStyle} data-testid="raster-source-format">
                  GeoTIFF · {formatFileSize(meta.sizeBytes)}
                </span>
                <span style={factLabelStyle}>Footprint</span>
                <span style={factValueStyle} data-testid="raster-meta-dimensions">
                  {meta.width} × {meta.height} px · {formatInteger(totalPixelCount)} cells
                </span>
                <span style={factLabelStyle}>Sampling</span>
                <span style={factValueStyle} data-testid="raster-meta-sampling">
                  {sampleWindowLabel}
                </span>
                <span style={factLabelStyle}>Bands</span>
                <span style={factValueStyle} data-testid="raster-meta-bands">
                  {meta.bandCount} · active {selectedBand?.label ?? `Band ${renderConfig.selectedBandIndex + 1}`}
                </span>
                <span style={factLabelStyle}>CRS</span>
                <span style={factValueStyle} data-testid="raster-meta-crs">
                {meta.epsgCode ?? (
                  <span style={{ color: MAP_COLORS.caveatText }}>not declared</span>
                )}
                </span>
                <span style={factLabelStyle}>noData</span>
                <span style={factValueStyle} data-testid="raster-meta-nodata">
                {meta.noData !== null ? String(meta.noData) : (
                  <span style={{ color: MAP_COLORS.caveatText }}>not declared</span>
                )}
                </span>
              </div>
            </div>
            {meta.sampled && (
              <div style={caveatNoteStyle} data-testid="raster-sample-caveat">
                Statistics and histogram are based on a bounded sample. Full-resolution raster analytics are not claimed here.
              </div>
            )}
          </div>
        )}

        {/* Band metadata */}
        {meta && (
          <div style={sectionGap}>
            <GisSectionHeader title="Band metadata" level={4} />
            <div style={bandListStyle} data-testid="raster-band-metadata">
              {meta.bands.map((band) => {
                const sample = inspection?.bandSamples.find((entry) => entry.bandIndex === band.index);
                const isActive = band.index === renderConfig.selectedBandIndex;
                return (
                  <div
                    key={band.index}
                    style={{
                      ...bandRowStyle,
                      borderColor: isActive ? MAP_COLORS.interaction : MAP_COLORS.hairline,
                    }}
                    data-testid={`raster-band-row-${band.index}`}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>
                        {band.label}{isActive ? " · active" : ""}
                      </span>
                      <span style={{ display: "block", color: MAP_COLORS.textMuted, fontSize: "10px" }}>
                        {band.dtype} · index {band.index + 1}
                      </span>
                    </span>
                    <span style={{ textAlign: "right", color: MAP_COLORS.textSecondary, fontSize: "10px" }}>
                      {sample
                        ? `${formatInteger(sample.stats.validCount)} valid · ${formatInteger(sample.stats.noDataCount)} noData`
                        : "not sampled"}
                    </span>
                  </div>
                );
              })}
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
            <div style={visualContextStyle} data-testid="raster-legend-caveat-chips">
              <GisStatusChip
                status={crsStatusToChip(meta.epsgCode)}
                label={crsLabel}
                density="compact"
                data-testid="raster-legend-crs-chip"
              />
              <GisStatusChip
                status={noDataStatusToChip(meta.noData)}
                label={noDataStateLabel}
                density="compact"
                data-testid="raster-legend-nodata-status-chip"
              />
              <GisStatusChip
                status={meta.sampled ? "caveat" : "ready"}
                label={sampleModeLabel}
                density="compact"
                data-testid="raster-legend-sampling-chip"
              />
            </div>
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
            {meta && (
              <div style={visualContextStyle} data-testid="raster-chart-caveat-chips">
                <GisStatusChip
                  status={crsStatusToChip(meta.epsgCode)}
                  label={crsLabel}
                  density="compact"
                  data-testid="raster-chart-crs-chip"
                />
                <GisStatusChip
                  status={noDataStatusToChip(meta.noData)}
                  label={meta.noData !== null ? noDataLabel : "noData missing"}
                  density="compact"
                  data-testid="raster-chart-nodata-chip"
                />
                <GisStatusChip
                  status={meta.sampled ? "caveat" : "ready"}
                  label={sampleModeLabel}
                  density="compact"
                  data-testid="raster-chart-sampling-chip"
                />
              </div>
            )}
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
              {meta?.sampled ? "sampled evidence" : "full extent evidence"} · {histogram.sampledCount.toLocaleString()} valid px
              {histogram.stats.noDataCount > 0 ? ` · ${histogram.stats.noDataCount.toLocaleString()} noData px excluded` : ""}
            </div>
          </div>
        )}

        {/* Evidence references */}
        {meta && (
          <div style={sectionGap}>
            <GisSectionHeader title="Evidence references" level={4} />
            <div style={evidenceSummaryStyle} data-testid="raster-evidence-references">
              <div style={factGridStyle}>
                <span style={factLabelStyle}>Layer</span>
                <span style={factValueStyle} data-testid="raster-evidence-layer-id">{layerId}</span>
                <span style={factLabelStyle}>QA signature</span>
                <span style={factValueStyle} data-testid="raster-evidence-qa-signature">
                  {qa?.signature ?? "not checked"}
                </span>
                <span style={factLabelStyle}>Sample window</span>
                <span style={factValueStyle} data-testid="raster-evidence-sample-window">
                  {meta.sampleWidth} × {meta.sampleHeight} · {sampleModeLabel}
                </span>
                <span style={factLabelStyle}>Active band</span>
                <span style={factValueStyle} data-testid="raster-evidence-active-band">
                  {selectedBand?.label ?? "Band 1"}{selectedBandSample ? ` · mean ${formatStatValue(selectedBandSample.stats.mean)}` : ""}
                </span>
              </div>
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
