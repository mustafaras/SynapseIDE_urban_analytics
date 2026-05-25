import React, { useMemo, useState } from "react";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { IconClose } from "../MapIcons";

export type AttrFeature = GeoJSON.Feature;
export type SortDirection = "asc" | "desc";

export const ATTRIBUTE_ROW_HEIGHT = 28;
const OVERSCAN = 8;
const DEFAULT_VIEWPORT_HEIGHT = 360;
const COLUMN_SAMPLE = 60;
const MAX_COLUMNS = 12;

export interface AttributeRow {
  feature: AttrFeature;
  sourceIndex: number;
  featureId: string;
}

export function resolveFeatureId(feature: AttrFeature, sourceLayerId: string): string {
  const properties = (feature.properties ?? {}) as Record<string, unknown>;
  const candidate =
    feature.id ??
    properties.id ??
    properties.feature_id ??
    properties.detection_id ??
    properties.cell_id ??
    properties.agent_id ??
    properties.name ??
    `${sourceLayerId}-feature`;
  return String(candidate);
}

export function extractFeatures(sourceData: OverlayLayerConfig["sourceData"]): AttrFeature[] {
  if (sourceData && typeof sourceData === "object" && "type" in sourceData) {
    const data = sourceData as { type: string; features?: AttrFeature[] };
    if (data.type === "FeatureCollection" && Array.isArray(data.features)) return data.features;
    if (data.type === "Feature") return [sourceData as AttrFeature];
  }
  return [];
}

export function extractColumns(features: readonly AttrFeature[]): string[] {
  const seen = new Set<string>();
  const columns: string[] = [];
  const sample = Math.min(features.length, COLUMN_SAMPLE);
  for (let index = 0; index < sample; index += 1) {
    const properties = features[index]?.properties as Record<string, unknown> | undefined;
    if (!properties) continue;
    for (const key of Object.keys(properties)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
        if (columns.length >= MAX_COLUMNS) return columns;
      }
    }
  }
  return columns;
}

export function buildAttributeRows(features: readonly AttrFeature[], layerId: string): AttributeRow[] {
  return features.map((feature, sourceIndex) => ({
    feature,
    sourceIndex,
    featureId: resolveFeatureId(feature, layerId),
  }));
}

export function filterRows(
  rows: readonly AttributeRow[],
  filters: Readonly<Record<string, string>>,
): AttributeRow[] {
  const active = Object.entries(filters).filter(([, value]) => value.trim() !== "");
  if (active.length === 0) return [...rows];
  return rows.filter((row) => {
    const properties = (row.feature.properties ?? {}) as Record<string, unknown>;
    return active.every(([key, value]) => {
      const cell = properties[key];
      return cell !== undefined && cell !== null && String(cell).toLowerCase().includes(value.trim().toLowerCase());
    });
  });
}

export function sortRows(
  rows: readonly AttributeRow[],
  sortKey: string | null,
  direction: SortDirection,
): AttributeRow[] {
  if (!sortKey) return [...rows];
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = (a.feature.properties as Record<string, unknown> | undefined)?.[sortKey];
    const bv = (b.feature.properties as Record<string, unknown> | undefined)?.[sortKey];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
    return String(av).localeCompare(String(bv)) * sign;
  });
}

export interface RowWindow {
  start: number;
  end: number;
}

export function computeWindow(
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  rowCount: number,
  overscan: number = OVERSCAN,
): RowWindow {
  if (rowCount === 0) return { start: 0, end: 0 };
  const visible = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(rowCount, start + visible);
  return { start, end };
}

export interface MapAttributeTableProps {
  layer: OverlayLayerConfig;
  selectedIds: readonly string[];
  onSelectFeatures: (featureIds: string[]) => void;
  onFocusFeature: (feature: AttrFeature) => void;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
  viewportHeight?: number;
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  left: MAP_SPACING.sm,
  right: MAP_SPACING.sm,
  bottom: MAP_SPACING.sm,
  maxHeight: "52%",
  display: "flex",
  flexDirection: "column",
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineStrong,
  borderRadius: MAP_RADIUS.md,
  boxShadow: MAP_SHADOWS.dropdown,
  zIndex: MAP_Z_INDEX.dropdown,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderBottom: MAP_STROKES.hairline,
};

const titleStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.text,
};

const metaStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  marginLeft: "auto",
};

const headerButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  cursor: "pointer",
  padding: `3px ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  transition: MAP_TRANSITIONS.fast,
};

const disabledButtonStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  cursor: "not-allowed",
  opacity: 0.72,
};

const iconButtonStyle: React.CSSProperties = {
  ...headerButtonStyle,
  padding: 2,
  color: MAP_COLORS.textMuted,
};

const headerCellStyle: React.CSSProperties = {
  flex: "1 1 0",
  minWidth: 80,
  padding: `4px ${MAP_SPACING.xs}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.text,
  cursor: "pointer",
  textAlign: "left",
  background: MAP_COLORS.transparent,
  border: MAP_STROKES.none,
};

const filterInputStyle: React.CSSProperties = {
  flex: "1 1 0",
  minWidth: 80,
  margin: "0 1px",
  padding: "2px 4px",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  background: MAP_COLORS.bgWorkspace,
  color: MAP_COLORS.text,
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  boxSizing: "border-box",
};

