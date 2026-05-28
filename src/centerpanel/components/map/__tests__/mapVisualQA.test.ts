// @vitest-environment node
/**
 * Prompt 40 — Visual QA regression detector unit tests.
 *
 * Tests the logic helpers used by the Playwright visual-QA suite so the
 * detection algorithms are independently verified without a real browser.
 *
 * Run: npm run test -- src/centerpanel/components/map/__tests__/mapVisualQA.test.ts
 */
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Inline pixel-diversity detector (mirrors the Playwright helper)
// ---------------------------------------------------------------------------
function countUniqueByteValues(buffer: Uint8Array | number[], sampleSize = 4000): number {
  const arr = Array.isArray(buffer) ? buffer : Array.from(buffer);
  const seen = new Set<number>();
  const step = Math.max(1, Math.floor(arr.length / sampleSize));
  for (let i = 0; i < arr.length; i += step) {
    seen.add(arr[i]);
  }
  return seen.size;
}

function isCanvasBlank(buffer: Uint8Array | number[], threshold = 5): boolean {
  return countUniqueByteValues(buffer) <= threshold;
}

// ---------------------------------------------------------------------------
// Build synthetic image buffers for testing
// ---------------------------------------------------------------------------

function makeBlankBuffer(size: number, value = 255): Uint8Array {
  return new Uint8Array(size).fill(value);
}

function makeVariedBuffer(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = i % 256;
  }
  return buf;
}

