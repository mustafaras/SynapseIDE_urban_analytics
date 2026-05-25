import { afterEach, describe, expect, it, vi } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import { externalServiceStub } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import { ExternalServiceError } from "../ExternalServiceConnector";
import {
  buildConnectionLayerMetadata,
  cacheConnectionMetadata,
  checkConnectionHealth,
  classifyExternalServiceFailure,
  clearConnectionCache,
  containsNoSecrets,
  createConnectionDescriptor,
  initialConnectionHealth,
  resolveDependencyStatusForTime,
  restoreConnectionMetadata,
  stripSecretKeys,
} from "../sources/MapConnectionRegistry";

const FIXED_NOW = new Date("2026-05-25T10:00:00.000Z");

function externalLayer(metadata: OverlayLayerConfig["metadata"]): OverlayLayerConfig {
  return {
    id: "external-wms-offline",
    name: "Offline WMS",
    type: "raster-tile",
    visible: true,
    opacity: 0.82,
    sourceKind: "external",
    queryable: false,
    sourceData: "https://example.invalid/wms?bbox={bbox-epsg-3857}",
    metadata,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  clearConnectionCache();
});

describe("MapConnectionRegistry — failure classification", () => {
  it("maps errors and HTTP statuses to specific actionable failure states", () => {
    expect(classifyExternalServiceFailure(new TypeError("Failed to fetch")).kind).toBe("cors");
    expect(classifyExternalServiceFailure(new ExternalServiceError("cors", "blocked")).kind).toBe("cors");
    expect(classifyExternalServiceFailure(new ExternalServiceError("http", "Service returned HTTP 401."), 401).kind).toBe("auth");
    expect(classifyExternalServiceFailure(new ExternalServiceError("http", "Service returned HTTP 429.")).kind).toBe("rate-limit");
    expect(classifyExternalServiceFailure(new ExternalServiceError("http", "Service returned HTTP 503.")).kind).toBe("offline");
    expect(classifyExternalServiceFailure(new ExternalServiceError("timeout", "did not respond")).kind).toBe("timeout");

    const cors = classifyExternalServiceFailure(new TypeError("Failed to fetch"));
    expect(cors.dependencyStatus).toBe("offline");
    expect(cors.reason).toMatch(/CORS proxy/i);
  });
});

describe("MapConnectionRegistry — health checks (injected fetcher)", () => {
  it("reports a live dependency when the probe succeeds", async () => {
    const descriptor = createConnectionDescriptor({
      sourceId: "wfs-1",
      serviceKind: "wfs",
      endpoint: "https://example.test/wfs",
    });
    const fetcher = vi.fn().mockResolvedValue(new Response("<ok/>"));
    const health = await checkConnectionHealth(descriptor, { fetcher, now: () => FIXED_NOW });

    expect(health.dependencyStatus).toBe("live");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]?.[0])).toMatch(/request=GetCapabilities/i);
  });

  it("classifies a blocked probe as an offline dependency with an actionable reason", async () => {
    const descriptor = createConnectionDescriptor({
      sourceId: "wms-1",
      serviceKind: "wms",
      endpoint: "https://example.invalid/wms",
    });
    const fetcher = vi.fn().mockRejectedValue(new ExternalServiceError("cors", "browser blocked"));
    const health = await checkConnectionHealth(descriptor, { fetcher, now: () => FIXED_NOW });

    expect(health.dependencyStatus).toBe("offline");
    expect(health.failureKind).toBe("cors");
    expect(health.offlineReason).toMatch(/CORS proxy/i);
  });

  it("surfaces a rate-limit failure from an HTTP 429 probe", async () => {
    const descriptor = createConnectionDescriptor({
      sourceId: "overpass-1",
      serviceKind: "overpass",
      endpoint: "https://overpass.test/api/interpreter",
    });
    const fetcher = vi.fn().mockRejectedValue(new ExternalServiceError("http", "Service returned HTTP 429."));
    const health = await checkConnectionHealth(descriptor, { fetcher, now: () => FIXED_NOW });

    expect(health.dependencyStatus).toBe("offline");
    expect(health.failureKind).toBe("rate-limit");
  });
});

