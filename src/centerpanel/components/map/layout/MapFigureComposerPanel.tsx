import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Image, X } from "lucide-react";
import type { OverlayLayerConfig } from "../mapTypes";
import type { MapScientificQAState } from "@/services/map/MapScientificQA";
import {
  buildMapFigureAttributionText,
  composeMapFigure,
  preflightMapFigure,
  type MapFigureSpec,
} from "@/services/map/layout/MapLayoutComposer";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "../mapTokens";
import { createOpaqueFloatingPanelStyle, useDraggableMapPanel } from "../useDraggableMapPanel";

export interface MapFigureComposerPanelProps {
  visible: boolean;
  overlayLayers: OverlayLayerConfig[];
  qaState: MapScientificQAState | null;
  bearing?: number;
  onClose: () => void;
  onExportFigure?: (figure: MapFigureSpec) => void;
  onAnnounce?: (message: string) => void;
}

const panelStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(30rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 10),
  height: "min(40rem, calc(100% - 2rem))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.lg,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: MAP_SPACING.md,
  padding: `${MAP_SPACING.md} ${MAP_SPACING.md} ${MAP_SPACING.sm}`,
  borderBottom: MAP_STROKES.hairlineSubtle,
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
};

const bodyStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: MAP_SPACING.md,
  padding: MAP_SPACING.md,
  alignContent: "start",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const metaRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: MAP_SPACING.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  color: MAP_COLORS.textSecondary,
};

const metaKeyStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
};

const gapRowStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  alignItems: "flex-start",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: MAP_SPACING.md,
  alignItems: "center",
};

const checkboxLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  borderTop: MAP_STROKES.hairlineSubtle,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.text,
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.md}`,
  cursor: "pointer",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
};

const iconButtonStyle: React.CSSProperties = {
  width: "1.875rem",
  height: "1.875rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: MAP_STROKES.hairlineSubtle,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  cursor: "pointer",
};

const sectionTitleStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
};

export const MapFigureComposerPanel: React.FC<MapFigureComposerPanelProps> = ({
  visible,
  overlayLayers,
  qaState,
  bearing = 0,
  onClose,
  onExportFigure,
  onAnnounce,
}) => {
  const panelDrag = useDraggableMapPanel();
  const [title, setTitle] = useState("Urban Analytics Map");
  const derivedAttributionText = useMemo(() => buildMapFigureAttributionText(overlayLayers), [overlayLayers]);
  const [customAttributionText, setCustomAttributionText] = useState<string | null>(null);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [includeScaleBar, setIncludeScaleBar] = useState(true);
  const [includeNorthArrow, setIncludeNorthArrow] = useState(true);
  const attributionText = customAttributionText ?? derivedAttributionText;

  const figure = useMemo(
    () =>
      composeMapFigure({
        overlayLayers,
        title,
        bearing,
        scientificQA: qaState,
        composition: {
          attributionText,
          includeAttribution: true,
          includeLegend,
          includeScaleBar,
          includeNorthArrow,
        },
      }),
    [attributionText, bearing, includeLegend, includeNorthArrow, includeScaleBar, overlayLayers, qaState, title],
  );

  const preflight = useMemo(() => preflightMapFigure(figure), [figure]);

  if (!visible) return null;

  return (
    <aside
      data-draggable-map-panel="true"
      style={{ ...panelStyle, ...panelDrag.panelPositionStyle }}
      role="dialog"
      aria-modal="false"
      aria-label="Publication figure composer"
      data-testid="map-figure-composer"
    >
      <header style={{ ...headerStyle, ...panelDrag.dragHandleStyle }} {...panelDrag.dragHandleProps}>
        <h3 style={titleStyle}>
          <Image size={MAP_ICON_SIZES.md} aria-hidden="true" />
          Compose figure
        </h3>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close figure composer">
          <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
        </button>
      </header>

      <div style={bodyStyle}>
        <label style={labelStyle}>
          Figure title
          <input style={inputStyle} value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Figure title" />
        </label>
        <label style={labelStyle}>
          Attribution
          <textarea
            style={{ ...inputStyle, minHeight: "3.5rem", resize: "vertical" }}
            value={attributionText}
            onChange={(event) => setCustomAttributionText(event.target.value)}
            aria-label="Figure attribution"
            data-testid="map-figure-attribution"
            placeholder="Visible layers must declare source attribution and license metadata before figure export."
          />
        </label>
        <div style={toggleRowStyle} role="group" aria-label="Figure elements">
          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={includeLegend} onChange={(event) => setIncludeLegend(event.target.checked)} /> Legend
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={includeScaleBar} onChange={(event) => setIncludeScaleBar(event.target.checked)} /> Scale bar
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={includeNorthArrow} onChange={(event) => setIncludeNorthArrow(event.target.checked)} /> North arrow
          </label>
        </div>

        <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="map-figure-metadata">
          <span style={sectionTitleStyle}>Figure metadata</span>
          <div style={metaRowStyle}><span style={metaKeyStyle}>Legend</span><span>{figure.legendItems.length} item(s)</span></div>
          <div style={metaRowStyle}><span style={metaKeyStyle}>CRS</span><span>{figure.crs ?? "missing"}</span></div>
          <div style={metaRowStyle}><span style={metaKeyStyle}>Attribution</span><span>{figure.attribution ?? "missing"}</span></div>
          <div style={metaRowStyle}><span style={metaKeyStyle}>Scale bar</span><span>{figure.scaleBar.included ? "included" : "off"}</span></div>
          <div style={metaRowStyle}><span style={metaKeyStyle}>North arrow</span><span>{figure.northArrow.included ? `${figure.northArrow.bearing.toFixed(0)}°` : "off"}</span></div>
          <div style={metaRowStyle}><span style={metaKeyStyle}>Layers</span><span>{figure.visibleLayers.map((layer) => layer.name).join(", ") || "none visible"}</span></div>
          <div style={metaRowStyle}><span style={metaKeyStyle}>Timestamp</span><span>{figure.createdAt}</span></div>
          {figure.qaCaveats.length > 0 ? (
            <div style={metaRowStyle}><span style={metaKeyStyle}>QA caveats</span><span>{figure.qaCaveats.length}</span></div>
          ) : null}
        </div>

        {preflight.blockers.length > 0 ? (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }} data-testid="map-figure-blockers">
            <span style={sectionTitleStyle}>Blocked — fix before export</span>
            {preflight.blockers.map((gap) => (
              <div key={gap.criterion} style={{ ...gapRowStyle, borderColor: MAP_COLORS.error, color: MAP_COLORS.error }}>
                <AlertTriangle size={MAP_ICON_SIZES.sm} aria-hidden="true" />
                <span><strong>{gap.label}:</strong> {gap.reason}{gap.recommendedFix ? ` — ${gap.recommendedFix}` : ""}</span>
              </div>
            ))}
          </div>
        ) : null}

        {preflight.warnings.length > 0 ? (
          <div style={{ display: "grid", gap: MAP_SPACING.xs }}>
            <span style={sectionTitleStyle}>Warnings</span>
            {preflight.warnings.map((gap) => (
              <div key={gap.criterion} style={{ ...gapRowStyle, borderColor: MAP_COLORS.warning, color: MAP_COLORS.warning }}>
                <span><strong>{gap.label}:</strong> {gap.reason}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <footer style={footerStyle}>
        <span style={{ ...metaKeyStyle, display: "inline-flex", alignItems: "center", gap: MAP_SPACING.xs }}>
          {preflight.ok ? (
            <><CheckCircle2 size={MAP_ICON_SIZES.sm} color={MAP_COLORS.success} aria-hidden="true" /> Export ready</>
          ) : (
            <><AlertTriangle size={MAP_ICON_SIZES.sm} color={MAP_COLORS.error} aria-hidden="true" /> {preflight.blockers.length} blocker(s)</>
          )}
        </span>
        <button
          type="button"
          style={{ ...buttonStyle, opacity: preflight.ok ? 1 : 0.5, cursor: preflight.ok ? "pointer" : "not-allowed" }}
          disabled={!preflight.ok}
          data-testid="map-figure-export"
          aria-label="Export composed figure"
          onClick={() => {
            if (!preflight.ok) return;
            onExportFigure?.(figure);
            onAnnounce?.("Composed publication figure exported");
          }}
        >
          <Image size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          Export figure
        </button>
      </footer>
    </aside>
  );
};
