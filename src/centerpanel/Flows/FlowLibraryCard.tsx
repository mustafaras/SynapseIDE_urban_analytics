import React, { useMemo, useState } from "react";
import flowCss from "../styles/flows.module.css";
import type { FlowId } from "./flowTypes";
import { FLOW_LIBRARY_ITEMS, type FlowCategory } from "./flowLibraryMeta";
import FlowTile from "./FlowTile";
import { useFlowStore } from "@/stores/useFlowStore";
import {
  getWorkflowExperience,
  WORKFLOW_JOURNEYS,
  type WorkflowJourneyId,
} from "./workflowExperience";

const GROUP_META: Record<FlowCategory, { label: string; hint: string }> = {
  SPATIAL_ANALYSIS: {
    label: "Spatial Analysis",
    hint: "Site suitability, accessibility, and land-use change detection",
  },
  INDICATOR_ASSESSMENT: {
    label: "Indicator Assessment",
    hint: "Composite indices and multi-indicator benchmarking",
  },
  RISK_EQUITY: {
    label: "Risk & Equity",
    hint: "Vulnerability mapping, equity audits, and distributional analysis",
  },
  SIMULATION_3D: {
    label: "3D & Simulation",
    hint: "Building extrusion, solar analysis, urban growth, and facility siting",
  },
  SCENARIO_REVIEW: {
    label: "Scenario & Review",
    hint: "Scenario comparison and completed-run review",
  },
};

const CATEGORY_ORDER: FlowCategory[] = [
  "SPATIAL_ANALYSIS",
  "INDICATOR_ASSESSMENT",
  "RISK_EQUITY",
  "SIMULATION_3D",
  "SCENARIO_REVIEW",
];

const FlowLibraryCard: React.FC<{
  activeFlowId: FlowId;
  onSelectFlow: (fid: FlowId) => void;
}> = ({ activeFlowId, onSelectFlow }) => {
  const [query, setQuery] = useState("");
  const [journeyFilter, setJourneyFilter] = useState<WorkflowJourneyId | "all">("all");
  const completedRuns = useFlowStore((state) => state.completedRuns);

  const filteredItems = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    return FLOW_LIBRARY_ITEMS.filter((item) => {
      const experience = getWorkflowExperience(item.flowId);
      const matchesJourney = journeyFilter === "all" || experience?.journey === journeyFilter;
      if (!matchesJourney) {
        return false;
      }
      if (!trimmedQuery) {
        return true;
      }

      const haystack = [
        item.title,
        item.analysisFocus,
        item.boundary,
        ...(item.whatYouDocument ?? []),
        experience?.prompt,
        experience?.quickUse,
        experience?.inputs,
        experience?.outputs,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(trimmedQuery);
    });
  }, [journeyFilter, query]);

  return (
    <section className={flowCss.flowLibraryCard} aria-label="Flow Library">
      <div className={flowCss.flowLibraryHeader}>
        <div className={flowCss.flowLibraryTitle}>Flow Library</div>
        <div className={flowCss.flowLibrarySubtitle}>
          Structured urban-analytics workflow templates. Showing {filteredItems.length} of {FLOW_LIBRARY_ITEMS.length} workflows.
        </div>
      </div>

      <input
        type="search"
        className={flowCss.textInput}
        placeholder="Find a workflow, prompt, or output"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          className={flowCss.outlineBtn}
          onClick={() => setJourneyFilter("all")}
          style={{ borderColor: journeyFilter === "all" ? "var(--syn-accent-primary)" : undefined }}
        >
          All journeys
        </button>
        {WORKFLOW_JOURNEYS.map((journey) => (
          <button
            key={journey.id}
            type="button"
            className={flowCss.outlineBtn}
            onClick={() => setJourneyFilter(journey.id)}
            style={{ borderColor: journeyFilter === journey.id ? "var(--syn-accent-primary)" : undefined }}
          >
            {journey.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className={flowCss.readonlyBlock}>
          No workflows match the current search and journey filter. Reset filters to see the full catalogue again.
        </div>
      ) : null}

      {CATEGORY_ORDER.map((cat) => {
        const items = filteredItems.filter((f) => f.category === cat);
        if (items.length === 0) return null;
        const meta = GROUP_META[cat];
        return (
          <div key={cat} className={flowCss.flowLibraryGroup}>
            <div className={flowCss.flowLibraryGroupLabel}>{meta.label}</div>
            <div className={flowCss.flowLibraryGroupHint}>{meta.hint}</div>
            {items.map((item) => {
              const experience = getWorkflowExperience(item.flowId);
              const runCount = completedRuns.filter((run) => run.flowId === item.flowId).length;

              return (
                <FlowTile
                  key={item.flowId}
                  item={item}
                  isActive={item.flowId === activeFlowId}
                  onSelect={() => onSelectFlow(item.flowId)}
                  metaLine={experience ? `${experience.prompt} | ${experience.journey.replace(/_/g, " ")} | ${experience.complexity}` : undefined}
                  statusLine={runCount > 0 ? `${runCount} saved run${runCount > 1 ? "s" : ""}` : experience?.outputs}
                />
              );
            })}
          </div>
        );
      })}

      <div className={flowCss.flowLibraryDisclaimer}>
        Flows produce analytical outputs for planning support. They do not
        constitute binding policy decisions, zoning directives, or regulatory
        mandates. Results should be validated with domain experts and local
        stakeholders.
      </div>
    </section>
  );
};

export default FlowLibraryCard;
