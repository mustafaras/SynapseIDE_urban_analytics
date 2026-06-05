import React from "react";
import { ChevronDown, Map } from "lucide-react";
import { BASE_STYLES, type BaseLayerId } from "./mapTypes";
import {
  MAP_COLORS,
  MAP_ICON_SIZES,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
} from "./mapTokens";

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface MapLayerPanelProps {
  activeLayer: BaseLayerId;
  onSetLayer: (layer: BaseLayerId) => void;
  compact?: boolean;
}

const baseLayerShell: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  minWidth: MAP_SPACING.zero,
  padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
  borderLeft: MAP_STROKES.hairlineSubtle,
};

const baseLayerLabel: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  letterSpacing: MAP_TYPOGRAPHY.letterSpacing.caps,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const baseLayerSelect: React.CSSProperties = {
  minHeight: "1.75rem",
  maxWidth: "8.75rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairline,
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamily,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.medium,
  cursor: "pointer",
};

const compactBaseShell: React.CSSProperties = {
  position: "relative",
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  minWidth: MAP_SPACING.zero,
  paddingLeft: MAP_SPACING.xs,
  borderLeft: MAP_STROKES.hairlineSubtle,
};

const compactBaseTrigger: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.25rem",
  minHeight: "1.625rem",
  maxWidth: "7rem",
  padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid transparent",
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const compactBaseMenu: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.375rem)",
  right: 0,
  zIndex: MAP_Z_INDEX.dropdown,
  width: "12rem",
  display: "grid",
  gap: "0.125rem",
  padding: MAP_SPACING.xs,
  borderRadius: MAP_RADIUS.sm,
  border: MAP_STROKES.hairlineStrong,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.none,
};

const compactBaseItem: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1rem minmax(0, 1fr)",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  minHeight: "2rem",
  padding: `${MAP_SPACING.xs} ${MAP_SPACING.sm}`,
  borderRadius: MAP_RADIUS.sm,
  border: "1px solid transparent",
  background: MAP_COLORS.transparent,
  color: MAP_COLORS.textSecondary,
  textAlign: "left",
  fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  cursor: "pointer",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export const MapLayerPanel: React.FC<MapLayerPanelProps> = ({
  activeLayer,
  onSetLayer,
  compact = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const shellRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (shellRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (compact) {
    return (
      <div ref={shellRef} style={compactBaseShell} aria-label="Base map layer selector">
        <button
          type="button"
          style={compactBaseTrigger}
          onClick={() => setOpen((current) => !current)}
          aria-label={`Select base map layer, current ${BASE_STYLES[activeLayer].name}`}
          aria-expanded={open}
          aria-haspopup="menu"
          title="Select base map layer"
        >
          <Map size={MAP_ICON_SIZES.sm} aria-hidden="true" />
          <span style={{ color: MAP_COLORS.textMuted, textTransform: "uppercase" }}>Base</span>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {BASE_STYLES[activeLayer].name}
          </span>
          <ChevronDown size={MAP_ICON_SIZES.xs} aria-hidden="true" />
        </button>
        {open ? (
          <div style={compactBaseMenu} role="menu" aria-label="Base map layers">
            {(Object.keys(BASE_STYLES) as BaseLayerId[]).map((key) => {
              const active = key === activeLayer;
              return (
                <button
                  key={key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  style={{
                    ...compactBaseItem,
                    background: active ? MAP_COLORS.selectedSubtle : MAP_COLORS.transparent,
                    color: active ? MAP_COLORS.interaction : MAP_COLORS.textSecondary,
                    border: `1px solid ${active ? MAP_COLORS.focus : "transparent"}`,
                    boxShadow: active ? `inset 2px 0 0 ${MAP_COLORS.interaction}` : "none",
                  }}
                  onClick={() => {
                    onSetLayer(key);
                    setOpen(false);
                  }}
                >
                  <Map size={MAP_ICON_SIZES.xs} aria-hidden="true" />
                  <span>{BASE_STYLES[key].name}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <label
      style={{
        ...baseLayerShell,
        ...(compact ? {
          flex: "0 0 auto",
          gap: "0.1875rem",
          padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
        } satisfies React.CSSProperties : null),
      }}
      aria-label="Base map layer selector"
    >
      <span style={{
        ...baseLayerLabel,
        ...(compact ? {
          fontSize: "0.6875rem",
          letterSpacing: 0,
        } satisfies React.CSSProperties : null),
      }}>
        Base
      </span>
      <select
        style={{
          ...baseLayerSelect,
          ...(compact ? {
            minHeight: "1.625rem",
            maxWidth: "7.5rem",
            padding: `${MAP_SPACING.zero} ${MAP_SPACING.xs}`,
            border: "1px solid transparent",
            fontFamily: MAP_TYPOGRAPHY.fontFamilyMono,
          } satisfies React.CSSProperties : null),
        }}
        value={activeLayer}
        onChange={(event) => onSetLayer(event.target.value as BaseLayerId)}
        aria-label="Select base map layer"
        title="Select base map layer"
      >
        {(Object.keys(BASE_STYLES) as BaseLayerId[]).map((key) => (
          <option key={key} value={key}>
            {BASE_STYLES[key].name}
          </option>
        ))}
      </select>
    </label>
  );
};
