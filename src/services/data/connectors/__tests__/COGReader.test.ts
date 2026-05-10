/**
 * COGReader — integration tests with synthetic TIFF buffers.
 *
 * Tests:
 *   • cogMetadata — dimensions, CRS, transform, overviews, noData
 *   • cogRead — tile fetch + pixel assembly
 *   • cogReadBBox — geo → pixel conversion
 *   • BigTIFF header detection
 *   • Error handling: non-TIFF, missing tiles, bad marker
 *   • Retry on transient 503
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cogMetadata, cogRead, cogReadBBox } from '../COGReader';

// ---------------------------------------------------------------------------
// Helpers to build synthetic Classic TIFF bytes
// ---------------------------------------------------------------------------

/**
 * Builds a minimal Classic TIFF (little-endian) ArrayBuffer with one IFD.
 *
 * Layout:
 *   bytes  0-1:  "II" (little-endian BOM)
 *   bytes  2-3:  42  (classic marker)
 *   bytes  4-7:  first IFD offset → 8
 *   bytes  8...: IFD entries + tag values
 *
 * Supported tags: ImageWidth, ImageLength, BitsPerSample, SamplesPerPixel,
 * TileWidth, TileLength, TileOffsets, TileByteCounts, ModelPixelScale,
 * ModelTiepoint, GeoKeyDirectory, GDALNoData, SampleFormat, Compression.
 */
