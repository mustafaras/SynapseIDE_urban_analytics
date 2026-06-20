import React, { useCallback, useEffect, useRef } from "react";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  MAP_COLORS,
  MAP_PANEL_SIZES,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TEXT_STYLES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "../mapTokens";
import { IconClose } from "../MapIcons";
import { GisEmptyState, GisIconButton } from "../ui";
import type { LayerStyleUpdate } from "./style/legendContract";
import { LayerInspector } from "./LayerInspector";

export type MapInspectorHostPresentation = "right-rail" | "bottom-drawer";

// The inspector host renders the real LayerInspector for a selected layer. The
// earlier feature/qa/workflow/publish/scene placeholder contexts were never
// produced by the runtime; those concerns are handled by the dedicated right
// dock panels, so the context model is narrowed to the states actually used.
export type MapInspectorContextKind = "none" | "layer";

export type MapInspectorHostContext =
  | { kind: "none" }
  | { kind: "layer"; layer: OverlayLayerConfig; sourceHandle?: SourceHandle | null };

export interface MapInspectorHostProps {
  visible: boolean;
  context: MapInspectorHostContext;
  presentation?: MapInspectorHostPresentation;
  width?: number;
  onClose: () => void;
  onApplyLayerStyle?: (layerId: string, update: LayerStyleUpdate) => void;
  returnFocusTo?: HTMLElement | null;
}

const headerStyle: React.CSSProperties = {
  ...mapStyles.sidePanelHeader,
  minHeight: "3.25rem",
  flexShrink: 0,
};

const titleWrapStyle: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "0.125rem",
};

const eyebrowStyle: React.CSSProperties = {
  color: MAP_COLORS.textMuted,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  ...MAP_TEXT_STYLES.titleWrap,
  color: MAP_COLORS.text,
  fontSize: MAP_TYPOGRAPHY.fontSize.sm,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
};

const placeholderWrapStyle: React.CSSProperties = {
  padding: MAP_SPACING.md,
};

function getHostStyle(presentation: MapInspectorHostPresentation, width?: number): React.CSSProperties {
  if (presentation === "bottom-drawer") {
    return {
      ...mapStyles.sidePanelSurface,
      left: MAP_SPACING.zero,
      right: MAP_SPACING.zero,
      bottom: MAP_SPACING.zero,
      top: "auto",
      height: MAP_PANEL_SIZES.inspectorBottomDrawer,
      borderTop: MAP_STROKES.hairlineStrong,
      borderRadius: `${MAP_RADIUS.sm} ${MAP_RADIUS.sm} 0 0`,
      zIndex: MAP_Z_INDEX.symbologyPanel + 2,
    };
  }

  return {
    ...mapStyles.sidePanelSurface,
    top: MAP_SPACING.zero,
    right: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: width ? `min(${width}px, ${MAP_PANEL_SIZES.inspectorRightRail})` : MAP_PANEL_SIZES.inspectorRightRail,
    maxWidth: MAP_PANEL_SIZES.inspectorRightRail,
    borderLeft: MAP_STROKES.hairlineSubtle,
    zIndex: MAP_Z_INDEX.symbologyPanel + 2,
  };
}

function contextTitle(context: MapInspectorHostContext): string {
  return context.kind === "layer" ? context.layer.name : "Map context";
}

function contextEyebrow(context: MapInspectorHostContext): string {
  return context.kind === "layer" ? "Layer inspector" : "Map inspector";
}

export const MapInspectorHost: React.FC<MapInspectorHostProps> = ({
  visible,
  context,
  presentation = "right-rail",
  width,
  onClose,
  onApplyLayerStyle,
  returnFocusTo = null,
}) => {
  const hostRef = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    const target = returnFocusTo;
    if (!target || !target.isConnected) return;
    window.requestAnimationFrame(() => {
      if (target.isConnected) target.focus({ preventScroll: true });
    });
  }, [returnFocusTo]);

  const handleClose = useCallback(() => {
    onClose();
    restoreFocus();
  }, [onClose, restoreFocus]);

  useEffect(() => {
    if (!visible) return;
    const focusHost = () => hostRef.current?.focus({ preventScroll: true });
    const rafId = window.requestAnimationFrame(() => {
      focusHost();
    });
    const timeoutIds = [50, 150, 300].map((delay) => window.setTimeout(focusHost, delay));
    return () => {
      window.cancelAnimationFrame(rafId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [context.kind, visible]);

  useEffect(() => {
    if (!visible) return;
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      handleClose();
    };
    window.addEventListener("keydown", handleWindowKeyDown, true);
    return () => window.removeEventListener("keydown", handleWindowKeyDown, true);
  }, [handleClose, visible]);

  if (!visible) return null;

  const renderBody = (): React.ReactNode => {
    if (context.kind === "layer") {
      return (
        <LayerInspector
          layer={context.layer}
          sourceHandle={context.sourceHandle ?? null}
          onClose={handleClose}
          {...(onApplyLayerStyle ? { onApplyStyle: onApplyLayerStyle } : {})}
          presentation="embedded"
          showHeader={false}
        />
      );
    }

    return (
      <div style={placeholderWrapStyle}>
        <GisEmptyState
          title="No layer selected"
          description="Select a layer to inspect its metadata, source, schema, CRS, QA, style, lineage, and report readiness."
        />
      </div>
    );
  };

  return (
    <aside
      ref={hostRef}
      role="dialog"
      aria-label={`${contextEyebrow(context)}: ${contextTitle(context)}`}
      tabIndex={-1}
      style={getHostStyle(presentation, width)}
      data-testid="map-inspector-host"
      data-context={context.kind}
      data-presentation={presentation}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          handleClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          handleClose();
        }
      }}
    >
      <header style={headerStyle}>
        <div style={titleWrapStyle}>
          <span style={eyebrowStyle}>{contextEyebrow(context)}</span>
          <h2 style={titleStyle} title={contextTitle(context)}>{contextTitle(context)}</h2>
        </div>
        <GisIconButton
          label="Close inspector"
          icon={<IconClose size={14} />}
          onClick={handleClose}
          size="sm"
        />
      </header>
      <div style={bodyStyle}>
        {renderBody()}
      </div>
    </aside>
  );
};

export default MapInspectorHost;
