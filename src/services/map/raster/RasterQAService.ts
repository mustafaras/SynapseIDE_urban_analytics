/**
 * Prompt 45 — Raster QA assessment.
 * Produces a LayerScientificQAMetadata from GeoTIFF metadata.
 *
 * Rules:
 *   - Missing CRS   → blocked (analysis requires CRS)
 *   - Undeclared noData → warning (stats/rendering may be incorrect)
 *   - Band count > 10 → warning (unusual; flag for review)
 *   - bbox null      → warning (cannot place on map accurately)
 */

import type {
  LayerScientificQAMetadata,
  LayerScientificQACategorySummary,
} from "@/centerpanel/components/map/mapTypes";
import type { GeoTiffMetadata } from "./GeoTiffParser";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

/** Derive a simple signature from metadata. */
function buildSignature(meta: GeoTiffMetadata): string {
  return `raster-qa:${meta.width}x${meta.height}x${meta.bandCount}:${meta.epsgCode ?? "no-crs"}:${meta.noData ?? "no-nodata"}`;
}

/* ------------------------------------------------------------------ */
/*  assessRasterQA                                                      */
/* ------------------------------------------------------------------ */

/**
 * Assess raster QA from GeoTIFF metadata.
 * Never reads pixels — metadata-only assessment.
 */
export function assessRasterQA(
  meta: GeoTiffMetadata,
): LayerScientificQAMetadata {
  const issues: string[] = [];
  const caveats: string[] = [];
  const categorySummaries: LayerScientificQACategorySummary[] = [];

  let overallStatus: LayerScientificQAMetadata["status"] = "passed";

  // --- CRS check ---
  if (!meta.epsgCode) {
    issues.push("raster_missing_crs");
    caveats.push("Raster has no declared CRS; area/distance operations and map overlay accuracy require CRS review.");
    overallStatus = "failed";
    categorySummaries.push({
      category: "crs",
      severity: "blocked",
      issueIds: ["raster_missing_crs"],
      affectedLayerIds: [],
      reasons: ["No EPSG code found in GeoKeyDirectory."],
      recommendedFixes: ["Declare the CRS using the layer inspector or re-export from GIS software with correct projection."],
    });
  } else {
    categorySummaries.push({
      category: "crs",
      severity: "pass",
      issueIds: [],
      affectedLayerIds: [],
      reasons: [],
      recommendedFixes: [],
    });
  }

  // --- noData check ---
  if (meta.noData === null) {
    issues.push("raster_no_nodata");
    caveats.push("GDAL_NODATA is not declared; statistics and rendering assume all pixels are valid data.");
    if (overallStatus === "passed") overallStatus = "warning";
    categorySummaries.push({
      category: "schema",
      severity: "warning",
      issueIds: ["raster_no_nodata"],
      affectedLayerIds: [],
      reasons: ["No GDAL_NODATA metadata tag found in GeoTIFF."],
      recommendedFixes: ["Set a noData value in the layer inspector to ensure statistics exclude fill pixels."],
    });
  } else {
    categorySummaries.push({
      category: "schema",
      severity: "pass",
      issueIds: [],
      affectedLayerIds: [],
      reasons: [],
      recommendedFixes: [],
    });
  }

  // --- Band count check ---
  if (meta.bandCount > 10) {
    issues.push("raster_unusual_band_count");
    caveats.push(`Raster has ${meta.bandCount} bands which is unusual; verify the band assignments are correct.`);
    if (overallStatus === "passed") overallStatus = "warning";
    categorySummaries.push({
      category: "schema",
      severity: "warning",
      issueIds: ["raster_unusual_band_count"],
      affectedLayerIds: [],
      reasons: [`Band count ${meta.bandCount} is higher than typical (>10).`],
      recommendedFixes: ["Verify band assignments and remove any unnecessary bands before analysis."],
    });
  }

  // --- bbox check ---
  if (!meta.bbox) {
    issues.push("raster_missing_bbox");
    caveats.push("Raster has no geographic bounding box; map placement may be inaccurate.");
    if (overallStatus === "passed") overallStatus = "warning";
    categorySummaries.push({
      category: "crs",
      severity: "warning",
      issueIds: ["raster_missing_bbox"],
      affectedLayerIds: [],
      reasons: ["ModelTiepoint or ModelPixelScale tags are absent."],
      recommendedFixes: ["Re-export the raster with proper geo-referencing."],
    });
  }

  const badges: LayerScientificQAMetadata["badges"] = [];
  if (issues.includes("raster_missing_crs")) badges.push("missing_crs");

  return {
    status: overallStatus as LayerScientificQAMetadata["status"],
    issueIds: issues,
    badges,
    checkedAt: nowIso(),
    featureIssueCount: 0,
    usedWorker: false,
    caveats,
    categorySummaries,
    signature: buildSignature(meta),
  };
}
