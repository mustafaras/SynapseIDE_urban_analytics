import { useRef, useState } from "react";

import type { MapProjectSaveTrigger } from "./mapExplorerControllerHelpers";

export function useMapProjectPersistenceState() {
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const lastAutoSaveTriggerRef = useRef<MapProjectSaveTrigger | null>(null);
  const lastSavedProjectTriggerRef = useRef<MapProjectSaveTrigger | null>(null);

  return {
    isLoadingProject,
    isSavingProject,
    lastAutoSaveTriggerRef,
    lastSavedAt,
    lastSavedProjectTriggerRef,
    setIsLoadingProject,
    setIsSavingProject,
    setLastSavedAt,
  };
}
