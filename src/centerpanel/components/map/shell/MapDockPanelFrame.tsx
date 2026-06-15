import React from "react";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { GisIconButton } from "../ui";

export interface MapDockPanelFrameSummaryItem {
  id: string;
  label: string;
  value: string;
  title?: string;
}

export interface MapDockPanelFrameProps {
  title: string;
  subtitle?: string;
  activeWorkspaceName?: string;
  summaryItems?: readonly MapDockPanelFrameSummaryItem[];
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  collapsed?: boolean;
  collapseLabel?: string;
  closeLabel?: string;
  collapseTestId?: string;
  closeTestId?: string;
  className?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  "aria-label"?: string;
  "data-testid"?: string;
}

const frameStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.none,
  background: MAP_COLORS.bgPanel,
  color: MAP_COLORS.text,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  boxShadow: "none",
};

const headerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "2.75rem",
  padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.bgHeader,
};

const titleStackStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.125rem",
  minWidth: 0,
};

const eyebrowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.625rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
  ...MAP_TEXT_STYLES.truncate,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: 0,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  ...MAP_TEXT_STYLES.truncate,
};

const activeWorkspaceStyle: React.CSSProperties = {
  color: MAP_COLORS.interaction,
};

const headerActionsStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
  minWidth: 0,
};

const summaryStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  borderBottom: MAP_STROKES.hairlineSubtle,
  background: MAP_COLORS.transparent,
};

const summaryItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
  minHeight: "1.75rem",
  padding: `0 ${MAP_SPACING.md}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const summaryLabelStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: "0.5625rem",
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
  ...MAP_TEXT_STYLES.truncate,
};

const summaryValueStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.truncate,
};

const bodyStyle: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
};

const footerStyle: React.CSSProperties = {
  minWidth: 0,
  borderTop: MAP_STROKES.hairlineSubtle,
};

export const MapDockPanelFrame: React.FC<MapDockPanelFrameProps> = ({
  title,
  subtitle,
  activeWorkspaceName,
  summaryItems,
  actions,
  footer,
  children,
  onToggleCollapse,
  onClose,
  collapsed = false,
  collapseLabel = collapsed ? `Expand ${title}` : `Collapse ${title}`,
  closeLabel = `Close ${title}`,
  collapseTestId,
  closeTestId,
  className,
  style,
  bodyStyle: bodyStyleOverride,
  "aria-label": ariaLabel,
  "data-testid": testId,
}) => (
  <section
    className={className}
    style={{ ...frameStyle, ...style }}
    aria-label={ariaLabel ?? title}
    data-map-dock-panel-frame="true"
    data-testid={testId}
  >
    <header style={headerStyle}>
      <div style={titleStackStyle}>
        <span style={eyebrowStyle}>
          {subtitle}
          {activeWorkspaceName ? (
            <>
              <span aria-hidden="true">/</span>
              <span style={activeWorkspaceStyle}>{activeWorkspaceName}</span>
            </>
          ) : null}
        </span>
        <h2 style={titleStyle}>{title}</h2>
      </div>
      <div style={headerActionsStyle}>
        {actions}
        {onToggleCollapse ? (
          <GisIconButton
            label={collapseLabel}
            icon={collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            data-testid={collapseTestId}
            onClick={onToggleCollapse}
          />
        ) : null}
        {onClose ? (
          <GisIconButton
            label={closeLabel}
            icon={<X size={14} />}
            data-testid={closeTestId}
            onClick={onClose}
          />
        ) : null}
      </div>
    </header>
    {summaryItems && summaryItems.length > 0 ? (
      <div style={summaryStyle} aria-label={`${title} summary`}>
        {summaryItems.map((item, index) => (
          <span
            key={item.id}
            style={{
              ...summaryItemStyle,
              ...(index === summaryItems.length - 1 ? { borderBottom: MAP_STROKES.none } : {}),
            }}
            title={item.title}
          >
            <span style={summaryLabelStyle}>{item.label}</span>
            <span style={summaryValueStyle}>{item.value}</span>
          </span>
        ))}
      </div>
    ) : null}
    <div style={{ ...bodyStyle, ...bodyStyleOverride }}>
      {children}
    </div>
    {footer ? <footer style={footerStyle}>{footer}</footer> : null}
  </section>
);
