import React from "react";
import { AlertTriangle } from "lucide-react";
import type { MapWorkspaceView } from "./mapExperience";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";

type TopSurfaceTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** Minimum surface width that can host the context bar without collapsing the menu bar. */
const CONTEXT_BAR_MIN_SURFACE_WIDTH = 3000;
/** Optional metadata chips yield first in the compact single-row command bar. */
const METADATA_RAIL_MIN_SURFACE_WIDTH = 2200;

export interface MapTopCommandSurfaceProps {
  activeActivityLabel: string;
  projectName?: string | null;
  workspaceView: MapWorkspaceView;
  taskLensLabel: string;
  hasUnsavedProjectChanges?: boolean;
  persistenceDisabled?: boolean;
  isSavingProject?: boolean;
  isLoadingProject?: boolean;
  lastSavedAt?: string | null;
  scopeLabel?: string | null;
  scopeTitle?: string;
  crsLabel?: string | null;
  crsTone?: TopSurfaceTone;
  crsTitle?: string;
  onOpenCrsReadiness?: () => void;
  activeLayerLabel?: string | null;
  activeLayerTitle?: string;
  searchSlot: React.ReactNode;
  mapToolsSlot?: React.ReactNode;
  contextBarSlot?: React.ReactNode;
  commandSlot: React.ReactNode;
  utilitySlot?: React.ReactNode;
  modalControlSlot?: React.ReactNode;
  trailingSlot?: React.ReactNode;
  titleId?: string;
}

const shellStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "stretch",
  gap: MAP_SPACING.zero,
  minHeight: "var(--map-menu-h, 3.3rem)",
  paddingLeft: MAP_SPACING.zero,
  paddingRight: MAP_SPACING.sm,
  background: "var(--syn-surface-header, #141b24)",
  borderBottom: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.18)) 52%, transparent)",
  boxShadow: "none",
  overflow: "hidden",
  position: "relative",
  zIndex: MAP_Z_INDEX.dropdown + 1,
  isolation: "isolate",
};

const identityRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flex: "0 1 auto",
  minWidth: 0,
  minHeight: "100%",
  padding: `0 ${MAP_SPACING.sm} 0 ${MAP_SPACING.md}`,
  overflow: "hidden",
};

const menuRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  flex: "1 1 auto",
  minWidth: 0,
  minHeight: "100%",
  padding: `0 ${MAP_SPACING.xs} 0 ${MAP_SPACING.sm}`,
  borderLeft: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.16)) 42%, transparent)",
  overflow: "hidden",
};

const clusterShellStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  minHeight: "2rem",
  padding: `0 ${MAP_SPACING.xs}`,
  borderRadius: 0,
  border: "1px solid transparent",
  background: "transparent",
  overflow: "visible",
};

const leadingClusterStyle: React.CSSProperties = {
  ...clusterShellStyle,
  display: "inline-flex",
  flex: "0 0 auto",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const identityClusterStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.1875rem",
  minWidth: 0,
  flexShrink: 0,
};

const brandRowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  flexShrink: 0,
};

const brandAccentStyle: React.CSSProperties = {
  width: "0.1875rem",
  height: "1.25rem",
  borderRadius: 0,
  border: "none",
  background: "var(--syn-interaction-active, #3794ff)",
  flexShrink: 0,
};

const brandCopyStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.0625rem",
  minWidth: MAP_SPACING.zero,
};

const brandKickerStyle: React.CSSProperties = {
  color: MAP_COLORS.interaction,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const brandLineStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyBrand,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.bold,
  whiteSpace: "nowrap",
};

const chipRailStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const centerSearchSlotStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "1 1 12rem",
  minWidth: 0,
  maxWidth: "14rem",
  padding: `0 ${MAP_SPACING.xs}`,
  overflow: "hidden",
};

const searchSlotStyle: React.CSSProperties = {
  flex: "1 1 11rem",
  minWidth: 0,
  maxWidth: "14rem",
};

const contextRailStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  flexShrink: 1,
};

const mapToolRailStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
  flex: "0 1 auto",
  overflow: "hidden",
  borderLeft: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.16)) 42%, transparent)",
  marginLeft: MAP_SPACING.xs,
  paddingLeft: MAP_SPACING.sm,
};

const commandClusterStyle: React.CSSProperties = {
  ...clusterShellStyle,
  display: "inline-flex",
  flex: "100 1 48rem",
  justifyContent: "flex-start",
  padding: `${MAP_SPACING.zero} ${MAP_SPACING.zero}`,
  minWidth: "34rem",
  overflow: "hidden",
};

const contextBarClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  // Context shortcuts duplicate commands that stay reachable through the
  // grouped menus, quick actions, and canvas dock, so this cluster yields
  // space to the menu bar first.
  flex: "0 2.5 auto",
  minWidth: 0,
  overflow: "hidden",
  paddingLeft: MAP_SPACING.xs,
  borderLeft: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.16)) 42%, transparent)",
};

const trailingClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  flex: "0 0 auto",
  position: "relative",
  zIndex: 1,
  paddingLeft: MAP_SPACING.xs,
  paddingTop: MAP_SPACING.zero,
  paddingBottom: MAP_SPACING.zero,
};

const utilityClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
};

const modalControlClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  paddingLeft: MAP_SPACING.sm,
  borderLeft: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.16)) 42%, transparent)",
};

const chipLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const chipValueStyle: React.CSSProperties = {
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
};

function formatWorkspaceLabel(workspaceView: MapWorkspaceView): string {
  if (workspaceView === "navigator") return "Overview";
  return workspaceView.charAt(0).toUpperCase() + workspaceView.slice(1);
}

