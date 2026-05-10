import type { RasterTile } from "@/engine/geoai/cv";
import { cogRead } from "@/services/data/connectors/COGReader";
import type { BBox, COGMetadata, PixelWindow } from "@/services/data/connectors/types";
import type { EOSourceRecord } from "./types";

export const DEFAULT_LAND_COVER_BOUNDS: readonly [number, number, number, number] = [28.954, 41.015, 29.022, 41.062];

export type EOSourceAnalysisValidationState = "reference-validated" | "unvalidated";

export interface EOSourceAnalysisState {
  ready: boolean;
  reason?: string;
  notes: string[];
}

export interface ResolvedEOSourceAnalysis {
  source: EOSourceRecord;
  raster: RasterTile;
  bounds: BBox;
  validationState: EOSourceAnalysisValidationState;
  notes: string[];
  groundTruth?: Uint8Array;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveClass(row: number, column: number, width: number, height: number) {
  let klass = 1;

  if (row < Math.round(height * 0.24) && column > Math.round(width * 0.6)) {
    klass = 2;
  } else if (row > Math.round(height * 0.58) && column > Math.round(width * 0.54)) {
    klass = 5;
  } else if (
    row > Math.round(height * 0.28) &&
    row < Math.round(height * 0.7) &&
    column > Math.round(width * 0.18) &&
    column < Math.round(width * 0.48)
  ) {
    klass = 0;
  }

  if (
    row > Math.round(height * 0.18) &&
    row < Math.round(height * 0.42) &&
    column > Math.round(width * 0.64) &&
    column < Math.round(width * 0.84)
  ) {
    klass = 3;
  }

  const roadCenter = column * 0.58 + 6;
  if (Math.abs(row - roadCenter) <= 1.5) {
    klass = 4;
  }

  return klass;
}

function classMeans(classIndex: number): [number, number, number, number] {
  switch (classIndex) {
    case 0:
      return [0.52, 0.54, 0.59, 0.41];
    case 1:
      return [0.14, 0.44, 0.21, 0.88];
    case 2:
      return [0.18, 0.29, 0.22, 0.08];
    case 3:
      return [0.58, 0.49, 0.42, 0.28];
    case 4:
      return [0.43, 0.43, 0.44, 0.33];
    case 5:
      return [0.24, 0.49, 0.29, 0.68];
    default:
      return [0.3, 0.3, 0.3, 0.3];
  }
}

export function createDemoLandCoverScene(width = 48, height = 48): {
  raster: RasterTile;
  groundTruth: Uint8Array;
  bounds: readonly [number, number, number, number];
} {
  const pixelCount = width * height;
  const bandCount = 4;
  const data = new Float32Array(bandCount * pixelCount);
  const groundTruth = new Uint8Array(pixelCount);
  const noise = mulberry32(42);

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const pixelIndex = row * width + column;
      const classIndex = resolveClass(row, column, width, height);
      const [blue, green, red, nir] = classMeans(classIndex);
      groundTruth[pixelIndex] = classIndex;

      const jitter = () => (noise() - 0.5) * 0.09;
      data[pixelIndex] = clamp01(blue + jitter());
      data[pixelCount + pixelIndex] = clamp01(green + jitter());
      data[pixelCount * 2 + pixelIndex] = clamp01(red + jitter());
      data[pixelCount * 3 + pixelIndex] = clamp01(nir + jitter());
    }
  }

  return {
    raster: {
      data,
      bands: bandCount,
      height,
      width,
    },
    groundTruth,
    bounds: DEFAULT_LAND_COVER_BOUNDS,
  };
}

export function computeCogWindowBBox(metadata: COGMetadata, window: PixelWindow): BBox {
  const [originX, pixelWidth, , originY, , pixelHeight] = metadata.transform;
  const [windowX, windowY, width, height] = window;
  const west = originX + windowX * pixelWidth;
  const east = originX + (windowX + width) * pixelWidth;
  const north = originY + windowY * pixelHeight;
  const south = originY + (windowY + height) * pixelHeight;
  return [
    Math.min(west, east),
    Math.min(south, north),
    Math.max(west, east),
    Math.max(south, north),
  ];
}

function defaultCogWindow(metadata: COGMetadata): PixelWindow {
  return [
    0,
    0,
    Math.max(1, Math.min(48, metadata.width)),
    Math.max(1, Math.min(48, metadata.height)),
  ];
}

function normalizeBandsToRaster(data: Float64Array[], width: number, height: number): RasterTile {
  const pixelCount = width * height;
  const bandCount = data.length;
  const values = new Float32Array(pixelCount * bandCount);

  data.forEach((band, bandIndex) => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (let pixelIndex = 0; pixelIndex < band.length; pixelIndex += 1) {
      const value = band[pixelIndex];
      if (!Number.isFinite(value)) {
        continue;
      }
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }

    const span = Number.isFinite(min) && Number.isFinite(max) && max > min ? max - min : 1;
    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
      const value = band[pixelIndex] ?? 0;
      const normalized = Number.isFinite(value) ? (value - min) / span : 0;
      values[bandIndex * pixelCount + pixelIndex] = clamp01(normalized);
    }
  });

  return {
    data: values,
    bands: bandCount,
    width,
    height,
  };
}

