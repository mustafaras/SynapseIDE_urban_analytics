


export const SYNAPSE_COLORS = {

  bgDark: '#000000',

  bgSecondary: '#121212',

  bgOverlay: 'rgba(255, 255, 255, 0.04)',

  bgTertiary: '#1A1A1A',


  textPrimary: '#FAFAF9',

  textSecondary: '#D6D3D1',

  textAccent: '#3794ff',

  textTertiary: '#A8A29E',


  /* `gold*` names retained for source compatibility; values redirected to VS Code blue
     per color system contract. Use SYNAPSE_STATUS.caveat / SYNAPSE_COLORS.warning for amber attention. */
  goldPrimary: '#3794ff',

  goldSecondary: '#2c7fd9',

  goldHover: '#1f6abc',


  accentNeutral: '#3794ff',

  accentNeutralHover: '#2c7fd9',


  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',


  border: '#2A2A2A',

  borderSubtle: '#2A2A2A',

  hover: 'rgba(55, 148, 255, 0.12)',

  selected: 'rgba(55, 148, 255, 0.2)',

  divider: 'rgba(255, 255, 255, 0.08)',


  softShadow: 'rgba(0, 0, 0, 0.3)',
  shadowSoft: '0 1px 3px rgba(0, 0, 0, 0.3)',
  shadowElevated: '0 2px 6px rgba(0, 0, 0, 0.2)',
  shadowModal: '0 3px 12px rgba(0, 0, 0, 0.25)',
  borderHighlight: 'rgba(55, 148, 255, 0.5)',
  glowSubtle: '0 0 6px rgba(55, 148, 255, 0.38)',
} as const;


export const SYNAPSE_TYPO = {

  fontFamily: `'JetBrains Mono', 'Fira Code', 'Menlo', monospace`,

  fontSize: {

    small: '12px',

    base: '13px',

    medium: '14px',

    large: '16px',
  },

  fontWeight: {

    normal: 400,

    medium: 500,

    semibold: 600,
  },

  lineHeight: {

    tight: 1.2,

    normal: 1.4,

    relaxed: 1.6,
  },
} as const;


