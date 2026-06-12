import React, { useEffect, useMemo, useRef } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Compass,
  FolderOpen,
  Globe,
  type LucideIcon,
  PackageOpen,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import styles from "./MapStartDialog.module.css";
import { MAP_TYPOGRAPHY } from "./mapTokens";
import type { OverlayLayerConfig } from "./mapTypes";
import { type MapExplorerContextSummary, resolveOverlayLayerCrs } from "./mapContextSummary";
import { getMapWorkspaceReadiness } from "./mapExperience";
import type { MapStartDialogReason } from "./mapStartDialogState";

export interface MapStartDialogProps {
  reason: MapStartDialogReason | null;
  selectedProjectId?: string | null;
  lastSavedAt?: string | null;
  overlayLayers: OverlayLayerConfig[];
  contextSummary: MapExplorerContextSummary;
  pinCount?: number;
  drawnFeatureCount?: number;
  measurementCount?: number;
  activeAoiLabel?: string | null;
  qaIssueCount?: number;
  qaBlockerCount?: number;
  recentWorkspaces?: ReadonlyArray<{
    id: string;
    label: string;
    lastOpenedAt: string | null;
    source?: "project" | "local" | "demo";
  }>;
  onImport: () => void;
  onOpenProject: () => void;
  onAddDemoPack: () => void;
  onContinue: () => void;
  onClose: () => void;
  onOpenSourceHealth?: () => void;
}

type ReadinessTone = "ready" | "attention" | "blocked" | "neutral";

const toneClassName: Record<ReadinessTone, string> = {
  ready: styles.toneReady,
  attention: styles.toneAttention,
  blocked: styles.toneBlocked,
  neutral: styles.toneNeutral,
};

interface ReadinessSegment {
  id: string;
  label: string;
  value: string;
  tone: ReadinessTone;
}

interface DecisionTile {
  id: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  demoBadge?: string;
}

interface RecentWorkspaceItem {
  id: string;
  label: string;
  lastOpenedAt: string | null;
  source: "project" | "local" | "demo";
}

