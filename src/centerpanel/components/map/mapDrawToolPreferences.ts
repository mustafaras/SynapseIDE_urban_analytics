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