describe("MapConnectionRegistry — offline/stale/unknown surface + publication readiness", () => {
  it("an offline dependency blocks publication readiness and carries the offline reason", () => {
    const descriptor = createConnectionDescriptor({
      sourceId: "wms-offline",
      serviceKind: "wms",
      endpoint: externalServiceStub.endpoint,
      title: externalServiceStub.title,
      crs: externalServiceStub.crs,
    });
    const health = {
      dependencyStatus: "offline" as const,
      checkedAt: FIXED_NOW.toISOString(),
      failureKind: "offline" as const,
      offlineReason: externalServiceStub.offlineReason,
    };
    const metadata = buildConnectionLayerMetadata(descriptor, health);

    expect(metadata.dependencyStatus).toBe("offline");
    expect(metadata.offlineReason).toBe(externalServiceStub.offlineReason);

    const registry = normalizeLayerRegistryMetadata(externalLayer({ externalService: metadata }));
    expect(registry.publicationReadiness.status).toBe("blocked");
    expect(registry.publicationReadiness.blockingIssueIds).toContain("external-service-offline");
    expect(registry.publicationReadiness.caveats).toContain(externalServiceStub.offlineReason);
  });

  it("an unknown dependency surfaces an unverified caveat without claiming readiness", () => {
    const descriptor = createConnectionDescriptor({
      sourceId: "xyz-unknown",
      serviceKind: "xyz",
      endpoint: "https://tiles.test/{z}/{x}/{y}.png",
      urlTemplate: "https://tiles.test/{z}/{x}/{y}.png",
      crs: "EPSG:3857",
    });
    const metadata = buildConnectionLayerMetadata(descriptor, initialConnectionHealth(FIXED_NOW.toISOString()));

    expect(metadata.dependencyStatus).toBe("unknown");
    const registry = normalizeLayerRegistryMetadata(externalLayer({ externalService: metadata }));
    expect(registry.publicationReadiness.caveats).toContain(
      "External service availability has not been verified in this browser session.",
    );
    expect(registry.publicationReadiness.status).not.toBe("ready");
  });

  it("downgrades a cached/live dependency to stale once its TTL lapses on restore", () => {
    const descriptor = createConnectionDescriptor({
      sourceId: "wfs-stale",
      serviceKind: "wfs",
      endpoint: "https://example.test/wfs",
      crs: "EPSG:4326",
      cacheTtlMs: 60_000,
    });
    const liveHealth = { dependencyStatus: "live" as const, checkedAt: FIXED_NOW.toISOString() };
    const metadata = buildConnectionLayerMetadata(descriptor, liveHealth);
    cacheConnectionMetadata(descriptor, metadata, liveHealth);

    const later = new Date(FIXED_NOW.getTime() + 120_000);
    expect(resolveDependencyStatusForTime(metadata, later)).toBe("stale");

    const restored = restoreConnectionMetadata("wfs-stale", later);
    expect(restored?.dependencyStatus).toBe("stale");

    const registry = normalizeLayerRegistryMetadata(externalLayer({ externalService: restored ?? metadata }));
    expect(registry.publicationReadiness.caveats).toContain(
      "External service layer is stale and should be refreshed before analytical use.",
    );
  });
});

describe("MapConnectionRegistry — secret hygiene", () => {
  it("never lets credential-like keys into the descriptor or layer metadata", () => {
    const descriptor = createConnectionDescriptor({
      sourceId: "wms-secret",
      serviceKind: "wms",
      endpoint: "https://example.test/wms",
      credentialMode: "browser-managed",
      // Caller accidentally passes a secret; it must not survive.
      apiKey: "super-secret-token",
      authorization: "Bearer abc123",
    } as Parameters<typeof createConnectionDescriptor>[0]);

    const metadata = buildConnectionLayerMetadata(descriptor, initialConnectionHealth(FIXED_NOW.toISOString()));

    expect(containsNoSecrets(descriptor)).toBe(true);
    expect(containsNoSecrets(metadata)).toBe(true);
    expect(JSON.stringify(metadata)).not.toContain("super-secret-token");
    expect(JSON.stringify(metadata)).not.toContain("Bearer abc123");
    expect(metadata.credentialMode).toBe("browser-managed");

    expect(stripSecretKeys({ token: "x", endpoint: "https://ok" })).toEqual({ endpoint: "https://ok" });
  });
});
