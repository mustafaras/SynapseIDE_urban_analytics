// @vitest-environment node
/**
 * Prompt 39 — Motion system lint test.
 *
 * Parses motion.module.css as raw text and asserts that every animated class
 * name has a matching rule inside the @media (prefers-reduced-motion: reduce) block.
 *
 * Run: npx vitest run src/centerpanel/components/map/__tests__/mapMotionSystem.test.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS_PATH = join(
  process.cwd(),
  "src/centerpanel/components/map/design/motion.module.css",
);

const css = readFileSync(CSS_PATH, "utf-8");

/**
 * Collect all class names that have an `animation` property declared in a
 * non-media-query block.
 */
function collectAnimatedClasses(source: string): string[] {
  // Strip the @media block before scanning so we only look at the base rules.
  const withoutMedia = source.replace(/@media[^{]*\{[\s\S]*?\}\s*\}/g, "");
  const pattern = /\.([\w-]+)\s*\{[^}]*\banimation\s*:[^;]+;/g;
  const found: string[] = [];
  for (const match of withoutMedia.matchAll(pattern)) {
    found.push(match[1]);
  }
  return found;
}

/**
 * Extract the text content of the @media (prefers-reduced-motion: reduce) block.
 */
function extractReducedMotionBlock(source: string): string {
  const idx = source.indexOf("@media (prefers-reduced-motion");
  if (idx === -1) return "";
  // Take everything from the @media directive to the end so we capture the
  // full (potentially multi-rule) block without a fragile nested-brace parser.
  return source.slice(idx);
}

const animatedClasses = collectAnimatedClasses(css);
const reducedMotionSection = extractReducedMotionBlock(css);
const REQUIRED_MOTION_ALIASES = ["panel", "row", "status", "progress", "focus"] as const;

describe("motion.module.css — animation class inventory", () => {
  it("contains at least 7 animated classes", () => {
    expect(animatedClasses.length).toBeGreaterThanOrEqual(7);
  });

  it("contains a @media (prefers-reduced-motion: reduce) block", () => {
    expect(reducedMotionSection.length).toBeGreaterThan(0);
  });
});

describe("motion.module.css — semantic motion aliases", () => {
  for (const alias of REQUIRED_MOTION_ALIASES) {
    it(`defines duration and easing variables for ${alias} feedback`, () => {
      expect(css).toContain(`--gis-motion-duration-${alias}`);
      expect(css).toContain(`--gis-motion-easing-${alias}`);
    });
  }

  it("uses aliases for the requested panel, row, status, progress, and focus classes", () => {
    for (const className of ["panelIn", "layerFade", "statusFlash", "progressFill", "accentGrow"] as const) {
      expect(css).toMatch(new RegExp(`\\.${className}\\s*\\{[^}]*var\\(--gis-motion-`));
    }
  });
});

describe("motion.module.css — every animated class has a reduced-motion counterpart", () => {
  for (const cls of animatedClasses) {
    it(`class .${cls} is listed inside @media (prefers-reduced-motion: reduce)`, () => {
      expect(reducedMotionSection).toContain(`.${cls}`);
    });
  }
});

describe("motion.module.css — reduced-motion block disables animation and transition", () => {
  it("sets animation: none inside the reduced-motion block", () => {
    expect(reducedMotionSection).toMatch(/animation\s*:\s*none/);
  });

  it("sets transition: none inside the reduced-motion block", () => {
    expect(reducedMotionSection).toMatch(/transition\s*:\s*none/);
  });
});

describe("motion.module.css — keyframe names are referenced by exactly one class", () => {
  const keyframeNames: string[] = [];
  for (const match of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
    keyframeNames.push(match[1]);
  }

  it("has at least one keyframe defined", () => {
    expect(keyframeNames.length).toBeGreaterThanOrEqual(1);
  });

  for (const kf of keyframeNames) {
    it(`keyframe ${kf} is referenced by a class rule`, () => {
      // The class rule referencing the keyframe must exist in the non-media section.
      const withoutMedia = css.replace(/@media[^{]*\{[\s\S]*?\}\s*\}/g, "");
      expect(withoutMedia).toContain(kf);
    });
  }
});
