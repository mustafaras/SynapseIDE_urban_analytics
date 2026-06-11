import React from "react";
import {
  Bookmark,
  Database,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  MapPinned,
  PackageCheck,
  Type,
} from "lucide-react";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { MAP_ANNOTATION_LIMIT, MAP_BOOKMARK_LIMIT } from "../mapTypes";
import { GisStatusChip } from "../ui";

export interface MapPublicationMarksPanelProps {
  annotationCount: number;
  pinCount: number;
  bookmarkCount: number;
  annotationMode: boolean;
  pinSidebarVisible: boolean;
  onToggleAnnotationMode?: () => void;
  onTogglePinSidebar?: () => void;
  onOpenDataExport?: () => void;
  onOpenReport?: () => void;
  onOpenReviewPackage?: () => void;
}

interface MarkMetric {
  id: string;
  label: string;
  value: string;
  status: GisStatusKey;
  icon: React.ReactNode;
}

interface MarkControl {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
}

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.sm,
  paddingTop: MAP_SPACING.sm,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  minWidth: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  ...MAP_TEXT_STYLES.titleWrap,
};

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))",
  gap: MAP_SPACING.xs,
};

const metricStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.1875rem",
  minWidth: 0,
  padding: MAP_SPACING.xs,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const metricLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: 0,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
};

const metricValueStyle: React.CSSProperties = {
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  ...MAP_TEXT_STYLES.valueWrap,
};

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.xs,
};

const controlButtonStyle = (pressed = false): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: MAP_SPACING.xs,
  minHeight: "1.875rem",
  maxWidth: "100%",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: pressed ? MAP_STROKES.hairlineStrong : MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: pressed ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
  color: pressed ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  textAlign: "center",
  whiteSpace: "normal",
});

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatTotal(annotationCount: number, pinCount: number, bookmarkCount: number): string {
  const total = annotationCount + pinCount + bookmarkCount;
  return `${formatCount(total)} mark${total === 1 ? "" : "s"}`;
}

function hasHandler(control: MarkControl | null): control is MarkControl {
  return control !== null;
}

