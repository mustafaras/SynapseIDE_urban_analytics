import { css, type DefaultTheme } from 'styled-components';

export const charcoalAmberRaw = {
  bgRoot: '#000000',
  bgSurface1: '#121212',
  bgSurface2: '#1A1A1A',
  bgElevated: '#202020',
  borderDefault: '#2A2A2A',
  borderStrong: '#3A3A3A',
  textPrimary: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',
  textDisabled: '#8C8579',
  accentPrimary: '#F59E0B',
  accentPrimaryHover: '#D97706',
  accentPrimaryPressed: '#B45309',
  accentSoftBg: '#2A1C08',
  focusRing: '#FBBF24',
  success: '#22C55E',
  successHover: '#16A34A',
  successPressed: '#15803D',
  successBg: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B',
  warningHover: '#D97706',
  warningPressed: '#B45309',
  warningBg: 'rgba(245,158,11,0.12)',
  danger: '#EF4444',
  dangerHover: '#DC2626',
  dangerPressed: '#B91C1C',
  dangerBg: 'rgba(239,68,68,0.12)',
  info: '#FCD34D',
  infoHover: '#FBBF24',
  infoPressed: '#F59E0B',
  infoBg: 'rgba(252,211,77,0.12)',
  textAccent: '#FDE68A',
  textOnAccent: '#000000',
  textLink: '#F59E0B',
  textLinkHover: '#FBBF24',
  chart1: '#F59E0B',
  chart2: '#FB923C',
  chart3: '#84CC16',
  chart4: '#22C55E',
  chart5: '#F97316',
  chart6: '#EAB308',
  chartNeutral: '#A8A29E',
  accentBg: 'rgba(245,158,11, 0.12)',
  accentBgHover: 'rgba(245,158,11, 0.16)',
  accentBorder: 'rgba(245,158,11, 0.48)',
  accentGlow: 'rgba(245,158,11, 0.32)',
} as const;

export const charcoalAmberSemanticTokens = {
  root: {
    background: charcoalAmberRaw.bgRoot,
  },
  surfaces: {
    base: charcoalAmberRaw.bgSurface1,
    subtle: charcoalAmberRaw.bgSurface2,
    elevated: charcoalAmberRaw.bgElevated,
  },
  text: {
    primary: charcoalAmberRaw.textPrimary,
    secondary: charcoalAmberRaw.textSecondary,
    muted: charcoalAmberRaw.textMuted,
    disabled: charcoalAmberRaw.textDisabled,
  },
  borders: {
    default: charcoalAmberRaw.borderDefault,
    strong: charcoalAmberRaw.borderStrong,
    focus: charcoalAmberRaw.focusRing,
  },
  accents: {
    primary: charcoalAmberRaw.accentPrimary,
    secondary: charcoalAmberRaw.accentPrimaryHover,
    pressed: charcoalAmberRaw.accentPrimaryPressed,
    soft: charcoalAmberRaw.accentSoftBg,
    bg: charcoalAmberRaw.accentBg,
    bgHover: charcoalAmberRaw.accentBgHover,
    border: charcoalAmberRaw.accentBorder,
    glow: charcoalAmberRaw.accentGlow,
  },
  actions: {
    primary: {
      bg: charcoalAmberRaw.accentPrimary,
      hover: charcoalAmberRaw.accentPrimaryHover,
      active: charcoalAmberRaw.accentPrimaryPressed,
      disabled: '#6B4A14',
      focus: charcoalAmberRaw.focusRing,
      text: '#000000',
    },
    neutral: {
      bg: charcoalAmberRaw.bgSurface2,
      hover: '#242424',
      active: charcoalAmberRaw.bgElevated,
      disabled: '#1C1C1C',
      focus: charcoalAmberRaw.focusRing,
      text: charcoalAmberRaw.textPrimary,
      textDisabled: charcoalAmberRaw.textDisabled,
      border: charcoalAmberRaw.borderDefault,
    },
  },
  states: {
    success: {
      base: charcoalAmberRaw.success,
      hover: charcoalAmberRaw.successHover,
      pressed: charcoalAmberRaw.successPressed,
      bg: charcoalAmberRaw.successBg,
    },
    warning: {
      base: charcoalAmberRaw.warning,
      hover: charcoalAmberRaw.warningHover,
      pressed: charcoalAmberRaw.warningPressed,
      bg: charcoalAmberRaw.warningBg,
    },
    error: {
      base: charcoalAmberRaw.danger,
      hover: charcoalAmberRaw.dangerHover,
      pressed: charcoalAmberRaw.dangerPressed,
      bg: charcoalAmberRaw.dangerBg,
    },
    info: {
      base: charcoalAmberRaw.info,
      hover: charcoalAmberRaw.infoHover,
      pressed: charcoalAmberRaw.infoPressed,
      bg: charcoalAmberRaw.infoBg,
    },
  },
  charts: {
    c1: charcoalAmberRaw.chart1,
    c2: charcoalAmberRaw.chart2,
    c3: charcoalAmberRaw.chart3,
    c4: charcoalAmberRaw.chart4,
    c5: charcoalAmberRaw.chart5,
    c6: charcoalAmberRaw.chart6,
    neutral: charcoalAmberRaw.chartNeutral,
  },
} as const;

