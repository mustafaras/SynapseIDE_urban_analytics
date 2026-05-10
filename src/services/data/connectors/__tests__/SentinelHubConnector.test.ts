/**
 * SentinelHubConnector — integration tests with mock HTTP responses.
 *
 * Tests:
 *   • acquireToken — success, malformed response, transient failure retry
 *   • isTokenValid / ensureToken — expiry logic, refresh flow
 *   • process — request body structure, pixel parsing, error handling
 *   • fetchB04 / fetchB08 / fetchNDVI / fetchBands — evalscript delegation
 *   • searchCatalog — catalog normalization, cloud filter, pagination
 *   • Error readability — structured and unstructured error bodies
 *   • AbortSignal propagation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acquireToken,
  ensureToken,
  fetchB04,
  fetchB08,
  fetchBands,
  fetchNDVI,
  isTokenValid,
  multiBandEvalscript,
  ndviEvalscript,
  process,
  searchCatalog,
  singleBandEvalscript,
} from '../SentinelHubConnector';
import type {
  SentinelHubBandParams,
  SentinelHubCredentials,
  SentinelHubProcessParams,
  SentinelHubToken,
} from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CREDS: SentinelHubCredentials = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
};

const VALID_TOKEN: SentinelHubToken = {
  accessToken: 'mock-access-token',
  expiresAt: Date.now() + 3_600_000, // 1 hour from now
};

const EXPIRED_TOKEN: SentinelHubToken = {
  accessToken: 'expired-token',
  expiresAt: Date.now() - 10_000, // already expired
};

const BAND_PARAMS: SentinelHubBandParams = {
  bbox: [28.5, 40.8, 29.3, 41.3],
  datetime: { start: '2024-06-01T00:00:00Z', end: '2024-06-30T23:59:59Z' },
  width: 4,
  height: 4,
  maxCloudCover: 20,
};

const PROCESS_PARAMS: SentinelHubProcessParams = {
  ...BAND_PARAMS,
  evalscript: singleBandEvalscript('B04'),
};

/** Build a fake FLOAT32 raster buffer (bandCount × width × height). */
function makeRasterBuffer(
  width: number,
  height: number,
  bands: number,
  fillFn: (band: number, pixel: number) => number = (_b, i) => i + 1,
): ArrayBuffer {
  const pixelCount = width * height;
  const f32 = new Float32Array(bands * pixelCount);
  for (let b = 0; b < bands; b++) {
    for (let i = 0; i < pixelCount; i++) {
      f32[b * pixelCount + i] = fillFn(b, i);
    }
  }
  return f32.buffer;
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

function mockJsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : `Error ${status}`,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Map([['content-type', 'application/json']]),
  });
}

function mockBinaryResponse(
  buf: ArrayBuffer,
  contentType = 'image/tiff',
  status = 200,
) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    arrayBuffer: () => Promise.resolve(buf),
    headers: new Map([['content-type', contentType]]),
  });
}

