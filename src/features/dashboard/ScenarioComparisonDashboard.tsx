import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFlowStore } from "@/stores/useFlowStore";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import styles from "@/centerpanel/styles/flows.module.css";
import {
  SCENARIO_LEVERS,
  type ScenarioAlternativeResult,
  type ScenarioComparisonResult,
  type ScenarioMetricAggregate,
  type ScenarioMetricId,
  type ScenarioObjective,
  type ScenarioParameters,
} from "@/engine/simulation";
import {
  buildImportedScenarioFromRun,
  buildScenarioComparisonNarrativeText,
  buildScenarioComparisonResult,
  buildScenarioComparisonSummaryText,
  createEmptyScenario,
  DEFAULT_SCENARIO_COMPARISON_FORM,
  SCENARIO_COMPARISON_FORM_KEY,
  SCENARIO_COMPARISON_RESULT_KEY,
  type ScenarioComparisonForm,
  type ScenarioFormScenario,
} from "@/centerpanel/Flows/scenarioComparisonShared";
import {
  downloadJSON,
  exportFlowJSON,
  restoreFormState,
} from "@/centerpanel/Flows/flowUtils";
import {
  buildScenarioChartDataExport,
  buildScenarioComparisonCompletedRun,
  buildScenarioDeltaCsv,
  buildScenarioDeltaLayer,
  buildScenarioParallelSeries,
  buildScenarioRadarSeries,
  type ScenarioDeltaMode,
  scenarioStroke,
  slugifyScenarioComparisonOutput,
} from "@/centerpanel/Flows/scenarioComparisonArtifacts";

export interface ScenarioComparisonDashboardProps {
  title?: string;
  subtitle?: string;
  result: ScenarioComparisonResult | null;
  activeScenarioId?: string | null;
  onActiveScenarioChange?: (scenarioId: string) => void;
  activeMetricId?: ScenarioMetricId;
  onActiveMetricChange?: (metricId: ScenarioMetricId) => void;
  deltaMode?: ScenarioDeltaMode;
  onDeltaModeChange?: (mode: ScenarioDeltaMode) => void;
  onExportSummary?: () => void;
  onExportDeltaData?: () => void;
  onExportCharts?: () => void;
  onAddLayerToMap?: () => void;
  footerNote?: React.ReactNode;
}

type HoverState = {
  title: string;
  value: string;
  detail?: string;
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 10,
};

const chartGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
};

