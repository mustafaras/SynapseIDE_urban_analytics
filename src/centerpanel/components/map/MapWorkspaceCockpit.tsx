import React, { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Compass,
  Database,
  FileOutput,
  FlaskConical,
  Globe,
  HardDrive,
  Layers3,
  type LucideIcon,
  MapPinned,
  Palette,
  PencilRuler,
  Ruler,
  Save,
  Shield,
  Upload,
} from "lucide-react";
import styles from "./MapWorkspaceCockpit.module.css";
import type { OverlayLayerConfig } from "./mapTypes";
import { MAP_TYPOGRAPHY } from "./mapTokens";
import type { MapAnalysisRecommendation } from "@/services/map/MapAnalysisRecommender";
import {
  getMapWorkspaceReadiness,
  getRecommendedMapQuickAction,
  MAP_QUICK_ACTIONS,
  MAP_WORKSPACE_VIEWS,
  type MapQuickActionId,
  type MapWorkspaceView,
} from "./mapExperience";

export interface MapWorkspaceCockpitProps {
  workspaceView: MapWorkspaceView;
  onSelectView: (view: MapWorkspaceView) => void;
  onQuickAction: (actionId: MapQuickActionId) => void;
  overlayLayers: OverlayLayerConfig[];
  pinCount: number;
  drawnFeatureCount: number;
  measurementCount: number;
  selectedProjectId?: string | null;
  lastSavedAt?: string | null;
  analysisRecommendations?: MapAnalysisRecommendation[];
  onAnalysisRecommendationAction?: (recommendation: MapAnalysisRecommendation) => void;
}

const viewIcons: Record<MapWorkspaceView, LucideIcon> = {
  navigator: Compass,
  explore: Layers3,
  analyze: FlaskConical,
};

const quickActionIcons: Record<MapQuickActionId, LucideIcon> = {
  "import-data": Upload,
  "review-layers": Layers3,
  "open-pins": MapPinned,
  "draw-aoi": PencilRuler,
  measure: Ruler,
  "theme-data": Palette,
  "export-map": FileOutput,
  "save-project": Save,
};

const readinessToneClassName = {
  foundational: styles.statusBadgeFoundational,
  operational: styles.statusBadgeOperational,
  delivery: styles.statusBadgeDelivery,
} as const;

const sequenceStatusClassName = {
  complete: styles.sequenceStepComplete,
  current: styles.sequenceStepCurrent,
  upcoming: styles.sequenceStepUpcoming,
} as const;

const sequenceStatusLabel = {
  complete: "Ready",
  current: "Current Focus",
  upcoming: "Queued",
} as const;

const signalToneClassName = {
  ready: styles.signalReady,
  attention: styles.signalAttention,
  neutral: styles.signalNeutral,
} as const;

const viewNarratives: Record<MapWorkspaceView, string> = {
  navigator: "Command the next move with operational context in view.",
  explore: "Audit map layers, search place context, and restore legibility.",
  analyze: "Frame study geometry, run themes, and prepare interpretable outputs.",
};

const viewMicrocopy: Record<MapWorkspaceView, string> = {
  navigator: "Next move",
  explore: "Layers",
  analyze: "Outputs",
};

const quickActionMicrocopy: Record<MapQuickActionId, string> = {
  "import-data": "Load data",
  "review-layers": "Check stack",
  "open-pins": "Field notes",
  "draw-aoi": "Frame area",
  measure: "Measure",
  "theme-data": "Style data",
  "export-map": "Package",
  "save-project": "Persist",
};

const supportingActionOrder: MapQuickActionId[] = [
  "review-layers",
  "draw-aoi",
  "theme-data",
  "measure",
  "open-pins",
  "save-project",
  "export-map",
  "import-data",
];

