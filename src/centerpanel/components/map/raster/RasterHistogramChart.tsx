/**
 * Prompt 45 — Inline SVG bar-chart histogram for a raster band.
 * No external charting library — lightweight, no bundle impact.
 */
import React from "react";
import { MAP_COLORS, MAP_TYPOGRAPHY } from "../mapTokens";
import type { BandHistogramResult } from "../../../../services/map/raster/RasterHistogramEngine";

export interface RasterHistogramChartProps {
  histogram: BandHistogramResult;
  /** Height of the chart in pixels (default 72). */
  chartHeight?: number;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

const CHART_PADDING = { top: 4, right: 4, bottom: 20, left: 8 };

export const RasterHistogramChart: React.FC<RasterHistogramChartProps> = ({
  histogram,
  chartHeight = 72,
  style,
  "data-testid": testId = "raster-histogram",
}) => {
  const { bins, stats } = histogram;

  if (bins.length === 0 || stats.validCount === 0) {
    return (
      <div
        data-testid={testId}
        style={{
          height: chartHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: MAP_COLORS.textMuted,
          fontSize: "11px",
          fontFamily: MAP_TYPOGRAPHY.fontFamily,
          ...style,
        }}
      >
        No valid pixels
      </div>
    );
  }

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const svgWidth = 280;
  const innerWidth = svgWidth - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = chartHeight - CHART_PADDING.top - CHART_PADDING.bottom;
  const barWidth = innerWidth / bins.length;

  const formatVal = (v: number): string => {
    if (Math.abs(v) >= 1000) return v.toFixed(0);
    if (Math.abs(v) >= 1) return v.toFixed(2);
    return v.toExponential(2);
  };

  return (
    <div data-testid={testId} style={{ ...style }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${chartHeight}`}
        width="100%"
        height={chartHeight}
        aria-label="Raster band histogram"
        role="img"
      >
        {/* Bars */}
        {bins.map((bin, i) => {
          const barH = (bin.count / maxCount) * innerHeight;
          const x = CHART_PADDING.left + i * barWidth;
          const y = CHART_PADDING.top + (innerHeight - barH);
          return (
            <rect
              key={i}
              x={x + 0.5}
              y={y}
              width={Math.max(barWidth - 1, 0.5)}
              height={barH}
              fill={MAP_COLORS.interaction}
              opacity={0.75}
              data-testid={`histogram-bar-${i}`}
            />
          );
        })}

        {/* X-axis labels: min and max */}
        <text
          x={CHART_PADDING.left}
          y={chartHeight - 4}
          fontSize="9"
          fill={MAP_COLORS.textMuted}
          fontFamily={MAP_TYPOGRAPHY.fontFamilyMono}
          textAnchor="start"
          data-testid="histogram-label-min"
        >
          {formatVal(stats.min)}
        </text>
        <text
          x={svgWidth - CHART_PADDING.right}
          y={chartHeight - 4}
          fontSize="9"
          fill={MAP_COLORS.textMuted}
          fontFamily={MAP_TYPOGRAPHY.fontFamilyMono}
          textAnchor="end"
          data-testid="histogram-label-max"
        >
          {formatVal(stats.max)}
        </text>

        {/* Baseline */}
        <line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top + innerHeight}
          x2={svgWidth - CHART_PADDING.right}
          y2={CHART_PADDING.top + innerHeight}
          stroke={MAP_COLORS.hairline}
          strokeWidth={1}
        />
      </svg>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          fontSize: "10px",
          fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
          color: MAP_COLORS.textSecondary,
          marginTop: 2,
        }}
      >
        <span data-testid="histogram-stat-min">min {formatVal(stats.min)}</span>
        <span data-testid="histogram-stat-mean">μ {formatVal(stats.mean)}</span>
        <span data-testid="histogram-stat-max">max {formatVal(stats.max)}</span>
        {stats.noDataCount > 0 && (
          <span data-testid="histogram-stat-nodata" style={{ color: MAP_COLORS.caveatText }}>
            {stats.noDataCount.toLocaleString()} noData
          </span>
        )}
      </div>
    </div>
  );
};

export default RasterHistogramChart;
