import { describe, expect, it } from "vitest";
import {
  getColorRampColors,
  getRampPreviewColors,
  listColorRampDefinitions,
  COLOR_RAMPS,
  type ColorRampName,
} from "../colorRamps";

function rgbDistance(left: string, right: string): number {
  const parse = (hex: string) => {
    const value = hex.replace("#", "");
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ];
  };
  const [lr, lg, lb] = parse(left);
  const [rr, rg, rb] = parse(right);
  return Math.hypot(lr! - rr!, lg! - rg!, lb! - rb!);
}

describe("color ramp utilities", () => {
  it("returns exact sequential ramp colors", () => {
    expect(getColorRampColors("YlOrRd", 5)).toEqual([
      "#ffffb2",
      "#fecc5c",
      "#fd8d3c",
      "#f03b20",
      "#bd0026",
    ]);
  });

  it("returns extended qualitative ramps for higher class counts", () => {
    const colors = getColorRampColors("Set1", 10);
    expect(colors).toHaveLength(10);
    expect(new Set(colors).size).toBeGreaterThanOrEqual(9);
  });

  it("builds preview colors for diverging ramps", () => {
    const colors = getRampPreviewColors("RdBu", 5);
    expect(colors).toHaveLength(5);
    expect(colors[0]).toBe("#ca0020");
    expect(colors[4]).toBe("#0571b0");
  });

  it("lists only colorblind-safe definitions", () => {
    const definitions = listColorRampDefinitions();
    expect(definitions.length).toBeGreaterThan(0);
    expect(definitions.every((definition) => definition.colorblindSafe)).toBe(true);
  });

  it("includes the required ColorBrewer ramp families at the expected class counts", () => {
    expect(Object.keys(COLOR_RAMPS.sequential)).toEqual(["YlOrRd", "Blues", "Greens", "Purples", "Oranges"]);
    expect(Object.keys(COLOR_RAMPS.diverging)).toEqual(["RdBu", "PuOr", "RdYlGn", "BrBG"]);
    expect(Object.keys(COLOR_RAMPS.qualitative)).toEqual(["Set1", "Paired", "Dark2"]);

    for (const definition of [...listColorRampDefinitions("sequential"), ...listColorRampDefinitions("diverging")]) {
      for (let classCount = 5; classCount <= 9; classCount += 1) {
        const colors = getColorRampColors(definition.name as ColorRampName, classCount);
        expect(colors).toHaveLength(classCount);
        expect(colors.every((color) => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
      }
    }

    for (const definition of listColorRampDefinitions("qualitative")) {
      for (let classCount = 8; classCount <= 12; classCount += 1) {
        const colors = getColorRampColors(definition.name as ColorRampName, classCount);
        expect(colors).toHaveLength(classCount);
        expect(colors.every((color) => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
      }
    }
  });

  it("keeps five-class ramp colors perceptually separable enough for thematic legends", () => {
    for (const definition of listColorRampDefinitions()) {
      const colors = getColorRampColors(definition.name as ColorRampName, 5);
      for (let index = 1; index < colors.length; index += 1) {
        expect(rgbDistance(colors[index - 1]!, colors[index]!)).toBeGreaterThan(25);
      }
    }
  });
});
