import type { PropsWithChildren } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { synapseTheme } from '@/theme/synapse';
import { GlobalSynapseStyles } from '@/theme/GlobalSynapseStyles';
import { CONFIG } from '@/config/env';

const AppShellStyles = createGlobalStyle`
  :root {
    --app-shell-bg: var(${CONFIG.theme.vars.rootBg});
    --app-shell-surface: var(${CONFIG.theme.vars.surface1});
    --app-shell-surface-alt: var(${CONFIG.theme.vars.surface2});
    --app-shell-border: var(${CONFIG.theme.vars.border});
    --app-shell-text: var(${CONFIG.theme.vars.textPrimary});
    --app-shell-accent: var(${CONFIG.theme.vars.accentPrimary});
    --app-shell-focus: var(${CONFIG.theme.vars.focusRing});
  }

  [data-app-shell="root"] {
    min-height: 100vh;
    background: var(--app-shell-bg);
    color: var(--app-shell-text);
  }

  [data-app-shell="frame"] {
    min-height: 100vh;
    background: var(--app-shell-bg);
  }

  [data-app-shell="modal-overlay"] {
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(2px);
  }
`;

export default function AppThemeProvider({ children }: PropsWithChildren) {


  return (
    <ThemeProvider
      theme={(outer) => ({
        ...(outer as any),

        synapse: synapseTheme,

        focusRing: synapseTheme.focusRing,
      })}
    >
      <GlobalSynapseStyles />
      <AppShellStyles />
      {children}
    </ThemeProvider>
  );
}
