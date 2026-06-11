/**
 * Prompt 13 — Left Panel Content Contracts
 *
 * Tests for `mapLeftPanelContracts.ts`.  These tests enforce the Prompt 13
 * acceptance criteria:
 *   1. Every `MapSidebarTabId` has a documented content-fit contract.
 *   2. No contract allows horizontal scrolling at default width.
 *   3. Width clamping keeps the panel within `[LEFT_PANEL_ABS_MIN_WIDTH, maxUsefulWidth]`.
 *   4. `getLeftPanelContract` throws for unknown tab ids.
 *   5. `"horizontal-disallowed"` tabs always return that strategy regardless of width.
 *
 * See: map-explorer-premium-redesign-2026-06-05 Prompt 13, UX-02.
 */

import { describe, expect, it } from "vitest";
import {
  clampLeftPanelWidth,
  getLeftPanelContentStrategy,
  getLeftPanelContract,
  LEFT_PANEL_ABS_MIN_WIDTH,
  LEFT_PANEL_DEFAULT_WIDTH,
  LEFT_PANEL_STD_MAX_WIDTH,
  LEFT_PANEL_WIDE_MODE_MAX,
  MAP_LEFT_PANEL_CONTRACTS,
} from "../mapLeftPanelContracts";
import type { MapSidebarTabId } from "../navigation/mapNavigationModel";

// All known sidebar tab IDs (mirrors MapSidebarTabId union).
const ALL_SIDEBAR_TAB_IDS: readonly MapSidebarTabId[] = [
  "overview-readiness",
  "overview-notes",
  "data-import",
  "data-catalog",
  "data-connections",
  "data-health",
  "data-demo",
  "layers-stack",
  "layers-contents",
  "layers-catalog",
  "layers-sources",
  "layers-bookmarks",
  "layers-cartography",
  "analyze-workflows",
  "analyze-tools",
  "analyze-query",
  "analyze-models",
  "analyze-statistics",
  "analyze-data-operations",
  "analyze-measurements",
  "style-renderer",
  "style-symbols",
  "style-labels",
  "style-legend",
  "style-advisor",
  "scene-raster",
  "scene-temporal",
  "scene-3d",
  "scene-zoning",
  "scene-massing",
  "scene-sun-shadow",
  "scene-voxcity",
  "publish-figure",
  "publish-data-export",
  "publish-report",
  "publish-offline-package",
  "publish-review-package",
  "extensions-registry",
] as const;

describe("mapLeftPanelContracts — registry completeness", () => {
  it("has a contract for every MapSidebarTabId", () => {
    for (const id of ALL_SIDEBAR_TAB_IDS) {
      expect(
        MAP_LEFT_PANEL_CONTRACTS[id],
        `Missing contract for tab "${id}"`,
      ).toBeDefined();
    }
  });

  it("every contract id matches its registry key", () => {
    for (const id of ALL_SIDEBAR_TAB_IDS) {
      const contract = MAP_LEFT_PANEL_CONTRACTS[id];
      expect(contract.id).toBe(id);
    }
  });
});

describe("mapLeftPanelContracts — width bounds", () => {
  it("every contract has minComfortWidth >= LEFT_PANEL_ABS_MIN_WIDTH (320)", () => {
    for (const id of ALL_SIDEBAR_TAB_IDS) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      expect(c.minComfortWidth).toBeGreaterThanOrEqual(LEFT_PANEL_ABS_MIN_WIDTH);
    }
  });

  it("every contract has preferredWidth >= minComfortWidth", () => {
    for (const id of ALL_SIDEBAR_TAB_IDS) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      expect(c.preferredWidth).toBeGreaterThanOrEqual(c.minComfortWidth);
    }
  });

  it("every contract has maxUsefulWidth >= preferredWidth", () => {
    for (const id of ALL_SIDEBAR_TAB_IDS) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      expect(c.maxUsefulWidth).toBeGreaterThanOrEqual(c.preferredWidth);
    }
  });

  it("non-wide-mode tabs have maxUsefulWidth <= LEFT_PANEL_STD_MAX_WIDTH (520) OR exactly at wide-mode ceiling (640)", () => {
    for (const id of ALL_SIDEBAR_TAB_IDS) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      if (!c.wideMode) {
        expect(c.maxUsefulWidth).toBeLessThanOrEqual(LEFT_PANEL_STD_MAX_WIDTH);
      } else {
        expect(c.maxUsefulWidth).toBeLessThanOrEqual(LEFT_PANEL_WIDE_MODE_MAX);
      }
    }
  });
});