const scoreCardStyle: React.CSSProperties = {
  border: "1px solid var(--syn-overlay-light)",
  borderRadius: 8,
  padding: 12,
  background: "var(--syn-overlay-whisper)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatSigned(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatDelta(value: number | null | undefined, mode: ScenarioDeltaMode): string {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }
  return mode === "percent"
    ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
    : `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function colorFromImprovement(value: number): string {
  const normalized = clamp((value + 18) / 36, 0, 1);
  const red = Math.round(214 - normalized * 122);
  const green = Math.round(58 + normalized * 126);
  const blue = Math.round(79 - normalized * 32);
  return `rgba(${red}, ${green}, ${blue}, 0.88)`;
}

function collectBounds(featureCollection: GeoJSON.FeatureCollection): [number, number, number, number] {
  const coordinates = featureCollection.features.flatMap((feature) => {
    if (!feature.geometry) {
      return [] as number[][];
    }
    if (feature.geometry.type === "Polygon") {
      return feature.geometry.coordinates.flat();
    }
    if (feature.geometry.type === "MultiPolygon") {
      return feature.geometry.coordinates.flat(2);
    }
    return [] as number[][];
  });

  if (coordinates.length === 0) {
    return [0, 0, 1, 1];
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ];
}

function projectPoint(
  longitude: number,
  latitude: number,
  bounds: [number, number, number, number],
  width: number,
  height: number,
) {
  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bounds;
  const x = ((longitude - minLongitude) / Math.max(maxLongitude - minLongitude, 0.0001)) * width;
  const y = height - ((latitude - minLatitude) / Math.max(maxLatitude - minLatitude, 0.0001)) * height;
  return { x, y };
}

function geometryToSvgPath(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  bounds: [number, number, number, number],
  width: number,
  height: number,
): string {
  const ringToPath = (ring: number[][]): string => `${ring.map(([longitude, latitude], index) => {
    const point = projectPoint(longitude, latitude, bounds, width, height);
    return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
  }).join(" ")} Z`;

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToPath(ring)).join(" ");
  }

  return geometry.coordinates.map((polygon) => polygon.map((ring) => ringToPath(ring)).join(" ")).join(" ");
}

function geometryCenter(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) {
  const coordinates = geometry.type === "Polygon"
    ? geometry.coordinates.flat()
    : geometry.coordinates.flat(2);
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return {
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  };
}

function getScenarioById(result: ScenarioComparisonResult, scenarioId?: string | null): ScenarioAlternativeResult | null {
  return result.scenarios.find((scenario) => scenario.scenarioId === scenarioId) ?? result.scenarios[0] ?? null;
}

function getMetricAggregate(scenario: ScenarioAlternativeResult, metricId: ScenarioMetricId): ScenarioMetricAggregate {
  return scenario.metrics.find((metric) => metric.metricId === metricId) ?? scenario.metrics[0]!;
}

function valueNote(direction: ScenarioObjective): string {
  return direction === "maximize" ? "Higher is better" : "Lower is better";
}

export const ScenarioComparisonDashboard: React.FC<ScenarioComparisonDashboardProps> = ({
  title = "Scenario Comparison Dashboard",
  subtitle = "Baseline, multi-scenario deltas, radar, parallel coordinates, and Pareto-aware trade-off review.",
  result,
  activeScenarioId,
  onActiveScenarioChange,
  activeMetricId,
  onActiveMetricChange,
  deltaMode = "absolute",
  onDeltaModeChange,
  onExportSummary,
  onExportDeltaData,
  onExportCharts,
  onAddLayerToMap,
  footerNote,
}) => {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [highlightedSeriesId, setHighlightedSeriesId] = useState<string | null>(null);

  const selectedScenario = useMemo(
    () => (result ? getScenarioById(result, activeScenarioId) : null),
    [activeScenarioId, result],
  );

  const selectedMetric = useMemo(() => {
    if (!result) {
      return null;
    }
    return result.metricDefinitions.find((metric) => metric.id === activeMetricId)
      ?? result.metricDefinitions[0]
      ?? null;
  }, [activeMetricId, result]);

  useEffect(() => {
    if (!result || !selectedScenario || !onActiveScenarioChange) {
      return;
    }
    if (activeScenarioId !== selectedScenario.scenarioId) {
      onActiveScenarioChange(selectedScenario.scenarioId);
    }
  }, [activeScenarioId, onActiveScenarioChange, result, selectedScenario]);

  useEffect(() => {
    if (!result || !selectedMetric || !onActiveMetricChange) {
      return;
    }
    if (activeMetricId !== selectedMetric.id) {
      onActiveMetricChange(selectedMetric.id);
    }
  }, [activeMetricId, onActiveMetricChange, result, selectedMetric]);

  if (!result || !selectedScenario || !selectedMetric) {
    return (
      <section className={styles.panel}>
        <header className={styles.flowHeader}>
          <div className={styles.flowTitleRow}>
            <div className={styles.flowTitleMain}>{title}</div>
          </div>
          <div className={styles.flowSubtitle}>{subtitle}</div>
        </header>
        <div className={styles.stepContentCard}>
          <div className={styles.stepCardTitle}>No scenario comparison result yet</div>
          <div className={styles.formHint}>
            Open the Scenario Comparison workflow, configure at least two alternatives, and run a calculation to populate this dashboard module.
          </div>
          {footerNote}
        </div>
      </section>
    );
  }

  const deltaLayer = buildScenarioDeltaLayer(result, selectedScenario.scenarioId, selectedMetric.id, deltaMode);
  const deltaCollection = (deltaLayer.sourceData as GeoJSON.FeatureCollection | undefined) ?? { type: "FeatureCollection", features: [] };
  const bounds = collectBounds(deltaCollection);
  const radarSeries = buildScenarioRadarSeries(result);
  const parallelSeries = buildScenarioParallelSeries(result);
  const selectedMetricAggregate = getMetricAggregate(selectedScenario, selectedMetric.id);

  return (
    <section className={styles.panel}>
      <header className={styles.flowHeader}>
        <div className={styles.flowTitleRow}>
          <div className={styles.flowTitleMain}>{title}</div>
          <div className={styles.flowTitleMeta}>{result.scenarios.length} alternatives</div>
        </div>
        <div className={styles.flowSubtitle}>{subtitle}</div>
      </header>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Scenario layout and scorecards</div>
        <div style={gridStyle}>
          <div style={scoreCardStyle}>
            <div className={styles.formLabel}>{result.baselineName}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "var(--syn-text-primary)" }}>
              {result.baselineCompositeScore.toFixed(1)}
            </div>
            <div className={styles.formHint}>Normalized baseline composite on aligned metrics.</div>
          </div>
          {result.scenarios.map((scenario) => {
            const strongest = [...scenario.metrics].sort((left, right) => right.improvementDelta - left.improvementDelta)[0]!;
            return (
              <button
                key={scenario.scenarioId}
                type="button"
                onClick={() => onActiveScenarioChange?.(scenario.scenarioId)}
                style={{
                  ...scoreCardStyle,
                  cursor: "pointer",
                  textAlign: "left",
                  borderColor: scenario.scenarioId === selectedScenario.scenarioId ? "var(--syn-accent-primary)" : "var(--syn-overlay-light)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div className={styles.formLabel}>{scenario.name}</div>
                  {scenario.paretoCandidate ? (
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--syn-success-bg)",
                      border: "1px solid var(--syn-success-border)",
                      color: "var(--syn-text-success)",
                      fontSize: 10,
                      fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)",
                    }}>
                      Pareto
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, color: scenarioStroke(result.scenarios.findIndex((entry) => entry.scenarioId === scenario.scenarioId)) }}>
                  {scenario.compositeScore.toFixed(1)}
                </div>
                <div className={styles.formHint}>
                  Mean improvement {formatSigned(scenario.meanImprovement)}. Strongest gain: {strongest.label} ({formatSigned(strongest.improvementDelta)}).
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Delta map and controls</div>
        <div style={controlRowStyle}>
          <select
            className={styles.textInput}
            value={selectedScenario.scenarioId}
            onChange={(event) => onActiveScenarioChange?.(event.target.value)}
            style={{ width: 220 }}
          >
            {result.scenarios.map((scenario) => (
              <option key={scenario.scenarioId} value={scenario.scenarioId}>
                {scenario.name}
              </option>
            ))}
          </select>
          <select
            className={styles.textInput}
            value={selectedMetric.id}
            onChange={(event) => onActiveMetricChange?.(event.target.value as ScenarioMetricId)}
            style={{ width: 220 }}
          >
            {result.metricDefinitions.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={() => onDeltaModeChange?.("absolute")}
            style={{ borderColor: deltaMode === "absolute" ? "var(--syn-accent-primary)" : undefined }}
          >
            Absolute
          </button>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={() => onDeltaModeChange?.("percent")}
            style={{ borderColor: deltaMode === "percent" ? "var(--syn-accent-primary)" : undefined }}
          >
            Percent
          </button>
          {onAddLayerToMap ? (
            <button type="button" className={styles.outlineBtn} onClick={onAddLayerToMap}>Add delta layer to map</button>
          ) : null}
          {onExportDeltaData ? (
            <button type="button" className={styles.outlineBtn} onClick={onExportDeltaData}>Export delta data</button>
          ) : null}
        </div>
        <div className={styles.formHint}>
          {selectedMetric.label}: {valueNote(selectedMetric.direction)}. Current scenario delta {formatDelta(deltaMode === "percent" ? selectedMetricAggregate.percentDelta : selectedMetricAggregate.absoluteDelta, deltaMode)} versus {result.baselineName}.
        </div>
        <div style={{ border: "1px solid var(--syn-overlay-light)", borderRadius: 8, background: "rgba(0,0,0,0.14)", padding: 8 }}>
          <svg viewBox="0 0 360 220" style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x="0" y="0" width="360" height="220" fill="rgba(255,255,255,0.02)" rx="8" />
            {deltaCollection.features.map((feature, index) => {
              const geometry = feature.geometry;
              if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) {
                return null;
              }
              const path = geometryToSvgPath(geometry, bounds, 340, 180);
              const center = geometryCenter(geometry);
              const point = projectPoint(center.longitude, center.latitude, bounds, 340, 180);
              const rawDisplayValue = feature.properties?.display_value;
              const displayValue = typeof rawDisplayValue === "number" ? rawDisplayValue : 0;
              const improvementValue = typeof feature.properties?.improvement_delta === "number" ? feature.properties.improvement_delta : 0;
              const unitLabel = String(feature.properties?.unit_label ?? `Unit ${index + 1}`);
              return (
                <g key={String(feature.id ?? unitLabel)} transform="translate(10 20)">
                  <path
                    d={path}
                    fill={colorFromImprovement(improvementValue)}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth={1}
                    onMouseEnter={() => setHover({ title: unitLabel, value: formatDelta(displayValue, deltaMode), detail: `${selectedMetric.label} delta` })}
                    onMouseLeave={() => setHover(null)}
                  />
                  <text x={point.x} y={point.y} textAnchor="middle" style={{ fill: "#FAFAF9", fontSize: 10, fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)" }}>
                    {formatDelta(displayValue, deltaMode)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className={styles.formHint}>
          {hover ? `${hover.title}: ${hover.value} ${hover.detail ? `- ${hover.detail}` : ""}` : "Hover a district to inspect baseline-to-scenario delta values."}
        </div>
      </div>

      <div style={chartGridStyle}>
        <div className={styles.stepContentCard}>
          <div className={styles.stepCardTitle}>Radar comparison</div>
          <svg viewBox="0 0 360 320" style={{ width: "100%", height: "auto", display: "block" }}>
            <g transform="translate(180 160)">
              {[25, 50, 75, 100].map((radius) => (
                <circle key={radius} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" />
              ))}
              {result.metricDefinitions.map((metric, index) => {
                const angle = (Math.PI * 2 * index) / result.metricDefinitions.length - Math.PI / 2;
                const outerX = Math.cos(angle) * 108;
                const outerY = Math.sin(angle) * 108;
                return (
                  <g key={metric.id}>
                    <line x1={0} y1={0} x2={outerX} y2={outerY} stroke="rgba(255,255,255,0.18)" />
                    <text x={Math.cos(angle) * 128} y={Math.sin(angle) * 128} textAnchor="middle" style={{ fill: "#D6D3D1", fontSize: 11 }}>
                      {metric.shortLabel}
                    </text>
                  </g>
                );
              })}
              {radarSeries.map((series, index) => {
                const points = series.values.map((entry, pointIndex) => {
                  const angle = (Math.PI * 2 * pointIndex) / series.values.length - Math.PI / 2;
                  const radius = entry.value;
                  return {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    entry,
                  };
                });
                const path = `${points.map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} Z`;
                const active = highlightedSeriesId == null || highlightedSeriesId === series.id;
                return (
                  <g
                    key={series.id}
                    opacity={active ? 1 : 0.24}
                    onMouseEnter={() => {
                      setHighlightedSeriesId(series.id);
                      setHover({ title: series.label, value: series.id === "baseline" ? "Baseline profile" : "Scenario profile", detail: `Composite pattern across ${result.metricDefinitions.length} aligned metrics.` });
                    }}
                    onMouseLeave={() => {
                      setHighlightedSeriesId(null);
                      setHover(null);
                    }}
                  >
                    <path d={path} fill={series.color === "#A8A29E" ? "rgba(168,162,158,0.08)" : `${series.color}22`} stroke={series.color} strokeWidth={index === 0 ? 1.5 : 2.4} strokeDasharray={series.id === "baseline" ? "5 4" : undefined} />
                    {points.map((point) => (
                      <circle key={`${series.id}-${point.entry.metric.id}`} cx={point.x} cy={point.y} r={3.5} fill={series.color} />
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>
          <div style={controlRowStyle}>
            {radarSeries.map((series) => (
              <button
                key={series.id}
                type="button"
                className={styles.outlineBtn}
                onMouseEnter={() => setHighlightedSeriesId(series.id)}
                onMouseLeave={() => setHighlightedSeriesId(null)}
              >
                {series.label}
              </button>
            ))}
          </div>
          <div className={styles.formHint}>Hover a legend item or polygon to isolate a scenario profile.</div>
        </div>

        <div className={styles.stepContentCard}>
          <div className={styles.stepCardTitle}>Parallel coordinates</div>
          <svg viewBox="0 0 420 320" style={{ width: "100%", height: "auto", display: "block" }}>
            {result.metricDefinitions.map((metric, index) => {
              const x = 60 + index * (300 / Math.max(result.metricDefinitions.length - 1, 1));
              return (
                <g key={metric.id}>
                  <line x1={x} y1={36} x2={x} y2={268} stroke="rgba(255,255,255,0.18)" />
                  <text x={x} y={24} textAnchor="middle" style={{ fill: "#D6D3D1", fontSize: 11 }}>{metric.shortLabel}</text>
                  <text x={x} y={286} textAnchor="middle" style={{ fill: "#78716C", fontSize: 10 }}>0-100</text>
                </g>
              );
            })}
            {parallelSeries.map((series, index) => {
              const active = highlightedSeriesId == null || highlightedSeriesId === series.id;
              const points = series.values.map((entry, pointIndex) => {
                const x = 60 + pointIndex * (300 / Math.max(series.values.length - 1, 1));
                const y = 268 - (entry.value / 100) * 232;
                return { x, y, entry };
              });
              const path = points.map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
              return (
                <g
                  key={series.id}
                  opacity={active ? 1 : 0.2}
                  onMouseEnter={() => {
                    setHighlightedSeriesId(series.id);
                    setHover({ title: series.label, value: "Axis-normalized profile", detail: "Each axis is normalized so different indicators remain comparable." });
                  }}
                  onMouseLeave={() => {
                    setHighlightedSeriesId(null);
                    setHover(null);
                  }}
                >
                  <path d={path} fill="none" stroke={series.color} strokeWidth={index === 0 ? 1.5 : 2.4} strokeDasharray={series.id === "baseline" ? "5 4" : undefined} />
                  {points.map((point) => (
                    <circle key={`${series.id}-${point.entry.metric.id}`} cx={point.x} cy={point.y} r={3.5} fill={series.color} />
                  ))}
                </g>
              );
            })}
          </svg>
          <div className={styles.formHint}>Axis labels remain fixed at a 0-100 normalized scale for consistent comparison.</div>
        </div>
      </div>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Trade-off matrix and Pareto frontier</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--syn-text-muted)" }}>Scenario</th>
                {result.metricDefinitions.map((metric) => (
                  <th key={metric.id} style={{ textAlign: "center", padding: "8px 6px", color: "var(--syn-text-muted)" }}>
                    {metric.shortLabel}
                  </th>
                ))}
                <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--syn-text-muted)" }}>Composite</th>
              </tr>
            </thead>
            <tbody>
              {result.tradeOffMatrix.map((row) => (
                <tr key={row.scenarioId} style={{ borderTop: "1px solid var(--syn-overlay-light)" }}>
                  <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{row.scenarioName}</strong>
                      {row.paretoCandidate ? (
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "var(--syn-success-bg)",
                          border: "1px solid var(--syn-success-border)",
                          color: "var(--syn-text-success)",
                          fontSize: 10,
                          fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)",
                        }}>
                          Pareto
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {row.cells.map((cell) => (
                    <td
                      key={`${row.scenarioId}-${cell.metricId}`}
                      style={{
                        padding: "10px 6px",
                        textAlign: "center",
                        color: "#FAFAF9",
                        background: colorFromImprovement(cell.improvementDelta),
                        cursor: "default",
                      }}
                      onMouseEnter={() => setHover({ title: `${row.scenarioName} - ${cell.label}`, value: formatSigned(cell.improvementDelta), detail: `Baseline ${cell.baselineValue.toFixed(1)} vs scenario ${cell.scenarioValue.toFixed(1)}` })}
                      onMouseLeave={() => setHover(null)}
                    >
                      {formatSigned(cell.improvementDelta)}
                    </td>
                  ))}
                  <td style={{ padding: "10px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {row.compositeScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.formHint}>
          Positive values indicate direction-aware improvement. Negative values indicate a trade-off or deterioration once metric direction is accounted for.
        </div>
      </div>

      <div className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Narrative-ready summary</div>
        <div className={styles.readonlyBlock}>{result.narrativeSummary}</div>
        <div style={controlRowStyle}>
          {onExportSummary ? (
            <button type="button" className={styles.outlineBtn} onClick={onExportSummary}>Export summary</button>
          ) : null}
          {onExportCharts ? (
            <button type="button" className={styles.outlineBtn} onClick={onExportCharts}>Export charts</button>
          ) : null}
        </div>
        <div className={styles.formHint}>
          {hover ? `${hover.title}: ${hover.value}${hover.detail ? ` - ${hover.detail}` : ""}` : "Hover a chart or trade-off cell to inspect details."}
        </div>
        {footerNote}
      </div>
    </section>
  );
};

const scenarioWorkspaceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const scenarioWorkspaceCardStyle: React.CSSProperties = {
  border: "1px solid var(--syn-overlay-light)",
  borderRadius: 8,
  padding: 12,
  background: "var(--syn-overlay-whisper)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const baselineWorkspaceCardStyle: React.CSSProperties = {
  ...scenarioWorkspaceCardStyle,
  borderColor: "var(--syn-accent-border)",
  background: "var(--syn-accent-bg)",
};

const ScenarioWorkspaceScenarioCard: React.FC<{
  scenario: ScenarioFormScenario;
  scenarioResult: ScenarioAlternativeResult | null;
  isDirty: boolean;
  isLoading: boolean;
  isActive: boolean;
  canRemove: boolean;
  onFocus: () => void;
  onUpdateField: (field: keyof Omit<ScenarioFormScenario, "parameters">, value: string) => void;
  onUpdateParameter: (parameter: keyof ScenarioParameters, value: number) => void;
  onRecalculate: () => void;
  onRemove: () => void;
}> = ({
  scenario,
  scenarioResult,
  isDirty,
  isLoading,
  isActive,
  canRemove,
  onFocus,
  onUpdateField,
  onUpdateParameter,
  onRecalculate,
  onRemove,
}) => (
  <div
    style={{
      ...scenarioWorkspaceCardStyle,
      borderColor: isActive ? "var(--syn-accent-primary)" : "var(--syn-overlay-light)",
      background: isActive ? "var(--syn-accent-bg)" : "var(--syn-overlay-whisper)",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className={styles.outlineBtn} onClick={onFocus}>
        {isActive ? "Active scenario" : "Focus scenario"}
      </button>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {scenario.sourceRunId ? (
          <span style={{
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid var(--syn-accent-border)",
            background: "var(--syn-depth-subtle)",
            fontSize: 10,
            fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)",
          }}>
            Imported
          </span>
        ) : null}
        <span style={{
          padding: "2px 8px",
          borderRadius: 999,
          border: "1px solid var(--syn-overlay-medium)",
          background: "var(--syn-depth-subtle)",
          fontSize: 10,
          fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)",
        }}>
          {isDirty ? "Needs recalc" : "Computed"}
        </span>
      </div>
    </div>

    <label className={styles.formLabel}>
      Scenario name
      <input
        type="text"
        className={styles.textInput}
        value={scenario.name}
        onChange={(event) => onUpdateField("name", event.target.value)}
      />
    </label>

    <div className={styles.formSection}>
      <div className={styles.formLabel}>Description</div>
      <textarea
        className={styles.textareaField}
        rows={2}
        value={scenario.description}
        onChange={(event) => onUpdateField("description", event.target.value)}
      />
    </div>

    <div className={styles.formSection}>
      <div className={styles.formLabel}>Assumptions</div>
      <textarea
        className={styles.textareaField}
        rows={2}
        value={scenario.assumptions}
        onChange={(event) => onUpdateField("assumptions", event.target.value)}
      />
    </div>

    {SCENARIO_LEVERS.map((lever) => (
      <div key={`${scenario.id}-${lever.id}`} className={styles.formSection}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <div className={styles.formLabel}>{lever.label}</div>
          <span style={{ fontSize: 11, color: "var(--syn-text-muted)", fontFamily: "var(--font-mono, ui-monospace, Menlo, monospace)" }}>
            {scenario.parameters[lever.id]}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={scenario.parameters[lever.id]}
          onChange={(event) => onUpdateParameter(lever.id, Number(event.target.value))}
        />
        <div className={styles.formHint}>{lever.description}</div>
      </div>
    ))}

    <div className={styles.readonlyBlock}>
      {scenarioResult
        ? `Composite score: ${scenarioResult.compositeScore.toFixed(1)}\nMean improvement: ${scenarioResult.meanImprovement >= 0 ? "+" : ""}${scenarioResult.meanImprovement.toFixed(1)}\nBased on the latest computed comparison snapshot.`
        : "No computed snapshot yet for this scenario."}
    </div>

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" className={styles.outlineBtn} onClick={onRecalculate} disabled={isLoading}>
        {isLoading ? "Recalculating..." : "Recalculate scenario"}
      </button>
      <button type="button" className={styles.outlineBtn} onClick={onRemove} disabled={!canRemove}>
        Remove
      </button>
    </div>
  </div>
);

export const ScenarioComparisonDashboardModule: React.FC<{ onOpenFlow?: () => void }> = ({ onOpenFlow }) => {
  const {
    stepData,
    completedRuns,
    setStepData,
    upsertCompletedRun,
  } = useFlowStore();
  const addOverlayLayer = useMapExplorerStore((state) => state.addOverlayLayer);
  const openMap = useMapExplorerStore((state) => state.open);

  const initialForm = useMemo(
    () => restoreFormState(stepData, SCENARIO_COMPARISON_FORM_KEY, DEFAULT_SCENARIO_COMPARISON_FORM),
    [stepData],
  );
  const storedResult = stepData[SCENARIO_COMPARISON_RESULT_KEY] as ScenarioComparisonResult | undefined;

  const [form, setForm] = useState<ScenarioComparisonForm>(initialForm);
  const [result, setResult] = useState<ScenarioComparisonResult | null>(
    () => storedResult ?? buildScenarioComparisonResult(initialForm),
  );
  const [dirtyScenarioIds, setDirtyScenarioIds] = useState<string[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [loadingScenarioId, setLoadingScenarioId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastComputedAt, setLastComputedAt] = useState<string | null>(storedResult ? new Date().toISOString() : null);

  const availableSimulationRuns = useMemo(
    () => completedRuns.filter((run) => run.flowId === "urban_growth_ca"),
    [completedRuns],
  );

  const commitForm = useCallback((updater: (previous: ScenarioComparisonForm) => ScenarioComparisonForm) => {
    setForm((previous) => {
      const next = updater(previous);
      setStepData(SCENARIO_COMPARISON_FORM_KEY, next);
      return next;
    });
  }, [setStepData]);

  const markScenarioDirty = useCallback((scenarioId: string) => {
    setDirtyScenarioIds((previous) => (previous.includes(scenarioId) ? previous : [...previous, scenarioId]));
  }, []);

  const updateForm = useCallback(<K extends keyof ScenarioComparisonForm>(key: K, value: ScenarioComparisonForm[K]) => {
    commitForm((previous) => ({ ...previous, [key]: value }));
  }, [commitForm]);

  const updateScenarioField = useCallback((scenarioId: string, field: keyof Omit<ScenarioFormScenario, "parameters">, value: string) => {
    commitForm((previous) => ({
      ...previous,
      scenarios: previous.scenarios.map((scenario) =>
        scenario.id === scenarioId ? { ...scenario, [field]: value } : scenario,
      ),
    }));
    markScenarioDirty(scenarioId);
  }, [commitForm, markScenarioDirty]);

  const updateScenarioParameter = useCallback((scenarioId: string, parameter: keyof ScenarioParameters, value: number) => {
    commitForm((previous) => ({
      ...previous,
      scenarios: previous.scenarios.map((scenario) =>
        scenario.id === scenarioId
          ? {
              ...scenario,
              parameters: {
                ...scenario.parameters,
                [parameter]: value,
              },
            }
          : scenario,
      ),
    }));
    markScenarioDirty(scenarioId);
  }, [commitForm, markScenarioDirty]);

  const addScenario = useCallback(() => {
    if (form.scenarios.length >= 4) {
      return;
    }
    const scenarioId = `scenario-${Date.now()}`;
    commitForm((previous) => ({
      ...previous,
      scenarios: [...previous.scenarios, createEmptyScenario(scenarioId)],
      activeScenarioId: scenarioId,
    }));
    markScenarioDirty(scenarioId);
  }, [commitForm, form.scenarios.length, markScenarioDirty]);

  const removeScenario = useCallback((scenarioId: string) => {
    if (form.scenarios.length <= 2) {
      return;
    }
    commitForm((previous) => {
      const scenarios = previous.scenarios.filter((scenario) => scenario.id !== scenarioId);
      return {
        ...previous,
        scenarios,
        activeScenarioId: previous.activeScenarioId === scenarioId ? scenarios[0]!.id : previous.activeScenarioId,
      };
    });
    setDirtyScenarioIds((previous) => previous.filter((id) => id !== scenarioId));
  }, [commitForm, form.scenarios.length]);

  const importScenarioFromRun = useCallback((runId: string) => {
    const run = availableSimulationRuns.find((candidate) => candidate.runId === runId);
    if (!run) {
      return;
    }

    const importedScenario = buildImportedScenarioFromRun(run);
    commitForm((previous) => {
      const existingIndex = previous.scenarios.findIndex((scenario) => scenario.sourceRunId === run.runId);
      if (existingIndex >= 0) {
        const scenarios = [...previous.scenarios];
        scenarios[existingIndex] = importedScenario;
        return {
          ...previous,
          scenarios,
          activeScenarioId: importedScenario.id,
        };
      }
      if (previous.scenarios.length >= 4) {
        return previous;
      }
      return {
        ...previous,
        scenarios: [...previous.scenarios, importedScenario],
        activeScenarioId: importedScenario.id,
      };
    });
    markScenarioDirty(importedScenario.id);
  }, [availableSimulationRuns, commitForm, markScenarioDirty]);

  useEffect(() => {
    if (!form.scenarios.some((scenario) => scenario.id === form.activeScenarioId)) {
      updateForm("activeScenarioId", form.scenarios[0]?.id ?? DEFAULT_SCENARIO_COMPARISON_FORM.activeScenarioId);
    }
  }, [form.activeScenarioId, form.scenarios, updateForm]);

  useEffect(() => {
    if (!form.selectedMetricIds.includes(form.activeMetricId) && form.selectedMetricIds.length > 0) {
      updateForm("activeMetricId", form.selectedMetricIds[0]!);
    }
  }, [form.activeMetricId, form.selectedMetricIds, updateForm]);

  const recalculateComparison = useCallback(async (options?: { scenarioId?: string }) => {
    setRunError(null);
    setIsComputing(true);
    setLoadingScenarioId(options?.scenarioId ?? null);

    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 80);
    });

    try {
      const nextResult = buildScenarioComparisonResult(form);
      setResult(nextResult);
      setStepData(SCENARIO_COMPARISON_RESULT_KEY, nextResult);
      setDirtyScenarioIds([]);
      setLastComputedAt(new Date().toISOString());
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Scenario comparison failed.");
    } finally {
      setIsComputing(false);
      setLoadingScenarioId(null);
    }
  }, [form, setStepData]);

  const handleAddDeltaLayer = useCallback(() => {
    if (!result) {
      return;
    }
    addOverlayLayer(buildScenarioDeltaLayer(result, form.activeScenarioId, form.activeMetricId, form.deltaMode));
    openMap();
  }, [addOverlayLayer, form.activeMetricId, form.activeScenarioId, form.deltaMode, openMap, result]);

  const handleExportSummary = useCallback(() => {
    if (!result) {
      return;
    }

    downloadJSON(exportFlowJSON(
      "scenario_comparison",
      form as unknown as Record<string, unknown>,
      {
        summary: buildScenarioComparisonSummaryText(form, result),
        narrative: buildScenarioComparisonNarrativeText(form, result),
        paretoScenarioIds: result.paretoScenarioIds,
        compositeScores: result.scenarios.map((scenario) => ({
          scenarioId: scenario.scenarioId,
          name: scenario.name,
          compositeScore: scenario.compositeScore,
          meanImprovement: scenario.meanImprovement,
        })),
      },
    ));
  }, [form, result]);

  const handleExportDeltaData = useCallback(() => {
    if (!result) {
      return;
    }

    const blob = new Blob([
      buildScenarioDeltaCsv(result, form.activeScenarioId, form.activeMetricId),
    ], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyScenarioComparisonOutput(form.outputTitle)}-${form.activeMetricId}-delta.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [form.activeMetricId, form.activeScenarioId, form.outputTitle, result]);

  const handleExportCharts = useCallback(() => {
    if (!result) {
      return;
    }

    const blob = new Blob([
      JSON.stringify(buildScenarioChartDataExport(result), null, 2),
    ], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyScenarioComparisonOutput(form.outputTitle)}-chart-data.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [form.outputTitle, result]);

  const handlePublishCompletedRun = useCallback(() => {
    if (!result) {
      return;
    }
    upsertCompletedRun(buildScenarioComparisonCompletedRun(form, result));
  }, [form, result, upsertCompletedRun]);

  const importedRunIds = new Set(form.scenarios.map((scenario) => scenario.sourceRunId).filter((value): value is string => Boolean(value)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {runError ? <div className={styles.warnBlock}>{runError}</div> : null}

      <section className={styles.stepContentCard}>
        <div className={styles.stepCardTitle}>Scenario workspace</div>
        <div className={styles.formHint}>
          Adjust baseline framing and scenario levers directly from the dashboard module, then recalculate the comparison without leaving the visual workspace.
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button type="button" className={styles.outlineBtn} onClick={() => void recalculateComparison()} disabled={isComputing}>
            {isComputing ? "Recalculating..." : "Recalculate dashboard"}
          </button>
          <button type="button" className={styles.outlineBtn} onClick={handlePublishCompletedRun} disabled={!result}>
            Publish to review
          </button>
          {onOpenFlow ? (
            <button type="button" className={styles.outlineBtn} onClick={onOpenFlow}>
              Open full workflow
            </button>
          ) : null}
        </div>

        <div className={styles.readonlyBlock}>
          {buildScenarioComparisonSummaryText(form, result)}
          {lastComputedAt ? `\nLast computed: ${new Date(lastComputedAt).toLocaleString()}` : "\nNo dashboard snapshot computed yet."}
          {dirtyScenarioIds.length > 0 ? `\nDirty scenarios: ${dirtyScenarioIds.join(", ")}` : "\nNo pending scenario edits."}
        </div>

        <div className={styles.formSection}>
          <div className={styles.formLabel}>Import completed urban-growth scenarios</div>
          {availableSimulationRuns.length === 0 ? (
            <div className={styles.readonlyBlock}>
              No completed urban growth runs are available yet. Run the Urban Growth Cellular Automata workflow to import scenario stubs here.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {availableSimulationRuns.map((run) => {
                const alreadyImported = importedRunIds.has(run.runId);
                return (
                  <button
                    key={run.runId}
                    type="button"
                    className={styles.outlineBtn}
                    disabled={!alreadyImported && form.scenarios.length >= 4}
                    onClick={() => importScenarioFromRun(run.runId)}
                  >
                    {alreadyImported ? `Refresh ${run.label}` : `Import ${run.label}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={scenarioWorkspaceGridStyle}>
          <div style={baselineWorkspaceCardStyle}>
            <div className={styles.formLabel}>Baseline</div>
            <label className={styles.formLabel}>
              Baseline name
              <input
                type="text"
                className={styles.textInput}
                value={form.baselineName}
                onChange={(event) => updateForm("baselineName", event.target.value)}
              />
            </label>
            <div className={styles.formSection}>
              <div className={styles.formLabel}>Baseline description</div>
              <textarea
                className={styles.textareaField}
                rows={4}
                value={form.baselineDescription}
                onChange={(event) => updateForm("baselineDescription", event.target.value)}
              />
            </div>
            <div className={styles.readonlyBlock}>
              {result
                ? `Baseline composite: ${result.baselineCompositeScore.toFixed(1)}\nAligned metrics: ${result.metricDefinitions.length}\nAlternative scenarios: ${result.scenarios.length}`
                : "No computed comparison snapshot yet."}
            </div>
          </div>

          {form.scenarios.map((scenario) => (
            <ScenarioWorkspaceScenarioCard
              key={scenario.id}
              scenario={scenario}
              scenarioResult={result?.scenarios.find((entry) => entry.scenarioId === scenario.id) ?? null}
              isDirty={dirtyScenarioIds.includes(scenario.id)}
              isLoading={loadingScenarioId === scenario.id && isComputing}
              isActive={scenario.id === form.activeScenarioId}
              canRemove={form.scenarios.length > 2}
              onFocus={() => updateForm("activeScenarioId", scenario.id)}
              onUpdateField={(field, value) => updateScenarioField(scenario.id, field, value)}
              onUpdateParameter={(parameter, value) => updateScenarioParameter(scenario.id, parameter, value)}
              onRecalculate={() => void recalculateComparison({ scenarioId: scenario.id })}
              onRemove={() => removeScenario(scenario.id)}
            />
          ))}
        </div>

        {form.scenarios.length < 4 ? (
          <button type="button" className={styles.outlineBtn} onClick={addScenario} style={{ marginTop: 12 }}>
            Add scenario ({form.scenarios.length}/4)
          </button>
        ) : null}
      </section>

      {dirtyScenarioIds.length > 0 ? (
        <div className={styles.warnBlock}>
          One or more scenarios changed after the last computation. Recalculate before exporting, publishing, or briefing from this dashboard snapshot.
        </div>
      ) : null}

      <ScenarioComparisonDashboard
        result={result}
        activeScenarioId={form.activeScenarioId}
        onActiveScenarioChange={(scenarioId) => updateForm("activeScenarioId", scenarioId)}
        activeMetricId={form.activeMetricId}
        onActiveMetricChange={(metricId) => updateForm("activeMetricId", metricId)}
        deltaMode={form.deltaMode}
        onDeltaModeChange={(mode) => updateForm("deltaMode", mode)}
        onExportSummary={handleExportSummary}
        onExportDeltaData={handleExportDeltaData}
        onExportCharts={handleExportCharts}
        onAddLayerToMap={handleAddDeltaLayer}
        footerNote={(
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className={styles.outlineBtn} onClick={handlePublishCompletedRun} disabled={!result}>
              Publish to review
            </button>
            {onOpenFlow ? (
              <button type="button" className={styles.outlineBtn} onClick={onOpenFlow}>
                Open full workflow
              </button>
            ) : null}
          </div>
        )}
      />
    </div>
  );
};

export default ScenarioComparisonDashboardModule;