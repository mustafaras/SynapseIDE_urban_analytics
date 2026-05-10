export const SB_COLORS = {

  bgPrimary: 'var(--syn-bg-surface-2, #1A1A1A)',
  bgSecondary: 'var(--syn-bg-elevated, #202020)',
  bgOverlay: 'var(--syn-overlay-whisper)',
  textPrimary: 'var(--syn-text-primary, #FAFAF9)',
  textSecondary: 'var(--syn-text-secondary, #D6D3D1)',
  textAccent: 'var(--syn-accent-primary, #F59E0B)',
  goldSoft: 'var(--syn-accent-primary, #F59E0B)',
  goldMuted: 'var(--syn-accent-primary-pressed)',
  mutedNeutral: 'var(--syn-text-muted)',
  borderSoft: 'rgba(255, 255, 255, 0.12)',
  success: '#4ADE80',
  warning: 'var(--syn-accent-primary, #F59E0B)',
  error: '#F87171',
  softShadow: 'var(--syn-depth-subtle)',
  borderHighlight: 'var(--syn-accent-primary, #F59E0B)',
  glowSubtle: 'none',
} as const;

export const sbFont = 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace';
export const alpha = (hex: string, a: number) => {
  if (!hex || !hex.startsWith('#')) return hex;
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
  const alphaClamped = Math.max(0, Math.min(1, a));
  return `rgba(${r}, ${g}, ${b}, ${alphaClamped})`;
};
