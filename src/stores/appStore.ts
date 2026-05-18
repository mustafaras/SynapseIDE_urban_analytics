import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type {
  AppError,
  AppLayout,
  GlobalState,
  IdeActivityRailItem,
  IdeBottomPanelTab,
  User,
  UserPreferences,
} from '../types/state';


interface AppStore extends GlobalState {

  setUser: (user: User | null) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  updateLayout: (layout: Partial<AppLayout>) => void;
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  dismissError: (errorId: string) => void;
  clearErrors: () => void;
  setLoading: (isLoading: boolean) => void;
  updateLastActivity: () => void;


  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleTerminal: () => void;
  setSidebarWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setTerminalHeight: (height: number) => void;
  setAiAssistantWidth: (width: number) => void;
  setAiAssistantHeight: (height: number) => void;
  toggleAiChat: () => void;
  setAiChatVisible: (visible: boolean) => void;
  setActivityRailItem: (item: IdeActivityRailItem) => void;
  setBottomPanelTab: (tab: IdeBottomPanelTab) => void;
  setBottomPanelCollapsed: (collapsed: boolean) => void;
  setBottomPanelHeight: (height: number) => void;
}

const defaultLayout: AppLayout = {
  sidebarCollapsed: false,
  sidebarWidth: 300,
  rightPanelCollapsed: false,
  rightPanelWidth: 400,
  terminalVisible: true,

  terminalHeight: 224,
  aiChatVisible: true,
  aiAssistantWidth: 500,
  aiAssistantHeight: 420,
  density: 'comfortable',
  activityRail: {
    activeItem: 'explorer',
  },
  bottomPanel: {
    activeTab: 'terminal',
    collapsed: false,
    height: 320,
  },
  shell: {
    rightDockMode: 'ai',
    syncStripVisible: true,
  },
  panelSizes: {
    explorer: 200,
    search: 150,
    git: 180,
    extensions: 160,
  },
};

const defaultUserPreferences: UserPreferences = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Fira Code, Monaco, Menlo, monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  keyBindings: 'vscode',
  glassmorphismIntensity: 0.1,
};

type PersistedAppState = {
  user?: User | null;
  layout?: Partial<AppLayout>;
  isAuthenticated?: boolean;
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, numeric));
}

function normalizeActivityRailItem(input: unknown): IdeActivityRailItem {
  return input === 'explorer' ||
    input === 'outline' ||
    input === 'search' ||
    input === 'planHistory' ||
    input === 'problems' ||
    input === 'mapBridge' ||
    input === 'urbanBridge' ||
    input === 'settings'
    ? input
    : defaultLayout.activityRail.activeItem;
}

function normalizeBottomPanelTab(input: unknown): IdeBottomPanelTab {
  return input === 'terminal' ||
    input === 'tasks' ||
    input === 'problems' ||
    input === 'planHistory' ||
    input === 'searchResults' ||
    input === 'output'
    ? input
    : defaultLayout.bottomPanel.activeTab;
}

function normalizeDensity(input: unknown): AppLayout['density'] {
  return input === 'compact' || input === 'comfortable' || input === 'relaxed'
    ? input
    : defaultLayout.density;
}

function normalizeLayout(input: unknown): AppLayout {
  const source = (input && typeof input === 'object') ? (input as Partial<AppLayout>) : {};
  const bottomPanelSource = (
    source.bottomPanel && typeof source.bottomPanel === 'object' ? source.bottomPanel : {}
  ) as Partial<AppLayout['bottomPanel']>;
  const activityRailSource = (
    source.activityRail && typeof source.activityRail === 'object' ? source.activityRail : {}
  ) as Partial<AppLayout['activityRail']>;
  const shellSource = (
    source.shell && typeof source.shell === 'object' ? source.shell : {}
  ) as Partial<AppLayout['shell']>;

  const terminalHeight = clampNumber(
    source.terminalHeight,
    28,
    600,
    defaultLayout.terminalHeight
  );

  return {
    ...defaultLayout,
    ...source,
    sidebarWidth: clampNumber(source.sidebarWidth, 200, 600, defaultLayout.sidebarWidth),
    rightPanelWidth: clampNumber(source.rightPanelWidth, 300, 800, defaultLayout.rightPanelWidth),
    terminalHeight,
    aiAssistantWidth: clampNumber(
      source.aiAssistantWidth,
      320,
      900,
      defaultLayout.aiAssistantWidth ?? 500
    ),
    aiAssistantHeight: clampNumber(
      source.aiAssistantHeight,
      240,
      900,
      defaultLayout.aiAssistantHeight ?? 420
    ),
    density: normalizeDensity(source.density),
    activityRail: {
      ...defaultLayout.activityRail,
      ...activityRailSource,
      activeItem: normalizeActivityRailItem(activityRailSource.activeItem),
    },
    bottomPanel: {
      ...defaultLayout.bottomPanel,
      ...bottomPanelSource,
      activeTab: normalizeBottomPanelTab(bottomPanelSource.activeTab),
      collapsed:
        typeof bottomPanelSource.collapsed === 'boolean'
          ? bottomPanelSource.collapsed
          : !source.terminalVisible,
      height: clampNumber(bottomPanelSource.height, 28, 600, terminalHeight),
    },
    shell: {
      ...defaultLayout.shell,
      ...shellSource,
      rightDockMode:
        shellSource.rightDockMode === 'ai' ||
        shellSource.rightDockMode === 'mapBridge' ||
        shellSource.rightDockMode === 'urbanBridge' ||
        shellSource.rightDockMode === 'evidence' ||
        shellSource.rightDockMode === null
          ? shellSource.rightDockMode
          : defaultLayout.shell.rightDockMode,
      syncStripVisible:
        typeof shellSource.syncStripVisible === 'boolean'
          ? shellSource.syncStripVisible
          : defaultLayout.shell.syncStripVisible,
    },
    panelSizes: {
      ...defaultLayout.panelSizes,
      ...(source.panelSizes ?? {}),
    },
  };
}

