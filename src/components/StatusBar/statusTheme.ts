export const SB_COLORS = {

  bgPrimary: 'var(--syn-surface-navigation, #252A31)',
  bgSecondary: 'var(--syn-surface-elevated, #2B3038)',
  bgOverlay: 'var(--syn-surface-overlay)',
  textPrimary: 'var(--syn-text-default, #D7DCE5)',
  textSecondary: 'var(--syn-text-secondary, #A4ADBB)',
  textAccent: 'var(--syn-status-info, #6AA9FF)',
  goldSoft: 'var(--syn-status-info, #6AA9FF)',
  goldMuted: 'var(--syn-status-pending, #A4ADBB)',
  mutedNeutral: 'var(--syn-text-muted, #778190)',
  borderSoft: 'var(--syn-border-subtle, #343A44)',
  success: 'var(--syn-status-valid, #4EC27D)',
  warning: 'var(--syn-status-warning, #D6A84F)',
  error: 'var(--syn-status-error, #F87171)',
  info: 'var(--syn-status-info, #6AA9FF)',
  running: 'var(--syn-status-running, #6AA9FF)',
  pending: 'var(--syn-status-pending, #A4ADBB)',
  stale: 'var(--syn-status-stale, #9AA3B2)',
  softShadow: 'var(--syn-depth-subtle)',
  borderHighlight: 'var(--syn-border-focus, #3794FF)',
  glowSubtle: 'none',
} as const;

export const sbFont = 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace';
export const alpha = (hex: string, a: number) => {
  if (!hex) return hex;
  const alphaClamped = Math.max(0, Math.min(1, a));
  if (!hex.startsWith('#')) {
    return `color-mix(in srgb, ${hex} ${Math.round(alphaClamped * 100)}%, transparent)`;
  }
  const h = hex.replace('#', '');
  const to255 = (str: string) => parseInt(str, 16);
  let r = 0,
    g = 0,
    b = 0;
  if (h.length === 3) {
    r = to255(h[0] + h[0]);
    g = to255(h[1] + h[1]);
    b = to255(h[2] + h[2]);
  } else if (h.length === 6) {
    r = to255(h.substring(0, 2));
    g = to255(h.substring(2, 4));
    b = to255(h.substring(4, 6));
  }
  return `rgba(${r}, ${g}, ${b}, ${alphaClamped})`;
};
