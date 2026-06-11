import React, { useEffect, useMemo, useState } from "react";
import type { Feature } from "geojson";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_DENSITY,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { GisDensePropertyRow, GisEmptyState, GisStatusChip } from "../ui";
import {
  type AttrFeature,
  extractFeatures,
  type MapAttributeDerivedFieldDraft,
  MapAttributeTable,
  resolveLayerColumns,
} from "./MapAttributeTable";
import { buildFieldProfiles, type FieldProfile, formatFieldProfileMetric } from "./fieldProfiles";
import type {
  MapJoinLayerInput,
  MapJoinMode,
  MapJoinPreviewResult,
  SpatialJoinPredicate,
} from "@/services/map/join/MapJoinPreviewService";

export interface AttributeLayerQueryState {
  queryable: boolean;
  disabledReason: string | null;
  featureCount: number;
  fieldCount: number;
  geometryType: string;
  crs: string | null;
  schemaSource: string;
}

interface AttributeLayerModel {
  layer: OverlayLayerConfig;
  queryState: AttributeLayerQueryState;
  features: Feature[];
  columns: string[];
  profiles: Record<string, FieldProfile>;
}

export interface MapAttributeWorkflowPanelProps {
  layers: readonly OverlayLayerConfig[];
  activeLayerId: string | null;
  selectedFeatureIds: Readonly<Record<string, readonly string[]>>;
  onActiveLayerChange: (layerId: string | null) => void;
  onSelectFeatures: (layerId: string, featureIds: string[]) => void;
  onFocusFeature: (feature: AttrFeature) => void;
  onCreateDerivedLayer: (draft: MapAttributeDerivedFieldDraft) => void;
  onClose: () => void;
  onAnnounce?: (message: string) => void;
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: MAP_DENSITY.compact.rowHeight,
  padding: `0 ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairline,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const helperTextStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  ...MAP_TEXT_STYLES.valueWrap,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: MAP_DENSITY.compact.rowHeight,
  padding: `0 ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.interaction,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const warningCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: "color-mix(in srgb, var(--syn-status-warning, #f59e0b) 10%, transparent)",
};

const warningTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const detailsSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.sm,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgPanel,
};

const detailsSummaryStyle: React.CSSProperties = {
  cursor: "pointer",
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  listStyle: "none",
};

const disabledButtonStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  cursor: "not-allowed",
  opacity: 0.72,
};

function resolveLayerCrs(layer: OverlayLayerConfig): string | null {
  return layer.metadata?.crsSummary?.crs ?? layer.metadata?.registry?.crsSummary.crs ?? null;
}

function resolveLayerGeometryType(layer: OverlayLayerConfig, features: readonly Feature[]): string {
  return layer.metadata?.geometryType
    ?? layer.metadata?.geometrySummary?.geometryType
    ?? layer.metadata?.registry?.geometrySummary.geometryType
    ?? features.find((feature) => feature.geometry)?.geometry?.type
    ?? "unknown";
}

function resolveSchemaSource(layer: OverlayLayerConfig): string {
  return layer.metadata?.schemaSummary?.source
    ?? layer.metadata?.registry?.schemaSummary.source
    ?? (layer.metadata?.fields?.length ? "metadata" : "sampled properties");
}

