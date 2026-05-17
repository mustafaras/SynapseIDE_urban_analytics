
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore, useLayoutActions } from '../../stores/appStore';
import {
  useActiveTab,
  useDirtyTabs,
  useEditorStore,
  useTabActions,
} from '../../stores/editorStore';
import { useFileExplorerStore, useFileOperations } from '../../stores/fileExplorerStore';
const MonacoEditor = React.lazy(() =>
  import('../editor/MonacoEditor').then(m => ({ default: m.MonacoEditor }))
);
import { SynapseCoreAIPanel } from '../ai/panel/SynapseCoreAIPanel';
import { flags } from '../../config/flags';
import { FileExplorer } from '../file-explorer/FileExplorer';
import NewFileModal from '../file-explorer/NewFileModal';
import { Folder, Plus } from 'lucide-react';
import { OutlinePane } from '../editor/OutlinePane';
import { BEGINNER_ASSISTANT_ENABLED } from '../../features/beginnerAssistant';
import { Header } from './Header';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { ActivityRail } from './ActivityRail';
import { ShellPlaceholderPane } from './ShellPlaceholderPane';
import { BottomPanel } from './BottomPanel';
import { InlineSearchPane } from './InlineSearchPane';
import { useUrbanStore } from '../../features/urbanAnalytics/store';
import { CommandPalette } from './CommandPalette';
import IdeThemeScope from './IdeThemeScope';
import '@/ui/theme/ideProScope.css';
import './styles/ideShell.css';
import { GlobalSearch } from './GlobalSearch';
import { registerCommands } from '../../services/commandRegistry';
import { IdeMapHandoffDemo } from './IdeMapHandoffDemo';
import { useMapExplorerStore } from '../../stores/useMapExplorerStore';
import {
  evaluateIdeMapHandoffEligibility,
  focusRelatedLayer,
  openInMapExplorer,
  registerSpatialArtifact,
  sendSelectionToMap,
} from '@/services/map/ideMapHandoff';
import {
  attachScriptToScenario,
  evaluateIdeUrbanHandoffEligibility,
  openScenarioInUrbanAnalytics,
  registerIndicatorDefinition,
  sendResultArtifactToUrbanAnalytics,
} from '@/services/analytics/ideUrbanHandoff';
import { toastInfo, toastWarning } from '@/ui/toast/api';
import {
  AiAssistant,
  applyPlan,
  dryRunPlan,
  getActiveProjectId,
  getLastPlan,
  loadThread,
  notify,
  recordTelemetry,
  refreshProjectBrief,
  telemetryVerbose,
} from '../ai/index';
import { buildApplyPlan } from '@/utils/ai/apply/buildApplyPlan';
import { executeApplyPlan } from '@/utils/ai/apply/executeApplyPlan';
import { insertIntoActive as editorInsertIntoActive } from '@/services/editorBridge';
import { terminalInfo } from '../terminal/terminalLogBus';
import { triggerTask } from '../../services/tasksBridge';
import { editorBridge, subscribeEditorBridge } from '@/services/editor/bridge';
import { reportError } from '@/lib/error-bus';
import { useSynapseWorkspaceStore } from '@/stores/useSynapseWorkspaceStore';
import {
  evaluateEvidenceEligibility,
  selectRecentArtifacts,
} from '@/utils/synapseEvidence';
import { sbDiagnostics } from '@/components/StatusBar/statusBridge';
import {
  type Diagnostic,
  recordApplyPlanErrorDiagnostic,
  useProblemsStore,
} from '@/stores/problemsStore';
import {
  flattenOutlineSymbols,
  type OutlineSymbol,
  useOutlineStore,
} from '@/stores/outlineStore';
import type { FileNode, IdeActivityRailItem } from '@/types/state';

const IDE_ACTIVITY_RAIL_WIDTH = 42;
const IDE_RESIZER_WIDTH = 6;
const IDE_HEADER_HEIGHT = 64;
const IDE_STATUS_BAR_HEIGHT = 30;
const FALLBACK_AI_DOCK_WIDTH = 400;

// BOTTOM_PANEL_TABS moved to BottomPanel.tsx (Prompt 14).

function diagnosticPathCandidates(path: string) {
  const normalized = path.replace(/\\/g, '/').replace(/^file:\/+/, '');
  const withoutLeadingSlash = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  const candidates = new Set<string>([normalized, withoutLeadingSlash, `/${withoutLeadingSlash}`]);
  const workspaceMatch = /SynapseIDE_urban_analytics\/(.+)$/i.exec(withoutLeadingSlash);
  if (workspaceMatch?.[1]) {
    candidates.add(workspaceMatch[1]);
    candidates.add(`/${workspaceMatch[1]}`);
  }
  return [...candidates].filter(Boolean);
}

