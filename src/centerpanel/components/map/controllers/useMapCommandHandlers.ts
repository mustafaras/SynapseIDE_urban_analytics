import { useCallback, useMemo } from "react";

export type MapToolbarCommandKind =
  | "import"
  | "data-export"
  | "image-export"
  | "report-handoff"
  | "project-save"
  | "project-load";

interface UseMapCommandHandlersOptions {
  onImport: () => void;
  onDataExport: () => void;
  onImageExport: () => void;
  onReportHandoff: () => void;
  onProjectSave: () => void;
  onProjectLoad: () => void;
}

export function useMapCommandHandlers({
  onImport,
  onDataExport,
  onImageExport,
  onReportHandoff,
  onProjectSave,
  onProjectLoad,
}: UseMapCommandHandlersOptions) {
  const handlers = useMemo(
    () => ({
      import: onImport,
      "data-export": onDataExport,
      "image-export": onImageExport,
      "report-handoff": onReportHandoff,
      "project-save": onProjectSave,
      "project-load": onProjectLoad,
    }) satisfies Record<MapToolbarCommandKind, () => void>,
    [onDataExport, onImageExport, onImport, onProjectLoad, onProjectSave, onReportHandoff],
  );

  const runCommand = useCallback((kind: MapToolbarCommandKind) => {
    handlers[kind]();
  }, [handlers]);

  return {
    runCommand,
    importData: handlers.import,
    exportData: handlers["data-export"],
    exportImage: handlers["image-export"],
    openReportHandoff: handlers["report-handoff"],
    saveProject: handlers["project-save"],
    loadProject: handlers["project-load"],
  };
}