function formatProjectLabel(projectId?: string | null): string {
  if (!projectId || projectId.trim().length === 0) {
    return "No active project";
  }
  return projectId
    .replace(/^proj[_-]?/i, "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatSaveState(lastSavedAt?: string | null): string {
  if (!lastSavedAt) {
    return "Draft · unsaved";
  }
  const parsed = new Date(lastSavedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Draft · unsaved";
  }
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
  return `Saved ${time}`;
}

function formatRecentTimestamp(timestamp?: string | null): string {
  if (!timestamp) {
    return "No recent save";
  }
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "No recent save";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function resolveCrsSegment(overlayLayers: OverlayLayerConfig[]): { value: string; tone: ReadinessTone } {
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
    return { value: undeclared > 0 ? `${only} (+${undeclared}?)` : only, tone: undeclared > 0 ? "attention" : "ready" };
  }
  return { value: `Mixed (${declared.size})`, tone: "attention" };
}

const reasonNarrative: Record<MapStartDialogReason, string> = {
  "first-open": "Start a session by importing data, opening a saved project, or exploring an empty map.",
  "no-project": "No project is selected yet. Import data, open an existing project, or continue on an empty map.",
  "no-layers": "The map has no layers yet. Import data or add a demo pack, or continue to draw and explore.",
  "user-requested": "Choose how to begin: import data, open a project, add a demo pack, or continue.",
  "restored-session": "A previous session was restored. Continue working or load a different project.",
};

export const MapStartDialog: React.FC<MapStartDialogProps> = ({
  reason,
  selectedProjectId = null,
  lastSavedAt = null,
  overlayLayers,
  contextSummary,
  pinCount = 0,
  drawnFeatureCount = 0,
  measurementCount = 0,
  activeAoiLabel = null,
  qaIssueCount = 0,
  qaBlockerCount = 0,
  recentWorkspaces,
  onImport,
  onOpenProject,
  onAddDemoPack,
  onContinue,
  onClose,
  onOpenSourceHealth,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const primaryActionRef = useRef<HTMLButtonElement | null>(null);

  const dialogStyle = useMemo(
    () => ({
      "--font-brand": MAP_TYPOGRAPHY.fontFamilyBrand,
      "--font-mono": MAP_TYPOGRAPHY.fontFamilyMono,
    }) as React.CSSProperties,
    [],
  );

  useEffect(() => {
    // Move focus into the dialog so keyboard users land on the primary action.
    // The parent modal owns the focus trap and focus return.
    primaryActionRef.current?.focus();
  }, []);

  const layerCount = overlayLayers.length;
  const visibleLayerCount = overlayLayers.filter((layer) => layer.visible).length;
  const projectLabel = useMemo(() => formatProjectLabel(selectedProjectId), [selectedProjectId]);
  const saveState = useMemo(() => formatSaveState(lastSavedAt), [lastSavedAt]);
  const hasProject = Boolean(selectedProjectId && selectedProjectId.trim().length > 0);

  const recentWorkspaceItems = useMemo<RecentWorkspaceItem[]>(() => {
    if (recentWorkspaces && recentWorkspaces.length > 0) {
      return recentWorkspaces.slice(0, 5).map((workspace) => ({
        id: workspace.id,
        label: workspace.label,
        lastOpenedAt: workspace.lastOpenedAt,
        source: workspace.source ?? "project",
      }));
    }

    const fallbackLabel = hasProject ? projectLabel : "Untitled local workspace";
    return [{
      id: hasProject ? String(selectedProjectId) : "local-workspace",
      label: fallbackLabel,
      lastOpenedAt: lastSavedAt,
      source: hasProject ? "project" : "local",
    }];
  }, [hasProject, lastSavedAt, projectLabel, recentWorkspaces, selectedProjectId]);

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
    ],
  );

  const crsSegment = useMemo(() => resolveCrsSegment(overlayLayers), [overlayLayers]);

  const readinessSegments = useMemo<ReadinessSegment[]>(() => {
    const activeAoi = contextSummary.activeAoi;
    const aoiValue = activeAoi
      ? activeAoiLabel ?? activeAoi.aoiId
      : contextSummary.currentBounds
        ? "View-only"
        : "None";
    const aoiTone: ReadinessTone = activeAoi ? "ready" : contextSummary.currentBounds ? "neutral" : "attention";

    const qaValue = qaBlockerCount > 0
      ? "Blocked"
      : qaIssueCount > 0 || contextSummary.qa.status === "warning"
        ? "Caveats"
        : contextSummary.qa.status === "passed"
          ? "Ready"
          : "Unchecked";
    const qaTone: ReadinessTone = qaBlockerCount > 0
      ? "blocked"
      : qaIssueCount > 0 || contextSummary.qa.status === "warning"
        ? "attention"
        : contextSummary.qa.status === "passed"
          ? "ready"
          : "neutral";

    return [
      {
        id: "layers",
        label: "Layers",
        value: `${visibleLayerCount}/${layerCount}`,
        tone: visibleLayerCount > 0 ? "ready" : layerCount > 0 ? "attention" : "neutral",
      },
      {
        id: "aoi",
        label: "AOI",
        value: aoiValue,
        tone: aoiTone,
      },
      {
        id: "qa",
        label: "QA",
        value: qaValue,
        tone: qaTone,
      },
      {
        id: "crs",
        label: "CRS",
        value: crsSegment.value,
        tone: crsSegment.tone,
      },
      {
        id: "mode",
        label: "Mode",
        value: hasProject ? "Project" : "Local-only",
        tone: hasProject ? "ready" : "neutral",
      },
    ];
  }, [
    activeAoiLabel,
    contextSummary.activeAoi,
    contextSummary.currentBounds,
    contextSummary.qa.status,
    crsSegment.tone,
    crsSegment.value,
    hasProject,
    layerCount,
    qaBlockerCount,
    qaIssueCount,
    visibleLayerCount,
  ]);

  const decisionTiles = useMemo<DecisionTile[]>(() => [
    {
      id: "import",
      label: "Import Data",
      hint: "GeoJSON, CSV, Shapefile, GeoParquet, KML, and more.",
      Icon: Upload,
      onClick: onImport,
      primary: true,
    },
    {
      id: "open-project",
      label: "Open Project",
      hint: hasProject ? `Load saved map state for ${projectLabel}.` : "No saved project is selected.",
      Icon: FolderOpen,
      onClick: onOpenProject,
      disabled: !hasProject,
      disabledReason: hasProject ? undefined : "Select a project first",
    },
    {
      id: "demo-pack",
      label: "Add Demo Pack",
      hint: "Load a clearly-labelled sample dataset to explore.",
      Icon: PackageOpen,
      onClick: onAddDemoPack,
      demoBadge: "DEMO / SYNTHETIC",
    },
    {
      id: "continue",
      label: "Continue Empty",
      hint: "Open the map and import or draw as you go.",
      Icon: Compass,
      onClick: onContinue,
    },
  ], [hasProject, onAddDemoPack, onContinue, onImport, onOpenProject, projectLabel]);

  const narrative = reasonNarrative[reason ?? "first-open"];
  const hasContext = layerCount > 0 || pinCount > 0 || drawnFeatureCount > 0 || measurementCount > 0;

  return (
    <div
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-start-dialog-title"
      aria-describedby="map-start-dialog-narrative"
      style={dialogStyle}
      data-testid="map-start-dialog"
    >
      <header className={styles.header}>
        <span className={styles.brandMark} aria-hidden="true"><Globe size={18} /></span>
        <div className={styles.headerCopy}>
          <span className={styles.headerKicker}>Map Explorer</span>
          <div className={styles.headerTitleRow}>
            <span className={styles.headerTitle} id="map-start-dialog-title">{projectLabel}</span>
            <span className={styles.headerChips}>
              <span className={`${styles.chip} ${lastSavedAt ? styles.chipReady : styles.chipCaveat}`}>{saveState}</span>
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close launch dialog"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <div className={styles.decisionRow} role="group" aria-label="Start actions">
        {decisionTiles.map((tile) => {
          const TileIcon = tile.Icon;
          return (
            <button
              key={tile.id}
              ref={tile.primary ? primaryActionRef : undefined}
              type="button"
              className={`${styles.tile} ${tile.primary ? styles.tilePrimary : ""}`}
              onClick={tile.onClick}
              disabled={tile.disabled}
              aria-label={`${tile.label}. ${tile.disabled && tile.disabledReason ? tile.disabledReason : tile.hint}`}
              title={tile.disabled ? tile.disabledReason : undefined}
            >
              <span className={styles.tileIcon} aria-hidden="true"><TileIcon size={16} /></span>
              <span className={styles.tileCopy}>
                <span className={styles.tileLabelRow}>
                  <span className={styles.tileLabel}>{tile.label}</span>
                  {tile.demoBadge ? <span className={styles.tileBadge}>{tile.demoBadge}</span> : null}
                </span>
                <span className={`${styles.tileHint} ${tile.disabled ? styles.tileDisabledReason : ""}`}>
                  {tile.disabled && tile.disabledReason ? tile.disabledReason : tile.hint}
                </span>
              </span>
              <ChevronRight size={15} className={styles.tileChevron} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className={styles.body}>
        <section aria-label="Recent workspaces">
          <div className={styles.sectionLabel}>Recent workspaces</div>
          <div className={styles.recentWorkspaceList}>
            {recentWorkspaceItems.map((workspace) => (
              <div key={workspace.id} className={styles.recentWorkspaceRow}>
                <span className={styles.recentWorkspaceName}>{workspace.label}</span>
                <span className={styles.recentWorkspaceMeta}>
                  <span>{formatRecentTimestamp(workspace.lastOpenedAt)}</span>
                  <span className={styles.recentWorkspaceSource}>{workspace.source}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Readiness summary">
          <div className={styles.sectionLabel}>Readiness</div>
          <div className={styles.readinessStrip}>
            {readinessSegments.map((segment) => (
              <div
                key={segment.id}
                className={`${styles.readinessCell} ${toneClassName[segment.tone]}`}
                aria-label={`${segment.label}: ${segment.value}`}
              >
                <span className={styles.readinessLabel}>{segment.label}</span>
                <span className={styles.readinessValue}>{segment.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Context preview">
          <div className={styles.sectionLabel}>Next move</div>
          <div className={styles.contextPreview}>
            <div className={styles.contextHeadline}>
              <Sparkles size={15} />
              <span>{readiness.nextActionLabel}</span>
            </div>
            <p className={styles.contextDetail} id="map-start-dialog-narrative">
              {hasContext ? readiness.narrative : narrative}
            </p>
            <div className={styles.contextMeta}>
              <span>Readiness {readiness.score}%</span>
              <span>{`${visibleLayerCount}/${layerCount} layers visible`}</span>
              <span>{saveState}</span>
            </div>
          </div>
        </section>

        <details className={styles.advanced}>
          <summary className={styles.advancedSummary}>
            <ArrowUpRight size={14} aria-hidden="true" />
            Source support and CRS notes
          </summary>
          <div className={styles.advancedBody}>
            <p className={styles.advancedRow}>
              <strong>Supported imports:</strong> GeoJSON/JSON, CSV, KML/KMZ/GPX, Shapefile ZIP, GeoPackage, Arrow/Feather/IPC, and GeoParquet.
            </p>
            <p className={styles.advancedRow}>
              <strong>CRS caveat:</strong> Area and distance are computed in a projected CRS. EPSG:4326 layers are view-only until a projected CRS is declared.
            </p>
            {onOpenSourceHealth ? (
              <button
                type="button"
                className={styles.sourceHealthLink}
                onClick={onOpenSourceHealth}
              >
                <ArrowUpRight size={13} aria-hidden="true" />
                Open data sources
              </button>
            ) : null}
          </div>
        </details>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <button type="button" className={styles.ghostBtn} onClick={onClose}>
            Dismiss
          </button>
          <span className={styles.footerNote}>
            You can reopen this dialog from the workspace at any time.
          </span>
        </div>
        <div className={styles.footerActions}>
          <button type="button" className={styles.primaryBtn} onClick={onContinue}>
            <Compass size={14} aria-hidden="true" />
            Continue to map
          </button>
        </div>
      </footer>
    </div>
  );
};
