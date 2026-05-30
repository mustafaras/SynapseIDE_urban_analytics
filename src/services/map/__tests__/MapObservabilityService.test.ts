import { afterEach, describe, expect, it } from "vitest";
import {
  buildMapTelemetrySummary,
  clearMapTelemetryEvents,
  getMapTelemetryEvents,
  recordMapTelemetryEvent,
  redactMapTelemetryString,
} from "../observability";

describe("MapObservabilityService", () => {
  afterEach(() => {
    clearMapTelemetryEvents();
  });

  it("redacts secrets and PII before storing diagnostics events", () => {
    recordMapTelemetryEvent({
      kind: "external-service.error",
      severity: "warning",
      source: "external-service",
      message: "WFS failed for jane.planner@example.com with Bearer abcdefghijklmnopqrstuvwxyz1234567890 and api_key=plain-secret",
      details: {
        endpoint: "https://services.example.test/wfs?api_key=plain-secret&layer=buildings",
        contact: "+1 202 555 0199",
        authorization: "Bearer abcdefghijklmnopqrstuvwxyz1234567890",
      },
    });

    const stored = JSON.stringify(getMapTelemetryEvents()[0]);
    expect(stored).toContain("[REDACTED]");
    expect(stored).not.toContain("jane.planner@example.com");
    expect(stored).not.toContain("plain-secret");
    expect(stored).not.toContain("202 555 0199");
    expect(stored).not.toContain("abcdefghijklmnopqrstuvwxyz1234567890");
  });

  it("retains the newest bounded diagnostics events", () => {
    for (let index = 0; index < 205; index += 1) {
      recordMapTelemetryEvent({
        kind: "command.run",
        severity: "info",
        source: "map-command",
        message: `Command ${index}`,
      }, { now: () => `2026-05-29T00:00:${String(index % 60).padStart(2, "0")}.000Z` });
    }

    const events = getMapTelemetryEvents();
    expect(events).toHaveLength(200);
    expect(events[0].message).toBe("Command 204");
    expect(events.at(-1)?.message).toBe("Command 5");
  });

  it("deduplicates noisy events within a configured window", () => {
    const first = recordMapTelemetryEvent({
      kind: "performance.budget",
      severity: "warning",
      source: "performance-diagnostics",
      message: "Layer count is above budget",
      fingerprint: "perf:layer-count",
    }, { now: () => "2026-05-29T00:00:00.000Z", dedupeKey: "perf:layer-count", dedupeMs: 10_000 });
    const second = recordMapTelemetryEvent({
      kind: "performance.budget",
      severity: "warning",
      source: "performance-diagnostics",
      message: "Layer count is above budget",
      fingerprint: "perf:layer-count",
    }, { now: () => "2026-05-29T00:00:03.000Z", dedupeKey: "perf:layer-count", dedupeMs: 10_000 });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(buildMapTelemetrySummary(getMapTelemetryEvents())).toEqual({
      totalCount: 1,
      infoCount: 0,
      warningCount: 1,
      errorCount: 0,
      recoverableCount: 0,
    });
  });

  it("redacts long token-like strings", () => {
    expect(redactMapTelemetryString("standalone 0123456789abcdefghijklmnopqrstuvwxyzABCD")).toBe("standalone [REDACTED]");
  });
});