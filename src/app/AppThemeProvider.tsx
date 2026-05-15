import type { PropsWithChildren } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { synapseTheme } from '@/theme/synapse';
import { GlobalSynapseStyles } from '@/theme/GlobalSynapseStyles';

const AppShellStyles = createGlobalStyle`
  :root {
    --app-shell-bg: var(--syn-surface-workbench);
    --app-shell-surface: var(--syn-surface-panel);
    --app-shell-surface-alt: var(--syn-surface-navigation);
    --app-shell-editor: var(--syn-surface-editor);
    --app-shell-elevated: var(--syn-surface-elevated);
    --app-shell-input: var(--syn-surface-input);
    --app-shell-hover: var(--syn-surface-hover);
    --app-shell-border: var(--syn-border-default);
    --app-shell-border-strong: var(--syn-border-strong);
    --app-shell-text: var(--syn-text-default);
    --app-shell-text-secondary: var(--syn-text-secondary);
    --app-shell-accent: var(--syn-interaction-active);
    --app-shell-focus: var(--syn-interaction-focus-ring);
    --app-shell-status-valid: var(--syn-status-valid);
    --app-shell-status-warning: var(--syn-status-warning);
    --app-shell-status-error: var(--syn-status-error);
    --app-shell-status-info: var(--syn-status-info);
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
    background: var(--syn-surface-overlay);
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