export function resolveAttributeLayerQueryState(layer: OverlayLayerConfig): AttributeLayerQueryState {
  const features = extractFeatures(layer.sourceData) as Feature[];
  const columns = resolveLayerColumns(layer, features);
  const featureCount = layer.metadata?.featureCount
    ?? layer.metadata?.geometrySummary?.featureCount
    ?? layer.metadata?.registry?.featureCount
    ?? features.length;
  const fieldCount = layer.metadata?.schemaSummary?.fieldCount
    ?? layer.metadata?.registry?.schemaSummary.fieldCount
    ?? columns.length;
  const geometryType = resolveLayerGeometryType(layer, features);
  const crs = resolveLayerCrs(layer);
  const schemaSource = resolveSchemaSource(layer);

  if (layer.queryable === false) {
    return {
      queryable: false,
      disabledReason: "Layer metadata marks this layer as non-queryable, so table rows and field operations are disabled.",
      featureCount,
      fieldCount,
      geometryType,
      crs,
      schemaSource,
    };
  }

  if (layer.type !== "geojson" && features.length === 0) {
    return {
      queryable: false,
      disabledReason: "This layer is rendered from raster or vector tiles; browser-side feature rows are not available for the attribute table.",
      featureCount,
      fieldCount,
      geometryType,
      crs,
      schemaSource,
    };
  }

  if (!layer.sourceData || typeof layer.sourceData === "string") {
    return {
      queryable: false,
      disabledReason: "Layer source data is an external reference or has not been restored into memory, so rows cannot be queried yet.",
      featureCount,
      fieldCount,
      geometryType,
      crs,
      schemaSource,
    };
  }

  if (features.length === 0) {
    return {
      queryable: false,
      disabledReason: "No feature rows are available for this layer. Attribute operations require GeoJSON features with properties.",
      featureCount,
      fieldCount,
      geometryType,
      crs,
      schemaSource,
    };
  }

  return {
    queryable: true,
    disabledReason: null,
    featureCount,
    fieldCount,
    geometryType,
    crs,
    schemaSource,
  };
}

function buildAttributeLayerModel(layer: OverlayLayerConfig): AttributeLayerModel {
  const features = extractFeatures(layer.sourceData) as Feature[];
  const columns = resolveLayerColumns(layer, features);
  return {
    layer,
    queryState: resolveAttributeLayerQueryState(layer),
    features,
    columns,
    profiles: buildFieldProfiles(features, columns),
  };
}

function fieldProfileSummary(profile: FieldProfile): string {
  const base = `${profile.kind}, ${profile.distinctCount.toLocaleString()} distinct, ${profile.nullCount.toLocaleString()} null`;
  if (profile.kind === "numeric" || profile.kind === "temporal") {
    return `${base}, min ${formatFieldProfileMetric(profile.min)}, max ${formatFieldProfileMetric(profile.max)}`;
  }
  const leading = profile.distribution[0];
  return leading ? `${base}, top ${leading.label} (${leading.count.toLocaleString()})` : base;
}

function queryStatusTone(queryState: AttributeLayerQueryState): GisStatusKey {
  return queryState.queryable ? "ready" : "blocked";
}

function buildJoinLayerInput(model: AttributeLayerModel): MapJoinLayerInput {
  return {
    layerId: model.layer.id,
    layerName: model.layer.name,
    features: model.features,
    crs: model.queryState.crs,
    geometryClass: model.queryState.geometryType,
    fields: model.columns,
  };
}

function joinPreviewDisabledReason(
  activeModel: AttributeLayerModel | null,
  joinModel: AttributeLayerModel | null,
  joinMode: MapJoinMode,
  primaryKey: string,
  joinKey: string,
): string | null {
  if (!activeModel) return "Choose an active layer before previewing a join.";
  if (!activeModel.queryState.queryable) return activeModel.queryState.disabledReason;
  if (!joinModel) return "Choose a second queryable layer to preview a join or relate.";
  if (!joinModel.queryState.queryable) return joinModel.queryState.disabledReason;
  if (joinMode === "attribute" && !primaryKey) return "Choose a primary key field before previewing an attribute join.";
  if (joinMode === "attribute" && !joinKey) return "Choose a join key field before previewing an attribute join.";
  return null;
}

