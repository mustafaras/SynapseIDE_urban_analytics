/**
 * COGReader — Cloud Optimized GeoTIFF reader.
 *
 * Reads metadata and pixel windows from Cloud Optimized GeoTIFF files
 * using HTTP range requests — no full download needed.
 *
 * COG structure refresher:
 *   - TIFF header + IFDs (Image File Directories) at the start
 *   - Overviews stored as additional IFDs
 *   - Tiles stored at known byte offsets → readable via Range header
 *
 * Implementation notes:
 *   - Metadata is read by fetching the initial TIFF header + IFDs
 *   - Tile / window reads use derived byte offsets from the IFD tile index
 *   - Retry with exponential back-off for transient failures
 *   - AbortSignal forwarded to every fetch
 */

import {
  type BBox,
  type COGMetadata,
  type COGReadParams,
  type COGReadResult,
  DEFAULT_RETRY,
  type PixelWindow,
  type RetryConfig,
} from './types';

// ---------------------------------------------------------------------------
// Byte-level constants for TIFF parsing
// ---------------------------------------------------------------------------

const TIFF_LE = 0x4949; // "II" — little-endian
const TIFF_BE = 0x4d4d; // "MM" — big-endian
const BIGTIFF_MARKER = 43;
const CLASSIC_TIFF_MARKER = 42;

// TIFF tag IDs we need
const TAG = {
  ImageWidth: 256,
  ImageLength: 257,
  BitsPerSample: 258,
  Compression: 259,
  SamplesPerPixel: 277,
  TileWidth: 322,
  TileLength: 323,
  TileOffsets: 324,
  TileByteCounts: 325,
  SampleFormat: 339,
  ModelTiepoint: 33922,
  ModelPixelScale: 33550,
  GeoKeyDirectory: 34735,
  GDALNoData: 42113,
} as const;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

function backoffDelay(attempt: number, cfg: RetryConfig): number {
  const exp = Math.min(cfg.baseDelayMs * 2 ** attempt, cfg.maxDelayMs);
  return Math.round(Math.random() * exp);
}

