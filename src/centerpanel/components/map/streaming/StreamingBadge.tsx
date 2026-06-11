/**
 * Prompt 44 — "Streaming by extent" badge.
 * Shows strategy, in-view count, and fetch state.
 * Never claims a total feature count for remote streaming sources.
 */
import React from "react";
import { MAP_COLORS, MAP_STATUS_TOKENS, MAP_TYPOGRAPHY } from "../mapTokens";
import type { StreamingLayerState } from "../../../../services/map/streaming/VectorStreamingService";

export interface StreamingBadgeProps {
  state: StreamingLayerState;
  /** Compact rendering for the layer rail. */
  compact?: boolean;
  style?: React.CSSProperties;
}

export const StreamingBadge: React.FC<StreamingBadgeProps> = ({
  state,
  compact = false,
  style,
}) => {
  const { strategy, inViewCount, totalCount, fetching, fetchError } = state;

  const tok = fetching
    ? MAP_STATUS_TOKENS.running
    : fetchError
    ? MAP_STATUS_TOKENS.blocked
    : MAP_STATUS_TOKENS.ready;

  const label =
    strategy === "flatgeobuf"
      ? fetching
        ? "streaming…"
        : "streaming"
      : "indexed stream";

  const countLabel =
    totalCount !== null
      ? `${inViewCount.toLocaleString()} / ${totalCount.toLocaleString()} in view`
      : `${inViewCount.toLocaleString()} in view`;

  const rootStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: compact ? 4 : 6,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    fontSize: compact ? "10px" : "11px",
    ...style,
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: compact ? "1px 5px" : "2px 7px",
    borderRadius: 3,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    color: tok.text,
    background: tok.bg,
    border: `1px solid ${tok.border}`,
    whiteSpace: "nowrap",
  };

  const countStyle: React.CSSProperties = {
    color: MAP_COLORS.textSecondary,
    whiteSpace: "nowrap",
  };

  return (
    <span
      style={rootStyle}
      data-testid="streaming-badge"
      data-strategy={strategy}
      aria-label={`Streaming layer: ${countLabel}`}
    >
      <span style={chipStyle} data-testid="streaming-badge-chip">
        {label}
      </span>
      {!compact && !fetchError && (
        <span style={countStyle} data-testid="streaming-in-view-count">
          {countLabel}
        </span>
      )}
      {!!fetchError && (
        <span
          style={{ color: MAP_COLORS.error, fontSize: "10px" }}
          title={fetchError}
          data-testid="streaming-fetch-error"
        >
          fetch error
        </span>
      )}
    </span>
  );
};

export default StreamingBadge;