export const legacyToCharcoalAmberTokenMap: Record<string, string> = {
  bg900: 'root.background',
  surface800: 'surfaces.base',
  border700: 'borders.default',
  gold500: 'accents.primary',
  gold300: 'accents.secondary',
  text100: 'text.primary',
  text400: 'text.muted',
  danger400: 'states.error',
  success400: 'states.success',
  warning400: 'states.warning',
  info400: 'states.info',
  accentPrimary: 'actions.primary.bg',
  accentPrimaryHover: 'actions.primary.hover',
  accentPrimaryPressed: 'actions.primary.active',
  accentSoftBg: 'accents.soft',
  focusRing: 'borders.focus',
};

export const charcoalAmberVars = {
  bgRoot: 'var(--syn-bg-root)',
  bgSurface1: 'var(--syn-bg-surface-1)',
  bgSurface2: 'var(--syn-bg-surface-2)',
  bgElevated: 'var(--syn-bg-elevated)',
  borderDefault: 'var(--syn-border-default)',
  borderStrong: 'var(--syn-border-strong)',
  textPrimary: 'var(--syn-text-primary)',
  textSecondary: 'var(--syn-text-secondary)',
  textMuted: 'var(--syn-text-muted)',
  textDisabled: 'var(--syn-text-disabled)',
  accentPrimary: 'var(--syn-accent-primary)',
  accentPrimaryHover: 'var(--syn-accent-primary-hover)',
  accentPrimaryPressed: 'var(--syn-accent-primary-pressed)',
  accentSoftBg: 'var(--syn-accent-soft-bg)',
  focusRing: 'var(--syn-focus-ring)',
  success: 'var(--syn-success)',
  successHover: 'var(--syn-success-hover)',
  successPressed: 'var(--syn-success-pressed)',
  successBg: 'var(--syn-success-bg)',
  warning: 'var(--syn-warning)',
  warningHover: 'var(--syn-warning-hover)',
  warningPressed: 'var(--syn-warning-pressed)',
  warningBg: 'var(--syn-warning-bg)',
  danger: 'var(--syn-danger)',
  dangerHover: 'var(--syn-danger-hover)',
  dangerPressed: 'var(--syn-danger-pressed)',
  dangerBg: 'var(--syn-danger-bg)',
  info: 'var(--syn-info)',
  infoHover: 'var(--syn-info-hover)',
  infoPressed: 'var(--syn-info-pressed)',
  infoBg: 'var(--syn-info-bg)',
  textAccent: 'var(--syn-text-accent)',
  textOnAccent: 'var(--syn-text-on-accent)',
  textLink: 'var(--syn-text-link)',
  textLinkHover: 'var(--syn-text-link-hover)',
  chart1: 'var(--syn-chart-1)',
  chart2: 'var(--syn-chart-2)',
  chart3: 'var(--syn-chart-3)',
  chart4: 'var(--syn-chart-4)',
  chart5: 'var(--syn-chart-5)',
  chart6: 'var(--syn-chart-6)',
  chartNeutral: 'var(--syn-chart-neutral)',
  accentBg: 'var(--syn-accent-bg)',
  accentBgHover: 'var(--syn-accent-bg-hover)',
  accentBorder: 'var(--syn-accent-border)',
  accentGlow: 'var(--syn-accent-glow)',
} as const;

