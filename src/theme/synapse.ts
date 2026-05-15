import { css, type DefaultTheme } from 'styled-components';

export const charcoalAmberRaw = {
  bgRoot: '#000000',
  bgSurface1: '#121212',
  bgSurface2: '#1A1A1A',
  bgElevated: '#202020',
  vscodeBgRoot: '#1e1f24',
  vscodeBgActivity: '#24272f',
  vscodeBgSidebar: '#252a31',
  vscodeBgEditor: '#1f232a',
  vscodeBgPanel: '#232832',
  vscodeBgElevated: '#2b3038',
  vscodeBgInput: '#1a1f26',
  vscodeBgHover: '#303642',
  vscodeBorderSubtle: '#343a44',
  vscodeBorderStrong: '#4a5260',
  vscodeTextPrimary: '#d7dce5',
  vscodeTextSecondary: '#a4adbb',
  vscodeTextMuted: '#778190',
  vscodeAccentBlue: '#3794ff',
  vscodeAccentBlueSoft: '#1f4f7f',
  vscodeAttentionAmber: '#d6a84f',
  vscodeAttentionAmberSoft: '#4a3a1e',
  surfaceWorkbench: '#1e1f24',
  surfaceNavigation: '#252a31',
  surfacePanel: '#232832',
  surfaceEditor: '#1f232a',
  surfaceElevated: '#2b3038',
  surfaceInput: '#1a1f26',
  surfaceHover: '#303642',
  surfaceOverlay: 'rgba(12,15,20,0.78)',
  borderDefault: '#343a44',
  borderSubtle: '#343a44',
  borderStrong: '#4a5260',
  borderActive: '#3794ff',
  borderFocus: '#3794ff',
  textDefault: '#d7dce5',
  textPrimary: '#d7dce5',
  textSecondary: '#a4adbb',
  textMuted: '#778190',
  textDisabled: '#6f7785',
  textInverse: '#0f1218',
  accentPrimary: '#F59E0B',
  accentPrimaryHover: '#D97706',
  accentPrimaryPressed: '#B45309',
  accentSoftBg: '#2A1C08',
  interactionHover: '#303642',
  interactionSelected: '#1f4f7f',
  interactionActive: '#3794ff',
  interactionFocusRing: '#3794ff',
  focusRing: '#3794ff',
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
  statusValid: '#4ec27d',
  statusWarning: '#d6a84f',
  statusError: '#f87171',
  statusInfo: '#6aa9ff',
  statusBlocked: '#f87171',
  statusStale: '#9aa3b2',
  statusUnknown: '#858b96',
  statusDemo: '#c084fc',
  statusRunning: '#6aa9ff',
  statusPending: '#a4adbb',
  info: '#FCD34D',
  infoHover: '#FBBF24',
  infoPressed: '#F59E0B',
  infoBg: 'rgba(252,211,77,0.12)',
  textAccent: '#FDE68A',
  textOnAccent: '#000000',
  textLink: '#3794ff',
  textLinkHover: '#66adff',
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
    background: charcoalAmberRaw.surfaceWorkbench,
  },
  surfaces: {
    base: charcoalAmberRaw.surfacePanel,
    subtle: charcoalAmberRaw.surfaceNavigation,
    elevated: charcoalAmberRaw.surfaceElevated,
  },
  text: {
    primary: charcoalAmberRaw.textDefault,
    secondary: charcoalAmberRaw.textSecondary,
    muted: charcoalAmberRaw.textMuted,
    disabled: charcoalAmberRaw.textDisabled,
  },
  borders: {
    default: charcoalAmberRaw.borderDefault,
    subtle: charcoalAmberRaw.borderSubtle,
    strong: charcoalAmberRaw.borderStrong,
    active: charcoalAmberRaw.borderActive,
    focus: charcoalAmberRaw.borderFocus,
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
  vscodeBgRoot: 'var(--syn-vscode-bg-root)',
  vscodeBgActivity: 'var(--syn-vscode-bg-activity)',
  vscodeBgSidebar: 'var(--syn-vscode-bg-sidebar)',
  vscodeBgEditor: 'var(--syn-vscode-bg-editor)',
  vscodeBgPanel: 'var(--syn-vscode-bg-panel)',
  vscodeBgElevated: 'var(--syn-vscode-bg-elevated)',
  vscodeBgInput: 'var(--syn-vscode-bg-input)',
  vscodeBgHover: 'var(--syn-vscode-bg-hover)',
  vscodeBorderSubtle: 'var(--syn-vscode-border-subtle)',
  vscodeBorderStrong: 'var(--syn-vscode-border-strong)',
  vscodeTextPrimary: 'var(--syn-vscode-text-primary)',
  vscodeTextSecondary: 'var(--syn-vscode-text-secondary)',
  vscodeTextMuted: 'var(--syn-vscode-text-muted)',
  vscodeAccentBlue: 'var(--syn-vscode-accent-blue)',
  vscodeAccentBlueSoft: 'var(--syn-vscode-accent-blue-soft)',
  vscodeAttentionAmber: 'var(--syn-vscode-attention-amber)',
  vscodeAttentionAmberSoft: 'var(--syn-vscode-attention-amber-soft)',
  surfaceWorkbench: 'var(--syn-surface-workbench)',
  surfaceNavigation: 'var(--syn-surface-navigation)',
  surfacePanel: 'var(--syn-surface-panel)',
  surfaceEditor: 'var(--syn-surface-editor)',
  surfaceElevated: 'var(--syn-surface-elevated)',
  surfaceInput: 'var(--syn-surface-input)',
  surfaceHover: 'var(--syn-surface-hover)',
  surfaceOverlay: 'var(--syn-surface-overlay)',
  textDefault: 'var(--syn-text-default)',
  textInverse: 'var(--syn-text-inverse)',
  borderDefault: 'var(--syn-border-default)',
  borderSubtle: 'var(--syn-border-subtle)',
  borderStrong: 'var(--syn-border-strong)',
  borderActive: 'var(--syn-border-active)',
  borderFocus: 'var(--syn-border-focus)',
  textPrimary: 'var(--syn-text-primary)',
  textSecondary: 'var(--syn-text-secondary)',
  textMuted: 'var(--syn-text-muted)',
  textDisabled: 'var(--syn-text-disabled)',
  accentPrimary: 'var(--syn-accent-primary)',
  accentPrimaryHover: 'var(--syn-accent-primary-hover)',
  accentPrimaryPressed: 'var(--syn-accent-primary-pressed)',
  accentSoftBg: 'var(--syn-accent-soft-bg)',
  interactionHover: 'var(--syn-interaction-hover)',
  interactionSelected: 'var(--syn-interaction-selected)',
  interactionActive: 'var(--syn-interaction-active)',
  interactionFocusRing: 'var(--syn-interaction-focus-ring)',
  interactionDisabled: 'var(--syn-interaction-disabled)',
  focusRing: 'var(--syn-interaction-focus-ring)',
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
  statusValid: 'var(--syn-status-valid)',
  statusWarning: 'var(--syn-status-warning)',
  statusError: 'var(--syn-status-error)',
  statusInfo: 'var(--syn-status-info)',
  statusBlocked: 'var(--syn-status-blocked)',
  statusStale: 'var(--syn-status-stale)',
  statusUnknown: 'var(--syn-status-unknown)',
  statusDemo: 'var(--syn-status-demo)',
  statusRunning: 'var(--syn-status-running)',
  statusPending: 'var(--syn-status-pending)',
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
    surfaceWorkbench: string;
    surfaceNavigation: string;
    surfacePanel: string;
    surfaceEditor: string;
    surfaceElevated: string;
    surfaceInput: string;
    surfaceHover: string;
    surfaceOverlay: string;
    borderDefault: string;
    borderSubtle: string;
    borderStrong: string;
    borderActive: string;
    borderFocus: string;
    textDefault: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textDisabled: string;
    textInverse: string;
    accentPrimary: string;
    accentPrimaryHover: string;
    accentPrimaryPressed: string;
    accentSoftBg: string;
    interactionHover: string;
    interactionSelected: string;
    interactionActive: string;
    interactionFocusRing: string;
    interactionDisabled: string;
    warning400: string;
    info400: string;
    statusValid: string;
    statusWarning: string;
    statusError: string;
    statusInfo: string;
    statusBlocked: string;
    statusStale: string;
    statusUnknown: string;
    statusDemo: string;
    statusRunning: string;
    statusPending: string;
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
    surfaceWorkbench: charcoalAmberVars.surfaceWorkbench,
    surfaceNavigation: charcoalAmberVars.surfaceNavigation,
    surfacePanel: charcoalAmberVars.surfacePanel,
    surfaceEditor: charcoalAmberVars.surfaceEditor,
    surfaceElevated: charcoalAmberVars.surfaceElevated,
    surfaceInput: charcoalAmberVars.surfaceInput,
    surfaceHover: charcoalAmberVars.surfaceHover,
    surfaceOverlay: charcoalAmberVars.surfaceOverlay,
    borderDefault: charcoalAmberVars.borderDefault,
    borderSubtle: charcoalAmberVars.borderSubtle,
    borderStrong: charcoalAmberVars.borderStrong,
    borderActive: charcoalAmberVars.borderActive,
    borderFocus: charcoalAmberVars.borderFocus,
    textDefault: charcoalAmberVars.textDefault,
    textPrimary: charcoalAmberVars.textPrimary,
    textSecondary: charcoalAmberVars.textSecondary,
    textMuted: charcoalAmberVars.textMuted,
    textDisabled: charcoalAmberVars.textDisabled,
    textInverse: charcoalAmberVars.textInverse,
    accentPrimary: charcoalAmberVars.accentPrimary,
    accentPrimaryHover: charcoalAmberVars.accentPrimaryHover,
    accentPrimaryPressed: charcoalAmberVars.accentPrimaryPressed,
    accentSoftBg: charcoalAmberVars.accentSoftBg,
    interactionHover: charcoalAmberVars.interactionHover,
    interactionSelected: charcoalAmberVars.interactionSelected,
    interactionActive: charcoalAmberVars.interactionActive,
    interactionFocusRing: charcoalAmberVars.interactionFocusRing,
    interactionDisabled: charcoalAmberVars.interactionDisabled,
    warning400: charcoalAmberVars.warning,
    info400: charcoalAmberVars.info,
    statusValid: charcoalAmberVars.statusValid,
    statusWarning: charcoalAmberVars.statusWarning,
    statusError: charcoalAmberVars.statusError,
    statusInfo: charcoalAmberVars.statusInfo,
    statusBlocked: charcoalAmberVars.statusBlocked,
    statusStale: charcoalAmberVars.statusStale,
    statusUnknown: charcoalAmberVars.statusUnknown,
    statusDemo: charcoalAmberVars.statusDemo,
    statusRunning: charcoalAmberVars.statusRunning,
    statusPending: charcoalAmberVars.statusPending,
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



