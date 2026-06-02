import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  FolderTree,
  GripVertical,
  SlidersHorizontal,
  SquareMousePointer,
  Wrench,
  X,
} from "lucide-react";
import type {
  MapDefinitionFilterOperator,
  MapLayerDefinitionFilter,
  OverlayLayerConfig,
} from "../mapTypes";
import { normalizeLayerRegistryMetadata } from "../mapLayerMetadata";
import { mapStyles } from "../mapTokens";
import {
  applyDefinitionFilterToLayer,
  buildMapContentsGroups,
  evaluateContentsScaleRange,
  formatDefinitionFilter,
  type MapLayerContentsPatch,
  resolveMapLayerContentsState,
  setMapLayerContentsState,
} from "./contentsModel";
import styles from "./MapContentsTreePanel.module.css";
import { GisEmptyState, GisIconButton, GisStatusChip } from "../ui";

export interface MapContentsTreePanelProps {
  visible: boolean;
  layers: readonly OverlayLayerConfig[];
  zoom: number;
  onClose: () => void;
  onUpdateLayer: (id: string, patch: Partial<OverlayLayerConfig>) => void;
  onDuplicateLayer: (layer: OverlayLayerConfig) => void;
  onRepairSource: (layer: OverlayLayerConfig) => void;
  onOpenProperties: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onReorderLayers: (layerIds: string[]) => void;
  presentation?: "floating" | "embedded";
}

function qaWarning(layer: OverlayLayerConfig): string | null {
  const registry = normalizeLayerRegistryMetadata(layer);
  if (registry.qaStatus === "error") return "QA error: review blocking layer issues.";
  const scientificQA = layer.metadata?.scientificQA;
  if (scientificQA?.status === "error") return scientificQA.caveats[0] ?? "QA error recorded.";
  if (scientificQA?.status === "warning") return scientificQA.caveats[0] ?? "QA warning recorded.";
  if (registry.qaStatus === "warning") return "QA warning recorded.";
  return null;
}

function parseOptionalZoom(value: string): number | undefined {
  if (value.trim().length === 0) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(24, number)) : undefined;
}

function formatScaleRange(contents: ReturnType<typeof resolveMapLayerContentsState>): string {
  const min = contents.minZoom;
  const max = contents.maxZoom;
  if (min == null && max == null) return "All scales";
  if (min != null && max != null) return `Z${min}-${max}`;
  if (min != null) return `Z${min}+`;
  return `to Z${max}`;
}

function formatCount(value: number | null | undefined): string {
  return value == null ? "count unknown" : value.toLocaleString();
}

function formatGeometrySummary(layer: OverlayLayerConfig): string {
  const registry = normalizeLayerRegistryMetadata(layer);
  const geometry = registry.geometrySummary.geometryType === "Unknown" ? "Geometry unknown" : registry.geometrySummary.geometryType;
  return `${geometry} / ${formatCount(registry.featureCount)} features`;
}

function publicationStatusLabel(status: ReturnType<typeof normalizeLayerRegistryMetadata>["publicationReadiness"]["status"]): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "ready-with-caveats":
      return "Ready with caveats";
    case "blocked":
      return "Blocked";
    case "needs-review":
    default:
      return "Needs review";
  }
}

function publicationChipStatus(status: ReturnType<typeof normalizeLayerRegistryMetadata>["publicationReadiness"]["status"]): "ready" | "blocked" | "caveat" {
  if (status === "ready") return "ready";
  if (status === "blocked") return "blocked";
  return "caveat";
}

function qaChipStatus(status: ReturnType<typeof normalizeLayerRegistryMetadata>["qaStatus"]): "ready" | "blocked" | "caveat" | "unknown" {
  if (status === "passed") return "ready";
  if (status === "error") return "blocked";
  if (status === "warning") return "caveat";
  return "unknown";
}

function sourceChipStatus(layer: OverlayLayerConfig): "ready" | "external" | "demo" | "generated" | "unknown" {
  const registry = normalizeLayerRegistryMetadata(layer);
  if (registry.sourceKind === "external") return "external";
  if (registry.sourceKind === "demo") return "demo";
  if (registry.sourceKind === "derived") return "generated";
  if (registry.sourceKind === "project" || registry.sourceKind === "imported") return "ready";
  return "unknown";
}

