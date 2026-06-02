import * as React from "react";
import {
  MAP_CHROME_SLOT_KEYS,
  MAP_CHROME_TOKENS,
  GIS_STATUS_KEYS,
  MAP_STATUS_TOKENS,
  MAP_DENSITY,
  MAP_COLORS,
  MAP_MOTION,
  MAP_SHELL_DIMENSIONS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import type { GisStatusKey, GisDensity } from "../mapTokens";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./motion.module.css";

interface GisTokenStatusDemoProps {
  density?: GisDensity;
}

export function GisTokenStatusDemo({
  density = "default",
}: GisTokenStatusDemoProps): React.JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const densityToken = MAP_DENSITY[density];

  return (
    <div
      data-testid="gis-token-status-demo"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{
        display: "grid",
        gap: densityToken.gap,
        padding: densityToken.cellPadding,
        fontFamily: MAP_TYPOGRAPHY.fontFamily,
        fontSize: densityToken.fontSize,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: densityToken.gap }}>
        {GIS_STATUS_KEYS.map((status) => (
          <StatusChip
            key={status}
            status={status}
            density={density}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
      <div
        data-testid="gis-motion-panel-in"
        className={reducedMotion ? undefined : styles.panelIn}
        style={{ fontSize: densityToken.fontSize, color: MAP_COLORS.textMuted }}
      >
        {reducedMotion ? "motion: reduced" : "motion: enabled"}
      </div>
      <TokenGrid testId="gis-density-token-list" entries={Object.entries(MAP_DENSITY)} />
      <TokenGrid testId="gis-shell-token-list" entries={Object.entries(MAP_SHELL_DIMENSIONS)} />
      <TokenGrid
        testId="gis-chrome-token-list"
        entries={MAP_CHROME_SLOT_KEYS.map(
          (slot) => [slot, MAP_CHROME_TOKENS[slot].surface] as const,
        )}
      />
      <TokenGrid testId="gis-motion-token-list" entries={Object.entries(MAP_MOTION.duration)} />
    </div>
  );
}

interface TokenGridProps {
  testId: string;
  entries: readonly (readonly [string, unknown])[];
}

function TokenGrid({ testId, entries }: TokenGridProps): React.JSX.Element {
  return (
    <div
      data-testid={testId}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
        gap: MAP_SPACING.xs,
      }}
    >
      {entries.map(([label, value]) => (
        <span
          key={label}
          style={{
            minWidth: 0,
            color: MAP_COLORS.textSecondary,
            fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
            fontSize: MAP_TYPOGRAPHY.fontSize.xs,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}: {formatTokenPreview(value)}
        </span>
      ))}
    </div>
  );
}

function formatTokenPreview(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "token";
}

interface StatusChipProps {
  status: GisStatusKey;
  density: GisDensity;
  reducedMotion: boolean;
}

function StatusChip({ status, density, reducedMotion }: StatusChipProps): React.JSX.Element {
  const tok = MAP_STATUS_TOKENS[status];
  const densityToken = MAP_DENSITY[density];

  return (
    <span
      data-testid={`status-chip-${status}`}
      data-status={status}
      className={reducedMotion ? undefined : styles.statusFlash}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        height: densityToken.rowHeight,
        padding: densityToken.cellPadding,
        borderRadius: "3px",
        border: `1px solid ${tok.border}`,
        background: tok.bg,
        color: tok.text,
        fontSize: densityToken.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