function formatProjectLabel(projectId?: string | null): string {
  if (!projectId) return "No active project";
  return projectId
    .replace(/^proj[_-]?/i, "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatSaveLabel(lastSavedAt?: string | null): string {
  if (!lastSavedAt) return "Not saved";
  const parsed = new Date(lastSavedAt);
  if (Number.isNaN(parsed.getTime())) return "Not saved";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export const MapWorkspaceCockpit: React.FC<MapWorkspaceCockpitProps> = ({
  workspaceView,
  onSelectView,
  onQuickAction,
  overlayLayers,
  pinCount,
  drawnFeatureCount,
  measurementCount,
  selectedProjectId = null,
  lastSavedAt = null,
  analysisRecommendations = [],
  onAnalysisRecommendationAction,
}) => {
  const cockpitStyle = useMemo(
    () => ({
      "--font-brand": MAP_TYPOGRAPHY.fontFamilyBrand,
      "--font-mono": MAP_TYPOGRAPHY.fontFamilyMono,
    }) as React.CSSProperties,
    [],
  );
  const layerCount = overlayLayers.length;
  const visibleLayerCount = overlayLayers.filter((layer) => layer.visible).length;
  const analysisLayerCount = overlayLayers.filter((layer) => (layer.group ?? "data") === "analysis").length;
  const staleLayerCount = overlayLayers.filter((layer) => layer.metadata?.analysisResult?.stale).length;
  const projectLabel = useMemo(() => formatProjectLabel(selectedProjectId), [selectedProjectId]);
  const saveLabel = useMemo(() => formatSaveLabel(lastSavedAt), [lastSavedAt]);

  const recommendedAction = useMemo(
    () => getRecommendedMapQuickAction({
      overlayLayers,
      pinCount,
      drawnFeatureCount,
      measurementCount,
    }),
    [drawnFeatureCount, measurementCount, overlayLayers, pinCount],
  );

  const readiness = useMemo(
    () => getMapWorkspaceReadiness({
      overlayLayers,
      pinCount,
      drawnFeatureCount,
      measurementCount,
      lastSavedAt,
    }),
    [drawnFeatureCount, lastSavedAt, measurementCount, overlayLayers, pinCount],
  );

  const recommendedActionMeta = MAP_QUICK_ACTIONS.find((action) => action.id === recommendedAction) ?? MAP_QUICK_ACTIONS[0];
  const visibleAnalysisRecommendations = useMemo(
    () => analysisRecommendations.slice(0, 3),
    [analysisRecommendations],
  );

  const supportQuickActions = useMemo(() => {
    const orderedIds = [recommendedActionMeta.id, ...supportingActionOrder];
    const seen = new Set<MapQuickActionId>();
    const dedupedIds = orderedIds.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return dedupedIds
      .filter((id) => id !== recommendedActionMeta.id)
      .map((id) => MAP_QUICK_ACTIONS.find((action) => action.id === id))
      .filter((action): action is (typeof MAP_QUICK_ACTIONS)[number] => Boolean(action))
      .slice(0, 6);
  }, [recommendedActionMeta.id]);

  const dataLayerCount = overlayLayers.filter((layer) => (layer.group ?? "data") === "data").length;
  const columnarLayerCount = overlayLayers.filter((layer) => Boolean(layer.metadata?.columnar)).length;
  const featureCount = overlayLayers.reduce((sum, layer) => {
    const layerFeatureCount = layer.metadata?.featureCount;
    return sum + (typeof layerFeatureCount === "number" ? layerFeatureCount : 0);
  }, 0);

  const workspaceMetrics = useMemo(
    () => [
      { label: "Layers", value: `${visibleLayerCount}/${layerCount}`, sub: "visible / total" },
      { label: "Analysis", value: `${analysisLayerCount}`, sub: staleLayerCount > 0 ? `${staleLayerCount} stale` : "current" },
      { label: "Data", value: `${dataLayerCount}`, sub: `${featureCount.toLocaleString()} feat.` },
      { label: "Geometry", value: `${drawnFeatureCount}`, sub: `${measurementCount} meas.` },
      { label: "Pins", value: `${pinCount}`, sub: pinCount > 0 ? "annotated" : "none" },
      { label: "State", value: lastSavedAt ? "Saved" : "Draft", sub: saveLabel },
    ],
    [analysisLayerCount, dataLayerCount, drawnFeatureCount, featureCount, lastSavedAt, layerCount, measurementCount, pinCount, saveLabel, staleLayerCount, visibleLayerCount],
  );

  const operationalSignals = useMemo(
    () => [
      {
        id: "layers",
        label: "Layer Stack",
        value: `${visibleLayerCount}/${layerCount}`,
        detail: layerCount > 0 ? `${featureCount.toLocaleString()} features` : "Load data",
        Icon: Layers3,
        tone: visibleLayerCount > 0 ? "ready" : "attention",
      },
      {
        id: "study-frame",
        label: "Study Frame",
        value: `${drawnFeatureCount}`,
        detail: measurementCount > 0 ? `${measurementCount} measurements` : "AOI needed",
        Icon: PencilRuler,
        tone: drawnFeatureCount > 0 || measurementCount > 0 ? "ready" : "attention",
      },
      {
        id: "analysis",
        label: "Analytical Output",
        value: `${analysisLayerCount}`,
        detail: staleLayerCount > 0 ? `${staleLayerCount} stale` : "Current",
        Icon: BarChart3,
        tone: staleLayerCount > 0 ? "attention" : analysisLayerCount > 0 ? "ready" : "neutral",
      },
      {
        id: "handoff",
        label: "Project State",
        value: lastSavedAt ? "Saved" : "Draft",
        detail: lastSavedAt ? saveLabel : "Save before export",
        Icon: Save,
        tone: lastSavedAt ? "ready" : "neutral",
      },
    ] as const,
    [analysisLayerCount, drawnFeatureCount, featureCount, lastSavedAt, layerCount, measurementCount, saveLabel, staleLayerCount, visibleLayerCount],
  );

  const integrationSignals = useMemo(
    () => [
      {
        id: "columnar",
        label: "Columnar I/O",
        value: columnarLayerCount > 0 ? `${columnarLayerCount}` : "Ready",
        detail: "Arrow + GeoParquet",
        Icon: HardDrive,
        tone: columnarLayerCount > 0 ? "ready" : "neutral",
      },
      {
        id: "layer-quality",
        label: "Layer Quality",
        value: staleLayerCount > 0 ? `${staleLayerCount}` : "Clear",
        detail: staleLayerCount > 0 ? "Needs rerun" : "No stale layers",
        Icon: Shield,
        tone: staleLayerCount > 0 ? "attention" : "ready",
      },
      {
        id: "export-package",
        label: "Export Package",
        value: layerCount > 0 ? "Ready" : "Empty",
        detail: layerCount > 0 ? `${visibleLayerCount} visible layers` : "Add layers first",
        Icon: FileOutput,
        tone: layerCount > 0 ? "ready" : "neutral",
      },
    ] as const,
    [columnarLayerCount, layerCount, staleLayerCount, visibleLayerCount],
  );

  const currentSequenceStep = readiness.sequence.find((step) => step.status === "current")
    ?? readiness.sequence[readiness.sequence.length - 1];
  const PrimaryActionIcon = quickActionIcons[recommendedActionMeta.id];

  return (
    <section className={styles.panel} aria-label="Map workspace cockpit" style={cockpitStyle}>
      <header className={styles.commandBar}>
        <div className={styles.commandIdentity}>
          <span className={styles.brandMark}><Globe size={15} /></span>
          <div className={styles.identityCopy}>
            <span className={styles.brandKicker}>Spatial Navigator</span>
            <span className={styles.brandTitle}>Map Command Center</span>
          </div>
          <span className={`${styles.toneBadge} ${readinessToneClassName[readiness.tone]}`}>
            {readiness.label}
          </span>
        </div>

        <div className={styles.commandMeta} aria-label="Project map state summary">
          <span className={styles.metaChip}>{projectLabel}</span>
          <span className={styles.metaChip}>{saveLabel}</span>
          {staleLayerCount > 0 ? <span className={styles.metaChipWarn}>{staleLayerCount} stale</span> : null}
        </div>

        <div className={styles.commandReadiness}>
          <div className={styles.commandReadinessTop}>
            <span>Readiness</span>
            <strong>{readiness.score}%</strong>
          </div>
          <div className={styles.readinessTrack} aria-hidden="true">
            <span className={styles.readinessFill} style={{ width: `${readiness.score}%` }} />
          </div>
        </div>

        <button
          type="button"
          className={styles.primaryCommand}
          onClick={() => onQuickAction(recommendedActionMeta.id)}
          aria-label={`Run recommended map action: ${recommendedActionMeta.label}`}
        >
          <span className={styles.primaryCommandIcon}><PrimaryActionIcon size={14} /></span>
          <span className={styles.primaryCommandCopy}>
            <span>Next Best Action</span>
            <strong>{recommendedActionMeta.label}</strong>
          </span>
          <ArrowRight size={14} />
        </button>
      </header>

      <div className={styles.bodyGrid}>
        <section className={`${styles.pane} ${styles.statePane}`} aria-label="Current map state">
          <div className={styles.sectionHeading}>
            <span><Database size={13} /> Live State</span>
            <span className={styles.sectionHint}>{readiness.focusLabel}</span>
          </div>

          <div className={styles.metricRibbon}>
            {workspaceMetrics.map((metric) => (
              <div key={metric.label} className={styles.metricUnit}>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
                <span className={styles.metricSub}>{metric.sub}</span>
              </div>
            ))}
          </div>

          <div className={styles.signalStack}>
            {operationalSignals.map((signal) => {
              const SignalIcon = signal.Icon;
              return (
                <div key={signal.id} className={`${styles.signalRow} ${signalToneClassName[signal.tone]}`}>
                  <span className={styles.signalIcon}><SignalIcon size={14} /></span>
                  <span className={styles.signalCopy}>
                    <strong>{signal.label}</strong>
                    <span>{signal.detail}</span>
                  </span>
                  <span className={styles.signalValue}>{signal.value}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.focusBand}>
            <div className={styles.focusBandTop}>
              <Activity size={13} />
              <span>{readiness.focusLabel}</span>
            </div>
            <p>{readiness.narrative}</p>
          </div>
        </section>

        <section className={`${styles.pane} ${styles.flowPane}`} aria-label="Map workflow modes and sequence">
          <div className={styles.sectionHeading}>
            <span><Compass size={13} /> Workflow Control</span>
            <span className={styles.sectionHint}>Mode + sequence</span>
          </div>

          <div className={styles.modeRail} role="group" aria-label="Map workspace modes">
            {MAP_WORKSPACE_VIEWS.map((viewMeta) => {
              const ViewIcon = viewIcons[viewMeta.id];
              const isActive = workspaceView === viewMeta.id;
              return (
                <button
                  key={viewMeta.id}
                  type="button"
                  className={`${styles.modeBtn} ${isActive ? styles.modeBtnActive : ""}`}
                  onClick={() => onSelectView(viewMeta.id)}
                  aria-pressed={isActive}
                  title={viewNarratives[viewMeta.id]}
                >
                  <span className={styles.modeBtnIcon}><ViewIcon size={15} /></span>
                  <span className={styles.modeBtnCopy}>
                    <strong>{viewMeta.label}</strong>
                    <span>{viewMicrocopy[viewMeta.id]}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.sequenceHeader}>
            <span><Shield size={13} /> Delivery Sequence</span>
            <strong>{currentSequenceStep?.label ?? "Complete"}</strong>
          </div>

          <div className={styles.sequenceRail}>
            {readiness.sequence.map((step, index) => (
              <div key={step.id} className={`${styles.sequenceItem} ${sequenceStatusClassName[step.status]}`}>
                <span className={styles.sequenceIndex}>{index + 1}</span>
                <div className={styles.sequenceCopy} title={step.description}>
                  <strong>{step.label}</strong>
                  <span>{step.description}</span>
                </div>
                <span className={styles.sequenceStatus}>{sequenceStatusLabel[step.status]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.pane} ${styles.integrationPane}`} aria-label="Map integrations and quick operations">
          <div className={styles.sectionHeading}>
            <span><FlaskConical size={13} /> Integration Rail</span>
            <span className={styles.sectionHint}>Data + export</span>
          </div>

          <div className={styles.recommendedBand}>
            <span className={styles.recommendedEyebrow}>Recommended</span>
            <strong>{recommendedActionMeta.label}</strong>
            <p>{recommendedActionMeta.description}</p>
          </div>

          <div className={styles.analysisRecommendationStrip} aria-label="Recommended next spatial analysis steps">
            <div className={styles.analysisRecommendationHeader}>
              <span>Recommended next steps</span>
              <strong>{visibleAnalysisRecommendations.length > 0 ? `${visibleAnalysisRecommendations.length}` : "0"}</strong>
            </div>

            {visibleAnalysisRecommendations.length > 0 ? (
              <div className={styles.analysisRecommendationList}>
                {visibleAnalysisRecommendations.map((recommendation) => (
                  <article
                    key={recommendation.id}
                    className={`${styles.analysisRecommendationItem} ${styles[`analysisRecommendation${recommendation.severity.charAt(0).toUpperCase()}${recommendation.severity.slice(1)}`]}`}
                  >
                    <div className={styles.analysisRecommendationTopline}>
                      <span className={styles.analysisRecommendationSeverity}>{recommendation.severity}</span>
                      <strong>{recommendation.title}</strong>
                    </div>
                    <p className={styles.analysisRecommendationRationale}>{recommendation.rationale}</p>

                    <div className={styles.analysisRecommendationMetaGrid}>
                      <span>
                        <b>Inputs</b>
                        {recommendation.requiredInputs.slice(0, 2).join(" + ")}
                      </span>
                      <span>
                        <b>Output</b>
                        {recommendation.expectedOutput}
                      </span>
                      <span>
                        <b>Caveat</b>
                        {recommendation.scientificCaveat}
                      </span>
                    </div>

                    <div className={styles.analysisRecommendationFooter}>
                      <span>{recommendation.evidence.slice(0, 2).join(" · ")}</span>
                      <button
                        type="button"
                        className={styles.analysisRecommendationAction}
                        onClick={() => onAnalysisRecommendationAction?.(recommendation)}
                        disabled={!onAnalysisRecommendationAction}
                        aria-label={`Apply recommendation: ${recommendation.title}`}
                      >
                        {recommendation.actionLabel}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.analysisRecommendationEmpty}>
                <strong>Load or reveal a layer</strong>
                <span>Scientific recommendations appear after visible data, QA state, or selections are available.</span>
              </div>
            )}
          </div>

          <div className={styles.integrationStack}>
            {integrationSignals.map((signal) => {
              const SignalIcon = signal.Icon;
              return (
                <div key={signal.id} className={`${styles.integrationRow} ${signalToneClassName[signal.tone]}`}>
                  <span className={styles.integrationIcon}><SignalIcon size={14} /></span>
                  <span className={styles.integrationCopy}>
                    <strong>{signal.label}</strong>
                    <span>{signal.detail}</span>
                  </span>
                  <span className={styles.integrationValue}>{signal.value}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.quickActionGrid}>
            {supportQuickActions.map((quickAction) => {
              const QuickActionIcon = quickActionIcons[quickAction.id];
              return (
                <button
                  key={quickAction.id}
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => onQuickAction(quickAction.id)}
                  aria-label={`Open map action: ${quickAction.label}: ${quickAction.description}`}
                  title={quickAction.description}
                >
                  <span className={styles.quickBtnIcon}><QuickActionIcon size={13} /></span>
                  <span className={styles.quickBtnCopy}>
                    <strong>{quickAction.label}</strong>
                    <span>{quickActionMicrocopy[quickAction.id]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
};
