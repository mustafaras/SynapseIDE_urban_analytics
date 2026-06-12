import React, { Suspense, useMemo } from "react";
import { Database, X } from "lucide-react";
import type { FeatureCollection } from "geojson";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { GisIconButton } from "../ui";
import motionStyles from "../design/motion.module.css";
import type { OverlayLayerConfig } from "../mapTypes";
import type { SqlWorkspaceLayerInput } from "./SqlWorkspaceBody";

// monaco + duckdb-wasm live behind this boundary; keep them off the boot path
const LazySqlWorkspaceBody = React.lazy(() => import("./SqlWorkspaceBody"));

export interface MapSqlWorkspacePanelProps {
  visible: boolean;
  overlayLayers: readonly OverlayLayerConfig[];
  onSendToMap: (geojson: FeatureCollection) => void;
  onClose: () => void;
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: MAP_SPACING.md,
  right: MAP_SPACING.md,
  width: "min(46rem, calc(100% - 2rem))",
  height: "min(40rem, calc(100% - 2rem))",
  zIndex: MAP_Z_INDEX.symbologyPanel + 14,
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const fallbackStyle: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
};

function isFeatureCollection(data: OverlayLayerConfig["sourceData"]): data is FeatureCollection {
  return typeof data === "object" && data !== null && (data as { type?: string }).type === "FeatureCollection";
}

export function MapSqlWorkspacePanel({ visible, overlayLayers, onSendToMap, onClose }: MapSqlWorkspacePanelProps): React.ReactElement | null {
  const sqlLayers = useMemo<SqlWorkspaceLayerInput[]>(
    () => overlayLayers
      .filter((layer) => layer.type === "geojson" && isFeatureCollection(layer.sourceData))
      .map((layer) => ({ id: layer.id, name: layer.name, data: layer.sourceData as FeatureCollection })),
    [overlayLayers],
  );

  if (!visible) return null;

  return (
    <section
      style={panelStyle}
      className={motionStyles.panelIn}
      role="dialog"
      aria-label="SQL workspace"
      data-testid="map-sql-workspace-panel"
    >
      <header style={headerStyle}>
        <h2 style={titleStyle}>
          <Database size={16} aria-hidden /> SQL workspace (DuckDB)
        </h2>
        <GisIconButton label="Close SQL workspace" icon={<X size={16} aria-hidden />} onClick={onClose} size="md" />
      </header>
      <Suspense fallback={<div style={fallbackStyle}>Loading SQL workspace…</div>}>
        <LazySqlWorkspaceBody layers={sqlLayers} onSendToMap={onSendToMap} />
      </Suspense>
    </section>
  );
}