function formatSavedTime(lastSavedAt?: string | null): string {
  if (!lastSavedAt) return "Draft";
  const parsed = new Date(lastSavedAt);
  if (Number.isNaN(parsed.getTime())) return "Draft";
  return `Saved ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function resolveSaveState(props: Pick<
  MapTopCommandSurfaceProps,
  "hasUnsavedProjectChanges" | "isLoadingProject" | "isSavingProject" | "lastSavedAt" | "persistenceDisabled"
>): { value: string; tone: TopSurfaceTone; title: string } {
  if (props.persistenceDisabled) {
    return {
      value: "No project",
      tone: "warning",
      title: "Select or create a project to save map state.",
    };
  }
  if (props.isLoadingProject) {
    return {
      value: "Loading",
      tone: "accent",
      title: "A saved map project is loading.",
    };
  }
  if (props.isSavingProject) {
    return {
      value: "Saving",
      tone: "accent",
      title: "The selected map project save is in progress.",
    };
  }
  if (props.hasUnsavedProjectChanges) {
    return {
      value: "Unsaved",
      tone: "warning",
      title: "The selected map project has unsaved changes.",
    };
  }
  if (props.lastSavedAt) {
    return {
      value: formatSavedTime(props.lastSavedAt),
      tone: "success",
      title: `Last saved at ${props.lastSavedAt}.`,
    };
  }
  return {
    value: "Draft",
    tone: "neutral",
    title: "No map project save has been recorded in this session.",
  };
}

function toneForeground(tone: TopSurfaceTone): string {
  switch (tone) {
    case "accent":
      return MAP_COLORS.interaction;
    case "success":
      return MAP_COLORS.success;
    case "warning":
      return MAP_COLORS.warning;
    case "danger":
      return MAP_COLORS.error;
    default:
      return MAP_COLORS.textSecondary;
  }
}

function chipStyle(interactive: boolean, tone: TopSurfaceTone): React.CSSProperties {
  /* Status is carried by the value text colour alone — no green/red frames,
     no tinted pill backgrounds. Containers stay neutral hairlines. */
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    /* Shrinkable, but never below a readable floor — title attrs keep the
       full values reachable when ellipsized. */
    minWidth: 0,
    maxWidth: "14rem",
    flexShrink: 1,
    height: "1.625rem",
    padding: `0 ${MAP_SPACING.xs}`,
    borderRadius: 0,
    border: tone === "neutral"
      ? "1px solid transparent"
      : "1px solid var(--syn-border-subtle, rgba(148, 163, 184, 0.28))",
    background: "transparent",
    color: toneForeground(tone),
    font: "inherit",
    cursor: interactive ? "pointer" : "default",
    overflow: "hidden",
  };
}

function SurfaceChip({
  label,
  value,
  tone = "neutral",
  title,
  onClick,
  testId,
}: {
  label: string;
  value: string;
  tone?: TopSurfaceTone;
  title?: string;
  onClick?: () => void;
  testId?: string;
}): React.ReactElement {
  const interactive = typeof onClick === "function";
  const content = (
    <>
      <span style={chipLabelStyle}>{label}</span>
      <span style={{ ...chipValueStyle, color: toneForeground(tone) }}>{value}</span>
      {(tone === "warning" || tone === "danger") && interactive ? (
        <AlertTriangle size={MAP_ICON_SIZES.xs} strokeWidth={1.8} aria-hidden="true" />
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        style={chipStyle(true, tone)}
        onClick={onClick}
        title={title}
        aria-label={title ?? `${label}: ${value}`}
        data-testid={testId}
      >
        {content}
      </button>
    );
  }

  return (
    <span style={chipStyle(false, tone)} title={title} data-testid={testId}>
      {content}
    </span>
  );
}

export const MapTopCommandSurface: React.FC<MapTopCommandSurfaceProps> = ({
  activeActivityLabel,
  projectName = null,
  workspaceView,
  taskLensLabel,
  hasUnsavedProjectChanges = false,
  persistenceDisabled = false,
  isSavingProject = false,
  isLoadingProject = false,
  lastSavedAt = null,
  scopeLabel = null,
  scopeTitle,
  crsLabel = null,
  crsTone = "neutral",
  crsTitle,
  onOpenCrsReadiness,
  activeLayerLabel = null,
  activeLayerTitle,
  searchSlot,
  mapToolsSlot,
  contextBarSlot,
  commandSlot,
  utilitySlot,
  modalControlSlot,
  trailingSlot,
  titleId = "map-explorer-title",
}) => {
  const saveState = resolveSaveState({
    hasUnsavedProjectChanges,
    isLoadingProject,
    isSavingProject,
    lastSavedAt,
    persistenceDisabled,
  });
  const hasProjectName = Boolean(projectName && projectName.trim().length > 0);
  const showProjectChip = hasProjectName;
  const showSaveChip = !persistenceDisabled || isLoadingProject || isSavingProject || hasUnsavedProjectChanges || Boolean(lastSavedAt);
  const modeLabel = `${formatWorkspaceLabel(workspaceView)} · ${taskLensLabel}`;
  const utilityContent = utilitySlot ?? trailingSlot;
  const hasTrailingContent = Boolean(utilityContent || modalControlSlot);
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const [surfaceWidth, setSurfaceWidth] = React.useState<number | null>(null);
  React.useEffect(() => {
    const node = surfaceRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (typeof width === "number") setSurfaceWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // The context shortcuts duplicate commands that stay reachable through the
  // grouped menus, quick actions, and the canvas control dock. Below this
  // width they would starve the menu bar into its hamburger fallback, so the
  // cluster is dropped instead. Unmeasured environments keep it visible.
  const showContextBar = contextBarSlot != null && (surfaceWidth == null || surfaceWidth >= CONTEXT_BAR_MIN_SURFACE_WIDTH);
  const showMetadataRail = surfaceWidth == null || surfaceWidth >= METADATA_RAIL_MIN_SURFACE_WIDTH;

  return (
    <div
      ref={surfaceRef}
      style={shellStyle}
      role="toolbar"
      aria-label="Map command bar"
      data-map-premium-header="true"
      data-map-top-command-surface="true"
      data-ui-proof="real-topbar"
      data-testid="map-top-command-surface"
    >
      <div style={identityRowStyle} data-testid="map-top-command-surface-identity-row">
        <div style={leadingClusterStyle}>
          <div style={identityClusterStyle}>
            {/* The active activity is announced via aria-label and shown by the
                Mode chip — no duplicate activity pill next to the brand. */}
            <div
              style={brandRowStyle}
              id={titleId}
              aria-label={`Map Explorer — ${activeActivityLabel}`}
              data-testid="map-command-center-title"
            >
              <span aria-hidden data-testid="map-command-brand" style={brandAccentStyle} />
              <span style={brandCopyStyle}>
                <span style={brandKickerStyle}>Urban Analytics</span>
                <span style={brandLineStyle}>
                  <span>Map Explorer</span>
                </span>
              </span>
            </div>
          </div>
          <div style={chipRailStyle}>
            {showProjectChip ? (
              <SurfaceChip
                label="Project"
                value={projectName && projectName.trim().length > 0 ? projectName : "No project"}
                title={projectName ?? "No project selected."}
                testId="map-top-command-surface-project"
              />
            ) : null}
            <SurfaceChip label="Mode" value={modeLabel} title={`Current workspace mode and lens: ${modeLabel}.`} />
            {showSaveChip ? (
              <SurfaceChip label="Save" value={saveState.value} tone={saveState.tone} title={saveState.title} testId="map-top-command-surface-save-state" />
            ) : null}
          </div>
        </div>

      </div>

      <div style={menuRowStyle} data-testid="map-top-command-surface-menu-row">
        <div style={commandClusterStyle}>{commandSlot}</div>
        <div style={centerSearchSlotStyle} data-testid="map-top-command-surface-center-search">
          <div style={searchSlotStyle}>{searchSlot}</div>
        </div>
        {showMetadataRail ? (
          <div style={contextRailStyle}>
            <SurfaceChip
              label="Scope"
              value={scopeLabel && scopeLabel.trim().length > 0 ? scopeLabel : "Visible extent"}
              title={scopeTitle ?? "Current visible map extent."}
              testId="map-top-command-surface-scope"
            />
            {crsLabel ? (
              <SurfaceChip
                label="CRS"
                value={crsLabel.replace(/^CRS\s+/, "")}
                tone={crsTone}
                title={crsTitle}
                onClick={onOpenCrsReadiness}
                testId="map-top-command-surface-crs"
              />
            ) : null}
            {activeLayerLabel ? (
              <SurfaceChip
                label="Layer"
                value={activeLayerLabel}
                title={activeLayerTitle ?? activeLayerLabel}
                testId="map-top-command-surface-layer"
              />
            ) : null}
          </div>
        ) : null}
        {mapToolsSlot ? <div style={mapToolRailStyle}>{mapToolsSlot}</div> : null}
        {showContextBar ? (
          <div
            style={contextBarClusterStyle}
            role="group"
            aria-label="Layer context and selection controls"
            data-testid="map-context-bar-cluster"
          >
          {contextBarSlot}
        </div>
      ) : null}
      </div>

      {hasTrailingContent ? (
        <div style={trailingClusterStyle} data-testid="map-top-command-surface-trailing">
          {utilityContent ? (
            <div style={utilityClusterStyle} data-testid="map-top-command-surface-utility-controls">
              {utilityContent}
            </div>
          ) : null}
          {modalControlSlot ? (
            <div
              style={modalControlClusterStyle}
              role="group"
              aria-label="Map explorer modal controls"
              data-testid="map-top-command-surface-modal-controls"
            >
              {modalControlSlot}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