function mockErrorResponse(
  status: number,
  body: unknown,
  statusText = `Error ${status}`,
) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(text),
    headers: new Map(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SentinelHubConnector', () => {
  // ------- acquireToken -------
  describe('acquireToken()', () => {
    it('acquires a token from OAuth endpoint', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ access_token: 'fresh-token', expires_in: 3600 }),
      );

      const token = await acquireToken(CREDS);

      expect(token.accessToken).toBe('fresh-token');
      expect(token.expiresAt).toBeGreaterThan(Date.now());

      // Verify request
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('openid-connect/token');
      expect(init.method).toBe('POST');
      expect(init.body).toContain('grant_type=client_credentials');
      expect(init.body).toContain('client_id=test-client-id');
      expect(init.body).toContain('client_secret=test-client-secret');
    });

    it('uses custom tokenUrl when specified', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ access_token: 'tok', expires_in: 300 }),
      );

      await acquireToken({
        ...CREDS,
        tokenUrl: 'https://custom-auth.example.com/token',
      });

      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('https://custom-auth.example.com/token');
    });

    it('throws on malformed token response (missing access_token)', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ error: 'invalid_client' }),
      );

      await expect(acquireToken(CREDS)).rejects.toThrow(
        'missing access_token',
      );
    });

    it('throws on malformed token response (missing expires_in)', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ access_token: 'tok' }),
      );

      await expect(acquireToken(CREDS)).rejects.toThrow(
        'missing access_token or expires_in',
      );
    });

    it('retries on 503 and succeeds', async () => {
      fetchSpy
        .mockReturnValueOnce(
          mockErrorResponse(503, 'Service Unavailable', 'Service Unavailable'),
        )
        .mockReturnValueOnce(
          mockJsonResponse({ access_token: 'retry-tok', expires_in: 300 }),
        );

      const token = await acquireToken(CREDS, {
        retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 },
      });

      expect(token.accessToken).toBe('retry-tok');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('throws immediately for non-retryable 401', async () => {
      fetchSpy.mockReturnValueOnce(
        mockErrorResponse(401, {
          error: { message: 'Invalid client credentials' },
        }),
      );

      await expect(acquireToken(CREDS)).rejects.toThrow(
        'Invalid client credentials',
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ------- isTokenValid / ensureToken -------
  describe('token lifecycle', () => {
    it('isTokenValid returns true for a future-expiring token', () => {
      expect(isTokenValid(VALID_TOKEN)).toBe(true);
    });

    it('isTokenValid returns false for an expired token', () => {
      expect(isTokenValid(EXPIRED_TOKEN)).toBe(false);
    });

    it('isTokenValid returns false for null', () => {
      expect(isTokenValid(null)).toBe(false);
    });

    it('isTokenValid returns false when within safety margin', () => {
      const almostExpired: SentinelHubToken = {
        accessToken: 'tok',
        expiresAt: Date.now() + 30_000, // 30 sec left but margin is 60 sec
      };
      expect(isTokenValid(almostExpired)).toBe(false);
    });

    it('ensureToken returns cached token when valid', async () => {
      const result = await ensureToken(CREDS, VALID_TOKEN);
      expect(result.accessToken).toBe('mock-access-token');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('ensureToken acquires fresh token when expired', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ access_token: 'refreshed-tok', expires_in: 3600 }),
      );

      const result = await ensureToken(CREDS, EXPIRED_TOKEN);
      expect(result.accessToken).toBe('refreshed-tok');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('ensureToken acquires fresh token when cached is null', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ access_token: 'new-tok', expires_in: 3600 }),
      );

      const result = await ensureToken(CREDS, null);
      expect(result.accessToken).toBe('new-tok');
    });
  });

  // ------- process -------
  describe('process()', () => {
    it('sends correct Process API request body', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      await process(VALID_TOKEN, PROCESS_PARAMS);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/process');
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.input.bounds.bbox).toEqual(PROCESS_PARAMS.bbox);
      expect(body.input.data[0].type).toBe('sentinel-2-l2a');
      expect(body.input.data[0].dataFilter.maxCloudCoverage).toBe(20);
      expect(body.input.data[0].dataFilter.timeRange.from).toBe(
        '2024-06-01T00:00:00Z',
      );
      expect(body.output.width).toBe(4);
      expect(body.output.height).toBe(4);
      expect(body.evalscript).toContain('B04');
    });

    it('includes Authorization header with bearer token', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      await process(VALID_TOKEN, PROCESS_PARAMS);

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer mock-access-token');
    });

    it('parses single-band float raster', async () => {
      const buf = makeRasterBuffer(4, 4, 1, (_b, i) => (i + 1) * 0.01);
      fetchSpy.mockReturnValueOnce(mockBinaryResponse(buf));

      const result = await process(VALID_TOKEN, PROCESS_PARAMS);

      expect(result.bandCount).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.width).toBe(4);
      expect(result.height).toBe(4);
      expect(result.data[0][0]).toBeCloseTo(0.01, 4);
      expect(result.data[0][15]).toBeCloseTo(0.16, 4);
    });

    it('parses multi-band float raster', async () => {
      const buf = makeRasterBuffer(4, 4, 3, (b, i) => b * 100 + i);
      fetchSpy.mockReturnValueOnce(mockBinaryResponse(buf));

      const result = await process(VALID_TOKEN, {
        ...PROCESS_PARAMS,
        evalscript: multiBandEvalscript(['B02', 'B03', 'B04']),
      });

      expect(result.bandCount).toBe(3);
      expect(result.data).toHaveLength(3);
      // Band 0, pixel 0 = 0; Band 2, pixel 0 = 200
      expect(result.data[0][0]).toBe(0);
      expect(result.data[2][0]).toBe(200);
    });

    it('returns bbox and datetime from the request', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      const result = await process(VALID_TOKEN, PROCESS_PARAMS);
      expect(result.bbox).toEqual(PROCESS_PARAMS.bbox);
      expect(result.datetime).toEqual(PROCESS_PARAMS.datetime);
    });

    it('uses custom processUrl when specified', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      await process(VALID_TOKEN, PROCESS_PARAMS, {
        processUrl: 'https://custom.example.com/api/process',
      });

      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toBe('https://custom.example.com/api/process');
    });

    it('throws readable error for 403', async () => {
      fetchSpy.mockReturnValueOnce(
        mockErrorResponse(403, { error: { message: 'Insufficient scope' } }),
      );

      await expect(
        process(VALID_TOKEN, PROCESS_PARAMS),
      ).rejects.toThrow('Insufficient scope');
    });

    it('throws readable error for 400 with plain text body', async () => {
      fetchSpy.mockReturnValueOnce(
        mockErrorResponse(400, 'Bad evalscript syntax'),
      );

      await expect(
        process(VALID_TOKEN, PROCESS_PARAMS),
      ).rejects.toThrow('Bad evalscript syntax');
    });

    it('defaults maxCloudCoverage to 100 when omitted', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      const params: SentinelHubProcessParams = {
        ...BAND_PARAMS,
        evalscript: singleBandEvalscript('B04'),
        maxCloudCover: undefined,
      };
      await process(VALID_TOKEN, params);

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      );
      expect(body.input.data[0].dataFilter.maxCloudCoverage).toBe(100);
    });
  });

  // ------- Band helpers -------
  describe('band helpers', () => {
    it('fetchB04 uses B04 evalscript', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      const result = await fetchB04(VALID_TOKEN, BAND_PARAMS);
      expect(result.bandCount).toBe(1);

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      );
      expect(body.evalscript).toContain('B04');
      expect(body.evalscript).not.toContain('B08');
    });

    it('fetchB08 uses B08 evalscript', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      const result = await fetchB08(VALID_TOKEN, BAND_PARAMS);
      expect(result.bandCount).toBe(1);

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      );
      expect(body.evalscript).toContain('B08');
    });

    it('fetchNDVI uses NDVI evalscript with both B04 and B08', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
      );

      const result = await fetchNDVI(VALID_TOKEN, BAND_PARAMS);
      expect(result.bandCount).toBe(1);

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      );
      expect(body.evalscript).toContain('B04');
      expect(body.evalscript).toContain('B08');
      expect(body.evalscript).toContain('sample.B08 - sample.B04');
    });

    it('fetchBands requests multiple bands', async () => {
      fetchSpy.mockReturnValueOnce(
        mockBinaryResponse(makeRasterBuffer(4, 4, 4)),
      );

      const result = await fetchBands(VALID_TOKEN, BAND_PARAMS, [
        'B02',
        'B03',
        'B04',
        'B08',
      ]);
      expect(result.bandCount).toBe(4);

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      );
      expect(body.evalscript).toContain('B02');
      expect(body.evalscript).toContain('B03');
      expect(body.evalscript).toContain('B04');
      expect(body.evalscript).toContain('B08');
    });

    it('fetchBands throws when bandNames is empty', async () => {
      await expect(
        fetchBands(VALID_TOKEN, BAND_PARAMS, []),
      ).rejects.toThrow('At least one band name');
    });
  });

  // ------- Evalscript templates -------
  describe('evalscript templates', () => {
    it('singleBandEvalscript generates valid script for B04', () => {
      const script = singleBandEvalscript('B04');
      expect(script).toContain('VERSION=3');
      expect(script).toContain('"B04"');
      expect(script).toContain('sample.B04');
      expect(script).toContain('FLOAT32');
    });

    it('ndviEvalscript generates NDVI formula', () => {
      const script = ndviEvalscript();
      expect(script).toContain('B04');
      expect(script).toContain('B08');
      expect(script).toContain('sample.B08 - sample.B04');
      expect(script).toContain('-9999');
    });

    it('multiBandEvalscript lists all requested bands', () => {
      const script = multiBandEvalscript(['B02', 'B03', 'B04']);
      expect(script).toContain('"B02"');
      expect(script).toContain('"B03"');
      expect(script).toContain('bands: 3');
      expect(script).toContain('sample.B02');
    });
  });

  // ------- searchCatalog -------
  describe('searchCatalog()', () => {
    it('searches catalog and normalizes results', async () => {
      const catalogResponse = {
        type: 'FeatureCollection',
        features: [
          {
            id: 'S2A_20240615',
            bbox: [28.5, 40.8, 29.3, 41.3],
            geometry: {
              type: 'Polygon',
              coordinates: [
                [[28.5, 40.8], [29.3, 40.8], [29.3, 41.3], [28.5, 41.3], [28.5, 40.8]],
              ],
            },
            properties: {
              datetime: '2024-06-15T10:30:00Z',
              'eo:cloud_cover': 8.5,
            },
            links: [
              { rel: 'self', href: 'https://example.com/item/S2A_20240615' },
            ],
          },
        ],
        numberMatched: 1,
      };

      fetchSpy.mockReturnValueOnce(mockJsonResponse(catalogResponse));

      const result = await searchCatalog(VALID_TOKEN, {
        bbox: [28.5, 40.8, 29.3, 41.3],
        datetime: { start: '2024-06-01T00:00:00Z', end: '2024-06-30T23:59:59Z' },
        maxCloudCover: 20,
      });

      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.id).toBe('S2A_20240615');
      expect(item.provider).toBe('sentinel-hub');
      expect(item.collection).toBe('sentinel-2-l2a');
      expect(item.cloudCover).toBe(8.5);
      expect(item.gsd).toBe(10);
      expect(item.crs).toBe('EPSG:4326');
      expect(item.selfLink).toBe('https://example.com/item/S2A_20240615');
      expect(result.matched).toBe(1);
    });

    it('sends cloud filter in request body', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ features: [], numberMatched: 0 }),
      );

      await searchCatalog(VALID_TOKEN, {
        bbox: [28.5, 40.8, 29.3, 41.3],
        datetime: { start: '2024-01-01T00:00:00Z', end: '2024-12-31T23:59:59Z' },
        maxCloudCover: 15,
      });

      const body = JSON.parse(
        (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
      );
      expect(body.filter).toContain('eo:cloud_cover < 15');
    });

    it('handles empty feature results', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ features: [], numberMatched: 0 }),
      );

      const result = await searchCatalog(VALID_TOKEN, {
        bbox: [0, 0, 1, 1],
        datetime: { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
      });

      expect(result.items).toHaveLength(0);
      expect(result.matched).toBe(0);
    });

    it('extracts nextToken from links', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({
          features: [],
          links: [
            { rel: 'next', href: 'https://sh.example.com/catalog?page=2' },
          ],
        }),
      );

      const result = await searchCatalog(VALID_TOKEN, {
        bbox: [0, 0, 1, 1],
        datetime: { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
      });

      expect(result.nextToken).toBe('https://sh.example.com/catalog?page=2');
    });

    it('includes Authorization header', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ features: [] }),
      );

      await searchCatalog(VALID_TOKEN, {
        bbox: [0, 0, 1, 1],
        datetime: { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
      });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer mock-access-token');
    });
  });

  // ------- AbortSignal -------
  describe('abort', () => {
    it('propagates signal to fetch in acquireToken', async () => {
      const controller = new AbortController();
      fetchSpy.mockImplementation((_url: string, init: RequestInit) => {
        expect(init.signal).toBe(controller.signal);
        return mockJsonResponse({ access_token: 'tok', expires_in: 300 });
      });

      await acquireToken(CREDS, { signal: controller.signal });
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('propagates signal to fetch in process', async () => {
      const controller = new AbortController();
      fetchSpy.mockImplementation((_url: string, init: RequestInit) => {
        expect(init.signal).toBe(controller.signal);
        return mockBinaryResponse(makeRasterBuffer(4, 4, 1));
      });

      await process(VALID_TOKEN, PROCESS_PARAMS, {
        signal: controller.signal,
      });
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  // ------- Error readability -------
  describe('error messages', () => {
    it('extracts nested error.message from JSON response', async () => {
      fetchSpy.mockReturnValueOnce(
        mockErrorResponse(422, {
          error: { message: 'Invalid evalscript: unexpected token' },
        }),
      );

      await expect(
        process(VALID_TOKEN, PROCESS_PARAMS),
      ).rejects.toThrow('Invalid evalscript: unexpected token');
    });

    it('extracts top-level message from JSON response', async () => {
      fetchSpy.mockReturnValueOnce(
        mockErrorResponse(422, { message: 'Evalscript compilation failed' }),
      );

      await expect(
        process(VALID_TOKEN, PROCESS_PARAMS),
      ).rejects.toThrow('Evalscript compilation failed');
    });

    it('uses plain text body as error message', async () => {
      fetchSpy.mockReturnValueOnce(
        mockErrorResponse(400, 'Output width exceeds maximum'),
      );

      await expect(
        process(VALID_TOKEN, PROCESS_PARAMS),
      ).rejects.toThrow('Output width exceeds maximum');
    });

    it('falls back to HTTP status when body is empty', async () => {
      fetchSpy.mockReturnValueOnce(
        Promise.resolve({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          text: () => Promise.resolve(''),
          headers: new Map(),
        }),
      );

      await expect(
        process(VALID_TOKEN, PROCESS_PARAMS),
      ).rejects.toThrow('403');
    });
  });

  // ------- retry -------
  describe('retry', () => {
    it('retries transient 502 and succeeds', async () => {
      fetchSpy
        .mockReturnValueOnce(
          mockErrorResponse(502, 'Bad Gateway', 'Bad Gateway'),
        )
        .mockReturnValueOnce(
          mockBinaryResponse(makeRasterBuffer(4, 4, 1)),
        );

      const result = await process(VALID_TOKEN, PROCESS_PARAMS, {
        retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 },
      });

      expect(result.bandCount).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('exhausts retries and throws', async () => {
      fetchSpy.mockReturnValue(
        mockErrorResponse(503, 'Service Unavailable'),
      );

      await expect(
        process(VALID_TOKEN, PROCESS_PARAMS, {
          retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 2 },
        }),
      ).rejects.toThrow();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
