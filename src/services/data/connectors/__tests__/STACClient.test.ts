/**
 * STACClient — integration tests with mock responses.
 *
 * Tests:
 *   • stacSearch — basic search, pagination, empty results
 *   • stacSearchNext — following a "next" link
 *   • stacSearchAll — paginated collection
 *   • stacGetItem — single item fetch
 *   • formatDatetime — interval formatting
 *   • Metadata normalization: cloud cover, GSD, CRS, assets
 *   • Retry behaviour on transient 503 errors
 *   • AbortSignal cancellation
 *   • Malformed / missing fields are handled gracefully
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatDatetime,
  stacGetItem,
  stacSearch,
  stacSearchAll,
  stacSearchNext,
} from '../STACClient';
import type { STACSearchParams } from '../types';

// ---------------------------------------------------------------------------
// Fixtures — realistic Planetary Computer shaped responses
// ---------------------------------------------------------------------------

const ENDPOINT = 'https://planetarycomputer.microsoft.com/api/stac/v1';

function makeItem(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: 'Feature',
    collection: 'sentinel-2-l2a',
    bbox: [28.5, 40.8, 29.3, 41.3],
    geometry: {
      type: 'Polygon',
      coordinates: [[[28.5, 40.8], [29.3, 40.8], [29.3, 41.3], [28.5, 41.3], [28.5, 40.8]]],
    },
    properties: {
      datetime: '2024-06-15T10:30:00Z',
      'eo:cloud_cover': 12.5,
      gsd: 10,
      'proj:epsg': 32636,
      ...overrides,
    },
    assets: {
      B04: {
        href: `https://example.com/${id}/B04.tif`,
        type: 'image/tiff; application=geotiff; profile=cloud-optimized',
        title: 'Band 4 (Red)',
        roles: ['data'],
        'eo:bands': [{ name: 'B04', common_name: 'red' }],
      },
      B08: {
        href: `https://example.com/${id}/B08.tif`,
        type: 'image/tiff; application=geotiff; profile=cloud-optimized',
        title: 'Band 8 (NIR)',
        roles: ['data'],
      },
      thumbnail: {
        href: `https://example.com/${id}/thumb.png`,
        type: 'image/png',
        title: 'Thumbnail',
        roles: ['thumbnail'],
      },
    },
    links: [
      { rel: 'self', href: `${ENDPOINT}/collections/sentinel-2-l2a/items/${id}` },
    ],
  };
}

function searchResponse(
  items: ReturnType<typeof makeItem>[],
  opts: { matched?: number; nextHref?: string } = {},
) {
  return {
    type: 'FeatureCollection',
    features: items,
    numberMatched: opts.matched ?? items.length,
    links: opts.nextHref
      ? [{ rel: 'next', href: opts.nextHref }]
      : [],
  };
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
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('STACClient', () => {
  const baseParams: STACSearchParams = {
    endpoint: ENDPOINT,
    collections: ['sentinel-2-l2a'],
    bbox: [28.5, 40.8, 29.3, 41.3],
    datetime: { start: '2024-06-01T00:00:00Z', end: '2024-06-30T23:59:59Z' },
    limit: 10,
  };

  // ------- formatDatetime -------
  describe('formatDatetime()', () => {
    it('formats an interval with "/" separator', () => {
      expect(
        formatDatetime({ start: '2024-01-01T00:00:00Z', end: '2024-12-31T23:59:59Z' }),
      ).toBe('2024-01-01T00:00:00Z/2024-12-31T23:59:59Z');
    });
  });

  // ------- stacSearch -------
  describe('stacSearch()', () => {
    it('returns normalized CatalogItems for a basic search', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([makeItem('S2A_001'), makeItem('S2A_002')])),
      );

      const result = await stacSearch(baseParams);

      expect(result.items).toHaveLength(2);
      expect(result.matched).toBe(2);
      expect(result.nextToken).toBeNull();

      // Verify normalization
      const item = result.items[0];
      expect(item.id).toBe('S2A_001');
      expect(item.collection).toBe('sentinel-2-l2a');
      expect(item.provider).toBe('stac');
      expect(item.bbox).toEqual([28.5, 40.8, 29.3, 41.3]);
      expect(item.cloudCover).toBe(12.5);
      expect(item.gsd).toBe(10);
      expect(item.crs).toBe('EPSG:32636');
      expect(item.assets).toHaveLength(3);
      expect(item.geometry).not.toBeNull();
      expect(item.selfLink).toContain('S2A_001');
    });

    it('sends correct POST body with all search parameters', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([])),
      );

      await stacSearch({
        ...baseParams,
        query: { 'eo:cloud_cover': { lt: 20 } },
        sortby: [{ field: 'properties.datetime', direction: 'desc' }],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${ENDPOINT  }/search`);
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.collections).toEqual(['sentinel-2-l2a']);
      expect(body.bbox).toEqual([28.5, 40.8, 29.3, 41.3]);
      expect(body.datetime).toBe('2024-06-01T00:00:00Z/2024-06-30T23:59:59Z');
      expect(body.limit).toBe(10);
      expect(body.query).toEqual({ 'eo:cloud_cover': { lt: 20 } });
      expect(body.sortby).toHaveLength(1);
    });

    it('handles empty result sets gracefully', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([], { matched: 0 })),
      );

      const result = await stacSearch(baseParams);
      expect(result.items).toHaveLength(0);
      expect(result.matched).toBe(0);
    });

    it('returns nextToken when server provides a next link', async () => {
      const nextUrl = `${ENDPOINT}/search?token=abc123`;
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(
          searchResponse([makeItem('S2A_001')], { matched: 50, nextHref: nextUrl }),
        ),
      );

      const result = await stacSearch(baseParams);
      expect(result.nextToken).toBe(nextUrl);
      expect(result.matched).toBe(50);
    });

    it('strips trailing slashes from endpoint URL', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([])),
      );

      await stacSearch({ ...baseParams, endpoint: `${ENDPOINT  }///` });

      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${ENDPOINT  }/search`);
    });
  });

  // ------- Normalization edge cases -------
  describe('normalization', () => {
    it('handles items with start_datetime/end_datetime instead of datetime', async () => {
      const item = makeItem('range-dt', {
        datetime: null,
        start_datetime: '2024-06-01T00:00:00Z',
        end_datetime: '2024-06-30T23:59:59Z',
      });
      fetchSpy.mockReturnValueOnce(mockJsonResponse(searchResponse([item])));

      const result = await stacSearch(baseParams);
      const dt = result.items[0].datetime;
      expect(typeof dt).toBe('object');
      expect((dt as { start: string }).start).toBe('2024-06-01T00:00:00Z');
      expect((dt as { end: string }).end).toBe('2024-06-30T23:59:59Z');
    });

    it('handles items without cloud cover or GSD', async () => {
      const item = makeItem('no-meta');
      delete (item.properties as Record<string, unknown>)['eo:cloud_cover'];
      delete (item.properties as Record<string, unknown>).gsd;
      fetchSpy.mockReturnValueOnce(mockJsonResponse(searchResponse([item])));

      const result = await stacSearch(baseParams);
      expect(result.items[0].cloudCover).toBeUndefined();
      expect(result.items[0].gsd).toBeUndefined();
    });

    it('defaults CRS to EPSG:4326 when proj:epsg is absent', async () => {
      const item = makeItem('no-proj');
      delete (item.properties as Record<string, unknown>)['proj:epsg'];
      fetchSpy.mockReturnValueOnce(mockJsonResponse(searchResponse([item])));

      const result = await stacSearch(baseParams);
      expect(result.items[0].crs).toBe('EPSG:4326');
    });

    it('handles items with no assets', async () => {
      const item = makeItem('no-assets');
      delete (item as Record<string, unknown>).assets;
      fetchSpy.mockReturnValueOnce(mockJsonResponse(searchResponse([item])));

      const result = await stacSearch(baseParams);
      expect(result.items[0].assets).toHaveLength(0);
    });

    it('preserves asset extra properties like eo:bands', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([makeItem('band-item')])),
      );

      const result = await stacSearch(baseParams);
      const b04 = result.items[0].assets.find((a) => a.key === 'B04');
      expect(b04).toBeDefined();
      expect(b04!.extra).toHaveProperty('eo:bands');
    });

    it('uses custom providerLabel in normalized items', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([makeItem('custom')])),
      );

      const result = await stacSearch(baseParams, { providerLabel: 'planetary-computer' });
      expect(result.items[0].provider).toBe('planetary-computer');
    });
  });

  // ------- stacSearchNext -------
  describe('stacSearchNext()', () => {
    it('follows a full URL next token via GET', async () => {
      const nextUrl = `${ENDPOINT}/search?token=xyz`;
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([makeItem('PAGE2_001')])),
      );

      const result = await stacSearchNext(baseParams, nextUrl);
      expect(result.items[0].id).toBe('PAGE2_001');

      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(nextUrl);
      expect(init.method).toBe('GET');
    });

    it('re-issues POST for non-URL token', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse(searchResponse([makeItem('PAGE2_002')])),
      );

      const result = await stacSearchNext(baseParams, 'opaque-cursor');
      expect(result.items[0].id).toBe('PAGE2_002');

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body as string);
      expect(body.token).toBe('opaque-cursor');
    });
  });

  // ------- stacSearchAll -------
  describe('stacSearchAll()', () => {
    it('collects items across multiple pages', async () => {
      const nextUrl = `${ENDPOINT}/search?page=2`;
      fetchSpy
        .mockReturnValueOnce(
          mockJsonResponse(
            searchResponse([makeItem('P1_001'), makeItem('P1_002')], {
              matched: 4,
              nextHref: nextUrl,
            }),
          ),
        )
        .mockReturnValueOnce(
          mockJsonResponse(searchResponse([makeItem('P2_001'), makeItem('P2_002')])),
        );

      const items = await stacSearchAll(baseParams);
      expect(items).toHaveLength(4);
      expect(items.map((i) => i.id)).toEqual([
        'P1_001', 'P1_002', 'P2_001', 'P2_002',
      ]);
    });

    it('respects maxItems cap', async () => {
      const nextUrl = `${ENDPOINT}/search?page=2`;
      fetchSpy
        .mockReturnValueOnce(
          mockJsonResponse(
            searchResponse(
              Array.from({ length: 5 }, (_, i) => makeItem(`A${i}`)),
              { matched: 100, nextHref: nextUrl },
            ),
          ),
        )
        .mockReturnValueOnce(
          mockJsonResponse(
            searchResponse(Array.from({ length: 5 }, (_, i) => makeItem(`B${i}`))),
          ),
        );

      const items = await stacSearchAll(baseParams, { maxItems: 7 });
      expect(items).toHaveLength(7);
    });
  });

  // ------- stacGetItem -------
  describe('stacGetItem()', () => {
    it('fetches and normalizes a single item', async () => {
      const item = makeItem('direct-item');
      fetchSpy.mockReturnValueOnce(mockJsonResponse(item));

      const result = await stacGetItem(
        `${ENDPOINT}/collections/sentinel-2-l2a/items/direct-item`,
      );

      expect(result.id).toBe('direct-item');
      expect(result.collection).toBe('sentinel-2-l2a');
      expect(result.assets).toHaveLength(3);
    });
  });

  // ------- Retry behaviour -------
  describe('retry', () => {
    it('retries on 503 and succeeds on subsequent attempt', async () => {
      fetchSpy
        .mockReturnValueOnce(
          Promise.resolve({ ok: false, status: 503, statusText: 'Service Unavailable' }),
        )
        .mockReturnValueOnce(
          mockJsonResponse(searchResponse([makeItem('retry-ok')])),
        );

      const result = await stacSearch(baseParams, {
        retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 },
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.items[0].id).toBe('retry-ok');
    });

    it('throws after exhausting retries', async () => {
      fetchSpy.mockReturnValue(
        Promise.resolve({ ok: false, status: 503, statusText: 'Service Unavailable' }),
      );

      await expect(
        stacSearch(baseParams, {
          retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 2 },
        }),
      ).rejects.toThrow();

      expect(fetchSpy).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it('throws immediately for non-retryable status', async () => {
      fetchSpy.mockReturnValueOnce(
        Promise.resolve({ ok: false, status: 403, statusText: 'Forbidden' }),
      );

      await expect(stacSearch(baseParams)).rejects.toThrow('403');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ------- AbortSignal -------
  describe('abort', () => {
    it('propagates signal to fetch', async () => {
      const controller = new AbortController();
      fetchSpy.mockImplementation((_url: string, init: RequestInit) => {
        expect(init.signal).toBe(controller.signal);
        return mockJsonResponse(searchResponse([]));
      });

      await stacSearch(baseParams, { signal: controller.signal });
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  // ------- context / numberMatched -------
  describe('matched count sources', () => {
    it('reads numberMatched from top-level field', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ type: 'FeatureCollection', features: [], numberMatched: 42 }),
      );

      const result = await stacSearch(baseParams);
      expect(result.matched).toBe(42);
    });

    it('falls back to context.matched', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({
          type: 'FeatureCollection',
          features: [],
          context: { matched: 99, returned: 0 },
        }),
      );

      const result = await stacSearch(baseParams);
      expect(result.matched).toBe(99);
    });

    it('returns null when neither count source is available', async () => {
      fetchSpy.mockReturnValueOnce(
        mockJsonResponse({ type: 'FeatureCollection', features: [] }),
      );

      const result = await stacSearch(baseParams);
      expect(result.matched).toBeNull();
    });
  });
});
