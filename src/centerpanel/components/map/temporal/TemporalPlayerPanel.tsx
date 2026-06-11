/* ================================================================== */
/*  TemporalPlayerPanel — Prompt 46                                     */
/*                                                                      */
/*  Compact transport bar for temporal layer playback. Reads/writes the  */
/*  `useTemporalLayerStore`, mirrors the active frame state used by the   */
/*  bottom timeline, and honours the reduced-motion gate (auto-play is    */
/*  suppressed). Styling is mapTokens inline only — no Tailwind, no bare  */
/*  hex colours.                                                          */
/* ================================================================== */

import React from "react";
import { Download, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import {
  type GisStatusKey,
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SPACING,
  MAP_TYPOGRAPHY,
} from "../mapTokens";
import { usePrefersReducedMotion } from "../design";
import { GisIconButton, GisProgressBar, GisStatusChip } from "../ui";
import {
  TEMPORAL_PLAYBACK_SPEEDS,
  type TemporalRuntimeMode,
} from "@/services/map/temporal";
import {
  selectActiveTemporalFrame,
  selectTemporalFrameCount,
  type TemporalFrameExportPayload,
  useTemporalLayerStore,
} from "@/stores/useTemporalLayerStore";
import type { PlaybackSpeed } from "../mapTypes";

export interface TemporalPlayerPanelProps {
  /** Whether the player rail is mounted/visible. */
  visible?: boolean;
  /** Invoked with the export payload when "Export frame" is pressed. */
  onExportFrame?: (payload: TemporalFrameExportPayload) => void;
}

/** Map the truthful runtime mode to a status-chip key. */
function runtimeModeToStatus(mode: TemporalRuntimeMode): GisStatusKey {
  switch (mode) {
    case "live":
      return "ready";
    case "demo":
      return "demo";
    case "synthetic":
      return "synthetic";
    case "unknown":
    default:
      return "unknown";
  }
}

function playbackStatus(hasFrames: boolean, isPlaying: boolean, playbackMode: string): GisStatusKey {
  if (!hasFrames) return "unknown";
  if (isPlaying) return "running";
  return playbackMode === "continuous" ? "ready" : "caveat";
}

function playbackLabel(hasFrames: boolean, isPlaying: boolean, playbackMode: string): string {
  if (!hasFrames) return "no frames";
  if (isPlaying) return "playing";
  return playbackMode === "continuous" ? "paused" : "snapshot";
}

export const TemporalPlayerPanel: React.FC<TemporalPlayerPanelProps> = ({
  visible = true,
  onExportFrame,
}) => {
  const frameCount = useTemporalLayerStore(selectTemporalFrameCount);
  const activeFrame = useTemporalLayerStore(selectActiveTemporalFrame);
  const activeFrameIndex = useTemporalLayerStore((s) => s.activeFrameIndex);
  const isPlaying = useTemporalLayerStore((s) => s.isPlaying);
  const speed = useTemporalLayerStore((s) => s.speed);
  const playbackMode = useTemporalLayerStore((s) => s.playbackMode);
  const runtimeMode = useTemporalLayerStore((s) => s.runtimeMode);

  const play = useTemporalLayerStore((s) => s.play);
  const pause = useTemporalLayerStore((s) => s.pause);
  const nextFrame = useTemporalLayerStore((s) => s.nextFrame);
  const prevFrame = useTemporalLayerStore((s) => s.prevFrame);
  const goToFrame = useTemporalLayerStore((s) => s.goToFrame);
  const setSpeed = useTemporalLayerStore((s) => s.setSpeed);
  const setReducedMotion = useTemporalLayerStore((s) => s.setReducedMotion);
  const exportCurrentFrame = useTemporalLayerStore((s) => s.exportCurrentFrame);

  const prefersReducedMotion = usePrefersReducedMotion();

  // Keep the store's reduced-motion gate in sync with the live preference.
  React.useEffect(() => {
    setReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion, setReducedMotion]);

  if (!visible) return null;

  const hasFrames = frameCount > 0;
  const progressPct = frameCount > 1 ? (activeFrameIndex / (frameCount - 1)) * 100 : 0;
  const frameLabel = activeFrame?.label ?? "—";
  const frameKey = activeFrame?.key ?? "";

  const handleExport = () => {
    const payload = exportCurrentFrame();
    if (payload) onExportFrame?.(payload);
  };

  const railStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: MAP_SPACING.sm,
    padding: `${MAP_SPACING.sm} ${MAP_SPACING.md}`,
    background: MAP_COLORS.bgPanel,
    border: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: MAP_RADIUS.md,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    color: MAP_COLORS.text,
  };

  const labelBlockStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minWidth: "9rem",
    lineHeight: MAP_TYPOGRAPHY.lineHeight.tight,
  };

  const frameLabelStyle: React.CSSProperties = {
    fontSize: MAP_TYPOGRAPHY.fontSize.sm,
    fontWeight: MAP_TYPOGRAPHY.fontWeight.semibold,
    color: MAP_COLORS.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const frameMetaStyle: React.CSSProperties = {
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    color: MAP_COLORS.textMuted,
  };

  const selectStyle: React.CSSProperties = {
    background: MAP_COLORS.bg,
    color: MAP_COLORS.text,
    border: `1px solid ${MAP_COLORS.hairline}`,
    borderRadius: MAP_RADIUS.sm,
    fontSize: MAP_TYPOGRAPHY.fontSize.xs,
    fontFamily: MAP_TYPOGRAPHY.fontFamily,
    padding: `2px 4px`,
  };

  const scrubberWrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: "8rem",
    gap: "2px",
  };

  const stateChipRowStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: MAP_SPACING.xs,
  };

  return (
    <div role="group" aria-label="Temporal playback" data-testid="temporal-player-panel" style={railStyle}>
      <div style={stateChipRowStyle} data-testid="temporal-state-chips">
        <GisStatusChip
          status={runtimeModeToStatus(runtimeMode)}
          label={runtimeMode}
          data-testid="temporal-runtime-chip"
        />
        <GisStatusChip
          status={hasFrames ? "ready" : "unknown"}
          label={hasFrames ? `Frame ${activeFrameIndex + 1}/${frameCount}` : "No frames"}
          data-testid="temporal-frame-chip"
        />
        <GisStatusChip
          status={playbackStatus(hasFrames, isPlaying, playbackMode)}
          label={playbackLabel(hasFrames, isPlaying, playbackMode)}
          data-testid="temporal-playback-chip"
        />
        {!!prefersReducedMotion && (
          <GisStatusChip
            status="caveat"
            label="reduced motion"
            data-testid="temporal-motion-chip"
          />
        )}
      </div>

      <GisIconButton
        label="Previous frame"
        icon={<SkipBack size={14} />}
        onClick={prevFrame}
        disabled={!hasFrames}
        {...(!hasFrames ? { disabledReason: "Load a temporal layer first" } : {})}
      />
      {isPlaying ? (
        <GisIconButton
          label="Pause playback"
          icon={<Pause size={14} />}
          active
          onClick={pause}
        />
      ) : (
        <GisIconButton
          label="Play playback"
          icon={<Play size={14} />}
          onClick={() => {
            if (!hasFrames) {
              return;
            }
            if (activeFrameIndex >= frameCount - 1) {
              goToFrame(0);
            }
            play();
          }}
          disabled={!hasFrames || prefersReducedMotion}
          {...(prefersReducedMotion
            ? { disabledReason: "Auto-play disabled: reduced-motion preference is active" }
            : !hasFrames
              ? { disabledReason: "Load a temporal layer first" }
              : {})}
        />
      )}
      <GisIconButton
        label="Next frame"
        icon={<SkipForward size={14} />}
        onClick={nextFrame}
        disabled={!hasFrames}
        {...(!hasFrames ? { disabledReason: "Load a temporal layer first" } : {})}
      />

      <label style={{ ...frameMetaStyle, display: "inline-flex", alignItems: "center", gap: "4px" }}>
        Speed
        <select
          aria-label="Playback speed"
          data-testid="temporal-speed-select"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value) as PlaybackSpeed)}
          style={selectStyle}
        >
          {TEMPORAL_PLAYBACK_SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>

      <div style={scrubberWrapStyle}>
        <input
          type="range"
          aria-label="Frame scrubber"
          data-testid="temporal-scrubber"
          min={0}
          max={Math.max(0, frameCount - 1)}
          step={1}
          value={activeFrameIndex}
          disabled={!hasFrames}
          onChange={(e) => goToFrame(Number(e.target.value))}
          style={{ width: "100%", accentColor: MAP_COLORS.interaction }}
        />
        <GisProgressBar
          value={progressPct}
          label="Temporal progress"
          reducedMotion={prefersReducedMotion}
          data-testid="temporal-progress"
        />
      </div>

      <div style={labelBlockStyle}>
        <span style={frameLabelStyle} data-testid="temporal-frame-label">
          {frameLabel}
        </span>
        <span style={frameMetaStyle}>
          {hasFrames ? `Frame ${activeFrameIndex + 1} / ${frameCount}` : "No frames"}
          {frameKey ? ` · ${frameKey}` : ""}
        </span>
      </div>

      <GisIconButton
        label="Export frame"
        icon={<Download size={14} />}
        variant="accent"
        onClick={handleExport}
        disabled={!hasFrames}
        {...(!hasFrames ? { disabledReason: "Load a temporal layer first" } : {})}
      />
    </div>
  );
};
