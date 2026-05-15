import { createGlobalStyle } from 'styled-components';

export const GlobalSynapseStyles = createGlobalStyle`
  :root {

  --syn-bg-root:#000000;
  --syn-bg-surface-1:#121212;
  --syn-bg-surface-2:#1A1A1A;
  --syn-bg-elevated:#202020;

  /* ── VS Code-inspired primitive palette (non-breaking additions) ── */
  --syn-vscode-bg-root: #1e1f24;
  --syn-vscode-bg-activity: #24272f;
  --syn-vscode-bg-sidebar: #252a31;
  --syn-vscode-bg-editor: #1f232a;
  --syn-vscode-bg-panel: #232832;
  --syn-vscode-bg-elevated: #2b3038;
  --syn-vscode-bg-input: #1a1f26;
  --syn-vscode-bg-hover: #303642;
  --syn-vscode-border-subtle: #343a44;
  --syn-vscode-border-strong: #4a5260;
  --syn-vscode-text-primary: #d7dce5;
  --syn-vscode-text-secondary: #a4adbb;
  --syn-vscode-text-muted: #778190;
  --syn-vscode-accent-blue: #3794ff;
  --syn-vscode-accent-blue-soft: #1f4f7f;
  --syn-vscode-attention-amber: #d6a84f;
  --syn-vscode-attention-amber-soft: #4a3a1e;

  --syn-vscode-status-valid: #4ec27d;
  --syn-vscode-status-warning: #d6a84f;
  --syn-vscode-status-error: #f87171;
  --syn-vscode-status-info: #6aa9ff;
  --syn-vscode-status-blocked: #f87171;
  --syn-vscode-status-stale: #9aa3b2;
  --syn-vscode-status-unknown: #858b96;
  --syn-vscode-status-demo: #c084fc;
  --syn-vscode-status-running: #6aa9ff;
  --syn-vscode-status-pending: #a4adbb;

  /* ── Prompt 05 semantic alias layer ── */
  --syn-surface-workbench: var(--syn-vscode-bg-root);
  --syn-surface-navigation: var(--syn-vscode-bg-sidebar);
  --syn-surface-panel: var(--syn-vscode-bg-panel);
  --syn-surface-editor: var(--syn-vscode-bg-editor);
  --syn-surface-elevated: var(--syn-vscode-bg-elevated);
  --syn-surface-input: var(--syn-vscode-bg-input);
  --syn-surface-hover: var(--syn-vscode-bg-hover);
  --syn-surface-overlay: rgba(12,15,20,0.78);

  --syn-text-default: var(--syn-vscode-text-primary);
  --syn-text-secondary: var(--syn-vscode-text-secondary);
  --syn-text-muted: var(--syn-vscode-text-muted);
  --syn-text-disabled: #6f7785;
  --syn-text-inverse: #0f1218;
  --syn-text-link: var(--syn-vscode-accent-blue);
  --syn-text-link-hover: #66adff;

  --syn-border-default: var(--syn-vscode-border-subtle);
  --syn-border-subtle: var(--syn-vscode-border-subtle);
  --syn-border-strong: var(--syn-vscode-border-strong);
  --syn-border-active: var(--syn-vscode-accent-blue);
  --syn-border-focus: var(--syn-vscode-accent-blue);

  --syn-interaction-hover: var(--syn-vscode-bg-hover);
  --syn-interaction-selected: var(--syn-vscode-accent-blue-soft);
  --syn-interaction-active: var(--syn-vscode-accent-blue);
  --syn-interaction-focus-ring: var(--syn-vscode-accent-blue);
  --syn-interaction-disabled: rgba(119,129,144,0.36);

  --syn-status-valid: var(--syn-vscode-status-valid);
  --syn-status-warning: var(--syn-vscode-status-warning);
  --syn-status-error: var(--syn-vscode-status-error);
  --syn-status-info: var(--syn-vscode-status-info);
  --syn-status-blocked: var(--syn-vscode-status-blocked);
  --syn-status-stale: var(--syn-vscode-status-stale);
  --syn-status-unknown: var(--syn-vscode-status-unknown);
  --syn-status-demo: var(--syn-vscode-status-demo);
  --syn-status-running: var(--syn-vscode-status-running);
  --syn-status-pending: var(--syn-vscode-status-pending);

  /* ── Legacy --syn-* compatibility aliases ── */
  --syn-bg-root: var(--syn-surface-workbench);
  --syn-bg-surface-1: var(--syn-surface-panel);
  --syn-bg-surface-2: var(--syn-surface-navigation);
  --syn-bg-elevated: var(--syn-surface-elevated);
  --syn-bg-900: var(--syn-surface-workbench);
  --syn-surface-800: var(--syn-surface-panel);
  --syn-overlay: var(--syn-surface-overlay);
  --syn-border-700: var(--syn-border-default);
  --syn-focus-ring: var(--syn-interaction-focus-ring);

  --syn-accent-primary:#F59E0B;
  --syn-accent-primary-hover:#D97706;
  --syn-accent-primary-pressed:#B45309;
  --syn-accent-soft-bg:#2A1C08;
  --syn-accent-interactive: var(--syn-interaction-active);
  --syn-accent-interactive-soft: var(--syn-interaction-selected);
  --syn-accent-attention: var(--syn-vscode-attention-amber);
  --syn-focus-ring-blue: var(--syn-interaction-focus-ring);

  --syn-gold-500: var(--syn-accent-primary);
  --syn-gold-300: var(--syn-accent-primary-hover);

  --syn-text-primary: var(--syn-text-default);
  --syn-text-100: var(--syn-text-default);
  --syn-text-400: var(--syn-text-muted);

  --syn-danger-400: var(--syn-status-error);
  --syn-success-400: var(--syn-status-valid);
  --syn-warning-400: var(--syn-status-warning);
  --syn-info-400: var(--syn-status-info);

  /* ── Status color variants (base / hover / pressed / bg) ── */
  --syn-success: var(--syn-status-valid);
  --syn-success-hover: #16A34A;
  --syn-success-pressed: #15803D;
  --syn-success-bg: rgba(34,197,94,0.12);

  --syn-danger: var(--syn-status-error);
  --syn-danger-hover: #DC2626;
  --syn-danger-pressed: #B91C1C;
  --syn-danger-bg: rgba(239,68,68,0.12);

  --syn-warning: var(--syn-status-warning);
  --syn-warning-hover: #D97706;
  --syn-warning-pressed: #B45309;
  --syn-warning-bg: rgba(245,158,11,0.12);

  --syn-info: var(--syn-status-info);
  --syn-info-hover: #FBBF24;
  --syn-info-pressed: #F59E0B;
  --syn-info-bg: rgba(252,211,77,0.12);

  /* ── Status border tokens (≈0.32 opacity) ── */
  --syn-success-border: rgba(34,197,94,0.32);
  --syn-danger-border: rgba(239,68,68,0.32);
  --syn-warning-border: rgba(245,158,11,0.32);
  --syn-info-border: rgba(252,211,77,0.32);

  /* ── Text-on-status variants ── */
  --syn-text-success: #4ADE80;
  --syn-text-error: #FCA5A5;
  --syn-text-warning: #FDE68A;
  --syn-text-info: #FEF3C7;

  /* ── Typography color tokens ── */
  --syn-text-accent: #FDE68A;
  --syn-text-on-accent: #000000;

  --syn-chart-1:#F59E0B;
  --syn-chart-2:#FB923C;
  --syn-chart-3:#84CC16;
  --syn-chart-4:#22C55E;
  --syn-chart-5:#F97316;
  --syn-chart-6:#EAB308;
  --syn-chart-neutral:#A8A29E;

  --syn-shadow-soft: rgba(0,0,0,0.3);
  --syn-border-highlight: var(--syn-border-focus);
  --syn-glow-subtle: 0 0 6px rgba(245,158,11,0.28);

  /* ── Opacity scale (10 steps) ── */
  --syn-alpha-2: 0.02;
  --syn-alpha-4: 0.04;
  --syn-alpha-8: 0.08;
  --syn-alpha-12: 0.12;
  --syn-alpha-16: 0.16;
  --syn-alpha-24: 0.24;
  --syn-alpha-32: 0.32;
  --syn-alpha-48: 0.48;
  --syn-alpha-64: 0.64;
  --syn-alpha-80: 0.80;

  /* ── Amber accent at various opacities ── */
  --syn-accent-bg: rgba(245,158,11, 0.12);
  --syn-accent-bg-hover: rgba(245,158,11, 0.16);
  --syn-accent-bg-strong: rgba(245,158,11, 0.24);
  --syn-accent-border: rgba(245,158,11, 0.48);
  --syn-accent-glow: rgba(245,158,11, 0.32);

  /* ── White overlay at various opacities ── */
  --syn-overlay-whisper: rgba(255,255,255, 0.04);
  --syn-overlay-subtle: rgba(255,255,255, 0.08);
  --syn-overlay-light: rgba(255,255,255, 0.12);
  --syn-overlay-medium: rgba(255,255,255, 0.16);
  --syn-overlay-strong: rgba(255,255,255, 0.24);

  /* ── Black depth at various opacities ── */
  --syn-depth-subtle: rgba(0,0,0, 0.24);
  --syn-depth-medium: rgba(0,0,0, 0.32);
  --syn-depth-strong: rgba(0,0,0, 0.48);
  --syn-depth-heavy: rgba(0,0,0, 0.64);

  /* ── Gradient tokens ── */
  --syn-gradient-surface: linear-gradient(180deg, #000000 0%, #0d0d0d 100%);
  --syn-gradient-card: linear-gradient(135deg, #0d0d0d 0%, #1A1A1A 100%);
  --syn-gradient-card-hover: linear-gradient(135deg, #1A1A1A 0%, #242424 100%);
  --syn-gradient-elevated: linear-gradient(135deg, #121212 0%, #1A1A1A 100%);
  --syn-gradient-amber: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --syn-gradient-amber-strong: linear-gradient(135deg, #F59E0B 0%, #B45309 100%);
  --syn-gradient-amber-light: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%);
  --syn-gradient-glass: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%);
  --syn-gradient-glass-amber: linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 100%);
  --syn-gradient-header: linear-gradient(180deg, rgba(26,26,26,0.96), rgba(18,18,18,0.96));
  --syn-gradient-amber-text: linear-gradient(90deg, #FDE68A 0%, #FBBF24 35%, #F59E0B 65%, #D97706 100%);
  --syn-gradient-amber-border: linear-gradient(90deg, #FBBF24, #F59E0B, #D97706);
  --syn-gradient-amber-glow: linear-gradient(135deg, #FBBF24 0%, #D97706 100%);
  --syn-gradient-status-success: linear-gradient(180deg, #44d07d, #2a8f55);
  --syn-gradient-status-error: linear-gradient(180deg, #d84f4f, #a32020);
  --syn-gradient-status-warning: linear-gradient(180deg, #FBBF24, #D97706);
  --syn-gradient-status-info: linear-gradient(180deg, #F59E0B, #B45309);
  --syn-gradient-glass-subtle: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
  --syn-gradient-overlay-fade: linear-gradient(to bottom, rgba(0,0,0,0.35), transparent);

  /* ── Transition & Easing tokens ── */
  --syn-transition-fast: all 0.1s cubic-bezier(0.25,0.46,0.45,0.94);
  --syn-transition-normal: all 0.15s cubic-bezier(0.25,0.46,0.45,0.94);
  --syn-transition-medium: all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  --syn-transition-slow: all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);
  --syn-easing-bauhaus: cubic-bezier(0.25,0.46,0.45,0.94);
  --syn-easing-spring: cubic-bezier(0.16,1,0.3,1);
  --syn-easing-bounce: cubic-bezier(0.68,-0.55,0.265,1.55);


  --color-bg-app: var(--syn-surface-workbench);
  --color-bg-surface: var(--syn-surface-panel);
  --color-bg-surface-alt: var(--syn-surface-navigation);
  --color-bg-overlay: var(--syn-surface-overlay);
  --color-bg-inverse: #FAFAF9;

  --color-text-primary: var(--syn-text-default);
  --color-text-secondary: var(--syn-text-secondary);
  --color-text-muted: var(--syn-text-muted);
  --color-text-accent: var(--syn-interaction-active);
  --color-text-inverse: var(--syn-text-inverse);
  --color-text-danger: var(--syn-status-error);
  --color-text-success: var(--syn-status-valid);
  --color-text-warning: var(--syn-status-warning);

  --color-border-subtle: var(--syn-border-subtle);
  --color-border-default: var(--syn-border-default);
  --color-border-strong: var(--syn-border-strong);
  --color-border-focus: var(--syn-border-focus);

  --color-accent-primary: var(--syn-accent-primary);
  --color-accent-primary-hover: var(--syn-accent-primary-hover);
  --color-accent-primary-active: var(--syn-accent-primary-pressed);
  --color-accent-primary-soft: var(--syn-accent-soft-bg);
  --color-accent-primary-subtle: var(--syn-accent-bg-hover);

  --color-status-success: var(--syn-status-valid);
  --color-status-warning: var(--syn-status-warning);
  --color-status-danger: var(--syn-status-error);
  --color-status-info: var(--syn-status-info);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-x4: 4px;
  --space-x8: 8px;
  --space-x12: 12px;
  --space-x16: 16px;
  --space-x20: 20px;
  --space-x24: 24px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.35);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.40);
  --shadow-lg: 0 10px 24px rgba(0,0,0,0.45);
  --shadow-overlay: 0 0 0 1px rgba(255,255,255,0.04), 0 4px 28px rgba(0,0,0,0.55);
  --shadow-focus: 0 0 0 3px rgba(55,148,255,0.35);
  --shadow-glow: 0 0 10px -2px rgba(245,158,11,0.5);
  --syn-shadow-card: 0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06);

  --focus-default-outline: 2px solid var(--syn-focus-ring);
  --focus-critical-outline: 2px solid var(--syn-danger-400);
  --focus-subtle-outline: 1px solid rgba(255,255,255,0.22);

  --ai-surface: var(--syn-bg-root);
  --ai-surface-alt: var(--syn-bg-surface-1);
  --ai-border: var(--syn-border-default);
  --ai-border-strong: var(--syn-border-strong);
  --ai-gold: var(--syn-accent-primary);
  --ai-gold-soft: var(--syn-accent-primary-hover);
  --ai-text-secondary: var(--syn-text-muted);
  --ai-danger: var(--syn-danger);


  --panel: var(--syn-surface-800);
  --text-1: var(--syn-text-100);
  --border: var(--syn-border-700);


  --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, "Liberation Mono", Consolas, "Courier New", monospace;
  --font-sans: var(--font-mono);
  }


  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    background: var(--syn-bg-root);
    color: var(--syn-text-primary);
    font-family: var(--font-mono);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }


  code, pre, kbd, samp { font-family: var(--font-mono); }

  /* ── Selection highlight ── */
  ::selection {
    background: color-mix(in srgb, var(--syn-interaction-active) 38%, transparent);
    color: var(--syn-text-default);
  }
  ::-moz-selection {
    background: color-mix(in srgb, var(--syn-interaction-active) 38%, transparent);
    color: var(--syn-text-default);
  }

  /* ── Global smooth interactive transitions ── */
  button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"]) {
    transition:
      color 0.15s cubic-bezier(0.25,0.46,0.45,0.94),
      background-color 0.15s cubic-bezier(0.25,0.46,0.45,0.94),
      border-color 0.15s cubic-bezier(0.25,0.46,0.45,0.94),
      box-shadow 0.15s cubic-bezier(0.25,0.46,0.45,0.94),
      opacity 0.15s cubic-bezier(0.25,0.46,0.45,0.94);
  }

  a {
    color: var(--syn-text-link);
    text-decoration: none;
    transition: color 0.15s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  a:hover {
    color: var(--syn-text-link-hover);
    text-decoration: underline;
  }

  /* ── Focus-visible with animated glow ── */
  :focus-visible {
    outline: 2px solid var(--syn-focus-ring);
    outline-offset: 2px;
    box-shadow: var(--shadow-focus);
    transition: box-shadow 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }


  .hairline { border: 1px solid var(--syn-border-700); }


  /* ── Scrollbar (Webkit) ── */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--syn-border-default);
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--syn-border-strong);
    background-clip: content-box;
  }
  /* ── Scrollbar (Firefox) ── */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--syn-border-default) transparent;
  }

  /* ── Scrollbar Utility Variants ── */

  /* Default: subtle neutral */
  .syn-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
  .syn-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .syn-scrollbar::-webkit-scrollbar-thumb {
    background: var(--syn-border-default);
    border-radius: 4px;
  }
  .syn-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--syn-border-strong);
  }

  /* Accent: amber-tinted */
  .syn-scrollbar-accent::-webkit-scrollbar { width: 8px; height: 8px; }
  .syn-scrollbar-accent::-webkit-scrollbar-track {
    background: linear-gradient(180deg, transparent, rgba(245,158,11,0.04) 50%, transparent);
  }
  .syn-scrollbar-accent::-webkit-scrollbar-thumb {
    background: rgba(245,158,11, 0.4);
    border-radius: 4px;
  }
  .syn-scrollbar-accent::-webkit-scrollbar-thumb:hover {
    background: rgba(245,158,11, 0.6);
  }
  .syn-scrollbar-accent {
    scrollbar-color: rgba(245,158,11, 0.4) transparent;
  }

  /* Hidden: no scrollbar */
  .syn-scrollbar-hidden::-webkit-scrollbar { display: none; }
  .syn-scrollbar-hidden { scrollbar-width: none; -ms-overflow-style: none; }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }


  pre {
    background: var(--syn-bg-surface-1);
    border: 1px solid var(--syn-border-default);
    border-radius: 16px;
    padding: 12px 14px;
    overflow: auto;
    line-height: 1.6;
  }

  /* ── Premium Micro-Interaction Utilities ── */

  .syn-border-gradient {
    border: 1px solid transparent;
    background-clip: padding-box;
    position: relative;
  }
  .syn-border-gradient::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(245,158,11,0.4), rgba(245,158,11,0.1));
    z-index: -1;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: xor;
    padding: 1px;
  }

  .syn-shimmer {
    position: relative;
    overflow: hidden;
  }
  .syn-shimmer::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(245,158,11,0.04) 45%,
      rgba(245,158,11,0.08) 50%,
      rgba(245,158,11,0.04) 55%,
      transparent 60%
    );
    transform: translateX(-100%);
    transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
    pointer-events: none;
  }
  .syn-shimmer:hover::after {
    transform: translateX(100%);
  }

  .syn-lift {
    transition: transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94),
                box-shadow 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .syn-lift:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .syn-press:active {
    transform: scale(0.98);
    transition: transform 0.1s cubic-bezier(0.25,0.46,0.45,0.94);
  }

  @media (prefers-reduced-motion: reduce) {
    .syn-shimmer::after {
      display: none;
    }
    .syn-lift:hover {
      transform: none;
    }
    .syn-press:active {
      transform: none;
    }
  }
`;