export function withAlpha(hex: string, a: number): string {
  const clean = hex.replace('#', '').trim();
  const isShort = clean.length === 3;
  const r = parseInt(isShort ? clean[0] + clean[0] : clean.slice(0, 2), 16);
  const g = parseInt(isShort ? clean[1] + clean[1] : clean.slice(2, 4), 16);
  const b = parseInt(isShort ? clean[2] + clean[2] : clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}


export function focusOutline(): string {
  return `2px solid ${SYNAPSE_FOCUS.ring}`;
}


export function elevate(level: 0 | 1 | 2 | 3 = 1) {
  switch (level) {
    case 0:
      return 'none';
    case 1:
      return SYNAPSE_COLORS.shadowSoft;
    case 2:
      return SYNAPSE_COLORS.shadowElevated;
    case 3:
      return SYNAPSE_COLORS.shadowModal;
  }

  return SYNAPSE_COLORS.shadowSoft;
}


export function transition(props: string = 'all', speed: string = '180ms'): string {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const duration = prefersReduced ? '50ms' : speed;
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
  return `${props} ${duration} ${easing}`;
}

export type SynapseColors = typeof SYNAPSE_COLORS;
export type SynapseTypography = typeof SYNAPSE_TYPO;


export const SYNAPSE_ELEVATION = {
  surface: withAlpha('#FFFFFF', 0.04),
  surfaceHover: withAlpha('#FFFFFF', 0.06),
  surfaceActive: withAlpha('#FFFFFF', 0.08),
  border: withAlpha('#FFFFFF', 0.10),
  borderStrong: withAlpha('#FFFFFF', 0.16),
  shadowSm: '0 1px 2px rgba(0,0,0,0.35)',
  shadowMd: '0 4px 14px rgba(0,0,0,0.40)',
  shadowLg: 'var(--shadow-lg)'
} as const;

/* SYNAPSE_ACCENT keys retain `gold*` names for source compatibility but resolve to
   VS Code blue chrome accent per color system contract. */
export const SYNAPSE_ACCENT = {
  gold: '#3794ff',
  goldHover: '#2c7fd9',
  goldActive: '#1f6abc',
  goldMuted: withAlpha('#3794ff', 0.25),
} as const;

export const SYNAPSE_FOCUS = {
  ring: '#3794ff',
  ringOffset: '#000000',
  width: '2px',
  radius: '12px',
} as const;

export const SYNAPSE_STATUS = {
  ready: {
    base: SYNAPSE_COLORS.success,
    hover: '#16A34A',
    pressed: '#15803D',
    bg: withAlpha(SYNAPSE_COLORS.success, 0.12),
    border: withAlpha(SYNAPSE_COLORS.success, 0.32),
    text: '#4ADE80',
  },
  caveat: {
    base: SYNAPSE_COLORS.warning,
    hover: SYNAPSE_COLORS.goldSecondary,
    pressed: SYNAPSE_COLORS.goldHover,
    bg: withAlpha(SYNAPSE_COLORS.warning, 0.12),
    border: withAlpha(SYNAPSE_COLORS.warning, 0.32),
    text: '#FDE68A',
  },
  needsContext: {
    base: SYNAPSE_COLORS.textTertiary,
    hover: SYNAPSE_COLORS.textSecondary,
    pressed: SYNAPSE_COLORS.textPrimary,
    bg: withAlpha('#FFFFFF', 0.06),
    border: withAlpha('#FFFFFF', 0.14),
    text: SYNAPSE_COLORS.textSecondary,
  },
  blocked: {
    base: SYNAPSE_COLORS.error,
    hover: '#DC2626',
    pressed: '#B91C1C',
    bg: withAlpha(SYNAPSE_COLORS.error, 0.12),
    border: withAlpha(SYNAPSE_COLORS.error, 0.32),
    text: '#FCA5A5',
  },
  demo: {
    base: '#FCD34D',
    hover: '#FBBF24',
    pressed: SYNAPSE_COLORS.warning,
    bg: withAlpha('#FCD34D', 0.12),
    border: withAlpha('#FCD34D', 0.32),
    text: '#FEF3C7',
  },
  unsynced: {
    base: '#FBBF24',
    hover: SYNAPSE_COLORS.warning,
    pressed: SYNAPSE_COLORS.goldSecondary,
    bg: withAlpha('#FBBF24', 0.12),
    border: withAlpha('#FBBF24', 0.32),
    text: '#FDE68A',
  },
  stale: {
    base: SYNAPSE_COLORS.goldSecondary,
    hover: SYNAPSE_COLORS.warning,
    pressed: SYNAPSE_COLORS.goldHover,
    bg: withAlpha(SYNAPSE_COLORS.goldSecondary, 0.12),
    border: withAlpha(SYNAPSE_COLORS.goldSecondary, 0.32),
    text: '#FED7AA',
  },
  draft: {
    base: SYNAPSE_COLORS.textTertiary,
    hover: SYNAPSE_COLORS.textSecondary,
    pressed: SYNAPSE_COLORS.textPrimary,
    bg: withAlpha('#FFFFFF', 0.05),
    border: withAlpha('#FFFFFF', 0.12),
    text: SYNAPSE_COLORS.textSecondary,
  },
} as const;

export const SYNAPSE_EVIDENCE = {
  verified: SYNAPSE_STATUS.ready,
  caveat: SYNAPSE_STATUS.caveat,
  sample: SYNAPSE_STATUS.demo,
  stale: SYNAPSE_STATUS.stale,
  missing: SYNAPSE_STATUS.blocked,
  draft: SYNAPSE_STATUS.draft,
} as const;

export const SYNAPSE_DENSITY = {
  compact: {
    controlHeight: '28px',
    toolbarHeight: '34px',
    rowHeight: '26px',
    tabHeight: '30px',
    panelPadding: '8px',
    inlineGap: '6px',
  },
  comfortable: {
    controlHeight: '32px',
    toolbarHeight: '38px',
    rowHeight: '30px',
    tabHeight: '34px',
    panelPadding: '10px',
    inlineGap: '8px',
  },
  relaxed: {
    controlHeight: '36px',
    toolbarHeight: '42px',
    rowHeight: '34px',
    tabHeight: '38px',
    panelPadding: '12px',
    inlineGap: '10px',
  },
} as const;

export const SYNAPSE_LAYOUT = {
  radiusSm: '8px',
  radiusMd: '12px',
  radiusLg: '16px',
  gapXs: '6px',
  gapSm: '8px',
  gapMd: '12px',
  gapLg: '16px',
  gapXl: '24px',
  padSm: '8px',
  padMd: '12px',
  padLg: '16px',
  padXl: '24px',
} as const;

export const SYNAPSE_ANIM = {
  fast: '120ms cubic-bezier(.2,.8,.2,1)',
  base: '200ms cubic-bezier(.2,.8,.2,1)',
  slow: '320ms cubic-bezier(.2,.8,.2,1)',
} as const;


export const SYNAPSE_OVERLAY = {
  backdrop: 'rgba(10,12,14,0.60)',
  backdropAlt: 'var(--syn-gradient-header)',  /* overlay gradient fallback */
  blur: 'blur(12px) brightness(0.9)',
  vignette: 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 60%)',
  surface: '#101317',
  surfaceBorder: 'rgba(255,255,255,0.09)',
  surfaceGlow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 18px -4px rgba(0,0,0,0.55)',
  focusRing: 'var(--shadow-focus)',
} as const;

