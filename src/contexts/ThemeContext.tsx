import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { DESIGN_TOKENS } from '../constants/design';
import { type ActiveThemeName, type Theme, type ThemeName, themes } from '../styles/theme';

interface ThemeContextType {
  theme: Theme;
  themeName: ActiveThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  designTokens: typeof DESIGN_TOKENS;
  applyThemeTransition: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

interface ThemeProviderProps { children: React.ReactNode; defaultTheme?: ThemeName }

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultTheme = 'dark' }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    try {
      const stored = localStorage.getItem('theme') as ThemeName | null;
      if (stored && ['light','dark','neutral','auto'].includes(stored)) return stored as ThemeName;
    } catch {}
    return defaultTheme;
  });

  const resolveTheme = (t: ThemeName): ActiveThemeName => {
    if (t === 'auto') {
      try {
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
      } catch {}

      return 'light';
    }
    return t as ActiveThemeName;
  };

  const activeThemeName = resolveTheme(themeName);
  const currentTheme = themes[activeThemeName];

  useEffect(() => {
    if (themeName !== 'auto') return undefined;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setThemeName('auto');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeName]);

  useEffect(() => {
    const root = document.documentElement;
    const applyKV = (k: string, v: string) => root.style.setProperty(k, v);

    Object.entries(currentTheme.colors).forEach(([k,v]) => applyKV(`--color-${k.replace(/([A-Z])/g,'-$1').toLowerCase()}`, v));

    // Prompt 06: semantic compatibility bridge for provider-written CSS vars.
    const semanticVarBridge: Record<string, string> = {
      '--color-background': 'var(--syn-surface-workbench)',
      '--color-surface': 'var(--syn-surface-panel)',
      '--color-surface-alt': 'var(--syn-surface-navigation)',
      '--color-overlay': 'var(--syn-surface-overlay)',
      '--color-text': 'var(--syn-text-default)',
      '--color-text-primary': 'var(--syn-text-default)',
      '--color-text-secondary': 'var(--syn-text-secondary)',
      '--color-text-muted': 'var(--syn-text-muted)',
      '--color-text-inverse': 'var(--syn-text-inverse)',
      '--color-border': 'var(--syn-border-default)',
      '--color-border-subtle': 'var(--syn-border-subtle)',
      '--color-border-strong': 'var(--syn-border-strong)',
      '--color-border-focus': 'var(--syn-border-focus)',
      '--color-primary': 'var(--syn-interaction-active)',
      '--color-accent': 'var(--syn-accent-attention)',
      '--color-link': 'var(--syn-text-link)',
      '--color-success': 'var(--syn-status-valid)',
      '--color-warning': 'var(--syn-status-warning)',
      '--color-error': 'var(--syn-status-error)',
      '--color-info': 'var(--syn-status-info)',

      // Preserve the legacy app-level variable family while sourcing semantic tokens.
      '--color-bg-app': 'var(--syn-surface-workbench)',
      '--color-bg-surface': 'var(--syn-surface-panel)',
      '--color-bg-surface-alt': 'var(--syn-surface-navigation)',
      '--color-bg-overlay': 'var(--syn-surface-overlay)',
      '--color-text-accent': 'var(--syn-interaction-active)',
      '--color-text-danger': 'var(--syn-status-error)',
      '--color-text-success': 'var(--syn-status-valid)',
      '--color-text-warning': 'var(--syn-status-warning)',
      '--color-status-success': 'var(--syn-status-valid)',
      '--color-status-warning': 'var(--syn-status-warning)',
      '--color-status-danger': 'var(--syn-status-error)',
      '--color-status-info': 'var(--syn-status-info)',
    };
    Object.entries(semanticVarBridge).forEach(([k, v]) => applyKV(k, v));


    applyKV('--glass-background', currentTheme.colors.glass);
    applyKV('--glass-border', currentTheme.colors.glassBorder);
    const glassBackdropFilter = activeThemeName === 'neutral'
      ? `${DESIGN_TOKENS.blur.glassDark} saturate(140%)`
      : activeThemeName === 'dark'
        ? `${DESIGN_TOKENS.blur.glass} saturate(180%)`
        : `${DESIGN_TOKENS.blur.glass} saturate(200%)`;
    applyKV('--glass-backdrop-filter', glassBackdropFilter);


    const tagHoverGlow = activeThemeName === 'dark'
      ? `0 4px 12px ${currentTheme.colors.accent}40, 0 0 20px ${currentTheme.colors.accent}30`
      : activeThemeName === 'light'
        ? `0 4px 12px ${currentTheme.colors.accent}25, 0 0 15px ${currentTheme.colors.accent}20`
        : `0 4px 12px ${currentTheme.colors.accent}35, 0 0 18px ${currentTheme.colors.accent}25`;
    const tagActiveGlow = activeThemeName === 'dark'
      ? `0 6px 16px ${currentTheme.colors.accent}50, 0 0 30px ${currentTheme.colors.accent}40`
      : activeThemeName === 'light'
        ? `0 6px 16px ${currentTheme.colors.accent}30, 0 0 25px ${currentTheme.colors.accent}25`
        : `0 6px 16px ${currentTheme.colors.accent}40, 0 0 28px ${currentTheme.colors.accent}30`;
    applyKV('--tag-hover-glow', tagHoverGlow);
    applyKV('--tag-active-glow', tagActiveGlow);
    applyKV('--tag-hover-accent', currentTheme.colors.accent);

    const appTitleColor = currentTheme.colors.textPrimary ?? currentTheme.colors.text;
    applyKV('--app-title-color', appTitleColor);
    const highContrastTextSecondary = currentTheme.colors.textSecondary;
    applyKV('--text-secondary-high-contrast', highContrastTextSecondary);
    applyKV('--text-contrast-aa', currentTheme.colors.textPrimary ?? currentTheme.colors.text);
    applyKV('--text-contrast-aaa', currentTheme.colors.textPrimary ?? currentTheme.colors.text);


    document.documentElement.className = `theme-${activeThemeName}`;
    document.documentElement.setAttribute('data-theme', activeThemeName);
  }, [currentTheme, activeThemeName]);

  useEffect(() => { try { localStorage.setItem('theme', themeName); } catch {} }, [themeName]);

  const setTheme = React.useCallback((t: ThemeName) => {
    if (['light','dark','neutral','auto'].includes(t)) {
      setThemeName(t);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    const order: ThemeName[] = ['light','dark','neutral','auto'];
    const idx = order.indexOf(themeName);
    setTheme(order[(idx + 1) % order.length]);
  }, [themeName, setTheme]);

  const applyThemeTransition = React.useCallback(() => {
    document.body.style.transition = 'all 300ms var(--syn-easing-bauhaus)';
    document.documentElement.style.transition = 'all 300ms var(--syn-easing-bauhaus)';

    setTimeout(() => {
      document.body.style.transition = '';
      document.documentElement.style.transition = '';
    }, 350);
  }, []);

  const value = React.useMemo<ThemeContextType>(() => ({
    theme: currentTheme,
    themeName: activeThemeName,
    setTheme,
    toggleTheme,
    designTokens: DESIGN_TOKENS,
    applyThemeTransition,
  }), [currentTheme, activeThemeName, setTheme, toggleTheme, applyThemeTransition]);

  return <ThemeContext.Provider value={value}><StyledThemeProvider theme={currentTheme}>{children}</StyledThemeProvider></ThemeContext.Provider>;
};
