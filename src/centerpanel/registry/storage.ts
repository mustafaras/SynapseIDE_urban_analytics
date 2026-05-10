import type { ProjectRecord } from "./types";
import { normalizeProjectRecordForHistory } from "@/features/collaboration/projectHistory";

export const URBAN_STORAGE_KEY = "synapse.urban.registry.v1";

export function loadUrbanFromPersist(): ProjectRecord[] | undefined {
  try {
    const raw = localStorage.getItem(URBAN_STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((project) => normalizeProjectRecordForHistory(project as ProjectRecord));
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function saveUrbanToPersist(projects: ProjectRecord[]): void {
  try {
    localStorage.setItem(
      URBAN_STORAGE_KEY,
      JSON.stringify(projects.map((project) => normalizeProjectRecordForHistory(project))),
    );
  } catch {
    // Ignore persistence failures such as storage quota exhaustion.
  }
}