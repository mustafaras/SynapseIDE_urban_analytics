import { useCallback } from "react";
import type maplibregl from "maplibre-gl";

import { createMapExportEvidenceArtifact, createMapReportSnapshotEvidenceArtifact } from "../mapEvidenceArtifacts";
import {
  buildPendingReportInsertFromMapHandoff,
  enqueueMapReportHandoff,
  type MapReportHandoffDraft,
} from "../../../../services/map/MapReportHandoffService";
import { buildReportHandoffReviewEvent, createMapReviewEvent } from "../../../../services/map/MapReviewSessionService";
import {
  DEFAULT_MAP_COMPOSITION_OPTIONS,
  exportMapOnlyA0LandscapePdf,
  mapPublicationReadinessToEvidenceQA,
  triggerMapPublicationDownload,
} from "../../../../services/map/MapExportService";

interface LayerRef {
  id: string;
}

interface UseMapReportEvidenceActionsParams {
  announce: (message: string) => void;
  buildCurrentReviewSnapshot: () => unknown;
  mapInstanceRef: React.MutableRefObject<maplibregl.Map | null>;
  mapPublicationReadiness: MapReportHandoffDraft["publicationReadiness"];
  recordMapReviewEvent: (event: unknown) => void;
  reportHandoffDraft: MapReportHandoffDraft | null;
  reportHandoffOptionsSnapshotFit: "current" | "fit-visible";
  reportHandoffSourceTitle: string | null | undefined;
  scientificQA: Parameters<typeof exportMapOnlyA0LandscapePdf>[1]["scientificQA"];
  setIsExportingReportHandoffPdf: (next: boolean) => void;
  setReportHandoffSnapshot: (next: MapReportHandoffDraft["snapshot"] | null) => void;
  setReportHandoffSource: (next: MapReportHandoffDraft["source"] | null) => void;
  toastError: (message: string) => void;
  toastSuccess: (message: string) => void;
  upsertMapEvidenceArtifact: (artifact: ReturnType<typeof createMapExportEvidenceArtifact>) => void;
  visiblePublicationLayers: LayerRef[];
  waitForMapCanvasCaptureMode: () => Promise<void>;
}