function buildClassicTIFF(opts: {
  width: number;
  height: number;
  bitsPerSample?: number;
  sampleFormat?: number;
  bandCount?: number;
  tileWidth?: number;
  tileHeight?: number;
  /** Tile payload (raw bytes); if omitted, tiles are zeroed */
  tilePayload?: Uint8Array;
  /** Model pixel scale [scaleX, scaleY, scaleZ] */
  pixelScale?: [number, number, number];
  /** Model tiepoint [i, j, k, x, y, z] */
  tiepoint?: [number, number, number, number, number, number];
  /** EPSG code to embed in GeoKeyDirectory */
  epsg?: number;
  /** NoData string */
  noData?: string;
  /** Whether to add a second (overview) IFD */
  addOverview?: boolean;
}): ArrayBuffer {
  const bps = opts.bitsPerSample ?? 8;
  const sf = opts.sampleFormat ?? 1;
  const bands = opts.bandCount ?? 1;
  const tw = opts.tileWidth ?? 256;
  const th = opts.tileHeight ?? 256;
  const bytesPerSample = bps / 8;

  // Tile data
  const tilesAcross = Math.ceil(opts.width / tw);
  const tilesDown = Math.ceil(opts.height / th);
  const tileCount = tilesAcross * tilesDown;
  const tileSize = tw * th * bytesPerSample * bands;

  // We'll place tile data after the header.
  // Calculate IFD entries needed — let's count tags.
  const tags: Array<{ tag: number; type: number; count: number; value: number }> = [];

  // We'll collect extra value blobs that don't fit inline
  // Tags (type 3 = SHORT, type 4 = LONG, type 5 = RATIONAL, type 12 = DOUBLE)
  tags.push({ tag: 256, type: 3, count: 1, value: opts.width });     // ImageWidth
  tags.push({ tag: 257, type: 3, count: 1, value: opts.height });    // ImageLength
  tags.push({ tag: 258, type: 3, count: 1, value: bps });            // BitsPerSample
  tags.push({ tag: 259, type: 3, count: 1, value: 1 });              // Compression = none
  tags.push({ tag: 277, type: 3, count: 1, value: bands });          // SamplesPerPixel
  tags.push({ tag: 322, type: 3, count: 1, value: tw });             // TileWidth
  tags.push({ tag: 323, type: 3, count: 1, value: th });             // TileLength
  tags.push({ tag: 339, type: 3, count: 1, value: sf });             // SampleFormat

  // Now for variable-length tags, record a placeholder and we'll fix up offsets later.
  // These include: TileOffsets, TileByteCounts, ModelPixelScale, ModelTiepoint, GeoKeyDir, GDALNoData

  // We'll use a simple two-pass approach:
  // Pass 1: count tags and measure IFD size
  // Pass 2: write everything into an ArrayBuffer

  // ---- IFD layout ----
  // Header: 8 bytes
  // IFD: 2 (count) + nTags*12 + 4 (nextIFD)
  // After IFD: overflow value blobs
  // After blobs: tile data

  const nFixedTags = tags.length; // 8 fixed inline tags
  const varTags: Array<{
    tag: number;
    type: number;
    count: number;
    data: Uint8Array;
  }> = [];

  // TileOffsets (tag 324, type 4/LONG) — we'll fill actual offsets after layout
  const tileOffsetsData = new Uint8Array(tileCount * 4);
  varTags.push({ tag: 324, type: 4, count: tileCount, data: tileOffsetsData });

  // TileByteCounts (tag 325, type 4/LONG)
  const tileByteCountsData = new Uint8Array(tileCount * 4);
  const tcDv = new DataView(tileByteCountsData.buffer);
  for (let i = 0; i < tileCount; i++) tcDv.setUint32(i * 4, tileSize, true);
  varTags.push({ tag: 325, type: 4, count: tileCount, data: tileByteCountsData });

  // ModelPixelScale (tag 33550, type 12/DOUBLE)
  if (opts.pixelScale) {
    const buf = new Uint8Array(24);
    const dv = new DataView(buf.buffer);
    opts.pixelScale.forEach((v, i) => dv.setFloat64(i * 8, v, true));
    varTags.push({ tag: 33550, type: 12, count: 3, data: buf });
  }

  // ModelTiepoint (tag 33922, type 12/DOUBLE)
  if (opts.tiepoint) {
    const buf = new Uint8Array(48);
    const dv = new DataView(buf.buffer);
    opts.tiepoint.forEach((v, i) => dv.setFloat64(i * 8, v, true));
    varTags.push({ tag: 33922, type: 12, count: 6, data: buf });
  }

  // GeoKeyDirectory (tag 34735, type 3/SHORT)
  if (opts.epsg) {
    // 4-entry header + one key
    const buf = new Uint8Array(16);
    const dv = new DataView(buf.buffer);
    dv.setUint16(0, 1, true);       // keyDirVersion
    dv.setUint16(2, 1, true);       // keyRevision
    dv.setUint16(4, 0, true);       // minorRevision
    dv.setUint16(6, 1, true);       // numKeys
    dv.setUint16(8, 3072, true);    // ProjectedCSTypeGeoKey
    dv.setUint16(10, 0, true);      // location (inline)
    dv.setUint16(12, 1, true);      // count
    dv.setUint16(14, opts.epsg, true); // value = EPSG
    varTags.push({ tag: 34735, type: 3, count: 8, data: buf });
  }

  // GDALNoData (tag 42113, type 2/ASCII)
  if (opts.noData !== undefined) {
    const ascii = new TextEncoder().encode(`${opts.noData  }\0`);
    varTags.push({ tag: 42113, type: 2, count: ascii.length, data: ascii });
  }

  const totalTags = nFixedTags + varTags.length;
  const ifdStart = 8; // right after 8-byte header
  const ifdSize = 2 + totalTags * 12 + 4;
  const overflowStart = ifdStart + ifdSize;

  // Calculate overflow blob offsets — only for varTags whose data > 4 bytes
  let nextOverflow = overflowStart;
  const varTagOffsets: number[] = [];
  for (const vt of varTags) {
    if (vt.data.length <= 4) {
      varTagOffsets.push(-1); // inline
    } else {
      varTagOffsets.push(nextOverflow);
      nextOverflow += vt.data.length;
    }
  }

  // Overview IFD (minimal, if requested)
  let overviewIfdOffset = 0;
  let overviewIfdBytes: Uint8Array | null = null;
  if (opts.addOverview) {
    overviewIfdOffset = nextOverflow;
    // Minimal overview IFD: just width, height
    const ovW = Math.ceil(opts.width / 2);
    const ovH = Math.ceil(opts.height / 2);
    const ovTags = 3; // Width, Height, BPS
    const ovIfdSize = 2 + ovTags * 12 + 4;
    overviewIfdBytes = new Uint8Array(ovIfdSize);
    const ovDv = new DataView(overviewIfdBytes.buffer);
    let p = 0;
    ovDv.setUint16(p, ovTags, true); p += 2;
    // ImageWidth
    ovDv.setUint16(p, 256, true); ovDv.setUint16(p + 2, 3, true);
    ovDv.setUint32(p + 4, 1, true); ovDv.setUint16(p + 8, ovW, true);
    p += 12;
    // ImageLength
    ovDv.setUint16(p, 257, true); ovDv.setUint16(p + 2, 3, true);
    ovDv.setUint32(p + 4, 1, true); ovDv.setUint16(p + 8, ovH, true);
    p += 12;
    // BitsPerSample
    ovDv.setUint16(p, 258, true); ovDv.setUint16(p + 2, 3, true);
    ovDv.setUint32(p + 4, 1, true); ovDv.setUint16(p + 8, bps, true);
    p += 12;
    // nextIFD = 0
    ovDv.setUint32(p, 0, true);

    nextOverflow += ovIfdSize;
  }

  // Tile data starts here
  const tileDataStart = nextOverflow;

  // Fill actual tile offsets
  const toDv = new DataView(tileOffsetsData.buffer);
  for (let i = 0; i < tileCount; i++) {
    toDv.setUint32(i * 4, tileDataStart + i * tileSize, true);
  }

  // Total buffer size
  const totalSize = tileDataStart + tileCount * tileSize;
  const abuf = new ArrayBuffer(totalSize);
  const view = new DataView(abuf);
  const u8 = new Uint8Array(abuf);

  // Write header
  view.setUint16(0, 0x4949, false); // "II" (little-endian)
  view.setUint16(2, 42, true);       // Classic TIFF marker
  view.setUint32(4, ifdStart, true);  // First IFD offset

  // Write IFD
  let pos = ifdStart;
  view.setUint16(pos, totalTags, true); pos += 2;

  // Write fixed tags
  for (const t of tags) {
    view.setUint16(pos, t.tag, true);
    view.setUint16(pos + 2, t.type, true);
    view.setUint32(pos + 4, t.count, true);
    // Inline value
    if (t.type === 3) {
      view.setUint16(pos + 8, t.value, true);
    } else {
      view.setUint32(pos + 8, t.value, true);
    }
    pos += 12;
  }

  // Write variable tags
  for (let vi2 = 0; vi2 < varTags.length; vi2++) {
    const vt = varTags[vi2];
    view.setUint16(pos, vt.tag, true);
    view.setUint16(pos + 2, vt.type, true);
    view.setUint32(pos + 4, vt.count, true);
    if (vt.data.length <= 4) {
      // Inline
      u8.set(vt.data, pos + 8);
    } else {
      view.setUint32(pos + 8, varTagOffsets[vi2], true);
    }
    pos += 12;
  }

  // Write nextIFD pointer
  view.setUint32(pos, overviewIfdOffset, true);
  pos += 4;

  // Write overflow blobs
  for (let vi2 = 0; vi2 < varTags.length; vi2++) {
    const off = varTagOffsets[vi2];
    if (off >= 0) {
      u8.set(varTags[vi2].data, off);
    }
  }

  // Write overview IFD if present
  if (overviewIfdBytes && overviewIfdOffset > 0) {
    u8.set(overviewIfdBytes, overviewIfdOffset);
  }

  // Write tile data
  if (opts.tilePayload) {
    for (let i = 0; i < tileCount; i++) {
      const start = tileDataStart + i * tileSize;
      const end = Math.min(opts.tilePayload.length, tileSize);
      u8.set(opts.tilePayload.subarray(0, end), start);
    }
  }

  return abuf;
}

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockArrayBufferResponse(buf: ArrayBuffer, status = 206) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 206 ? 'Partial Content' : 'OK',
    arrayBuffer: () => Promise.resolve(buf),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const COG_URL = 'https://example.com/test.tif';

