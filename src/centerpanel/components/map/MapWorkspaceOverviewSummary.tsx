import React, { useMemo } from "react";
import {
  ArrowRight,
  Compass,
  FileOutput,
  HardDrive,
  Layers3,
  type LucideIcon,
  MapPinned,
  PencilRuler,
  Ruler,
  Save,
  Shield,
  Upload,
} from "lucide-react";
import styles from "./MapWorkspaceOverviewSummary.module.css";
import { MAP_TYPOGRAPHY } from "./mapTokens";
import type { OverlayLayerConfig } from "./mapTypes";
import { type MapExplorerContextSummary, resolveOverlayLayerCrs } from "./mapContextSummary";
import {
  getMapWorkspaceReadiness,
  MAP_QUICK_ACTIONS,
  MAP_WORKSPACE_VIEWS,
  type MapQuickActionId,
  type MapWorkspaceView,
} from "./mapExperience";

export interface MapWorkspaceOverviewSummaryProps {
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
  visiblePublicationLayerCount?: number;
}

type SignalTone = "ready" | "attention" | "blocked" | "neutral";

const signalToneClassName: Record<SignalTone, string> = {
  ready: styles.toneReady,
  attention: styles.toneAttention,
  blocked: styles.toneBlockedRow,
  neutral: styles.toneNeutral,
};

const readinessToneClassName = {
  foundational: styles.toneFoundational,
  operational: styles.toneOperational,
  delivery: styles.toneDelivery,
  blocked: styles.toneBlocked,
} as const;

const viewMicrocopy: Record<MapWorkspaceView, string> = {
  navigator: "Overview",
  explore: "Layers",
  analyze: "Outputs",
};

const quickActionIcons: Record<MapQuickActionId, LucideIcon> = {
  "import-data": Upload,
  "review-layers": Layers3,
  "review-problems": Shield,
  "open-pins": MapPinned,
  "draw-aoi": PencilRuler,
  measure: Ruler,
  "theme-data": MapPinned,
  "export-map": FileOutput,
  "save-project": Save,
};

const primaryActionIcons = quickActionIcons;

const SUMMARY_QUICK_ACTION_ORDER: MapQuickActionId[] = [
  "import-data",
  "review-layers",
  "draw-aoi",
  "measure",
  "save-project",
  "export-map",
];

interface Signal {
  id: string;
  label: string;
  value: string;
  Icon: LucideIcon;
  tone: SignalTone;
}

