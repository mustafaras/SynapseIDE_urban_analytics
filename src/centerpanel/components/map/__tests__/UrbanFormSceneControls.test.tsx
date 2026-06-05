// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { SunShadowPanel } from "../scene3d/SunShadowPanel";
import { MassingScenarioPanel } from "../zoning/MassingScenarioPanel";
import { ZoningRulesPanel } from "../zoning/ZoningRulesPanel";
import { useMassingStore } from "@/stores/useMassingStore";
import { useSunShadowStore } from "@/stores/useSunShadowStore";
import { useZoningStore } from "@/stores/useZoningStore";
import type { ZoningRuleInput } from "@/services/map/zoning/ZoningRuleEngine";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

const projectedParcel: Feature<Polygon> = {
  type: "Feature",
  id: "parcel-1",
  properties: { id: "parcel-1" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [100, 0],
        [100, 80],
        [0, 80],
        [0, 0],
      ],
    ],
  },
};

const parcelCollection: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [projectedParcel],
};

const shadowBuilding: Feature<Polygon> = {
  type: "Feature",
  id: "shadow-building-1",
  properties: { id: "shadow-building-1" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [28.9000, 41.0000],
        [28.9004, 41.0000],
        [28.9004, 41.0003],
        [28.9000, 41.0003],
        [28.9000, 41.0000],
      ],
    ],
  },
};

const zoningRuleInput: ZoningRuleInput = {
  name: "Mixed use compact",
  zoneCode: "MX-2",
  maxFAR: 3,
  maxCoverageRatio: 0.6,
  maxHeightMetres: 30,
  minSetbackMetres: 5,
  minParcelAreaM2: 100,
  notes: "Test rule",
};

function render(node: React.ReactNode): void {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(node);
  });
}

function query(testId: string): Element | null {
  return host!.querySelector(`[data-testid="${testId}"]`);
}

function text(testId: string): string {
  return query(testId)?.textContent ?? "";
}

function click(testId: string): void {
  const element = query(testId);
  if (!element) throw new Error(`${testId} was not rendered`);
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function seedZoningPrerequisites(): void {
  const rule = useZoningStore.getState().addRule(zoningRuleInput);
  useZoningStore.getState().setActiveParcelLayer("parcel-layer", parcelCollection, "EPSG:32635");
  useZoningStore.getState().assignRule("parcel-1", rule.id);
}

function resetStores(): void {
  useZoningStore.setState({
    rules: [],
    activeLayerId: null,
    activeParcels: null,
    activeDeclaredCrs: null,
    assignments: [],
    metricsIndex: {},
  });
  useMassingStore.setState({
    scenarios: [],
    activeScenarioId: null,
    comparisonMetadata: null,
  });
  useSunShadowStore.setState({
    timelineHours: [6, 8, 10, 12, 14, 16, 18],
    activeHourIndex: 3,
    activeDateTime: "2026-06-04T12:00:00.000Z",
    latitude: 41.0,
    longitude: 28.9,
    scenarios: [],
    activeScenarioId: null,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  resetStores();
});

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
  }
  host?.remove();
  root = null;
  host = null;
  resetStores();
  window.localStorage.clear();
});

describe("Urban form scene controls", () => {
  it("keeps zoning CRS, vertical assumptions, parcel prerequisites, and envelope state visible", () => {
    seedZoningPrerequisites();

    render(
      <ZoningRulesPanel
        visible
        presentation="embedded"
        selectedParcelId="parcel-1"
        verticalDatum="EGM96 geoid height"
        buildingPrerequisiteCount={2}
        onClose={() => undefined}
      />,
    );

    expect(text("zoning-urban-form-assumptions")).toContain("Urban form prerequisites");
    expect(text("zoning-projected-crs")).toContain("EPSG:32635");
    expect(text("zoning-vertical-assumption")).toContain("EGM96 geoid height");
    expect(text("zoning-building-prerequisite-chip")).toContain("Buildings: 2 context");
    expect(text("zoning-envelope-summary")).toContain("Zoning envelope");
    expect(text("zoning-envelope-summary")).toContain("Buildable area");
    expect(text("zoning-envelope-summary")).not.toContain("CRS blocked");
  });

  it("generates massing alternatives only when parcel, rule, and projected CRS are available", () => {
    seedZoningPrerequisites();

    render(
      <MassingScenarioPanel
        visible
        presentation="embedded"
        parcelId="parcel-1"
        verticalDatum="EGM96 geoid height"
        buildingPrerequisiteCount={1}
        onClose={() => undefined}
      />,
    );

    expect(text("massing-urban-form-assumptions")).toContain("Urban form prerequisites");
    expect(text("massing-projected-crs")).toContain("EPSG:32635");
    expect(text("massing-vertical-assumption")).toContain("EGM96 geoid height");
    expect(text("massing-rule-prerequisite-chip")).toContain("MX-2");

    click("massing-add-toggle");
    click("massing-add-submit");

    expect(text("massing-output-state-chip")).toContain("Alternatives: 1 generated");
    expect(text("massing-scenario-chips")).toContain("Generated massing");
    expect(text("massing-scenario-chips")).toContain("Scenario");
  });

  it("surfaces sun shadow demo runtime, vertical basis, generated state, and evidence readiness", () => {
    useSunShadowStore.getState().addScenario([shadowBuilding], [18], 8000, "Noon shadow");

    render(
      <SunShadowPanel
        visible
        presentation="embedded"
        onClose={() => undefined}
      />,
    );

    expect(text("sunshadow-urban-form-assumptions")).toContain("Urban form assumptions");
    expect(text("sunshadow-projected-crs")).toContain("EPSG:4326 display");
    expect(text("sunshadow-vertical-assumption")).toContain("assumed-flat-terrain");
    expect(text("sunshadow-runtime-assumption")).toContain("demo-mode");
    expect(text("sunshadow-evidence-state-chip")).toContain("Shadow evidence ready");
    expect(text("sunshadow-scenario-chips")).toContain("Generated shadow");
    expect(text("sunshadow-scenario-chips")).toContain("user-provided");
  });
});
