import React from "react";
import { AlertTriangle } from "lucide-react";
import type { MapWorkspaceView } from "./mapExperience";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";

type TopSurfaceTone = "neutral" | "accent" | "success" | "warning" | "danger";

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
  flexWrap: "wrap",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "3.25rem",
  padding: `0.375rem ${MAP_SPACING.md} 0.375rem calc(var(--map-activity-rail-width, 2.625rem) + ${MAP_SPACING.md})`,
  background: [
    "linear-gradient(115deg, transparent 0%, color-mix(in srgb, var(--syn-interaction-active, #3794ff) 4%, transparent) 38%, transparent 72%)",
    "linear-gradient(180deg, color-mix(in srgb, var(--syn-surface-header, #20242b) 98%, #ffffff 2%), var(--syn-surface-header, #20242b))",
  ].join(", "),
  backgroundSize: "34rem 100%, 100% 100%",
  borderBottom: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.18)) 52%, transparent)",
  boxShadow: "none",
  overflow: "visible",
  position: "relative",
  zIndex: MAP_Z_INDEX.dropdown + 1,
  isolation: "isolate",
};

const clusterShellStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  minHeight: "2rem",
  padding: `0.125rem ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid transparent",
  background: "transparent",
  overflow: "visible",
};

const leadingClusterStyle: React.CSSProperties = {
  ...clusterShellStyle,
  display: "inline-flex",
  flex: "0 1 auto",
  gap: MAP_SPACING.sm,
  minWidth: "14rem",
};

const identityClusterStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.125rem",
  minWidth: "10rem",
};

const brandRowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const brandAccentStyle: React.CSSProperties = {
  width: "1.625rem",
  height: "1.625rem",
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid color-mix(in srgb, var(--syn-interaction-active, #3794ff) 44%, transparent)",
  background: [
    "linear-gradient(135deg, color-mix(in srgb, var(--syn-interaction-active, #3794ff) 88%, #ffffff 8%), transparent 54%)",
    "linear-gradient(315deg, color-mix(in srgb, var(--syn-status-running, #4ec27d) 72%, transparent), transparent 58%)",
    "var(--syn-surface-header, #20242b)",
  ].join(", "),
  boxShadow: "inset 0 0 0 1px color-mix(in srgb, #ffffff 10%, transparent)",
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
  overflow: "hidden",
  textOverflow: "ellipsis",
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
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const activityPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  maxWidth: "8rem",
  height: "1.125rem",
  padding: `0 ${MAP_SPACING.xs}`,
  border: "1px solid transparent",
  borderRadius: MAP_RADIUS.xs,
  color: MAP_COLORS.textMuted,
  background: "color-mix(in srgb, var(--syn-surface-subtle, rgba(15, 23, 42, 0.2)) 28%, transparent)",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const chipRailStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const searchClusterStyle: React.CSSProperties = {
  ...clusterShellStyle,
  display: "flex",
  alignItems: "center",
  flex: "1 1 36rem",
  gap: MAP_SPACING.xs,
  minWidth: "18rem",
};

const searchSlotStyle: React.CSSProperties = {
  flex: "1 1 18rem",
  minWidth: "11rem",
  maxWidth: "28rem",
};

const contextRailStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  overflow: "hidden",
};

const mapToolRailStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minWidth: "8rem",
  flex: "1 1 16rem",
  overflow: "hidden",
  borderLeft: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.16)) 42%, transparent)",
  marginLeft: MAP_SPACING.xs,
  paddingLeft: MAP_SPACING.sm,
};

const commandClusterStyle: React.CSSProperties = {
  ...clusterShellStyle,
  display: "inline-flex",
  flex: "1 1 24rem",
  justifyContent: "flex-end",
  padding: `${MAP_SPACING.zero} ${MAP_SPACING.zero}`,
};

const contextBarClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  flex: "0 1 auto",
  minWidth: 0,
  overflow: "visible",
  paddingLeft: MAP_SPACING.sm,
  borderLeft: "1px solid color-mix(in srgb, var(--syn-border-subtle, rgba(148, 163, 184, 0.16)) 42%, transparent)",
};

const trailingClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minWidth: MAP_SPACING.zero,
  flex: "0 0 auto",
  position: "relative",
  zIndex: 1,
  paddingLeft: MAP_SPACING.sm,
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

function toneBackground(tone: TopSurfaceTone): string {
  if (tone === "neutral") {
    return "var(--syn-surface-subtle, rgba(15, 23, 42, 0.42))";
  }
  return "color-mix(in srgb, var(--syn-interaction-active, #3794ff) 10%, transparent)";
}

function chipStyle(interactive: boolean, tone: TopSurfaceTone): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: MAP_SPACING.xs,
    /* Shrinkable, but never below a readable floor — title attrs keep the
       full values reachable when ellipsized. */
    minWidth: "4.5rem",
    maxWidth: "11rem",
    flexShrink: 1,
    height: "1.5rem",
    padding: `0 ${MAP_SPACING.xs}`,
    borderRadius: MAP_RADIUS.xs,
    border: tone === "neutral"
      ? "1px solid transparent"
      : `1px solid color-mix(in srgb, ${toneForeground(tone)} 30%, var(--syn-border-subtle, rgba(148, 163, 184, 0.32)))`,
    background: tone === "neutral"
      ? "transparent"
      : toneBackground(tone),
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

  return (
    <div
      style={shellStyle}
      role="toolbar"
      aria-label="Map command bar"
      data-map-premium-header="true"
      data-map-top-command-surface="true"
      data-testid="map-top-command-surface"
    >
      <div style={leadingClusterStyle}>
        <div style={identityClusterStyle}>
          <div style={brandRowStyle} id={titleId} aria-label="Map Explorer" data-testid="map-command-center-title">
            <span aria-hidden data-testid="map-command-brand" style={brandAccentStyle} />
            <span style={brandCopyStyle}>
              <span style={brandKickerStyle}>Urban Analytics</span>
              <span style={brandLineStyle}>
                <span>Map Explorer</span>
                <span aria-hidden style={activityPillStyle}>{activeActivityLabel}</span>
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

      <div style={searchClusterStyle}>
        <div style={searchSlotStyle}>{searchSlot}</div>
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
        {mapToolsSlot ? <div style={mapToolRailStyle}>{mapToolsSlot}</div> : null}
      </div>

      {contextBarSlot ? (
        <div
          style={contextBarClusterStyle}
          role="group"
          aria-label="Layer context and selection controls"
          data-testid="map-context-bar-cluster"
        >
          {contextBarSlot}
        </div>
      ) : null}

      <div style={commandClusterStyle}>{commandSlot}</div>
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
      ) : <span aria-hidden />}
    </div>
  );
};
