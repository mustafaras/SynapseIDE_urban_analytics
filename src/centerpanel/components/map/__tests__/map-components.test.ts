// @vitest-environment jsdom

/**
 * Unit tests for Map Explorer sub-components
 *
 * Tests verify:
 *   1. Shared types & constants (mapTypes)
 *   2. Design token integration (mapTokens)
 *   3. Barrel exports (index)
 *   4. Component module exports
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MapExplorerModalProps } from "../../MapExplorerModal";
import { BASE_STYLES, type BaseLayerConfig, type BaseLayerId, type MapBookmark, type MapPin, type OverlayLayerConfig } from "../mapTypes";
import {
  MAP_BLUR,
  MAP_COLORS,
  MAP_RADIUS,
  MAP_SHADOWS,
  MAP_SHELL_DIMENSIONS,
  MAP_SPACING,
  MAP_TRANSITIONS,
  MAP_TYPOGRAPHY,
  MAP_Z_INDEX,
  createMapShellCssVars,
  mapStyles,
} from "../mapTokens";
import { DESIGN_TOKENS } from "@/constants/design";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let roots: Root[] = [];

function openCommandPalette(): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  });
}

function setInputValue(element: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  expect(setter).toBeDefined();
  act(() => {
    setter!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function commandPaletteInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Search map commands"]');
  expect(input).not.toBeNull();
  return input!;
}

afterEach(() => {
  for (const root of roots) {
    act(() => {
      root.unmount();
    });
  }
  roots = [];
  document.body.innerHTML = "";
});

/* ------------------------------------------------------------------ */
/*  1. mapTypes — Shared constants                                     */
/* ------------------------------------------------------------------ */

