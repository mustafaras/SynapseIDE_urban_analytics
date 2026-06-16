import type { DrawToolId } from "./mapTypes";

/**
 * p05 — Drawing first-click open.
 *
 * Pure helpers that decide which drawing tool the drawing surface should open
 * with. Kept UI-free so the open behaviour is unit-testable without rendering
 * the (very large) Map Explorer runtime.
 */

/** All five user-facing draw tools, in toolbar order. */
export const DRAW_TOOL_IDS: readonly DrawToolId[] = [
  "point",
  "linestring",
  "polygon",
  "rectangle",
  "circle",
];

/**
 * Default tool seeded when the drawing surface opens without a tool already
 * active. Polygon is the primary AOI workflow, so the topbar Draw command opens
 * immediately ready to sketch an area of interest rather than landing in the
 * empty "Select" state (which looked like "nothing happened" on first click).
 */
export const DEFAULT_DRAW_TOOL: DrawToolId = "polygon";

export function isDrawToolId(value: unknown): value is DrawToolId {
  return typeof value === "string" && DRAW_TOOL_IDS.includes(value as DrawToolId);
}

/**
 * Resolve which drawing tool should be active when the drawing surface opens.
 *
 * Priority:
 *   1. Keep whatever tool is already active (re-opening mid-edit).
 *   2. Otherwise fall back to the last-used tool (session memory).
 *   3. Otherwise the default AOI tool.
 *
 * This is what makes a single topbar Draw activation open a *usable* surface.
 */
export function resolveDrawToolOnOpen(
  currentTool: DrawToolId | null | undefined,
  lastUsedTool?: DrawToolId | null,
): DrawToolId {
  if (currentTool) return currentTool;
  if (lastUsedTool) return lastUsedTool;
  return DEFAULT_DRAW_TOOL;
}

/* ================================================================== */
/*  p06 — Premium drawing modal: tool-rail order + a11y navigation     */
/* ================================================================== */

/**
 * Tool-rail order for the premium drawing modal's `role="toolbar"` segmented
 * control. `null` is the Select / edit tool and always leads the rail; the five
 * draw tools follow in their canonical order. Kept here (UI-free) so the rail's
 * roving-tabindex navigation can be unit-tested without rendering the runtime.
 */
export const MODAL_DRAW_TOOL_RAIL: ReadonlyArray<DrawToolId | null> = [
  null,
  ...DRAW_TOOL_IDS,
];

/**
 * Roving-tabindex arrow navigation for the draw tool rail.
 *
 * Returns the index the keyboard focus should move to for the given key, or
 * `null` when the key is not a navigation key (so the caller leaves the event
 * alone). Horizontal arrows wrap; Up/Down mirror Left/Right so the rail works
 * regardless of assistive-tech orientation assumptions; Home/End jump to ends.
 */
export function getNextDrawToolRailIndex(
  currentIndex: number,
  key: string,
  length: number,
): number | null {
  if (length <= 0) return null;
  const clamped = Math.min(Math.max(currentIndex, 0), length - 1);
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (clamped + 1) % length;
    case "ArrowLeft":
    case "ArrowUp":
      return (clamped - 1 + length) % length;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return null;
  }
}

/**
 * Footer AOI actions (Add as layer / Fetch data) are only meaningful once
 * something has been drawn. Centralised so the modal redesign keeps the
 * disabled-state contract identical and testable.
 */
export function isDrawAoiActionDisabled(featureCount: number): boolean {
  return featureCount <= 0;
}
