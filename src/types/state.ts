

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'neutral' | 'auto';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  keyBindings: 'vscode' | 'vim' | 'emacs';
  glassmorphismIntensity: number;
}

export interface FileSemanticStatus {
  generated?: boolean;
  synced?: boolean;
  analysisOutput?: boolean;
  mapLayerCandidate?: boolean;
  scenarioArtifact?: boolean;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string | undefined;
  language?: string | undefined;
  isDirty?: boolean | undefined;
  lastModified: Date;
  size?: number | undefined;
  semanticStatus?: FileSemanticStatus | undefined;
  children?: FileNode[] | undefined;
  isExpanded?: boolean | undefined;
  isSelected?: boolean | undefined;
}

export type EditorTabOrigin = 'user' | 'bridge' | 'ai-plan' | 'duplicate';

export interface EditorTab {
  id: string;
  fileId: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  isPinned?: boolean;
  cursorPosition: { line: number; column: number };
  scrollPosition: { top: number; left: number };
  selections: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }>;
  /** Provenance of how this tab was created. Persisted so evidence trails survive reloads. */
  origin?: EditorTabOrigin;
  /** Preview/peek mode (single-click open that gets replaced unless edited). */
  previewMode?: boolean;
  /** ISO timestamp of the last interaction; used for MRU ordering on restore. */
  lastAccessedAt?: string;
  /** Identifier of the AI plan run that created this tab, when applicable. */
  sourcePlanRunId?: string;
  /** True when a restored tab no longer resolves to a file tree node. */
  isMissingFile?: boolean;
  /** Human-readable restore warning for missing or invalid restored tab references. */
  restoreMessage?: string;
}

export interface EditorHistory {
  undo: Array<{
    id: string;
    timestamp: Date;
    content: string;
    cursorPosition: { line: number; column: number };
  }>;
  redo: Array<{
    id: string;
    timestamp: Date;
    content: string;
    cursorPosition: { line: number; column: number };
  }>;
}

export type IdeActivityRailItem =
  | 'explorer'
  | 'outline'
  | 'search'
  | 'planHistory'
  | 'problems'
  | 'mapBridge'
  | 'urbanBridge'
  | 'settings';

export type IdeBottomPanelTab =
  | 'terminal'
  | 'tasks'
  | 'problems'
  | 'planHistory'
  | 'searchResults'
  | 'output';

export type IdeRightDockMode = 'ai' | 'mapBridge' | 'urbanBridge' | 'evidence' | null;

export interface IdeBottomPanelState {
  activeTab: IdeBottomPanelTab;
  collapsed: boolean;
  height: number;
}

export interface IdeActivityRailState {
  activeItem: IdeActivityRailItem;
}

export interface IdeShellState {
  rightDockMode: IdeRightDockMode;
  syncStripVisible: boolean;
}

export interface AppLayout {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  rightPanelCollapsed: boolean;
  rightPanelWidth: number;
  terminalVisible: boolean;
  terminalHeight: number;
  aiChatVisible: boolean;
  aiAssistantWidth?: number;
  aiAssistantHeight?: number;
  density: 'compact' | 'comfortable' | 'relaxed';
  activityRail: IdeActivityRailState;
  bottomPanel: IdeBottomPanelState;
  shell: IdeShellState;
  panelSizes: {
    explorer: number;
    search: number;
    git: number;
    extensions: number;
  };
}

export interface CollaborationState {
  isConnected: boolean;
  roomId?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    cursor?: { line: number; column: number };
    selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  }>;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
  };
}

export interface AppError {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
  dismissed: boolean;
  retryAction?: () => void;
}

export interface GlobalState {
  user: User | null;
  isAuthenticated: boolean;
  layout: AppLayout;
  errors: AppError[];
  collaboration: CollaborationState;
  isLoading: boolean;
  lastActivity: Date;
}
