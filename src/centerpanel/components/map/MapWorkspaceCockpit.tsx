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
import type { MapExplorerContextSummary } from "./mapContextSummary";
import type { MapAnalysisRecommendation } from "@/services/map/MapAnalysisRecommender";
import {
  getMapWorkspaceReadiness,
  hasMapLayerSourceEvidence,
  MAP_QUICK_ACTIONS,
  MAP_WORKSPACE_VIEWS,
  type MapQuickActionId,
  type MapWorkspaceView,
} from "./mapExperience";

export interface MapWorkspaceCockpitProps {
  workspaceView: MapWorkspaceView;
  onSelectView: (view: MapWorkspaceView) => void;
  onQuickAction: (actionId: MapQuickActionId) => void;
  contextSummary: MapExplorerContextSummary;
  overlayLayers: OverlayLayerConfig[];
  pinCount: number;
  drawnFeatureCount: number;
  measurementCount: number;
  selectedProjectId?: string | null;
  lastSavedAt?: string | null;
  activeAoiLabel?: string | null;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  workflowReadyCount?: number;
  visiblePublicationLayerCount?: number;
  viewportSyncEnabled?: boolean;
  syncStatus?: string;
  analysisRecommendations?: MapAnalysisRecommendation[];
  onAnalysisRecommendationAction?: (recommendation: MapAnalysisRecommendation) => void;
}

type ContextSignalTone = keyof typeof signalToneClassName;

interface ContextSignal {
  id: string;
  label: string;
  value: string;
  detail: string;
  Icon: LucideIcon;
  tone: ContextSignalTone;
}

const viewIcons: Record<MapWorkspaceView, LucideIcon> = {
  navigator: Compass,
  explore: Layers3,
  analyze: FlaskConical,
};

const quickActionIcons: Record<MapQuickActionId, LucideIcon> = {
  "import-data": Upload,
  "review-layers": Layers3,
  "review-problems": Shield,
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
  blocked: styles.statusBadgeBlocked,
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
  blocked: styles.signalBlocked,
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
  "review-problems": "Problems",
  "open-pins": "Field notes",
  "draw-aoi": "Frame area",
  measure: "Measure",
  "theme-data": "Style data",
  "export-map": "Package",
  "save-project": "Persist",
};