describe('COGReader', () => {
  describe('cogMetadata()', () => {
    it('reads dimensions, dtype, CRS, transform from a classic TIFF', async () => {
      const tiff = buildClassicTIFF({
        width: 512,
        height: 512,
        bitsPerSample: 16,
        sampleFormat: 1,
        pixelScale: [10, 10, 0],
        tiepoint: [0, 0, 0, 100, 200, 0],
        epsg: 32636,
      });

      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));

      const meta = await cogMetadata(COG_URL);

      expect(meta.width).toBe(512);
      expect(meta.height).toBe(512);
      expect(meta.bandCount).toBe(1);
      expect(meta.dtype).toBe('uint16');
      expect(meta.crs).toBe('EPSG:32636');
      expect(meta.transform).toEqual([100, 10, 0, 200, 0, -10]);
      expect(meta.tileSize).toEqual([256, 256]);
      expect(meta.overviewCount).toBe(0);
    });

    it('detects overview IFDs', async () => {
      const tiff = buildClassicTIFF({
        width: 1024,
        height: 1024,
        addOverview: true,
      });

      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));

      const meta = await cogMetadata(COG_URL);
      expect(meta.overviewCount).toBe(1);
    });

    it('reads noData value', async () => {
      const tiff = buildClassicTIFF({
        width: 256,
        height: 256,
        noData: '-9999',
      });

      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));
      const meta = await cogMetadata(COG_URL);
      expect(meta.noData).toEqual([-9999]);
    });

    it('handles float32 dtype', async () => {
      const tiff = buildClassicTIFF({
        width: 256,
        height: 256,
        bitsPerSample: 32,
        sampleFormat: 3,
      });

      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));
      const meta = await cogMetadata(COG_URL);
      expect(meta.dtype).toBe('float32');
    });

    it('defaults CRS to EPSG:4326 when GeoKeys are absent', async () => {
      const tiff = buildClassicTIFF({ width: 256, height: 256 });
      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));
      const meta = await cogMetadata(COG_URL);
      expect(meta.crs).toBe('EPSG:4326');
    });

    it('derives bbox from transform + dimensions', async () => {
      const tiff = buildClassicTIFF({
        width: 100,
        height: 100,
        pixelScale: [0.01, 0.01, 0],
        tiepoint: [0, 0, 0, 28.0, 41.0, 0],
      });

      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));
      const meta = await cogMetadata(COG_URL);

      // Origin is at top-left: (28.0, 41.0), pixels go right and down
      // x goes from 28.0 → 28.0 + 100*0.01 = 29.0
      // y goes from 41.0 → 41.0 + 100*(-0.01) = 40.0
      expect(meta.bbox[0]).toBeCloseTo(28.0, 5); // west
      expect(meta.bbox[1]).toBeCloseTo(40.0, 5); // south
      expect(meta.bbox[2]).toBeCloseTo(29.0, 5); // east
      expect(meta.bbox[3]).toBeCloseTo(41.0, 5); // north
    });

    it('throws for non-TIFF data', async () => {
      const garbage = new ArrayBuffer(1024);
      new DataView(garbage).setUint16(0, 0x0000, false);
      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(garbage));

      await expect(cogMetadata(COG_URL)).rejects.toThrow('Not a TIFF file');
    });

    it('throws for unsupported TIFF version marker', async () => {
      const buf = new ArrayBuffer(1024);
      const dv = new DataView(buf);
      dv.setUint16(0, 0x4949, false); // "II"
      dv.setUint16(2, 99, true);       // bogus marker
      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(buf));

      await expect(cogMetadata(COG_URL)).rejects.toThrow('Unsupported TIFF version');
    });

    it('handles multi-band rasters', async () => {
      const tiff = buildClassicTIFF({
        width: 256,
        height: 256,
        bandCount: 4,
        bitsPerSample: 8,
      });
      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));
      const meta = await cogMetadata(COG_URL);
      expect(meta.bandCount).toBe(4);
      expect(meta.noData).toHaveLength(4);
    });
  });

  describe('cogRead()', () => {
    it('reads pixel data from a single tile', async () => {
      const tw = 4;
      const th = 4;
      // Create 4×4 tile payload with known values: pixel(i) = i+1
      const payload = new Uint8Array(tw * th);
      for (let i = 0; i < tw * th; i++) payload[i] = i + 1;

      const tiff = buildClassicTIFF({
        width: 4,
        height: 4,
        tileWidth: 4,
        tileHeight: 4,
        bitsPerSample: 8,
        sampleFormat: 1,
        tilePayload: payload,
      });

      // First call: header fetch
      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));
      // Second call: tile data fetch — return just the tile payload
      fetchSpy.mockReturnValueOnce(
        mockArrayBufferResponse(payload.buffer),
      );

      const result = await cogRead({ url: COG_URL });

      expect(result.width).toBe(4);
      expect(result.height).toBe(4);
      expect(result.data).toHaveLength(1); // 1 band
      // First pixel
      expect(result.data[0][0]).toBe(1);
      // Last pixel
      expect(result.data[0][15]).toBe(16);
    });

    it('returns metadata alongside pixel data', async () => {
      const tiff = buildClassicTIFF({
        width: 4,
        height: 4,
        tileWidth: 4,
        tileHeight: 4,
        epsg: 4326,
      });

      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));
      fetchSpy.mockReturnValueOnce(
        mockArrayBufferResponse(new ArrayBuffer(16)),
      );

      const result = await cogRead({ url: COG_URL });
      expect(result.metadata.crs).toBe('EPSG:4326');
      expect(result.metadata.width).toBe(4);
    });
  });

  describe('cogReadBBox()', () => {
    it('converts bbox to pixel window and reads data', async () => {
      const w = 100;
      const h = 100;
      const tiff = buildClassicTIFF({
        width: w,
        height: h,
        tileWidth: 256,
        tileHeight: 256,
        pixelScale: [0.01, 0.01, 0],
        tiepoint: [0, 0, 0, 28.0, 41.0, 0],
      });

      // cogReadBBox calls cogMetadata first, then cogRead (which re-fetches header + tile)
      fetchSpy.mockReturnValue(mockArrayBufferResponse(tiff));

      const result = await cogReadBBox(COG_URL, [28.0, 40.0, 29.0, 41.0]);

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.data).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe('retry behaviour', () => {
    it('retries on 503 and succeeds on next attempt', async () => {
      const tiff = buildClassicTIFF({ width: 256, height: 256 });

      fetchSpy
        .mockReturnValueOnce(
          Promise.resolve({ ok: false, status: 503, statusText: 'Service Unavailable' }),
        )
        .mockReturnValueOnce(mockArrayBufferResponse(tiff));

      const meta = await cogMetadata(COG_URL, {
        retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 },
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(meta.width).toBe(256);
    });

    it('throws after exhausting retries', async () => {
      fetchSpy.mockReturnValue(
        Promise.resolve({ ok: false, status: 503, statusText: 'Service Unavailable' }),
      );

      await expect(
        cogMetadata(COG_URL, {
          retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 2 },
        }),
      ).rejects.toThrow();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('throws immediately for non-retryable status', async () => {
      fetchSpy.mockReturnValueOnce(
        Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' }),
      );

      await expect(cogMetadata(COG_URL)).rejects.toThrow('404');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Range header', () => {
    it('sends correct byte range for header fetch', async () => {
      const tiff = buildClassicTIFF({ width: 256, height: 256 });
      fetchSpy.mockReturnValueOnce(mockArrayBufferResponse(tiff));

      await cogMetadata(COG_URL, { headerBytes: 32768 });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>).Range).toBe('bytes=0-32767');
    });
  });
});