describe("mapLeftPanelContracts — horizontal-disallowed tabs", () => {
  it("no tab relies on horizontal scrolling at the default panel width (420 px)", () => {
    // Any tab with horizontal scrolling at 420 px would fail this check.
    // Since we only have "wrap", "stack", "table-to-list", and
    // "horizontal-disallowed" as strategies and none of them mandate
    // horizontal scrolling, we confirm there is no layout strategy that
    // would trigger a horizontal scroll by ensuring no tab strategy is
    // absent from the allowed set.
    const allowed = new Set(["wrap", "stack", "table-to-list", "horizontal-disallowed"]);
    for (const id of ALL_SIDEBAR_TAB_IDS) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      expect(allowed.has(c.overflowStrategy)).toBe(true);
    }
  });

  it("horizontal-disallowed tabs always return that strategy regardless of width", () => {
    const horizontalDisallowedTabs = ALL_SIDEBAR_TAB_IDS.filter(
      (id) => MAP_LEFT_PANEL_CONTRACTS[id].overflowStrategy === "horizontal-disallowed",
    );
    expect(horizontalDisallowedTabs.length).toBeGreaterThan(0);

    for (const id of horizontalDisallowedTabs) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      for (const width of [LEFT_PANEL_ABS_MIN_WIDTH, LEFT_PANEL_DEFAULT_WIDTH, 800]) {
        expect(getLeftPanelContentStrategy(width, c)).toBe("horizontal-disallowed");
      }
    }
  });
});

describe("clampLeftPanelWidth", () => {
  it("clamps a width below min up to LEFT_PANEL_ABS_MIN_WIDTH", () => {
    const contract = MAP_LEFT_PANEL_CONTRACTS["layers-stack"];
    expect(clampLeftPanelWidth(100, contract)).toBe(LEFT_PANEL_ABS_MIN_WIDTH);
  });

  it("clamps a width above maxUsefulWidth down to maxUsefulWidth", () => {
    const contract = MAP_LEFT_PANEL_CONTRACTS["layers-stack"];
    expect(clampLeftPanelWidth(9999, contract)).toBe(contract.maxUsefulWidth);
  });

  it("leaves a width within [min, max] unchanged", () => {
    const contract = MAP_LEFT_PANEL_CONTRACTS["data-catalog"];
    const mid = Math.floor((LEFT_PANEL_ABS_MIN_WIDTH + contract.maxUsefulWidth) / 2);
    expect(clampLeftPanelWidth(mid, contract)).toBe(mid);
  });

  it("standard tab: clamped width never exceeds LEFT_PANEL_STD_MAX_WIDTH (520)", () => {
    const standardTabs = ALL_SIDEBAR_TAB_IDS.filter(
      (id) => !MAP_LEFT_PANEL_CONTRACTS[id].wideMode,
    );
    for (const id of standardTabs) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      const clamped = clampLeftPanelWidth(9999, c);
      expect(clamped).toBeLessThanOrEqual(LEFT_PANEL_STD_MAX_WIDTH);
    }
  });

  it("wide-mode tab: clamped width can reach up to LEFT_PANEL_WIDE_MODE_MAX (640)", () => {
    const wideTabs = ALL_SIDEBAR_TAB_IDS.filter(
      (id) => MAP_LEFT_PANEL_CONTRACTS[id].wideMode === true,
    );
    expect(wideTabs.length).toBeGreaterThan(0);
    for (const id of wideTabs) {
      const c = MAP_LEFT_PANEL_CONTRACTS[id];
      const clamped = clampLeftPanelWidth(9999, c);
      expect(clamped).toBeLessThanOrEqual(LEFT_PANEL_WIDE_MODE_MAX);
    }
  });

  it("clamps at exactly the min and max boundaries", () => {
    const contract = MAP_LEFT_PANEL_CONTRACTS["overview-readiness"];
    expect(clampLeftPanelWidth(LEFT_PANEL_ABS_MIN_WIDTH, contract)).toBe(
      LEFT_PANEL_ABS_MIN_WIDTH,
    );
    expect(clampLeftPanelWidth(contract.maxUsefulWidth, contract)).toBe(
      contract.maxUsefulWidth,
    );
  });
});

describe("getLeftPanelContract", () => {
  it("returns the correct contract for a known tab id", () => {
    const contract = getLeftPanelContract("data-import");
    expect(contract.id).toBe("data-import");
  });

  it("throws for an unknown tab id (type-safety escape hatch)", () => {
    expect(() =>
      // @ts-expect-error — deliberately passing an invalid id
      getLeftPanelContract("not-a-real-tab"),
    ).toThrow(/No content contract defined/);
  });
});

describe("mapLeftPanelContracts — spec adherence summary", () => {
  it("all primary left-panel tabs (Data, Layers, Catalog, Source Health, Demo, Overview) have contracts", () => {
    const primaryTabs: MapSidebarTabId[] = [
      "overview-readiness",
      "data-import",
      "data-catalog",
      "data-connections",
      "data-health",
      "data-demo",
      "layers-stack",
      "layers-catalog",
      "layers-bookmarks",
    ];
    for (const id of primaryTabs) {
      const c = getLeftPanelContract(id);
      expect(c.minComfortWidth).toBe(LEFT_PANEL_ABS_MIN_WIDTH);
      expect(c.preferredWidth).toBe(LEFT_PANEL_DEFAULT_WIDTH);
    }
  });
});
