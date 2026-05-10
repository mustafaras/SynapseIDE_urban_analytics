

export const DESIGN_TOKENS = {

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.618rem',
    xl: '2.618rem',
    xxl: '4.236rem',
    xxxl: '6.854rem',
    glass: '1.272rem',
    hover: '0.125rem',
    glassDark: '1.414rem',
  },


  borderRadius: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    glass: '0.618rem',
    hover: '0.375rem',
    glassDark: '0.707rem',
    full: '50%',
    geometric: '0',
  },


  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glass: 'var(--shadow-lg)',
    hover: 'var(--shadow-overlay)',
    glassDark: 'var(--shadow-lg)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(245, 158, 11, 0.45)',
    premium: '0 20px 40px rgba(245, 158, 11, 0.18)',

    lightXs: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    lightSm: '0 1px 3px 0 rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    lightMd: '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    lightLg: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
    lightXl: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
  },


  blur: {
    xs: 'blur(2px)',
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(12px)',
    xl: 'blur(16px)',
    glass: 'blur(10px)',
    hover: 'blur(20px)',
    glassDark: 'blur(14px)',
    premium: 'blur(25px)',
    subtle: 'blur(6px)',
  },


  transitions: {
    xs: 'all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    sm: 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    md: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    lg: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    xl: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    glass: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    hover: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    glassDark: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    spring: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    theme: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },


  colors: {

    primary: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },


    neutral: {
      50: 'hsl(0, 0%, 98%)',
      100: 'hsl(0, 0%, 95%)',
      200: 'hsl(0, 0%, 90%)',
      300: 'hsl(0, 0%, 80%)',
      400: 'hsl(0, 0%, 70%)',
      500: 'hsl(0, 0%, 50%)',
      600: 'hsl(0, 0%, 40%)',
      700: 'hsl(0, 0%, 30%)',
      800: 'hsl(0, 0%, 20%)',
      900: 'hsl(0, 0%, 10%)',
    },


    accent: {
      yellow: '#F59E0B',
      red: '#EF4444',
      signal: '#F59E0B',
    },


    semantic: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#F59E0B',
    },
  },


  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      brand: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace",
    },


    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
      xxxl: '2rem',
      display: '2.5rem',
      hero: '3rem',
    },

    fontWeight: {
      thin: 100,
      light: 200,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },

    lineHeight: {
      none: 1,
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },


  glassmorphism: {
    background: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(0, 0, 0, 0.1)',
      glass: 'rgba(255, 255, 255, 0.08)',
      glassDark: 'rgba(0, 0, 0, 0.15)',

      lightMode: 'rgba(255, 255, 255, 0.8)',
      lightModeHover: 'rgba(255, 255, 255, 0.9)',
      lightModeSubtle: 'rgba(255, 255, 255, 0.6)',
    },
    border: {
      light: 'rgba(255, 255, 255, 0.2)',
      medium: 'rgba(255, 255, 255, 0.3)',
      dark: 'rgba(255, 255, 255, 0.1)',
      glass: 'rgba(255, 255, 255, 0.18)',
      glassDark: 'rgba(255, 255, 255, 0.08)',

      lightMode: 'rgba(255, 255, 255, 0.3)',
      lightModeSubtle: 'rgba(255, 255, 255, 0.2)',
    },
    backdrop: {
      sm: 'blur(8px)',
      md: 'blur(16px)',
      lg: 'blur(24px)',
      glass: 'blur(10px)',
      glassDark: 'blur(14px)',

      lightMode: 'blur(10px)',
      lightModeSubtle: 'blur(6px)',
    },
  },


  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      medium: '300ms',
      slow: '600ms',
      glass: '250ms',
      hover: '200ms',
      glassDark: '350ms',
    },
    easing: {
      easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bauhaus: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      glass: 'cubic-bezier(0.4, 0, 0.2, 1)',
      hover: 'cubic-bezier(0.4, 0, 0.2, 1)',
      glassDark: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },


  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },


  layout: {

    maxWidth: {
      content: 'max-w-[720px]',
      contentMobile: 'max-w-[90vw]',
      container: 'w-full max-w-[720px]',
      wide: 'max-w-[1200px]',
      narrow: 'max-w-[480px]',
    },


    padding: {
      container: 'px-4 sm:px-8 md:px-12',
      section: 'py-8 md:py-12 lg:py-16',
      tight: 'px-4 py-6',
      relaxed: 'px-8 py-12',
    },


    grid: {
      autoFit: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
      responsive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      sidebar: 'grid-cols-1 lg:grid-cols-[300px_1fr]',
    },
  },


  opacity: {
    2: 0.02,   // ghost
    4: 0.04,   // whisper
    8: 0.08,   // subtle
    12: 0.12,  // light
    16: 0.16,  // medium
    24: 0.24,  // strong
    32: 0.32,  // bold
    48: 0.48,  // heavy
    64: 0.64,  // dense
    80: 0.80,  // solid
  },


  gradients: {
    // Surface gradients (dark depth)
    surface: 'linear-gradient(180deg, #000000 0%, #0d0d0d 100%)',
    card: 'linear-gradient(135deg, #0d0d0d 0%, #1A1A1A 100%)',
    cardHover: 'linear-gradient(135deg, #1A1A1A 0%, #242424 100%)',
    elevated: 'linear-gradient(135deg, #121212 0%, #1A1A1A 100%)',

    // Accent gradients (amber)
    amber: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    amberStrong: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    amberLight: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
    amberGlow: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
    amberSubtle: 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 100%)',

    // Glass gradients (frosted)
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)',
    glassAmber: 'linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 100%)',
    glassSubtle: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',

    // Header / overlay
    header: 'linear-gradient(180deg, rgba(26,26,26,0.96), rgba(18,18,18,0.96))',
    overlayFade: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)',

    // Amber decorative
    amberText: 'linear-gradient(90deg, #FDE68A 0%, #FBBF24 35%, #F59E0B 65%, #D97706 100%)',
    amberBorder: 'linear-gradient(90deg, #FBBF24, #F59E0B, #D97706)',

    // Status gradients
    statusSuccess: 'linear-gradient(180deg, #4ADE80, #22C55E)',
    statusError: 'linear-gradient(180deg, #EF4444, #B91C1C)',
    statusWarning: 'linear-gradient(180deg, #FBBF24, #D97706)',
    statusInfo: 'linear-gradient(180deg, #F59E0B, #B45309)',

    // Shimmer/gleam (pseudo-element overlay)
    shimmer: 'linear-gradient(105deg, transparent 40%, rgba(245,158,11,0.06) 45%, rgba(245,158,11,0.12) 50%, rgba(245,158,11,0.06) 55%, transparent 60%)',
  },


  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    statusBar: 9999,
    modal: 10050,
    popover: 10060,
    tooltip: 10070,
    toast: 10080,
    terminal: 10000,
    aiAssistant: 10001,
  },


  mapExplorer: {
    colors: {
      charcoalBase: '#0d0d0d',
      charcoalPanel: 'rgba(23, 23, 23, 0.97)',
      charcoalHeader: 'rgba(13, 13, 13, 0.95)',
      charcoalWorkspace: 'rgb(17 17 17 / 96%)',
      overlay: 'rgba(0, 0, 0, 0.75)',
      amberDim: 'rgba(245, 158, 11, 0.15)',
      amberSubtle: 'rgba(245, 158, 11, 0.08)',
      amberHairline: 'rgba(245, 158, 11, 0.12)',
      amberBorder: 'rgba(245, 158, 11, 0.2)',
      amberBorderMedium: 'rgba(245, 158, 11, 0.3)',
      amberBorderStrong: 'rgba(245, 158, 11, 0.4)',
      amberBorderFocus: 'rgba(245, 158, 11, 0.5)',
      amberDashed: 'rgba(245, 158, 11, 0.6)',
      warmText: '#FAFAF9',
      warmTextSecondary: '#D6D3D1',
      warmTextMuted: '#A8A29E',
      markerWhite: '#ffffff',
      transparent: 'transparent',
    },
    dimensions: {
      viewportWidth: '100vw',
      viewportHeight: '100vh',
      searchWidth: '15rem',
      searchMaxWidth: '25rem',
      pinSidebarWidth: '17.5rem',
      layerPanelWidth: '22.5rem',
      drawingPanelWidth: '16.25rem',
      measurementPanelWidth: '17.5rem',
      navigatorMaxWidth: '87.5rem',
      navigatorMaxHeight: '51.25rem',
      importProgressWidth: '20rem',
      closeButtonSize: '2rem',
      symbologyPanelWidth: '22.5rem',
      pinMarkerSize: '0.875rem',
      separatorWidth: '0.0625rem',
      toolbarSeparatorHeight: '1.25rem',
      progressTrackHeight: '0.375rem',
      hiddenSize: '0.0625rem',
    },
    numeric: {
      // Use the design system's modal tier (10050) so toasts (10080) and tooltips (10070)
      // can render above the map workspace. Previously this was set to 2_147_483_647 (max
      // int32), which silently clipped every notification surface behind the modal and made
      // Save/Load button feedback invisible to users.
      overlayZIndex: 10050,
      dropdownZIndex: 20,
      closeButtonZIndex: 10,
      sidebarZIndex: 5,
      temporalSelectorZIndex: 26,
      symbologyPanelZIndex: 29,
      dragOverlayZIndex: 35,
      importProgressZIndex: 36,
      overlayMargin: 16,
      layerPanelWidth: 360,
      pinSidebarWidth: 280,
      drawingPanelWidth: 260,
      measurementPanelWidth: 280,
      mapDockMinCenterWidth: 320,
      navigatorMaxWidth: 1400,
      navigatorMaxHeight: 820,
      navigatorStageMargin: 16,
      navigatorStageTop: 8,
      navigatorStageBottom: 8,
      scaleMaxWidth: 200,
      popupOffset: 16,
      iconXs: 10,
      iconSm: 13,
      iconMd: 14,
    },
    letterSpacing: {
      title: '0.03125rem',
      label: '0.04375rem',
      caps: '0.06em',
    },
  },
} as const;