/** Fetch a byte range with retry. */
async function fetchRange(
  url: string,
  start: number,
  end: number,
  signal: AbortSignal | undefined,
  cfg: RetryConfig,
): Promise<ArrayBuffer> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    let res: Response | undefined;
    try {
      const requestInit: RequestInit = {
        headers: { Range: `bytes=${start}-${end}` },
      };
      if (signal) {
        requestInit.signal = signal;
      }
      res = await fetch(url, requestInit);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      lastError = err;
      if (attempt < cfg.maxRetries) {
        await sleep(backoffDelay(attempt, cfg), signal);
      }
      continue;
    }
    if (res.ok || res.status === 206) return res.arrayBuffer();
    if (!cfg.retryableStatuses.includes(res.status)) {
      throw new Error(`COG HTTP ${res.status}: ${res.statusText} — ${url}`);
    }
    lastError = new Error(`COG HTTP ${res.status}`);
    if (attempt < cfg.maxRetries) {
      await sleep(backoffDelay(attempt, cfg), signal);
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// DataView helpers respecting endian order
// ---------------------------------------------------------------------------

type Endian = 'LE' | 'BE';

function u16(dv: DataView, off: number, e: Endian): number {
  return dv.getUint16(off, e === 'LE');
}
function u32(dv: DataView, off: number, e: Endian): number {
  return dv.getUint32(off, e === 'LE');
}
function u64(dv: DataView, off: number, e: Endian): number {
  // JavaScript doesn't support real u64; use BigInt → Number (safe up to 2^53)
  const lo = e === 'LE'
    ? dv.getUint32(off, true) + dv.getUint32(off + 4, true) * 0x100000000
    : dv.getUint32(off, false) * 0x100000000 + dv.getUint32(off + 4, false);
  return lo;
}
function f64(dv: DataView, off: number, e: Endian): number {
  return dv.getFloat64(off, e === 'LE');
}

// ---------------------------------------------------------------------------
// IFD tag entry reading
// ---------------------------------------------------------------------------

interface IFDEntry {
  tag: number;
  type: number;
  count: number;
  valueOffset: number; // byte offset to value (or inline if fits)
}

interface IFDInfo {
  entries: Map<number, IFDEntry>;
  nextIFDOffset: number;
}

/** Size in bytes per TIFF type code. */
const TYPE_SIZE: Record<number, number> = {
  1: 1,  // BYTE
  2: 1,  // ASCII
  3: 2,  // SHORT
  4: 4,  // LONG
  5: 8,  // RATIONAL
  6: 1,  // SBYTE
  7: 1,  // UNDEFINED
  8: 2,  // SSHORT
  9: 4,  // SLONG
  10: 8, // SRATIONAL
  11: 4, // FLOAT
  12: 8, // DOUBLE
  16: 8, // LONG8 (BigTIFF)
};

function readClassicIFD(dv: DataView, offset: number, e: Endian): IFDInfo {
  const count = u16(dv, offset, e);
  const entries = new Map<number, IFDEntry>();
  let pos = offset + 2;
  for (let i = 0; i < count; i++) {
    const tag = u16(dv, pos, e);
    const type = u16(dv, pos + 2, e);
    const cnt = u32(dv, pos + 4, e);
    const valueSize = cnt * (TYPE_SIZE[type] ?? 1);
    const valueOffset = valueSize <= 4 ? pos + 8 : u32(dv, pos + 8, e);
    entries.set(tag, { tag, type, count: cnt, valueOffset });
    pos += 12;
  }
  const nextIFDOffset = u32(dv, pos, e);
  return { entries, nextIFDOffset };
}

function readBigTIFFIFD(dv: DataView, offset: number, e: Endian): IFDInfo {
  const count = u64(dv, offset, e);
  const entries = new Map<number, IFDEntry>();
  let pos = offset + 8;
  for (let i = 0; i < count; i++) {
    const tag = u16(dv, pos, e);
    const type = u16(dv, pos + 2, e);
    const cnt = u64(dv, pos + 4, e);
    const valueSize = cnt * (TYPE_SIZE[type] ?? 1);
    const valueOffset = valueSize <= 8 ? pos + 12 : u64(dv, pos + 12, e);
    entries.set(tag, { tag, type, count: cnt, valueOffset });
    pos += 20;
  }
  const nextIFDOffset = u64(dv, pos, e);
  return { entries, nextIFDOffset };
}

// ---------------------------------------------------------------------------
// Value extraction from IFD entries
// ---------------------------------------------------------------------------

function getU32Value(dv: DataView, entry: IFDEntry, e: Endian): number {
  if (entry.type === 3) return u16(dv, entry.valueOffset, e);
  return u32(dv, entry.valueOffset, e);
}

function getU32Array(
  dv: DataView,
  entry: IFDEntry,
  e: Endian,
  isBig: boolean,
): number[] {
  const arr: number[] = [];
  const step = isBig && entry.type === 16 ? 8 : entry.type === 3 ? 2 : 4;
  for (let i = 0; i < entry.count; i++) {
    const off = entry.valueOffset + i * step;
    if (step === 8) arr.push(u64(dv, off, e));
    else if (step === 2) arr.push(u16(dv, off, e));
    else arr.push(u32(dv, off, e));
  }
  return arr;
}

function getF64Array(dv: DataView, entry: IFDEntry, e: Endian): number[] {
  const arr: number[] = [];
  for (let i = 0; i < entry.count; i++) {
    arr.push(f64(dv, entry.valueOffset + i * 8, e));
  }
  return arr;
}

function getASCII(dv: DataView, entry: IFDEntry): string {
  let s = '';
  for (let i = 0; i < entry.count; i++) {
    const c = dv.getUint8(entry.valueOffset + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Metadata extraction from IFDs
// ---------------------------------------------------------------------------

interface ParsedIFD {
  width: number;
  height: number;
  bandCount: number;
  bitsPerSample: number;
  sampleFormat: number;
  compression: number;
  tileWidth: number;
  tileHeight: number;
  tileOffsets: number[];
  tileByteCounts: number[];
  modelTiepoint: number[];
  modelPixelScale: number[];
  geoKeys: number[];
  noDataStr: string;
}

function parseIFD(
  dv: DataView,
  ifd: IFDInfo,
  e: Endian,
  isBig: boolean,
): ParsedIFD {
  const ent = ifd.entries;
  const g = (tag: number) => ent.get(tag);

  const widthE = g(TAG.ImageWidth);
  const heightE = g(TAG.ImageLength);
  const bpsE = g(TAG.BitsPerSample);
  const compE = g(TAG.Compression);
  const sppE = g(TAG.SamplesPerPixel);
  const twE = g(TAG.TileWidth);
  const thE = g(TAG.TileLength);
  const toE = g(TAG.TileOffsets);
  const tcE = g(TAG.TileByteCounts);
  const sfE = g(TAG.SampleFormat);
  const mtE = g(TAG.ModelTiepoint);
  const mpE = g(TAG.ModelPixelScale);
  const gkE = g(TAG.GeoKeyDirectory);
  const ndE = g(TAG.GDALNoData);

  return {
    width: widthE ? getU32Value(dv, widthE, e) : 0,
    height: heightE ? getU32Value(dv, heightE, e) : 0,
    bandCount: sppE ? getU32Value(dv, sppE, e) : 1,
    bitsPerSample: bpsE ? getU32Value(dv, bpsE, e) : 8,
    sampleFormat: sfE ? getU32Value(dv, sfE, e) : 1,
    compression: compE ? getU32Value(dv, compE, e) : 1,
    tileWidth: twE ? getU32Value(dv, twE, e) : 0,
    tileHeight: thE ? getU32Value(dv, thE, e) : 0,
    tileOffsets: toE ? getU32Array(dv, toE, e, isBig) : [],
    tileByteCounts: tcE ? getU32Array(dv, tcE, e, isBig) : [],
    modelTiepoint: mtE ? getF64Array(dv, mtE, e) : [],
    modelPixelScale: mpE ? getF64Array(dv, mpE, e) : [],
    geoKeys: gkE ? getU32Array(dv, gkE, e, isBig) : [],
    noDataStr: ndE ? getASCII(dv, ndE) : '',
  };
}

function dtypeLabel(bps: number, sf: number): string {
  const unsigned = sf === 1 || sf === 0;
  const signed = sf === 2;
  if (sf === 3) {
    if (bps === 32) return 'float32';
    if (bps === 64) return 'float64';
  }
  if (unsigned) {
    if (bps === 8) return 'uint8';
    if (bps === 16) return 'uint16';
    if (bps === 32) return 'uint32';
  }
  if (signed) {
    if (bps === 8) return 'int8';
    if (bps === 16) return 'int16';
    if (bps === 32) return 'int32';
  }
  return `unknown(${bps}bit,sf${sf})`;
}

function deriveTransform(
  tp: number[],
  ps: number[],
): [number, number, number, number, number, number] {
  // ModelTiepoint: [i, j, k, x, y, z] (at least 6 values)
  // ModelPixelScale: [scaleX, scaleY, scaleZ]
  if (tp.length >= 6 && ps.length >= 2) {
    const originX = tp[3] - tp[0] * ps[0];
    const originY = tp[4] + tp[1] * ps[1];
    return [originX, ps[0], 0, originY, 0, -ps[1]];
  }
  return [0, 1, 0, 0, 0, -1];
}

function deriveBBox(
  transform: [number, number, number, number, number, number],
  w: number,
  h: number,
): BBox {
  const [ox, px, , oy, , py] = transform;
  const x0 = ox;
  const y0 = oy;
  const x1 = ox + w * px;
  const y1 = oy + h * py; // py is negative
  return [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
}

function deriveCRS(geoKeys: number[]): string {
  // GeoKeyDirectory: [keyDirVersion, keyRevision, minorRevision, numKeys,
  //                    key, location, count, valueOffset, ...]
  // We look for GeographicTypeGeoKey (2048) or ProjectedCSTypeGeoKey (3072).
  if (geoKeys.length >= 4) {
    const numKeys = geoKeys[3];
    for (let i = 0; i < numKeys; i++) {
      const base = 4 + i * 4;
      const key = geoKeys[base];
      const value = geoKeys[base + 3];
      if (key === 3072 && value) return `EPSG:${value}`;
      if (key === 2048 && value) return `EPSG:${value}`;
    }
  }
  return 'EPSG:4326';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface COGReaderOptions {
  retry?: Partial<RetryConfig>;
  /** Initial header fetch size in bytes (default 64 KB) */
  headerBytes?: number;
}

/**
 * Read COG metadata (IFDs, CRS, transform, dimensions, overviews) via HTTP
 * range requests.
 */
export async function cogMetadata(
  url: string,
  opts: COGReaderOptions & { signal?: AbortSignal } = {},
): Promise<COGMetadata> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
  const headerSize = opts.headerBytes ?? 65_536;

  const buf = await fetchRange(url, 0, headerSize - 1, opts.signal, cfg);
  const dv = new DataView(buf);

  // Detect endianness
  const bom = dv.getUint16(0, false);
  let endian: Endian;
  if (bom === TIFF_LE) endian = 'LE';
  else if (bom === TIFF_BE) endian = 'BE';
  else throw new Error('Not a TIFF file');

  const marker = u16(dv, 2, endian);
  const isBig = marker === BIGTIFF_MARKER;
  if (marker !== CLASSIC_TIFF_MARKER && !isBig) {
    throw new Error(`Unsupported TIFF version marker: ${marker}`);
  }

  // First IFD offset
  let ifdOffset: number;
  if (isBig) {
    // BigTIFF: bytes 4-5 = bytesize of offsets (8), then 8-byte first IFD
    ifdOffset = u64(dv, 8, endian);
  } else {
    ifdOffset = u32(dv, 4, endian);
  }

  // Read IFDs (full-res + overviews)
  const ifds: IFDInfo[] = [];
  while (ifdOffset > 0 && ifdOffset < buf.byteLength - 2) {
    const ifd = isBig
      ? readBigTIFFIFD(dv, ifdOffset, endian)
      : readClassicIFD(dv, ifdOffset, endian);
    ifds.push(ifd);
    ifdOffset = ifd.nextIFDOffset;
    if (ifds.length > 32) break; // safety cap
  }

  if (ifds.length === 0) throw new Error('No IFD found in TIFF header');

  const primary = parseIFD(dv, ifds[0], endian, isBig);
  const transform = deriveTransform(primary.modelTiepoint, primary.modelPixelScale);
  const noDataVal = primary.noDataStr ? parseFloat(primary.noDataStr) : null;

  return {
    width: primary.width,
    height: primary.height,
    bandCount: primary.bandCount,
    dtype: dtypeLabel(primary.bitsPerSample, primary.sampleFormat),
    compression: primary.compression,
    crs: deriveCRS(primary.geoKeys),
    transform,
    bbox: deriveBBox(transform, primary.width, primary.height),
    overviewCount: Math.max(0, ifds.length - 1),
    tileSize: [primary.tileWidth || 256, primary.tileHeight || 256],
    noData: Array.from({ length: primary.bandCount }, () =>
      Number.isFinite(noDataVal) ? noDataVal : null,
    ),
  };
}

/**
 * Read a pixel window from a COG tile.
 *
 * For simplicity, this fetches the tiles that intersect the requested window
 * and assembles them into the output buffer. If no window is specified the
 * first tile is returned (useful for quick previews).
 */
export async function cogRead(
  params: COGReadParams,
  opts: COGReaderOptions = {},
): Promise<COGReadResult> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
  const headerSize = opts.headerBytes ?? 65_536;

  // --- Read header to get tile index ---
  const buf = await fetchRange(params.url, 0, headerSize - 1, params.signal, cfg);
  const dv = new DataView(buf);

  const bom = dv.getUint16(0, false);
  const endian: Endian = bom === TIFF_LE ? 'LE' : 'BE';
  const marker = u16(dv, 2, endian);
  const isBig = marker === BIGTIFF_MARKER;

  let ifdOffset = isBig ? u64(dv, 8, endian) : u32(dv, 4, endian);

  // Navigate to the requested overview
  const targetLevel = params.overviewLevel ?? 0;
  let ifd: IFDInfo | null = null;
  let level = 0;
  while (ifdOffset > 0 && ifdOffset < buf.byteLength - 2) {
    ifd = isBig
      ? readBigTIFFIFD(dv, ifdOffset, endian)
      : readClassicIFD(dv, ifdOffset, endian);
    if (level === targetLevel) break;
    ifdOffset = ifd.nextIFDOffset;
    level++;
    if (level > 32) break;
  }

  if (!ifd) throw new Error('Could not locate target IFD');
  const parsed = parseIFD(dv, ifd, endian, isBig);

  if (parsed.tileOffsets.length === 0) {
    throw new Error('No tile offsets found — file may not be tiled (not a COG)');
  }

  if (parsed.compression !== 1) {
    throw new Error(
      `COG sample reads currently support uncompressed tiles only (compression=${parsed.compression})`,
    );
  }

  const tw = parsed.tileWidth || 256;
  const th = parsed.tileHeight || 256;
  const bps = parsed.bitsPerSample;
  const bands = params.bands ?? Array.from({ length: parsed.bandCount }, (_, i) => i + 1);
  const totalBands = parsed.bandCount;

  // Determine window
  const window: PixelWindow = params.window ?? [0, 0, tw, th];
  const [wx, wy, ww, wh] = window;

  // Tile grid dimensions
  const tilesAcross = Math.ceil(parsed.width / tw);

  // Find which tiles we need
  const tileXStart = Math.floor(wx / tw);
  const tileYStart = Math.floor(wy / th);
  const tileXEnd = Math.ceil((wx + ww) / tw);
  const tileYEnd = Math.ceil((wy + wh) / th);

  // Output buffers — one per requested band
  const out: Float64Array[] = bands.map(() => new Float64Array(ww * wh));

  // Fetch tiles and assemble
  for (let ty = tileYStart; ty < tileYEnd; ty++) {
    for (let tx = tileXStart; tx < tileXEnd; tx++) {
      const tileIdx = ty * tilesAcross + tx;
      if (tileIdx >= parsed.tileOffsets.length) continue;

      const tileOff = parsed.tileOffsets[tileIdx];
      const tileLen = parsed.tileByteCounts[tileIdx];
      if (tileOff === 0 || tileLen === 0) continue;

      const tileBuf = await fetchRange(
        params.url,
        tileOff,
        tileOff + tileLen - 1,
        params.signal,
        cfg,
      );

      const tileDv = new DataView(tileBuf);
      const bytesPerSample = bps / 8;
      const pixelsPerTile = tw * th;

      // Copy relevant pixels into output
      for (let bi = 0; bi < bands.length; bi++) {
        const bandIdx = bands[bi] - 1; // 0-based
        const bandOffset = bandIdx * pixelsPerTile * bytesPerSample;

        for (let py = 0; py < th; py++) {
          const globalY = ty * th + py;
          const outY = globalY - wy;
          if (outY < 0 || outY >= wh) continue;

          for (let px = 0; px < tw; px++) {
            const globalX = tx * tw + px;
            const outX = globalX - wx;
            if (outX < 0 || outX >= ww) continue;

            const tilePixelIdx = py * tw + px;
            const bytePos = bandOffset + tilePixelIdx * bytesPerSample;
            if (bytePos + bytesPerSample > tileBuf.byteLength) continue;

            let val: number;
            if (totalBands > 1) {
              // Band-interleaved by pixel or band-sequential — assume BSQ
              val = readSample(tileDv, bytePos, bps, parsed.sampleFormat, endian);
            } else {
              val = readSample(tileDv, tilePixelIdx * bytesPerSample, bps, parsed.sampleFormat, endian);
            }

            out[bi][outY * ww + outX] = val;
          }
        }
      }
    }
  }

  const transform = deriveTransform(parsed.modelTiepoint, parsed.modelPixelScale);
  const metadata: COGMetadata = {
    width: parsed.width,
    height: parsed.height,
    bandCount: parsed.bandCount,
    dtype: dtypeLabel(bps, parsed.sampleFormat),
    compression: parsed.compression,
    crs: deriveCRS(parsed.geoKeys),
    transform,
    bbox: deriveBBox(transform, parsed.width, parsed.height),
    overviewCount: 0,
    tileSize: [tw, th],
    noData: Array.from({ length: parsed.bandCount }, () => {
      const v = parsed.noDataStr ? parseFloat(parsed.noDataStr) : null;
      return Number.isFinite(v) ? v : null;
    }),
  };

  return { data: out, width: ww, height: wh, metadata };
}

/** Read a single sample value from a DataView. */
function readSample(
  dv: DataView,
  off: number,
  bps: number,
  sampleFormat: number,
  endian: Endian,
): number {
  const le = endian === 'LE';
  if (sampleFormat === 3) {
    // IEEE float
    if (bps === 32) return dv.getFloat32(off, le);
    if (bps === 64) return dv.getFloat64(off, le);
  }
  if (sampleFormat === 2) {
    // Signed integer
    if (bps === 8) return dv.getInt8(off);
    if (bps === 16) return dv.getInt16(off, le);
    if (bps === 32) return dv.getInt32(off, le);
  }
  // Unsigned integer (default)
  if (bps === 8) return dv.getUint8(off);
  if (bps === 16) return dv.getUint16(off, le);
  if (bps === 32) return dv.getUint32(off, le);
  return 0;
}

/**
 * Convenience: read a geographic sub-region by converting geo-coords
 * to pixel coordinates using the raster transform.
 */
export async function cogReadBBox(
  url: string,
  bbox: BBox,
  opts: COGReaderOptions & { signal?: AbortSignal; bands?: number[] } = {},
): Promise<COGReadResult> {
  const meta = await cogMetadata(url, opts);
  const [ox, px, , oy, , py] = meta.transform;

  // Convert bbox [west, south, east, north] to pixel window
  const x0 = Math.max(0, Math.floor((bbox[0] - ox) / px));
  const y0 = Math.max(0, Math.floor((bbox[3] - oy) / py)); // py is negative
  const x1 = Math.min(meta.width, Math.ceil((bbox[2] - ox) / px));
  const y1 = Math.min(meta.height, Math.ceil((bbox[1] - oy) / py));

  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);

  return cogRead(
    {
      url,
      window: [x0, y0, w, h],
      ...(opts.bands ? { bands: opts.bands } : {}),
      ...(opts.signal ? { signal: opts.signal } : {}),
    },
    opts,
  );
}
