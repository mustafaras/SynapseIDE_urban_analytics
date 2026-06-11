import { describe, expect, it } from "vitest";
import {
  formatMapKeybinding,
  groupMapPaletteCommandsByTaxonomy,
  isMapRedoShortcut,
  isMapUndoShortcut,
  isOpenPaletteShortcut,
  MAP_COMMAND_TAXONOMY_META,
  MAP_COMMAND_TAXONOMY_ORDER,
  MAP_KEYBINDINGS,
  type MapPaletteSearchCommand,
  searchMapPaletteCommands,
  shouldIgnoreMapPaletteShortcut,
} from "@/services/map/commands/MapCommandPalette";

const commands: MapPaletteSearchCommand[] = [
  {
    id: "import",
    label: "Import",
    title: "Import GeoJSON and CSV files",
    category: "Data",
    taxonomy: "data",
    keywords: ["upload", "load data", "GeoJSON", "GeoParquet", "Shapefile", "GeoTIFF", "source", "catalog"],
  },
  {
    id: "processing:buffer",
    label: "Buffer",
    title: "Expand each feature by a fixed distance",
    category: "Tool: Geometry",
    taxonomy: "analyze",
    keywords: ["processing", "geoprocessing", "distance meters", "CRS", "projection"],
    aliases: ["analysis buffer", "toolbox buffer"],
  },
  {
    id: "processing:kernel-density",
    label: "Kernel density",
    title: "Heatmap surface from point density",
    category: "Tool: Statistics",
    taxonomy: "analyze",
    keywords: ["processing", "heatmap"],
    disabled: true,
    disabledReason: "Kernel density is registered but not wired yet.",
  },
];

const gisCommands: MapPaletteSearchCommand[] = [
  {
    id: "data-import",
    label: "Import",
    title: "Import GeoJSON, GeoParquet, Shapefile, GeoPackage, and sampled GeoTIFF sources",
    category: "Data",
    taxonomy: "data",
    keywords: ["CRS", "projection", "source", "catalog", "WMS", "WFS", "GeoJSON", "GeoParquet", "Shapefile", "GeoTIFF"],
  },
  {
    id: "contents-tree",
    label: "Contents",
    title: "Layer contents tree with field schema, scale ranges, and source repair",
    category: "Contents",
    taxonomy: "contents",
    keywords: ["field", "schema", "definition filter", "scale range"],
    aliases: ["old contents", "layer tree"],
  },
  {
    id: "qa-problems",
    label: "Problems",
    title: "Review CRS projection blockers, geometry repair, and noData caveats",
    category: "QA",
    taxonomy: "qa",
    keywords: ["CRS", "projection", "noData", "geometry repair"],
    disabled: true,
    disabledReason: "Add a layer before reviewing scientific QA problems.",
  },
  {
    id: "analyze-tools",
    label: "Analyze tools",
    title: "Run buffer, intersect, spatial join, LISA, and Getis-Ord Gi* tools",
    category: "Analyze",
    taxonomy: "analyze",
    keywords: ["buffer", "intersect", "join", "LISA", "Gi*", "spatial statistics"],
  },
  {
    id: "scene-workspace",
    label: "Scene",
    title: "Open 3D terrain, raster GeoTIFF, temporal, and noData scene controls",
    category: "Scene",
    taxonomy: "scene",
    keywords: ["3D", "terrain", "GeoTIFF", "noData", "CityJSON"],
  },
  {
    id: "publish-figure",
    label: "Publish",
    title: "Publish figure with attribution, legend, CRS, GeoJSON, and GeoParquet export readiness",
    category: "Publish",
    taxonomy: "publish",
    keywords: ["attribution", "GeoJSON", "GeoParquet", "legend", "north arrow"],
  },
];