const cellStyle: React.CSSProperties = {
  flex: "1 1 0",
  minWidth: 80,
  padding: `0 ${MAP_SPACING.xs}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  lineHeight: `${ATTRIBUTE_ROW_HEIGHT}px`,
};

function formatSortLabel(column: string, sortKey: string | null, sortDir: SortDirection): string {
  if (sortKey !== column) return column;
  return `${column} (${sortDir})`;
}

export const MapAttributeTable: React.FC<MapAttributeTableProps> = ({
  layer,
  selectedIds,
  onSelectFeatures,
  onFocusFeature,
  onClose,
  onAnnounce,
  viewportHeight = DEFAULT_VIEWPORT_HEIGHT,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [scrollTop, setScrollTop] = useState(0);

  const features = useMemo(() => extractFeatures(layer.sourceData), [layer.sourceData]);
  const columns = useMemo(() => extractColumns(features), [features]);
  const baseRows = useMemo(() => buildAttributeRows(features, layer.id), [features, layer.id]);
  const rows = useMemo(
    () => sortRows(filterRows(baseRows, filters), sortKey, sortDir),
    [baseRows, filters, sortKey, sortDir],
  );
  const visibleWindow = computeWindow(scrollTop, viewportHeight, ATTRIBUTE_ROW_HEIGHT, rows.length);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedRow = useMemo(
    () => rows.find((row) => selected.has(row.featureId)) ?? null,
    [rows, selected],
  );

  const toggleSort = (key: string): void => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const selectRow = (row: AttributeRow): void => {
    onSelectFeatures([row.featureId]);
    onFocusFeature(row.feature);
    onAnnounce?.(`Selected feature ${row.featureId} in ${layer.name}.`);
  };

  const focusSelected = (): void => {
    if (!selectedRow) {
      onAnnounce?.("Select a table row before focusing the map.");
      return;
    }
    onFocusFeature(selectedRow.feature);
    onAnnounce?.(`Map focused on selected feature ${selectedRow.featureId}.`);
  };

  const clearSelection = (): void => {
    onSelectFeatures([]);
    onAnnounce?.(`Selection cleared for ${layer.name}.`);
  };

  return (
    <div
      style={panelStyle}
      role="dialog"
      aria-label={`Attribute table for ${layer.name}`}
      data-testid="map-attribute-table"
    >
      <div style={headerStyle}>
        <span style={titleStyle}>{layer.name}</span>
        <span style={metaStyle} data-testid="map-attribute-table-count">
          {rows.length.toLocaleString()} of {features.length.toLocaleString()} feature{features.length === 1 ? "" : "s"}
          {selectedIds.length > 0 ? ` - ${selectedIds.length} selected` : ""}
        </span>
        <div style={toolbarStyle}>
          <button
            type="button"
            style={{ ...headerButtonStyle, ...(selectedRow ? {} : disabledButtonStyle) }}
            onClick={focusSelected}
            disabled={!selectedRow}
            title={selectedRow ? "Focus the map on the selected row" : "Missing prerequisite: select a row first."}
          >
            Focus selected
          </button>
          <button
            type="button"
            style={{ ...headerButtonStyle, ...(selectedIds.length > 0 ? {} : disabledButtonStyle) }}
            onClick={clearSelection}
            disabled={selectedIds.length === 0}
            title={selectedIds.length > 0 ? "Clear selected feature ids for this layer" : "No selected feature ids to clear."}
          >
            Clear
          </button>
          <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close attribute table">
            <IconClose size={14} />
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <div style={{ padding: MAP_SPACING.md, ...metaStyle }}>
          This layer has no feature attributes to display.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", padding: `0 ${MAP_SPACING.sm}`, borderBottom: MAP_STROKES.hairlineSubtle }}>
            {columns.map((column) => (
              <button
                key={column}
                type="button"
                style={headerCellStyle}
                onClick={() => toggleSort(column)}
                aria-label={`Sort by ${column}`}
              >
                {formatSortLabel(column, sortKey, sortDir)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", padding: `2px ${MAP_SPACING.sm}` }}>
            {columns.map((column) => (
              <input
                key={column}
                type="text"
                value={filters[column] ?? ""}
                onChange={(event) => setFilters((current) => ({ ...current, [column]: event.target.value }))}
                placeholder="filter"
                aria-label={`Filter ${column}`}
                style={filterInputStyle}
              />
            ))}
          </div>
          <div
            style={{ overflowY: "auto", flex: 1, position: "relative", height: viewportHeight, maxHeight: "42vh" }}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            data-testid="map-attribute-table-body"
          >
            <div style={{ height: rows.length * ATTRIBUTE_ROW_HEIGHT, position: "relative" }}>
              {rows.slice(visibleWindow.start, visibleWindow.end).map((row, offset) => {
                const visualIndex = visibleWindow.start + offset;
                const isSelected = selected.has(row.featureId);
                const properties = (row.feature.properties ?? {}) as Record<string, unknown>;
                return (
                  <div
                    key={`${row.featureId}-${row.sourceIndex}`}
                    role="button"
                    tabIndex={0}
                    data-testid="map-attribute-row"
                    data-feature-id={row.featureId}
                    aria-label={`Select feature ${row.featureId}`}
                    aria-selected={isSelected ? "true" : "false"}
                    onClick={() => selectRow(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectRow(row);
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: visualIndex * ATTRIBUTE_ROW_HEIGHT,
                      left: 0,
                      right: 0,
                      height: ATTRIBUTE_ROW_HEIGHT,
                      display: "flex",
                      padding: `0 ${MAP_SPACING.sm}`,
                      cursor: "pointer",
                      background: isSelected ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
                      borderBottom: MAP_STROKES.hairlineSubtle,
                    }}
                  >
                    {columns.map((column) => (
                      <span key={column} style={cellStyle} title={String(properties[column] ?? "")}>
                        {properties[column] === undefined || properties[column] === null ? "" : String(properties[column])}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
