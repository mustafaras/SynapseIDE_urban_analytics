import React from "react";

import { MapColumnarImportDialog } from "../../MapColumnarImportDialog";
import { MapCsvImportDialog } from "../../MapCsvImportDialog";
import { MapDataExportDialog } from "../../MapDataExportDialog";
import { MapDataImportHubDialog } from "../../MapDataImportHubDialog";
import { MapExportDialog } from "../../MapExportDialog";
import { MapImportPreviewDialog } from "../MapImportPreviewDialog";

export interface MapExplorerDialogStackProps {
  columnarImport: React.ComponentProps<typeof MapColumnarImportDialog>;
  csvImport: React.ComponentProps<typeof MapCsvImportDialog>;
  dataExport: React.ComponentProps<typeof MapDataExportDialog>;
  importHub: React.ComponentProps<typeof MapDataImportHubDialog>;
  importPreview: React.ComponentProps<typeof MapImportPreviewDialog>;
  mapExport: React.ComponentProps<typeof MapExportDialog>;
}

export const MapExplorerDialogStack: React.FC<MapExplorerDialogStackProps> = ({
  columnarImport,
  csvImport,
  dataExport,
  importHub,
  importPreview,
  mapExport,
}) => (
  <>
    <MapDataExportDialog {...dataExport} />
    <MapExportDialog {...mapExport} />
    <MapDataImportHubDialog {...importHub} />
    <MapImportPreviewDialog {...importPreview} />
    <MapCsvImportDialog {...csvImport} />
    <MapColumnarImportDialog {...columnarImport} />
  </>
);