describe("Map command palette search and keybindings", () => {
  it("publishes the Prompt 24 command taxonomy metadata in palette scan order", () => {
    expect(MAP_COMMAND_TAXONOMY_ORDER).toEqual([
      "data",
      "layers",
      "contents",
      "qa",
      "analyze",
      "query",
      "style",
      "scene",
      "publish",
      "review",
      "diagnostics",
      "project",
      "extensions",
    ]);
    expect(MAP_COMMAND_TAXONOMY_META.qa.keywords).toEqual(expect.arrayContaining(["crs", "projection", "noData"]));
    expect(MAP_COMMAND_TAXONOMY_META.publish.keywords).toEqual(expect.arrayContaining(["attribution", "geoparquet"]));
  });

  it("uses Fuse-compatible fuzzy search across registered map commands and tools", () => {
    const results = searchMapPaletteCommands(commands, "bufr", 5);
    expect(results.map((command) => command.id)).toEqual(["processing:buffer"]);
  });

  it("groups palette matches by taxonomy without dropping disabled commands", () => {
    const groups = groupMapPaletteCommandsByTaxonomy([
      gisCommands[3]!,
      gisCommands[2]!,
      gisCommands[0]!,
      gisCommands[5]!,
    ]);

    expect(groups.map((group) => group.taxonomyId)).toEqual(["data", "qa", "analyze", "publish"]);
    expect(groups.find((group) => group.taxonomyId === "qa")?.commands[0]?.disabledReason).toMatch(/add a layer/i);
  });

  it("finds representative GIS vocabulary and legacy aliases", () => {
    const expectedMatches = [
      { query: "CRS", id: "qa-problems" },
      { query: "projection", id: "qa-problems" },
      { query: "source", id: "data-import" },
      { query: "catalog", id: "data-import" },
      { query: "WMS", id: "data-import" },
      { query: "WFS", id: "data-import" },
      { query: "GeoParquet", id: "data-import" },
      { query: "Shapefile", id: "data-import" },
      { query: "GeoTIFF", id: "data-import" },
      { query: "field", id: "contents-tree" },
      { query: "schema", id: "contents-tree" },
      { query: "old contents", id: "contents-tree" },
      { query: "buffer", id: "analyze-tools" },
      { query: "intersect", id: "analyze-tools" },
      { query: "join", id: "analyze-tools" },
      { query: "LISA", id: "analyze-tools" },
      { query: "Gi*", id: "analyze-tools" },
      { query: "3D", id: "scene-workspace" },
      { query: "terrain", id: "scene-workspace" },
      { query: "noData", id: "qa-problems" },
      { query: "attribution", id: "publish-figure" },
    ];

    for (const expected of expectedMatches) {
      const results = searchMapPaletteCommands(gisCommands, expected.query, 6);
      expect(results.map((command) => command.id), expected.query).toContain(expected.id);
    }
  });

  it("keeps Fuse relevance order instead of original command order", () => {
    const results = searchMapPaletteCommands([
      {
        id: "toolbar:figure",
        label: "Figure",
        title: "Compose publication figure",
        category: "Export",
        keywords: ["export", "map"],
      },
      ...commands,
    ], "bufr", 5);
    expect(results[0]!.id).toBe("processing:buffer");
  });

  it("keeps disabled commands searchable with their reason", () => {
    const results = searchMapPaletteCommands(commands, "kernel heat", 5);
    expect(results).toHaveLength(1);
    expect(results[0]!.disabledReason).toMatch(/not wired/i);
  });

  it("publishes the global palette keybinding map", () => {
    expect(MAP_KEYBINDINGS.openPalette.shortcut).toBe("Ctrl+K");
    expect(MAP_KEYBINDINGS.openPalette.macShortcut).toBe("Cmd+K");
    expect(MAP_KEYBINDINGS.undoAction.shortcut).toBe("Ctrl+Z");
    expect(MAP_KEYBINDINGS.redoAction.macShortcut).toBe("Cmd+Shift+Z");
    expect(formatMapKeybinding("openPalette", "MacIntel")).toBe("Cmd+K");
    expect(formatMapKeybinding("redoAction", "MacIntel")).toBe("Cmd+Shift+Z");
    expect(formatMapKeybinding("runSelected", "Win32")).toBe("Enter");
  });

  it("recognizes the palette shortcut without trapping unrelated chords", () => {
    expect(isOpenPaletteShortcut({ key: "k", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false })).toBe(true);
    expect(isOpenPaletteShortcut({ key: "k", ctrlKey: true, metaKey: false, altKey: true, shiftKey: false })).toBe(false);
    expect(isOpenPaletteShortcut({ key: "j", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false })).toBe(false);
  });

  it("recognizes map undo and redo keyboard chords", () => {
    expect(isMapUndoShortcut({ key: "z", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false })).toBe(true);
    expect(isMapUndoShortcut({ key: "z", ctrlKey: true, metaKey: false, altKey: false, shiftKey: true })).toBe(false);
    expect(isMapRedoShortcut({ key: "y", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false })).toBe(true);
    expect(isMapRedoShortcut({ key: "z", ctrlKey: false, metaKey: true, altKey: false, shiftKey: true })).toBe(true);
    expect(isMapRedoShortcut({ key: "z", ctrlKey: true, metaKey: false, altKey: true, shiftKey: true })).toBe(false);
  });

  it("still allows the global palette chord after another listener prevented default", () => {
    const event = {
      defaultPrevented: true,
      isComposing: false,
      target: null,
    } as KeyboardEvent;
    expect(shouldIgnoreMapPaletteShortcut(event)).toBe(false);
  });

  it("ignores IME composing shortcut events", () => {
    const event = {
      defaultPrevented: false,
      isComposing: true,
      target: null,
    } as KeyboardEvent;
    expect(shouldIgnoreMapPaletteShortcut(event)).toBe(true);
  });

  it("allows the global palette chord from editable map controls", () => {
    const event = {
      defaultPrevented: false,
      isComposing: false,
      target: { tagName: "INPUT", isContentEditable: false },
    } as unknown as KeyboardEvent;
    expect(shouldIgnoreMapPaletteShortcut(event)).toBe(false);
  });
});