function formatProjectLabel(projectId?: string | null): string {
  if (!projectId || projectId.trim().length === 0) {
    return "No project";
  }
  return projectId
    .replace(/^proj[_-]?/i, "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatSaveLabel(lastSavedAt?: string | null): string {
  if (!lastSavedAt) {
    return "Draft";
  }
  const parsed = new Date(lastSavedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Draft";
  }
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(parsed);
}

function resolveCrsValue(overlayLayers: OverlayLayerConfig[]): { value: string; tone: SignalTone } {
  if (overlayLayers.length === 0) {
    return { value: "Unknown", tone: "neutral" };
  }
  const declared = new Set<string>();
  let undeclared = 0;
  for (const layer of overlayLayers) {
    const crs = resolveOverlayLayerCrs(layer);
    if (crs && crs.trim().length > 0) {
      declared.add(crs.trim());
    } else {
      undeclared += 1;
    }
  }
  if (declared.size === 0) {
    return { value: "Unknown", tone: "attention" };
  }
  if (declared.size === 1) {
    const only = [...declared][0] ?? "Unknown";
    return { value: undeclared > 0 ? `${only} +${undeclared}?` : only, tone: undeclared > 0 ? "attention" : "ready" };
  }
  return { value: `Mixed (${declared.size})`, tone: "attention" };
}

export const MapWorkspaceOverviewSummary: React.FC<MapWorkspaceOverviewSummaryProps> = ({
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
  visiblePublicationLayerCount = 0,
}) => {
  const panelStyle = useMemo(
    () => ({
      "--font-brand": MAP_TYPOGRAPHY.fontFamilyBrand,
      "--font-mono": MAP_TYPOGRAPHY.fontFamilyMono,
    }) as React.CSSProperties,
    [],
  );

  const layerCount = overlayLayers.length;
  const visibleLayerCount = overlayLayers.filter((layer) => layer.visible).length;
  const projectLabel = useMemo(() => formatProjectLabel(selectedProjectId), [selectedProjectId]);
  const saveLabel = useMemo(() => formatSaveLabel(lastSavedAt), [lastSavedAt]);
  const hasProject = Boolean(selectedProjectId && selectedProjectId.trim().length > 0);
  const crs = useMemo(() => resolveCrsValue(overlayLayers), [overlayLayers]);

  const readiness = useMemo(
    () => getMapWorkspaceReadiness({
      overlayLayers,
      pinCount,
      drawnFeatureCount,
      measurementCount,
      lastSavedAt,
      hasActiveAoi: Boolean(contextSummary.activeAoi),
      qaStatus: contextSummary.qa.status,
      qaIssueCount,
      qaBlockerCount,
      visiblePublicationLayerCount,
    }),
    [
      contextSummary.activeAoi,
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

  const signals = useMemo<Signal[]>(() => {
    const activeAoi = contextSummary.activeAoi;
    const aoiValue = activeAoi
      ? activeAoiLabel ?? activeAoi.aoiId
      : contextSummary.currentBounds
        ? "View-only"
        : "None";
    const aoiTone: SignalTone = activeAoi ? "ready" : contextSummary.currentBounds ? "neutral" : "attention";

    const qaValue = qaBlockerCount > 0
      ? "Blocked"
      : qaIssueCount > 0 || contextSummary.qa.status === "warning"
        ? "Caveats"
        : contextSummary.qa.status === "passed"
          ? "Ready"
          : "Unchecked";
    const qaTone: SignalTone = qaBlockerCount > 0
      ? "blocked"
      : qaIssueCount > 0 || contextSummary.qa.status === "warning"
        ? "attention"
        : contextSummary.qa.status === "passed"
          ? "ready"
          : "neutral";

    return [
      {
        id: "project",
        label: "Project",
        value: hasProject ? projectLabel : "Local-only",
        Icon: HardDrive,
        tone: hasProject ? "ready" : "attention",
      },
      {
        id: "layers",
        label: "Layers",
        value: `${visibleLayerCount}/${layerCount}`,
        Icon: Layers3,
        tone: visibleLayerCount > 0 ? "ready" : layerCount > 0 ? "attention" : "neutral",
      },
      {
        id: "aoi",
        label: "AOI",
        value: aoiValue,
        Icon: MapPinned,
        tone: aoiTone,
      },
      {
        id: "qa",
        label: "QA",
        value: qaValue,
        Icon: Shield,
        tone: qaTone,
      },
      {
        id: "crs",
        label: "CRS",
        value: crs.value,
        Icon: Compass,
        tone: crs.tone,
      },
      {
        id: "save",
        label: "Save state",
        value: lastSavedAt ? `Saved ${saveLabel}` : "Draft",
        Icon: Save,
        tone: lastSavedAt ? "ready" : "attention",
      },
    ];
  }, [
    activeAoiLabel,
    contextSummary.activeAoi,
    contextSummary.currentBounds,
    contextSummary.qa.status,
    crs.tone,
    crs.value,
    hasProject,
    layerCount,
    lastSavedAt,
    projectLabel,
    qaBlockerCount,
    qaIssueCount,
    saveLabel,
    visibleLayerCount,
  ]);

  const quickActions = useMemo(
    () => SUMMARY_QUICK_ACTION_ORDER
      .filter((id) => id !== readiness.nextActionId)
      .map((id) => MAP_QUICK_ACTIONS.find((action) => action.id === id))
      .filter((action): action is (typeof MAP_QUICK_ACTIONS)[number] => Boolean(action))
      .slice(0, 4),
    [readiness.nextActionId],
  );

  const PrimaryActionIcon = primaryActionIcons[readiness.nextActionId];

  return (
    <section
      className={styles.panel}
      aria-label="Map workspace overview summary"
      data-readiness-state={readiness.state}
      data-testid="map-overview-summary"
      style={panelStyle}
    >
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden="true"><Compass size={16} /></span>
        <div className={styles.headerCopy}>
          <span className={styles.headerKicker}>Overview</span>
          <span className={styles.headerTitle}>Readiness summary</span>
        </div>
        <span className={`${styles.toneBadge} ${readinessToneClassName[readiness.tone]}`}>{readiness.label}</span>
      </header>

      <div className={styles.body}>
        <section aria-label="Readiness score">
          <div className={styles.readinessTop}>
            <span className={styles.readinessLabel}>Readiness</span>
            <span className={styles.readinessScore}>{readiness.score}%</span>
          </div>
          <div className={styles.readinessTrack} aria-hidden="true">
            <span className={styles.readinessFill} style={{ width: `${readiness.score}%` }} />
          </div>
          <p className={styles.focusLine}>{readiness.narrative}</p>
        </section>

        <button
          type="button"
          className={styles.primaryAction}
          onClick={() => onQuickAction(readiness.nextActionId)}
          aria-label={`Run next readiness action: ${readiness.nextActionLabel}`}
        >
          <span className={styles.primaryActionIcon} aria-hidden="true"><PrimaryActionIcon size={15} /></span>
          <span className={styles.primaryActionCopy}>
            <span className={styles.primaryActionKicker}>Next action</span>
            <span className={styles.primaryActionLabel}>{readiness.nextActionLabel}</span>
          </span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>

        <section aria-label="Map state signals">
          <div className={styles.sectionLabel}>Map state</div>
          <div className={styles.signalList}>
            {signals.map((signal) => {
              const SignalIcon = signal.Icon;
              return (
                <div
                  key={signal.id}
                  className={`${styles.signalRow} ${signalToneClassName[signal.tone]}`}
                  aria-label={`${signal.label}: ${signal.value}`}
                >
                  <span className={styles.signalIcon} aria-hidden="true"><SignalIcon size={13} /></span>
                  <span className={styles.signalLabel}>{signal.label}</span>
                  <span className={styles.signalValue} title={signal.value}>{signal.value}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-label="Workspace modes">
          <div className={styles.sectionLabel}>Workspace</div>
          <div className={styles.modeRail} role="group" aria-label="Map workspace modes">
            {MAP_WORKSPACE_VIEWS.map((viewMeta) => {
              const isActive = workspaceView === viewMeta.id;
              return (
                <button
                  key={viewMeta.id}
                  type="button"
                  className={`${styles.modeBtn} ${isActive ? styles.modeBtnActive : ""}`}
                  onClick={() => onSelectView(viewMeta.id)}
                  aria-pressed={isActive}
                  title={viewMeta.description}
                >
                  <span className={styles.modeBtnLabel}>{viewMeta.label}</span>
                  <span className={styles.modeBtnHint}>{viewMicrocopy[viewMeta.id]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Quick actions">
          <div className={styles.sectionLabel}>Quick actions</div>
          <div className={styles.quickGrid}>
            {quickActions.map((action) => {
              const QuickIcon = quickActionIcons[action.id];
              return (
                <button
                  key={action.id}
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => onQuickAction(action.id)}
                  aria-label={`${action.label}: ${action.description}`}
                  title={action.description}
                >
                  <span className={styles.quickBtnIcon} aria-hidden="true"><QuickIcon size={14} /></span>
                  <span className={styles.quickBtnLabel}>{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
};