export type SynapseTheme = DefaultTheme & {
  colors: {
    bg900: string; surface800: string; border700: string;
    gold500: string; gold300: string;
    text100: string; text400: string;
    danger400: string; success400: string;

    root: string;
    surface1: string;
    surface2: string;
    elevated: string;
    borderDefault: string;
    borderStrong: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textDisabled: string;
    accentPrimary: string;
    accentPrimaryHover: string;
    accentPrimaryPressed: string;
    accentSoftBg: string;
    warning400: string;
    info400: string;
    textAccent: string;
    textOnAccent: string;
    textLink: string;
    textLinkHover: string;

    charts: {
      c1: string;
      c2: string;
      c3: string;
      c4: string;
      c5: string;
      c6: string;
      neutral: string;
    };
  };
  radius: { sm: string; md: string; lg: string; pill: string };
  space: { x4: string; x8: string; x12: string; x16: string; x20: string; x24: string };
  shadow: { elev: string; focus: string };
  z: { modal: number; popover: number; header: number };
  fonts: { mono: string; sans: string };

  focusRing: (offsetPx?: number) => ReturnType<typeof css>;
};

export const synapseTheme: SynapseTheme = {
  colors: {
    bg900: 'var(--syn-bg-900)',
    surface800: 'var(--syn-surface-800)',
    border700: 'var(--syn-border-700)',
    gold500: 'var(--syn-gold-500)',
    gold300: 'var(--syn-gold-300)',
    text100: 'var(--syn-text-100)',
    text400: 'var(--syn-text-400)',
    danger400: 'var(--syn-danger-400)',
    success400: 'var(--syn-success-400)',

    root: charcoalAmberVars.bgRoot,
    surface1: charcoalAmberVars.bgSurface1,
    surface2: charcoalAmberVars.bgSurface2,
    elevated: charcoalAmberVars.bgElevated,
    borderDefault: charcoalAmberVars.borderDefault,
    borderStrong: charcoalAmberVars.borderStrong,
    textPrimary: charcoalAmberVars.textPrimary,
    textSecondary: charcoalAmberVars.textSecondary,
    textMuted: charcoalAmberVars.textMuted,
    textDisabled: charcoalAmberVars.textDisabled,
    accentPrimary: charcoalAmberVars.accentPrimary,
    accentPrimaryHover: charcoalAmberVars.accentPrimaryHover,
    accentPrimaryPressed: charcoalAmberVars.accentPrimaryPressed,
    accentSoftBg: charcoalAmberVars.accentSoftBg,
    warning400: charcoalAmberVars.warning,
    info400: charcoalAmberVars.info,
    textAccent: charcoalAmberVars.textAccent,
    textOnAccent: charcoalAmberVars.textOnAccent,
    textLink: charcoalAmberVars.textLink,
    textLinkHover: charcoalAmberVars.textLinkHover,
    charts: {
      c1: charcoalAmberVars.chart1,
      c2: charcoalAmberVars.chart2,
      c3: charcoalAmberVars.chart3,
      c4: charcoalAmberVars.chart4,
      c5: charcoalAmberVars.chart5,
      c6: charcoalAmberVars.chart6,
      neutral: charcoalAmberVars.chartNeutral,
    },
  },
  radius: { sm: '12px', md: '16px', lg: '20px', pill: '999px' },
  space: { x4: '4px', x8: '8px', x12: '12px', x16: '16px', x20: '20px', x24: '24px' },
  shadow: {
    elev: 'var(--shadow-lg)',
    focus: 'var(--shadow-focus)',
  },
  z: { modal: 1000, popover: 900, header: 800 },
  fonts: {
    mono: 'var(--font-mono)',
    sans: 'var(--font-sans)',
  },
  focusRing: (offsetPx = 2) => css`
    outline: ${offsetPx}px solid var(--syn-focus-ring);
    outline-offset: 2px;
  `,
};



