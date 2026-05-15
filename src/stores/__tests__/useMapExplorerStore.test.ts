import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMapExplorerStore } from "../useMapExplorerStore";
import type {
  DrawnFeature,
  MapPin,
  OverlayLayerConfig,
} from "../../centerpanel/components/map/mapTypes";

/* ================================================================== */
/*  localStorage polyfill for Node test environment                    */
/* ================================================================== */

const store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function reset(): void {
  useMapExplorerStore.setState(useMapExplorerStore.getInitialState());
}

function makePin(id: string, overrides?: Partial<MapPin>): MapPin {
  return { id, lng: 29.0, lat: 41.0, label: `Pin ${id}`, ...overrides };
}

function makeLayer(id: string, overrides?: Partial<OverlayLayerConfig>): OverlayLayerConfig {
  return {
    id,
    name: `Layer ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    ...overrides,
  };
}

function makeDrawing(id: string): DrawnFeature {
  return {
    id,
    geometry: {
      type: "LineString",
      coordinates: [
        [29.0, 41.0],
        [29.1, 41.1],
      ],
    },
    properties: {
      label: `Drawing ${id}`,
      createdAt: "2026-04-10T00:00:00.000Z",
    },
  };
}

/* ================================================================== */
/*  Setup / teardown                                                   */
/* ================================================================== */

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  reset();
});

afterEach(() => {
  vi.useRealTimers();
});

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

describe("useMapExplorerStore", () => {
  /* ---- Visibility ---- */

  describe("visibility", () => {
    it("starts closed", () => {
      expect(useMapExplorerStore.getState().isOpen).toBe(false);
    });

    it("open() sets isOpen true", () => {
      useMapExplorerStore.getState().open();
      expect(useMapExplorerStore.getState().isOpen).toBe(true);
    });

    it("close() sets isOpen false", () => {
      useMapExplorerStore.getState().open();
      useMapExplorerStore.getState().close();
      expect(useMapExplorerStore.getState().isOpen).toBe(false);
    });

    it("toggle() flips isOpen", () => {
      useMapExplorerStore.getState().toggle();
      expect(useMapExplorerStore.getState().isOpen).toBe(true);
      useMapExplorerStore.getState().toggle();
      expect(useMapExplorerStore.getState().isOpen).toBe(false);
    });
  });

  /* ---- Viewport ---- */

  describe("viewport", () => {
    it("has Istanbul default viewport", () => {
      const s = useMapExplorerStore.getState();
      expect(s.center).toEqual([29.0, 41.0]);
      expect(s.zoom).toBe(10);
      expect(s.bearing).toBe(0);
      expect(s.pitch).toBe(0);
    });

    it("setViewport updates after 250ms debounce", () => {
      useMapExplorerStore.getState().setViewport({ center: [28.0, 40.0], zoom: 12 });
      // Not yet applied
      expect(useMapExplorerStore.getState().center).toEqual([29.0, 41.0]);
      // Advance debounce
      vi.advanceTimersByTime(250);
      expect(useMapExplorerStore.getState().center).toEqual([28.0, 40.0]);
      expect(useMapExplorerStore.getState().zoom).toBe(12);
    });

    it("debounce coalesces rapid calls", () => {
      const { setViewport } = useMapExplorerStore.getState();
      setViewport({ zoom: 11 });
      vi.advanceTimersByTime(100);
      setViewport({ zoom: 13 });
      vi.advanceTimersByTime(250);
      expect(useMapExplorerStore.getState().zoom).toBe(13);
    });

    it("partial setViewport preserves other fields", () => {
      useMapExplorerStore.getState().setViewport({ bearing: 45 });
      vi.advanceTimersByTime(250);
      expect(useMapExplorerStore.getState().bearing).toBe(45);
      expect(useMapExplorerStore.getState().center).toEqual([29.0, 41.0]);
    });
  });

  /* ---- Base layer ---- */

  describe("base layer", () => {
    it("defaults to dark", () => {
      expect(useMapExplorerStore.getState().activeBaseLayer).toBe("dark");
    });

    it("setBaseLayer switches layer", () => {
      useMapExplorerStore.getState().setBaseLayer("satellite");
      expect(useMapExplorerStore.getState().activeBaseLayer).toBe("satellite");
    });
  });

  /* ---- Pins ---- */

  describe("pins", () => {
    it("starts with empty pins array", () => {
      expect(useMapExplorerStore.getState().pins).toEqual([]);
    });

    it("addPin appends a pin", () => {
      const pin = makePin("p1");
      useMapExplorerStore.getState().addPin(pin);
      expect(useMapExplorerStore.getState().pins).toHaveLength(1);
      expect(useMapExplorerStore.getState().pins[0]).toEqual(pin);
    });

    it("addPin preserves existing pins", () => {
      useMapExplorerStore.getState().addPin(makePin("p1"));
      useMapExplorerStore.getState().addPin(makePin("p2"));
      expect(useMapExplorerStore.getState().pins).toHaveLength(2);
    });

    it("removePin removes by id", () => {
      useMapExplorerStore.getState().addPin(makePin("p1"));
      useMapExplorerStore.getState().addPin(makePin("p2"));
      useMapExplorerStore.getState().removePin("p1");
      const ids = useMapExplorerStore.getState().pins.map((p) => p.id);
      expect(ids).toEqual(["p2"]);
    });

    it("removePin with non-existent id is a no-op", () => {
      useMapExplorerStore.getState().addPin(makePin("p1"));
      useMapExplorerStore.getState().removePin("ghost");
      expect(useMapExplorerStore.getState().pins).toHaveLength(1);
    });

    it("updatePin patches matching pin", () => {
      useMapExplorerStore.getState().addPin(makePin("p1"));
      useMapExplorerStore.getState().updatePin("p1", { label: "Updated" });
      expect(useMapExplorerStore.getState().pins[0].label).toBe("Updated");
    });

    it("updatePin leaves other pins untouched", () => {
      useMapExplorerStore.getState().addPin(makePin("p1"));
      useMapExplorerStore.getState().addPin(makePin("p2"));
      useMapExplorerStore.getState().updatePin("p1", { lat: 99 });
      expect(useMapExplorerStore.getState().pins[1].lat).toBe(41.0);
    });

    it("clearPins empties the array", () => {
      useMapExplorerStore.getState().addPin(makePin("p1"));
      useMapExplorerStore.getState().addPin(makePin("p2"));
      useMapExplorerStore.getState().clearPins();
      expect(useMapExplorerStore.getState().pins).toEqual([]);
    });
  });

  /* ---- Active tool ---- */

  describe("active tool", () => {
    it("defaults to null", () => {
      expect(useMapExplorerStore.getState().activeTool).toBeNull();
    });

    it("setActiveTool sets tool", () => {
      useMapExplorerStore.getState().setActiveTool("pin");
      expect(useMapExplorerStore.getState().activeTool).toBe("pin");
    });

    it("setActiveTool(null) clears tool", () => {
      useMapExplorerStore.getState().setActiveTool("pin");
      useMapExplorerStore.getState().setActiveTool(null);
      expect(useMapExplorerStore.getState().activeTool).toBeNull();
    });
  });

  /* ---- Overlay layers ---- */

  describe("overlay layers", () => {
    it("starts empty", () => {
      expect(useMapExplorerStore.getState().overlayLayers).toEqual([]);
    });

    it("addOverlayLayer appends a layer", () => {
      const layer = makeLayer("l1");
      useMapExplorerStore.getState().addOverlayLayer(layer);
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    });

    it("addOverlayLayer replaces an existing layer when ids match", () => {
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l1", { name: "Original" }));
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l1", { name: "Refreshed" }));

      const layers = useMapExplorerStore.getState().overlayLayers;
      expect(layers).toHaveLength(1);
      expect(layers[0]?.name).toBe("Refreshed");
    });

    it("removeOverlayLayer removes by id", () => {
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l1"));
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l2"));
      useMapExplorerStore.getState().removeOverlayLayer("l1");
      const ids = useMapExplorerStore.getState().overlayLayers.map((l) => l.id);
      expect(ids).toEqual(["l2"]);
    });

    it("toggleLayerVisibility flips visible", () => {
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l1", { visible: true }));
      useMapExplorerStore.getState().toggleLayerVisibility("l1");
      expect(useMapExplorerStore.getState().overlayLayers[0].visible).toBe(false);
      useMapExplorerStore.getState().toggleLayerVisibility("l1");
      expect(useMapExplorerStore.getState().overlayLayers[0].visible).toBe(true);
    });

    it("reorderLayers reorders by provided id list", () => {
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l1"));
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l2"));
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l3"));
      useMapExplorerStore.getState().reorderLayers(["l3", "l1", "l2"]);
      const ids = useMapExplorerStore.getState().overlayLayers.map((l) => l.id);
      expect(ids).toEqual(["l3", "l1", "l2"]);
    });

    it("reorderLayers drops unknown ids", () => {
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l1"));
      useMapExplorerStore.getState().reorderLayers(["l1", "ghost"]);
      expect(useMapExplorerStore.getState().overlayLayers).toHaveLength(1);
    });

    it("marks dependent analysis layers stale when a source layer changes version", () => {
      useMapExplorerStore.getState().addOverlayLayer(
        makeLayer("source-layer", {
          metadata: { dataVersion: "v1" },
        }),
      );

      useMapExplorerStore.getState().addOverlayLayer(
        makeLayer("analysis-layer", {
          group: "analysis",
          metadata: {
            analysisResult: {
              engine: "OLS",
              runTimestamp: "2026-04-11T12:00:00.000Z",
              parameterSummary: "dependent=price; predictors=[access]",
              inputParameters: { dependent: "price", predictors: ["access"] },
              statisticalSummary: { rSquared: 0.82 },
              sourceLayerIds: ["source-layer"],
              sourceDataVersion: "v1",
              stale: false,
              visualization: {
                kind: "choropleth",
                title: "OLS Residuals",
                valueField: "residual",
                classificationMethod: "standard-deviation",
                classCount: 5,
                colorRamp: "RdBu",
              },
            },
          },
        }),
      );

      useMapExplorerStore.getState().addOverlayLayer(
        makeLayer("source-layer", {
          metadata: { dataVersion: "v2" },
        }),
      );

      const analysisLayer = useMapExplorerStore.getState().overlayLayers.find((layer) => layer.id === "analysis-layer");
      expect(analysisLayer?.metadata?.analysisResult?.stale).toBe(true);
    });
  });

  describe("current map bbox", () => {
    it("stores the current map bounds and update timestamp", () => {
      useMapExplorerStore.getState().setCurrentMapBounds([28.94, 41.01, 29.04, 41.08]);

      expect(useMapExplorerStore.getState().currentMapBounds).toEqual([28.94, 41.01, 29.04, 41.08]);
      expect(useMapExplorerStore.getState().currentMapBoundsUpdatedAt).toBeTypeOf("string");
    });
  });

  describe("project restore", () => {
    it("restoreProjectState replaces viewport, pins, drawings, and layers atomically", () => {
      useMapExplorerStore.getState().setViewport({ zoom: 13 });
      useMapExplorerStore.getState().addPin(makePin("old-pin"));
      useMapExplorerStore.getState().addDrawnFeature(makeDrawing("old-drawing"));
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("old-layer"));

      useMapExplorerStore.getState().restoreProjectState({
        viewport: {
          center: [2.3522, 48.8566],
          zoom: 9,
          bearing: 18,
          pitch: 22,
        },
        activeBaseLayer: "satellite",
        pins: [makePin("restored-pin", { lng: 2.3522, lat: 48.8566 })],
        drawnFeatures: [makeDrawing("restored-drawing")],
        overlayLayers: [makeLayer("restored-layer")],
      });

      vi.advanceTimersByTime(300);

      const state = useMapExplorerStore.getState();
      expect(state.center).toEqual([2.3522, 48.8566]);
      expect(state.zoom).toBe(9);
      expect(state.bearing).toBe(18);
      expect(state.pitch).toBe(22);
      expect(state.activeBaseLayer).toBe("satellite");
      expect(state.pins.map((pin) => pin.id)).toEqual(["restored-pin"]);
      expect(state.drawnFeatures.map((feature) => feature.id)).toEqual(["restored-drawing"]);
      expect(state.overlayLayers.map((layer) => layer.id)).toEqual(["restored-layer"]);
    });

    it("clearProjectContent resets map content and viewport defaults", () => {
      useMapExplorerStore.getState().addPin(makePin("p1"));
      useMapExplorerStore.getState().addDrawnFeature(makeDrawing("d1"));
      useMapExplorerStore.getState().addOverlayLayer(makeLayer("l1"));
      useMapExplorerStore.getState().clearProjectContent();

      const state = useMapExplorerStore.getState();
      expect(state.center).toEqual([29.0, 41.0]);
      expect(state.zoom).toBe(10);
      expect(state.activeBaseLayer).toBe("dark");
      expect(state.pins).toEqual([]);
      expect(state.drawnFeatures).toEqual([]);
      expect(state.overlayLayers).toEqual([]);
      expect(state.measurements).toEqual([]);
    });
  });

  /* ---- Copilot synchronization metadata ---- */

  describe("copilot synchronization metadata", () => {
    it("defaults to empty selection / AOI / analysis layers", () => {
      const s = useMapExplorerStore.getState();
      expect(s.selectedFeatureIds).toEqual({});
      expect(s.activeAoiId).toBeUndefined();
      expect(s.activeAnalysisResultLayerIds).toEqual([]);
      expect(s.pendingCopilotActionCount).toBe(0);
      expect(s.lastContextSnapshotId).toBeUndefined();
    });

    it("setSelectedFeatures stores ids per layer", () => {
      useMapExplorerStore.getState().setSelectedFeatures("layer-a", ["f1", "f2"]);
      useMapExplorerStore.getState().setSelectedFeatures("layer-b", ["f3"]);
      expect(useMapExplorerStore.getState().selectedFeatureIds).toEqual({
        "layer-a": ["f1", "f2"],
        "layer-b": ["f3"],
      });
    });

    it("setSelectedFeatures with empty array drops the layer key", () => {
      useMapExplorerStore.getState().setSelectedFeatures("layer-a", ["f1"]);
      useMapExplorerStore.getState().setSelectedFeatures("layer-a", []);
      expect(useMapExplorerStore.getState().selectedFeatureIds).toEqual({});
    });

    it("clearSelectedFeatures() wipes all layers", () => {
      useMapExplorerStore.getState().setSelectedFeatures("layer-a", ["f1"]);
      useMapExplorerStore.getState().setSelectedFeatures("layer-b", ["f2"]);
      useMapExplorerStore.getState().clearSelectedFeatures();
      expect(useMapExplorerStore.getState().selectedFeatureIds).toEqual({});
    });

    it("clearSelectedFeatures(layerId) wipes only one layer", () => {
      useMapExplorerStore.getState().setSelectedFeatures("layer-a", ["f1"]);
      useMapExplorerStore.getState().setSelectedFeatures("layer-b", ["f2"]);
      useMapExplorerStore.getState().clearSelectedFeatures("layer-a");
      expect(useMapExplorerStore.getState().selectedFeatureIds).toEqual({
        "layer-b": ["f2"],
      });
    });

    it("setActiveAoi stores and clears the AOI id", () => {
      useMapExplorerStore.getState().setActiveAoi("aoi-1");
      expect(useMapExplorerStore.getState().activeAoiId).toBe("aoi-1");
      useMapExplorerStore.getState().setActiveAoi(undefined);
      expect(useMapExplorerStore.getState().activeAoiId).toBeUndefined();
    });

    it("setActiveAnalysisResultLayers copies the provided ids", () => {
      const input = ["result-1", "result-2"];
      useMapExplorerStore.getState().setActiveAnalysisResultLayers(input);
      const stored = useMapExplorerStore.getState().activeAnalysisResultLayerIds;
      expect(stored).toEqual(["result-1", "result-2"]);
      // Ensure it's a copy, not the same reference
      expect(stored).not.toBe(input);
    });

    it("emitCopilotContextSnapshot records the snapshot id", () => {
      useMapExplorerStore.getState().emitCopilotContextSnapshot({
        snapshotId: "snap-42",
        mode: "modal",
        viewport: {
          center: [29, 41],
          zoom: 10,
          bearing: 0,
          pitch: 0,
          bounds: [28.9, 40.9, 29.1, 41.1],
          crs: "EPSG:4326",
        },
        activeBaseLayer: "dark",
        visibleLayers: [],
        selectedFeatures: [],
        activeAnalysisResults: [],
        updatedAt: "2026-04-24T00:00:00.000Z",
      });
      expect(useMapExplorerStore.getState().lastContextSnapshotId).toBe("snap-42");
    });

    it("pendingCopilotActionCount tracks proposed/preview proposals", () => {
      const { queueCopilotActionProposal, applyCopilotActionProposal, previewCopilotActionProposal } =
        useMapExplorerStore.getState();

      queueCopilotActionProposal({
        id: "prop-1",
        kind: "toggleLayer",
        title: "Toggle",
        rationale: "",
        expectedEffect: "",
        riskLevel: "low",
        previewPayload: { kind: "toggleLayer", layerId: "layer-a", visible: true },
        applyPayload: { kind: "toggleLayer", layerId: "layer-a", visible: true },
        evidence: [],
      });
      queueCopilotActionProposal({
        id: "prop-2",
        kind: "toggleLayer",
        title: "Toggle 2",
        rationale: "",
        expectedEffect: "",
        riskLevel: "low",
        previewPayload: { kind: "toggleLayer", layerId: "layer-b", visible: true },
        applyPayload: { kind: "toggleLayer", layerId: "layer-b", visible: true },
        evidence: [],
      });
      expect(useMapExplorerStore.getState().pendingCopilotActionCount).toBe(2);

      previewCopilotActionProposal("prop-1");
      expect(useMapExplorerStore.getState().pendingCopilotActionCount).toBe(2);

      applyCopilotActionProposal("prop-1");
      expect(useMapExplorerStore.getState().pendingCopilotActionCount).toBe(1);

      applyCopilotActionProposal("prop-2");
      expect(useMapExplorerStore.getState().pendingCopilotActionCount).toBe(0);
    });

    it("bounds copilot proposal history and audit trail for long-lived sessions", () => {
      const {
        queueCopilotActionProposal,
        applyCopilotActionProposal,
      } = useMapExplorerStore.getState();

      for (let index = 0; index < 320; index += 1) {
        const proposalId = `prop-bounded-${index}`;
        queueCopilotActionProposal({
          id: proposalId,
          kind: "toggleLayer",
          title: `Toggle ${index}`,
          rationale: "",
          expectedEffect: "",
          riskLevel: "low",
          previewPayload: { kind: "toggleLayer", layerId: `layer-${index}`, visible: true },
          applyPayload: { kind: "toggleLayer", layerId: `layer-${index}`, visible: true },
          evidence: [],
        });
        applyCopilotActionProposal(proposalId);
      }

      const state = useMapExplorerStore.getState();
      expect(state.copilotActionProposals.length).toBeLessThanOrEqual(50);
      expect(state.copilotAuditTrail.length).toBeLessThanOrEqual(200);
      // most-recent proposal is preserved
      expect(state.copilotActionProposals.at(-1)?.id).toBe("prop-bounded-319");
      expect(state.copilotAuditTrail.at(-1)?.proposalId).toBe("prop-bounded-319");
    });
  });

  /* ---- Persistence ---- */

  describe("persistence", () => {
    /* These tests reset the module registry and dynamically re-import
       the store so that the persist middleware initialises AFTER the
       localStorage mock is already on globalThis. */
    async function freshStore() {
      vi.resetModules();
      const mod = await import("../useMapExplorerStore");
      return mod.useMapExplorerStore;
    }

    it("persists to localStorage under synapse-map-explorer", async () => {
      const store = await freshStore();
      store.getState().addPin(makePin("p1"));
      store.getState().setBaseLayer("streets");
      store.getState().setViewport({ zoom: 15 });
      vi.advanceTimersByTime(250);

      const raw = localStorage.getItem("synapse-map-explorer");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.pins).toHaveLength(1);
      expect(parsed.state.activeBaseLayer).toBe("streets");
      expect(parsed.state.zoom).toBe(15);
    });

    it("does NOT persist isOpen", async () => {
      const store = await freshStore();
      store.getState().open();
      const raw = localStorage.getItem("synapse-map-explorer");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.isOpen).toBeUndefined();
    });

    it("does NOT persist activeTool", async () => {
      const store = await freshStore();
      store.getState().setActiveTool("pin");
      const raw = localStorage.getItem("synapse-map-explorer");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.activeTool).toBeUndefined();
    });

    it("does NOT persist overlayLayers", async () => {
      const store = await freshStore();
      store.getState().addOverlayLayer(makeLayer("l1"));
      const raw = localStorage.getItem("synapse-map-explorer");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.overlayLayers).toBeUndefined();
    });

    it("persists lightweight copilot metadata (selection / AOI / analysis layers)", async () => {
      const store = await freshStore();
      store.getState().setSelectedFeatures("layer-a", ["f1", "f2"]);
      store.getState().setActiveAoi("aoi-1");
      store.getState().setActiveAnalysisResultLayers(["r1", "r2"]);

      const raw = localStorage.getItem("synapse-map-explorer");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.selectedFeatureIds).toEqual({ "layer-a": ["f1", "f2"] });
      expect(parsed.state.activeAoiId).toBe("aoi-1");
      expect(parsed.state.activeAnalysisResultLayerIds).toEqual(["r1", "r2"]);
    });

    it("does NOT persist transient copilot state (snapshots, proposals, audit, pending count)", async () => {
      const store = await freshStore();
      store.getState().emitCopilotContextSnapshot({
        snapshotId: "snap-1",
        mode: "modal",
        viewport: {
          center: [29, 41],
          zoom: 10,
          bearing: 0,
          pitch: 0,
          bounds: [28.9, 40.9, 29.1, 41.1],
          crs: "EPSG:4326",
        },
        activeBaseLayer: "dark",
        visibleLayers: [],
        selectedFeatures: [],
        activeAnalysisResults: [],
        updatedAt: "2026-04-24T00:00:00.000Z",
      });
      store.getState().queueCopilotActionProposal({
        id: "prop-1",
        kind: "toggleLayer",
        title: "Toggle",
        rationale: "",
        expectedEffect: "",
        riskLevel: "low",
        previewPayload: { kind: "toggleLayer", layerId: "layer-a", visible: true },
        applyPayload: { kind: "toggleLayer", layerId: "layer-a", visible: true },
        evidence: [],
      });

      const raw = localStorage.getItem("synapse-map-explorer");
      const parsed = JSON.parse(raw!);
      expect(parsed.state.lastCopilotContextSnapshot).toBeUndefined();
      expect(parsed.state.copilotActionProposals).toBeUndefined();
      expect(parsed.state.copilotAuditTrail).toBeUndefined();
      expect(parsed.state.pendingCopilotActionCount).toBeUndefined();
      expect(parsed.state.lastContextSnapshotId).toBeUndefined();
    });

    it("restores persisted state on rehydration", async () => {
      const stored = {
        state: {
          center: [10, 20] as [number, number],
          zoom: 5,
          bearing: 30,
          pitch: 15,
          activeBaseLayer: "satellite",
          pins: [makePin("restored")],
          selectedFeatureIds: { "layer-a": ["f1", "f2"] },
          activeAoiId: "aoi-persisted",
          activeAnalysisResultLayerIds: ["r1"],
        },
        version: 0,
      };
      localStorage.setItem("synapse-map-explorer", JSON.stringify(stored));

      const store = await freshStore();

      const s = store.getState();
      expect(s.center).toEqual([10, 20]);
      expect(s.zoom).toBe(5);
      expect(s.bearing).toBe(30);
      expect(s.pitch).toBe(15);
      expect(s.activeBaseLayer).toBe("satellite");
      expect(s.pins).toHaveLength(1);
      expect(s.pins[0].id).toBe("restored");
      expect(s.selectedFeatureIds).toEqual({ "layer-a": ["f1", "f2"] });
      expect(s.activeAoiId).toBe("aoi-persisted");
      expect(s.activeAnalysisResultLayerIds).toEqual(["r1"]);
      // Non-persisted fields remain at defaults
      expect(s.isOpen).toBe(false);
      expect(s.activeTool).toBeNull();
      expect(s.overlayLayers).toEqual([]);
      expect(s.pendingCopilotActionCount).toBe(0);
      expect(s.lastContextSnapshotId).toBeUndefined();
    });
  });

  /* ---- State shape completeness ---- */

  describe("state shape", () => {
    it("exports all expected keys", () => {
      const s = useMapExplorerStore.getState();
      const keys = Object.keys(s);
      const expected = [
        "isOpen", "open", "close", "toggle",
        "center", "zoom", "bearing", "pitch", "setViewport",
        "activeBaseLayer", "setBaseLayer",
        "pins", "addPin", "removePin", "updatePin", "clearPins", "replacePins",
        "activeTool", "setActiveTool",
        "overlayLayers", "addOverlayLayer", "removeOverlayLayer",
        "toggleLayerVisibility", "reorderLayers", "replaceOverlayLayers",
        "drawnFeatures", "replaceDrawnFeatures",
        "restoreProjectState", "clearProjectContent",
        "selectedFeatureIds", "setSelectedFeatures", "clearSelectedFeatures",
        "activeAoiId", "setActiveAoi",
        "activeAnalysisResultLayerIds", "setActiveAnalysisResultLayers",
        "pendingCopilotActionCount", "lastContextSnapshotId",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });

    it("actions are functions", () => {
      const s = useMapExplorerStore.getState();
      const fns = [
        "open", "close", "toggle", "setViewport", "setBaseLayer",
        "addPin", "removePin", "updatePin", "clearPins",
        "setActiveTool", "addOverlayLayer", "removeOverlayLayer",
        "toggleLayerVisibility", "reorderLayers",
        "replacePins", "replaceOverlayLayers", "replaceDrawnFeatures",
        "restoreProjectState", "clearProjectContent",
        "setSelectedFeatures", "clearSelectedFeatures",
        "setActiveAoi", "setActiveAnalysisResultLayers",
      ];
      for (const fn of fns) {
        expect(typeof (s as Record<string, unknown>)[fn]).toBe("function");
      }
    });
  });
});
