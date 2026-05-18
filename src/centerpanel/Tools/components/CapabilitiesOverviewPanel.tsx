import React, { useMemo } from "react";

import { FLOW_LIBRARY_ITEMS, type FlowCategory } from "@/centerpanel/Flows/flowLibraryMeta";
import type { FlowId } from "@/centerpanel/Flows/flowTypes";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";

import styles from "../../styles/tools.module.css";

const WORKSPACE_TABS = [
  { tab: "Projects", summary: "Registry, session inventory, and active project review." },
  { tab: "New Project", summary: "Project creation, scoping, and metadata capture." },
  { tab: "Methods", summary: "Methodology guides, evidence notes, and analytical references." },
  { tab: "Education", summary: "Learning paths, teaching datasets, and exercise workspaces." },
  { tab: "Report", summary: "Structured report authoring and evidence-backed narrative assembly." },
  { tab: "Workflows", summary: "Guided analytical flows and completed-run review." },
  { tab: "Dashboard", summary: "Presentation-ready dashboards and exportable municipal views." },
  { tab: "Toolbox", summary: "Operational tools, runtime labs, validation, and export surfaces." },
] as const;

const TOOL_SURFACES = [
  { id: "tools-eo", label: "EO Connectors", summary: "STAC, COG, Sentinel Hub, and selected raster source registry." },
  { id: "tools-geoai", label: "GeoAI Lab", summary: "Land cover, NL to SQL, and model registry status." },
  { id: "tools-spatial-index", label: "Spatial Index Lab", summary: "WASM and worker-backed index diagnostics." },
  { id: "tools-streaming", label: "Streaming Runtime", summary: "Replay, WebSocket, and MQTT operational state." },
  { id: "tools-coverage", label: "QA Coverage", summary: "Coverage thresholds and CI-facing analytical gates." },
  { id: "tools-indicators", label: "Indicator Catalog", summary: "Compute and route the expanded indicator library." },
  { id: "tools-preview", label: "Preview & Validation", summary: "Inspect export payloads before shipping them." },
  { id: "tools-export", label: "Export", summary: "Deliver report, JSON, CSV, and document artifacts." },
] as const;

const FLOW_CATEGORY_LABELS: Record<FlowCategory, string> = {
  SPATIAL_ANALYSIS: "Spatial analysis",
  INDICATOR_ASSESSMENT: "Indicator assessment",
  RISK_EQUITY: "Risk and equity",
  SIMULATION_3D: "Simulation and 3D",
  SCENARIO_REVIEW: "Scenario review",
};

type WorkspaceTab = (typeof WORKSPACE_TABS)[number]["tab"];

type CapabilitiesOverviewPanelProps = {
  onOpenToolSurface: (id: string) => void;
};

function emitNavigate(detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("synapse:navigate", { detail }));
}

function openTab(tab: WorkspaceTab) {
  emitNavigate({ tab });
}

function openFlow(flowId: FlowId) {
  emitNavigate({ tab: "Workflows", flowId });
}

