import React, { useEffect, useMemo, useState } from "react";
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
import { GisEmptyState, GisIconButton, GisStatusChip } from "../ui";
import motionStyles from "../design/motion.module.css";
import {
  ALLOWED_FIELD_FUNCTIONS,
  applyFieldCalculation,
  compileFieldCalculation,
  isValidDerivedFieldName,
} from "./fieldCalculator";
import {
  buildFieldProfile,
  buildFieldProfiles,
  type FieldProfile,
  formatFieldProfileMetric,
} from "./fieldProfiles";

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

export interface MapAttributeDerivedFieldDraft {
  sourceLayerId: string;
  sourceLayerName: string;
  fieldName: string;
  expression: string;
  featureCollection: GeoJSON.FeatureCollection;
  fieldProfile: FieldProfile;
  nullCount: number;
  totalValueCount: number;
  errorCount: number;
  referencedFields: string[];
  warnings: string[];
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

export function resolveLayerColumns(layer: OverlayLayerConfig, features: readonly AttrFeature[]): string[] {
  const seen = new Set<string>();
  const columns: string[] = [];
  const addColumn = (value: string | undefined): void => {
    const fieldName = value?.trim();
    if (!fieldName || seen.has(fieldName)) return;
    seen.add(fieldName);
    columns.push(fieldName);
  };

  layer.metadata?.schemaSummary?.fields.forEach((field) => addColumn(field.name));
  layer.metadata?.registry?.schemaSummary.fields.forEach((field) => addColumn(field.name));
  layer.metadata?.fields?.forEach((field) => addColumn(field));
  extractColumns(features).forEach((field) => addColumn(field));

  return columns.slice(0, MAX_COLUMNS);
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
  presentation?: "floating" | "embedded";
  onCreateDerivedLayer?: (draft: MapAttributeDerivedFieldDraft) => void;
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

const embeddedPanelStyle: React.CSSProperties = {
  ...panelStyle,
  position: "relative",
  left: "auto",
  right: "auto",
  bottom: "auto",
  width: "100%",
  height: "100%",
  maxHeight: "none",
  border: MAP_STROKES.none,
  borderRadius: MAP_RADIUS.none,
  boxShadow: MAP_SHADOWS.none,
  zIndex: "auto",
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

const titleClusterStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: MAP_RADIUS.full,
  border: MAP_STROKES.hairlineSubtle,
  padding: `1px ${MAP_SPACING.xs}`,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.text,
  background: MAP_COLORS.selectedSubtle,
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

const drawerStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgWorkspace,
};

const drawerHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const drawerTitleStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  color: MAP_COLORS.text,
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(7rem, 1fr))",
  gap: MAP_SPACING.xs,
};

const statCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
  padding: MAP_SPACING.xs,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgPanel,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
};

const statValueStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  color: MAP_COLORS.text,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const distributionListStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const distributionRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(7rem, 1.25fr) auto",
  gap: MAP_SPACING.xs,
  alignItems: "center",
  minWidth: 0,
};

const distributionLabelStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.text,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const distributionTrackStyle: React.CSSProperties = {
  position: "relative",
  height: 8,
  borderRadius: MAP_RADIUS.full,
  background: MAP_COLORS.bgPanel,
  border: MAP_STROKES.hairlineSubtle,
  overflow: "hidden",
};

const distributionCountStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
};

const calculatorGridStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
};

const calculatorFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.text,
};

