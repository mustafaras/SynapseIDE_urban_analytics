/**
 * Panel Bridge Store — Cross-panel coordination between CenterPanel ↔ RightPanel.
 *
 * Tracks left panel context (active tab, flow, report slot) and computes
 * contextual right-panel card recommendations. Also provides actions for
 * cross-panel navigation (e.g., "View in Right Panel", "Insert to Report").
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Flow → Card tag mapping
// ---------------------------------------------------------------------------

const FLOW_TAG_MAP: Record<string, string[]> = {
  site_suitability: ['land_use', 'spatial_stats', 'indicators'],
  accessibility: ['accessibility', 'network_analysis', 'mobility', 'transit'],
  vulnerability: ['climate', 'flood', 'equity', 'spatial_stats'],
  object_detection: ['geoai', 'machine_learning', 'remote_sensing'],
  indicator_composite: ['indicators', 'spatial_stats'],
  scenario_comparison: ['scenario', 'indicators', 'policy'],
  equity_audit: ['equity', 'accessibility', 'indicators'],
  change_detection: ['remote_sensing', 'land_use', 'change_detection'],
  facility_optimisation: ['accessibility', 'equity', 'health', 'parks'],
  system_dynamics: ['simulation', 'housing', 'employment', 'green_infra', 'transit'],
  voxcity_3d: ['voxcity', '3d_modeling', 'morphology'],
  cityjson_loader: ['voxcity', '3d_modeling'],
  sunlight_sim: ['voxcity', '3d_modeling', 'climate'],
};

const SLOT_TAG_MAP: Record<string, string[]> = {
  objective: ['project_scoping', 'indicators'],
  methodology: ['spatial_stats', 'gis_methods', 'network_analysis', 'remote_sensing'],
  findings: ['indicators', 'spatial_stats'],
  recommendations: ['policy', 'equity', 'scenario'],
  dataRefs: ['data_engineering', 'remote_sensing'],
  limitations: ['spatial_stats'],
};

const WORKSPACE_LAYOUT_STORAGE_KEY = 'centerPanel.workspaceLayoutExpanded';
const LEGACY_TOOLBOX_LAYOUT_STORAGE_KEY = 'tools.toolboxLayoutExpanded';

function readStoredWorkspaceLayoutExpanded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const stored = window.localStorage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY);
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }

    return window.localStorage.getItem(LEGACY_TOOLBOX_LAYOUT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStoredWorkspaceLayoutExpanded(value: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, String(value));
    window.localStorage.setItem(LEGACY_TOOLBOX_LAYOUT_STORAGE_KEY, String(value));
  } catch {}
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PanelBridgeState {
  /** Currently active tab in CenterPanel */
  activeTab: string;
  /** Currently active flow in Workflows tab */
  activeFlowId: string | null;
  /** Currently active slot in Report tab */
  activeReportSlot: string | null;

  /** Tags inferred from current context for right-panel recommendations */
  contextTags: string[];

  /** Card IDs recently "sent to report" from right panel */
  insertedCardIds: string[];

  /** Whether the mini context card is visible in center panel */
  contextCardVisible: boolean;

  /** User-controlled Center Panel workspace width mode */
  workspaceLayoutExpanded: boolean;

  /** @deprecated Use workspaceLayoutExpanded. Kept for old Toolbox callers. */
  toolboxLayoutExpanded: boolean;

  // Actions
  setActiveTab: (tab: string) => void;
  setActiveFlowId: (flowId: string | null) => void;
  setActiveReportSlot: (slot: string | null) => void;
  recordInsertedCard: (cardId: string) => void;
  setContextCardVisible: (v: boolean) => void;
  setWorkspaceLayoutExpanded: (v: boolean) => void;
  toggleWorkspaceLayoutExpanded: () => void;
  /** @deprecated Use setWorkspaceLayoutExpanded. */
  setToolboxLayoutExpanded: (v: boolean) => void;
  /** @deprecated Use toggleWorkspaceLayoutExpanded. */
  toggleToolboxLayoutExpanded: () => void;
  getContextTags: () => string[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePanelBridgeStore = create<PanelBridgeState>((set, get) => ({
  activeTab: 'Projects',
  activeFlowId: null,
  activeReportSlot: null,
  contextTags: [],
  insertedCardIds: [],
  contextCardVisible: true,
  workspaceLayoutExpanded: readStoredWorkspaceLayoutExpanded(),
  toolboxLayoutExpanded: readStoredWorkspaceLayoutExpanded(),

  setActiveTab: (tab) => {
    const tags = tab === 'Workflows'
      ? FLOW_TAG_MAP[get().activeFlowId ?? ''] ?? []
      : tab === 'Report'
        ? SLOT_TAG_MAP[get().activeReportSlot ?? 'methodology'] ?? []
        : [];
    set({ activeTab: tab, contextTags: tags });
  },

  setActiveFlowId: (flowId) => {
    const tags = FLOW_TAG_MAP[flowId ?? ''] ?? [];
    set({ activeFlowId: flowId, contextTags: tags });
  },

  setActiveReportSlot: (slot) => {
    const tags = SLOT_TAG_MAP[slot ?? ''] ?? [];
    set({ activeReportSlot: slot, contextTags: tags });
  },

  recordInsertedCard: (cardId) => {
    set((s) => ({
      insertedCardIds: [cardId, ...s.insertedCardIds.filter((id) => id !== cardId)].slice(0, 50),
    }));
  },

  setContextCardVisible: (v) => set({ contextCardVisible: v }),

  setWorkspaceLayoutExpanded: (v) => {
    writeStoredWorkspaceLayoutExpanded(v);
    set({ workspaceLayoutExpanded: v, toolboxLayoutExpanded: v });
  },

  toggleWorkspaceLayoutExpanded: () => {
    const next = !get().workspaceLayoutExpanded;
    writeStoredWorkspaceLayoutExpanded(next);
    set({ workspaceLayoutExpanded: next, toolboxLayoutExpanded: next });
  },

  setToolboxLayoutExpanded: (v) => {
    writeStoredWorkspaceLayoutExpanded(v);
    set({ workspaceLayoutExpanded: v, toolboxLayoutExpanded: v });
  },

  toggleToolboxLayoutExpanded: () => {
    const next = !get().workspaceLayoutExpanded;
    writeStoredWorkspaceLayoutExpanded(next);
    set({ workspaceLayoutExpanded: next, toolboxLayoutExpanded: next });
  },

  getContextTags: () => get().contextTags,
}));
