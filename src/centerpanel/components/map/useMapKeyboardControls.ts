import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";

/* ================================================================== */
/*  Keyboard Map Controls Hook                                         */
/*  Arrow keys → pan, +/− → zoom, R → reset view                      */
/* ================================================================== */

const PAN_DELTA = 100; // pixels per key press
const ZOOM_DELTA = 1;

export interface MapKeyboardOptions {
  /** When true, key events are processed. False disables map keyboard. */
  enabled: boolean;
  /** ID of the focusable map element that should receive map shortcuts. */
  mapElementId?: string;
  /** Reduce-motion preference — disables animated flyTo on reset. */
  reducedMotion: boolean;
  /** Default viewport for reset (R key). */
  defaultCenter: [number, number];
  defaultZoom: number;
  /** Callback after zoom/pan for announcements. */
  onPanAnnounce?: (direction: "north" | "south" | "west" | "east") => void;
  onZoomAnnounce?: (zoom: number) => void;
  onResetAnnounce?: () => void;
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return target.matches("input, textarea, select");
}

function isMapKeyboardTarget(target: EventTarget | null, mapElementId?: string): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (!mapElementId) {
    return target.getAttribute("role") === "application";
  }

  const mapElement = document.getElementById(mapElementId);
  return mapElement != null && (target === mapElement || mapElement.contains(target));
}

export function useMapKeyboardControls(
  mapRef: React.RefObject<maplibregl.Map | null>,
  options: MapKeyboardOptions,
): void {
  /* Store latest options in ref so event handler sees current values */
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!options.enabled) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      const map = mapRef.current;
      if (!map) return;

      const opts = optsRef.current;

      if (isTextEntryTarget(e.target) || !isMapKeyboardTarget(e.target, opts.mapElementId)) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          map.panBy([0, -PAN_DELTA], { animate: !opts.reducedMotion });
          opts.onPanAnnounce?.("north");
          break;
        case "ArrowDown":
          e.preventDefault();
          map.panBy([0, PAN_DELTA], { animate: !opts.reducedMotion });
          opts.onPanAnnounce?.("south");
          break;
        case "ArrowLeft":
          e.preventDefault();
          map.panBy([-PAN_DELTA, 0], { animate: !opts.reducedMotion });
          opts.onPanAnnounce?.("west");
          break;
        case "ArrowRight":
          e.preventDefault();
          map.panBy([PAN_DELTA, 0], { animate: !opts.reducedMotion });
          opts.onPanAnnounce?.("east");
          break;
        case "+":
        case "=":
          e.preventDefault();
          map.zoomTo(map.getZoom() + ZOOM_DELTA, { animate: !opts.reducedMotion });
          opts.onZoomAnnounce?.(+(map.getZoom() + ZOOM_DELTA).toFixed(1));
          break;
        case "-":
        case "_":
          e.preventDefault();
          map.zoomTo(map.getZoom() - ZOOM_DELTA, { animate: !opts.reducedMotion });
          opts.onZoomAnnounce?.(+(map.getZoom() - ZOOM_DELTA).toFixed(1));
          break;
        case "r":
        case "R":
          e.preventDefault();
          if (opts.reducedMotion) {
            map.jumpTo({
              center: opts.defaultCenter,
              zoom: opts.defaultZoom,
              bearing: 0,
              pitch: 0,
            });
          } else {
            map.flyTo({
              center: opts.defaultCenter,
              zoom: opts.defaultZoom,
              bearing: 0,
              pitch: 0,
              duration: 1200,
            });
          }
          opts.onResetAnnounce?.();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [options.enabled, mapRef]);
}
