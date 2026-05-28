/**
 * Prompt 45 — Color ramp legend + noData swatch for a raster band.
 */
import React from "react";
import { MAP_COLORS, MAP_TYPOGRAPHY } from "../mapTokens";
import {
  buildRampGradient,
  type ColorRampId,
  COLOR_RAMP_STOPS,
} from "../../../../services/map/raster/RasterHistogramEngine";
import type { RasterBandStats } from "../../../../services/map/raster/RasterHistogramEngine";

export interface RasterLegendProps {
  rampId: ColorRampId;
  stats: RasterBandStats;
  noData: number | null;
  /** Override min for the ramp mapping. */
  minOverride?: number | null;
  /** Override max for the ramp mapping. */
  maxOverride?: number | null;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

const RAMP_HEIGHT = 12;
const RAMP_WIDTH = "100%";

const formatVal = (v: number): string => {
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toExponential(2);
};

export const RasterLegend: React.FC<RasterLegendProps> = ({
  rampId,
  stats,
  noData,
  minOverride,
  maxOverride,
  style,
  "data-testid": testId = "raster-legend",
}) => {
  const displayMin = minOverride ?? stats.min;
  const displayMax = maxOverride ?? stats.max;
  const gradient = buildRampGradient(rampId);

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
    color: MAP_COLORS.textSecondary,
  };

  return (
    <div data-testid={testId} style={{ ...style }}>
      {/* Gradient ramp */}
      <div
        data-testid="raster-legend-ramp"
        style={{
          height: RAMP_HEIGHT,
          width: RAMP_WIDTH,
          background: gradient,
          borderRadius: 2,
          border: `1px solid ${MAP_COLORS.hairline}`,
        }}
        aria-label={`Color ramp: ${rampId}`}
      />

      {/* Min / Max labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={labelStyle} data-testid="raster-legend-min">
          {formatVal(displayMin)}
        </span>
        <span
          style={{ ...labelStyle, color: MAP_COLORS.textMuted, fontSize: "9px" }}
          data-testid="raster-legend-ramp-label"
        >
          {rampId}
        </span>
        <span style={labelStyle} data-testid="raster-legend-max">
          {formatVal(displayMax)}
        </span>
      </div>

      {/* noData swatch */}
      {noData !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 5,
          }}
          data-testid="raster-legend-nodata-row"
        >
          <div
            data-testid="raster-legend-nodata-swatch"
            style={{
              width: 12,
              height: 12,
              background: "transparent",
              border: `1px dashed ${MAP_COLORS.hairlineStrong}`,
              borderRadius: 2,
              flexShrink: 0,
            }}
            aria-label="noData"
          />
          <span
            style={{ ...labelStyle, color: MAP_COLORS.textMuted }}
            data-testid="raster-legend-nodata-label"
          >
            noData = {formatVal(noData)}
          </span>
        </div>
      )}

      {/* noData caveat when undeclared */}
      {noData === null && (
        <div
          style={{
            marginTop: 5,
            fontSize: "10px",
            fontFamily: MAP_TYPOGRAPHY.fontFamily,
            color: MAP_COLORS.caveatText,
          }}
          data-testid="raster-legend-nodata-caveat"
        >
          noData not declared
        </div>
      )}
    </div>
  );
};

export const RAMP_OPTIONS: Array<{ id: ColorRampId; label: string }> = (
  Object.keys(COLOR_RAMP_STOPS) as ColorRampId[]
).map((id) => ({ id, label: id }));

export default RasterLegend;
