import { useState } from "react";

import {
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  type MapCompositionOptions,
} from "../../../../services/map/MapExportService";
import type {
  ImportedGeoJSONLayer,
  ImportedRasterLayer,
  MapImportProgress,
  SourceProfile,
} from "../../../../services/map/MapDataImporter";
import type {
  MapExportFormat,
  MapExportTarget,
} from "../../../../services/map/MapDataExporter";
import type { TeachingDatasetId } from "../../../../services/data/datasetLibrary";

type CsvImportSession = import("../../../../services/map/MapDataImporter").CsvImportSession;
type ColumnarImportSession = import("../../../../services/map/MapDataImporter").ColumnarImportSession;

export interface PendingImportPreviewState {
  profile: SourceProfile;
  result?: ImportedGeoJSONLayer | ImportedRasterLayer;
}

export function useMapImportExportState() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<MapImportProgress | null>(null);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [importLabel, setImportLabel] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingImportPreview, setPendingImportPreview] = useState<PendingImportPreviewState | null>(null);
  const [pendingCsvImport, setPendingCsvImport] = useState<CsvImportSession | null>(null);
  const [pendingColumnarImport, setPendingColumnarImport] = useState<ColumnarImportSession | null>(null);
  const [csvLatitudeColumn, setCsvLatitudeColumn] = useState("");
  const [csvLongitudeColumn, setCsvLongitudeColumn] = useState("");
  const [showImportHub, setShowImportHub] = useState(false);
  const [loadingTeachingDatasetId, setLoadingTeachingDatasetId] = useState<TeachingDatasetId | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMapExportDialog, setShowMapExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<MapExportFormat>("geojson");
  const [exportTarget, setExportTarget] = useState<MapExportTarget>("visible-layers");
  const [exportPrecision, setExportPrecision] = useState(6);
  const [exportPrettyPrint, setExportPrettyPrint] = useState(true);
  const [exportIncludeProperties, setExportIncludeProperties] = useState(true);
  const [mapCompositionOptions, setMapCompositionOptions] = useState<MapCompositionOptions>(() => ({
    ...DEFAULT_MAP_COMPOSITION_OPTIONS,
  }));
  const [mapExportPreviewUrl, setMapExportPreviewUrl] = useState<string | null>(null);
  const [isGeneratingMapExportPreview, setIsGeneratingMapExportPreview] = useState(false);
  const [isExportingMapImage, setIsExportingMapImage] = useState(false);
  const [isExportingOfflinePackage, setIsExportingOfflinePackage] = useState(false);

  return {
    csvLatitudeColumn,
    csvLongitudeColumn,
    exportFormat,
    exportIncludeProperties,
    exportPrecision,
    exportPrettyPrint,
    exportTarget,
    importLabel,
    importProgress,
    isDragActive,
    isExportingMapImage,
    isExportingOfflinePackage,
    isGeneratingMapExportPreview,
    isImporting,
    loadingTeachingDatasetId,
    mapCompositionOptions,
    mapExportPreviewUrl,
    pendingColumnarImport,
    pendingCsvImport,
    pendingImportPreview,
    setCsvLatitudeColumn,
    setCsvLongitudeColumn,
    setExportFormat,
    setExportIncludeProperties,
    setExportPrecision,
    setExportPrettyPrint,
    setExportTarget,
    setImportLabel,
    setImportProgress,
    setIsDragActive,
    setIsExportingMapImage,
    setIsExportingOfflinePackage,
    setIsGeneratingMapExportPreview,
    setIsImporting,
    setLoadingTeachingDatasetId,
    setMapCompositionOptions,
    setMapExportPreviewUrl,
    setPendingColumnarImport,
    setPendingCsvImport,
    setPendingImportPreview,
    setShowExportDialog,
    setShowImportHub,
    setShowImportProgress,
    setShowMapExportDialog,
    showExportDialog,
    showImportHub,
    showImportProgress,
    showMapExportDialog,
  };
}