function formatRatio(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function buildAttributeWarnings(activeModel: AttributeLayerModel | null): string[] {
  if (!activeModel) return [];
  const warnings: string[] = [];
  if (!activeModel.queryState.crs) {
    warnings.push("CRS is unknown. Validate projection before relying on distances, areas, or spatial joins.");
  }
  if (!activeModel.queryState.queryable && activeModel.queryState.disabledReason) {
    warnings.push(activeModel.queryState.disabledReason);
  }
  return warnings;
}

export function MapAttributeWorkflowPanel({
  layers,
  activeLayerId,
  selectedFeatureIds,
  onActiveLayerChange,
  onSelectFeatures,
  onFocusFeature,
  onCreateDerivedLayer,
  onClose,
  onAnnounce,
}: MapAttributeWorkflowPanelProps): React.ReactElement {
  const [joinMode, setJoinMode] = useState<MapJoinMode>("attribute");
  const [joinLayerId, setJoinLayerId] = useState<string>("");
  const [primaryKey, setPrimaryKey] = useState<string>("");
  const [joinKey, setJoinKey] = useState<string>("");
  const [spatialPredicate, setSpatialPredicate] = useState<SpatialJoinPredicate>("intersects");
  const [joinPreview, setJoinPreview] = useState<MapJoinPreviewResult | null>(null);
  const [joinPreviewError, setJoinPreviewError] = useState<string | null>(null);
  const [joinPreviewBusy, setJoinPreviewBusy] = useState(false);
  // The panel is hosted both in the wide bottom dock and the narrow right
  // dock. Track our own width so the table/details split stacks instead of
  // collapsing the table column to zero width in narrow hosts.
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [stackedLayout, setStackedLayout] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? node.getBoundingClientRect().width;
      setStackedLayout(width > 0 && width < 760);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const layerModels = useMemo(() => layers.map(buildAttributeLayerModel), [layers]);
  const activeModel = useMemo(
    () => layerModels.find((model) => model.layer.id === activeLayerId) ?? null,
    [activeLayerId, layerModels],
  );
  const queryableJoinModels = useMemo(
    () => layerModels.filter((model) => model.layer.id !== activeLayerId && model.queryState.queryable),
    [activeLayerId, layerModels],
  );
  const joinModel = useMemo(
    () => queryableJoinModels.find((model) => model.layer.id === joinLayerId) ?? null,
    [joinLayerId, queryableJoinModels],
  );
  const activeSelectedIds = activeModel ? selectedFeatureIds[activeModel.layer.id] ?? [] : [];
  const totalSelectedCount = useMemo(
    () => Object.values(selectedFeatureIds).reduce((total, ids) => total + ids.length, 0),
    [selectedFeatureIds],
  );
  const disabledReason = joinPreviewDisabledReason(activeModel, joinModel, joinMode, primaryKey, joinKey);
  const tableAnnounceProps = onAnnounce ? { onAnnounce } : {};
  const attributeWarnings = useMemo(() => buildAttributeWarnings(activeModel), [activeModel]);

  useEffect(() => {
    if (!activeModel) {
      setPrimaryKey("");
      return;
    }
    if (!activeModel.columns.includes(primaryKey)) {
      setPrimaryKey(activeModel.columns[0] ?? "");
    }
  }, [activeModel, primaryKey]);

  useEffect(() => {
    const nextJoinModel = queryableJoinModels.find((model) => model.layer.id === joinLayerId) ?? queryableJoinModels[0] ?? null;
    setJoinLayerId(nextJoinModel?.layer.id ?? "");
    if (nextJoinModel && !nextJoinModel.columns.includes(joinKey)) {
      setJoinKey(nextJoinModel.columns[0] ?? "");
    }
    if (!nextJoinModel) {
      setJoinKey("");
    }
  }, [joinKey, joinLayerId, queryableJoinModels]);

  useEffect(() => {
    setJoinPreview(null);
    setJoinPreviewError(null);
  }, [activeLayerId, joinLayerId, joinMode, primaryKey, joinKey, spatialPredicate]);

  const handleRunJoinPreview = async (): Promise<void> => {
    const reason = joinPreviewDisabledReason(activeModel, joinModel, joinMode, primaryKey, joinKey);
    if (reason) {
      setJoinPreview(null);
      setJoinPreviewError(reason);
      onAnnounce?.(`Join preview blocked: ${reason}`);
      return;
    }
    if (!activeModel || !joinModel) return;

    setJoinPreviewBusy(true);
    setJoinPreviewError(null);
    try {
      const service = await import("@/services/map/join/MapJoinPreviewService");
      const result = joinMode === "attribute"
        ? service.buildAttributeJoinPreview({
            mode: "attribute",
            primary: buildJoinLayerInput(activeModel),
            join: buildJoinLayerInput(joinModel),
            primaryKey,
            joinKey,
          })
        : service.buildSpatialJoinPreview({
            mode: "spatial",
            primary: buildJoinLayerInput(activeModel),
            join: buildJoinLayerInput(joinModel),
            predicate: spatialPredicate,
          });
      setJoinPreview(result);
      onAnnounce?.(result.ok
        ? `Join preview ready: ${result.summary.matchedPrimaryCount.toLocaleString()} matched primary feature(s).`
        : `Join preview blocked: ${result.blockers.join(" ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Join preview failed.";
      setJoinPreview(null);
      setJoinPreviewError(message);
      onAnnounce?.(`Join preview failed: ${message}`);
    } finally {
      setJoinPreviewBusy(false);
    }
  };

  const activeQueryState = activeModel?.queryState ?? null;

  return (
    <section
      ref={rootRef}
      style={{
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        background: MAP_COLORS.bgPanel,
        color: MAP_COLORS.text,
      }}
      aria-label="Attribute, field, join, and table workflow"
      data-testid="map-attribute-workflow-panel"
      data-layout={stackedLayout ? "stacked" : "split"}
    >
      <header
        style={{
          display: "grid",
          gridTemplateColumns: stackedLayout ? "minmax(0, 1fr)" : "minmax(13rem, 1fr) auto",
          alignItems: "center",
          gap: stackedLayout ? MAP_SPACING.sm : MAP_SPACING.md,
          minWidth: 0,
          padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
          borderBottom: MAP_STROKES.hairlineSubtle,
          background: MAP_COLORS.bgHeader,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: stackedLayout ? "auto minmax(0, 1fr)" : "auto minmax(12rem, 24rem) minmax(0, 1fr)", alignItems: "center", gap: MAP_SPACING.sm, minWidth: 0 }}>
          <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Active layer</span>
          <select
            value={activeModel?.layer.id ?? ""}
            onChange={(event) => onActiveLayerChange(event.target.value || null)}
            aria-label="Active attribute layer"
            style={selectStyle}
            data-testid="map-attribute-layer-selector"
          >
            <option value="">Choose layer...</option>
            {layerModels.map((model) => (
              <option key={model.layer.id} value={model.layer.id}>
                {model.layer.name}{model.queryState.queryable ? "" : " - not queryable"}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", flexWrap: "wrap", gap: MAP_SPACING.xs, minWidth: 0 }}>
            <GisStatusChip status={activeQueryState ? queryStatusTone(activeQueryState) : "unknown"} label={activeQueryState?.queryable ? "queryable" : "blocked"} density="compact" />
            <GisStatusChip status="metadata-only" label={`${layers.length.toLocaleString()} layers`} density="compact" />
            <GisStatusChip status={totalSelectedCount > 0 ? "ready" : "unknown"} label={`${totalSelectedCount.toLocaleString()} selected`} density="compact" />
          </div>
        </div>
        {activeQueryState ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: MAP_SPACING.xs, minWidth: 0 }} data-testid="map-attribute-schema-profile">
            <GisStatusChip status="metadata-only" label={`${activeQueryState.fieldCount.toLocaleString()} fields`} density="compact" />
            <GisStatusChip status="metadata-only" label={activeQueryState.geometryType} density="compact" />
            <GisStatusChip status={activeQueryState.crs ? "ready" : "caveat"} label={activeQueryState.crs ?? "CRS unknown"} density="compact" />
          </div>
        ) : null}
      </header>

      <div
        style={
          stackedLayout
            ? { display: "grid", gridTemplateRows: "minmax(0, 1.4fr) minmax(0, 1fr)", minHeight: 0, minWidth: 0, overflow: "hidden" }
            : { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 24rem)", minHeight: 0, minWidth: 0 }
        }
      >
        <div style={{ minHeight: 0, minWidth: 0, overflow: "hidden" }}>
          {!activeModel ? (
            <GisEmptyState
              title="No attribute layer selected"
              description="Choose a queryable layer to inspect rows, selected features, schema, field statistics, and preview transformations."
              compact
              style={{ height: "100%" }}
              data-testid="map-bottom-panel-attributes-empty"
            />
          ) : activeModel.queryState.queryable ? (
            <MapAttributeTable
              presentation="embedded"
              layer={activeModel.layer}
              selectedIds={activeSelectedIds}
              onSelectFeatures={(featureIds) => onSelectFeatures(activeModel.layer.id, featureIds)}
              onFocusFeature={onFocusFeature}
              onCreateDerivedLayer={onCreateDerivedLayer}
              onClose={onClose}
              {...tableAnnounceProps}
            />
          ) : (
            <div style={{ height: "100%", padding: MAP_SPACING.md }} data-testid="map-attribute-layer-disabled-reason">
              <GisEmptyState
                title="Layer is not queryable"
                description={activeModel.queryState.disabledReason ?? "Attribute rows are unavailable for this layer."}
                compact
                style={{ height: "100%" }}
              />
            </div>
          )}
        </div>

        <aside
          style={{
            display: "grid",
            alignContent: "start",
            gap: MAP_SPACING.md,
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
            padding: MAP_SPACING.md,
            ...(stackedLayout
              ? { borderTop: MAP_STROKES.hairlineSubtle }
              : { borderLeft: MAP_STROKES.hairlineSubtle }),
            background: MAP_COLORS.bgWorkspace,
          }}
          aria-label="Attribute workflow details"
        >
          <section style={{ display: "grid", gap: MAP_SPACING.sm, minWidth: 0 }} data-testid="map-attribute-summary-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
              <h3 style={sectionTitleStyle}>Selection summary</h3>
              {activeQueryState ? <GisStatusChip status={queryStatusTone(activeQueryState)} label={activeQueryState.queryable ? "queryable" : "blocked"} density="compact" /> : null}
            </div>
            {activeModel ? (
              <div>
                <GisDensePropertyRow label="Layer" value={activeModel.layer.name} density="compact" />
                <GisDensePropertyRow label="Selected" value={`${activeSelectedIds.length.toLocaleString()} in this layer`} density="compact" highlight={activeSelectedIds.length > 0 ? undefined : "warn"} />
                <GisDensePropertyRow label="Total selected" value={totalSelectedCount.toLocaleString()} density="compact" />
                <GisDensePropertyRow label="Rows" value={activeModel.queryState.featureCount.toLocaleString()} density="compact" />
                <GisDensePropertyRow label="Fields" value={activeModel.queryState.fieldCount.toLocaleString()} density="compact" />
                <GisDensePropertyRow label="Geometry" value={activeModel.queryState.geometryType} density="compact" />
                <GisDensePropertyRow label="CRS" value={activeModel.queryState.crs ?? "unknown"} density="compact" highlight={activeModel.queryState.crs ? undefined : "warn"} />
              </div>
            ) : (
              <p style={helperTextStyle}>Choose a layer to show a compact summary before inspecting rows, fields, or join previews.</p>
            )}
          </section>

          <section style={{ display: "grid", gap: MAP_SPACING.sm, minWidth: 0 }} data-testid="map-attribute-warning-section">
            <h3 style={sectionTitleStyle}>Warnings</h3>
            {attributeWarnings.length > 0 ? (
              attributeWarnings.map((warning) => (
                <div key={warning} style={warningCardStyle}>
                  <span style={warningTitleStyle}>Needs review</span>
                  <span style={helperTextStyle}>{warning}</span>
                </div>
              ))
            ) : (
              <p style={helperTextStyle}>No blocking queryability or CRS warnings are currently detected for the active layer.</p>
            )}
          </section>

          <section style={{ display: "grid", gap: MAP_SPACING.sm, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
              <h3 style={sectionTitleStyle}>Primary action</h3>
              <GisStatusChip status={joinPreview?.ok ? "ready" : disabledReason ? "blocked" : "metadata-only"} label={joinPreview?.summary.cardinalityLabel ?? "preview-first"} density="compact" />
            </div>
            <button
              type="button"
              style={{ ...buttonStyle, ...(disabledReason || joinPreviewBusy ? disabledButtonStyle : {}) }}
              disabled={Boolean(disabledReason) || joinPreviewBusy}
              onClick={() => void handleRunJoinPreview()}
              title={disabledReason ?? "Preview match counts, cardinality, CRS, and caveats before applying a join."}
              data-testid="map-attribute-summary-primary-action"
            >
              {joinPreviewBusy ? "Previewing..." : "Preview join"}
            </button>
          </section>

          <section style={{ display: "grid", gap: MAP_SPACING.sm, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
              <h3 style={sectionTitleStyle}>Schema profile</h3>
              {activeQueryState ? <GisStatusChip status={queryStatusTone(activeQueryState)} label={activeQueryState.schemaSource} density="compact" /> : null}
            </div>
            {activeModel ? (
              <div>
                <GisDensePropertyRow label="Layer" value={activeModel.layer.name} density="compact" />
                <GisDensePropertyRow label="Rows" value={activeModel.queryState.featureCount.toLocaleString()} density="compact" />
                <GisDensePropertyRow label="Selected" value={`${activeSelectedIds.length.toLocaleString()} selected in this layer`} density="compact" />
                <GisDensePropertyRow label="Fields" value={activeModel.queryState.fieldCount.toLocaleString()} density="compact" />
                <GisDensePropertyRow label="Geometry" value={activeModel.queryState.geometryType} density="compact" />
                <GisDensePropertyRow label="CRS" value={activeModel.queryState.crs ?? "unknown"} density="compact" highlight={activeModel.queryState.crs ? undefined : "warn"} />
                {activeModel.queryState.disabledReason ? <GisDensePropertyRow label="Blocked" value={activeModel.queryState.disabledReason} density="compact" highlight="error" /> : null}
              </div>
            ) : (
              <p style={helperTextStyle}>No active schema. Select a layer to show metadata before field or join transformations.</p>
            )}
          </section>

          <details style={detailsSectionStyle} data-testid="map-attribute-field-stats-details">
            <summary style={detailsSummaryStyle}>Field stats</summary>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
              <GisStatusChip status={activeModel?.columns.length ? "ready" : "unknown"} label={`${activeModel?.columns.length ?? 0} profiled`} density="compact" />
            </div>
            {activeModel && activeModel.columns.length > 0 ? (
              <div style={{ display: "grid", maxHeight: "8.5rem", overflow: "auto", borderTop: MAP_STROKES.hairlineSubtle }} data-testid="map-attribute-field-stats">
                {activeModel.columns.map((fieldName) => {
                  const profile = activeModel.profiles[fieldName];
                  return profile ? (
                    <GisDensePropertyRow
                      key={fieldName}
                      label={fieldName}
                      value={fieldProfileSummary(profile)}
                      density="compact"
                      highlight={profile.nullRatio > 0.25 ? "warn" : undefined}
                    />
                  ) : null;
                })}
              </div>
            ) : (
              <p style={helperTextStyle}>No attribute fields are available to profile.</p>
            )}
          </details>

          <section style={{ display: "grid", gap: MAP_SPACING.sm, minWidth: 0 }} data-testid="map-attribute-join-preview">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: MAP_SPACING.sm }}>
              <h3 style={sectionTitleStyle}>Join / relate preview</h3>
              <GisStatusChip status={joinPreview?.ok ? "ready" : disabledReason ? "blocked" : "metadata-only"} label={joinPreview?.summary.cardinalityLabel ?? "preview-first"} density="compact" />
            </div>
            <div style={{ display: "grid", gap: MAP_SPACING.sm }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ ...helperTextStyle, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Mode</span>
                <select value={joinMode} onChange={(event) => setJoinMode(event.target.value as MapJoinMode)} style={selectStyle} aria-label="Join mode">
                  <option value="attribute">Attribute join</option>
                  <option value="spatial">Spatial relate</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ ...helperTextStyle, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Join layer</span>
                <select value={joinModel?.layer.id ?? ""} onChange={(event) => setJoinLayerId(event.target.value)} style={selectStyle} aria-label="Join layer">
                  <option value="">Choose join layer...</option>
                  {queryableJoinModels.map((model) => <option key={model.layer.id} value={model.layer.id}>{model.layer.name}</option>)}
                </select>
              </label>
              {joinMode === "attribute" ? (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: MAP_SPACING.sm }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ ...helperTextStyle, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Primary key</span>
                    <select value={primaryKey} onChange={(event) => setPrimaryKey(event.target.value)} style={selectStyle} aria-label="Primary join key">
                      <option value="">Choose field...</option>
                      {(activeModel?.columns ?? []).map((fieldName) => <option key={fieldName} value={fieldName}>{fieldName}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ ...helperTextStyle, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Join key</span>
                    <select value={joinKey} onChange={(event) => setJoinKey(event.target.value)} style={selectStyle} aria-label="Secondary join key">
                      <option value="">Choose field...</option>
                      {(joinModel?.columns ?? []).map((fieldName) => <option key={fieldName} value={fieldName}>{fieldName}</option>)}
                    </select>
                  </label>
                </div>
              ) : (
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ ...helperTextStyle, fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold }}>Spatial predicate</span>
                  <select value={spatialPredicate} onChange={(event) => setSpatialPredicate(event.target.value as SpatialJoinPredicate)} style={selectStyle} aria-label="Spatial join predicate">
                    <option value="intersects">Intersects</option>
                    <option value="within">Within</option>
                    <option value="nearest">Nearest</option>
                  </select>
                </label>
              )}
              {disabledReason ? <p style={helperTextStyle} data-testid="map-attribute-join-disabled-reason">{disabledReason}</p> : null}
              {joinPreviewError ? <p style={{ ...helperTextStyle, color: MAP_COLORS.error }}>{joinPreviewError}</p> : null}
              <button
                type="button"
                style={{ ...buttonStyle, ...(disabledReason || joinPreviewBusy ? disabledButtonStyle : {}) }}
                disabled={Boolean(disabledReason) || joinPreviewBusy}
                onClick={() => void handleRunJoinPreview()}
                title={disabledReason ?? "Preview match counts, cardinality, caveats, and blocked states before creating a joined output."}
                data-testid="map-attribute-join-preview-run"
              >
                {joinPreviewBusy ? "Previewing..." : "Preview join"}
              </button>
            </div>

            {joinPreview ? (
              <div style={{ display: "grid", gap: MAP_SPACING.xs, padding: MAP_SPACING.sm, borderRadius: MAP_RADIUS.sm, border: MAP_STROKES.hairlineSubtle, background: MAP_COLORS.bgPanel }} data-testid="map-attribute-join-preview-result">
                <div style={{ display: "flex", flexWrap: "wrap", gap: MAP_SPACING.xs }}>
                  <GisStatusChip status={joinPreview.ok ? "ready" : "blocked"} label={joinPreview.ok ? "preview ready" : "blocked"} density="compact" />
                  <GisStatusChip status="metadata-only" label={joinPreview.summary.execution.strategy} density="compact" />
                  <GisStatusChip status={joinPreview.summary.cardinalityWarning ? "caveat" : "ready"} label={joinPreview.summary.cardinalityLabel} density="compact" />
                </div>
                <GisDensePropertyRow label="Matched" value={`${joinPreview.summary.matchedPrimaryCount.toLocaleString()} / ${joinPreview.summary.primaryFeatureCount.toLocaleString()} primary (${formatRatio(joinPreview.summary.primaryFeatureCount > 0 ? joinPreview.summary.matchedPrimaryCount / joinPreview.summary.primaryFeatureCount : 0)})`} density="compact" />
                <GisDensePropertyRow label="Unmatched" value={joinPreview.summary.unmatchedPrimaryCount.toLocaleString()} density="compact" highlight={joinPreview.summary.unmatchedPrimaryCount > 0 ? "warn" : undefined} />
                <GisDensePropertyRow label="Output rows" value={joinPreview.summary.outputFeatureCount.toLocaleString()} density="compact" />
                {joinPreview.summary.cardinalityWarning ? <p style={helperTextStyle}>{joinPreview.summary.cardinalityWarning}</p> : null}
                {joinPreview.blockers.length > 0 ? <p style={{ ...helperTextStyle, color: MAP_COLORS.error }}>{joinPreview.blockers.join(" ")}</p> : null}
                {joinPreview.caveats.length > 0 ? <p style={helperTextStyle}>{joinPreview.caveats.join(" ")}</p> : null}
              </div>
            ) : (
              <p style={helperTextStyle}>Preview only. Review match counts, cardinality, CRS, and caveats before creating or applying joined outputs.</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

export default MapAttributeWorkflowPanel;