export const getToken = (path: string) => {
  return path.split('.').reduce<unknown>((value, key) => {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    return (value as Record<string, unknown>)[key];
  }, DESIGN_TOKENS as unknown);
};


export type SpacingToken = keyof typeof DESIGN_TOKENS.spacing;
export type BorderRadiusToken = keyof typeof DESIGN_TOKENS.borderRadius;
export type ShadowToken = keyof typeof DESIGN_TOKENS.shadows;
export type BlurToken = keyof typeof DESIGN_TOKENS.blur;
export type TransitionToken = keyof typeof DESIGN_TOKENS.transitions;
export type ColorToken = keyof typeof DESIGN_TOKENS.colors;
export type TypographyToken = keyof typeof DESIGN_TOKENS.typography;
export type OpacityToken = keyof typeof DESIGN_TOKENS.opacity;
export type GradientToken = keyof typeof DESIGN_TOKENS.gradients;


export const MODULAR_SCALE = {
  ratio: 1.272,
  goldenRatio: 1.618,
  baseSize: 16,
} as const;


export const GOLDEN_RATIO = {
  phi: 1.618033988749,
  small: 0.618033988749,
  large: 2.618033988749,
} as const;


export const GLASSMORPHISM_PRESETS = {
  light: {
    background: DESIGN_TOKENS.glassmorphism.background.light,
    border: DESIGN_TOKENS.glassmorphism.border.light,
    backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.glass,
    borderRadius: DESIGN_TOKENS.borderRadius.glass,
    boxShadow: DESIGN_TOKENS.shadows.glass,
  },
  dark: {
    background: DESIGN_TOKENS.glassmorphism.background.glassDark,
    border: DESIGN_TOKENS.glassmorphism.border.glassDark,
    backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.glassDark,
    borderRadius: DESIGN_TOKENS.borderRadius.glassDark,
    boxShadow: DESIGN_TOKENS.shadows.glassDark,
  },
  premium: {
    background: DESIGN_TOKENS.glassmorphism.background.medium,
    border: DESIGN_TOKENS.glassmorphism.border.medium,
    backdropFilter: DESIGN_TOKENS.blur.premium,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    boxShadow: DESIGN_TOKENS.shadows.premium,
  },

  lightMode: {
    background: DESIGN_TOKENS.glassmorphism.background.lightMode,
    border: DESIGN_TOKENS.glassmorphism.border.lightMode,
    backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.lightMode,
    borderRadius: DESIGN_TOKENS.borderRadius.glass,
    boxShadow: DESIGN_TOKENS.shadows.lightMd,
  },
  lightModeHover: {
    background: DESIGN_TOKENS.glassmorphism.background.lightModeHover,
    border: DESIGN_TOKENS.glassmorphism.border.lightMode,
    backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.lightMode,
    borderRadius: DESIGN_TOKENS.borderRadius.glass,
    boxShadow: DESIGN_TOKENS.shadows.lightLg,
  },
  lightModeSubtle: {
    background: DESIGN_TOKENS.glassmorphism.background.lightModeSubtle,
    border: DESIGN_TOKENS.glassmorphism.border.lightModeSubtle,
    backdropFilter: DESIGN_TOKENS.glassmorphism.backdrop.lightModeSubtle,
    borderRadius: DESIGN_TOKENS.borderRadius.glass,
    boxShadow: DESIGN_TOKENS.shadows.lightSm,
  },
} as const;


