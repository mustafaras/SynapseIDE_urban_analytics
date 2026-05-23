import { useState } from "react";

import {
  DEFAULT_MAP_REPORT_HANDOFF_OPTIONS,
  type MapReportHandoffOptions,
  type MapReportHandoffSource,
  type MapReportSnapshotInput,
} from "@/services/map/MapReportHandoffService";

export function useMapReportController() {
  const [reportHandoffSource, setReportHandoffSource] = useState<MapReportHandoffSource | null>(null);
  const [reportHandoffOptions, setReportHandoffOptions] = useState<MapReportHandoffOptions>(
    DEFAULT_MAP_REPORT_HANDOFF_OPTIONS,
  );
  const [reportHandoffSnapshot, setReportHandoffSnapshot] = useState<MapReportSnapshotInput | null>(null);
  const [isGeneratingReportHandoffSnapshot, setIsGeneratingReportHandoffSnapshot] = useState(false);
  const [isExportingReportHandoffPdf, setIsExportingReportHandoffPdf] = useState(false);

  return {
    reportHandoffSource,
    setReportHandoffSource,
    reportHandoffOptions,
    setReportHandoffOptions,
    reportHandoffSnapshot,
    setReportHandoffSnapshot,
    isGeneratingReportHandoffSnapshot,
    setIsGeneratingReportHandoffSnapshot,
    isExportingReportHandoffPdf,
    setIsExportingReportHandoffPdf,
  };
}
