import { describe, expect, it } from "vitest";
import {
  classifyNumericValues,
  findClassificationClassIndex,
  getClassificationLabel,
  parseManualBreaks,
} from "../classification";

describe("classification utilities", () => {
  it("computes equal interval breaks", () => {
    const result = classifyNumericValues([0, 20, 40, 60, 80, 100], {
      method: "equal-interval",
      classCount: 5,
    });

    expect(result.breaks).toEqual([20, 40, 60, 80, 100]);
    expect(result.classes).toHaveLength(5);
  });

  it("computes quantile breaks with roughly equal observation counts", () => {
    const result = classifyNumericValues([1, 2, 3, 4, 5, 6, 7, 8, 9], {
      method: "quantile",
      classCount: 3,
    });

    expect(result.breaks).toEqual([3, 6, 9]);
    expect(result.classes.map((entry) => entry.count)).toEqual([3, 3, 3]);
  });

  it("computes natural breaks using clustered values", () => {
    const result = classifyNumericValues([1, 2, 2, 3, 4, 5, 50, 52, 53, 100], {
      method: "natural-breaks",
      classCount: 3,
    });

    expect(result.breaks).toEqual([5, 53, 100]);
  });

  it("classifies 10,000 values with optimized Fisher-Jenks natural breaks", () => {
    const values = Array.from({ length: 10_000 }, (_, index) => {
      const cluster = Math.floor(index / 1_250);
      return cluster * 100 + (index % 1_250) / 25;
    });
    const startedAt = performance.now();
    const result = classifyNumericValues(values, {
      method: "natural-breaks",
      classCount: 8,
    });
    const elapsedMs = performance.now() - startedAt;

    expect(result.classes).toHaveLength(8);
    expect(result.breaks).toEqual([...result.breaks].sort((a, b) => a - b));
    expect(elapsedMs).toBeLessThan(1_500);
  });

  it("computes standard deviation classes and labels", () => {
    const result = classifyNumericValues([10, 20, 30, 40, 50, 60, 70], {
      method: "standard-deviation",
      classCount: 5,
    });

    expect(result.classes).toHaveLength(5);
    expect(result.classes.some((entry) => entry.label.includes("μ"))).toBe(true);
    expect(result.mean).toBe(40);
  });

  it("supports standard-deviation boundaries through ±0.5, ±1.0, ±1.5, and ±2.0 sigma", () => {
    const result = classifyNumericValues([-50, -20, -15, -10, -5, 0, 5, 10, 15, 20, 50], {
      method: "standard-deviation",
      classCount: 9,
    });

    expect(result.classes).toHaveLength(9);
    const labels = result.classes.map((entry) => entry.label).join(" | ");
    expect(labels).toContain("μ -2σ");
    expect(labels).toContain("μ -1.5σ");
    expect(labels).toContain("μ -1σ");
    expect(labels).toContain("μ -0.5σ");
    expect(labels).toContain("μ +0.5σ");
    expect(labels).toContain("μ +1σ");
    expect(labels).toContain("μ +1.5σ");
    expect(labels).toContain("μ +2σ");
  });

  it("supports manual breaks", () => {
    const result = classifyNumericValues([5, 10, 15, 20, 25, 30], {
      method: "manual",
      classCount: 3,
      manualBreaks: [15, 25],
    });

    expect(result.breaks).toEqual([15, 25, 30]);
    expect(findClassificationClassIndex(12, result)).toBe(0);
    expect(getClassificationLabel(28, result)).toBe(result.classes[2]?.label);
  });

  it("parses manual break text", () => {
    expect(parseManualBreaks("10, 20\n30;40")).toEqual([10, 20, 30, 40]);
    expect(() => parseManualBreaks("10, nope")).toThrow(/numeric/i);
  });
});
