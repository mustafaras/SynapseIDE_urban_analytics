import * as React from "react";
import {
  GIS_STATUS_KEYS,
  MAP_STATUS_TOKENS,
  MAP_DENSITY,
  MAP_COLORS,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import type { GisStatusKey, GisDensity } from "../mapTokens";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./motion.module.css";

interface GisTokenStatusDemoProps {
  density?: GisDensity;
}

export function GisTokenStatusDemo({ density = "default" }: GisTokenStatusDemoProps): React.JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const d = MAP_DENSITY[density];

  return (
    <div
      data-testid="gis-token-status-demo"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: d.gap,
        padding: d.cellPadding,
        fontFamily: MAP_TYPOGRAPHY.fontFamily,
        fontSize: d.fontSize,
      }}
    >
      {GIS_STATUS_KEYS.map((status) => (
        <StatusChip key={status} status={status} density={density} reducedMotion={reducedMotion} />
      ))}
      <div
        data-testid="gis-motion-panel-in"
        className={reducedMotion ? undefined : styles.panelIn}
        style={{ fontSize: d.fontSize, color: MAP_COLORS.textMuted }}
      >
        {reducedMotion ? "motion: reduced" : "motion: enabled"}
      </div>
    </div>
  );
}

interface StatusChipProps {
  status: GisStatusKey;
  density: GisDensity;
  reducedMotion: boolean;
}

function StatusChip({ status, density, reducedMotion }: StatusChipProps): React.JSX.Element {
  const tok = MAP_STATUS_TOKENS[status];
  const d = MAP_DENSITY[density];

  return (
    <span
      data-testid={`status-chip-${status}`}
      data-status={status}
      className={reducedMotion ? undefined : styles.statusFlash}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        height: d.rowHeight,
        padding: d.cellPadding,
        borderRadius: "3px",
        border: `1px solid ${tok.border}`,
        background: tok.bg,
        color: tok.text,
        fontSize: d.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