const textInputStyle: React.CSSProperties = {
  width: "100%",
  padding: `6px ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairline,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  boxSizing: "border-box",
};

const textAreaStyle: React.CSSProperties = {
  ...textInputStyle,
  minHeight: 76,
  resize: "vertical",
  fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
};

const helperTextStyle: React.CSSProperties = {
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textMuted,
};

const statusTextStyle: React.CSSProperties = {
  ...helperTextStyle,
  color: MAP_COLORS.text,
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
  presentation = "floating",
  onCreateDerivedLayer,
  onAnnounce,
  viewportHeight = DEFAULT_VIEWPORT_HEIGHT,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [derivedFieldName, setDerivedFieldName] = useState("derived_value");
  const [expression, setExpression] = useState("value * 2");
  const [calculatorError, setCalculatorError] = useState<string | null>(null);
  const [calculatorStatus, setCalculatorStatus] = useState<string | null>(null);
  const [fieldPreview, setFieldPreview] = useState<MapAttributeDerivedFieldDraft | null>(null);
  const [fieldPreviewKey, setFieldPreviewKey] = useState<string | null>(null);

  const features = useMemo(() => extractFeatures(layer.sourceData), [layer.sourceData]);
  const columns = useMemo(() => resolveLayerColumns(layer, features), [features, layer]);
  const fieldProfiles = useMemo(() => buildFieldProfiles(features, columns), [features, columns]);
  const baseRows = useMemo(() => buildAttributeRows(features, layer.id), [features, layer.id]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rows = useMemo(
    () => {
      const filteredRows = filterRows(baseRows, filters);
      const scopedRows = selectedOnly
        ? filteredRows.filter((row) => selected.has(row.featureId))
        : filteredRows;
      return sortRows(scopedRows, sortKey, sortDir);
    },
    [baseRows, filters, selected, selectedOnly, sortKey, sortDir],
  );
  const visibleWindow = computeWindow(scrollTop, viewportHeight, ATTRIBUTE_ROW_HEIGHT, rows.length);
  const selectedRow = useMemo(
    () => rows.find((row) => selected.has(row.featureId)) ?? null,
    [rows, selected],
  );
  const activeProfile = useMemo(
    () => (activeField ? fieldProfiles[activeField] ?? null : null),
    [activeField, fieldProfiles],
  );
  const isDerivedLayer = layer.sourceKind === "derived" || layer.group === "analysis";
  const embedded = presentation === "embedded";
  const calculatorPreviewKey = useMemo(
    () => [layer.id, features.length, columns.join("|"), derivedFieldName.trim(), expression].join("\u0000"),
    [columns, derivedFieldName, expression, features.length, layer.id],
  );
  const fieldPreviewReady = fieldPreview !== null && fieldPreviewKey === calculatorPreviewKey;

  useEffect(() => {
    if (activeField && columns.includes(activeField)) return;
    setActiveField(columns[0] ?? null);
  }, [activeField, columns]);

  useEffect(() => {
    if (selectedIds.length === 0 && selectedOnly) {
      setSelectedOnly(false);
    }
  }, [selectedIds.length, selectedOnly]);

  const toggleSort = (key: string): void => {
    setActiveField(key);
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

  const buildDerivedFieldPreview = (): MapAttributeDerivedFieldDraft => {
    const fieldName = derivedFieldName.trim();
    if (!isValidDerivedFieldName(fieldName)) {
      throw new Error("Derived field names must start with a letter or underscore and use only letters, digits, or underscores.");
    }
    if (columns.includes(fieldName)) {
      throw new Error(`Field \"${fieldName}\" already exists on ${layer.name}.`);
    }

    const program = compileFieldCalculation(expression, { allowedIdentifiers: columns });
    const calculation = applyFieldCalculation({ features, fieldName, program });
    const profile = buildFieldProfile(calculation.featureCollection.features, fieldName);
    return {
      sourceLayerId: layer.id,
      sourceLayerName: layer.name,
      fieldName,
      expression: program.expression,
      featureCollection: calculation.featureCollection,
      fieldProfile: profile,
      nullCount: calculation.nullCount,
      totalValueCount: calculation.totalValueCount,
      errorCount: calculation.errorCount,
      referencedFields: calculation.referencedFields,
      warnings: calculation.warnings,
    };
  };

  const handlePreviewCalculation = (): void => {
    try {
      const preview = buildDerivedFieldPreview();
      setFieldPreview(preview);
      setFieldPreviewKey(calculatorPreviewKey);
      setCalculatorError(null);
      setCalculatorStatus(`Preview ready for ${preview.fieldName}: ${preview.totalValueCount.toLocaleString()} value(s), ${preview.nullCount.toLocaleString()} null output(s), ${preview.errorCount.toLocaleString()} evaluation error(s).`);
      onAnnounce?.(`Derived field preview ready for ${preview.fieldName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Field calculation failed.";
      setCalculatorError(message);
      setCalculatorStatus(null);
      setFieldPreview(null);
      setFieldPreviewKey(null);
      onAnnounce?.(`Field calculation blocked: ${message}`);
    }
  };

  const handleCreateFromPreview = (): void => {
    if (!onCreateDerivedLayer) {
      setCalculatorError("Derived-layer creation is unavailable in this view.");
      setCalculatorStatus(null);
      return;
    }
    if (!fieldPreviewReady || !fieldPreview) {
      setCalculatorError("Preview the current field calculation before creating a derived layer.");
      setCalculatorStatus(null);
      onAnnounce?.("Field calculation blocked until the preview is refreshed.");
      return;
    }

    onCreateDerivedLayer(fieldPreview);
    setCalculatorError(null);
    setCalculatorStatus(`Derived field ${fieldPreview.fieldName} prepared from ${fieldPreview.referencedFields.join(", ") || "constants"}.`);
    onAnnounce?.(`Derived field ${fieldPreview.fieldName} prepared from ${layer.name}.`);
  };

  const profileMetrics = activeProfile
    ? [
        { label: "Type", value: activeProfile.kind },
        { label: "Nulls", value: `${activeProfile.nullCount.toLocaleString()} / ${activeProfile.totalCount.toLocaleString()}` },
        { label: "Distinct", value: activeProfile.distinctCount.toLocaleString() },
        ...(activeProfile.kind === "numeric" || activeProfile.kind === "temporal"
          ? [
              { label: "Min", value: formatFieldProfileMetric(activeProfile.min) },
              { label: "Max", value: formatFieldProfileMetric(activeProfile.max) },
              { label: "Mean", value: formatFieldProfileMetric(activeProfile.mean) },
            ]
          : []),
      ]
    : [];

  return (
    <div
      style={embedded ? embeddedPanelStyle : panelStyle}
      role={embedded ? "region" : "dialog"}
      aria-label={`Attribute table for ${layer.name}`}
      data-testid="map-attribute-table"
    >
      <div style={headerStyle}>
        <div style={titleClusterStyle}>
          <div style={titleRowStyle}>
            <span style={titleStyle}>{layer.name}</span>
            {isDerivedLayer ? (
              <span
                style={badgeStyle}
                title={layer.provenance?.label ?? "Derived layer with recorded provenance."}
                data-testid="map-attribute-table-provenance-badge"
              >
                Derived
              </span>
            ) : null}
          </div>
          <span style={metaStyle} data-testid="map-attribute-table-count">
            {rows.length.toLocaleString()} of {features.length.toLocaleString()} feature{features.length === 1 ? "" : "s"}
            {selectedIds.length > 0 ? ` - ${selectedIds.length} selected` : ""}
            {selectedOnly ? " - selected filter on" : ""}
          </span>
        </div>
        <div style={toolbarStyle}>
          <button
            type="button"
            style={{
              ...headerButtonStyle,
              ...(selectedOnly ? { background: MAP_COLORS.selectedSubtle, color: MAP_COLORS.text } : {}),
              ...(selectedIds.length > 0 ? {} : disabledButtonStyle),
            }}
            onClick={() => setSelectedOnly((current) => !current)}
            disabled={selectedIds.length === 0}
            title={selectedIds.length > 0 ? "Filter the table to selected feature ids." : "Missing prerequisite: no selected features for this layer."}
            aria-pressed={selectedOnly}
            data-testid="map-attribute-selected-filter"
          >
            Selected only
          </button>
          <button
            type="button"
            style={{ ...headerButtonStyle, ...(activeProfile ? {} : disabledButtonStyle) }}
            onClick={() => setProfileDrawerOpen((current) => !current)}
            disabled={!activeProfile}
            title={activeProfile ? `Inspect the ${activeProfile.fieldName} field profile.` : "No field is available for profiling."}
          >
            Field profile
          </button>
          <button
            type="button"
            style={{ ...headerButtonStyle, ...(columns.length > 0 ? {} : disabledButtonStyle) }}
            onClick={() => setCalculatorOpen((current) => !current)}
            disabled={columns.length === 0}
            title={columns.length > 0 ? "Create a derived field with the sandboxed calculator." : "No fields available for calculation."}
          >
            Calculator
          </button>
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
          <GisIconButton label="Close attribute table" icon={<IconClose size={14} />} onClick={onClose} size="sm" />
        </div>
      </div>

      {profileDrawerOpen && activeProfile ? (
        <div style={drawerStyle} data-testid="map-attribute-profile-drawer">
          <div style={drawerHeaderStyle}>
            <div style={drawerTitleStyle}>{activeProfile.fieldName} profile</div>
            <div style={helperTextStyle}>Distribution, null counts, and summary stats for the selected field.</div>
          </div>
          <div style={statsGridStyle}>
            {profileMetrics.map((metric) => (
              <div key={metric.label} style={statCardStyle}>
                <span style={statLabelStyle}>{metric.label}</span>
                {metric.label === "Type" ? (
                  <GisStatusChip
                    status={metric.value === "numeric" ? "ready" : metric.value === "temporal" ? "caveat" : metric.value === "boolean" ? "demo" : "unknown"}
                    label={metric.value}
                    density="compact"
                  />
                ) : (
                  <span style={statValueStyle}>{metric.value}</span>
                )}
              </div>
            ))}
          </div>
          <div style={distributionListStyle}>
            {(activeProfile.distribution.length > 0 ? activeProfile.distribution : [{ label: "No non-null values", count: 0, ratio: 0 }]).map((entry) => (
              <div key={entry.label} style={distributionRowStyle}>
                <span style={distributionLabelStyle}>{entry.label}</span>
                <span style={distributionTrackStyle}>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${Math.max(0, Math.min(100, entry.ratio * 100))}%`,
                      background: MAP_COLORS.interaction,
                    }}
                  />
                </span>
                <span style={distributionCountStyle}>{entry.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {calculatorOpen ? (
        <div style={drawerStyle} data-testid="map-field-calculator">
          <div style={drawerHeaderStyle}>
            <div style={drawerTitleStyle}>Sandboxed field calculator</div>
            <div style={helperTextStyle}>Allowlisted operators and fixed functions only. No globals, property access, or dynamic execution.</div>
          </div>
          <div style={calculatorGridStyle}>
            <label style={calculatorFieldStyle}>
              <span>Derived field name</span>
              <input
                type="text"
                value={derivedFieldName}
                onChange={(event) => setDerivedFieldName(event.target.value)}
                aria-label="Derived field name"
                style={textInputStyle}
              />
            </label>
            <label style={calculatorFieldStyle}>
              <span>Expression</span>
              <textarea
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                aria-label="Field calculator expression"
                style={textAreaStyle}
              />
            </label>
            <div style={helperTextStyle}>
              Available fields: {columns.join(", ") || "none"}. Allowed functions: {ALLOWED_FIELD_FUNCTIONS.join(", ")}.
            </div>
            {calculatorError ? <div style={helperTextStyle} data-testid="map-field-calculator-error">{calculatorError}</div> : null}
            {calculatorStatus ? <div style={statusTextStyle}>{calculatorStatus}</div> : null}
            {fieldPreview ? (
              <div style={statCardStyle} data-testid="map-field-calculator-preview-summary">
                <span style={statLabelStyle}>Derived field preview</span>
                <span style={statValueStyle}>{fieldPreview.fieldName}</span>
                <div style={helperTextStyle}>
                  {fieldPreview.fieldProfile.kind} field · {fieldPreview.totalValueCount.toLocaleString()} rows · {fieldPreview.nullCount.toLocaleString()} null · {fieldPreview.errorCount.toLocaleString()} errors
                  {fieldPreviewReady ? "" : " · stale, preview again before creating"}
                </div>
              </div>
            ) : (
              <div style={helperTextStyle}>Preview the expression to inspect output counts before creating a derived layer.</div>
            )}
            <div style={{ display: "flex", gap: MAP_SPACING.xs, flexWrap: "wrap" }}>
              <button
                type="button"
                style={headerButtonStyle}
                onClick={handlePreviewCalculation}
                data-testid="map-field-calculator-preview"
                title="Preview the derived field values, stats, nulls, and blocked states before creating a layer."
              >
                Preview derived field
              </button>
              <button
                type="button"
                style={{ ...headerButtonStyle, ...(onCreateDerivedLayer && fieldPreviewReady ? {} : disabledButtonStyle) }}
                onClick={handleCreateFromPreview}
                disabled={!onCreateDerivedLayer || !fieldPreviewReady}
                data-testid="map-field-calculator-apply"
                title={
                  !onCreateDerivedLayer
                    ? "Derived-layer creation is unavailable in this view."
                    : fieldPreviewReady
                      ? "Create a derived layer from the current preview."
                      : "Preview the current calculation before creating a derived layer."
                }
              >
                Create derived layer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {columns.length === 0 ? (
        <GisEmptyState title="No attributes" description="This layer has no feature attributes to display." compact />
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
                data-testid={`map-attribute-column-${column}`}
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
                    className={isSelected ? motionStyles.featurePulse : undefined}
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
                      ...(isSelected ? { outline: `1px solid ${MAP_COLORS.interaction}`, outlineOffset: "0px" } : {}),
                    }}
                  >
                    {columns.map((column) => (
                      <span key={column} style={cellStyle} title={String(properties[column] ?? "")}>
                        {properties[column] === undefined || properties[column] === null ? (
                          <span style={{ color: MAP_COLORS.textMuted, fontStyle: "italic", opacity: 0.7 }}>null</span>
                        ) : String(properties[column])}
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
