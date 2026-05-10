import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TemporalSliderProps {
  /** Minimum date boundary of the time range (ISO string or epoch ms) */
  minDate: string | number;
  /** Maximum date boundary of the time range (ISO string or epoch ms) */
  maxDate: string | number;
  /** Currently selected date (controlled) */
  value?: string | number;
  /** Called when the slider position changes */
  onChange?: (date: Date) => void;
  /** Playback speed in steps per second (default 2) */
  playbackSpeed?: number;
  /** Step size in milliseconds (default 1 day) */
  stepMs?: number;
  /** GeoJSON timestamp property name to filter on (informational) */
  timestampProperty?: string;
  className?: string;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toEpoch(v: string | number): number {
  return typeof v === 'number' ? v : new Date(v).getTime();
}

function formatDate(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatShort(epoch: number): string {
  const d = new Date(epoch);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const ONE_DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(26,26,26,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    fontFamily: "'IBM Plex Mono', monospace",
    userSelect: 'none',
  },
  controls: {
    display: 'flex',
    gap: 2,
  },
  btn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    color: '#ccc',
    fontSize: 14,
    cursor: 'pointer',
  },
  btnActive: {
    background: 'rgba(245,166,35,0.15)',
    border: '1px solid rgba(245,166,35,0.4)',
    color: '#f5a623',
  },
  sliderArea: {
    flex: 1,
    position: 'relative',
    height: 28,
    display: 'flex',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 4,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    position: 'relative',
  },
  fill: {
    height: '100%',
    background: '#f5a623',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#f5a623',
    border: '2px solid #1a1a1a',
    boxShadow: '0 0 4px rgba(245,166,35,0.5)',
    transform: 'translate(-50%, -50%)',
    cursor: 'grab',
    zIndex: 2,
  },
  dateLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 4px',
    position: 'absolute',
    bottom: -14,
    left: 0,
    right: 0,
  },
  dateLabel: {
    fontSize: 9,
    color: '#666',
    fontFamily: 'monospace',
  },
  currentDate: {
    fontSize: 12,
    color: '#f5a623',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    minWidth: 90,
    textAlign: 'center' as const,
  },
  speedLabel: {
    fontSize: 10,
    color: '#888',
    whiteSpace: 'nowrap' as const,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const TemporalSlider: React.FC<TemporalSliderProps> = ({
  minDate,
  maxDate,
  value,
  onChange,
  playbackSpeed = 2,
  stepMs = ONE_DAY,
  className,
  style,
}) => {
  const minEpoch = useMemo(() => toEpoch(minDate), [minDate]);
  const maxEpoch = useMemo(() => toEpoch(maxDate), [maxDate]);
  const range = maxEpoch - minEpoch || 1;

  const [currentEpoch, setCurrentEpoch] = useState(value ? toEpoch(value) : minEpoch);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(playbackSpeed);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync external controlled value
  useEffect(() => {
    if (value !== undefined) {
      setCurrentEpoch(toEpoch(value));
    }
  }, [value]);

  // Emit onChange
  const emitChange = useCallback(
    (epoch: number) => {
      const clamped = Math.max(minEpoch, Math.min(maxEpoch, epoch));
      setCurrentEpoch(clamped);
      onChange?.(new Date(clamped));
    },
    [minEpoch, maxEpoch, onChange],
  );

  /* ---- Playback ---- */
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentEpoch((prev) => {
          const next = prev + stepMs;
          if (next > maxEpoch) {
            setPlaying(false);
            return maxEpoch;
          }
          onChange?.(new Date(next));
          return next;
        });
      }, 1000 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, stepMs, maxEpoch, onChange]);

  const togglePlay = useCallback(() => {
    if (currentEpoch >= maxEpoch) {
      // Reset to start before playing
      emitChange(minEpoch);
    }
    setPlaying((p) => !p);
  }, [currentEpoch, maxEpoch, minEpoch, emitChange]);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.5, 1, 2, 4, 8];
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
  }, [speed]);

  const stepForward = useCallback(() => {
    emitChange(currentEpoch + stepMs);
  }, [currentEpoch, stepMs, emitChange]);

  const stepBackward = useCallback(() => {
    emitChange(currentEpoch - stepMs);
  }, [currentEpoch, stepMs, emitChange]);

  /* ---- Click / drag on track ---- */
  const handleTrackInteraction = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      emitChange(minEpoch + frac * range);
    },
    [minEpoch, range, emitChange],
  );

  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleTrackInteraction(e.clientX);
    },
    [handleTrackInteraction],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging) handleTrackInteraction(e.clientX);
    },
    [dragging, handleTrackInteraction],
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  /* ---- Derived ---- */
  const fraction = (currentEpoch - minEpoch) / range;

  return (
    <div className={className} style={{ ...S.container, ...style }}>
      {/* Transport controls */}
      <div style={S.controls}>
        <button style={S.btn} onClick={stepBackward} title="Step back">
          ⏮
        </button>
        <button
          style={{ ...S.btn, ...(playing ? S.btnActive : {}) }}
          onClick={togglePlay}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button style={S.btn} onClick={stepForward} title="Step forward">
          ⏭
        </button>
      </div>

      {/* Speed control */}
      <button style={S.btn} onClick={cycleSpeed} title="Playback speed">
        <span style={S.speedLabel}>{speed}×</span>
      </button>

      {/* Current date display */}
      <div style={S.currentDate}>{formatDate(currentEpoch)}</div>

      {/* Slider track */}
      <div
        ref={trackRef}
        style={S.sliderArea}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div style={S.track}>
          <div style={{ ...S.fill, width: `${fraction * 100}%` }} />
        </div>
        <div style={{ ...S.thumb, left: `${fraction * 100}%` }} />
        <div style={S.dateLabels}>
          <span style={S.dateLabel}>{formatShort(minEpoch)}</span>
          <span style={S.dateLabel}>{formatShort(maxEpoch)}</span>
        </div>
      </div>
    </div>
  );
};

export default TemporalSlider;