export const COMPONENT_SIZES = {
  button: {
    xs: { height: '1.5rem', padding: '0 0.5rem', fontSize: 'xs' },
    sm: { height: '2rem', padding: '0 0.75rem', fontSize: 'sm' },
    md: { height: '2.5rem', padding: '0 1rem', fontSize: 'md' },
    lg: { height: '3rem', padding: '0 1.25rem', fontSize: 'lg' },
  },
  input: {
    sm: { height: '2rem', padding: '0 0.75rem', fontSize: 'sm' },
    md: { height: '2.5rem', padding: '0 1rem', fontSize: 'md' },
    lg: { height: '3rem', padding: '0 1.25rem', fontSize: 'lg' },
  },
} as const;


export const THEMES = {
  light: {
    background: DESIGN_TOKENS.colors.neutral[50],
    surface: DESIGN_TOKENS.colors.neutral[100],
    text: DESIGN_TOKENS.colors.neutral[900],
    textSecondary: DESIGN_TOKENS.colors.neutral[600],
    border: DESIGN_TOKENS.colors.neutral[200],
    glassmorphism: DESIGN_TOKENS.glassmorphism.background.light,
    glassBorder: DESIGN_TOKENS.glassmorphism.border.light,
  },
  dark: {
    background: DESIGN_TOKENS.colors.neutral[900],
    surface: DESIGN_TOKENS.colors.neutral[800],
    text: DESIGN_TOKENS.colors.neutral[100],
    textSecondary: DESIGN_TOKENS.colors.neutral[400],
    border: DESIGN_TOKENS.colors.neutral[700],
    glassmorphism: DESIGN_TOKENS.glassmorphism.background.dark,
    glassBorder: DESIGN_TOKENS.glassmorphism.border.dark,
  },
} as const;
