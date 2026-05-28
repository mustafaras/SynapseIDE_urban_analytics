// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  BASE_FRAME_ADVANCE_MS,
  buildFrameReference,
  buildTemporalEvidenceMetadata,
  buildTemporalStep,
  buildTemporalTimeRange,
  clampFrameIndex,
  computeFrameAdvanceMs,
  framesHaveMetricChange,
  resolveNextFrameIndex,
  resolvePrevFrameIndex,
  shouldAutoPlay,
  summarizeFrameFeatures,
  type TemporalFrameDefinition,
} from "@/services/map/temporal/TemporalPlaybackEngine";
import type {
  MapTemporalEvidenceLayerReferences,
  MapTemporalEvidenceMetadata,
} from "@/centerpanel/components/map/mapTypes";

const FRAMES: TemporalFrameDefinition[] = [
  { index: 0, key: "2020-01-01", label: "2020", featureCount: 10, binSum: 100 },
  { index: 1, key: "2021-01-01", label: "2021", featureCount: 12, binSum: 140 },
  { index: 2, key: "2022-01-01", label: "2022", featureCount: 9, binSum: 90 },
  { index: 3, key: "2023-01-01", label: "2023", featureCount: 15, binSum: 200 },
  { index: 4, key: "2024-01-01", label: "2024", featureCount: 11, binSum: 130 },
];

const LAYER_REFS: MapTemporalEvidenceLayerReferences = {
  activeLayerId: "layer-temporal",
  sourceId: "layer-temporal-source",
  layerId: "layer-temporal",
  sourceLayerIds: ["layer-temporal"],
};

describe("TemporalPlaybackEngine — frame indexing", () => {
  it("clamps indices into range", () => {
    expect(clampFrameIndex(-3, 5)).toBe(0);
    expect(clampFrameIndex(99, 5)).toBe(4);
    expect(clampFrameIndex(2, 5)).toBe(2);
    expect(clampFrameIndex(2, 0)).toBe(0);
  });

  it("continuous mode loops, snapshot mode clamps (next)", () => {
    expect(resolveNextFrameIndex(4, 5, "continuous")).toBe(0);
    expect(resolveNextFrameIndex(4, 5, "snapshot")).toBe(4);
    expect(resolveNextFrameIndex(1, 5, "snapshot")).toBe(2);
  });

  it("continuous mode wraps, snapshot mode clamps (prev)", () => {
    expect(resolvePrevFrameIndex(0, 5, "continuous")).toBe(4);
    expect(resolvePrevFrameIndex(0, 5, "snapshot")).toBe(0);
    expect(resolvePrevFrameIndex(3, 5, "snapshot")).toBe(2);
  });
});

describe("TemporalPlaybackEngine — speed + reduced motion", () => {
  it("computes per-frame interval from speed", () => {
    expect(computeFrameAdvanceMs(1)).toBe(BASE_FRAME_ADVANCE_MS);
    expect(computeFrameAdvanceMs(2)).toBe(BASE_FRAME_ADVANCE_MS / 2);
    expect(computeFrameAdvanceMs(0.5)).toBe(BASE_FRAME_ADVANCE_MS * 2);
    expect(computeFrameAdvanceMs(4)).toBe(BASE_FRAME_ADVANCE_MS / 4);
  });

  it("disables auto-play under reduced motion", () => {
    expect(shouldAutoPlay(true, false)).toBe(true);
    expect(shouldAutoPlay(true, true)).toBe(false);
    expect(shouldAutoPlay(false, false)).toBe(false);
  });
});

describe("TemporalPlaybackEngine — bin-sum / count correctness", () => {
  it("counts features and sums a numeric value field", () => {
    const features = [
      { properties: { pop: 5 } },
      { properties: { pop: "7" } },
      { properties: { pop: 3 } },
      { properties: { pop: "not-a-number" } },
      null,
    ];
    const summary = summarizeFrameFeatures(features, "pop");
    expect(summary.featureCount).toBe(4); // null skipped
    expect(summary.binSum).toBe(15); // 5 + 7 + 3, NaN excluded
  });

  it("counts without summing when no value field is given", () => {
    const summary = summarizeFrameFeatures([{ properties: { v: 1 } }, { properties: { v: 2 } }]);
    expect(summary.featureCount).toBe(2);
    expect(summary.binSum).toBe(0);
  });

  it("detects metric change only when values differ", () => {
    expect(framesHaveMetricChange(FRAMES)).toBe(true);
    const flat: TemporalFrameDefinition[] = [
      { index: 0, key: "a", label: "A", featureCount: 5, binSum: 50 },
      { index: 1, key: "b", label: "B", featureCount: 5, binSum: 50 },
    ];
    expect(framesHaveMetricChange(flat)).toBe(false);
    expect(framesHaveMetricChange([FRAMES[0]!])).toBe(false);
  });
});

