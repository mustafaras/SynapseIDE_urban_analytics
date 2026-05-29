import { describe, expect, it } from "vitest";
import {
  formatMapKeybinding,
  isMapRedoShortcut,
  isMapUndoShortcut,
  isOpenPaletteShortcut,
  MAP_KEYBINDINGS,
  searchMapPaletteCommands,
  shouldIgnoreMapPaletteShortcut,
  type MapPaletteSearchCommand,
} from "@/services/map/commands/MapCommandPalette";

const commands: MapPaletteSearchCommand[] = [
  {
    id: "import",
    label: "Import",
    title: "Import GeoJSON and CSV files",
    category: "Tools",
    keywords: ["upload", "load data"],
  },
  {
    id: "processing:buffer",
    label: "Buffer",
    title: "Expand each feature by a fixed distance",
    category: "Tool: Geometry",
    keywords: ["processing", "geoprocessing", "distance meters"],
  },
  {
    id: "processing:kernel-density",
    label: "Kernel density",
    title: "Heatmap surface from point density",
    category: "Tool: Statistics",
    keywords: ["processing", "heatmap"],
    disabled: true,
    disabledReason: "Kernel density is registered but not wired yet.",
  },
];

describe("Map command palette search and keybindings", () => {
  it("uses Fuse-compatible fuzzy search across registered map commands and tools", () => {
    const results = searchMapPaletteCommands(commands, "bufr", 5);
    expect(results.map((command) => command.id)).toEqual(["processing:buffer"]);
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
