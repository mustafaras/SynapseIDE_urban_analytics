import type {
  EducationNavigationTarget,
  EducationPanelView,
  LearningPathId,
  MethodologyExplainerId,
  ToolReference,
} from "./types";

export function createToolReference(
  label: string,
  summary: string,
  target: EducationNavigationTarget,
): ToolReference {
  return { label, summary, target };
}

export function dispatchCenterPanelNavigation(target: EducationNavigationTarget): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("synapse:navigate", {
      detail: {
        tab: target.tab,
        flowId: target.flowId,
      },
    }),
  );

  if (target.tab === "Workflows" && target.workflowView) {
    window.dispatchEvent(
      new CustomEvent("synapse:workflow-workspace", {
        detail: {
          view: target.workflowView,
          flowId: target.flowId,
        },
      }),
    );
  }
}

export function openEducationWorkspace(focus: {
  view?: EducationPanelView | undefined;
  pathId?: LearningPathId | undefined;
  explainerId?: MethodologyExplainerId | undefined;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("synapse:navigate", {
      detail: {
        tab: "Education",
        educationPathId: focus.pathId,
        educationExplainerId: focus.explainerId,
        educationView: focus.view,
        educationRequestedAt: Date.now(),
      },
    }),
  );
}

export function openEducationExplainer(explainerId: MethodologyExplainerId, pathId?: LearningPathId): void {
  openEducationWorkspace({
    view: "paths",
    explainerId,
    ...(pathId ? { pathId } : {}),
  });
}