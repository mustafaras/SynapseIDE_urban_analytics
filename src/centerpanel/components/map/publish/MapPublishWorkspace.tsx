import React from "react";
import {
  ClipboardCheck,
  Database,
  FileImage,
  FileText,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  type GisStatusKey,
} from "../mapTokens";
import type { MapSidebarTabId } from "../navigation";
import { MapWorkbenchSidebar, type MapWorkbenchSidebarTab } from "../sidebar";
import { GisStatusChip } from "../ui";

export type MapPublishTabId = Extract<
  MapSidebarTabId,
  | "publish-figure"
  | "publish-data-export"
  | "publish-report"
  | "publish-offline-package"
  | "publish-review-package"
>;

export interface MapPublishReadinessItem {
  id: string;
  label: string;
  status: GisStatusKey;
  detail: string;
  required?: boolean;
  title?: string;
}

export interface MapPublishPathAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export interface MapPublishPathMeta {
  label: string;
  value: string;
  status?: GisStatusKey;
}

export interface MapPublishPathPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  meta?: readonly MapPublishPathMeta[];
  actions?: readonly MapPublishPathAction[];
  children?: React.ReactNode;
}

export interface MapPublishWorkspaceProps {
  activeTabId: string;
  onTabChange: (id: string) => void;
  readinessItems: readonly MapPublishReadinessItem[];
  figure: React.ReactNode;
  dataExport: React.ReactNode;
  report: React.ReactNode;
  offlinePackage: React.ReactNode;
  reviewPackage: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  width?: number | string;
}

const PUBLISH_TAB_DEFINITIONS: ReadonlyArray<{
  id: MapPublishTabId;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "publish-figure", label: "Figure", icon: <FileImage size={13} aria-hidden /> },
  { id: "publish-data-export", label: "Data Export", icon: <Database size={13} aria-hidden /> },
  { id: "publish-report", label: "Report", icon: <FileText size={13} aria-hidden /> },
  { id: "publish-offline-package", label: "Offline Package", icon: <PackageCheck size={13} aria-hidden /> },
  { id: "publish-review-package", label: "Review Package", icon: <ClipboardCheck size={13} aria-hidden /> },
];

const bodyStyle: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: MAP_SPACING.md,
  minHeight: "100%",
  padding: MAP_SPACING.md,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const readinessSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  paddingBottom: MAP_SPACING.md,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const readinessHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
};

const sectionTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const readinessGridStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
};

const readinessItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(7rem, 0.34fr) minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  alignItems: "start",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
};

const readinessLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  minWidth: 0,
};

const readinessDetailStyle: React.CSSProperties = {
  minWidth: 0,
  color: MAP_COLORS.textSecondary,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const panelSlotStyle: React.CSSProperties = {
  minWidth: 0,
};

const pathPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.md,
  minWidth: 0,
};

const pathHeaderStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  padding: MAP_SPACING.sm,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
};

const pathEyebrowStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const pathTitleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const pathDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const pathMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: MAP_SPACING.xs,
};

const pathMetaItemStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  minWidth: 0,
  padding: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
};

const pathMetaLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const pathMetaValueStyle: React.CSSProperties = {
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const actionButtonBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minHeight: "1.875rem",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const primaryActionStyle: React.CSSProperties = {
  ...actionButtonBaseStyle,
  background: MAP_COLORS.interactionSubtle,
  borderColor: MAP_COLORS.focus,
  color: MAP_COLORS.interaction,
};

const disabledActionStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const disabledReasonStyle: React.CSSProperties = {
  color: MAP_COLORS.caveatText,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

function summarizeReadiness(items: readonly MapPublishReadinessItem[]): { label: string; status: GisStatusKey } {
  if (items.some((item) => item.status === "blocked")) return { label: "Blocked", status: "blocked" };
  if (items.some((item) => item.status === "caveat" || item.status === "unknown")) {
    return { label: "Needs review", status: "caveat" };
  }
  return { label: "Ready", status: "ready" };
}

const MapPublishReadinessChecklist: React.FC<{
  items: readonly MapPublishReadinessItem[];
}> = ({ items }) => {
  const summary = summarizeReadiness(items);

  return (
    <section
      style={readinessSectionStyle}
      aria-label="Publish readiness checklist"
      data-testid="map-publish-readiness"
    >
      <div style={readinessHeaderStyle}>
        <div style={sectionTitleStyle}>
          <ShieldCheck size={12} aria-hidden />
          Readiness Checklist
        </div>
        <GisStatusChip status={summary.status} label={summary.label} density="compact" data-testid="map-publish-readiness-summary" />
      </div>
      <div style={readinessGridStyle}>
        {items.map((item) => (
          <div
            key={item.id}
            style={readinessItemStyle}
            title={item.title}
            data-testid={`map-publish-readiness-${item.id}`}
          >
            <div style={readinessLabelStyle}>
              <GisStatusChip status={item.status} label={item.label} density="compact" />
              {item.required ? (
                <span style={{ color: MAP_COLORS.textMuted, fontSize: MAP_TYPOGRAPHY.fontSize.xs }}>Required</span>
              ) : null}
            </div>
            <div style={readinessDetailStyle}>{item.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const MapPublishBody: React.FC<{
  readinessItems: readonly MapPublishReadinessItem[];
  children: React.ReactNode;
}> = ({ readinessItems, children }) => (
  <div style={bodyStyle} data-testid="map-publish-tab-body">
    <MapPublishReadinessChecklist items={readinessItems} />
    <div style={panelSlotStyle} data-testid="map-publish-panel-slot">
      {children}
    </div>
  </div>
);

export const MapPublishPathPanel: React.FC<MapPublishPathPanelProps> = ({
  eyebrow,
  title,
  description,
  meta = [],
  actions = [],
  children,
}) => (
  <section style={pathPanelStyle} aria-label={title}>
    <div style={pathHeaderStyle}>
      <div style={pathEyebrowStyle}>{eyebrow}</div>
      <h3 style={pathTitleStyle}>{title}</h3>
      <p style={pathDescriptionStyle}>{description}</p>
      {meta.length > 0 ? (
        <div style={pathMetaGridStyle}>
          {meta.map((item) => (
            <div key={`${item.label}-${item.value}`} style={pathMetaItemStyle}>
              <span style={pathMetaLabelStyle}>{item.label}</span>
              <span style={pathMetaValueStyle} title={item.value}>{item.value}</span>
              {item.status ? <GisStatusChip status={item.status} label={item.status} density="compact" /> : null}
            </div>
          ))}
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
          <div style={actionRowStyle}>
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                style={{
                  ...(action.primary ? primaryActionStyle : actionButtonBaseStyle),
                  ...(action.disabled ? disabledActionStyle : {}),
                }}
                disabled={action.disabled}
                onClick={action.onClick}
                title={action.disabled ? action.disabledReason : action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
          {actions
            .filter((action) => action.disabled && action.disabledReason)
            .map((action) => (
              <div key={`${action.label}-disabled`} style={disabledReasonStyle}>
                {action.label}: {action.disabledReason}
              </div>
            ))}
        </div>
      ) : null}
    </div>
    {children}
  </section>
);

export const MapPublishWorkspace: React.FC<MapPublishWorkspaceProps> = ({
  activeTabId,
  onTabChange,
  readinessItems,
  figure,
  dataExport,
  report,
  offlinePackage,
  reviewPackage,
  collapsed = false,
  onToggleCollapse,
  onClose,
  width = "100%",
}) => {
  const contentByTab: Record<MapPublishTabId, React.ReactNode> = {
    "publish-figure": figure,
    "publish-data-export": dataExport,
    "publish-report": report,
    "publish-offline-package": offlinePackage,
    "publish-review-package": reviewPackage,
  };

  const tabs: MapWorkbenchSidebarTab[] = PUBLISH_TAB_DEFINITIONS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    render: () => (
      <MapPublishBody readinessItems={readinessItems}>
        {contentByTab[tab.id]}
      </MapPublishBody>
    ),
  }));

  return (
    <MapWorkbenchSidebar
      title="Publish"
      subtitle="Workspace"
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={onTabChange}
      collapsed={collapsed}
      {...(onToggleCollapse ? { onToggleCollapse } : {})}
      {...(onClose ? { onClose } : {})}
      width={width}
      data-testid="map-publish-workspace"
    />
  );
};
