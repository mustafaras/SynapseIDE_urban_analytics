// @vitest-environment jsdom

/**
 * Prompt 22 — GIS token status + chrome + density + reduced-motion
 *
 * 1. Snapshot of MAP_STATUS_TOKENS: every status key maps to text/bg/border
 *    without any bare hex literal.
 * 2. MAP_CHROME_TOKENS and MAP_SHELL_DIMENSIONS cover the premium shell.
 * 3. MAP_DENSITY has compact, comfortable, and default presets.
 * 4. usePrefersReducedMotion returns true under emulated prefers-reduced-motion.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ---- import tokens synchronously ---- */
import {
  GIS_STATUS_KEYS,
  MAP_CHROME_SLOT_KEYS,
  MAP_CHROME_TOKENS,
  MAP_DENSITY,
  MAP_MOTION,
  MAP_SHELL_DIMENSIONS,
  MAP_STATUS_TOKENS,
} from "@/centerpanel/components/map/mapTokens";

const bareHex = /(?<![,()\w])#[0-9a-fA-F]{3,8}\b(?![^(]*\))/;

function expectNoBareHex(value: string, label: string): void {
  expect(bareHex.test(value), `${label} = "${value}" contains a bare hex literal`).toBe(
    false,
  );
}

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
    "generated",
    "external",
    "metadata-only",
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

  it("keeps status key iteration in sync with the token map", () => {
    expect(GIS_STATUS_KEYS).toEqual(Object.keys(MAP_STATUS_TOKENS));
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
        expectNoBareHex(value, `${status}.${field}`);
      }
    }
  });

  it("ready and blocked have distinct text colors", () => {
    expect(MAP_STATUS_TOKENS.ready.text).not.toBe(MAP_STATUS_TOKENS.blocked.text);
  });

  it("blocked and external-offline share the same error text color", () => {
    expect(MAP_STATUS_TOKENS.blocked.text).toBe(MAP_STATUS_TOKENS["external-offline"].text);
  });

  it("demo, synthetic, generated, external, and metadata-only states have distinct token triplets", () => {
    const modeTriplets = ["demo", "synthetic", "generated", "external", "metadata-only"].map(
      (status) => JSON.stringify(MAP_STATUS_TOKENS[status as keyof typeof MAP_STATUS_TOKENS]),
    );
    expect(new Set(modeTriplets).size).toBe(modeTriplets.length);
  });

  it("snapshot: full status token map", () => {
    expect(MAP_STATUS_TOKENS).toMatchSnapshot();
  });
});

/* ================================================================== */
/*  2. Chrome, shell, and motion aliases                                */
/* ================================================================== */
describe("MAP_CHROME_TOKENS", () => {
  const REQUIRED_CHROME_SLOTS = [
    "activityRail",
    "commandCenter",
    "sidebar",
    "rightInspector",
    "bottomPanel",
    "statusBar",
    "canvasOverlay",
    "problemsPanel",
  ] as const;

  it("covers every premium shell slot", () => {
    expect(MAP_CHROME_SLOT_KEYS).toEqual(REQUIRED_CHROME_SLOTS);
    for (const slot of REQUIRED_CHROME_SLOTS) {
      expect(MAP_CHROME_TOKENS).toHaveProperty(slot);
    }
  });

  it("uses semantic fields without one-off palette values", () => {
    for (const slot of MAP_CHROME_SLOT_KEYS) {
      const token = MAP_CHROME_TOKENS[slot];
      for (const [field, value] of Object.entries(token)) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
        expect(value).not.toContain("linear-gradient");
        expect(value).not.toContain("glow");
        expectNoBareHex(value, `${slot}.${field}`);
      }
    }
  });
});

describe("MAP_SHELL_DIMENSIONS", () => {
  const REQUIRED_SHELL_DIMENSIONS = [
    "activityRailWidth",
    "commandCenterHeight",
    "leftSidebarWidth",
    "rightInspectorWidth",
    "bottomPanelHeight",
    "statusBarHeight",
  ] as const;

  it("has named dimensions for every premium chrome region", () => {
    for (const key of REQUIRED_SHELL_DIMENSIONS) {
      expect(typeof MAP_SHELL_DIMENSIONS[key]).toBe("string");
      expect(MAP_SHELL_DIMENSIONS[key].length).toBeGreaterThan(0);
    }
  });
});

describe("MAP_MOTION", () => {
  const REQUIRED_MOTION_ALIASES = ["panel", "row", "status", "progress", "focus"] as const;

  it("has duration and easing aliases for panel, row, status, progress, and focus feedback", () => {
    for (const alias of REQUIRED_MOTION_ALIASES) {
      expect(typeof MAP_MOTION.duration[alias]).toBe("string");
      expect(typeof MAP_MOTION.easing[alias]).toBe("string");
      expect(MAP_MOTION.duration[alias].length).toBeGreaterThan(0);
      expect(MAP_MOTION.easing[alias].length).toBeGreaterThan(0);
    }
  });
});

/* ================================================================== */
/*  3. Density presets                                                  */
/* ================================================================== */
describe("MAP_DENSITY", () => {
  it("has compact, comfortable, and default presets", () => {
    expect(MAP_DENSITY).toHaveProperty("compact");
    expect(MAP_DENSITY).toHaveProperty("comfortable");
    expect(MAP_DENSITY).toHaveProperty("default");
  });

  it("each preset has required geometry fields", () => {
    for (const preset of ["compact", "comfortable", "default"] as const) {
      const densityToken = MAP_DENSITY[preset];
      expect(typeof densityToken.rowHeight).toBe("string");
      expect(typeof densityToken.cellPadding).toBe("string");
      expect(typeof densityToken.fontSize).toBe("string");
      expect(typeof densityToken.gap).toBe("string");
      expect(typeof densityToken.iconSize).toBe("number");
    }
  });

  it("compact rowHeight is shorter than comfortable", () => {
    // Both are rem strings — compare as floats
    const parse = (s: string) => parseFloat(s);
    expect(parse(MAP_DENSITY.compact.rowHeight)).toBeLessThan(
      parse(MAP_DENSITY.comfortable.rowHeight),
    );
  });

  it("default remains an alias for comfortable density", () => {
    expect(MAP_DENSITY.default).toBe(MAP_DENSITY.comfortable);
  });
});

/* ================================================================== */
/*  4. usePrefersReducedMotion hook                                     */
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
