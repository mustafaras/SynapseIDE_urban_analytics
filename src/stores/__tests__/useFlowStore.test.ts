import { beforeEach, describe, expect, it } from "vitest";
import { useFlowStore } from "../useFlowStore";
import type { CompletedAnalysisRun } from "@/features/urbanAnalytics/lib/types";

function makeRun(runId: string, label = `Run ${runId}`): CompletedAnalysisRun {
  return {
    runId,
    flowId: "review",
    label,
    insertedAt: "2026-04-11T12:00:00.000Z",
    paragraph: `${label} summary`,
    paragraphPreview: `${label} summary`,
    paragraphFull: `${label} summary`,
    mapOutputs: [],
    chartOutputs: [],
    dataOutputs: [],
  };
}

beforeEach(() => {
  useFlowStore.setState(useFlowStore.getInitialState());
});

describe("useFlowStore", () => {
  it("upserts a completed run by runId", () => {
    const store = useFlowStore.getState();

    store.upsertCompletedRun(makeRun("run-1", "Initial run"));
    store.upsertCompletedRun(makeRun("run-1", "Updated run"));

    const completedRuns = useFlowStore.getState().completedRuns;
    expect(completedRuns).toHaveLength(1);
    expect(completedRuns[0]?.label).toBe("Updated run");
  });

  it("does not reset active flow state when upserting a completed run", () => {
    const store = useFlowStore.getState();
    store.startFlow("accessibility");
    store.nextStep();
    store.setStepData("weights", { distance: 0.5 });

    store.upsertCompletedRun(makeRun("run-2"));

    const nextState = useFlowStore.getState();
    expect(nextState.activeFlow).toBe("accessibility");
    expect(nextState.currentStep).toBe(1);
    expect(nextState.stepData).toEqual({ weights: { distance: 0.5 } });
  });
});