const supportingActionOrder: MapQuickActionId[] = [
  "review-problems",
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

function formatGeometryFamily(
  family: NonNullable<MapExplorerContextSummary["activeAoi"]>["geometryFamily"],
): string {
  switch (family) {
    case "polygon":
      return "Polygon AOI";
    case "multipolygon":
      return "Multi-polygon AOI";
    case "linestring":
      return "Line study frame";
    case "multilinestring":
      return "Multi-line study frame";
    case "point":
      return "Point study frame";
    case "multipoint":
      return "Multi-point study frame";
    case "geometrycollection":
      return "Mixed study frame";
    default:
      return "Study frame";
  }
}

function formatShortTime(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export const MapWorkspaceCockpit: React.FC<MapWorkspaceCockpitProps> = ({
  workspaceView,
  onSelectView,
  onQuickAction,
  contextSummary,
  overlayLayers,
  pinCount,
  drawnFeatureCount,
  measurementCount,
  selectedProjectId = null,
  lastSavedAt = null,
  activeAoiLabel = null,
  qaIssueCount = 0,
  qaBlockerCount = 0,
  workflowReadyCount = 0,
  visiblePublicationLayerCount = 0,
  viewportSyncEnabled = false,
  syncStatus = "Viewport sync off",
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
  const selectedFeatureCount = contextSummary.selection.totalSelectedFeatures;
  const selectedLayerCount = contextSummary.selection.layerCounts.length;
  const activeAoi = contextSummary.activeAoi;
  const qaCheckedLabel = formatShortTime(contextSummary.qa.checkedAt);
  const projectLabel = useMemo(() => formatProjectLabel(selectedProjectId), [selectedProjectId]);
  const saveLabel = useMemo(() => formatSaveLabel(lastSavedAt), [lastSavedAt]);
  const dataLayerCount = overlayLayers.filter((layer) => (layer.group ?? "data") === "data").length;
  const columnarLayerCount = overlayLayers.filter((layer) => Boolean(layer.metadata?.columnar)).length;
  const sourceBackedLayerCount = overlayLayers.filter(hasMapLayerSourceEvidence).length;
  const visibleSourceBackedLayerCount = overlayLayers.filter((layer) => layer.visible && hasMapLayerSourceEvidence(layer)).length;
  const featureCount = overlayLayers.reduce((sum, layer) => {
    const layerFeatureCount = layer.metadata?.featureCount;
    return sum + (typeof layerFeatureCount === "number" ? layerFeatureCount : 0);
  }, 0);

  const readiness = useMemo(
    () => getMapWorkspaceReadiness({
      overlayLayers,
      pinCount,
      drawnFeatureCount,
      measurementCount,
      lastSavedAt,
      hasActiveAoi: Boolean(activeAoi),
      qaStatus: contextSummary.qa.status,
      qaIssueCount,
      qaBlockerCount,
      visiblePublicationLayerCount,
    }),
    [
      activeAoi,
      contextSummary.qa.status,
      drawnFeatureCount,
      lastSavedAt,
      measurementCount,
      overlayLayers,
      pinCount,
      qaBlockerCount,
      qaIssueCount,
      visiblePublicationLayerCount,
    ],
  );

  const recommendedActionMeta = MAP_QUICK_ACTIONS.find((action) => action.id === readiness.nextActionId) ?? MAP_QUICK_ACTIONS[0];
  const visibleAnalysisRecommendations = useMemo(
    () => analysisRecommendations.slice(0, 3),
    [analysisRecommendations],
  );

  const contextSignals = useMemo<ContextSignal[]>(() => {
    const projectValue = selectedProjectId ? projectLabel : "Unassigned";
    const projectDetail = selectedProjectId
      ? "Project scope is selected for save/load continuity."
      : "Select or create a project before saving formal map state.";

    const aoiValue = activeAoi
      ? activeAoiLabel ?? activeAoi.aoiId
      : contextSummary.currentBounds
        ? "View extent only"
        : "Needs context";
    const aoiDetail = activeAoi
      ? `${formatGeometryFamily(activeAoi.geometryFamily)}${activeAoi.bbox ? " · bounded" : ""}`
      : contextSummary.currentBounds
        ? "Current visible extent can scope dispatches until an AOI is drawn."
        : "Draw or select an AOI before AOI-based workflows can run.";

    const qaValue = qaBlockerCount > 0
      ? "Blocked"
      : qaIssueCount > 0 || contextSummary.qa.status === "warning"
        ? "Caveats"
        : contextSummary.qa.status === "passed"
          ? "Ready"
          : "Unchecked";
    const qaDetail = qaBlockerCount > 0
      ? `${qaBlockerCount} blocker${qaBlockerCount === 1 ? "" : "s"} still prevent formal output.`
      : qaIssueCount > 0
        ? `${qaIssueCount} issue${qaIssueCount === 1 ? "" : "s"} need review before briefing or export.`
        : contextSummary.qa.status === "passed"
          ? `QA checked${qaCheckedLabel ? ` at ${qaCheckedLabel}` : " for the current visible stack"}.`
          : layerCount > 0
            ? "Run scientific QA to confirm the current stack is publication-safe."
            : "Load visible layers before QA can assess the workspace.";

    return [
      {
        id: "project",
        label: "Project",
        value: projectValue,
        detail: projectDetail,
        Icon: HardDrive,
        tone: selectedProjectId ? "ready" : "attention",
      },
      {
        id: "layers",
        label: "Layers",
        value: `${contextSummary.visibleLayerIds.length}/${layerCount}`,
        detail: layerCount > 0
          ? `${sourceBackedLayerCount}/${layerCount} source-backed; ${featureCount.toLocaleString()} mapped feature${featureCount === 1 ? "" : "s"}.`
          : "Import or reveal a dataset before layer controls, QA, and export can run.",
        Icon: Layers3,
        tone: visibleSourceBackedLayerCount > 0 ? "ready" : sourceBackedLayerCount > 0 ? "attention" : "blocked",
      },
      {
        id: "selection",
        label: "Selected",
        value: selectedFeatureCount > 0 ? `${selectedFeatureCount} features` : "None",
        detail: selectedFeatureCount > 0
          ? `${selectedLayerCount} layer${selectedLayerCount === 1 ? "" : "s"} drive map stats and workflow context.`
          : "Select features to compute statistics and focus analysis.",
        Icon: Database,
        tone: selectedFeatureCount > 0 ? "ready" : "neutral",
      },
      {
        id: "aoi",
        label: "AOI",
        value: aoiValue,
        detail: aoiDetail,
        Icon: MapPinned,
        tone: activeAoi ? "ready" : contextSummary.currentBounds ? "neutral" : "attention",
      },
      {
        id: "qa",
        label: "QA",
        value: qaValue,
        detail: qaDetail,
        Icon: Shield,
        tone: qaBlockerCount > 0 ? "blocked" : qaIssueCount > 0 ? "attention" : contextSummary.qa.status === "passed" ? "ready" : "neutral",
      },
      {
        id: "save",
        label: "Save State",
        value: lastSavedAt ? "Saved" : "Draft",
        detail: lastSavedAt ? `Last saved at ${saveLabel}.` : "Save the current project before formal handoff.",
        Icon: Save,
        tone: lastSavedAt ? "ready" : "attention",
      },
      {
        id: "sync",
        label: "Sync State",
        value: viewportSyncEnabled ? "Linked" : "Off",
        detail: viewportSyncEnabled ? syncStatus : "Local map state only until viewport sync is enabled.",
        Icon: Globe,
        tone: viewportSyncEnabled ? "ready" : "neutral",
      },
    ];
  }, [
    activeAoi,
    activeAoiLabel,
    contextSummary.currentBounds,
    contextSummary.qa.checkedAt,
    contextSummary.qa.status,
    contextSummary.visibleLayerIds.length,
    featureCount,
    layerCount,
    lastSavedAt,
    projectLabel,
    qaBlockerCount,
    qaCheckedLabel,
    qaIssueCount,
    saveLabel,
    selectedFeatureCount,
    selectedLayerCount,
    selectedProjectId,
    sourceBackedLayerCount,
    syncStatus,
    viewportSyncEnabled,
    visibleSourceBackedLayerCount,
  ]);

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
        detail: workflowReadyCount > 0
          ? `${workflowReadyCount} workflow-ready layer${workflowReadyCount === 1 ? "" : "s"}`
          : measurementCount > 0
            ? `${measurementCount} measurements`
            : "AOI needed",
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
    [analysisLayerCount, drawnFeatureCount, featureCount, lastSavedAt, layerCount, measurementCount, saveLabel, staleLayerCount, visibleLayerCount, workflowReadyCount],
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
        value: sourceBackedLayerCount === 0 ? "No data" : staleLayerCount > 0 ? `${staleLayerCount}` : "Clear",
        detail: sourceBackedLayerCount === 0 ? "Source state required" : staleLayerCount > 0 ? "Needs rerun" : "No stale layers",
        Icon: Shield,
        tone: sourceBackedLayerCount === 0 ? "blocked" : staleLayerCount > 0 ? "attention" : "ready",
      },
      {
        id: "export-package",
        label: "Export Package",
        value: readiness.state === "publish-ready" ? "Ready" : visiblePublicationLayerCount > 0 ? "Pending" : "Empty",
        detail: readiness.state === "publish-ready"
          ? `${visiblePublicationLayerCount} publication layer${visiblePublicationLayerCount === 1 ? "" : "s"} checked`
          : visiblePublicationLayerCount > 0
            ? "Resolve readiness before export"
            : "Add layers first",
        Icon: FileOutput,
        tone: readiness.state === "publish-ready" ? "ready" : visiblePublicationLayerCount > 0 ? "attention" : "neutral",
      },
    ] as const,
    [columnarLayerCount, readiness.state, sourceBackedLayerCount, staleLayerCount, visiblePublicationLayerCount],
  );

  const currentSequenceStep = readiness.sequence.find((step) => step.status === "current")
    ?? readiness.sequence[readiness.sequence.length - 1];
  const PrimaryActionIcon = quickActionIcons[readiness.nextActionId];

  return (
    <section
      className={styles.panel}
      aria-label="Map workspace cockpit"
      data-readiness-state={readiness.state}
      style={cockpitStyle}
    >
      <header className={styles.commandBar}>
        <div className={styles.commandIdentity}>
          <span className={styles.brandMark}><Globe size={15} /></span>
          <div className={styles.identityCopy}>
            <span className={styles.brandKicker}>Overview</span>
            <span className={styles.brandTitle}>Readiness Cockpit</span>
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
          onClick={() => onQuickAction(readiness.nextActionId)}
          aria-label={`Run next readiness action: ${readiness.nextActionLabel}`}
        >
          <span className={styles.primaryCommandIcon}><PrimaryActionIcon size={14} /></span>
          <span className={styles.primaryCommandCopy}>
            <span>Next Action</span>
            <strong>{readiness.nextActionLabel}</strong>
          </span>
          <ArrowRight size={14} />
        </button>
      </header>

      <div className={styles.contextStrip} aria-label="Active map context summary" data-testid="map-workspace-context-strip">
        {contextSignals.map((signal) => {
          const SignalIcon = signal.Icon;
          return (
            <article
              key={signal.id}
              className={`${styles.contextCell} ${signalToneClassName[signal.tone]}`}
              aria-label={`${signal.label}: ${signal.value}. ${signal.detail}`}
            >
              <span className={styles.contextCellIcon}><SignalIcon size={14} /></span>
              <span className={styles.contextCellCopy}>
                <span className={styles.contextCellLabel}>{signal.label}</span>
                <strong>{signal.value}</strong>
                <span>{signal.detail}</span>
              </span>
            </article>
          );
        })}
      </div>

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
            <span className={styles.recommendedEyebrow}>State-specific action</span>
            <strong>{readiness.nextActionLabel}</strong>
            <p>{readiness.nextActionDescription || recommendedActionMeta.description}</p>
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
                      <span className={`${styles.analysisRecommendationReadiness} ${styles[`analysisReadiness${recommendation.readiness.status === "needs-review" ? "NeedsReview" : recommendation.readiness.status.charAt(0).toUpperCase() + recommendation.readiness.status.slice(1)}`]}`}>
                        {recommendation.readiness.label}
                      </span>
                    </div>
                    <p className={styles.analysisRecommendationRationale}>{recommendation.rationale}</p>

                    <div className={styles.analysisRecommendationReasons} aria-label={`Reasons for ${recommendation.title}`}>
                      {recommendation.reasons.slice(0, 3).map((reason) => (
                        <span
                          key={`${recommendation.id}-${reason.kind}-${reason.label}`}
                          className={`${styles.analysisRecommendationReason} ${styles[`analysisReason${reason.tone.charAt(0).toUpperCase()}${reason.tone.slice(1)}`]}`}
                          title={reason.detail}
                        >
                          {reason.label}
                        </span>
                      ))}
                    </div>

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
                        aria-label={`Apply recommendation: ${recommendation.title}. Readiness: ${recommendation.readiness.label}`}
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
