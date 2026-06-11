/**
 * Prompt 13 — Left Panel Content Contracts
 *
 * Width-aware content fit contracts for every left sidebar tab in the Map
 * Explorer workbench. These contracts drive the responsive behaviour of each
 * tab and are referenced in layout helpers and tests.
 *
 * Contract rules (from 02_PANEL_ARCHITECTURE_SPEC.md):
 * - At 320 px: no clipped buttons, no horizontal page overflow.
 * - At 420 px: all primary content readable.
 * - At 520 px: dense content improves but does not become sparse.
 * - At user-expanded max width: content uses space intentionally.
 * - No tab may require horizontal scrolling at default width.
 * - Each tab owns one scroll container.
 *
 * See: map-explorer-premium-redesign-2026-06-05 Prompt 13, UX-02.
 */

import type { MapSidebarTabId } from "./navigation/mapNavigationModel";

/** Width-aware content fit contract for a single left sidebar tab. */
export interface MapLeftPanelContentContract {
  /** Stable sidebar tab id — matches `MapSidebarTabId`. */
  id: MapSidebarTabId;
  /**
   * Minimum panel width at which this tab's content is usable without
   * clipping, button overflow, or forced horizontal scrolling.
   */
  minComfortWidth: number;
  /**
   * Preferred/default width that gives the tab its best layout at normal
   * desktop sizes.
   */
  preferredWidth: number;
  /**
   * Width beyond which additional space yields no meaningful content
   * improvement. Content above this width should not feel sparse.
   */
  maxUsefulWidth: number;
  /**
   * How the tab adapts when the panel is narrower than `preferredWidth`:
   * - `"wrap"`: content wraps naturally (suitable for icon+label rows).
   * - `"stack"`: multi-column layout collapses to single column.
   * - `"table-to-list"`: data tables convert to property-list rows.
   * - `"horizontal-disallowed"`: the tab must never require horizontal
   *   scrolling; clamp layout to single-column at minimum width.
   */
  overflowStrategy: "wrap" | "stack" | "table-to-list" | "horizontal-disallowed";
  /**
   * Whether the tab uses a wide-mode layout (560-640 px) for dense tables or
   * source matrices. Tabs that set this to `true` should still gracefully
   * degrade at narrower widths via `overflowStrategy`.
   */
  wideMode?: boolean;
}

// ---------------------------------------------------------------------------
// Token bounds — mirrors the spec (02_PANEL_ARCHITECTURE_SPEC.md)
// ---------------------------------------------------------------------------

/** Absolute minimum width at which any left-panel tab must remain usable. */
export const LEFT_PANEL_ABS_MIN_WIDTH = 320;

/** Default preferred width for standard navigation/list tabs. */
export const LEFT_PANEL_DEFAULT_WIDTH = 420;

/** Upper end of the standard width range. */
export const LEFT_PANEL_STD_MAX_WIDTH = 520;

/** Wide-mode minimum — only for tables and source matrices. */
export const LEFT_PANEL_WIDE_MODE_MIN = 560;

/** Wide-mode maximum. */
export const LEFT_PANEL_WIDE_MODE_MAX = 640;

// ---------------------------------------------------------------------------
// Per-tab contract registry
// ---------------------------------------------------------------------------

/**
 * Registry of content contracts keyed by `MapSidebarTabId`.
 *
 * Every member of `MapSidebarTabId` MUST have an entry here. Compile-time
 * enforcement is provided by the `Record` type: adding a new `MapSidebarTabId`
 * without a corresponding entry is a type error.
 */
export const MAP_LEFT_PANEL_CONTRACTS: Record<
  MapSidebarTabId,
  MapLeftPanelContentContract