export const MapContentsTreePanel: React.FC<MapContentsTreePanelProps> = ({
  visible,
  layers,
  zoom,
  onClose,
  onUpdateLayer,
  onDuplicateLayer,
  onRepairSource,
  onOpenProperties,
  onToggleVisibility,
  onReorderLayers,
  presentation = "floating",
}) => {
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(() => new Set());
  const [newGroupName, setNewGroupName] = useState("Review Group");
  const groups = useMemo(() => buildMapContentsGroups(layers), [layers]);
  const activeLayer = useMemo(
    () => layers.find((layer) => layer.id === activeLayerId) ?? layers[0] ?? null,
    [activeLayerId, layers],
  );
  const layersById = useMemo(
    () => new Map(layers.map((layer) => [layer.id, layer])),
    [layers],
  );
  const activeContents = useMemo(
    () => activeLayer ? resolveMapLayerContentsState(activeLayer) : null,
    [activeLayer],
  );
  const [filterField, setFilterField] = useState("");
  const [filterOperator, setFilterOperator] = useState<MapDefinitionFilterOperator>("equals");
  const [filterValue, setFilterValue] = useState("");
  const [minZoom, setMinZoom] = useState("");
  const [maxZoom, setMaxZoom] = useState("");

  useEffect(() => {
    if (!activeLayer || !activeContents) return;
    const filter = activeContents.definitionFilter;
    setFilterField(filter?.field ?? "");
    setFilterOperator(filter?.operator ?? "equals");
    setFilterValue(filter?.value ?? "");
    setMinZoom(activeContents.minZoom?.toString() ?? "");
    setMaxZoom(activeContents.maxZoom?.toString() ?? "");
  }, [activeContents, activeLayer]);

  if (!visible) return null;

  const updateContents = (
    layer: OverlayLayerConfig,
    patch: MapLayerContentsPatch,
  ): void => {
    const updated = setMapLayerContentsState(layer, patch);
    if (updated.metadata) {
      onUpdateLayer(layer.id, { metadata: updated.metadata });
    }
  };

  const toggleSelection = (layerId: string): void => {
    setSelectedLayerIds((current) => {
      const next = new Set(current);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const assignGroup = (): void => {
    const label = newGroupName.trim();
    if (!label || selectedLayerIds.size === 0) return;
    const id = `group-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "custom"}`;
    layers
      .filter((layer) => selectedLayerIds.has(layer.id))
      .forEach((layer) => updateContents(layer, { groupId: id, groupLabel: label }));
    setSelectedLayerIds(new Set());
  };

  const moveLayer = (layerId: string, direction: -1 | 1): void => {
    const currentIndex = layers.findIndex((layer) => layer.id === layerId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= layers.length) return;
    const orderedIds = layers.map((layer) => layer.id);
    const [moved] = orderedIds.splice(currentIndex, 1);
    if (!moved) return;
    orderedIds.splice(targetIndex, 0, moved);
    onReorderLayers(orderedIds);
  };

  const applyScaleRange = (): void => {
    if (!activeLayer) return;
    const nextMinZoom = parseOptionalZoom(minZoom);
    const nextMaxZoom = parseOptionalZoom(maxZoom);
    updateContents(activeLayer, {
      minZoom: nextMinZoom,
      maxZoom: nextMaxZoom,
    });
  };

  const applyFilter = (): void => {
    if (!activeLayer) return;
    const definitionFilter: MapLayerDefinitionFilter | undefined = filterField.trim() && filterValue.trim()
      ? { field: filterField.trim(), operator: filterOperator, value: filterValue.trim() }
      : undefined;
    updateContents(activeLayer, { definitionFilter });
  };

  const clearFilter = (): void => {
    if (!activeLayer) return;
    setFilterField("");
    setFilterValue("");
    updateContents(activeLayer, { definitionFilter: undefined });
  };

  const activeScale = activeLayer ? evaluateContentsScaleRange(activeLayer, zoom) : null;
  const activeFilterResult = activeLayer ? applyDefinitionFilterToLayer(activeLayer) : null;

  const embedded = presentation === "embedded";
  const activeRegistry = activeLayer ? normalizeLayerRegistryMetadata(activeLayer) : null;

  return (
    <section
      className={[styles.panel, embedded ? styles.embeddedPanel : null].filter(Boolean).join(" ")}
      role={embedded ? "region" : "dialog"}
      aria-label="Contents tree"
      data-testid="map-contents-tree"
      data-presentation={presentation}
    >
      {!embedded ? (
        <header className={styles.header}>
          <div>
            <h2><FolderTree size={15} /> Contents</h2>
            <p>Groups, scale visibility, filters and layer readiness</p>
          </div>
          <GisIconButton label="Close contents tree" icon={<X size={15} />} onClick={onClose} size="md" />
        </header>
      ) : null}

      <div className={styles.body}>
        <div className={styles.tree}>
          <div className={styles.groupBar}>
            <label>
              <span>Group selected layers</span>
              <input
                data-testid="contents-group-name"
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
              />
            </label>
            <button
              type="button"
              data-testid="contents-apply-group"
              onClick={assignGroup}
              disabled={selectedLayerIds.size === 0}
            >
              Group {selectedLayerIds.size > 0 ? selectedLayerIds.size : ""}
            </button>
          </div>

          <div className={styles.treeRail}>
            {groups.map((group) => {
              const groupLayers = group.layerIds
                .map((layerId) => layersById.get(layerId))
                .filter((layer): layer is OverlayLayerConfig => Boolean(layer));
              const visibleCount = groupLayers.filter((layer) => layer.visible).length;
              const filteredCount = groupLayers.filter((layer) => resolveMapLayerContentsState(layer).definitionFilter).length;
              const scaleLimitedCount = groupLayers.filter((layer) => {
                const contents = resolveMapLayerContentsState(layer);
                return contents.minZoom != null || contents.maxZoom != null;
              }).length;
              const outOfScaleCount = groupLayers.filter((layer) => !evaluateContentsScaleRange(layer, zoom).inRange).length;

              return (
                <section key={group.id} className={styles.group} data-testid={`contents-group-${group.id}`}>
                  <div className={styles.groupHeader}>
                    <h3><FolderTree size={12} /> {group.label}<small>{group.layerIds.length}</small></h3>
                    <div className={styles.groupStats} aria-label={`${group.label} group state`}>
                      <span>{visibleCount}/{groupLayers.length} visible</span>
                      <span>{scaleLimitedCount} scale</span>
                      <span>{filteredCount} filters</span>
                      {outOfScaleCount > 0 ? <span>{outOfScaleCount} out</span> : null}
                    </div>
                  </div>

                  <div className={styles.groupRows}>
                    {groupLayers.map((layer) => {
                      const contents = resolveMapLayerContentsState(layer);
                      const registry = normalizeLayerRegistryMetadata(layer);
                      const scale = evaluateContentsScaleRange(layer, zoom);
                      const warning = qaWarning(layer);
                      const active = activeLayer?.id === layer.id;
                      const filterSummary = contents.definitionFilter
                        ? formatDefinitionFilter(contents.definitionFilter)
                        : "No filter";
                      const filterResult = contents.definitionFilter ? applyDefinitionFilterToLayer(layer) : null;
                      const crsLabel = registry.crsSummary.status === "known"
                        ? registry.crsSummary.crs ?? "CRS known"
                        : "CRS missing";
                      const publicationLabel = publicationStatusLabel(registry.publicationReadiness.status);
                      const sourceLabel = registry.sourceKind === "derived" ? "analysis" : registry.sourceKind;

                      return (
                        <article
                          key={layer.id}
                          className={styles.row}
                          style={active ? mapStyles.sidePanelRowActive : undefined}
                          data-testid={`contents-layer-${layer.id}`}
                          data-active={active ? "true" : "false"}
                        >
                          <div className={styles.rowHead}>
                            <input
                              type="checkbox"
                              aria-label={`Select ${layer.name} for grouping`}
                              data-testid={`contents-select-${layer.id}`}
                              checked={selectedLayerIds.has(layer.id)}
                              onChange={() => toggleSelection(layer.id)}
                            />
                            <button
                              className={styles.visibility}
                              type="button"
                              aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`}
                              onClick={() => onToggleVisibility(layer.id)}
                            >
                              {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>
                            <button
                              className={styles.layerTitle}
                              type="button"
                              onClick={() => setActiveLayerId(layer.id)}
                              aria-label={`Activate ${layer.name}`}
                            >
                              <span>{layer.name}</span>
                              {active ? <strong>Active</strong> : null}
                            </button>
                            <div className={styles.rowActions} aria-label={`Actions for ${layer.name}`}>
                              <button type="button" onClick={() => moveLayer(layer.id, -1)} aria-label={`Move ${layer.name} up`}>
                                <GripVertical size={11} /> Up
                              </button>
                              <button type="button" onClick={() => moveLayer(layer.id, 1)} aria-label={`Move ${layer.name} down`}>
                                Down
                              </button>
                              <button type="button" data-testid={`contents-properties-${layer.id}`} onClick={() => onOpenProperties(layer.id)}>
                                Properties
                              </button>
                            </div>
                          </div>

                          <div className={styles.rowMeta}>
                            <GisStatusChip
                              status={sourceChipStatus(layer)}
                              label={sourceLabel}
                              density="compact"
                              className={styles.compactBadge}
                            />
                            <span className={styles.compactBadge}>{formatGeometrySummary(layer)}</span>
                            <GisStatusChip
                              status={registry.crsSummary.status === "known" ? "ready" : "blocked"}
                              label={crsLabel}
                              density="compact"
                              className={styles.compactBadge}
                            />
                            <GisStatusChip
                              status={qaChipStatus(registry.qaStatus)}
                              label={`QA ${registry.qaStatus}`}
                              density="compact"
                              className={styles.compactBadge}
                            />
                            <GisStatusChip
                              status={publicationChipStatus(registry.publicationReadiness.status)}
                              label={publicationLabel}
                              density="compact"
                              className={styles.compactBadge}
                              data-testid={`contents-pub-status-${layer.id}`}
                            />
                          </div>

                          <div className={styles.badges}>
                            <GisStatusChip
                              status={layer.visible && scale.inRange ? "ready" : "caveat"}
                              label={scale.inRange ? "In range" : "Out of scale"}
                              density="compact"
                              className={styles.scaleBadge}
                              data-testid={`contents-row-scale-${layer.id}`}
                            />
                            <span className={styles.scaleBadge}>{formatScaleRange(contents)}</span>
                            <span className={styles.filterBadge} data-testid={`contents-row-filter-${layer.id}`}>
                              {filterSummary}
                            </span>
                            {filterResult ? (
                              <span className={styles.compactBadge}>
                                {filterResult.filteredFeatureCount ?? "?"}/{filterResult.totalFeatureCount ?? "?"} features
                              </span>
                            ) : null}
                            <span>{contents.selectable ? "Selectable" : "Locked select"}</span>
                            <span>{contents.editable ? "Editable" : "Read only"}</span>
                          </div>

                          {warning ? (
                            <p className={styles.warning}><AlertTriangle size={11} /> {warning}</p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {layers.length === 0 ? (
            <GisEmptyState
              icon={<FolderTree size={20} />}
              title="No layers"
              description="Add a layer to begin building the contents tree."
              compact
            />
          ) : null}
        </div>

        <aside className={styles.properties}>
          {activeLayer && activeContents && activeRegistry ? (
            <>
              <div className={styles.propertyHeader}>
                <span className={styles.propertyEyebrow}>Selected layer</span>
                <h3>{activeLayer.name}</h3>
                <span>{activeContents.groupLabel} / {activeRegistry.sourceKind}</span>
              </div>

              <div className={styles.readinessGrid} data-testid="contents-active-readiness">
                <div className={styles.readinessCell}>
                  <span>Source</span>
                  <strong>{activeRegistry.sourceKind}</strong>
                </div>
                <div className={styles.readinessCell}>
                  <span>Geometry</span>
                  <strong>{formatGeometrySummary(activeLayer)}</strong>
                </div>
                <div className={styles.readinessCell}>
                  <span>CRS</span>
                  <strong>{activeRegistry.crsSummary.crs ?? activeRegistry.crsSummary.status}</strong>
                </div>
                <div className={styles.readinessCell}>
                  <span>QA</span>
                  <strong>{activeRegistry.qaStatus}</strong>
                </div>
                <div className={styles.readinessCell}>
                  <span>Publish</span>
                  <strong>{publicationStatusLabel(activeRegistry.publicationReadiness.status)}</strong>
                </div>
                <div className={styles.readinessCell}>
                  <span>Scale</span>
                  <strong>{formatScaleRange(activeContents)}</strong>
                </div>
                <div className={styles.readinessCell}>
                  <span>Filter</span>
                  <strong>{activeContents.definitionFilter ? formatDefinitionFilter(activeContents.definitionFilter) : "No filter"}</strong>
                </div>
              </div>

              <div className={styles.indicators}>
                <button
                  type="button"
                  data-testid="contents-toggle-selectable"
                  onClick={() => updateContents(activeLayer, { selectable: !activeContents.selectable })}
                >
                  <SquareMousePointer size={12} /> {activeContents.selectable ? "Selectable" : "Not selectable"}
                </button>
                <button
                  type="button"
                  data-testid="contents-toggle-editable"
                  onClick={() => updateContents(activeLayer, { editable: !activeContents.editable })}
                >
                  {activeContents.editable ? "Editable" : "Read only"}
                </button>
              </div>

              <fieldset className={styles.fieldset}>
                <legend>Scale Range</legend>
                <div className={styles.twoFields}>
                  <label>
                    <span>Min zoom</span>
                    <input data-testid="contents-min-zoom" value={minZoom} onChange={(event) => setMinZoom(event.target.value)} placeholder="none" />
                  </label>
                  <label>
                    <span>Max zoom</span>
                    <input data-testid="contents-max-zoom" value={maxZoom} onChange={(event) => setMaxZoom(event.target.value)} placeholder="none" />
                  </label>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" data-testid="contents-apply-scale" onClick={applyScaleRange}>Apply scale range</button>
                  <span className={styles.scaleSummary}>{formatScaleRange(activeContents)}</span>
                </div>
                <p className={activeScale?.inRange ? styles.muted : styles.warningText}>
                  Current zoom {zoom.toFixed(1)}: {activeScale?.inRange ? "layer draws at this scale." : activeScale?.reason}
                </p>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend><SlidersHorizontal size={11} /> Definition Filter</legend>
                <label>
                  <span>Field</span>
                  <input data-testid="contents-filter-field" value={filterField} onChange={(event) => setFilterField(event.target.value)} placeholder="zone" />
                </label>
                <div className={styles.twoFields}>
                  <label>
                    <span>Operator</span>
                    <select
                      data-testid="contents-filter-operator"
                      value={filterOperator}
                      onChange={(event) => setFilterOperator(event.target.value as MapDefinitionFilterOperator)}
                    >
                      <option value="equals">equals</option>
                      <option value="not-equals">not equals</option>
                      <option value="contains">contains</option>
                      <option value="greater-than">greater than</option>
                      <option value="less-than">less than</option>
                    </select>
                  </label>
                  <label>
                    <span>Value</span>
                    <input data-testid="contents-filter-value" value={filterValue} onChange={(event) => setFilterValue(event.target.value)} />
                  </label>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" data-testid="contents-apply-filter" onClick={applyFilter}>Apply filter</button>
                  <button type="button" onClick={clearFilter}>Clear</button>
                </div>
                {activeContents.definitionFilter ? (
                  <p className={styles.muted} data-testid="contents-filter-summary">
                    {formatDefinitionFilter(activeContents.definitionFilter)}; showing {activeFilterResult?.filteredFeatureCount ?? "unknown"} of {activeFilterResult?.totalFeatureCount ?? "unknown"} features.
                  </p>
                ) : (
                  <p className={styles.muted}>No definition filter is applied.</p>
                )}
              </fieldset>

              <div className={styles.footerActions}>
                <button type="button" data-testid="contents-duplicate" onClick={() => onDuplicateLayer(activeLayer)}>
                  <Copy size={12} /> Duplicate
                </button>
                <button type="button" data-testid="contents-repair" onClick={() => onRepairSource(activeLayer)}>
                  <Wrench size={12} /> Repair source
                </button>
                <button type="button" onClick={() => onOpenProperties(activeLayer.id)}>Properties</button>
              </div>
            </>
          ) : (
            <p className={styles.empty}>Select a layer to inspect contents properties.</p>
          )}
        </aside>
      </div>
    </section>
  );
};
