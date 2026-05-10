import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./datasetLibrary.module.css";
import { downloadText } from "../../centerpanel/lib/download";
import {
  buildTeachingDatasetSyllabusBrief,
  describeFieldType,
  getDatasetPackageDataTypes,
  getDatasetPackageFieldNames,
  getDataTypeLabel,
  getTeachingDatasetLibrary,
  getTeachingDatasetManifestFilename,
  getTeachingDatasetSyllabusBriefFilename,
  getThemeLabel,
  serializeTeachingDatasetManifest,
  TEACHING_DATASET_DATA_TYPE_LABELS,
  TEACHING_DATASET_THEME_LABELS,
  type TeachingDatasetDataType,
  type TeachingDatasetId,
  type TeachingDatasetPackage,
  type TeachingDatasetTheme,
  validateTeachingDatasetPackage,
} from "../../services/data/datasetLibrary";

export interface DatasetLibraryBrowserProps {
  onLoadDataset: (datasetId: TeachingDatasetId) => void | Promise<void>;
  loadingDatasetId?: TeachingDatasetId | null;
  introTitle?: string;
  introText?: string;
  testIdPrefix?: string;
}

const ALL_THEMES = Object.keys(TEACHING_DATASET_THEME_LABELS) as TeachingDatasetTheme[];
const ALL_DATA_TYPES = Object.keys(TEACHING_DATASET_DATA_TYPE_LABELS) as TeachingDatasetDataType[];

function formatBounds(bounds: [number, number, number, number]): string {
  return `${bounds[0].toFixed(3)}, ${bounds[1].toFixed(3)} -> ${bounds[2].toFixed(3)}, ${bounds[3].toFixed(3)}`;
}

function projectCoordinate(
  lng: number,
  lat: number,
  bounds: [number, number, number, number],
): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const width = maxLng - minLng || 1;
  const height = maxLat - minLat || 1;
  const x = 10 + ((lng - minLng) / width) * 100;
  const y = 8 + (1 - (lat - minLat) / height) * 64;
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