export const EnhancedIDE: React.FC = () => {
  const layout = useAppStore(s => s.layout);
  const isLoading = useAppStore(s => s.isLoading);
  const {
    toggleSidebar,
    toggleTerminal,
    toggleAiChat,
    setActivityRailItem,
    setBottomPanelTab,
    setBottomPanelCollapsed,
    setBottomPanelHeight,
  } = useLayoutActions();
  useEffect(() => {

    try {
      if (typeof window !== 'undefined') {
        (window as any).e2e = (window as any).e2e || {};
        (window as any).e2e.toggleAI = () => { try { toggleAiChat(); } catch {} };
        (window as any).e2e.setAiChatVisible = (v: boolean) => {
          try { useAppStore.getState().updateLayout({ aiChatVisible: !!v }); } catch {}
        };
        (window as any).e2e.openAssistant = async () => {
          try {
            useAppStore.getState().updateLayout({ aiChatVisible: true });

            await new Promise(r => setTimeout(r, 0));
          } catch {}
        };
      }
    } catch {}
  }, [toggleAiChat]);


  const tabs = useEditorStore(s => s.tabs);
  const activeTabId = useEditorStore(s => s.activeTabId);
  const recoverRestoredTabs = useEditorStore(s => s.recoverRestoredTabs);
  const { openTab, closeTab, setActiveTab, moveTab, closeOtherTabs, pinTab, unpinTab } =
    useTabActions();

  const closeTabsToRight = useEditorStore(s => s.closeTabsToRight);
  const activeTab = useActiveTab();
  const dirtyTabs = useDirtyTabs();


  const { addFile: addFileNode, clearFiles } = useFileOperations();
  const fileTree = useFileExplorerStore(s => s.files);


  const { closeAllTabs } = useTabActions();


  const [aiAssistantWidth, setAiAssistantWidth] = useState(layout.aiAssistantWidth || 500);

  const [sidebarPreviewWidth, setSidebarPreviewWidth] = useState<number | null>(null);
  const MIN_SIDEBAR = 220;
  const MAX_SIDEBAR = 600;
  const DEFAULT_SIDEBAR = 375;
  const MIN_EDITOR_WIDTH = 680;
  const activeActivityItem = layout.activityRail?.activeItem ?? 'explorer';
  const railActivityItem = activeActivityItem === 'problems' ? 'explorer' : activeActivityItem;
  const bottomPanel = layout.bottomPanel ?? {
    activeTab: 'terminal' as const,
    collapsed: !layout.terminalVisible,
    height: layout.terminalHeight ?? 320,
  };
  const bottomPanelVisible = layout.terminalVisible && !bottomPanel.collapsed;
  const bottomPanelHeight = bottomPanelVisible
    ? Math.max(28, Math.min(600, bottomPanel.height || layout.terminalHeight || 320))
    : 0;
  const problemSeverityCounts = useProblemsStore(s => s.severityCounts);
  const problemBadgeCount = problemSeverityCounts.error + problemSeverityCounts.warning;
  const activeOutlineEntry = useOutlineStore(s => (activeTabId ? s.byTabId[activeTabId] : undefined));
  const activeOutlineCount = useMemo(
    () => activeOutlineEntry ? flattenOutlineSymbols(activeOutlineEntry.symbols).length : 0,
    [activeOutlineEntry]
  );
  const rightDockWidth = layout.aiChatVisible
    ? aiAssistantWidth
    : (flags.synapseCoreAI ? FALLBACK_AI_DOCK_WIDTH : 0);
  const leftDockWidth =
    IDE_ACTIVITY_RAIL_WIDTH +
    (!layout.sidebarCollapsed ? layout.sidebarWidth + IDE_RESIZER_WIDTH : 0);
  const shellVars = useMemo(() => ({
    '--ide-shell-header-height': `${IDE_HEADER_HEIGHT}px`,
    '--ide-shell-status-height': `${IDE_STATUS_BAR_HEIGHT}px`,
    '--ide-shell-activity-rail-width': `${IDE_ACTIVITY_RAIL_WIDTH}px`,
    '--ide-shell-resizer-width': `${IDE_RESIZER_WIDTH}px`,
    '--ide-shell-sidebar-panel-width': `${layout.sidebarWidth}px`,
    '--ide-shell-left-width': `${leftDockWidth}px`,
    '--ide-shell-right-gutter': `${rightDockWidth}px`,
    '--ide-shell-bottom-panel-height': bottomPanelVisible ? `${bottomPanelHeight}px` : '0px',
  }) as React.CSSProperties, [
    bottomPanelHeight,
    bottomPanelVisible,
    layout.sidebarWidth,
    leftDockWidth,
    rightDockWidth,
  ]);
  const headerTabs = useMemo(
    () => tabs.map(tab => ({
      id: tab.id,
      name: tab.name,
      isDirty: tab.isDirty,
      isPinned: tab.isPinned ?? false,
    })),
    [tabs]
  );
  const activityBadges = useMemo(
    () => ({
      ...(tabs.length > 0 ? { explorer: tabs.length } : {}),
      ...(activeOutlineCount > 0 ? { outline: activeOutlineCount } : {}),
    }),
    [activeOutlineCount, tabs.length]
  );

  useEffect(() => {

    if (layout.aiAssistantWidth && layout.aiAssistantWidth !== aiAssistantWidth) {
      setAiAssistantWidth(layout.aiAssistantWidth);
    }
  }, [layout.aiAssistantWidth, aiAssistantWidth]);

  useEffect(() => {
    sbDiagnostics(
      problemSeverityCounts.error,
      problemSeverityCounts.warning,
      problemSeverityCounts.info + problemSeverityCounts.hint
    );
  }, [
    problemSeverityCounts.error,
    problemSeverityCounts.hint,
    problemSeverityCounts.info,
    problemSeverityCounts.warning,
  ]);

  useEffect(() => {
    recoverRestoredTabs(fileTree);
  }, [fileTree, recoverRestoredTabs]);

  // Stale-state recovery for restored artifacts (Prompt 27): mirror the
  // editor tab recovery so artifacts pointing at missing local files are
  // marked `validationState: 'stale'` instead of silently lying.
  useEffect(() => {
    const collectPaths = (nodes: typeof fileTree, out: string[] = []): string[] => {
      for (const node of nodes) {
        if (node?.path) out.push(node.path);
        if (node?.children?.length) collectPaths(node.children, out);
      }
      return out;
    };
    const known = collectPaths(fileTree);
    useSynapseWorkspaceStore.getState().recoverRestoredArtifacts(known);
  }, [fileTree]);


  useEffect(() => {
    registerCommands([
      {
        id: 'file.new',
        label: 'New File',
        category: 'File',
        keywords: ['create', 'add', 'touch'],
        shortcut: 'Ctrl+N',
        run: () => setShowNewFileModal(true),
      },
      {
        id: 'view.toggleSidebar',
        label: 'Toggle Sidebar',
        category: 'View',
        keywords: ['hide', 'show', 'explorer', 'panel'],
        run: toggleSidebar,
      },
      {
        id: 'view.toggleTerminal',
        label: 'Toggle Terminal',
        category: 'View',
        keywords: ['hide', 'show', 'console', 'shell'],
        run: toggleTerminal,
      },
      {
        id: 'view.toggleAi',
        label: 'Toggle AI Assistant',
        category: 'View',
        keywords: ['hide', 'show', 'ai', 'chat', 'copilot'],
        run: toggleAiChat,
      },
      {
        id: 'view.openProblems',
        label: 'Open Problems',
        category: 'View',
        keywords: ['errors', 'warnings', 'diagnostics', 'lint'],
        run: () => setBottomPanelTab('problems'),
      },
      {
        id: 'view.openCommandPalette',
        label: 'Show Command Palette',
        category: 'View',
        keywords: ['commands', 'palette', 'run command'],
        shortcut: 'Alt+Shift+P',
        run: () => setCmdOpen(true),
      },
      {
        id: 'view.openGlobalSearch',
        label: 'Find in Files',
        category: 'Search',
        keywords: ['search', 'grep', 'global', 'text'],
        shortcut: 'Ctrl+Shift+F',
        run: () => setSearchOpen(true),
      },
      {
        id: 'workbench.openUrbanAnalytics',
        label: 'Open Urban Analytics',
        category: 'Analytics',
        keywords: ['urban', 'scenario', 'indicators', 'analysis'],
        run: () => useUrbanStore.getState().open(),
      },
      {
        id: 'map.open',
        label: 'Open Map Explorer',
        category: 'Map',
        keywords: ['map', 'layers', 'geospatial', 'gis', 'view'],
        run: () => useMapExplorerStore.getState().open(),
      },
      {
        id: 'map.openInExplorer',
        label: 'Open in Map Explorer',
        category: 'Map',
        keywords: ['open map', 'spatial file', 'handoff', 'geojson', 'layer candidate'],
        enabled: () => evaluateIdeMapHandoffEligibility().canOpenInMapExplorer,
        reason: 'Open a spatial file, generated spatial output, or related layer context first.',
        run: () => {
          const result = openInMapExplorer();
          if (!result.ok) {
            toastWarning(result.reason || 'Map handoff is not available for the current context.');
          } else {
            toastInfo('Opened Map Explorer with IDE spatial context.');
          }
        },
      },
      {
        id: 'map.focusRelatedLayer',
        label: 'Focus Related Layer',
        category: 'Map',
        keywords: ['focus', 'related layer', 'map', 'artifact', 'handoff'],
        enabled: () => evaluateIdeMapHandoffEligibility().canFocusRelatedLayer,
        reason: 'No related map layer found for the active IDE artifact.',
        run: () => {
          const result = focusRelatedLayer();
          if (!result.ok) {
            toastWarning(result.reason || 'No related map layer could be focused.');
          } else {
            toastInfo('Focused related map layer from IDE context.');
          }
        },
      },
      {
        id: 'map.sendSelectionToMap',
        label: 'Send Selection to Map',
        category: 'Map',
        keywords: ['selection', 'geojson', 'feature id', 'map handoff', 'spatial snippet'],
        enabled: () => evaluateIdeMapHandoffEligibility().canSendSelectionToMap,
        reason: 'Select a GeoJSON block or keep a spatial file active in the editor first.',
        run: () => {
          const result = sendSelectionToMap();
          if (!result.ok) {
            toastWarning(result.reason || 'Selection handoff is not available in this context.');
          } else {
            toastInfo('Sent IDE selection reference to Map Explorer.');
          }
        },
      },
      {
        id: 'map.registerSpatialArtifact',
        label: 'Register as Spatial Artifact',
        category: 'Evidence',
        keywords: ['artifact', 'evidence', 'provenance', 'spatial', 'register'],
        enabled: () => evaluateIdeMapHandoffEligibility().canRegisterSpatialArtifact,
        reason: 'Open a spatial artifact or selection before registering to evidence.',
        run: () => {
          const result = registerSpatialArtifact();
          if (!result.ok) {
            toastWarning(result.reason || 'Spatial artifact registration is unavailable here.');
          } else {
            toastInfo('Spatial artifact registered and queued for Map Explorer handoff.');
          }
        },
      },
      {
        id: 'analytics.selectScenario',
        label: 'Select Analytics Scenario',
        category: 'Analytics',
        keywords: ['indicator', 'scenario', 'card', 'urban', 'select'],
        enabled: () => useUrbanStore.getState().isOpen,
        reason: 'Open Urban Analytics first (Open Urban Analytics command)',
        run: () => useUrbanStore.getState().open(),
      },
      {
        id: 'analytics.openScenarioInUrban',
        label: 'Open Scenario in Urban Analytics',
        category: 'Analytics',
        keywords: ['scenario', 'urban analytics', 'handoff', 'open scenario', 'config'],
        enabled: () => evaluateIdeUrbanHandoffEligibility().canOpenScenario,
        reason: 'Open a scenario configuration file (filename containing "scenario") first.',
        run: () => {
          const result = openScenarioInUrbanAnalytics();
          if (!result.ok) {
            toastWarning(result.reason || 'Scenario handoff is not available for the current context.');
          } else {
            toastInfo('Opened Urban Analytics with scenario context.');
          }
        },
      },
      {
        id: 'analytics.attachScriptToScenario',
        label: 'Attach Script to Scenario',
        category: 'Analytics',
        keywords: ['attach', 'script', 'python', 'sql', 'r', 'notebook', 'scenario', 'urban'],
        enabled: () => evaluateIdeUrbanHandoffEligibility().canAttachScript,
        reason: 'Open a Python / R / SQL / notebook analysis script first.',
        run: () => {
          const result = attachScriptToScenario();
          if (!result.ok) {
            toastWarning(result.reason || 'Script attachment is not available in this context.');
          } else {
            toastInfo(
              result.scenarioId
                ? 'Script attached to active scenario.'
                : 'Script registered (no active scenario in workspace memory).',
            );
          }
        },
      },
      {
        id: 'analytics.registerIndicatorDefinition',
        label: 'Register Indicator Definition',
        category: 'Analytics',
        keywords: ['indicator', 'kpi', 'metric', 'urban', 'register', 'evidence'],
        enabled: () => evaluateIdeUrbanHandoffEligibility().canRegisterIndicator,
        reason: 'Open an indicator definition (filename or path containing "indicator" / "kpi") first.',
        run: () => {
          const result = registerIndicatorDefinition();
          if (!result.ok) {
            toastWarning(result.reason || 'Indicator registration is not available here.');
          } else {
            toastInfo('Indicator definition registered for Urban Analytics.');
          }
        },
      },
      {
        id: 'analytics.sendResultArtifact',
        label: 'Send Result Artifact to Urban Analytics',
        category: 'Analytics',
        keywords: ['result', 'artifact', 'output', 'csv', 'parquet', 'report', 'urban', 'send'],
        enabled: () => evaluateIdeUrbanHandoffEligibility().canSendResultArtifact,
        reason: 'Open a result artifact (file under /results, /outputs, or marked as analysis output) first.',
        run: () => {
          const result = sendResultArtifactToUrbanAnalytics();
          if (!result.ok) {
            toastWarning(result.reason || 'Result artifact handoff is not available here.');
          } else {
            toastInfo('Result artifact handed off to Urban Analytics.');
          }
        },
      },
      {
        // Prompt 25 — Evidence-registry-driven command. Eligibility is computed
        // from the bounded artifact registry, not the active editor tab, so it
        // remains available across IDE / Map / Analytics surfaces.
        id: 'evidence.revealLatest',
        label: 'Reveal Most Recent Evidence Artifact',
        category: 'Evidence',
        keywords: ['evidence', 'artifact', 'latest', 'recent', 'reveal', 'open', 'provenance'],
        enabled: () => {
          const artifacts = useSynapseWorkspaceStore.getState().artifacts;
          const e = evaluateEvidenceEligibility(artifacts);
          return e.hasActive && artifacts.some((a) => Boolean(a.uri));
        },
        reason: 'Register at least one active evidence artifact with a uri first.',
        run: () => {
          const artifacts = useSynapseWorkspaceStore.getState().artifacts;
          const recent = selectRecentArtifacts(
            artifacts.filter((a) => a.status === 'active' && Boolean(a.uri)),
            1,
          )[0];
          if (!recent || !recent.uri) {
            toastWarning('No evidence artifact with a resolvable uri is available.');
            return;
          }
          const fr = recent.fileRange;
          if (fr && Number.isFinite(fr.startLine) && Number.isFinite(fr.endLine)) {
            editorBridge.openAtRange(recent.uri, fr.startLine, fr.endLine);
          } else {
            editorBridge.openNewTab({ filename: recent.uri, code: '' });
          }
          toastInfo(`Revealed evidence artifact: ${recent.title || recent.id}`);
        },
      },
    ]);
  }, [setBottomPanelTab, toggleSidebar, toggleTerminal, toggleAiChat]);


  useEffect(() => {
    return subscribeEditorBridge((e) => {
      try {
        if (e.type === 'editor:openTab') {
          const { filename, code, language } = e.payload;
          const path = filename.startsWith('/') ? filename.slice(1) : filename;
          const name = filename.includes('/')
            ? filename.substring(filename.lastIndexOf('/') + 1)
            : filename;

          // Bridge tab dedup: reuse the existing FileNode at this path instead
          // of accumulating a duplicate every time an external surface re-opens
          // the same artifact (Prompt 05).
          const fe = useFileExplorerStore.getState();
          const existing = fe.getFileByPath(path);
          let fileNode: FileNode;
          if (existing) {
            // Refresh the existing node's content/language so the bridge keeps
            // its replace-on-reopen semantics, but preserve its FileNode id.
            fe.updateFile(existing.id, {
              content: code,
              language: language || existing.language || 'plaintext',
              lastModified: new Date(),
              size: code.length,
            } as Partial<FileNode>);
            fileNode = { ...existing, content: code, language: language || existing.language || 'plaintext' };
          } else {
            fileNode = {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name,
              type: 'file',
              path,
              content: code,
              language: language || 'plaintext',
              lastModified: new Date(),
              size: code.length,
            };
            addFileNode(fileNode, '/');
          }
          openTab(fileNode, { origin: 'bridge' });
          return;
        }

        if (e.type === 'editor:openRange') {
          const { path, fromLine, toLine } = e.payload;
          const ed = useEditorStore.getState();
          const normalized = path.startsWith('/') ? path.slice(1) : path;
          const tab =
            ed.tabs.find(t => t.path === normalized) ||
            ed.tabs.find(t => t.path === path);
          if (!tab) return;
          ed.setActiveTab(tab.id);
          // Defer the reveal so the editor has a chance to mount the new model.
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('synapse.editor.reveal', {
                detail: { tabId: tab.id, line: fromLine, column: 1, toLine },
              })
            );
          }, 50);
        }
      } catch (err: any) {
        reportError({ source: 'ui', code: 'unknown', message: String(err?.message || err) });
      }
    });
  }, [openTab, addFileNode]);

  useEffect(() => {
    const openProblems = () => {
      setBottomPanelTab('problems');
    };
    window.addEventListener('synapse:problems', openProblems);
    return () => window.removeEventListener('synapse:problems', openProblems);
  }, [setBottomPanelTab]);


  useEffect(() => {
    if (!layout.sidebarCollapsed && layout.sidebarWidth !== 375) {

      if (layout.sidebarWidth === 300) {
        try {
          useAppStore.getState().setSidebarWidth(375);
        } catch {}
      }
    }
  }, [layout.sidebarWidth, layout.sidebarCollapsed]);


  useEffect(() => {
    if (
      layout.terminalHeight === 40 ||
      layout.terminalHeight === 56 ||
      layout.terminalHeight === 84
    ) {
      try {
        useAppStore.getState().setTerminalHeight(320);
      } catch {}
    }
  }, [layout.terminalHeight]);


  const handleTabClick = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
    },
    [setActiveTab]
  );


  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const handleNewFile = () => setShowNewFileModal(true);


  const handleReorderTabs = useCallback(
    (from: number, to: number) => {
      try {
        moveTab(from, to);
      } catch (e) {
        console.warn('Tab reorder failed', e);
      }
    },
    [moveTab]
  );
  const [isCmdOpen, setCmdOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const handleOpenCommandPalette = useCallback(() => setCmdOpen(true), []);
  const handleGlobalSearch = useCallback(() => setSearchOpen(true), []);
  const handleActivitySelect = useCallback(
    (item: IdeActivityRailItem) => {
      setActivityRailItem(item);
      if (layout.sidebarCollapsed) {
        useAppStore.getState().updateLayout({ sidebarCollapsed: false });
      }
      // Problems also mirrors to the bottom panel tab for convenience
      if (item === 'problems') {
        setBottomPanelTab('problems');
      }
      // Search is now an inline sidebar pane — no modal open
    },
    [layout.sidebarCollapsed, setActivityRailItem, setBottomPanelTab]
  );
  const handleOpenUrbanBridge = useCallback(() => {
    useUrbanStore.getState().open();
  }, []);
  const handleJumpToOutlineSymbol = useCallback(
    (symbol: OutlineSymbol) => {
      if (!activeTab) return;
      setActiveTab(activeTab.id);
      window.dispatchEvent(
        new CustomEvent('synapse.editor.reveal', {
          detail: {
            tabId: activeTab.id,
            line: symbol.selectionRange.startLine,
            column: symbol.selectionRange.startColumn,
          },
        })
      );
    },
    [activeTab, setActiveTab]
  );

  const { saveDirtyTabs, saveTab } = useTabActions();
  const handleSaveAll = useCallback(() => {
    const count = dirtyTabs.length;
    if (count === 0) {
      terminalInfo('No changes to save.');
      return;
    }
    saveDirtyTabs();
    terminalInfo(`Saved ${count} tab${count > 1 ? 's' : ''}.`, 'build');
  }, [dirtyTabs, saveDirtyTabs]);

  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);
  const pendingCloseTab = tabs.find(t => t.id === pendingCloseTabId) ?? null;

  const handleTabClose = useCallback(
    (tabId: string) => {
      const tab = tabs.find(t => t.id === tabId);
      if (tab?.isDirty) {
        setPendingCloseTabId(tabId);
      } else {
        closeTab(tabId);
      }
    },
    [tabs, closeTab]
  );

  const handleUnsavedSave = useCallback(() => {
    if (!pendingCloseTabId) return;
    saveTab(pendingCloseTabId);
    closeTab(pendingCloseTabId);
    setPendingCloseTabId(null);
  }, [pendingCloseTabId, saveTab, closeTab]);

  const handleUnsavedDiscard = useCallback(() => {
    if (!pendingCloseTabId) return;
    closeTab(pendingCloseTabId);
    setPendingCloseTabId(null);
  }, [pendingCloseTabId, closeTab]);

  const handleUnsavedCancel = useCallback(() => {
    setPendingCloseTabId(null);
  }, []);

  const handleRun = useCallback(() => {
    triggerTask('run', 'toolbar');
  }, []);
  const handleBuild = useCallback(() => {
    triggerTask('build', 'toolbar');
  }, []);
  const handleTypecheck = useCallback(() => {
    triggerTask('typecheck', 'command-palette');
  }, []);
  const handleLint = useCallback(() => {
    triggerTask('lint', 'command-palette');
  }, []);
  const handleTest = useCallback(() => {
    triggerTask('test', 'command-palette');
  }, []);

  const handleOpenDiagnostic = useCallback(
    (diagnostic: Diagnostic) => {
      if (!diagnostic.file) return;
      const candidates = diagnosticPathCandidates(diagnostic.file);
      const fileNode = candidates
        .map(candidate => useFileExplorerStore.getState().getFileByPath(candidate))
        .find((node): node is FileNode => Boolean(node && node.type === 'file'));
      if (fileNode) {
        openTab(fileNode, { preserveExistingOrigin: true });
      }
      const line = diagnostic.range?.start.line ?? 1;
      const toLine = diagnostic.range?.end.line ?? line;
      editorBridge.openAtRange(fileNode?.path || candidates[0] || diagnostic.file, line, toLine);
      setBottomPanelTab('problems');
    },
    [openTab, setBottomPanelTab]
  );


  useEffect(() => {
    registerCommands([
      {
        id: 'file.saveAll',
        label: 'Save All',
        category: 'File',
        keywords: ['save', 'write', 'persist', 'flush'],
        shortcut: 'Ctrl+Shift+S',
        run: handleSaveAll,
      },
      { id: 'task.run', label: 'Run Dev Server', category: 'Run', keywords: ['start', 'serve', 'vite', 'npm run dev'], run: handleRun },
      { id: 'task.build', label: 'Build Project', category: 'Run', keywords: ['compile', 'bundle', 'vite build', 'npm run build'], run: handleBuild },
      { id: 'task.typecheck', label: 'Type Check', category: 'Run', keywords: ['tsc', 'typescript', 'types', 'npm run typecheck'], run: handleTypecheck },
      { id: 'task.lint', label: 'Lint Code', category: 'Run', keywords: ['eslint', 'lint', 'style', 'npm run lint'], run: handleLint },
      { id: 'task.test', label: 'Run Tests', category: 'Run', keywords: ['vitest', 'jest', 'unit', 'npm test', 'npm run test'], run: handleTest },
      {
        id: 'ai.dev.runGoldenTasksMock',
        label: 'AI (Dev) → Run Golden Tasks (Mock Provider)',
        category: 'AI',
        keywords: ['golden', 'tasks', 'test', 'mock', 'dev'],
        run: async () => {
          try {

            notify('success', 'Golden tasks finished. See console table.');
          } catch {
            notify('error', 'Golden tasks failed.');
          }
        },
      },
      {
        id: 'ai.plan.dryRunLast',
        label: 'AI → Dry-Run Last File Plan',
        category: 'AI',
        keywords: ['dry run', 'preview', 'plan', 'diff', 'check'],
        shortcut: 'Alt+Shift+D',
        run: async () => {
          try {
            const plan = getLastPlan?.();
            if (!plan) {
              notify('info', 'No cached file plan. Ask AI to propose a plan first.');
              return;
            }
            await dryRunPlan(plan);
          } catch {
            notify('error', 'Dry-run failed.');
          }
        },
      },
      {
        id: 'ai.plan.applyLast',
        label: 'AI → Apply Last File Plan',
        category: 'AI',
        keywords: ['apply', 'patch', 'execute', 'plan', 'write'],
        shortcut: 'Alt+Shift+A',
        run: async () => {
          try {
            const plan = getLastPlan?.();
            if (plan) {
              await applyPlan(plan);
              useProblemsStore.getState().clearDiagnosticsForProducer('apply:last', 'AI apply plan');
              return;
            }

            const fe = useFileExplorerStore.getState();
            const ed = useEditorStore.getState();
            const existing = new Set<string>();
            const walk = (nodes: any[]) => { for (const n of nodes) { if (n.type === 'file') existing.add(n.path); if (n.children) walk(n.children); } };
            walk(fe.files);
            const projectId = getActiveProjectId();
            const thread: any = await (loadThread as unknown as (id: string) => any)(projectId as any);
            const lastAi = [...thread.messages].reverse().find(m => m.role === 'assistant' && (m.content?.trim()?.length || 0) > 0);
            if (!lastAi) {
              notify('info', 'No cached file plan or assistant message to parse.');
              return;
            }

            const lastMode = (lastAi as any)?.mode as ('beginner'|'pro'|undefined);
            const planBuilt = buildApplyPlan({
              rawAssistantText: lastAi.content,
              selectedLanguageId: 'typescript',
              mode: (lastMode as any) || ('beginner' as const),
              defaultDir: 'src',
              existingPaths: existing,
            });
            const api = {
              fileExists: (path: string) => !!fe.getFileByPath(path),
              readFile: (path: string) => fe.getFileByPath(path)?.content ?? null,
              createFile: (path: string, content: string, monacoLang: string) => {
                const name = path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path;
                const fileNode = {
                  id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name,
                  type: 'file' as const,
                  path,
                  content,
                  language: monacoLang,
                  lastModified: new Date(),
                  size: content.length,
                };
                const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '/';
                useFileExplorerStore.getState().addFile(fileNode as any, parent || '/');
                useEditorStore.getState().openTab(fileNode as any, { origin: 'ai-plan' });
              },
              replaceFile: (path: string, content: string, monacoLang: string) => {
                const node = fe.getFileByPath(path);
                if (!node) return;
                useFileExplorerStore.getState().updateFile(node.id, { content, language: monacoLang });
                const tab = ed.tabs.find(t => t.path === path);
                if (tab) {
                  useEditorStore.getState().updateTabContent(tab.id, content);
                }
              },
              insertIntoActive: (content: string, monacoLang: string) => {


                void editorInsertIntoActive({ code: content, language: monacoLang as any });
              },
              setActiveTab: (path: string) => {
                const tab = ed.tabs.find(t => t.path === path);
                if (tab) useEditorStore.getState().setActiveTab(tab.id);
              },
              pushUndoSnapshot: (path: string, prevContent: string) => {
                const tab = ed.tabs.find(t => t.path === path);
                const tabId = tab?.id ?? ed.activeTabId;
                if (!tabId) return;
                const cursor = tab?.cursorPosition || { line: 1, column: 1 };
                useEditorStore.getState().addToHistory(tabId, prevContent, cursor);
              },
            } as any;
            executeApplyPlan(planBuilt, api, { preferInsertIntoActive: ((lastMode as any) || 'beginner') === 'beginner', focusEditorAfter: true });
            useProblemsStore.getState().clearDiagnosticsForProducer('apply:last', 'AI apply plan');
            notify('success', 'Applied plan from last assistant message.');
          } catch (err) {
            recordApplyPlanErrorDiagnostic(err);
            notify('error', 'Apply failed.');
          }
        },
      },
  {
        id: 'ai.refreshProjectBrief',
        label: 'AI → Refresh Project Brief',
        category: 'AI',
        keywords: ['brief', 'context', 'summary', 'project', 'refresh'],
        shortcut: 'Alt+Shift+B',
        run: async () => {
          try {
            const fe = useFileExplorerStore.getState();
            const ed = useEditorStore.getState();
            const listFiles = async () => {

              const out: string[] = [];
              const walk = (nodes: any[]) => {
                for (const n of nodes) {
                  if (n.type === 'file') out.push(n.path);
                  if (n.children) walk(n.children);
                }
              };
              walk(fe.files);
              return out;
            };
            const getFileText = async (path: string) => fe.getFileByPath(path)?.content ?? null;
            const getActiveFile = () => {
              const id = ed.activeTabId;
              if (!id) return null;
              const tab = ed.tabs.find(t => t.id === id);
              return tab ? { path: tab.path, content: tab.content } : null;
            };
            const getRecentEdited = () => {
              try {
                const pairs = Object.entries(ed.history);
                const scored: Array<{ path: string; ts: number }> = [];
                for (const [tabId, h] of pairs) {
                  const tab = ed.tabs.find(t => t.id === tabId);
                  if (!tab) continue;
                  const last = h.undo.length ? h.undo[h.undo.length - 1] : null;
                  const tsVal = last?.timestamp as unknown as (Date | string | number | undefined);
                  const ts = tsVal ? new Date(tsVal as any).getTime() : 0;
                  scored.push({ path: tab.path, ts });
                }
                scored.sort((a, b) => b.ts - a.ts);
                const seen = new Set<string>();
                const out: string[] = [];
                for (const s of scored) {
                  if (!seen.has(s.path)) {
                    seen.add(s.path);
                    out.push(s.path);
                  }
                }
                return out;
              } catch {
                return [] as string[];
              }
            };
            await (refreshProjectBrief as unknown as (opts: any) => Promise<void> | void)({ listFiles, getFileText, getActiveFile, getRecentEdited });
  recordTelemetry({ type: 'code/insert', bytes: 0 });
 if (telemetryVerbose()) console.warn(' Project Brief pinned to context.');
          } catch (e) {
            console.warn('Refresh Project Brief failed', e);
          }
        },
      },
    ]);
  }, [handleSaveAll, handleRun, handleBuild, handleTypecheck, handleLint, handleTest]);


  useEffect(() => {
    type RunSel = (action: 'improve' | 'explain' | 'commentize') => void;
    const runSel: RunSel = action => {
      try {
        (window as unknown as { synapseRunAiOnSelection?: RunSel }).synapseRunAiOnSelection?.(action);
      } catch (e) {
        console.warn('AI selection action failed', e);
      }
    };
    registerCommands([
      { id: 'ai.improveSelection', label: 'AI: Improve Selection', category: 'AI', keywords: ['refactor', 'rewrite', 'enhance', 'selection'], shortcut: 'Ctrl+Alt+I', run: () => runSel('improve') },
      { id: 'ai.explainSelection', label: 'AI: Explain Selection', category: 'AI', keywords: ['describe', 'document', 'understand', 'selection'], shortcut: 'Ctrl+Alt+E', run: () => runSel('explain') },
      { id: 'ai.addBeginnerComments', label: 'AI: Add Beginner Comments', category: 'AI', keywords: ['annotate', 'comment', 'document', 'beginner', 'selection'], shortcut: 'Ctrl+Alt+C', run: () => runSel('commentize') },
    ]);
  }, []);


  const handleClearWorkspace = () => {
    if (confirm('Tüm dosyalar ve açık sekmeler temizlenecek. Devam etmek istiyor musunuz?')) {
      clearFiles();
      closeAllTabs();
    }
  };


  const handleOpenProject = async () => {
    try {

      if ('showDirectoryPicker' in window) {
        const directoryHandle = await (window as any).showDirectoryPicker({
          mode: 'read',
        });

        await loadDirectoryContents(directoryHandle, '/');
      } else {

        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;

        input.onchange = async event => {
          const files = (event.target as HTMLInputElement).files;
          if (files) {
            await loadFilesFromInput(files);
          }
        };

        input.click();
      }
    } catch (error) {
      console.error('Error opening project:', error);

      alert('Error opening project. Please try again or check browser permissions.');
    }
  };


  const loadDirectoryContents = async (dirHandle: any, basePath: string) => {
    try {

      if (basePath === '/') {
        clearFiles();
      }

      for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = basePath === '/' ? `/${name}` : `${basePath}/${name}`;

        if (handle.kind === 'file') {

          const file = await handle.getFile();
          const language = getLanguageFromExtension(name);
          const content = await file.text();

          const fileData = {
            id: `file-${Date.now()}-${Math.random()}`,
            name,
            type: 'file' as const,
            path: fullPath,
            content,
            language,
            lastModified: new Date(file.lastModified),
            size: file.size,
          };

          addFileNode(fileData);
        } else if (handle.kind === 'directory') {

          const folderData = {
            id: `folder-${Date.now()}-${Math.random()}`,
            name,
            type: 'folder' as const,
            path: fullPath,
            content: '',
            language: '',
            lastModified: new Date(),
            size: 0,
          };

          addFileNode(folderData);


          await loadDirectoryContents(handle, fullPath);
        }
      }
    } catch (error) {
      console.error('Error loading directory contents:', error);
    }
  };


  const loadFilesFromInput = async (files: FileList) => {
    try {

      clearFiles();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const language = getLanguageFromExtension(file.name);
        const content = await file.text();

        const fileData = {
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          type: 'file' as const,
          path: `/${file.webkitRelativePath || file.name}`,
          content,
          language,
          lastModified: new Date(file.lastModified),
          size: file.size,
        };

  addFileNode(fileData);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };


  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell',
      bash: 'shell',
      zsh: 'shell',
      ps1: 'powershell',
      dockerfile: 'dockerfile',
      vue: 'vue',
      svelte: 'svelte',
      r: 'r',
      matlab: 'matlab',
      m: 'matlab',
    };

    return languageMap[ext || ''] || 'plaintext';
  };


  const LANGUAGE_EXT_MAP: Record<string, string> = {
    react: '.tsx',
    javascript: '.js',
    typescript: '.ts',
    jsx: '.jsx',
    tsx: '.tsx',
    html: '.html',
    css: '.css',
    scss: '.scss',
    vue: '.vue',
    svelte: '.svelte',
    angular: '.ts',
    python: '.py',
    java: '.java',
    csharp: '.cs',
    cpp: '.cpp',
    c: '.c',
    go: '.go',
    rust: '.rs',
    php: '.php',
    ruby: '.rb',
    kotlin: '.kt',
    scala: '.scala',
    nodejs: '.js',
    json: '.json',
    yaml: '.yml',
    toml: '.toml',
    ini: '.ini',
    xml: '.xml',
    markdown: '.md',
    sql: '.sql',
    bash: '.sh',
    powershell: '.ps1',
    dockerfile: '.dockerfile',
    terraform: '.tf',
    haskell: '.hs',
    erlang: '.erl',
    elixir: '.ex',
    clojure: '.clj',
    assembly: '.asm',
    plain: '.txt',
    plaintext: '.txt',
  };

  const ensureExtension = (name: string, language?: string): string => {
    const ext = language ? LANGUAGE_EXT_MAP[language] || '' : '';
    if (!ext) return name;

    return name.replace(/\.[^/.]+$/, '') + ext;
  };


  return (
    <>
    <IdeThemeScope enabled>
      {isLoading ? (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-primary)',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2>Loading Enhanced IDE...</h2>
            <p style={{ opacity: 0.7, marginTop: '10px' }}>Initializing state management...</p>
          </div>
        </div>
  ) : (
  <>
  <style>
        {`
          @keyframes synapseGradientShift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          @keyframes synapseGlitch {
            0%, 90%, 100% {
              transform: translate(0px, 0px) skew(0deg);
              filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.15));
            }
            91% {
              transform: translate(-2px, 0px) skew(-1deg);
              filter: drop-shadow(0 3px 10px rgba(55, 148, 255, 0.3))
                      drop-shadow(2px 0px 0px rgba(255, 0, 100, 0.4))
                      drop-shadow(-2px 0px 0px rgba(0, 255, 255, 0.4));
            }
            92% {
              transform: translate(2px, 1px) skew(1deg);
              filter: drop-shadow(0 3px 10px rgba(55, 148, 255, 0.3))
                      drop-shadow(2px 0px 0px rgba(255, 0, 100, 0.4))
                      drop-shadow(-2px 0px 0px rgba(0, 255, 255, 0.4));
            }
            93% {
              transform: translate(-1px, -1px) skew(-0.5deg);
              filter: drop-shadow(0 3px 10px rgba(55, 148, 255, 0.3))
                      drop-shadow(1px 0px 0px rgba(255, 0, 100, 0.6))
                      drop-shadow(-1px 0px 0px rgba(0, 255, 255, 0.6));
            }
            94% {
              transform: translate(1px, 0px) skew(0.5deg);
              filter: drop-shadow(0 3px 10px rgba(55, 148, 255, 0.3))
                      drop-shadow(1px 0px 0px rgba(255, 0, 100, 0.4))
                      drop-shadow(-1px 0px 0px rgba(0, 255, 255, 0.4));
            }
            95% {
              transform: translate(0px, 0px) skew(0deg);
              filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.15));
            }
          }


          @keyframes unifiedGoldFlow { 0%{background-position:0% 0%;} 50%{background-position:100% 0%;} 100%{background-position:0% 0%;} }
          @keyframes unifiedGoldPulse { 0%,100%{opacity:1; filter:brightness(1);} 40%{opacity:.9; filter:brightness(1.08);} 60%{opacity:.95; filter:brightness(1.12);} }
          @keyframes unifiedGoldGlimmer { 0%{opacity:.45; transform:translateX(-4%);} 30%{opacity:.85;} 55%{opacity:.5;} 70%{opacity:.8;} 100%{opacity:.45; transform:translateX(4%);} }
          /* data-attribute name retained for compatibility; colors redirected to VS Code blue chrome accent. */
          [data-global-gold-bar]{position:fixed;top:0;left:0;right:0;height:2px;z-index:999999;pointer-events:none;}
          [data-global-gold-bar]::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,#1A1A1A 0%,#2A2A2A 12%,#3794ff 28%,#5aa9ff 44%,#5aa9ff 60%,#2c7fd9 76%,#2A2A2A 88%,#1A1A1A 100%);background-size:280% 100%;animation:unifiedGoldFlow 7s linear infinite, unifiedGoldPulse 5s ease-in-out infinite;box-shadow:var(--shadow-glow), var(--syn-glow-subtle);}
          [data-global-gold-bar]::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 50%,rgba(90,169,255,0.50),rgba(90,169,255,0) 55%),radial-gradient(circle at 68% 50%,rgba(55,148,255,0.40),rgba(55,148,255,0) 60%),linear-gradient(90deg,rgba(255,255,255,0.18),rgba(255,255,255,0) 35%,rgba(255,255,255,0.28) 50%,rgba(255,255,255,0) 65%,rgba(255,255,255,0.18));mix-blend-mode:screen;filter:blur(2.5px) brightness(1.15);animation: unifiedGoldGlimmer 9s cubic-bezier(.55,.1,.45,.9) infinite;}
          @media (prefers-reduced-motion:reduce){[data-global-gold-bar]::before,[data-global-gold-bar]::after{animation:none!important;background-position:0 0;}}
        `}
      </style>
    <div
        className="theme-ide-pro synapse-ide-scope synapse-ide-shell"
        data-layout-contract="tri-modal-ide-shell-v1"
        data-active-activity={activeActivityItem}
        data-bottom-panel={bottomPanelVisible ? bottomPanel.activeTab : 'hidden'}
        data-beginner-assistant-enabled={BEGINNER_ASSISTANT_ENABLED}
        style={{
          ...shellVars,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
      background: 'var(--color-bg-primary)',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div data-global-gold-bar aria-hidden="true" />
        {(() => {

          return (
            <Header
              aiAssistantRightGutter={rightDockWidth}
              onNewFile={handleNewFile}
              onClearAll={handleClearWorkspace}
              onToggleSidebar={toggleSidebar}
              onToggleTerminal={toggleTerminal}
              onToggleAI={toggleAiChat}
              onOpenAnalytics={() => useUrbanStore.getState().open()}
              aiActive={layout.aiChatVisible}
              sidebarActive={!layout.sidebarCollapsed}
              terminalActive={layout.terminalVisible}
              tabs={headerTabs}
              activeTabId={activeTabId}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onReorder={handleReorderTabs}
              onOpenCommandPalette={handleOpenCommandPalette}
              onGlobalSearch={handleGlobalSearch}
              onCloseOthers={id => closeOtherTabs(id)}
              onCloseRight={id => closeTabsToRight(id)}
              onTogglePin={id => {
                const t = tabs.find(x => x.id === id);
                if (!t) return;
                (t.isPinned ? unpinTab : pinTab)(id);
              }}
              dirtyCount={dirtyTabs.length}
              onSaveAll={handleSaveAll}
              onRun={handleRun}
              onBuild={handleBuild}
            />
          );
        })()}

        {}
        <div
          className="synapse-ide-shell__workspace"
          data-region="workspace"
          style={{
            ...shellVars,
          }}
        >
          <div className="synapse-ide-shell__left-zone" data-region="left-rail">
            <ActivityRail
              active={railActivityItem}
              badges={activityBadges}
              onSelect={handleActivitySelect}
            />
            {!layout.sidebarCollapsed && (
              <div className="synapse-ide-shell__sidebar-stack" data-region="left-panel">
                <div className="synapse-ide-shell__sidebar-panel" data-region={`${railActivityItem}-panel`}>
                  {railActivityItem === 'explorer' ? (
                    <FileExplorer sidebarWidth={layout.sidebarWidth} />
                  ) : railActivityItem === 'outline' ? (
                    <OutlinePane
                      tabId={activeTab?.id ?? null}
                      {...(activeTab?.name ? { fileName: activeTab.name } : {})}
                      onJumpToSymbol={handleJumpToOutlineSymbol}
                    />
                  ) : railActivityItem === 'search' ? (
                    <InlineSearchPane />
                  ) : (
                    <ShellPlaceholderPane
                      pane={railActivityItem}
                      onOpenUrban={handleOpenUrbanBridge}
                    />
                  )}
                </div>
                <div
                className="synapse-ide-shell__resizer"
                data-region="sidebar-resizer"
                onMouseDown={e => {
                  const startX = e.clientX;
                  const startWidth = layout.sidebarWidth;
                  setSidebarPreviewWidth(startWidth);
                  const onMove = (mv: MouseEvent) => {
                    const delta = mv.clientX - startX;
                    let newW = startWidth + delta;

                    newW = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, newW));

                    const available = window.innerWidth - rightDockWidth - IDE_ACTIVITY_RAIL_WIDTH;
                    if (available - newW < MIN_EDITOR_WIDTH) {
                      newW = Math.max(MIN_SIDEBAR, available - MIN_EDITOR_WIDTH);
                    }
                    setSidebarPreviewWidth(newW);
                    useAppStore.getState().setSidebarWidth(newW);
                  };
                  const onUp = () => {
                    setSidebarPreviewWidth(null);
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
                onDoubleClick={() => {
                  useAppStore.getState().setSidebarWidth(DEFAULT_SIDEBAR);
                  setSidebarPreviewWidth(null);
                }}
              >
                {}
                {sidebarPreviewWidth !== null && (
                  <div className="synapse-ide-shell__resize-preview">
                    {Math.round(sidebarPreviewWidth)}px
                  </div>
                )}
                </div>
              </div>
            )}
          </div>

          {}
          <div
            className="synapse-ide-shell__main"
            data-region="primary-work-surface"
            style={{
              ...shellVars,
            }}
          >
            {}
            {layout.shell?.syncStripVisible ? (
              <div
                className="synapse-ide-shell__handoff-strip"
                data-region="handoff-status"
                role="status"
                aria-label="Cross-module handoff status"
              >
                <span className="synapse-ide-shell__handoff-chip" data-state="ready">
                  IDE ready
                </span>
                <span className="synapse-ide-shell__handoff-chip">Map bridge idle</span>
                <span className="synapse-ide-shell__handoff-chip">Urban bridge idle</span>
                <span className="synapse-ide-shell__handoff-chip" data-state="draft">
                  Evidence draft
                </span>
              </div>
            ) : null}

            {}
            {activeTab ? (
              <div
                id="synapse-editor-region"
                className="synapse-ide-shell__editor-region"
                data-region="editor"
                style={{
                  ...shellVars,
                }}
              >
                {activeTab.isMissingFile ? (
                  <div className="synapse-ide-shell__restore-warning" role="status">
                    <strong>Missing file reference</strong>
                    <span>{activeTab.restoreMessage || `The restored tab "${activeTab.path}" no longer resolves in the file tree.`}</span>
                  </div>
                ) : null}
                <Suspense
                  fallback={<div style={{ padding: 8, color: '#888' }}>Loading editor…</div>}
                >
                  <MonacoEditor
                    tabId={activeTab.id}
                    content={activeTab.content}
                    language={activeTab.language}
                    onChange={() => {

                    }}
                  />
                </Suspense>
              </div>
            ) : (
              <div
                id="synapse-editor-region"
                className="synapse-ide-shell__editor-region"
                data-region="empty-editor"
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--syn-surface-editor)',
                }}
              >
                {}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    zIndex: 10,
                    position: 'relative',
                  }}
                >
                  {}
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {}
                      <div
                        style={{
                          color: '#292d33',
                          opacity: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          viewBox="0 0 48 48"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          width="205"
                          height="205"
                        >
                          {}
                          <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
                          <circle cx="36" cy="12" r="4" fill="currentColor" opacity="0.9" />
                          <circle cx="12" cy="36" r="4" fill="currentColor" opacity="0.9" />
                          <circle cx="36" cy="36" r="4" fill="currentColor" opacity="0.9" />
                          <circle cx="24" cy="24" r="5" fill="currentColor" />

                          {}
                          <path
                            d="M16 14L20 22"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity="0.8"
                          />
                          <path
                            d="M32 14L28 22"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity="0.8"
                          />
                          <path
                            d="M16 34L20 26"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity="0.8"
                          />
                          <path
                            d="M32 34L28 26"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity="0.8"
                          />
                          <path
                            d="M16 16L32 32"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            opacity="0.4"
                          />
                          <path
                            d="M32 16L16 32"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            opacity="0.4"
                          />

                          {}
                          <circle
                            cx="24"
                            cy="24"
                            r="12"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.3"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            fill="none"
                            opacity="0.2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {}
                  <div
                    style={{
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      maxWidth: '420px',
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '26px',
                        fontWeight: 300,
                        fontFamily: 'inherit',
                        color: 'var(--syn-text-default)',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.3,
                      }}
                    >
                      Synapse
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--syn-text-secondary)',
                        fontWeight: 400,
                        lineHeight: 1.6,
                      }}
                    >
                      Intelligent coding workspace
                      <br />
                      <span
                        style={{
                          color: 'var(--syn-text-muted)',
                          fontSize: '12px',
                        }}
                      >
                        Create a new file or open an existing project to start coding
                      </span>
                    </p>
                  </div>

                  {}
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                    }}
                  >
                    {}
                    <button
                      onClick={handleNewFile}
                      style={{
                        background: 'var(--syn-interaction-active)',
                        border: '1px solid var(--syn-interaction-active)',
                        color: 'var(--syn-text-inverse)',
                        padding: '6px 16px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s ease',
                        letterSpacing: 0,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'color-mix(in srgb, var(--syn-interaction-active) 88%, white)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--syn-interaction-active)';
                      }}
                    >
                      <Plus size={14} strokeWidth={2} />
                      Create New File
                    </button>

                    {}
                    <button
                      onClick={handleOpenProject}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--syn-border-subtle)',
                        color: 'var(--syn-text-default)',
                        padding: '6px 14px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--syn-surface-hover)';
                        e.currentTarget.style.borderColor = 'var(--syn-border-default)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--syn-border-subtle)';
                      }}
                    >
                      <Folder size={14} />
                      Open Project
                    </button>
                  </div>

                  {}
                  <div
                    style={{
                      display: 'flex',
                      gap: '24px',
                      marginTop: '16px',
                      opacity: 0.6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--syn-text-muted)',
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--syn-surface-elevated)',
                          border: '1px solid var(--syn-border-subtle)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--syn-text-secondary)',
                        }}
                      >
                        Ctrl+N
                      </span>
                      New File
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--syn-text-muted)',
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--syn-surface-elevated)',
                          border: '1px solid var(--syn-border-subtle)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--syn-text-secondary)',
                        }}
                      >
                        Ctrl+O
                      </span>
                      Open File
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom panel host — Prompt 14 */}
        {bottomPanelVisible ? (
          <BottomPanel
            activeTab={bottomPanel.activeTab}
            height={bottomPanelHeight}
            problemBadgeCount={problemBadgeCount}
            shellVars={shellVars}
            onTabChange={setBottomPanelTab}
            onClose={() => setBottomPanelCollapsed(true)}
            onHeightChange={setBottomPanelHeight}
            onOpenDiagnostic={handleOpenDiagnostic}
            onTerminalClose={toggleTerminal}
          />
        ) : null}

        {/* Prompt 21 Dev Demo — sağ alt köşe, production'da kaldır */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 9999 }}>
            <IdeMapHandoffDemo />
          </div>
        )}

        {}
        <CommandPalette
          isOpen={isCmdOpen}
          onClose={() => setCmdOpen(false)}
        />

        {}
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />

  {}
  {layout.aiChatVisible ? <div
            className="synapse-ide-shell__right-dock ai-assistant-container"
            data-region="right-dock"
            data-active-panel="ai"
            style={{
              ...shellVars,
              position: 'fixed',
              right: 0,
              top: 0,

              bottom: IDE_STATUS_BAR_HEIGHT,
              height: 'auto',
              maxHeight: 'none',
              width: aiAssistantWidth,

              zIndex: 9998,

              paddingBottom: 0,
              transition: 'var(--syn-transition-slow)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              paddingTop: 0,
              paddingRight: 0,
              pointerEvents: 'auto',
              isolation: 'isolate',
            }}
            data-component="ai-assistant"
            data-testid="assistant-container"
          >
            {}
            <div
              onMouseDown={e => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = aiAssistantWidth;
                const onMove = (mv: MouseEvent) => {
                  const delta = startX - mv.clientX;
                  let newW = startWidth + delta;

                  newW = Math.max(320, Math.min(900, newW));

                  const available = window.innerWidth - leftDockWidth;
                  const MIN_EDITOR = 560;
                  if (available - newW < MIN_EDITOR) {
                    newW = Math.max(320, available - MIN_EDITOR);
                  }
                  setAiAssistantWidth(newW);
                  try {
                    useAppStore.getState().setAiAssistantWidth(newW);
                  } catch {}
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              style={{
                position: 'absolute',
                left: -2,
                top: 0,
                bottom: 0,
                width: 6,
                cursor: 'col-resize',
                background: 'transparent',
                borderLeft: '1px solid var(--syn-border-subtle)',
                borderRight: 'none',
                backdropFilter: 'none',
                boxShadow: 'none',
                transition: 'background 0.18s ease',
                zIndex: 10040,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background =
                  'color-mix(in srgb, var(--syn-interaction-active) 18%, transparent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            />
            {}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <AiAssistant width={aiAssistantWidth} />
            </div>
          </div> : null}

        {}
        {flags.synapseCoreAI && !layout.aiChatVisible ? (
          <div
            className="synapse-ide-shell__right-dock"
            data-region="right-dock"
            data-active-panel="ai-core"
            style={{
              ...shellVars,
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: IDE_STATUS_BAR_HEIGHT,
              width: FALLBACK_AI_DOCK_WIDTH,
              zIndex: 1000,
              display: 'flex',
            }}
          >
            <SynapseCoreAIPanel />
          </div>
        ) : null}
        {}
        <NewFileModal
          isOpen={showNewFileModal}
          onClose={() => setShowNewFileModal(false)}
          onCreateFile={(language?: string, templateContent?: string, fileName?: string) => {
            try {
              if (!fileName) return;
              const finalName = ensureExtension(fileName, language);
              const id = `file-${Date.now()}`;
              const path = `/${finalName}`;
              const content = templateContent || '';
              const lang = language || 'plaintext';

              addFileNode({
                id,
                name: finalName,
                type: 'file',
                path,
                content,
                language: lang,
                lastModified: new Date(),
                size: content.length,
              });

              openTab({
                id,
                name: finalName,
                content,
                language: lang,
                isDirty: false,
                type: 'file',
                path,
                lastModified: new Date(),
              });

              setActiveTab(id);
            } catch (e) {
              console.error('New file creation failed:', e);
            } finally {
              setShowNewFileModal(false);
            }
          }}
          sidebarWidth={layout.sidebarWidth}
        />
  </div>
  </>
  )}
  </IdeThemeScope>
      {pendingCloseTab != null ? (
        <UnsavedChangesDialog
          fileName={pendingCloseTab.name}
          onSave={handleUnsavedSave}
          onDiscard={handleUnsavedDiscard}
          onCancel={handleUnsavedCancel}
        />
      ) : null}
    </>
  );
};
