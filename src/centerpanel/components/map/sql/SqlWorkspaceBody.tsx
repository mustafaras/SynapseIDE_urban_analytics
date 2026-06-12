/**
 * SqlWorkspaceBody — loads visible GeoJSON overlay layers into the shared
 * DuckDB-WASM instance and hosts the spatial SQL editor. This module pulls
 * in monaco and duckdb-wasm, so it must only be reached through the lazy
 * import in MapSqlWorkspacePanel — never on the map boot path.
 */

import React, { useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import { SQLEditor, useSpatialDB } from "@/engine/spatial-db";
import { MAP_COLORS, MAP_SPACING, MAP_STROKES, MAP_TYPOGRAPHY } from "../mapTokens";

export interface SqlWorkspaceLayerInput {
  id: string;
  name: string;
  data: FeatureCollection;
}

export interface SqlWorkspaceBodyProps {
  layers: readonly SqlWorkspaceLayerInput[];
  onSendToMap: (geojson: FeatureCollection) => void;
}

const statusStyle: React.CSSProperties = {
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  flexShrink: 0,
};

const bodyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  height: "100%",
};

export function toSqlTableName(layerName: string): string {
  const normalized = layerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = normalized.length > 0 ? normalized : "layer";
  return /^[0-9]/.test(base) ? `layer_${base}` : base;
}

export default function SqlWorkspaceBody({ layers, onSendToMap }: SqlWorkspaceBodyProps): React.ReactElement {
  const { ready, loadGeoJSON, error } = useSpatialDB();
  const loadedLayerIdsRef = useRef<Set<string>>(new Set());
  const [loadedTables, setLoadedTables] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const pending = layers.filter((layer) => !loadedLayerIdsRef.current.has(layer.id));
    if (pending.length === 0) return;
    void (async () => {
      const tables: string[] = [];
      for (const layer of pending) {
        try {
          const table = toSqlTableName(layer.name);
          await loadGeoJSON(table, layer.data);
          loadedLayerIdsRef.current.add(layer.id);
          tables.push(table);
        } catch (loadFailure) {
          if (!cancelled) {
            setLoadError(loadFailure instanceof Error ? loadFailure.message : String(loadFailure));
          }
        }
      }
      if (!cancelled && tables.length > 0) {
        setLoadedTables((previous) => [...previous, ...tables]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [layers, loadGeoJSON, ready]);

  const statusText = error
    ? `DuckDB unavailable: ${error}`
    : !ready
      ? "Starting DuckDB-WASM…"
      : loadedTables.length > 0
        ? `Tables from map layers: ${loadedTables.join(", ")}`
        : layers.length === 0
          ? "No GeoJSON layers on the map — load data first, then reopen the SQL workspace."
          : "Loading map layers into DuckDB…";

  return (
    <div style={bodyStyle}>
      <div style={statusStyle} data-testid="map-sql-workspace-status" title={statusText}>
        {statusText}
        {loadError ? ` · Last load error: ${loadError}` : null}
      </div>
      <SQLEditor onSendToMap={onSendToMap} />
    </div>
  );
}
