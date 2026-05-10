import { describe, expect, it } from "vitest";
import { mergeEducationProgressState } from "../LearningPathEngine";
import { LEARNING_PATHS } from "../learningPaths";
import { assignExercise, buildExerciseDashboard, EXERCISE_CATALOG, gradeExercise, recordExerciseAttempt } from "../exercises";

describe("education exercise engine", () => {
  it("seeds at least ten exercises across all required categories", () => {
    const categories = new Set(EXERCISE_CATALOG.map((exercise) => exercise.category));

    expect(EXERCISE_CATALOG.length).toBeGreaterThanOrEqual(10);
    expect(categories).toEqual(
      new Set(["calculator", "flow", "interpretation", "comparison", "critical_thinking", "data_ethics"]),
    );
  });

  it("awards full credit for numeric work within tolerance", () => {
    const exercise = EXERCISE_CATALOG.find((entry) => entry.id === "hansen_accessibility_clinic_score");
    expect(exercise).toBeTruthy();

    const evaluation = gradeExercise(exercise!, {
      score: "133.34",
      interpretation: "Residents can reach more clinic service opportunity once travel friction stays low.",
    });

    expect(evaluation.passed).toBe(true);
    expect(evaluation.percentScore).toBe(1);
    expect(evaluation.targetedFeedback).toHaveLength(0);
  });

  it("returns targeted feedback when critical concepts are missing", () => {
    const exercise = EXERCISE_CATALOG.find((entry) => entry.id === "gwr_causality_and_stability_check");
    expect(exercise).toBeTruthy();

    const evaluation = gradeExercise(exercise!, {
      concerns: ["sample"],
      mitigation: "I would compare the result to an OLS baseline.",
    });

    expect(evaluation.passed).toBe(false);
    expect(evaluation.percentScore).toBeLessThan(exercise!.masteryThreshold);
    expect(evaluation.targetedFeedback.join(" ").toLowerCase()).toContain("diagnostic");
    expect(evaluation.targetedFeedback.join(" ").toLowerCase()).toContain("causal");
  });

  it("records attempts and rolls them into the completion dashboard", () => {
    const exercise = EXERCISE_CATALOG.find((entry) => entry.id === "equity_audit_tradeoff_selection");
    expect(exercise).toBeTruthy();

    let progressState = mergeEducationProgressState(LEARNING_PATHS);
    progressState = assignExercise(progressState, exercise!.id);

    const evaluation = gradeExercise(exercise!, {
      scenario_choice: "scenario_a",
      scenario_reason: "Scenario A improves the Gini while staying inside the 25 minute travel threshold.",
    });
    progressState = recordExerciseAttempt(progressState, exercise!, {
      scenario_choice: "scenario_a",
      scenario_reason: "Scenario A improves the Gini while staying inside the 25 minute travel threshold.",
    }, evaluation);

    const dashboard = buildExerciseDashboard(EXERCISE_CATALOG, progressState);

    expect(dashboard.assignedCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.completedCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.masteredCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.recentAttempts[0]?.exerciseId).toBe(exercise!.id);
  });
});