function normalizeThemePreference(input: unknown): UserPreferences['theme'] {
  const raw = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (raw === 'dark' || raw === 'light' || raw === 'neutral' || raw === 'auto') {
    return raw;
  }

  // Any unknown persisted theme alias is normalized to neutral for safe migration.
  if (raw) {
    return 'neutral';
  }

  return defaultUserPreferences.theme;
}

function normalizeUserPreferences(input: unknown): UserPreferences {
  const source = (input && typeof input === 'object') ? (input as Partial<UserPreferences>) : {};
  return {
    ...defaultUserPreferences,
    ...source,
    theme: normalizeThemePreference(source.theme),
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    immer(set => ({

      user: null,
      isAuthenticated: false,
      layout: defaultLayout,
      errors: [],
      collaboration: {
        isConnected: false,
        participants: [],
        permissions: {
          canEdit: true,
          canComment: true,
          canShare: true,
        },
      },
      isLoading: false,
      lastActivity: new Date(),


      setUser: user =>
        set(state => {
          state.user = user;
          if (user) {
            state.isAuthenticated = true;
          }
        }),

      updateUserPreferences: preferences =>
        set(state => {
          if (state.user) {
            Object.assign(state.user.preferences, preferences);
          }
        }),

      setAuthenticated: isAuthenticated =>
        set(state => {
          state.isAuthenticated = isAuthenticated;
          if (!isAuthenticated) {
            state.user = null;
          }
        }),

      updateLayout: layout =>
        set(state => {
          Object.assign(state.layout, layout);
        }),

      addError: error =>
        set(state => {
          const newError: AppError = {
            ...error,
            id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            dismissed: false,
          };
          state.errors.push(newError);
        }),

      dismissError: errorId =>
        set(state => {
          const error = state.errors.find(e => e.id === errorId);
          if (error) {
            error.dismissed = true;
          }
        }),

      clearErrors: () =>
        set(state => {
          state.errors = state.errors.filter(e => !e.dismissed);
        }),

      setLoading: isLoading =>
        set(state => {
          state.isLoading = isLoading;
        }),

      updateLastActivity: () =>
        set(state => {
          state.lastActivity = new Date();
        }),


      toggleSidebar: () =>
        set(state => {
          state.layout.sidebarCollapsed = !state.layout.sidebarCollapsed;
        }),

      toggleRightPanel: () =>
        set(state => {
          state.layout.rightPanelCollapsed = !state.layout.rightPanelCollapsed;
        }),

      toggleAiChat: () =>
        set(state => {
          state.layout.aiChatVisible = !state.layout.aiChatVisible;
          state.layout.shell.rightDockMode = state.layout.aiChatVisible ? 'ai' : null;
        }),

      setAiChatVisible: (visible: boolean) =>
        set(state => {
          state.layout.aiChatVisible = !!visible;
          state.layout.shell.rightDockMode = state.layout.aiChatVisible ? 'ai' : null;
        }),

      toggleTerminal: () =>
        set(state => {
          state.layout.terminalVisible = !state.layout.terminalVisible;
          state.layout.bottomPanel.collapsed = !state.layout.terminalVisible;
          if (state.layout.terminalVisible) {
            state.layout.bottomPanel.activeTab = state.layout.bottomPanel.activeTab || 'terminal';
          }
        }),

      setSidebarWidth: width =>
        set(state => {
          state.layout.sidebarWidth = Math.max(200, Math.min(600, width));
        }),

      setRightPanelWidth: width =>
        set(state => {
          state.layout.rightPanelWidth = Math.max(300, Math.min(800, width));
        }),

      setAiAssistantWidth: width =>
        set(state => {

          state.layout.aiAssistantWidth = Math.max(320, Math.min(900, width));
        }),

      setAiAssistantHeight: height =>
        set(state => {

          const maxH = Math.min(
            typeof window !== 'undefined' ? window.innerHeight * 0.95 : 900,
            900
          );
          state.layout.aiAssistantHeight = Math.max(240, Math.min(maxH, height));
        }),

      setTerminalHeight: height =>
        set(state => {

          const nextHeight = Math.max(28, Math.min(600, height));
          state.layout.terminalHeight = nextHeight;
          state.layout.bottomPanel.height = nextHeight;
        }),

      setActivityRailItem: item =>
        set(state => {
          state.layout.activityRail.activeItem = item;
        }),

      setBottomPanelTab: tab =>
        set(state => {
          state.layout.bottomPanel.activeTab = tab;
          state.layout.bottomPanel.collapsed = false;
          state.layout.terminalVisible = true;
        }),

      setBottomPanelCollapsed: collapsed =>
        set(state => {
          state.layout.bottomPanel.collapsed = collapsed;
          state.layout.terminalVisible = !collapsed;
        }),

      setBottomPanelHeight: height =>
        set(state => {
          const nextHeight = Math.max(28, Math.min(600, height));
          state.layout.bottomPanel.height = nextHeight;
          state.layout.terminalHeight = nextHeight;
        }),
    })),
    {
      name: 'enhanced-ide-app-state',
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState && typeof persistedState === 'object')
          ? (persistedState as PersistedAppState)
          : {};

        // v3 → v4: reset terminal height so users pick up the new compact default.
        const incomingLayout = state.layout && typeof state.layout === 'object'
          ? { ...state.layout }
          : state.layout;
        if (version < 4 && incomingLayout && typeof incomingLayout === 'object') {
          delete (incomingLayout as { terminalHeight?: number }).terminalHeight;
          const bp = (incomingLayout as { bottomPanel?: { height?: number } }).bottomPanel;
          if (bp && typeof bp === 'object') {
            delete bp.height;
          }
        }

        return {
          ...state,
          layout: normalizeLayout(incomingLayout),
          ...(state.user
            ? {
                user: {
                  ...state.user,
                  preferences: normalizeUserPreferences(state.user.preferences),
                },
              }
            : {}),
        };
      },
      partialize: state => ({
        user: state.user,
        layout: state.layout,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);


export const useLayoutActions = () => {
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const toggleRightPanel = useAppStore(s => s.toggleRightPanel);
  const toggleTerminal = useAppStore(s => s.toggleTerminal);
  const toggleAiChat = useAppStore(s => s.toggleAiChat);
  const setSidebarWidth = useAppStore(s => s.setSidebarWidth);
  const setRightPanelWidth = useAppStore(s => s.setRightPanelWidth);
  const setTerminalHeight = useAppStore(s => s.setTerminalHeight);
  const setActivityRailItem = useAppStore(s => s.setActivityRailItem);
  const setBottomPanelTab = useAppStore(s => s.setBottomPanelTab);
  const setBottomPanelCollapsed = useAppStore(s => s.setBottomPanelCollapsed);
  const setBottomPanelHeight = useAppStore(s => s.setBottomPanelHeight);
  const updateLayout = useAppStore(s => s.updateLayout);

  return useMemo(
    () => ({
      toggleSidebar,
      toggleRightPanel,
      toggleTerminal,
      toggleAiChat,
      setSidebarWidth,
      setRightPanelWidth,
      setTerminalHeight,
      setActivityRailItem,
      setBottomPanelTab,
      setBottomPanelCollapsed,
      setBottomPanelHeight,
      updateLayout,
    }),
    [
      toggleSidebar,
      toggleRightPanel,
      toggleTerminal,
      toggleAiChat,
      setSidebarWidth,
      setRightPanelWidth,
      setTerminalHeight,
      setActivityRailItem,
      setBottomPanelTab,
      setBottomPanelCollapsed,
      setBottomPanelHeight,
      updateLayout,
    ]
  );
};


export const useUserPreferences = () => {
  const user = useAppStore(s => s.user);
  const updateUserPreferences = useAppStore(s => s.updateUserPreferences);

  const preferences = useMemo(() => user?.preferences || defaultUserPreferences, [user]);

  const updatePreferences = useCallback(
    (newPreferences: Partial<UserPreferences>) => {
      updateUserPreferences(newPreferences);
    },
    [updateUserPreferences]
  );

  return { preferences, updatePreferences };
};


export const useErrorManager = () => {
  const errors = useAppStore(s => s.errors);
  const addError = useAppStore(s => s.addError);
  const dismissError = useAppStore(s => s.dismissError);
  const clearErrors = useAppStore(s => s.clearErrors);
  const showError = useCallback(
    (message: string, details?: string, retryAction?: () => void) => {
      addError({
        type: 'error',
        message,
        ...(details && { details }),
        ...(retryAction && { retryAction }),
        dismissed: false,
      });
    },
    [addError]
  );

  const showWarning = useCallback(
    (message: string, details?: string) => {
      addError({
        type: 'warning',
        message,
        ...(details && { details }),
        dismissed: false,
      });
    },
    [addError]
  );

  const showInfo = useCallback(
    (message: string, details?: string) => {
      addError({
        type: 'info',
        message,
        ...(details && { details }),
        dismissed: false,
      });
    },
    [addError]
  );

  return {
    errors: errors.filter(e => !e.dismissed),
    showError,
    showWarning,
    showInfo,
    dismissError,
    clearErrors,
  };
};
