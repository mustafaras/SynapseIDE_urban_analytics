import { MAP_Z_INDEX } from "../mapTokens";

const OVERLAY_ROOT_ID = "map-explorer-overlay-root";

export function getMapOverlayPortalRoot(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const existing = document.getElementById(OVERLAY_ROOT_ID);
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const root = document.createElement("div");
  root.id = OVERLAY_ROOT_ID;
  root.dataset.mapOverlayRoot = "true";
  Object.assign(root.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: String(MAP_Z_INDEX.popover),
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(root);
  return root;
}