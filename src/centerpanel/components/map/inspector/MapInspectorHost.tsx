import React, { useCallback, useEffect, useRef } from "react";
import type { SourceHandle } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_STROKES,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  mapStyles,
} from "../mapTokens";
import { IconClose } from "../MapIcons";
import { GisEmptyState, GisIconButton } from "../ui";
import type { LayerStyleUpdate } from "./style/legendContract";
import { LayerInspector } from "./LayerInspector";

export type MapInspectorHostPresentation = "right-rail" | "bottom-drawer";

export type MapInspectorContextKind =
  | "none"
  | "map"
  | "layer"
  | "feature-selection"
  | "qa-issue"
  | "workflow-preview"
  | "publish"
  | "scene";

export type MapInspectorHostContext =
  | { kind: "none" }
  | { kind: "map"; title?: string; description?: string }
  | { kind: "layer"; layer: OverlayLayerConfig; sourceHandle?: SourceHandle | null }
  | { kind: Exclude<MapInspectorContextKind, "none" | "map" | "layer">; title?: string; description?: string };

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
  letterSpacing: "0.04em",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
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
      height: "min(28rem, 60%)",
      borderTop: MAP_STROKES.hairlineStrong,
      borderRadius: `${MAP_RADIUS.lg} ${MAP_RADIUS.lg} 0 0`,
      zIndex: MAP_Z_INDEX.symbologyPanel + 2,
    };
  }

  return {
    ...mapStyles.sidePanelSurface,
    top: MAP_SPACING.zero,
    right: MAP_SPACING.zero,
    bottom: MAP_SPACING.zero,
    width: `${width ?? 420}px`,
    maxWidth: "calc(100% - 2rem)",
    borderLeft: MAP_STROKES.hairlineSubtle,
    zIndex: MAP_Z_INDEX.symbologyPanel + 2,
  };
}

function contextTitle(context: MapInspectorHostContext): string {
  switch (context.kind) {
    case "layer":
      return context.layer.name;
    case "feature-selection":
      return context.title ?? "Feature selection";
    case "qa-issue":
      return context.title ?? "QA issue";
    case "workflow-preview":
      return context.title ?? "Workflow preview";
    case "publish":
      return context.title ?? "Publish context";
    case "scene":
      return context.title ?? "Scene context";
    case "map":
      return context.title ?? "Map context";
    case "none":
    default:
      return "Map context";
  }
}

function contextDescription(context: MapInspectorHostContext): string {
  switch (context.kind) {
    case "layer":
      return "Layer metadata, source, schema, CRS, QA, style, lineage, and report readiness.";
    case "feature-selection":
      return context.description ?? "Feature selection inspection will land here as a focused placeholder.";
    case "qa-issue":
      return context.description ?? "QA issue details will land here as the problems model is promoted into the inspector.";
    case "workflow-preview":
      return context.description ?? "Workflow preview inspection will land here when analysis routing is unified.";
    case "publish":
      return context.description ?? "Publication and export inspection will land here when publish routing is unified.";
    case "scene":
      return context.description ?? "Scene, raster, 3D, and temporal inspection will land here as scene panels consolidate.";
    case "map":
      return context.description ?? "Select a layer or map object to inspect its metadata and readiness.";
    case "none":
    default:
      return "Select a layer or map object to inspect its metadata and readiness.";
  }
}

function contextEyebrow(context: MapInspectorHostContext): string {
  switch (context.kind) {
    case "feature-selection":
      return "Selection inspector";
    case "qa-issue":
      return "QA inspector";
    case "workflow-preview":
      return "Workflow inspector";
    case "publish":
      return "Publish inspector";
    case "scene":
      return "Scene inspector";
    case "layer":
      return "Layer inspector";
    case "map":
    case "none":
    default:
      return "Map inspector";
  }
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
    window.requestAnimationFrame(() => {
      hostRef.current?.focus({ preventScroll: true });
    });
  }, [context.kind, visible]);

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
          title={contextTitle(context)}
          description={contextDescription(context)}
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
