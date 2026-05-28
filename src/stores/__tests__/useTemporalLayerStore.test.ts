// @vitest-environment node

import { beforeEach, describe, expect, it } from "vitest";
import { useTemporalLayerStore } from "@/stores/useTemporalLayerStore";
import { mergeTemporalEvidenceIntoMetadata } from "@/services/map/temporal";
import type { TemporalFrameDefinition } from "@/services/map/temporal";
import type { LayerMetadata } from "@/centerpanel/components/map/mapTypes";

const FRAMES: TemporalFrameDefinition[] = [
  { index: 0, key: "2020", label: "Year 2020", featureCount: 10, binSum: 100 },
  { index: 1, key: "2021", label: "Year 2021", featureCount: 12, binSum: 140 },
  { index: 2, key: "2022", label: "Year 2022", featureCount: 9, binSum: 90 },
  { index: 3, key: "2023", label: "Year 2023", featureCount: 15, binSum: 200 },
  { index: 4, key: "2024", label: "Year 2024", featureCount: 11, binSum: 130 },
];

function seedFrames() {
  const store = useTemporalLayerStore.getState();
  store.setFrames(FRAMES);
  store.setLayerReferences({
    activeLayerId: "layer-temporal",
    sourceId: "layer-temporal-source",
    layerId: "layer-temporal",
    layerName: "Temporal layer",
    sourceFields: ["pop"],
    timeField: "year",
    runtimeMode: "demo",
  });
}

describe("useTemporalLayerStore", () => {
  beforeEach(() => {
    useTemporalLayerStore.getState().reset();
  });

  it("seeds frames, normalising dense zero-based indices", () => {
    useTemporalLayerStore.getState().setFrames([
      { index: 7, key: "a", label: "A" },
      { index: 9, key: "b", label: "B" },
    ]);
    const frames = useTemporalLayerStore.getState().frames;
    expect(frames.map((f) => f.index)).toEqual([0, 1]);
    expect(useTemporalLayerStore.getState().activeFrameIndex).toBe(0);
  });

  it("navigates frames and goToFrame clamps", () => {
    seedFrames();
    useTemporalLayerStore.getState().goToFrame(3);
    expect(useTemporalLayerStore.getState().activeFrameIndex).toBe(3);
    useTemporalLayerStore.getState().nextFrame();
    expect(useTemporalLayerStore.getState().activeFrameIndex).toBe(4);
    useTemporalLayerStore.getState().goToFrame(999);
    expect(useTemporalLayerStore.getState().activeFrameIndex).toBe(4);
  });

  it("play sets isPlaying true when motion is allowed", () => {
    seedFrames();
    useTemporalLayerStore.getState().setReducedMotion(false);
    useTemporalLayerStore.getState().play();
    expect(useTemporalLayerStore.getState().isPlaying).toBe(true);
  });

  it("reduced motion forces isPlaying false in the store", () => {
    seedFrames();
    useTemporalLayerStore.getState().play();
    expect(useTemporalLayerStore.getState().isPlaying).toBe(true);
    // Simulate usePrefersReducedMotion → setReducedMotion(true)
    useTemporalLayerStore.getState().setReducedMotion(true);
    expect(useTemporalLayerStore.getState().isPlaying).toBe(false);
    // play() must stay a no-op while reduced motion is active
    useTemporalLayerStore.getState().play();
    expect(useTemporalLayerStore.getState().isPlaying).toBe(false);
  });

  it("exportCurrentFrame carries frameIndex/frameKey/frameLabel + restore metadata", () => {
    seedFrames();
    useTemporalLayerStore.getState().goToFrame(3);
    const payload = useTemporalLayerStore.getState().exportCurrentFrame();
    expect(payload).not.toBeNull();
    expect(payload?.frameIndex).toBe(3);
    expect(payload?.frameKey).toBe("2023");
    expect(payload?.frameLabel).toBe("Year 2023");
    // Composer (Prompt 22) restore metadata is present and well-formed.
    expect(payload?.restoreMetadata.version).toBe(1);
    expect(payload?.restoreMetadata.pages[0]?.pageNumber).toBe(4);
  });

  it("exportCurrentFrame returns null with no frames", () => {
    expect(useTemporalLayerStore.getState().exportCurrentFrame()).toBeNull();
  });

  it("buildEvidence produces a contract-satisfying payload with truthful runtimeMode", () => {
    seedFrames();
    useTemporalLayerStore.getState().goToFrame(2);
    const evidence = useTemporalLayerStore.getState().buildEvidence();
    expect(evidence).not.toBeNull();
    expect(evidence?.frameCount).toBe(5);
    expect(evidence?.step.index).toBe(2);
    expect(evidence?.reportExportFrameReference.frameIndex).toBe(2);
    expect(evidence?.playbackParameters.runtimeMode).toBe("demo");
    expect(evidence?.qa.state).toBe("warning");
  });

  it("handoff merges evidence into LayerMetadata.temporalEvidence without clobbering", () => {
    seedFrames();
    const evidence = useTemporalLayerStore.getState().buildEvidence()!;
    const existing: LayerMetadata = { dataVersion: "v1", updatedAt: "2026-05-28T00:00:00Z" };
    const merged = mergeTemporalEvidenceIntoMetadata(existing, evidence);
    expect(merged.dataVersion).toBe("v1");
    expect(merged.updatedAt).toBe("2026-05-28T00:00:00Z");
    expect(merged.temporalEvidence).toBe(evidence);
    expect(merged.temporalEvidence?.frameCount).toBe(5);
  });
});