function linePath(
  coordinates: number[][],
  bounds: [number, number, number, number],
): string {
  return coordinates
    .map(([lng, lat], index) => {
      const [x, y] = projectCoordinate(lng, lat, bounds);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function polygonPath(
  coordinates: number[][],
  bounds: [number, number, number, number],
): string {
  return linePath(coordinates, bounds).concat(" Z");
}

function DatasetExtentThumbnail({ dataset }: { dataset: TeachingDatasetPackage }): React.ReactElement {
  const bounds = dataset.spatialExtent.bounds;
  const polygonLayer = dataset.layers.find((layer) => layer.dataType === "polygon");
  const lineLayer = dataset.layers.find((layer) => layer.dataType === "line");
  const pointLayer = dataset.layers.find((layer) => layer.dataType === "point");

  return (
    <div className={styles.thumbWrap} aria-hidden="true">
      <svg viewBox="0 0 120 80" width="100%" height="160" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`thumb-bg-${dataset.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(245,158,11,0.26)" />
            <stop offset="100%" stopColor="rgba(17,24,39,0.12)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="120" height="80" fill={`url(#thumb-bg-${dataset.id})`} />
        <rect x="8" y="8" width="104" height="64" rx="14" fill="rgba(15,23,42,0.52)" stroke="rgba(255,255,255,0.08)" />
        {polygonLayer?.featureCollection.features.map((feature) => {
          if (feature.geometry?.type !== "Polygon") {
            return null;
          }
          return (
            <path
              key={String(feature.properties?.zone_id ?? Math.random())}
              d={polygonPath(feature.geometry.coordinates[0] as number[][], bounds)}
              fill="rgba(34,197,94,0.18)"
              stroke="rgba(74,222,128,0.48)"
              strokeWidth="1.2"
            />
          );
        })}
        {lineLayer?.featureCollection.features.map((feature) => {
          if (feature.geometry?.type !== "LineString") {
            return null;
          }
          return (
            <path
              key={String(feature.properties?.corridor_id ?? Math.random())}
              d={linePath(feature.geometry.coordinates as number[][], bounds)}
              fill="none"
              stroke="rgba(245,158,11,0.85)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
        {pointLayer?.featureCollection.features.map((feature) => {
          if (feature.geometry?.type !== "Point") {
            return null;
          }
          const [x, y] = projectCoordinate(feature.geometry.coordinates[0], feature.geometry.coordinates[1], bounds);
          return (
            <circle
              key={String(feature.properties?.hub_id ?? Math.random())}
              cx={x}
              cy={y}
              r="2.8"
              fill="rgba(96,165,250,0.96)"
              stroke="rgba(255,255,255,0.74)"
              strokeWidth="0.9"
            />
          );
        })}
      </svg>
    </div>
  );
}

function countFeatures(dataset: TeachingDatasetPackage): number {
  return dataset.layers.reduce((sum, layer) => sum + layer.featureCollection.features.length, 0);
}

function matchesDataset(
  dataset: TeachingDatasetPackage,
  query: string,
  themeFilter: TeachingDatasetTheme | "all",
  dataTypeFilter: TeachingDatasetDataType | "all",
): boolean {
  if (themeFilter !== "all" && !dataset.thematicCoverage.includes(themeFilter)) {
    return false;
  }

  const packageDataTypes = getDatasetPackageDataTypes(dataset);
  if (dataTypeFilter !== "all" && !packageDataTypes.includes(dataTypeFilter)) {
    return false;
  }

  if (!query.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();
  const haystack = [
    dataset.city,
    dataset.title,
    dataset.summary,
    dataset.region,
    dataset.source,
    dataset.spatialExtent.label,
    ...dataset.searchTerms,
    ...dataset.layers.map((layer) => layer.title),
    ...dataset.layers.flatMap((layer) => layer.schemaSummary.map((field) => field.name)),
    ...dataset.thematicCoverage.map((theme) => getThemeLabel(theme)),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export const DatasetLibraryBrowser: React.FC<DatasetLibraryBrowserProps> = ({
  onLoadDataset,
  loadingDatasetId = null,
  introTitle = "Pre-loaded Teaching Dataset Library",
  introText = "Browse curated city packages, inspect source and schema metadata, then load a validated teaching dataset into the workspace with one click.",
  testIdPrefix = "dataset-library",
}) => {
  const datasets = useMemo(() => getTeachingDatasetLibrary(), []);
  const [query, setQuery] = useState("");
  const [themeFilter, setThemeFilter] = useState<TeachingDatasetTheme | "all">("all");
  const [dataTypeFilter, setDataTypeFilter] = useState<TeachingDatasetDataType | "all">("all");
  const [selectedDatasetId, setSelectedDatasetId] = useState<TeachingDatasetId>(datasets[0]?.id ?? "new_york_city");
  const [selectedLayerId, setSelectedLayerId] = useState<string>(datasets[0]?.layers[0]?.id ?? "");

  const visibleDatasets = useMemo(
    () => datasets.filter((dataset) => matchesDataset(dataset, query, themeFilter, dataTypeFilter)),
    [dataTypeFilter, datasets, query, themeFilter],
  );

  useEffect(() => {
    if (visibleDatasets.some((dataset) => dataset.id === selectedDatasetId)) {
      return;
    }
    const next = visibleDatasets[0];
    if (next) {
      setSelectedDatasetId(next.id);
      setSelectedLayerId(next.layers[0]?.id ?? "");
    }
  }, [selectedDatasetId, visibleDatasets]);

  const selectedDataset = useMemo(
    () => visibleDatasets.find((dataset) => dataset.id === selectedDatasetId) ?? visibleDatasets[0] ?? null,
    [selectedDatasetId, visibleDatasets],
  );

  useEffect(() => {
    if (!selectedDataset) {
      return;
    }
    if (selectedDataset.layers.some((layer) => layer.id === selectedLayerId)) {
      return;
    }
    setSelectedLayerId(selectedDataset.layers[0]?.id ?? "");
  }, [selectedDataset, selectedLayerId]);

  const selectedLayer = useMemo(
    () => selectedDataset?.layers.find((layer) => layer.id === selectedLayerId) ?? selectedDataset?.layers[0] ?? null,
    [selectedDataset, selectedLayerId],
  );
  const selectedValidation = useMemo(
    () => (selectedDataset ? validateTeachingDatasetPackage(selectedDataset) : null),
    [selectedDataset],
  );
  const selectedDatasetFieldCount = useMemo(
    () => (selectedDataset ? getDatasetPackageFieldNames(selectedDataset).length : 0),
    [selectedDataset],
  );

  const totalFeatures = useMemo(() => datasets.reduce((sum, dataset) => sum + countFeatures(dataset), 0), [datasets]);
  const handleDownloadManifest = useCallback((dataset: TeachingDatasetPackage) => {
    downloadText(
      getTeachingDatasetManifestFilename(dataset),
      serializeTeachingDatasetManifest(dataset),
      "application/json;charset=utf-8",
    );
  }, []);
  const handleDownloadTeachingBrief = useCallback((dataset: TeachingDatasetPackage) => {
    downloadText(
      getTeachingDatasetSyllabusBriefFilename(dataset),
      buildTeachingDatasetSyllabusBrief(dataset),
      "text/markdown;charset=utf-8",
    );
  }, []);

  return (
    <div className={styles.root} data-testid={`${testIdPrefix}-root`}>
      <section className={styles.introCard}>
        <div className={styles.eyebrow}>Prompt 30 · Teaching dataset library</div>
        <div className={styles.introTitle}>{introTitle}</div>
        <div className={styles.introText}>{introText}</div>
        <div className={styles.topMetaRow}>
          <span className={styles.metaPill}>{datasets.length} city packs</span>
          <span className={styles.metaPill}>{totalFeatures.toLocaleString()} total bundled features</span>
          <span className={styles.metaPill}>CRS-validated at import time</span>
          <span className={styles.metaPill}>Schema summaries included</span>
        </div>
      </section>

      <section className={styles.controlShell}>
        <div className={styles.controlRow}>
          <label className={styles.label}>
            Search dataset library
            <input
              type="search"
              className={styles.input}
              placeholder="Search city, theme, schema field, or source"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className={styles.filterWrap}>
            <label className={styles.label}>
              Filter by primary data type
              <select
                className={styles.select}
                value={dataTypeFilter}
                onChange={(event) => setDataTypeFilter(event.target.value as TeachingDatasetDataType | "all")}
              >
                <option value="all">All data types</option>
                {ALL_DATA_TYPES.map((dataType) => (
                  <option key={dataType} value={dataType}>
                    {getDataTypeLabel(dataType)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div>
          <div className={styles.label}>Filter by theme</div>
          <div className={styles.filterGroup}>
            <button
              type="button"
              className={`${styles.filterChip} ${themeFilter === "all" ? styles.filterChipActive : ""}`}
              onClick={() => setThemeFilter("all")}
            >
              All themes
            </button>
            {ALL_THEMES.map((theme) => (
              <button
                key={theme}
                type="button"
                className={`${styles.filterChip} ${themeFilter === theme ? styles.filterChipActive : ""}`}
                onClick={() => setThemeFilter(theme)}
              >
                {getThemeLabel(theme)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.countText}>{visibleDatasets.length} matching packages ready to inspect and load.</div>
      </section>

      <div className={styles.layout}>
        <div className={styles.grid}>
          {visibleDatasets.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.detailTitle}>No teaching datasets match the current filters.</div>
              <div className={styles.detailSummary}>Clear one or more filters to restore the bundled city packs.</div>
            </div>
          ) : (
            visibleDatasets.map((dataset) => {
              const dataTypes = getDatasetPackageDataTypes(dataset);
              const isActive = dataset.id === selectedDataset?.id;
              return (
                <div
                  key={dataset.id}
                  data-testid={`${testIdPrefix}-card-${dataset.id}`}
                  className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedDatasetId(dataset.id);
                    setSelectedLayerId(dataset.layers[0]?.id ?? "");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedDatasetId(dataset.id);
                      setSelectedLayerId(dataset.layers[0]?.id ?? "");
                    }
                  }}
                >
                  <DatasetExtentThumbnail dataset={dataset} />
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.cardTitle}>{dataset.city}</div>
                      <div className={styles.cardSummary}>{dataset.summary}</div>
                    </div>
                    <span className={styles.cityBadge}>{dataset.region}</span>
                  </div>

                  <div className={styles.statGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Layers</div>
                      <div className={styles.statValue}>{dataset.layers.length}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>Features</div>
                      <div className={styles.statValue}>{countFeatures(dataset)}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>CRS</div>
                      <div className={styles.statValue}>{dataset.crs}</div>
                    </div>
                  </div>

                  <div className={styles.tagRow}>
                    {dataset.thematicCoverage.map((theme) => (
                      <span key={`${dataset.id}-${theme}`} className={styles.tag}>
                        {getThemeLabel(theme)}
                      </span>
                    ))}
                    {dataTypes.map((dataType) => (
                      <span key={`${dataset.id}-${dataType}`} className={styles.tag}>
                        {getDataTypeLabel(dataType)}
                      </span>
                    ))}
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={`${styles.button} ${loadingDatasetId === dataset.id ? styles.buttonDisabled : ""}`}
                      data-testid={`${testIdPrefix}-load-${dataset.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void onLoadDataset(dataset.id);
                      }}
                      disabled={loadingDatasetId === dataset.id}
                    >
                      {loadingDatasetId === dataset.id ? "Loading dataset..." : "Load Dataset"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedDatasetId(dataset.id);
                        setSelectedLayerId(dataset.layers[0]?.id ?? "");
                      }}
                    >
                      Inspect Metadata
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedDataset ? (
          <aside className={styles.detailPanel} aria-label="Dataset metadata inspection panel">
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.eyebrow}>Metadata inspection</div>
                <div className={styles.detailTitle}>{selectedDataset.title}</div>
                <div className={styles.detailSummary}>{selectedDataset.summary}</div>
              </div>
              <button
                type="button"
                className={`${styles.button} ${loadingDatasetId === selectedDataset.id ? styles.buttonDisabled : ""}`}
                onClick={() => {
                  void onLoadDataset(selectedDataset.id);
                }}
                disabled={loadingDatasetId === selectedDataset.id}
              >
                {loadingDatasetId === selectedDataset.id ? "Loading dataset..." : "Load Dataset"}
              </button>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Source</div>
                <div className={styles.metaValue}>{selectedDataset.source}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>License</div>
                <div className={styles.metaValue}>{selectedDataset.license}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Update Date</div>
                <div className={styles.metaValue}>{selectedDataset.updateDate}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Spatial Extent</div>
                <div className={styles.metaValue}>{selectedDataset.spatialExtent.label}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>Bounds</div>
                <div className={styles.metaValue}>{formatBounds(selectedDataset.spatialExtent.bounds)}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>CRS</div>
                <div className={styles.metaValue}>{selectedDataset.crs}</div>
              </div>
            </div>

            <div>
              <div className={styles.metaLabel}>Thematic Coverage</div>
              <div className={styles.tagRow}>
                {selectedDataset.thematicCoverage.map((theme) => (
                  <span key={`${selectedDataset.id}-${theme}-detail`} className={styles.tag}>
                    {getThemeLabel(theme)}
                  </span>
                ))}
              </div>
            </div>

            <section className={styles.exportPanel} aria-label="Teaching dataset exports and quality controls">
              <div className={styles.exportHeader}>
                <div>
                  <div className={styles.metaLabel}>Scientific package exports</div>
                  <div className={styles.detailSummary}>
                    Download a machine-readable manifest or a syllabus-ready teaching brief with provenance,
                    schema contracts, and methodological cautions.
                  </div>
                </div>
              </div>

              <div className={styles.exportMetaGrid}>
                <div className={styles.exportMetaCard}>
                  <div className={styles.metaLabel}>Validated layers</div>
                  <div className={styles.metaValue}>{selectedValidation?.layerReports.length ?? selectedDataset.layers.length}</div>
                </div>
                <div className={styles.exportMetaCard}>
                  <div className={styles.metaLabel}>Declared fields</div>
                  <div className={styles.metaValue}>{selectedDatasetFieldCount}</div>
                </div>
                <div className={styles.exportMetaCard}>
                  <div className={styles.metaLabel}>Warnings</div>
                  <div className={styles.metaValue}>{selectedValidation?.warnings.length ?? 0}</div>
                </div>
              </div>

              <div className={styles.downloadButtonRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  data-testid={`${testIdPrefix}-manifest-${selectedDataset.id}`}
                  onClick={() => handleDownloadManifest(selectedDataset)}
                >
                  Download Manifest JSON
                </button>
                <button
                  type="button"
                  className={styles.button}
                  data-testid={`${testIdPrefix}-brief-${selectedDataset.id}`}
                  onClick={() => handleDownloadTeachingBrief(selectedDataset)}
                >
                  Download Teaching Brief
                </button>
              </div>

              <div className={styles.exportNote}>
                Manifest exports include validation reports and layer contracts. Teaching brief exports a
                syllabus-friendly Markdown handout for scientific instruction and critique.
              </div>
            </section>

            <div>
              <div className={styles.metaLabel}>Layer Inventory</div>
              <div className={styles.layerList}>
                {selectedDataset.layers.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`${styles.layerButton} ${selectedLayer?.id === layer.id ? styles.layerButtonActive : ""}`}
                    onClick={() => setSelectedLayerId(layer.id)}
                  >
                    <strong>{layer.title}</strong>
                    <div className={styles.layerMeta}>{layer.summary}</div>
                    <div className={styles.tagRow}>
                      <span className={styles.tag}>{getDataTypeLabel(layer.dataType)}</span>
                      <span className={styles.tag}>{layer.featureCollection.features.length} features</span>
                      {layer.thematicCoverage.map((theme) => (
                        <span key={`${layer.id}-${theme}`} className={styles.tag}>
                          {getThemeLabel(theme)}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedLayer ? (
              <div>
                <div className={styles.detailHeader}>
                  <div>
                    <div className={styles.metaLabel}>Schema Summary</div>
                    <div className={styles.detailSummary}>{selectedLayer.title} schema and import contract.</div>
                  </div>
                </div>
                <table className={styles.schemaTable}>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLayer.schemaSummary.map((field) => (
                      <tr key={`${selectedLayer.id}-${field.name}`}>
                        <td>{field.name}</td>
                        <td>{describeFieldType(field.type)}{field.unit ? ` (${field.unit})` : ""}</td>
                        <td>{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
};

export default DatasetLibraryBrowser;