function buildPayloadNotes(source: EOSourceRecord, bandCount: number): string[] {
  const notes = [`${source.provider} ${source.kind} source normalized band-by-band before inference.`];
  if (bandCount < 3) {
    notes.push("Reduced-band raster: classification runs with fewer than three observed bands.");
  }
  if (bandCount > 4) {
    notes.push("Only the first four observed bands are used by the current land-cover inference path.");
  }
  return notes;
}

function resolvePayloadBands(requested: Float64Array[]): Float64Array[] {
  if (requested.length <= 4) {
    return requested;
  }
  return requested.slice(0, 4);
}

async function resolveCogSource(source: EOSourceRecord): Promise<ResolvedEOSourceAnalysis> {
  if (source.analysisRaster) {
    const bands = resolvePayloadBands(source.analysisRaster.data);
    return {
      source,
      raster: normalizeBandsToRaster(bands, source.analysisRaster.width, source.analysisRaster.height),
      bounds: source.analysisRaster.bbox,
      validationState: "unvalidated",
      notes: buildPayloadNotes(source, bands.length),
    };
  }

  if (!source.cogMetadata || !source.provenance.sourceUrl) {
    throw new Error("COG source does not retain metadata or a source URL for analysis.");
  }

  const window = defaultCogWindow(source.cogMetadata);
  const read = await cogRead({
    url: source.provenance.sourceUrl,
    window,
    bands: Array.from({ length: Math.min(4, source.cogMetadata.bandCount) }, (_, index) => index + 1),
  });
  const bands = resolvePayloadBands(read.data);
  return {
    source,
    raster: normalizeBandsToRaster(bands, read.width, read.height),
    bounds: computeCogWindowBBox(source.cogMetadata, window),
    validationState: "unvalidated",
    notes: buildPayloadNotes(source, bands.length),
  };
}

export function getEOSourceAnalysisState(source: EOSourceRecord | null): EOSourceAnalysisState {
  if (!source) {
    return {
      ready: false,
      reason: "Select a raster source or switch to demo mode before running land-cover classification.",
      notes: [],
    };
  }

  if (source.runtimeState === "loading") {
    return {
      ready: false,
      reason: "The selected EO source is still loading.",
      notes: [],
    };
  }
  if (source.runtimeState === "failed") {
    return {
      ready: false,
      reason: source.errorMessage ?? "The selected EO source failed and cannot be analyzed.",
      notes: [],
    };
  }
  if (source.runtimeState === "credential-missing") {
    return {
      ready: false,
      reason: source.errorMessage ?? "The selected EO source requires credentials before it can be analyzed.",
      notes: [],
    };
  }
  if (source.kind === "stac-item") {
    return {
      ready: false,
      reason: "Catalog items are metadata only. Inspect a COG asset or run a Sentinel process before analysis.",
      notes: [],
    };
  }
  if (source.kind === "imported-raster" && !source.analysisRaster) {
    return {
      ready: false,
      reason: "The imported raster is registered without an analysis-ready raster payload.",
      notes: [],
    };
  }
  if (source.kind === "sentinel-process" && !source.analysisRaster) {
    return {
      ready: false,
      reason: "The Sentinel process output summary is present, but the raster payload was not retained for analysis.",
      notes: [],
    };
  }
  if (source.kind === "cog-asset" && !source.analysisRaster && (!source.cogMetadata || !source.provenance.sourceUrl)) {
    return {
      ready: false,
      reason: "The selected COG source is missing metadata or a retrievable URL.",
      notes: [],
    };
  }

  return {
    ready: true,
    notes: source.provenance.isDemo
      ? ["Demo mode keeps the existing synthetic reference labels and validation metrics."]
      : ["Real-source mode runs against the selected raster source without a synthetic fallback."],
  };
}

export async function resolveEOSourceAnalysis(source: EOSourceRecord): Promise<ResolvedEOSourceAnalysis> {
  const state = getEOSourceAnalysisState(source);
  if (!state.ready) {
    throw new Error(state.reason ?? "The selected source is not analysis-ready.");
  }

  if (source.kind === "demo-raster") {
    const scene = createDemoLandCoverScene();
    return {
      source,
      raster: scene.raster,
      bounds: [...scene.bounds] as BBox,
      validationState: "reference-validated",
      groundTruth: scene.groundTruth,
      notes: ["Demo mode uses the built-in multispectral sample scene with reference labels."],
    };
  }

  if (source.kind === "cog-asset") {
    return resolveCogSource(source);
  }

  if (!source.analysisRaster) {
    throw new Error("The selected source does not expose an analysis-ready raster payload.");
  }

  const bands = resolvePayloadBands(source.analysisRaster.data);
  return {
    source,
    raster: normalizeBandsToRaster(bands, source.analysisRaster.width, source.analysisRaster.height),
    bounds: source.analysisRaster.bbox,
    validationState: "unvalidated",
    notes: buildPayloadNotes(source, bands.length),
  };
}