export const MapPublicationMarksPanel: React.FC<MapPublicationMarksPanelProps> = ({
  annotationCount,
  pinCount,
  bookmarkCount,
  annotationMode,
  pinSidebarVisible,
  onToggleAnnotationMode,
  onTogglePinSidebar,
  onOpenDataExport,
  onOpenReport,
  onOpenReviewPackage,
}) => {
  const markTotal = annotationCount + pinCount + bookmarkCount;
  const metrics: MarkMetric[] = [
    {
      id: "map-image",
      label: "Map image",
      value: annotationCount > 0 ? `${formatCount(annotationCount)} visible annotation symbol${annotationCount === 1 ? "" : "s"}` : "Visible layer labels only",
      status: "ready",
      icon: <FileImage size={MAP_ICON_SIZES.xs} aria-hidden />,
    },
    {
      id: "data-export",
      label: "Data export",
      value: pinCount > 0 ? `${formatCount(pinCount)} pin feature${pinCount === 1 ? "" : "s"}` : "Pin target empty",
      status: pinCount > 0 ? "ready" : "caveat",
      icon: <Database size={MAP_ICON_SIZES.xs} aria-hidden />,
    },
    {
      id: "report",
      label: "Report",
      value: annotationCount > 0 ? "Snapshot marks" : "Snapshot clean",
      status: "ready",
      icon: <FileText size={MAP_ICON_SIZES.xs} aria-hidden />,
    },
    {
      id: "package",
      label: "Package",
      value: markTotal > 0 ? formatTotal(annotationCount, pinCount, bookmarkCount) : "No review marks",
      status: markTotal > 0 ? "ready" : "caveat",
      icon: <PackageCheck size={MAP_ICON_SIZES.xs} aria-hidden />,
    },
  ];
  const controls: MarkControl[] = [
    onToggleAnnotationMode
      ? {
          id: "annotation-mode",
          label: annotationMode ? "Annotation on" : "Annotation mode",
          icon: <Type size={MAP_ICON_SIZES.sm} aria-hidden />,
          onClick: onToggleAnnotationMode,
          pressed: annotationMode,
        }
      : null,
    onTogglePinSidebar
      ? {
          id: "pin-sidebar",
          label: pinSidebarVisible ? "Pins visible" : "Show pins",
          icon: pinSidebarVisible ? <Eye size={MAP_ICON_SIZES.sm} aria-hidden /> : <EyeOff size={MAP_ICON_SIZES.sm} aria-hidden />,
          onClick: onTogglePinSidebar,
          pressed: pinSidebarVisible,
        }
      : null,
    onOpenDataExport
      ? {
          id: "open-data-export",
          label: "Data export",
          icon: <Database size={MAP_ICON_SIZES.sm} aria-hidden />,
          onClick: onOpenDataExport,
        }
      : null,
    onOpenReport
      ? {
          id: "open-report",
          label: "Report",
          icon: <FileText size={MAP_ICON_SIZES.sm} aria-hidden />,
          onClick: onOpenReport,
        }
      : null,
    onOpenReviewPackage
      ? {
          id: "open-review-package",
          label: "Review package",
          icon: <PackageCheck size={MAP_ICON_SIZES.sm} aria-hidden />,
          onClick: onOpenReviewPackage,
        }
      : null,
  ].filter(hasHandler);

  return (
    <section
      style={panelStyle}
      aria-label="Publication marks"
      data-testid="map-publication-marks-panel"
    >
      <div style={headerStyle}>
        <h4 style={titleStyle}>Publication marks</h4>
        <GisStatusChip
          status={markTotal > 0 ? "ready" : "caveat"}
          label={formatTotal(annotationCount, pinCount, bookmarkCount)}
          density="compact"
          data-testid="map-publication-marks-total"
        />
      </div>

      <div style={metricGridStyle} aria-label="Publication mark counts">
        <div style={metricStyle} data-testid="map-publication-marks-annotations">
          <span style={metricLabelStyle}>
            <Type size={MAP_ICON_SIZES.xs} aria-hidden />
            Annotations
          </span>
          <span style={metricValueStyle}>{formatCount(annotationCount)}/{MAP_ANNOTATION_LIMIT}</span>
        </div>
        <div style={metricStyle} data-testid="map-publication-marks-pins">
          <span style={metricLabelStyle}>
            <MapPinned size={MAP_ICON_SIZES.xs} aria-hidden />
            Pins
          </span>
          <span style={metricValueStyle}>{formatCount(pinCount)}</span>
        </div>
        <div style={metricStyle} data-testid="map-publication-marks-bookmarks">
          <span style={metricLabelStyle}>
            <Bookmark size={MAP_ICON_SIZES.xs} aria-hidden />
            Views
          </span>
          <span style={metricValueStyle}>{formatCount(bookmarkCount)}/{MAP_BOOKMARK_LIMIT}</span>
        </div>
      </div>

      <div style={metricGridStyle} aria-label="Export inclusion">
        {metrics.map((metric) => (
          <div key={metric.id} style={metricStyle} data-testid={`map-publication-marks-${metric.id}`}>
            <span style={metricLabelStyle}>
              {metric.icon}
              {metric.label}
            </span>
            <span style={metricValueStyle}>{metric.value}</span>
            <GisStatusChip status={metric.status} label={metric.status} density="compact" />
          </div>
        ))}
      </div>

      {controls.length > 0 ? (
        <div style={controlRowStyle} aria-label="Publication mark controls">
          {controls.map((control) => (
            <button
              key={control.id}
              type="button"
              style={controlButtonStyle(control.pressed)}
              onClick={control.onClick}
              aria-pressed={control.pressed}
              data-testid={`map-publication-marks-control-${control.id}`}
            >
              {control.icon}
              {control.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
};
