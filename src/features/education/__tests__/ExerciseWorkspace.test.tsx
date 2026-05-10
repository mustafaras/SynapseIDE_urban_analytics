import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mergeEducationProgressState } from "../LearningPathEngine";
import { ExerciseWorkspace } from "../exercises";
import { LEARNING_PATHS } from "../learningPaths";
import type { EducationProgressState } from "../types";

describe("ExerciseWorkspace", () => {
  it("renders the player, rubric, and dashboard surfaces", () => {
    const progressState = mergeEducationProgressState(LEARNING_PATHS);
    const noop = (() => undefined) as React.Dispatch<React.SetStateAction<EducationProgressState>>;

    const html = renderToStaticMarkup(
      <ExerciseWorkspace progressState={progressState} onProgressStateChange={noop} onOpenPath={() => undefined} />,
    );

    expect(html).toContain("Interactive exercise studio");
    expect(html).toContain("Exercise Catalog");
    expect(html).toContain("Rubric Preview");
    expect(html).toContain("Submit for grading");
    expect(html).toContain("Completion Dashboard");
  });
});