function makeGradientBuffer(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = Math.floor((i / size) * 255);
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Blank-canvas detection — bidirectional proof
// ---------------------------------------------------------------------------
describe("countUniqueByteValues — pixel diversity detector", () => {
  it("returns 1 for a uniform blank buffer", () => {
    const buf = makeBlankBuffer(10000);
    expect(countUniqueByteValues(buf)).toBe(1);
  });

  it("returns >100 unique values for a fully varied buffer cycling all byte values", () => {
    const buf = makeVariedBuffer(10000);
    expect(countUniqueByteValues(buf)).toBeGreaterThan(100);
  });

  it("returns a value between 1 and 256 for a gradient buffer", () => {
    const buf = makeGradientBuffer(10000);
    const unique = countUniqueByteValues(buf);
    expect(unique).toBeGreaterThan(1);
    expect(unique).toBeLessThanOrEqual(256);
  });

  it("respects a custom sample size", () => {
    const buf = makeVariedBuffer(5000);
    const unique = countUniqueByteValues(buf, 50);
    expect(unique).toBeGreaterThan(0);
  });

  it("handles a minimal 1-byte buffer without throwing", () => {
    expect(countUniqueByteValues(new Uint8Array([42]))).toBe(1);
  });

  it("handles an empty buffer without throwing", () => {
    expect(countUniqueByteValues(new Uint8Array([]))).toBe(0);
  });
});

describe("isCanvasBlank — threshold gate (bidirectional proof)", () => {
  it("BLANK: pure white buffer (255) → isBlank = true (regression would be caught)", () => {
    const buf = makeBlankBuffer(10000, 255);
    expect(isCanvasBlank(buf)).toBe(true);
  });

  it("BLANK: pure black buffer (0) → isBlank = true", () => {
    const buf = makeBlankBuffer(10000, 0);
    expect(isCanvasBlank(buf)).toBe(true);
  });

  it("NOT BLANK: varied real-map buffer → isBlank = false (real canvas passes guard)", () => {
    const buf = makeVariedBuffer(10000);
    expect(isCanvasBlank(buf)).toBe(false);
  });

  it("NOT BLANK: gradient buffer → isBlank = false", () => {
    const buf = makeGradientBuffer(10000);
    expect(isCanvasBlank(buf)).toBe(false);
  });

  it("boundary: exactly 5 unique values → isBlank = true (at threshold)", () => {
    const buf = new Uint8Array(5000);
    // Force exactly 5 distinct byte values (0,63,127,191,255)
    const vals = [0, 63, 127, 191, 255];
    for (let i = 0; i < buf.length; i++) buf[i] = vals[i % 5];
    expect(isCanvasBlank(buf, 5)).toBe(true);
  });

  it("boundary: exactly 6 unique values → isBlank = false (above threshold)", () => {
    const vals = [0, 51, 102, 153, 204, 255];
    const buf = new Uint8Array(6000);
    for (let i = 0; i < buf.length; i++) buf[i] = vals[i % 6];
    expect(isCanvasBlank(buf, 5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Overlap detection helper — for activity rail vs canvas content check
// ---------------------------------------------------------------------------
interface Rect { x: number; y: number; width: number; height: number }

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

describe("rectsOverlap — overlap detector for layout shift guard", () => {
  it("non-overlapping side-by-side rects → false", () => {
    expect(rectsOverlap(
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 200, height: 100 },
    )).toBe(false);
  });

  it("overlapping rects → true", () => {
    expect(rectsOverlap(
      { x: 0, y: 0, width: 60, height: 100 },
      { x: 50, y: 0, width: 200, height: 100 },
    )).toBe(true);
  });

  it("fully contained rect → true", () => {
    expect(rectsOverlap(
      { x: 10, y: 10, width: 30, height: 30 },
      { x: 0, y: 0, width: 100, height: 100 },
    )).toBe(true);
  });

  it("touching edges → false (edges share a line, not area)", () => {
    expect(rectsOverlap(
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 50, height: 50 },
    )).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Clipped-text guard — checks element is within viewport bounds
// ---------------------------------------------------------------------------
function isWithinViewport(
  element: { top: number; bottom: number; left: number; right: number },
  viewport: { width: number; height: number },
): boolean {
  return (
    element.top >= -1 &&
    element.bottom <= viewport.height + 1 &&
    element.left >= -1 &&
    element.right <= viewport.width + 1
  );
}

describe("isWithinViewport — clipped-text guard", () => {
  const vp = { width: 1280, height: 600 };

  it("fully inside viewport → true", () => {
    expect(isWithinViewport({ top: 10, bottom: 50, left: 20, right: 200 }, vp)).toBe(true);
  });

  it("clipped below viewport → false (would be caught)", () => {
    expect(isWithinViewport({ top: 580, bottom: 640, left: 0, right: 400 }, vp)).toBe(false);
  });

  it("clipped right of viewport → false", () => {
    expect(isWithinViewport({ top: 10, bottom: 50, left: 1200, right: 1300 }, vp)).toBe(false);
  });

  it("allows 1px tolerance for border rendering", () => {
    expect(isWithinViewport({ top: -1, bottom: 601, left: -1, right: 1281 }, vp)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Motion CSS class contract — all 7 classes must exist in the module
// ---------------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_PATH = join(
  process.cwd(),
  "src/centerpanel/components/map/design/motion.module.css",
);

describe("motion.module.css — P40 class contract", () => {
  const css = readFileSync(CSS_PATH, "utf-8");
  const REQUIRED_CLASSES = [
    "fadeIn",
    "panelIn",
    "accentGrow",
    "statusFlash",
    "featurePulse",
    "progressFill",
    "layerFade",
  ] as const;

  for (const cls of REQUIRED_CLASSES) {
    it(`class .${cls} is defined`, () => {
      expect(css).toContain(`.${cls}`);
    });

    it(`class .${cls} is covered by prefers-reduced-motion block`, () => {
      const reducedMotionIdx = css.indexOf("@media (prefers-reduced-motion");
      expect(reducedMotionIdx).toBeGreaterThan(-1);
      const reducedBlock = css.slice(reducedMotionIdx);
      expect(reducedBlock).toContain(`.${cls}`);
    });
  }

  it("all 7 required classes are present", () => {
    for (const cls of REQUIRED_CLASSES) {
      expect(css).toContain(`.${cls}`);
    }
  });
});
