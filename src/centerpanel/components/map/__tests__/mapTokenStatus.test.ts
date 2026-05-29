// @vitest-environment jsdom

/**
 * Prompt 35 — GIS token status + density + reduced-motion
 *
 * 1. Snapshot of MAP_STATUS_TOKENS: every status key maps to text/bg/border
 *    without any bare hex literal.
 * 2. MAP_DENSITY has compact and default presets.
 * 3. usePrefersReducedMotion returns true under emulated prefers-reduced-motion.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ---- import tokens synchronously ---- */
import {
  MAP_STATUS_TOKENS,
  MAP_DENSITY,
  GIS_STATUS_KEYS,
} from "@/centerpanel/components/map/mapTokens";

/* ================================================================== */
/*  1. Status token coverage                                            */
/* ================================================================== */
describe("MAP_STATUS_TOKENS", () => {
  const REQUIRED_STATUSES = [
    "ready",
    "caveat",
    "unknown",
    "demo",
    "synthetic",
    "external-offline",
    "stale",
    "blocked",
    "running",
  ] as const;

  it("covers every required status key", () => {
    for (const status of REQUIRED_STATUSES) {
      expect(MAP_STATUS_TOKENS).toHaveProperty(status);
    }
  });

  it("each entry has text, bg, and border fields", () => {
    for (const status of GIS_STATUS_KEYS) {
      const tok = MAP_STATUS_TOKENS[status];
      expect(typeof tok.text).toBe("string");
      expect(typeof tok.bg).toBe("string");
      expect(typeof tok.border).toBe("string");
      expect(tok.text.length).toBeGreaterThan(0);
      expect(tok.bg.length).toBeGreaterThan(0);
      expect(tok.border.length).toBeGreaterThan(0);
    }
  });

  it("no bare hex literals — all values are CSS vars or color-mix", () => {
    for (const status of GIS_STATUS_KEYS) {
      const tok = MAP_STATUS_TOKENS[status];
      for (const [field, value] of Object.entries(tok)) {
        // A bare hex is a # followed by 3, 6, or 8 hex chars at the start,
        // or immediately after whitespace, not embedded inside color-mix or var().
        const bareHex = /(?<![,()\w])#[0-9a-fA-F]{3,8}\b(?![^(]*\))/;
        expect(
          bareHex.test(value),
          `${status}.${field} = "${value}" contains a bare hex literal`,
        ).toBe(false);
      }
    }
  });

  it("ready and blocked have distinct text colors", () => {
    expect(MAP_STATUS_TOKENS.ready.text).not.toBe(MAP_STATUS_TOKENS.blocked.text);
  });

  it("blocked and external-offline share the same error text color", () => {
    expect(MAP_STATUS_TOKENS.blocked.text).toBe(MAP_STATUS_TOKENS["external-offline"].text);
  });

  it("snapshot: full status token map", () => {
    expect(MAP_STATUS_TOKENS).toMatchSnapshot();
  });
});

/* ================================================================== */
/*  2. Density presets                                                  */
/* ================================================================== */
describe("MAP_DENSITY", () => {
  it("has compact and default presets", () => {
    expect(MAP_DENSITY).toHaveProperty("compact");
    expect(MAP_DENSITY).toHaveProperty("default");
  });

  it("each preset has required geometry fields", () => {
    for (const preset of ["compact", "default"] as const) {
      const d = MAP_DENSITY[preset];
      expect(typeof d.rowHeight).toBe("string");
      expect(typeof d.cellPadding).toBe("string");
      expect(typeof d.fontSize).toBe("string");
      expect(typeof d.gap).toBe("string");
      expect(typeof d.iconSize).toBe("number");
    }
  });

  it("compact rowHeight is shorter than default", () => {
    // Both are rem strings — compare as floats
    const parse = (s: string) => parseFloat(s);
    expect(parse(MAP_DENSITY.compact.rowHeight)).toBeLessThan(
      parse(MAP_DENSITY.default.rowHeight),
    );
  });
});

/* ================================================================== */
/*  3. usePrefersReducedMotion hook                                     */
/* ================================================================== */
describe("usePrefersReducedMotion", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("returns true when prefers-reduced-motion: reduce is active", async () => {
    const mockMql = {
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    };
    window.matchMedia = vi.fn().mockReturnValue(mockMql);

    const { renderHook } = await import("@testing-library/react");
    const { usePrefersReducedMotion } = await import("@/hooks/usePrefersReducedMotion");

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false when prefers-reduced-motion is not set", async () => {
    const mockMql = {
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    };
    window.matchMedia = vi.fn().mockReturnValue(mockMql);

    const { renderHook } = await import("@testing-library/react");
    const { usePrefersReducedMotion } = await import("@/hooks/usePrefersReducedMotion");

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