export default function CapabilitiesOverviewPanel({
  onOpenToolSurface,
}: CapabilitiesOverviewPanelProps): React.ReactElement {
  const openMapExplorer = useMapExplorerStore((state) => state.open);

  const groupedFlows = useMemo(() => {
    const order: FlowCategory[] = [
      "SPATIAL_ANALYSIS",
      "INDICATOR_ASSESSMENT",
      "RISK_EQUITY",
      "SIMULATION_3D",
      "SCENARIO_REVIEW",
    ];

    return order.map((category) => ({
      category,
      label: FLOW_CATEGORY_LABELS[category],
      items: FLOW_LIBRARY_ITEMS.filter((item) => item.category === category),
    }));
  }, []);

  return (
    <div className={styles.capabilityOverview} data-testid="tools-capabilities-overview">
      <div className={styles.capabilityIntro}>
        <div className={styles.capabilityHeader}>
          <div className={styles.capabilityTitle}>Release candidate feature index</div>
          <div className={styles.capabilityMeta}>
            {WORKSPACE_TABS.length} tabs · {FLOW_LIBRARY_ITEMS.length} workflows · {TOOL_SURFACES.length} toolbox surfaces
          </div>
        </div>
        <div className={styles.capabilityBody}>
          <div className={styles.capabilityDescription}>
            Use this index to reach every major release surface without relying on internal route knowledge. It is the operator-facing overview for visual verification, smoke checks, and guided walkthroughs.
          </div>
          <div className={styles.capabilityCommandRow}>
            <button
              type="button"
              className={styles.capabilityCommand}
              data-testid="capabilities-open-map-explorer"
              onClick={() => openMapExplorer()}
            >
              Open Map Explorer
            </button>
            <button
              type="button"
              className={styles.capabilityCommand}
              data-testid="capabilities-open-report"
              onClick={() => openTab("Report")}
            >
              Open Report Builder
            </button>
            <button
              type="button"
              className={styles.capabilityCommand}
              data-testid="capabilities-open-workflows"
              onClick={() => openTab("Workflows")}
            >
              Open Workflow Library
            </button>
            <button
              type="button"
              className={styles.capabilityCommand}
              data-testid="capabilities-open-toolbox-geoai"
              onClick={() => onOpenToolSurface("tools-geoai")}
            >
              Jump to GeoAI Lab
            </button>
          </div>
        </div>
      </div>

      <section className={styles.capabilitySection} aria-label="Workspace tabs">
        <div className={styles.capabilityHeader}>
          <div className={styles.capabilityTitle}>Workspace tabs</div>
          <div className={styles.capabilityMeta}>Top-level surfaces available from the center-panel header</div>
        </div>
        <div className={styles.capabilityMatrix}>
          {WORKSPACE_TABS.map((entry) => (
            <div
              key={entry.tab}
              className={styles.capabilityRow}
            >
              <div className={styles.capabilityName}>{entry.tab}</div>
              <div className={styles.capabilitySummary}>{entry.summary}</div>
              <button
                type="button"
                className={styles.capabilityAction}
                data-testid={`capabilities-tab-${entry.tab.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => openTab(entry.tab)}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.capabilitySection} aria-label="Toolbox surfaces">
        <div className={styles.capabilityHeader}>
          <div className={styles.capabilityTitle}>Toolbox surfaces</div>
          <div className={styles.capabilityMeta}>Runtime, validation, and export sections available inside Toolbox</div>
        </div>
        <div className={styles.capabilityMatrix}>
          {TOOL_SURFACES.map((surface) => (
            <div
              key={surface.id}
              className={styles.capabilityRow}
            >
              <div className={styles.capabilityName}>{surface.label}</div>
              <div className={styles.capabilitySummary}>{surface.summary}</div>
              <button
                type="button"
                className={styles.capabilityAction}
                data-testid={`capabilities-tool-${surface.id.replace(/^tools-/, "")}`}
                onClick={() => onOpenToolSurface(surface.id)}
              >
                Jump
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.capabilitySection} aria-label="Analytical workflows">
        <div className={styles.capabilityHeader}>
          <div className={styles.capabilityTitle}>Analytical workflows</div>
          <div className={styles.capabilityMeta}>Direct launch paths into the release workflow library</div>
        </div>
        <div className={styles.capabilityMatrix}>
          {groupedFlows.map((group) => (
            <div key={group.category} className={styles.capabilityGroup}>
              <div className={styles.capabilityGroupTitle}>{group.label}</div>
              {group.items.map((item) => (
                <div
                  key={item.flowId}
                  className={styles.capabilityRow}
                >
                  <div className={styles.capabilityName}>{item.title}</div>
                  <div className={styles.capabilitySummary}>{item.analysisFocus}</div>
                  <button
                    type="button"
                    className={styles.capabilityAction}
                    data-testid={`capabilities-flow-${item.flowId}`}
                    onClick={() => openFlow(item.flowId)}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
