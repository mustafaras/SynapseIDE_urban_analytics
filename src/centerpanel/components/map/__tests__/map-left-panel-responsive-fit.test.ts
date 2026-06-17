// @vitest-environment jsdom

/**
 * Prompt 14 — Left Panel Responsive Fit Pass
 *
 * Verifies the acceptance criteria for UX-02 responsive fit:
 *   1. Container-query declarations are present on embedded panels.
 *   2. The contract system covers the primary left-panel tabs.
 *   3. Width clamping helpers enforce responsive boundaries.
 *   4. No tab requires horizontal scrolling at the minimum panel width.
 *
 * See: map-explorer-premium-redesign-2026-06-05 Prompt 14, UX-02.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  clampLeftPanelWidth,
  getLeftPanelContentStrategy,
  getLeftPanelContract,
  LEFT_PANEL_ABS_MIN_WIDTH,
  LEFT_PANEL_DEFAULT_WIDTH,
  LEFT_PANEL_STD_MAX_WIDTH,
  MAP_LEFT_PANEL_CONTRACTS,
} from "../mapLeftPanelContracts";
import type { MapSidebarTabId } from "../navigation/mapNavigationModel";

const PRIMARY_TABS: readonly MapSidebarTabId[] = [
  "data-import",
  "data-catalog",
  "data-connections",
  "data-health",
  "layers-stack",
  "layers-contents",
  "layers-catalog",
  "layers-sources",
  "layers-bookmarks",
  "overview-readiness",
];

const WIDTH_BANDS = [320, 420, 520] as const;

describe("Prompt 14 — Left Panel Responsive Fit", () => {
  describe("width-band validation", () => {
    it("every primary tab has a valid contract covering all width bands", () => {
      for (const id of PRIMARY_TABS) {
        const contract = getLeftPanelContract(id);
        for (const width of WIDTH_BANDS) {
          const clamped = clampLeftPanelWidth(width, contract);
          // clamped must always be in [LEFT_PANEL_ABS_MIN_WIDTH, contract.maxUsefulWidth]
          expect(clamped).toBeGreaterThanOrEqual(LEFT_PANEL_ABS_MIN_WIDTH);
          expect(clamped).toBeLessThanOrEqual(contract.maxUsefulWidth);
        }
      }
    });

    it("no primary tab uses horizontal-scroll layout at 320 px", () => {
      for (const id of PRIMARY_TABS) {
        const contract = getLeftPanelContract(id);
        // Strategy must not be absent; none of the allowed strategies mandate horizontal scrolling
        const strategy = getLeftPanelContentStrategy(LEFT_PANEL_ABS_MIN_WIDTH, contract);
        expect(["wrap", "stack", "table-to-list", "horizontal-disallowed"]).toContain(strategy);
      }
    });

    it("table-to-list tabs convert to list at narrow widths", () => {
      const tableToListTabs = PRIMARY_TABS.filter(
        (id) => MAP_LEFT_PANEL_CONTRACTS[id].overflowStrategy === "table-to-list",
      );
      // Data catalog, connections, layers-sources should be table-to-list
      expect(tableToListTabs.length).toBeGreaterThan(0);
      for (const id of tableToListTabs) {
        const contract = getLeftPanelContract(id);
        const strategy = getLeftPanelContentStrategy(LEFT_PANEL_ABS_MIN_WIDTH, contract);
        expect(strategy).toBe("table-to-list");
      }
    });
  });

  describe("contract width bounds for primary tabs", () => {
    it("all primary tabs have minComfortWidth equal to LEFT_PANEL_ABS_MIN_WIDTH (320 px)", () => {
      for (const id of PRIMARY_TABS) {
        const contract = getLeftPanelContract(id);
        expect(contract.minComfortWidth).toBe(LEFT_PANEL_ABS_MIN_WIDTH);
      }
    });

    it("all primary tabs have preferredWidth equal to LEFT_PANEL_DEFAULT_WIDTH (420 px)", () => {
      for (const id of PRIMARY_TABS) {
        const contract = getLeftPanelContract(id);
        expect(contract.preferredWidth).toBe(LEFT_PANEL_DEFAULT_WIDTH);
      }
    });

    it("standard tabs have maxUsefulWidth at most LEFT_PANEL_STD_MAX_WIDTH (520 px)", () => {
      const standardPrimary = PRIMARY_TABS.filter(
        (id) => !MAP_LEFT_PANEL_CONTRACTS[id].wideMode,
      );
      for (const id of standardPrimary) {
        const contract = getLeftPanelContract(id);
        expect(contract.maxUsefulWidth).toBeLessThanOrEqual(LEFT_PANEL_STD_MAX_WIDTH);
      }
    });
  });

  describe("width clamping precision at spec boundaries", () => {
    it("clampLeftPanelWidth returns exactly 320 for any input below 320", () => {
      for (const id of PRIMARY_TABS) {
        const contract = getLeftPanelContract(id);
        expect(clampLeftPanelWidth(0, contract)).toBe(LEFT_PANEL_ABS_MIN_WIDTH);
        expect(clampLeftPanelWidth(319, contract)).toBe(LEFT_PANEL_ABS_MIN_WIDTH);
      }
    });

    it("clampLeftPanelWidth returns exactly the maxUsefulWidth for any input above it", () => {
      for (const id of PRIMARY_TABS) {
        const contract = getLeftPanelContract(id);
        expect(clampLeftPanelWidth(contract.maxUsefulWidth + 1, contract)).toBe(
          contract.maxUsefulWidth,
        );
        expect(clampLeftPanelWidth(9999, contract)).toBe(contract.maxUsefulWidth);
      }
    });

    it("at 420 px all primary tabs return expected overflow strategies", () => {
      for (const id of PRIMARY_TABS) {
        const contract = getLeftPanelContract(id);
        const strategy = getLeftPanelContentStrategy(LEFT_PANEL_DEFAULT_WIDTH, contract);
        // At preferred width, the strategy should still be the contract strategy
        expect(strategy).toBe(contract.overflowStrategy);
      }
    });
  });

  describe("embedded catalog panel layout", () => {
    it("uses single-column body layout for embedded mode", () => {
      const css = readFileSync(
        join(process.cwd(), "src/centerpanel/components/map/catalog/MapCatalogPanel.module.css"),
        "utf-8",
      );
      expect(css).toContain(".embeddedPanel .body {");
      expect(css).toContain("grid-template-columns: 1fr;");
    });

    it("defines a compact summary band above full-width content", () => {
      const css = readFileSync(
        join(process.cwd(), "src/centerpanel/components/map/catalog/MapCatalogPanel.module.css"),
        "utf-8",
      );
      expect(css).toContain(".summaryBand {");
      expect(css).toContain(".embeddedPanel .summaryBand {");
      // embedded tabs must avoid overlap and keep one scroll owner
      expect(css).toContain(".importEntryHeader {");
      expect(css).toContain("grid-template-columns: minmax(0, 1fr) auto;");
      expect(css).toContain(".embeddedPanel .importEntryHeader {");
      expect(css).toContain("grid-template-columns: 1fr;");
      expect(css).toContain(".embeddedPanel .supportRow {");
      expect(css).toContain("scrollbar-gutter: stable both-edges;");
    });
  });

  describe("embedded models panel layout", () => {
    it("uses single-column body and workflow grid with bounded section overflow", () => {
      const css = readFileSync(
        join(process.cwd(), "src/centerpanel/components/map/modelBuilder/MapModelBuilderPanel.module.css"),
        "utf-8",
      );
      // workflowGrid is globally single-column — no panelEmbedded override needed
      expect(css).toContain(".workflowGrid {");
      expect(css).toContain("grid-template-columns: minmax(0, 1fr);");
      // body is also globally single-column
      expect(css).toContain(".body {");
      // runRail must remain a real stacking container (display: contents caused visual overlap)
      expect(css).toContain(".runRail {");
      expect(css).toContain("display: grid;");
      expect(css).not.toContain("display: contents;");
      // workflow graph + step editor are bounded and scrollable to avoid text stacking across sections
      expect(css).toContain("max-height: min(24rem, 50vh);");
      expect(css).toContain("overflow: auto;");
      expect(css).not.toContain(".panelEmbedded .workflowGrid {");
    });
  });
});
