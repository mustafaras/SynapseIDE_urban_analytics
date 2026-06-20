
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// ---------------------------------------------------------------------------
// Welcome / empty-editor screen — premium animated intro
// ---------------------------------------------------------------------------
const SYN_WELCOME_CSS = `
.syn-welcome {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 80% 60% at 50% 38%, color-mix(in srgb, var(--syn-interaction-active) 9%, transparent) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 95%, color-mix(in srgb, var(--syn-interaction-selected) 5%, transparent) 0%, transparent 60%),
    var(--syn-surface-editor);
  isolation: isolate;
}

/* Ambient SVG layer */
.syn-welcome__ambient {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.85;
  animation: syn-welcome-fade-in 1.2s cubic-bezier(.16, 1, .3, 1) both;
}

/* Faint grid floor */
.syn-welcome__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--syn-interaction-active) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--syn-interaction-active) 4%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, #000 30%, transparent 90%);
  -webkit-mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, #000 30%, transparent 90%);
  opacity: 0.55;
  animation: syn-welcome-grid-drift 30s linear infinite;
}

@keyframes syn-welcome-grid-drift {
  from { background-position: 0 0, 0 0; }
  to   { background-position: 56px 0, 0 56px; }
}

/* Center stage */
.syn-welcome__stage {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26px;
  padding: 32px 24px;
  max-width: 560px;
}
.syn-welcome__stage > * {
  animation: syn-welcome-stage-in 600ms cubic-bezier(.16, 1, .3, 1) both;
}
.syn-welcome__stage > *:nth-child(1) { animation-delay: 60ms; }
.syn-welcome__stage > *:nth-child(2) { animation-delay: 220ms; }
.syn-welcome__stage > *:nth-child(3) { animation-delay: 360ms; }
.syn-welcome__stage > *:nth-child(4) { animation-delay: 480ms; }

@keyframes syn-welcome-stage-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes syn-welcome-fade-in {
  from { opacity: 0; }
  to   { opacity: 0.85; }
}

/* Logo cluster */
.syn-welcome__logoWrap {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.syn-welcome__logo {
  position: relative;
  z-index: 3;
  width: 180px;
  height: 180px;
  filter: drop-shadow(0 0 24px color-mix(in srgb, var(--syn-interaction-active) 32%, transparent));
}

/* Pulsing nodes — staggered */
.syn-welcome__node {
  transform-origin: center;
  transform-box: fill-box;
  animation: syn-welcome-node-pulse 2.6s ease-in-out infinite;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--syn-interaction-active) 60%, transparent));
}
.syn-welcome__node--nw { animation-delay: 0ms;    }
.syn-welcome__node--ne { animation-delay: 650ms;  }
.syn-welcome__node--se { animation-delay: 1300ms; }
.syn-welcome__node--sw { animation-delay: 1950ms; }
@keyframes syn-welcome-node-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.18); }
}

/* Core pulse */
.syn-welcome__core {
  transform-origin: center;
  transform-box: fill-box;
  animation: syn-welcome-core-pulse 2.4s ease-in-out infinite;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--syn-interaction-selected) 65%, transparent));
}
@keyframes syn-welcome-core-pulse {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%      { transform: scale(1.12); opacity: 0.92; }
}

/* Spokes flicker */
.syn-welcome__spokes {
  animation: syn-welcome-spoke-flicker 3.6s ease-in-out infinite;
}
@keyframes syn-welcome-spoke-flicker {
  0%, 100% { opacity: 1;    }
  45%      { opacity: 0.75; }
  55%      { opacity: 0.95; }
}

/* Ring rotations on outer rings */
.syn-welcome__ring {
  transform-origin: 24px 24px;
}
.syn-welcome__ring--inner { animation: syn-welcome-ring-spin 22s linear infinite; }
.syn-welcome__ring--outer { animation: syn-welcome-ring-spin 36s linear infinite reverse; }
@keyframes syn-welcome-ring-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Decorative orbits around the logo */
.syn-welcome__orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid color-mix(in srgb, var(--syn-interaction-active) 22%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.syn-welcome__orbit::after {
  content: "";
  position: absolute;
  top: -3px;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--syn-interaction-active);
  box-shadow: 0 0 12px color-mix(in srgb, var(--syn-interaction-active) 80%, transparent);
  transform: translateX(-50%);
}
.syn-welcome__orbit--md {
  width: 200px;
  height: 200px;
  border-style: dashed;
  border-color: color-mix(in srgb, var(--syn-interaction-active) 14%, transparent);
  animation: syn-welcome-orbit-spin 14s linear infinite;
}
.syn-welcome__orbit--lg {
  width: 240px;
  height: 240px;
  animation: syn-welcome-orbit-spin 26s linear infinite reverse;
}
@keyframes syn-welcome-orbit-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Outer halo behind the logo */
.syn-welcome__halo {
  position: absolute;
  inset: -30px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--syn-interaction-active) 18%, transparent) 0%, transparent 65%);
  filter: blur(8px);
  pointer-events: none;
  animation: syn-welcome-halo-breathe 5s ease-in-out infinite;
  z-index: 0;
}
@keyframes syn-welcome-halo-breathe {
  0%, 100% { opacity: 0.55; transform: scale(1);    }
  50%      { opacity: 0.85; transform: scale(1.04); }
}

/* Copy block */
.syn-welcome__copy {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 460px;
}
.syn-welcome__eyebrow {
  display: inline-flex;
  align-self: center;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: color-mix(in srgb, var(--syn-interaction-active) 85%, var(--syn-text-secondary));
  background: color-mix(in srgb, var(--syn-interaction-active) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--syn-interaction-active) 22%, transparent);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 5%, transparent);
}
.syn-welcome__pulseDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--syn-interaction-active);
  box-shadow: 0 0 8px color-mix(in srgb, var(--syn-interaction-active) 80%, transparent);
  animation: syn-welcome-dot-blink 2s ease-in-out infinite;
}
@keyframes syn-welcome-dot-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.85); }
}
.syn-welcome__title {
  margin: 0;
  font-size: 44px;
  font-weight: 200;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--syn-text-default);
}
.syn-welcome__titleShine {
  background: linear-gradient(
    100deg,
    var(--syn-text-default) 0%,
    var(--syn-text-default) 38%,
    color-mix(in srgb, var(--syn-interaction-selected) 80%, var(--syn-text-default)) 50%,
    var(--syn-text-default) 62%,
    var(--syn-text-default) 100%
  );
  background-size: 300% 100%;
  background-position: 100% 50%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: syn-welcome-shine 4.4s cubic-bezier(.4, 0, .2, 1) infinite;
}
@keyframes syn-welcome-shine {
  0%, 18% { background-position: 100% 50%; }
  72%, 100% { background-position: 0% 50%; }
}
.syn-welcome__lead {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--syn-text-secondary);
  font-weight: 400;
}
.syn-welcome__hint {
  margin: 0;
  font-size: 12px;
  color: var(--syn-text-muted);
}

/* Action buttons */
.syn-welcome__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 4px;
}
.syn-welcome__btn {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  padding: 0;
  border: 1px solid transparent;
  transition:
    background-color 160ms cubic-bezier(.2, .7, .2, 1),
    border-color 160ms cubic-bezier(.2, .7, .2, 1),
    color 160ms cubic-bezier(.2, .7, .2, 1),
    box-shadow 220ms cubic-bezier(.2, .7, .2, 1),
    transform 160ms cubic-bezier(.2, .7, .2, 1);
}
.syn-welcome__btnInner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}
.syn-welcome__btn::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inline-size: 42%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, #ffffff 26%, transparent), transparent);
  opacity: 0;
  transform: translateX(-120%);
  pointer-events: none;
}
.syn-welcome__btn:hover {
  transform: translateY(-1px);
}
.syn-welcome__btn:hover::after {
  opacity: 1;
  animation: syn-welcome-btn-sweep 620ms ease-out both;
}
.syn-welcome__btn:active { transform: translateY(0); }
.syn-welcome__btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px var(--syn-border-focus), 0 0 0 3px color-mix(in srgb, var(--syn-interaction-active) 28%, transparent);
}
@keyframes syn-welcome-btn-sweep {
  from { transform: translateX(-120%); }
  to   { transform: translateX(160%); }
}

.syn-welcome__btn--primary {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--syn-interaction-active) 96%, #ffffff) 0%,
    var(--syn-interaction-active) 100%);
  color: var(--syn-text-inverse, #ffffff);
  border-color: color-mix(in srgb, var(--syn-interaction-active) 80%, #ffffff);
  box-shadow:
    0 1px 0 color-mix(in srgb, #ffffff 14%, transparent) inset,
    0 6px 16px -6px color-mix(in srgb, var(--syn-interaction-active) 60%, transparent),
    0 0 0 1px color-mix(in srgb, var(--syn-interaction-active) 28%, transparent);
}
.syn-welcome__btn--primary:hover {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--syn-interaction-active) 88%, #ffffff) 0%,
    var(--syn-interaction-active) 100%);
  box-shadow:
    0 1px 0 color-mix(in srgb, #ffffff 18%, transparent) inset,
    0 10px 24px -8px color-mix(in srgb, var(--syn-interaction-active) 70%, transparent),
    0 0 0 1px color-mix(in srgb, var(--syn-interaction-active) 40%, transparent),
    0 0 18px color-mix(in srgb, var(--syn-interaction-active) 38%, transparent);
}

.syn-welcome__btn--ghost {
  background: color-mix(in srgb, var(--syn-surface-elevated) 60%, transparent);
  color: var(--syn-text-default);
  border-color: var(--syn-border-subtle);
}
.syn-welcome__btn--ghost:hover {
  background: color-mix(in srgb, var(--syn-interaction-active) 10%, var(--syn-surface-elevated));
  border-color: color-mix(in srgb, var(--syn-interaction-active) 34%, var(--syn-border-subtle));
  color: var(--syn-text-default);
}

/* Shortcuts row */
.syn-welcome__shortcuts {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  padding: 6px 12px;
  background: color-mix(in srgb, var(--syn-surface-elevated) 40%, transparent);
  border: 1px solid var(--syn-border-subtle);
  border-radius: 999px;
  opacity: 0.85;
}
.syn-welcome__shortcut {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--syn-text-muted);
}
.syn-welcome__kbd {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  background: color-mix(in srgb, var(--syn-surface-input) 88%, var(--syn-surface-editor));
  border: 1px solid var(--syn-border-subtle);
  border-bottom-width: 2px;
  border-radius: 3px;
  font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--syn-text-secondary);
  line-height: 1;
}
.syn-welcome__kbdPlus {
  color: var(--syn-text-muted);
  font-size: 10px;
  margin: 0 1px;
}
.syn-welcome__kbdLabel {
  margin-left: 4px;
  color: var(--syn-text-muted);
}
.syn-welcome__shortcutSep {
  color: var(--syn-text-muted);
  opacity: 0.5;
  font-size: 11px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .syn-welcome *,
  .syn-welcome *::before,
  .syn-welcome *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  .syn-welcome__grid { animation: none; }
}
`;

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
  const searchReturnFocusRef = useRef<HTMLElement | null>(null);
  const handleOpenCommandPalette = useCallback(() => setCmdOpen(true), []);
  const handleGlobalSearch = useCallback(() => {
    searchReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSearchOpen(true);
  }, []);
  const handleCloseGlobalSearch = useCallback(() => {
    setSearchOpen(false);
    const target = searchReturnFocusRef.current;
    searchReturnFocusRef.current = null;
    window.setTimeout(() => {
      const focusTarget = target && document.contains(target)
        ? target
        : document.querySelector<HTMLElement>('button[aria-label="Global Search"]');
      if (focusTarget) {
        focusTarget.focus();
      }
    }, 0);
  }, []);
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
          [data-global-gold-bar]{position:fixed;top:0;left:0;right:0;height:2px;z-index:var(--z-system-banner);pointer-events:none;}
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
                className="synapse-ide-shell__editor-region syn-welcome"
                data-region="empty-editor"
              >
                <style>{SYN_WELCOME_CSS}</style>

                {/* Ambient neural network backdrop */}
                <svg className="syn-welcome__ambient" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <defs>
                    <radialGradient id="synWelcomeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="var(--syn-interaction-active)" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="var(--syn-interaction-active)" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="synWelcomeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--syn-interaction-active)" stopOpacity="0.18" />
                      <stop offset="50%" stopColor="var(--syn-interaction-selected)" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="var(--syn-interaction-active)" stopOpacity="0.18" />
                    </linearGradient>
                  </defs>
                  {/* Background radial glow */}
                  <circle cx="700" cy="400" r="380" fill="url(#synWelcomeGlow)" opacity="0.6" />
                  {/* Distant nodes layer */}
                  <g opacity="0.35">
                    <circle cx="160" cy="180" r="2.5" fill="var(--syn-interaction-active)">
                      <animate attributeName="opacity" values="0.2;0.7;0.2" dur="4.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="320" cy="540" r="2" fill="var(--syn-interaction-selected)">
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3.6s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="1180" cy="220" r="2.8" fill="var(--syn-interaction-active)">
                      <animate attributeName="opacity" values="0.25;0.65;0.25" dur="4.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="1080" cy="600" r="2.2" fill="var(--syn-interaction-selected)">
                      <animate attributeName="opacity" values="0.2;0.55;0.2" dur="3.9s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="540" cy="120" r="1.8" fill="var(--syn-interaction-active)">
                      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="900" cy="700" r="2.4" fill="var(--syn-interaction-selected)">
                      <animate attributeName="opacity" values="0.25;0.6;0.25" dur="3.7s" repeatCount="indefinite" />
                    </circle>
                    <line x1="160" y1="180" x2="320" y2="540" stroke="url(#synWelcomeLine)" strokeWidth="0.6">
                      <animate attributeName="opacity" values="0.08;0.35;0.08" dur="6s" repeatCount="indefinite" />
                    </line>
                    <line x1="1180" y1="220" x2="900" y2="700" stroke="url(#synWelcomeLine)" strokeWidth="0.6">
                      <animate attributeName="opacity" values="0.08;0.3;0.08" dur="6.5s" repeatCount="indefinite" />
                    </line>
                    <line x1="540" y1="120" x2="1080" y2="600" stroke="url(#synWelcomeLine)" strokeWidth="0.5">
                      <animate attributeName="opacity" values="0.05;0.28;0.05" dur="7.2s" repeatCount="indefinite" />
                    </line>
                  </g>
                  {/* Mid-distance nodes layer */}
                  <g opacity="0.55">
                    <circle cx="380" cy="280" r="2" fill="var(--syn-interaction-active)">
                      <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="1020" cy="320" r="2.2" fill="var(--syn-interaction-selected)">
                      <animate attributeName="opacity" values="0.45;0.95;0.45" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="280" cy="440" r="1.8" fill="var(--syn-interaction-active)">
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.9s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="1120" cy="460" r="2.1" fill="var(--syn-interaction-selected)">
                      <animate attributeName="opacity" values="0.4;0.85;0.4" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </svg>

                {/* Subtle grid floor */}
                <div className="syn-welcome__grid" aria-hidden="true" />

                {/* Center stack */}
                <div className="syn-welcome__stage">

                  {/* Animated logo cluster */}
                  <div className="syn-welcome__logoWrap" aria-hidden="true">
                    {/* Outer orbits */}
                    <div className="syn-welcome__orbit syn-welcome__orbit--lg" />
                    <div className="syn-welcome__orbit syn-welcome__orbit--md" />
                    {/* Logo SVG with per-node animations */}
                    <svg
                      className="syn-welcome__logo"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <radialGradient id="synWelcomeCoreGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="var(--syn-interaction-selected)" stopOpacity="1" />
                          <stop offset="100%" stopColor="var(--syn-interaction-active)" stopOpacity="0.7" />
                        </radialGradient>
                        <linearGradient id="synWelcomeEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--syn-interaction-active)" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="var(--syn-interaction-selected)" stopOpacity="0.6" />
                        </linearGradient>
                      </defs>

                      {/* Spokes (slightly pulsing) */}
                      <g className="syn-welcome__spokes" stroke="url(#synWelcomeEdge)" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M16 14L20 22" opacity="0.85" />
                        <path d="M32 14L28 22" opacity="0.85" />
                        <path d="M16 34L20 26" opacity="0.85" />
                        <path d="M32 34L28 26" opacity="0.85" />
                      </g>

                      {/* Diagonal cross strokes */}
                      <g stroke="var(--syn-interaction-active)" strokeWidth="1.4" strokeLinecap="round" opacity="0.35">
                        <path d="M16 16L32 32" />
                        <path d="M32 16L16 32" />
                      </g>

                      {/* Outer concentric rings */}
                      <circle cx="24" cy="24" r="12" stroke="var(--syn-interaction-active)" strokeWidth="0.9" fill="none" opacity="0.35" className="syn-welcome__ring syn-welcome__ring--inner" />
                      <circle cx="24" cy="24" r="18" stroke="var(--syn-interaction-active)" strokeWidth="0.5" fill="none" opacity="0.22" className="syn-welcome__ring syn-welcome__ring--outer" />

                      {/* Corner nodes (staggered pulse) */}
                      <circle className="syn-welcome__node syn-welcome__node--nw" cx="12" cy="12" r="3.6" fill="var(--syn-interaction-active)" />
                      <circle className="syn-welcome__node syn-welcome__node--ne" cx="36" cy="12" r="3.6" fill="var(--syn-interaction-active)" />
                      <circle className="syn-welcome__node syn-welcome__node--sw" cx="12" cy="36" r="3.6" fill="var(--syn-interaction-active)" />
                      <circle className="syn-welcome__node syn-welcome__node--se" cx="36" cy="36" r="3.6" fill="var(--syn-interaction-active)" />

                      {/* Core */}
                      <circle className="syn-welcome__core" cx="24" cy="24" r="5" fill="url(#synWelcomeCoreGrad)" />
                      <circle cx="24" cy="24" r="5" fill="none" stroke="var(--syn-interaction-selected)" strokeWidth="0.6" opacity="0.8">
                        <animate attributeName="r" values="5;7.5;5" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                    </svg>

                    {/* Outer accent halo */}
                    <div className="syn-welcome__halo" />
                  </div>

                  {/* Headline */}
                  <div className="syn-welcome__copy">
                    <div className="syn-welcome__eyebrow">
                      <span className="syn-welcome__pulseDot" /> AI-ASSISTED · INTELLIGENT WORKSPACE
                    </div>
                    <h2 className="syn-welcome__title">
                      <span className="syn-welcome__titleShine">Synapse_IDE</span>
                    </h2>
                    <p className="syn-welcome__lead">
                      A premium coding workspace with embedded AI, spatial intelligence, and live collaboration.
                    </p>
                    <p className="syn-welcome__hint">
                      Create a new file or open an existing project to start coding.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="syn-welcome__actions">
                    <button
                      type="button"
                      onClick={handleNewFile}
                      className="syn-welcome__btn syn-welcome__btn--primary"
                    >
                      <span className="syn-welcome__btnInner">
                        <Plus size={14} strokeWidth={2.5} />
                        Create New File
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenProject}
                      className="syn-welcome__btn syn-welcome__btn--ghost"
                    >
                      <span className="syn-welcome__btnInner">
                        <Folder size={14} />
                        Open Project
                      </span>
                    </button>
                  </div>

                  {/* Shortcut row */}
                  <div className="syn-welcome__shortcuts">
                    <div className="syn-welcome__shortcut">
                      <kbd className="syn-welcome__kbd">Ctrl</kbd>
                      <span className="syn-welcome__kbdPlus">+</span>
                      <kbd className="syn-welcome__kbd">N</kbd>
                      <span className="syn-welcome__kbdLabel">New File</span>
                    </div>
                    <span className="syn-welcome__shortcutSep" aria-hidden="true">·</span>
                    <div className="syn-welcome__shortcut">
                      <kbd className="syn-welcome__kbd">Ctrl</kbd>
                      <span className="syn-welcome__kbdPlus">+</span>
                      <kbd className="syn-welcome__kbd">O</kbd>
                      <span className="syn-welcome__kbdLabel">Open File</span>
                    </div>
                    <span className="syn-welcome__shortcutSep" aria-hidden="true">·</span>
                    <div className="syn-welcome__shortcut">
                      <kbd className="syn-welcome__kbd">Ctrl</kbd>
                      <span className="syn-welcome__kbdPlus">+</span>
                      <kbd className="syn-welcome__kbd">K</kbd>
                      <span className="syn-welcome__kbdLabel">Command Palette</span>
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
        <GlobalSearch isOpen={isSearchOpen} onClose={handleCloseGlobalSearch} />

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
