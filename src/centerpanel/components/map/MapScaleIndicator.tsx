/**
 * MapScaleIndicator — premium, dock-aware scale cluster for the Map Explorer
 * canvas. Renders bottom-centred (between the active left/right docks) above
 * the status bar, with a ticked metric bar, a secondary alternate-unit bar and
 * a representative-fraction chip.
 *
 * Non-interactive by design (`pointer-events: none`) so it never intercepts map
 * panning. Reads viewport state directly from the Map Explorer store via
 * fine-grained selectors — no prop drilling.
 */
import React, { useMemo } from "react";

import { useMapExplorerStore } from "../../../stores/useMapExplorerStore";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";

const EARTH_CIRCUMFERENCE_M = 40_075_016.686;
/** CSS reference pixel ≈ 0.26458 mm → 3779.5275 px per ground-metre on screen. */
const SCREEN_PX_PER_METRE = 3779.527_559_055;
const TARGET_PX = 116;

const NICE_METRIC = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000,
  100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
];
/** In feet (1 mi = 5280 ft). */
const NICE_IMPERIAL = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5280, 10_560, 26_400, 52_800,
  105_600, 264_000, 528_000, 1_056_000, 2_640_000, 5_280_000,
];

function metresPerPixel(latitude: number, zoom: number): number {
  return (
    (EARTH_CIRCUMFERENCE_M * Math.cos((latitude * Math.PI) / 180)) /
    Math.pow(2, zoom + 8)
  );
}

function pickNice(
  mPerPx: number,
  targetPx: number,
  table: readonly number[],
  unitToMetres: number,
): { value: number; widthPx: number } {
  const targetM = mPerPx * targetPx;
  let best = table[0] ?? 1;
  for (const candidate of table) {
    if (candidate * unitToMetres <= targetM) best = candidate;
    else break;
  }
  return { value: best, widthPx: (best * unitToMetres) / mPerPx };
}

function formatMetric(metres: number): string {
  return metres >= 1000 ? `${metres / 1000} km` : `${metres} m`;
}

function formatImperial(feet: number): string {
  if (feet >= 5280) return `${(feet / 5280).toFixed(feet >= 10_560 ? 0 : 1)} mi`;
  return `${feet} ft`;
}

function formatRatio(denominator: number): string {
  if (!Number.isFinite(denominator) || denominator <= 0) return "1 : —";
  const rounded =
    denominator >= 1_000_000
      ? Math.round(denominator / 100_000) * 100_000
      : denominator >= 100_000
        ? Math.round(denominator / 10_000) * 10_000
        : denominator >= 10_000
          ? Math.round(denominator / 1000) * 1000
          : denominator >= 1000
            ? Math.round(denominator / 100) * 100
            : Math.round(denominator / 10) * 10;
  return `1 : ${rounded.toLocaleString()}`;
}

export interface MapScaleIndicatorProps {
  /** When false the cluster is not rendered. */
  visible?: boolean;
}

const wrapperStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(var(--map-status-h, 1.75rem) + 0.5rem)",
  left: "calc((var(--map-dock-left, 0px) + 100% - var(--map-dock-right, 0px)) / 2)",
  transform: "translateX(-50%)",
  zIndex: MAP_Z_INDEX.mapFurniture,
  pointerEvents: "none",
  userSelect: "none",
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  padding: "5px 9px",
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148,163,184,0.34)) 100%, transparent)",
  background: "color-mix(in srgb, var(--syn-surface-panel, rgba(12,16,24,0.82)) 78%, transparent)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
};

const barColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  justifyItems: "center",
};

const ratioChipStyle: React.CSSProperties = {
  alignSelf: "center",
  padding: "2px 7px",
  borderRadius: MAP_RADIUS.xs,
  border: "1px solid var(--syn-border-subtle, rgba(148,163,184,0.28))",
  background: "color-mix(in srgb, var(--syn-surface-raised, rgba(30,38,52,0.6)) 70%, transparent)",
  color: MAP_COLORS.textSecondary,
  fontSize: 10,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
};

function ScaleBarRow({
  widthPx,
  label,
  accent,
}: {
  widthPx: number;
  label: string;
  accent: boolean;
}): React.ReactElement {
  const clamped = Math.max(28, Math.min(widthPx, 240));
  const tick = accent ? 6 : 4;
  const lineColor = accent
    ? "var(--syn-accent, rgba(245,166,35,0.92))"
    : MAP_COLORS.textMuted;
  return (
    <div style={barColumnStyle}>
      <span
        style={{
          fontSize: accent ? 11 : 9.5,
          fontWeight: accent
            ? MAP_TYPOGRAPHY.fontWeight.semibold
            : MAP_TYPOGRAPHY.fontWeight.medium,
          color: accent ? MAP_COLORS.text : MAP_COLORS.textMuted,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          display: "block",
          width: clamped,
          height: tick,
          borderLeft: `2px solid ${lineColor}`,
          borderRight: `2px solid ${lineColor}`,
          borderBottom: `2px solid ${lineColor}`,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export function MapScaleIndicator({
  visible = true,
}: MapScaleIndicatorProps): React.ReactElement | null {
  const zoom = useMapExplorerStore((state) => state.zoom);
  const latitude = useMapExplorerStore((state) => state.center[1]);
  const measureUnit = useMapExplorerStore((state) => state.measureUnit);

  const model = useMemo(() => {
    const mPerPx = metresPerPixel(latitude, zoom);
    const metric = pickNice(mPerPx, TARGET_PX, NICE_METRIC, 1);
    const imperial = pickNice(mPerPx, TARGET_PX, NICE_IMPERIAL, 0.3048);
    const denominator = mPerPx * SCREEN_PX_PER_METRE;
    return {
      metric: { ...metric, label: formatMetric(metric.value) },
      imperial: { ...imperial, label: formatImperial(imperial.value) },
      ratio: formatRatio(denominator),
    };
  }, [latitude, zoom]);

  if (!visible) return null;

  const metricPrimary = measureUnit !== "imperial";
  const primary = metricPrimary ? model.metric : model.imperial;
  const secondary = metricPrimary ? model.imperial : model.metric;

  return (
    <div
      style={wrapperStyle}
      role="img"
      aria-label={`Map scale ${primary.label}, representative fraction ${model.ratio}`}
      data-map-furniture="scale"
      data-map-safe-inset-consumer="scale-indicator"
    >
      <ScaleBarRow widthPx={primary.widthPx} label={primary.label} accent />
      <ScaleBarRow widthPx={secondary.widthPx} label={secondary.label} accent={false} />
      <span style={ratioChipStyle}>{model.ratio}</span>
    </div>
  );
}

export default MapScaleIndicator;