describe("TemporalPlaybackEngine — evidence references", () => {
  it("roundtrips frame index/key/label into a frame reference", () => {
    const ref = buildFrameReference(FRAMES[3]!, LAYER_REFS);
    expect(ref.frameIndex).toBe(3);
    expect(ref.frameKey).toBe("2023-01-01");
    expect(ref.frameLabel).toBe("2023");
    expect(ref.sourceId).toBe(LAYER_REFS.sourceId);
    expect(ref.layerId).toBe(LAYER_REFS.layerId);
  });

  it("builds a time range spanning first → last frame", () => {
    const range = buildTemporalTimeRange(FRAMES);
    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBe(4);
    expect(range.startKey).toBe("2020-01-01");
    expect(range.endKey).toBe("2024-01-01");
  });

  it("builds the active step descriptor", () => {
    const step = buildTemporalStep(FRAMES[2]);
    expect(step.index).toBe(2);
    expect(step.key).toBe("2022-01-01");
    expect(step.label).toBe("2022");
  });
});

describe("TemporalPlaybackEngine — evidence metadata", () => {
  function build(
    overrides: Partial<Parameters<typeof buildTemporalEvidenceMetadata>[0]> = {},
  ): MapTemporalEvidenceMetadata {
    return buildTemporalEvidenceMetadata({
      temporalEvidenceId: "temporal-test",
      mode: "continuous",
      frames: FRAMES,
      activeFrameIndex: 3,
      speed: 2,
      isPlaying: true,
      prefersReducedMotion: false,
      layerReferences: LAYER_REFS,
      sourceFields: ["pop", "year"],
      runtimeMode: "live",
      layerName: "Population by year",
      timeField: "year",
      ...overrides,
    });
  }

  it("satisfies the MapTemporalEvidenceMetadata contract", () => {
    const meta: MapTemporalEvidenceMetadata = build();
    expect(meta.version).toBe(1);
    expect(meta.frameCount).toBe(5);
    expect(meta.mode).toBe("continuous");
    expect(meta.step.index).toBe(3);
    expect(meta.reportExportFrameReference.frameIndex).toBe(3);
    expect(meta.reportExportFrameReference.frameKey).toBe("2023-01-01");
    expect(meta.playback.speed).toBe(2);
    expect(meta.playback.frameAdvanceMs).toBe(computeFrameAdvanceMs(2));
    expect(meta.playbackParameters.runtimeMode).toBe("live");
    expect(meta.layerReferences.activeLayerId).toBe("layer-temporal");
  });

  it("emits a truthful runtimeMode and no false metric-change caveat for flat live data", () => {
    const flat: TemporalFrameDefinition[] = [
      { index: 0, key: "a", label: "A", featureCount: 5, binSum: 50 },
      { index: 1, key: "b", label: "B", featureCount: 5, binSum: 50 },
    ];
    const meta = build({ frames: flat, runtimeMode: "live", activeFrameIndex: 0 });
    expect(meta.qa.state).toBe("passed");
    expect(meta.playbackParameters.runtimeMode).toBe("live");
    expect(meta.caveats.some((c) => c.toLowerCase().includes("metric values change"))).toBe(false);
  });

  it("flags demo data truthfully with a caveat and warning QA", () => {
    const meta = build({ runtimeMode: "demo" });
    expect(meta.qa.state).toBe("warning");
    expect(meta.playbackParameters.runtimeMode).toBe("demo");
    expect(meta.caveats.some((c) => c.includes("demonstration data"))).toBe(true);
  });

  it("forces playback off and adds a reduced-motion caveat", () => {
    const meta = build({ prefersReducedMotion: true, isPlaying: true });
    expect(meta.playback.isPlaying).toBe(false);
    expect(meta.playbackParameters.effectivePlaying).toBe(false);
    expect(meta.caveats.some((c) => c.includes("reduced-motion"))).toBe(true);
  });
});