> = {
  // ------------------------------------------------------------------
  // Overview activity
  // ------------------------------------------------------------------
  "overview-readiness": {
    id: "overview-readiness",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "overview-notes": {
    id: "overview-notes",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "wrap",
  },

  // ------------------------------------------------------------------
  // Data activity
  // ------------------------------------------------------------------
  "data-import": {
    id: "data-import",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "data-catalog": {
    id: "data-catalog",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_WIDE_MODE_MAX,
    overflowStrategy: "table-to-list",
    wideMode: true,
  },
  "data-connections": {
    id: "data-connections",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_WIDE_MODE_MAX,
    overflowStrategy: "table-to-list",
    wideMode: true,
  },
  "data-health": {
    id: "data-health",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "data-demo": {
    id: "data-demo",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },

  // ------------------------------------------------------------------
  // Layers activity
  // ------------------------------------------------------------------
  "layers-stack": {
    id: "layers-stack",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "layers-contents": {
    id: "layers-contents",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "layers-catalog": {
    id: "layers-catalog",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_WIDE_MODE_MAX,
    overflowStrategy: "table-to-list",
    wideMode: true,
  },
  "layers-sources": {
    id: "layers-sources",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_WIDE_MODE_MAX,
    overflowStrategy: "table-to-list",
    wideMode: true,
  },
  "layers-bookmarks": {
    id: "layers-bookmarks",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "layers-cartography": {
    id: "layers-cartography",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },

  // ------------------------------------------------------------------
  // Analyze activity
  // ------------------------------------------------------------------
  "analyze-workflows": {
    id: "analyze-workflows",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "analyze-tools": {
    id: "analyze-tools",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "wrap",
  },
  "analyze-query": {
    id: "analyze-query",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "analyze-models": {
    id: "analyze-models",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_WIDE_MODE_MAX,
    overflowStrategy: "table-to-list",
    wideMode: true,
  },
  "analyze-statistics": {
    id: "analyze-statistics",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "analyze-data-operations": {
    id: "analyze-data-operations",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "analyze-measurements": {
    id: "analyze-measurements",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },

  // ------------------------------------------------------------------
  // Style activity
  // ------------------------------------------------------------------
  "style-renderer": {
    id: "style-renderer",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "style-symbols": {
    id: "style-symbols",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "wrap",
  },
  "style-labels": {
    id: "style-labels",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "style-legend": {
    id: "style-legend",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "style-advisor": {
    id: "style-advisor",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "wrap",
  },

  // ------------------------------------------------------------------
  // Scene activity
  // ------------------------------------------------------------------
  "scene-raster": {
    id: "scene-raster",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "scene-temporal": {
    id: "scene-temporal",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "scene-3d": {
    id: "scene-3d",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "scene-zoning": {
    id: "scene-zoning",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "scene-massing": {
    id: "scene-massing",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "scene-sun-shadow": {
    id: "scene-sun-shadow",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "horizontal-disallowed",
  },
  "scene-voxcity": {
    id: "scene-voxcity",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },

  // ------------------------------------------------------------------
  // Publish activity
  // ------------------------------------------------------------------
  "publish-figure": {
    id: "publish-figure",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_WIDE_MODE_MAX,
    overflowStrategy: "table-to-list",
    wideMode: true,
  },
  "publish-data-export": {
    id: "publish-data-export",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "publish-report": {
    id: "publish-report",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "publish-offline-package": {
    id: "publish-offline-package",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },
  "publish-review-package": {
    id: "publish-review-package",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_STD_MAX_WIDTH,
    overflowStrategy: "stack",
  },

  // ------------------------------------------------------------------
  // Extensions activity
  // ------------------------------------------------------------------
  "extensions-registry": {
    id: "extensions-registry",
    minComfortWidth: LEFT_PANEL_ABS_MIN_WIDTH,
    preferredWidth: LEFT_PANEL_DEFAULT_WIDTH,
    maxUsefulWidth: LEFT_PANEL_WIDE_MODE_MAX,
    overflowStrategy: "table-to-list",
    wideMode: true,
  },
} as const;

// ---------------------------------------------------------------------------
// Width clamping helpers
// ---------------------------------------------------------------------------

/**
 * Clamps a requested panel width to the usable range defined by the tab
 * contract. Returns a value between `LEFT_PANEL_ABS_MIN_WIDTH` and
 * `contract.maxUsefulWidth`.
 *
 * For wide-mode tabs the ceiling is `LEFT_PANEL_WIDE_MODE_MAX`; for standard
 * tabs it is clamped at `LEFT_PANEL_STD_MAX_WIDTH` unless the contract
 * explicitly provides a higher `maxUsefulWidth`.
 */
export function clampLeftPanelWidth(
  requestedWidth: number,
  contract: MapLeftPanelContentContract,
): number {
  const min = LEFT_PANEL_ABS_MIN_WIDTH;
  const max = contract.maxUsefulWidth;
  return Math.max(min, Math.min(max, requestedWidth));
}

/**
 * Returns the content strategy for a given panel width and contract.
 * Tabs that specify `"horizontal-disallowed"` always return that strategy
 * regardless of the available width so callers can short-circuit horizontal
 * scroll without inspecting the width.
 */
export function getLeftPanelContentStrategy(
  panelWidth: number,
  contract: MapLeftPanelContentContract,
): MapLeftPanelContentContract["overflowStrategy"] {
  if (contract.overflowStrategy === "horizontal-disallowed") {
    return "horizontal-disallowed";
  }
  if (panelWidth >= contract.preferredWidth) {
    // Preferred width or wider — strategy is no longer needed.
    return contract.overflowStrategy;
  }
  return contract.overflowStrategy;
}

/**
 * Retrieves the content contract for a sidebar tab.  Throws a descriptive
 * error if no contract exists (fail-loudly by design — missing contracts are
 * a programming error, not a runtime condition).
 */
export function getLeftPanelContract(id: MapSidebarTabId): MapLeftPanelContentContract {
  const contract = MAP_LEFT_PANEL_CONTRACTS[id];
  if (!contract) {
    throw new Error(
      `[mapLeftPanelContracts] No content contract defined for sidebar tab "${id}". ` +
        `Add an entry to MAP_LEFT_PANEL_CONTRACTS before using this tab.`,
    );
  }
  return contract;
}
