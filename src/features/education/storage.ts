import { LEARNING_PATHS } from "./learningPaths";
import { mergeEducationProgressState } from "./LearningPathEngine";
import type { EducationProgressState } from "./types";

const STORAGE_KEY = "synapse.education.progress.v1";

export function loadEducationProgressState(): EducationProgressState {
  if (typeof window === "undefined") {
    return mergeEducationProgressState(LEARNING_PATHS);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return mergeEducationProgressState(LEARNING_PATHS);
    }
    return mergeEducationProgressState(LEARNING_PATHS, JSON.parse(raw) as Partial<EducationProgressState>);
  } catch {
    return mergeEducationProgressState(LEARNING_PATHS);
  }
}

export function persistEducationProgressState(progressState: EducationProgressState): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState));
    return true;
  } catch {
    return false;
  }
}