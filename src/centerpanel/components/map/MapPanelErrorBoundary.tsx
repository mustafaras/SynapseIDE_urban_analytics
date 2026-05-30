import React from "react";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { recordMapTelemetryEvent, redactMapTelemetryString } from "@/services/map/observability";
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
import { createOpaqueFloatingPanelStyle } from "./useDraggableMapPanel";

interface MapPanelErrorBoundaryProps {
  panelName: string;
  children: React.ReactNode;
  onClose?: () => void;
  onReset?: () => void;
  resetKey?: string | number | boolean;
}

interface MapPanelErrorBoundaryState {
  error: Error | null;
}

const fallbackStyle: React.CSSProperties = {
  ...createOpaqueFloatingPanelStyle("min(27rem, calc(100vw - 2rem))", MAP_Z_INDEX.symbologyPanel + 18),
  display: "grid",
  gap: MAP_SPACING.sm,
  padding: MAP_SPACING.md,
  border: `1px solid ${MAP_COLORS.error}`,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bgPanel,
  boxShadow: MAP_SHADOWS.panel,
  color: MAP_COLORS.text,
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: MAP_SPACING.sm,
  margin: 0,
  color: MAP_COLORS.error,
  fontSize: MAP_TYPOGRAPHY.fontSize.md,
};

const messageStyle: React.CSSProperties = {
  margin: 0,
  color: MAP_COLORS.textSecondary,
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  lineHeight: MAP_TYPOGRAPHY.lineHeight.normal,
  overflowWrap: "anywhere",
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: MAP_SPACING.sm,
  alignItems: "center",
  flexWrap: "wrap",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: MAP_SPACING.xs,
  padding: "0.375rem 0.625rem",
  border: MAP_STROKES.hairline,
  borderRadius: MAP_RADIUS.sm,
  background: MAP_COLORS.bg,
  color: MAP_COLORS.text,
  cursor: "pointer",
  fontSize: MAP_TYPOGRAPHY.fontSize.xs,
  fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
};

export class MapPanelErrorBoundary extends React.Component<MapPanelErrorBoundaryProps, MapPanelErrorBoundaryState> {
  override state: MapPanelErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): MapPanelErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    recordMapTelemetryEvent({
      kind: "panel.error",
      severity: "error",
      source: "map-panel",
      message: `${this.props.panelName} panel failed to render: ${error.message}`,
      code: error.name,
      recoverable: true,
      recoveryLabel: "Retry panel",
      details: {
        panelName: this.props.panelName,
        errorName: error.name,
        errorMessage: error.message,
        componentStack: info.componentStack,
      },
      fingerprint: `panel:${this.props.panelName}:${error.name}:${error.message}`,
    }, { dedupeKey: `panel:${this.props.panelName}:${error.name}:${error.message}`, dedupeMs: 2_000 });
  }

  override componentDidUpdate(previousProps: MapPanelErrorBoundaryProps): void {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private readonly handleRetry = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  override render(): React.ReactNode {
    const error = this.state.error;
    if (!error) {
      return this.props.children;
    }

    return (
      <section
        role="alert"
        data-testid="map-panel-error-boundary"
        style={fallbackStyle}
        aria-label={`${this.props.panelName} panel recovery`}
      >
        <h3 style={titleStyle}>
          <AlertTriangle size={MAP_ICON_SIZES.md} aria-hidden="true" />
          {this.props.panelName} panel recovered
        </h3>
        <p style={messageStyle}>
          {redactMapTelemetryString(error.message || "The panel stopped rendering. Retry the panel or close it while the map stays available.")}
        </p>
        <div style={actionRowStyle}>
          <button type="button" style={buttonStyle} onClick={this.handleRetry} data-testid="map-panel-error-retry">
            <RotateCcw size={MAP_ICON_SIZES.sm} aria-hidden="true" />
            Retry panel
          </button>
          {this.props.onClose ? (
            <button type="button" style={buttonStyle} onClick={this.props.onClose} data-testid="map-panel-error-close">
              <X size={MAP_ICON_SIZES.sm} aria-hidden="true" />
              Close panel
            </button>
          ) : null}
        </div>
      </section>
    );
  }
}

export default MapPanelErrorBoundary;