export function useMapReportEvidenceActions({
  announce,
  buildCurrentReviewSnapshot,
  mapInstanceRef,
  mapPublicationReadiness,
  recordMapReviewEvent,
  reportHandoffDraft,
  reportHandoffOptionsSnapshotFit,
  reportHandoffSourceTitle,
  scientificQA,
  setIsExportingReportHandoffPdf,
  setReportHandoffSnapshot,
  setReportHandoffSource,
  toastError,
  toastSuccess,
  upsertMapEvidenceArtifact,
  visiblePublicationLayers,
  waitForMapCanvasCaptureMode,
}: UseMapReportEvidenceActionsParams) {
  const handleDownloadReportHandoffPdf = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) {
      toastError("Map canvas is not ready for A0 export.");
      announce("A0 map PDF export failed: canvas not ready");
      return;
    }
    if (reportHandoffDraft?.publicationReadiness.status === "blocked") {
      const message = reportHandoffDraft.publicationReadiness.blockers[0]?.message ?? "Publication readiness blockers must be resolved before formal PDF export.";
      toastError(message);
      announce(`A0 map PDF export blocked: ${message}`);
      return;
    }

    setIsExportingReportHandoffPdf(true);
    try {
      await waitForMapCanvasCaptureMode();
      const captureMap = mapInstanceRef.current;
      if (!captureMap) {
        throw new Error("Map canvas is not ready for A0 export.");
      }
      const result = await exportMapOnlyA0LandscapePdf(captureMap, {
        mapFit: reportHandoffOptionsSnapshotFit,
        title: reportHandoffSourceTitle ?? reportHandoffDraft?.title ?? "Current map evidence",
        overlayLayers: visiblePublicationLayers,
        attributionText: DEFAULT_MAP_COMPOSITION_OPTIONS.attributionText,
        scientificQA,
      });
      triggerMapPublicationDownload(result);
      const readiness = result.readiness ?? reportHandoffDraft?.publicationReadiness ?? mapPublicationReadiness;
      upsertMapEvidenceArtifact(createMapExportEvidenceArtifact({
        title: `${reportHandoffDraft?.title ?? "Current map evidence"} A0 PDF export`,
        summary: `Formal A0 PDF export recorded with publication readiness status ${readiness.status}.`,
        exportReference: {
          exportId: result.manifest?.manifestId ?? result.filename,
          filename: result.filename,
          format: result.format,
          mimeType: result.mimeType,
        },
        linkedLayerIds: visiblePublicationLayers.map((layer) => layer.id),
        sourceLayerIds: visiblePublicationLayers.map((layer) => layer.id),
        qa: mapPublicationReadinessToEvidenceQA(readiness),
        metadata: {
          publicationReadinessStatus: readiness.status,
          readinessBlockerCount: readiness.blockers.length,
          readinessWarningCount: readiness.warnings.length,
          readinessCaveatCount: readiness.caveats.length,
          ...(result.manifest ? { manifestId: result.manifest.manifestId, manifestVersion: result.manifest.version } : {}),
        },
        createdAt: result.manifest?.createdAt ?? readiness.checkedAt,
      }));
      toastSuccess(`Exported A0 landscape map PDF: ${result.filename}.`);
      announce("A0 landscape map PDF exported");
    } catch (error) {
      const message = error instanceof Error ? error.message : "A0 landscape map PDF export failed.";
      toastError(message);
      announce(`A0 landscape map PDF export failed: ${message}`);
    } finally {
      setIsExportingReportHandoffPdf(false);
    }
  }, [
    announce,
    mapInstanceRef,
    mapPublicationReadiness,
    reportHandoffDraft,
    reportHandoffOptionsSnapshotFit,
    reportHandoffSourceTitle,
    scientificQA,
    setIsExportingReportHandoffPdf,
    toastError,
    toastSuccess,
    upsertMapEvidenceArtifact,
    visiblePublicationLayers,
    waitForMapCanvasCaptureMode,
  ]);

  const handleRegisterReportEvidenceBlock = useCallback(() => {
    if (!reportHandoffDraft) return;
    const sourceLayerIds = reportHandoffDraft.references
      .map((reference) => reference.layerId)
      .filter((layerId): layerId is string => Boolean(layerId));
    const artifact = createMapReportSnapshotEvidenceArtifact({
      title: `${reportHandoffDraft.title} structured report evidence`,
      summary: `Structured map evidence block ${reportHandoffDraft.evidenceBlock.id} registered with publication readiness status ${reportHandoffDraft.publicationReadiness.status}.`,
      reportReference: {
        reportDraftId: reportHandoffDraft.id,
        snapshotAssetId: reportHandoffDraft.snapshot.assetId,
        sectionIds: [],
      },
      linkedLayerIds: sourceLayerIds,
      sourceLayerIds,
      qa: mapPublicationReadinessToEvidenceQA(reportHandoffDraft.publicationReadiness),
      metadata: {
        reportEvidenceBlockId: reportHandoffDraft.evidenceBlock.id,
        reportEvidenceBlockVersion: reportHandoffDraft.evidenceBlock.version,
        reportEvidenceLayerCount: reportHandoffDraft.evidenceBlock.payload.composition.layerStack.length,
        reportEvidenceLegendItemCount: reportHandoffDraft.evidenceBlock.payload.composition.legendItems.length,
        reportEvidenceCitationCount: reportHandoffDraft.evidenceBlock.payload.provenance.citationIds.length,
        publicationReadinessStatus: reportHandoffDraft.publicationReadiness.status,
        readinessBlockerCount: reportHandoffDraft.publicationReadiness.blockers.length,
        readinessWarningCount: reportHandoffDraft.publicationReadiness.warnings.length,
        readinessCaveatCount: reportHandoffDraft.publicationReadiness.caveats.length,
      },
      createdAt: reportHandoffDraft.createdAt,
    });
    upsertMapEvidenceArtifact(artifact);
    toastSuccess(`Registered structured map evidence block ${reportHandoffDraft.evidenceBlock.id}.`);
    announce("Structured map report evidence registered");
  }, [announce, reportHandoffDraft, toastSuccess, upsertMapEvidenceArtifact]);

  const handleInsertReportHandoff = useCallback(() => {
    if (!reportHandoffDraft) return;
    if (reportHandoffDraft.publicationReadiness.status === "blocked") {
      const message = reportHandoffDraft.publicationReadiness.blockers[0]?.message ?? "Publication readiness blockers must be resolved before report insertion.";
      toastError(message);
      announce(`Map report insertion blocked: ${message}`);
      return;
    }
    const snapshot = buildCurrentReviewSnapshot();
    const provisionalInsert = buildPendingReportInsertFromMapHandoff(reportHandoffDraft);
    const reviewEventInput = buildReportHandoffReviewEvent(reportHandoffDraft, provisionalInsert, snapshot);
    const reviewEventId = createMapReviewEvent(reviewEventInput).id;
    const insert = enqueueMapReportHandoff(reportHandoffDraft, { mapReviewEventIds: [reviewEventId] });
    const sourceLayerIds = reportHandoffDraft.references
      .map((reference) => reference.layerId)
      .filter((layerId): layerId is string => Boolean(layerId));

    upsertMapEvidenceArtifact(createMapReportSnapshotEvidenceArtifact({
      title: `${reportHandoffDraft.title} report snapshot`,
      summary: `Report handoff inserted with publication readiness status ${reportHandoffDraft.publicationReadiness.status}.`,
      reportReference: {
        reportInsertId: insert.id,
        reportDraftId: reportHandoffDraft.id,
        snapshotAssetId: reportHandoffDraft.snapshot.assetId,
        sectionIds: insert.sections.map((section) => section.id),
      },
      linkedLayerIds: sourceLayerIds,
      sourceLayerIds,
      qa: mapPublicationReadinessToEvidenceQA(reportHandoffDraft.publicationReadiness),
      metadata: {
        reportEvidenceBlockId: reportHandoffDraft.evidenceBlock.id,
        reportEvidenceBlockVersion: reportHandoffDraft.evidenceBlock.version,
        reportEvidenceLayerCount: reportHandoffDraft.evidenceBlock.payload.composition.layerStack.length,
        reportEvidenceLegendItemCount: reportHandoffDraft.evidenceBlock.payload.composition.legendItems.length,
        publicationReadinessStatus: reportHandoffDraft.publicationReadiness.status,
        readinessBlockerCount: reportHandoffDraft.publicationReadiness.blockers.length,
        readinessWarningCount: reportHandoffDraft.publicationReadiness.warnings.length,
        readinessCaveatCount: reportHandoffDraft.publicationReadiness.caveats.length,
        citationCount: reportHandoffDraft.citations.length,
        reportSectionCount: insert.sections.length,
      },
      createdAt: reportHandoffDraft.createdAt,
    }));

    recordMapReviewEvent({ ...reviewEventInput, id: reviewEventId });
    setReportHandoffSource(null);
    setReportHandoffSnapshot(null);
    toastSuccess(`Added ${insert.sections.length} map report section(s) to the report builder.`);
    announce("Map finding added to report builder");
    window.dispatchEvent(new CustomEvent("synapse:navigate", { detail: { tab: "Report" } }));
  }, [
    announce,
    buildCurrentReviewSnapshot,
    recordMapReviewEvent,
    reportHandoffDraft,
    setReportHandoffSnapshot,
    setReportHandoffSource,
    toastError,
    toastSuccess,
    upsertMapEvidenceArtifact,
  ]);

  return {
    handleDownloadReportHandoffPdf,
    handleInsertReportHandoff,
    handleRegisterReportEvidenceBlock,
  };
}