describe("mapTypes", () => {
  it("exports all four BaseLayerId entries", () => {
    const keys = Object.keys(BASE_STYLES) as BaseLayerId[];
    expect(keys).toEqual(["streets", "dark", "satellite", "terrain"]);
  });

  it("every base layer has a name and a valid URL or style object", () => {
    for (const [, config] of Object.entries(BASE_STYLES)) {
      expect((config as BaseLayerConfig).name).toBeTruthy();
      const url = (config as BaseLayerConfig).url;
      if (typeof url === "string") {
        expect(url).toMatch(/^https:\/\//);
      } else {
        // Inline StyleSpecification object
        expect(url).toHaveProperty("version", 8);
        expect(url).toHaveProperty("sources");
        expect(url).toHaveProperty("layers");
      }
    }
  });

  it("MapPin type is structurally correct (compile-time check)", () => {
    const pin: MapPin = { id: "test-1", lng: 29.0, lat: 41.0, label: "Test" };
    expect(pin.id).toBe("test-1");
    expect(pin.lng).toBe(29.0);
    expect(pin.lat).toBe(41.0);
    expect(pin.label).toBe("Test");
  });

  it("MapPin label is optional", () => {
    const pin: MapPin = { id: "test-2", lng: 0, lat: 0 };
    expect(pin.label).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  2. mapTokens — Design token references                             */
/* ------------------------------------------------------------------ */

describe("mapTokens — colors", () => {
  it("interaction maps to the map workbench interaction alias", () => {
    expect(MAP_COLORS.interaction).toBe(DESIGN_TOKENS.mapExplorer.colors.interaction);
  });

  it("error uses the semantic status error token", () => {
    expect(MAP_COLORS.error).toContain("--syn-status-error");
  });

  it("has all required color keys", () => {
    const required = [
      "bg", "bgPanel", "interaction", "interactionSubtle", "selectedSubtle",
      "focus", "hairline", "hairlineStrong", "caveatText", "text",
      "textSecondary", "textMuted", "error", "white", "overlayBg",
    ];
    for (const key of required) {
      expect(MAP_COLORS).toHaveProperty(key);
      expect((MAP_COLORS as Record<string, string>)[key]).toBeTruthy();
    }
  });
});

describe("mapTokens — border radius", () => {
  it("sm maps to DESIGN_TOKENS.borderRadius.hover", () => {
    expect(MAP_RADIUS.sm).toBe(DESIGN_TOKENS.borderRadius.hover);
  });

  it("md maps to compact workbench radius", () => {
    expect(MAP_RADIUS.md).toBe(DESIGN_TOKENS.borderRadius.sm);
  });

  it("lg maps to compact workbench radius", () => {
    expect(MAP_RADIUS.lg).toBe(DESIGN_TOKENS.borderRadius.sm);
  });
});

describe("mapTokens — shadows", () => {
  it("modal uses no decorative shadow", () => {
    expect(MAP_SHADOWS.modal).toBe(MAP_SHADOWS.none);
  });

  it("dropdown keeps a restrained floating overlay shadow", () => {
    expect(MAP_SHADOWS.dropdown).toContain("rgba(0, 0, 0, 0.28)");
  });

  it("marker uses DESIGN_TOKENS.shadows.sm", () => {
    expect(MAP_SHADOWS.marker).toBe(DESIGN_TOKENS.shadows.sm);
  });
});

describe("mapTokens — transitions", () => {
  it("fast uses DESIGN_TOKENS.transitions.sm", () => {
    expect(MAP_TRANSITIONS.fast).toBe(DESIGN_TOKENS.transitions.sm);
  });
});

describe("mapTokens — shell geometry", () => {
  it("keeps the premium top command surface a substantial, filled GIS chrome height", () => {
    expect(MAP_SHELL_DIMENSIONS.topCommandHeight).toBe("5.5rem");
    expect(MAP_SHELL_DIMENSIONS.menuBarHeight).toBe(MAP_SHELL_DIMENSIONS.topCommandHeight);
  });

  it("publishes the right dock CSS variable from the right dock width token", () => {
    const vars = createMapShellCssVars() as Record<string, string>;
    expect(vars["--map-right-w"]).toBe(MAP_SHELL_DIMENSIONS.rightDockWidth);
  });
});

describe("mapTokens — typography", () => {
  it("fontFamily matches DESIGN_TOKENS primary", () => {
    expect(MAP_TYPOGRAPHY.fontFamily).toBe(
      DESIGN_TOKENS.typography.fontFamily.primary,
    );
  });

  it("fontFamilyBrand matches DESIGN_TOKENS brand", () => {
    expect(MAP_TYPOGRAPHY.fontFamilyBrand).toBe(
      DESIGN_TOKENS.typography.fontFamily.brand,
    );
  });

  it("fontFamilyMono matches DESIGN_TOKENS mono", () => {
    expect(MAP_TYPOGRAPHY.fontFamilyMono).toBe(
      DESIGN_TOKENS.typography.fontFamily.mono,
    );
  });
});

describe("mapTokens — spacing", () => {
  it("maps to DESIGN_TOKENS spacing values", () => {
    expect(MAP_SPACING.xs).toBe(DESIGN_TOKENS.spacing.xs);
    expect(MAP_SPACING.sm).toBe(DESIGN_TOKENS.spacing.sm);
    expect(MAP_SPACING.md).toBe(DESIGN_TOKENS.spacing.md);
    expect(MAP_SPACING.lg).toBe(DESIGN_TOKENS.spacing.lg);
  });
});

describe("mapTokens — blur", () => {
  it("overlay uses DESIGN_TOKENS.blur.md", () => {
    expect(MAP_BLUR.overlay).toBe(DESIGN_TOKENS.blur.md);
  });
});

describe("mapTokens — z-index", () => {
  it("overlay sits in the design-system modal tier (10050) so toasts/popovers can layer above", () => {
    // Earlier the overlay used MAX_SAFE_INTEGER which trapped toast/popover
    // surfaces beneath the modal.  The map overlay now follows the shared
    // design tier (modal:10050 < popover:10060 < tooltip:10070 < toast:10080).
    expect(MAP_Z_INDEX.overlay).toBe(10050);
  });

  it("keeps dialog above popover while preserving toast as the top app surface", () => {
    expect(MAP_Z_INDEX.dialog).toBeGreaterThan(MAP_Z_INDEX.popover);
    expect(MAP_Z_INDEX.toast).toBeGreaterThan(MAP_Z_INDEX.dialog);
  });

  it("keeps local map furniture below panel chrome", () => {
    expect(MAP_Z_INDEX.mapFurniture).toBeLessThan(MAP_Z_INDEX.panel);
    expect(MAP_Z_INDEX.commandBar).toBeLessThan(MAP_Z_INDEX.panel);
  });

  it("tooltip sits above dropdown and popover so overlay menus do not obscure tooltip text", () => {
    // GisTooltip uses tooltip tier; layer menus use dropdown tier.
    // Tooltip must render above open menus near the edge of the panel.
    expect(MAP_Z_INDEX.tooltip).toBeGreaterThan(MAP_Z_INDEX.dropdown);
    expect(MAP_Z_INDEX.tooltip).toBeGreaterThan(MAP_Z_INDEX.popover);
  });

  it("dialog sits above dropdown and popover so confirm overlays are not trapped under menus", () => {
    // MapLayerManager dialogOverlayStyle and modal dispatch dialog use dialog tier.
    expect(MAP_Z_INDEX.dialog).toBeGreaterThan(MAP_Z_INDEX.dropdown);
    expect(MAP_Z_INDEX.dialog).toBeGreaterThan(MAP_Z_INDEX.popover);
  });
});

/* ------------------------------------------------------------------ */
/*  3. mapStyles — Pre-composed style objects                          */
/* ------------------------------------------------------------------ */

describe("mapStyles — pre-composed objects", () => {
  it("overlay has fixed positioning and correct z-index", () => {
    expect(mapStyles.overlay.position).toBe("fixed");
    expect(mapStyles.overlay.zIndex).toBe(MAP_Z_INDEX.overlay);
  });

  it("modal uses no border radius in fullscreen mode", () => {
    expect(mapStyles.modal.borderRadius).toBe(DESIGN_TOKENS.borderRadius.geometric);
  });

  it("modal uses no shadow in fullscreen mode", () => {
    expect(mapStyles.modal.boxShadow).toBe(MAP_SHADOWS.none);
  });

  it("header uses darker background for fullscreen", () => {
    expect(mapStyles.header.background).toBe(DESIGN_TOKENS.mapExplorer.colors.charcoalHeader);
  });

  it("title uses the interaction token", () => {
    expect(mapStyles.title.color).toBe(MAP_COLORS.interaction);
  });

  it("btn uses token-based border radius", () => {
    expect(mapStyles.btn.borderRadius).toBe(MAP_RADIUS.sm);
  });

  it("btn uses token-based transition", () => {
    expect(mapStyles.btn.transition).toBe(MAP_TRANSITIONS.fast);
  });

  it("btnActive uses selected subtle background", () => {
    expect(mapStyles.btnActive.background).toBe(MAP_COLORS.selectedSubtle);
  });

  it("closeBtn uses charcoal panel background", () => {
    expect(mapStyles.closeBtn.background).toBe(MAP_COLORS.bgPanel);
  });

  it("mapContainer has flex: 1 and relative position", () => {
    expect(mapStyles.mapContainer.flex).toBe(1);
    expect(mapStyles.mapContainer.position).toBe("relative");
  });
});

/* ------------------------------------------------------------------ */
/*  4. Barrel exports — all components discoverable                    */
/* ------------------------------------------------------------------ */

describe("barrel index exports", () => {
  it("exports all sub-components", async () => {
    const barrel = await import("../index");
    expect(barrel.MapCanvas).toBeDefined();
    expect(barrel.MapCanvasControls).toBeDefined();
    expect(barrel.MapWorkspaceShell).toBeDefined();
    expect(barrel.MapPanelRail).toBeDefined();
    expect(barrel.MapCanvasRegion).toBeDefined();
    expect(barrel.MapBottomTimeline).toBeDefined();
    expect(barrel.MapToolbar).toBeDefined();
    expect(barrel.MapTopCommandSurface).toBeDefined();
    expect(barrel.MapLayerPanel).toBeDefined();
    expect(barrel.MapSearchBar).toBeDefined();
    expect(barrel.MapStatusBar).toBeDefined();
    expect(barrel.MapPinSidebar).toBeDefined();
  }, 30000);

  it("exports mapTokens constants", async () => {
    const barrel = await import("../index");
    expect(barrel.MAP_COLORS).toBeDefined();
    expect(barrel.MAP_RADIUS).toBeDefined();
    expect(barrel.MAP_SHADOWS).toBeDefined();
    expect(barrel.MAP_TRANSITIONS).toBeDefined();
    expect(barrel.MAP_TYPOGRAPHY).toBeDefined();
    expect(barrel.MAP_SPACING).toBeDefined();
    expect(barrel.MAP_BLUR).toBeDefined();
    expect(barrel.MAP_Z_INDEX).toBeDefined();
    expect(barrel.mapStyles).toBeDefined();
  });

  it("exports BASE_STYLES from mapTypes", async () => {
    const barrel = await import("../index");
    expect(barrel.BASE_STYLES).toBeDefined();
    expect(Object.keys(barrel.BASE_STYLES)).toHaveLength(4);
  });
});

/* ------------------------------------------------------------------ */
/*  5. Component module exports — individually importable              */
/* ------------------------------------------------------------------ */

describe("component modules are individually importable", () => {
  it("MapCanvas exports a named component", async () => {
    const mod = await import("../MapCanvas");
    expect(mod.MapCanvas).toBeDefined();
    expect(typeof mod.MapCanvas).toBe("function");
  });

  it("MapCanvasControls exports a named component", async () => {
    const mod = await import("../MapCanvasControls");
    expect(mod.MapCanvasControls).toBeDefined();
    expect(typeof mod.MapCanvasControls).toBe("function");
  });

  it("MapToolbar exports a named component", async () => {
    const mod = await import("../MapToolbar");
    expect(mod.MapToolbar).toBeDefined();
    expect(typeof mod.MapToolbar).toBe("function");
  });

  it("MapTopCommandSurface exports a named component", async () => {
    const mod = await import("../MapTopCommandSurface");
    expect(mod.MapTopCommandSurface).toBeDefined();
    expect(typeof mod.MapTopCommandSurface).toBe("function");
  });

  it("MapLayerPanel exports a named component", async () => {
    const mod = await import("../MapLayerPanel");
    expect(mod.MapLayerPanel).toBeDefined();
    expect(typeof mod.MapLayerPanel).toBe("function");
  });

  it("MapSearchBar exports a named component", async () => {
    const mod = await import("../MapSearchBar");
    expect(mod.MapSearchBar).toBeDefined();
    expect(typeof mod.MapSearchBar).toBe("function");
  });

  it("MapStatusBar exports a named component", async () => {
    const mod = await import("../MapStatusBar");
    expect(mod.MapStatusBar).toBeDefined();
    expect(typeof mod.MapStatusBar).toBe("function");
  });

  it("MapPinSidebar exports a named component", async () => {
    const mod = await import("../MapPinSidebar");
    expect(mod.MapPinSidebar).toBeDefined();
    expect(typeof mod.MapPinSidebar).toBe("function");
  });

  it("MapWorkspaceShell exports a named component", async () => {
    const mod = await import("../MapWorkspaceShell");
    expect(mod.MapWorkspaceShell).toBeDefined();
    expect(typeof mod.MapWorkspaceShell).toBe("function");
    expect(mod.MapPanelRail).toBeDefined();
    expect(mod.MapCanvasRegion).toBeDefined();
    expect(mod.MapBottomTimeline).toBeDefined();
  });

});

/* ------------------------------------------------------------------ */
/*  6. Component rendering                                             */
/* ------------------------------------------------------------------ */

describe("Map Explorer components render without errors", () => {
  it("renders MapWorkspaceShell", async () => {
    const { MapWorkspaceShell } = await import("../MapWorkspaceShell");
    const html = renderToStaticMarkup(
      React.createElement(MapWorkspaceShell, {
        mode: "embedded",
      }, React.createElement("div", null, "Map shell child")),
    );
    expect(html).toContain("Map shell child");
  });

  it("renders modal semantics for MapWorkspaceShell when mode is modal", async () => {
    const { MapWorkspaceShell } = await import("../MapWorkspaceShell");
    const html = renderToStaticMarkup(
      React.createElement(MapWorkspaceShell, {
        mode: "modal",
      }, React.createElement("div", null, "Modal shell child")),
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Modal shell child");
  });

  it("renders embedded semantics for MapWorkspaceShell when mode is embedded", async () => {
    const { MapWorkspaceShell } = await import("../MapWorkspaceShell");
    const html = renderToStaticMarkup(
      React.createElement(MapWorkspaceShell, {
        mode: "embedded",
      }, React.createElement("div", null, "Embedded shell child")),
    );
    expect(html).toContain('role="region"');
    expect(html).not.toContain('aria-modal="true"');
    expect(html).toContain("Embedded shell child");
  });

  it("renders layout primitives with stable diagnostics", async () => {
    const { MapBottomTimeline, MapCanvasRegion, MapPanelRail } = await import("../MapWorkspaceShell");
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null,
        React.createElement(MapCanvasRegion, {
          minViewportHeight: "32rem",
          "data-testid": "map-canvas-region",
        }, "Canvas"),
        React.createElement(MapPanelRail, {
          side: "left",
          width: 420,
          resizable: true,
          ariaLabel: "Layer and data panel",
        }, "Layers"),
        React.createElement(MapBottomTimeline, {
          timelineSlot: React.createElement("span", null, "Timeline"),
        }, React.createElement("span", null, "Status")),
      ),
    );

    expect(html).toContain('data-map-canvas-region="true"');
    expect(html).toContain('data-map-panel-rail="left"');
    expect(html).toContain('data-map-bottom-timeline="true"');
    expect(html).toContain("Resize layer and data panel");
  });

  it("renders MapToolbar", async () => {
    const { MapToolbar } = await import("../MapToolbar");
    const html = renderToStaticMarkup(
      React.createElement(MapToolbar, {
        pinMode: false,
        onTogglePinMode: () => undefined,
        showSidebar: false,
        onToggleSidebar: () => undefined,
        pinCount: 0,
        onToggleViewportSync: () => undefined,
      }),
    );
    expect(html).toContain("data-testid=\"map-command-center\"");
    const registryCount = Number(html.match(/data-command-registry-count="(\d+)"/)?.[1] ?? 0);
    expect(registryCount).toBeGreaterThanOrEqual(8);
    expect(html).toContain("Task lens selector");
    expect(html).toContain("Analyst");
    expect(html).toContain("Commands");
    expect(html).toContain("More");
  });

  it("renders compact MapCanvasControls for viewport recovery and publish furniture", async () => {
    const { MapCanvasControls } = await import("../MapCanvasControls");
    const html = renderToStaticMarkup(
      React.createElement(MapCanvasControls, {
        activeBaseLayer: "dark",
        onSetBaseLayer: () => undefined,
        activeTool: null,
        selectionDragTool: "rectangle",
        activeDrawTool: null,
        activeMeasureTool: null,
        selectionModeDisabled: false,
        selectedFeatureCount: 0,
        visibleLayerCount: 2,
        hasActiveAoi: false,
        legendVisible: true,
        legendAvailable: true,
        scaleBarVisible: true,
        northArrowVisible: true,
        bearing: 15,
        onZoomIn: () => undefined,
        onZoomOut: () => undefined,
        onResetView: () => undefined,
        onFitVisibleLayers: () => undefined,
        onFitSelectedContext: () => undefined,
        onOpenCrsReadiness: () => undefined,
        onToggleLegend: () => undefined,
        onToggleScaleBar: () => undefined,
        onToggleNorthArrow: () => undefined,
        onSetSelectionDragTool: () => undefined,
        onDrawAoi: () => undefined,
        onMeasureDistance: () => undefined,
        onMeasureArea: () => undefined,
        keyboardHelpVisible: true,
        onToggleKeyboardHelp: () => undefined,
        onClearActiveTool: () => undefined,
      }),
    );

    expect(html).toContain("data-testid=\"map-canvas-controls\"");
    expect(html).toContain("Viewport recovery controls");
    expect(html).toContain("Canvas interaction tools");
    expect(html).toContain("Open CRS readiness");
    expect(html).toContain("Publish preview furniture controls");
    expect(html).toContain("Rect select");
    expect(html).toContain("Keyboard path");
    expect(html).toContain("data-testid=\"map-north-arrow-preview\"");
  });

  it("runs MapCanvasControls actions without mutating analytical layer callbacks", async () => {
    const { MapCanvasControls } = await import("../MapCanvasControls");
    const onZoomIn = vi.fn();
    const onFitVisibleLayers = vi.fn();
    const onFitSelectedContext = vi.fn();
    const onOpenCrsReadiness = vi.fn();
    const onToggleLegend = vi.fn();
    const onToggleScaleBar = vi.fn();
    const onToggleNorthArrow = vi.fn();
    const onClearActiveTool = vi.fn();
    const onSetSelectionDragTool = vi.fn();
    const onDrawAoi = vi.fn();
    const onMeasureDistance = vi.fn();
    const onMeasureArea = vi.fn();
    const onToggleKeyboardHelp = vi.fn();
    const onSetBaseLayer = vi.fn();
    const analyticalLayerCallback = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        React.createElement(MapCanvasControls, {
          activeBaseLayer: "dark",
          onSetBaseLayer,
          activeTool: null,
          selectionDragTool: null,
          activeDrawTool: "polygon",
          activeMeasureTool: null,
          selectionModeDisabled: false,
          selectedFeatureCount: 3,
          visibleLayerCount: 2,
          hasActiveAoi: true,
          legendVisible: true,
          legendAvailable: true,
          scaleBarVisible: true,
          northArrowVisible: true,
          bearing: 0,
          onZoomIn,
          onZoomOut: () => undefined,
          onResetView: () => undefined,
          onFitVisibleLayers,
          onFitSelectedContext,
          onOpenCrsReadiness,
          onToggleLegend,
          onToggleScaleBar,
          onToggleNorthArrow,
          onSetSelectionDragTool,
          onDrawAoi,
          onMeasureDistance,
          onMeasureArea,
          keyboardHelpVisible: false,
          onToggleKeyboardHelp,
          onClearActiveTool,
        }),
      );
    });

    const rectangleButton = host.querySelector<HTMLButtonElement>('[data-testid="map-rectangle-select-tool"]');
    const lassoButton = host.querySelector<HTMLButtonElement>('[data-testid="map-lasso-select-tool"]');
    const drawAoiButton = host.querySelector<HTMLButtonElement>('[data-testid="map-canvas-draw-aoi"]');
    const distanceButton = host.querySelector<HTMLButtonElement>('[data-testid="map-canvas-measure-distance"]');
    const keyboardHelpButton = host.querySelector<HTMLButtonElement>('[data-testid="map-canvas-keyboard-help"]');

    expect(rectangleButton).toBeNull();
    expect(lassoButton).toBeNull();
    expect(drawAoiButton?.getAttribute("aria-pressed")).toBe("true");
    expect(distanceButton?.getAttribute("aria-pressed")).toBe("false");
    expect(keyboardHelpButton?.getAttribute("aria-pressed")).toBe("false");

    const clickByLabel = async (label: string): Promise<void> => {
      const button = host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
      expect(button).not.toBeNull();
      await act(async () => {
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    };

    await clickByLabel("Zoom in");
    await clickByLabel("Fit to visible layers, 2 visible");
    await clickByLabel("Fit to selected layer, feature, or AOI");
    await clickByLabel("Open CRS readiness");
    await clickByLabel("Hide scale bar");
    await clickByLabel("Hide north arrow");
    await clickByLabel("Hide legend");
    await clickByLabel("Cancel draw AOI");
    await clickByLabel("Measure distance");
    await clickByLabel("Measure area");
    await clickByLabel("Show keyboard map help");
    await clickByLabel("Clear active map tool");

    const baseTrigger = host.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    await act(async () => {
      baseTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const streetsItem = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitem"]'))
      .find((item) => item.textContent?.includes("OpenStreetMap"));
    expect(streetsItem).toBeDefined();
    await act(async () => {
      streetsItem?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onFitVisibleLayers).toHaveBeenCalledTimes(1);
    expect(onFitSelectedContext).toHaveBeenCalledTimes(1);
    expect(onOpenCrsReadiness).toHaveBeenCalledTimes(1);
    expect(onToggleScaleBar).toHaveBeenCalledTimes(1);
    expect(onToggleNorthArrow).toHaveBeenCalledTimes(1);
    expect(onToggleLegend).toHaveBeenCalledTimes(1);
    expect(onSetSelectionDragTool).not.toHaveBeenCalled();
    expect(onDrawAoi).toHaveBeenCalledTimes(1);
    expect(onMeasureDistance).toHaveBeenCalledTimes(1);
    expect(onMeasureArea).toHaveBeenCalledTimes(1);
    expect(onToggleKeyboardHelp).toHaveBeenCalledTimes(1);
    expect(onClearActiveTool).toHaveBeenCalledTimes(1);
    expect(onSetBaseLayer).toHaveBeenCalledWith("streets");
    expect(analyticalLayerCallback).not.toHaveBeenCalled();
  });

  it("renders a minimal navigator MapToolbar", async () => {
    const { MapToolbar } = await import("../MapToolbar");
    const html = renderToStaticMarkup(
      React.createElement(MapToolbar, {
        workspaceView: "navigator",
        pinMode: false,
        onTogglePinMode: () => undefined,
        showSidebar: false,
        onToggleSidebar: () => undefined,
        pinCount: 0,
        onToggleLayerPanel: () => undefined,
        onImportClick: () => undefined,
      }),
    );
    expect(html).toContain("map-premium-menu-bar");
    expect(html).toContain("Import");
    expect(html).not.toContain("Sketch");
    expect(html).not.toContain("Measure");
    expect(html).not.toContain("Toggle pin mode");
  });

  it("runs visible project persistence actions directly from the MapToolbar", async () => {
    const { MapToolbar } = await import("../MapToolbar");
    const onSaveProjectClick = vi.fn();
    const onLoadProjectClick = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        React.createElement(MapToolbar, {
          workspaceView: "explore",
          pinMode: false,
          onTogglePinMode: () => undefined,
          showSidebar: false,
          onToggleSidebar: () => undefined,
          pinCount: 0,
          onToggleLayerPanel: () => undefined,
          onSaveProjectClick,
          onLoadProjectClick,
        }),
      );
    });

    openCommandPalette();
    const input = commandPaletteInput();
    setInputValue(input, "save project");
    const saveButton = host.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-save-project"]');
    expect(saveButton).not.toBeNull();

    setInputValue(input, "load project");
    const loadButton = host.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-load-project"]');
    expect(loadButton).not.toBeNull();

    setInputValue(input, "save project");
    const activeSaveButton = host.querySelector<HTMLButtonElement>('[data-testid="map-command-palette-option-save-project"]');
    expect(activeSaveButton).not.toBeNull();

    await act(async () => {
      activeSaveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSaveProjectClick).toHaveBeenCalledTimes(1);
    expect(onLoadProjectClick).not.toHaveBeenCalled();
  });

  it("renders analysis commands in analyze MapToolbar", async () => {
    const { MapToolbar } = await import("../MapToolbar");
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        React.createElement(MapToolbar, {
          workspaceView: "analyze",
          pinMode: false,
          onTogglePinMode: () => undefined,
          showSidebar: false,
          onToggleSidebar: () => undefined,
          pinCount: 0,
          onToggleChoroplethPanel: () => undefined,
          onSetDrawTool: () => undefined,
          onSetMeasureTool: () => undefined,
          onToggleMeasurePanel: () => undefined,
        }),
      );
    });

    expect(host.textContent).toContain("Analyst");
    openCommandPalette();
    const input = commandPaletteInput();
    setInputValue(input, "draw polygon");
    expect(host.querySelector('[data-testid="map-command-palette-option-draw-polygon"]')).not.toBeNull();
    setInputValue(input, "measure distance");
    expect(host.querySelector('[data-testid="map-command-palette-option-measure-distance"]')).not.toBeNull();
  });

  it("renders MapLayerPanel", async () => {
    const { MapLayerPanel } = await import("../MapLayerPanel");
    const html = renderToStaticMarkup(
      React.createElement(MapLayerPanel, {
        activeLayer: "dark",
        onSetLayer: () => undefined,
      }),
    );
    expect(html).toContain("Dark Matter");
  });

  it("opens compact MapLayerPanel as a premium base-layer popover", async () => {
    const { MapLayerPanel } = await import("../MapLayerPanel");
    const onSetLayer = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        React.createElement(MapLayerPanel, {
          activeLayer: "dark",
          onSetLayer,
          compact: true,
        }),
      );
    });

    const trigger = host.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    expect(trigger?.textContent).toContain("Base");

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const streetsItem = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitem"]'))
      .find((item) => item.textContent?.includes("OpenStreetMap"));
    expect(streetsItem).toBeDefined();

    await act(async () => {
      streetsItem?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSetLayer).toHaveBeenCalledWith("streets");
  });

  it("opens compact saved views from a single header menu", async () => {
    const { MapBookmarkBar } = await import("../../MapBookmarkBar");
    const onRestoreBookmark = vi.fn();
    const bookmark: MapBookmark = {
      id: "view-1",
      name: "Downtown",
      center: [29, 41],
      zoom: 12,
      bearing: 0,
      pitch: 0,
      layers: ["parcels"],
      timestamp: "2026-05-01T10:00:00.000Z",
    };
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        React.createElement(MapBookmarkBar, {
          variant: "menu",
          bookmarks: [bookmark],
          maxBookmarks: 50,
          onSaveBookmark: () => undefined,
          onRestoreBookmark,
          onRenameBookmark: () => undefined,
          onDeleteBookmark: () => undefined,
          onShareBookmark: () => undefined,
        }),
      );
    });

    const trigger = host.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    expect(trigger?.textContent).toContain("Views");

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const viewsMenu = document.querySelector<HTMLElement>('[data-testid="map-bookmark-compact-menu"]');
    expect(viewsMenu).not.toBeNull();
    expect(viewsMenu?.textContent).toContain("Save Current View");

    const restoreButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Downtown"));
    expect(restoreButton).toBeDefined();

    await act(async () => {
      restoreButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onRestoreBookmark).toHaveBeenCalledWith(bookmark);
  });

  it("renders actionable cartography review controls in MapLayerManager", async () => {
    const { MapLayerManager } = await import("../MapLayerManager");
    const { generateMapCartographyReview } = await import("@/services/map/MapCartographyAdvisor");
    const onApply = vi.fn();
    const layer: OverlayLayerConfig = {
      id: "dense-points",
      name: "Dense points",
      type: "geojson",
      visible: true,
      opacity: 1,
      sourceData: {
        type: "FeatureCollection",
        features: Array.from({ length: 640 }, (_, index) => ({
          type: "Feature",
          id: `feature-${index}`,
          properties: { value: index + 1 },
          geometry: {
            type: "Point",
            coordinates: [29 + (index % 32) * 0.0001, 41 + Math.floor(index / 32) * 0.0001],
          },
        })),
      },
      style: {
        "circle-radius": 8,
        "circle-color": "#3794ff",
      },
      metadata: {
        featureCount: 640,
        geometryType: "Point",
        bounds: [29, 41, 29.01, 41.01],
      },
    };
    const reviewState = generateMapCartographyReview([layer], {
      viewport: { zoom: 9, bounds: [29, 41, 29.01, 41.01] },
      now: new Date("2026-05-01T00:00:00.000Z"),
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);

    await act(async () => {
      root.render(
        React.createElement(MapLayerManager, {
          overlayLayers: [layer],
          activeBaseLayerName: "Dark Matter",
          onToggleVisibility: () => undefined,
          onSetOpacity: () => undefined,
          onRemoveLayer: () => undefined,
          onReorderLayers: () => undefined,
          onAddLayer: () => undefined,
          cartographyReviewState: reviewState,
          onApplyCartographyRecommendation: onApply,
          onDismissCartographyRecommendation: () => undefined,
        }),
      );
    });

    expect(host.textContent).toContain("Symbology review");
    expect(host.textContent).toContain("Review");

    const reviewMapButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Review map"));
    await act(async () => {
      reviewMapButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(host.textContent).toContain("Cartography / Visible map");
    expect(host.textContent).toContain("Before");
    expect(host.textContent).toContain("After");

    const applyButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Apply"));
    await act(async () => {
      applyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onApply).toHaveBeenCalledWith(reviewState.recommendations[0]?.id);
  });

  it("renders MapSearchBar", async () => {
    const { MapSearchBar } = await import("../MapSearchBar");
    const html = renderToStaticMarkup(
      React.createElement(MapSearchBar, {
        onFlyTo: () => undefined,
      }),
    );
    expect(html).toContain("Search");
  });

  it("renders MapStatusBar", async () => {
    const { MapStatusBar } = await import("../MapStatusBar");
    const html = renderToStaticMarkup(
      React.createElement(MapStatusBar, {
        cursor: { lng: 29, lat: 41 },
        zoom: 10,
        selectedFeatureCount: 12,
        hasActiveAoi: true,
        qaStatus: "warning",
        qaIssueCount: 2,
      }),
    );
    expect(html).toContain("EPSG");
    expect(html).toContain("AOI");
    expect(html).toContain("issues");
  });

  it("renders MapWorkspaceCockpit with active context strip signals", async () => {
    const { MapWorkspaceCockpit } = await import("../MapWorkspaceCockpit");
    const html = renderToStaticMarkup(
      React.createElement(MapWorkspaceCockpit, {
        workspaceView: "navigator",
        onSelectView: () => undefined,
        onQuickAction: () => undefined,
        contextSummary: {
          contextId: "map-context-1",
          updatedAt: "2026-05-10T20:10:00.000Z",
          viewport: {
            center: [29.02, 41.01],
            zoom: 12,
            bearing: 0,
            pitch: 0,
            baseLayerId: "dark",
          },
          currentBounds: [28.95, 40.95, 29.08, 41.08],
          currentBoundsUpdatedAt: "2026-05-10T20:10:00.000Z",
          activeAoi: {
            aoiId: "aoi-1",
            geometryFamily: "polygon",
            bbox: [28.96, 40.96, 29.07, 41.07],
          },
          visibleLayerIds: ["layer-1"],
          selectedLayerIds: ["layer-1"],
          activeAnalysisResultLayerIds: [],
          selection: {
            totalSelectedFeatures: 14,
            layerCounts: [{ layerId: "layer-1", count: 14 }],
          },
          qa: {
            status: "warning",
            checkedAt: "2026-05-10T20:11:00.000Z",
            layerCount: 1,
            blockedLayerCount: 0,
            issueCounts: {
              info: 0,
              warning: 2,
              error: 0,
              blocker: 0,
            },
          },
        },
        activeAoiLabel: "Study area",
        overlayLayers: [
          {
            id: "layer-1",
            name: "Parcels",
            type: "geojson",
            visible: true,
            opacity: 1,
            sourceData: {
              type: "FeatureCollection",
              features: [],
            },
            metadata: {
              featureCount: 14,
            },
          },
        ],
        pinCount: 2,
        drawnFeatureCount: 1,
        measurementCount: 1,
        selectedProjectId: "proj_istanbul_risk",
        lastSavedAt: "2026-05-10T20:12:00.000Z",
        qaIssueCount: 2,
        qaBlockerCount: 0,
        workflowReadyCount: 1,
        visiblePublicationLayerCount: 1,
        viewportSyncEnabled: true,
        syncStatus: "Viewport sync active",
        analysisRecommendations: [],
      }),
    );

    expect(html).toContain("Active map context summary");
    expect(html).toContain("Study area");
    expect(html).toContain("Project");
    expect(html).toContain("Save State");
    expect(html).toContain("Review Readiness");
    expect(html).toContain("Viewport sync active");
  });

  it("renders project persistence busy indicators in MapStatusBar", async () => {
    const { MapStatusBar } = await import("../MapStatusBar");
    const html = renderToStaticMarkup(
      React.createElement(MapStatusBar, {
        cursor: null,
        zoom: 12,
        isSaving: true,
        lastSavedAt: "2026-04-25T12:30:00.000Z",
      }),
    );

    expect(html).toContain("saving");
    expect(html).toContain("Project persistence in progress");
    expect(html).toContain("animateTransform");
  });

  it("renders reduced-motion persistence indicators in MapStatusBar without animation", async () => {
    const { MapStatusBar } = await import("../MapStatusBar");
    const html = renderToStaticMarkup(
      React.createElement(MapStatusBar, {
        cursor: null,
        zoom: 12,
        isSaving: true,
        reducedMotion: true,
      }),
    );

    expect(html).toContain("Project persistence in progress");
    expect(html).not.toContain("animateTransform");
  });

  it("renders MapPinSidebar", async () => {
    const { MapPinSidebar } = await import("../MapPinSidebar");
    const html = renderToStaticMarkup(
      React.createElement(MapPinSidebar, {
        pins: [],
        visible: true,
        onRemovePin: () => undefined,
        onClearAll: () => undefined,
        onFlyTo: () => undefined,
      }),
    );
    expect(html).toContain("No pinned locations");
    expect(html).toContain("Pin summary");
  });

  it("renders populated MapPinSidebar technical actions", async () => {
    const { MapPinSidebar } = await import("../MapPinSidebar");
    const html = renderToStaticMarkup(
      React.createElement(MapPinSidebar, {
        pins: [
          { id: "pin-1", label: "Transit Stop", lat: 41.012345, lng: 29.098765 },
          { id: "pin-2", label: "Clinic", lat: 40.987654, lng: 29.123456 },
        ],
        visible: true,
        onRemovePin: () => undefined,
        onClearAll: () => undefined,
        onFlyTo: () => undefined,
      }),
    );

    expect(html).toContain("Field notes");
    expect(html).toContain("Transit Stop");
    expect(html).toContain("41.01235, 29.09877");
    expect(html).toContain("Clear all");
    expect(html).toContain("Fly to Transit Stop");
    expect(html).toContain("Remove Clinic");
  });

});

describe("MapExplorerModal shell contract", () => {
  it("supports the remaining modal extension slot props", () => {
    const props: MapExplorerModalProps = {
      open: true,
      onClose: () => undefined,
      mode: "embedded",
      mapCanvasRef: { current: null },
      bottomTimelineSlot: React.createElement("div", null, "Timeline slot"),
    };

    expect(props.open).toBe(true);
    expect(props.mode).toBe("embedded");
    expect(props.mapCanvasRef?.current).toBeNull();
    expect(props.bottomTimelineSlot).toBeTruthy();
  });
});
