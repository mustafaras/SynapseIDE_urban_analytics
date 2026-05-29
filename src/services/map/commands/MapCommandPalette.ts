import Fuse from "fuse.js";

export interface MapPaletteSearchCommand {
  id: string;
  label: string;
  title: string;
  category: string;
  keywords: readonly string[];
  shortcut?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export type MapKeybindingId =
  | "openPalette"
  | "closePalette"
  | "runSelected"
  | "nextCommand"
  | "previousCommand";

export interface MapKeybindingDescriptor {
  commandId: MapKeybindingId;
  label: string;
  shortcut: string;
  macShortcut: string;
  description: string;
}

export const MAP_KEYBINDINGS: Record<MapKeybindingId, MapKeybindingDescriptor> = {
  openPalette: {
    commandId: "openPalette",
    label: "Open command palette",
    shortcut: "Ctrl+K",
    macShortcut: "Cmd+K",
    description: "Open the Map Explorer command palette.",
  },
  closePalette: {
    commandId: "closePalette",
    label: "Close command palette",
    shortcut: "Esc",
    macShortcut: "Esc",
    description: "Close the active command palette without running a command.",
  },
  runSelected: {
    commandId: "runSelected",
    label: "Run selected command",
    shortcut: "Enter",
    macShortcut: "Enter",
    description: "Run the highlighted command palette entry.",
  },
  nextCommand: {
    commandId: "nextCommand",
    label: "Next command",
    shortcut: "ArrowDown",
    macShortcut: "ArrowDown",
    description: "Move to the next command palette entry.",
  },
  previousCommand: {
    commandId: "previousCommand",
    label: "Previous command",
    shortcut: "ArrowUp",
    macShortcut: "ArrowUp",
    description: "Move to the previous command palette entry.",
  },
};

function platformIsMac(platform: string | undefined): boolean {
  return Boolean(platform?.toLowerCase().includes("mac"));
}

export function formatMapKeybinding(bindingId: MapKeybindingId, platform = globalThis.navigator?.platform): string {
  const binding = MAP_KEYBINDINGS[bindingId];
  return platformIsMac(platform) ? binding.macShortcut : binding.shortcut;
}

export function isOpenPaletteShortcut(event: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "key">): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k";
}

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined") return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function shouldIgnoreMapPaletteShortcut(event: KeyboardEvent): boolean {
  return event.isComposing;
}

const FUSE_OPTIONS: Fuse.IFuseOptions<MapPaletteSearchCommand> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.35,
  keys: [
    { name: "label", weight: 0.45 },
    { name: "title", weight: 0.25 },
    { name: "keywords", weight: 0.2 },
    { name: "category", weight: 0.06 },
    { name: "id", weight: 0.04 },
  ],
};

export function searchMapPaletteCommands<T extends MapPaletteSearchCommand>(
  commands: readonly T[],
  query: string,
  limit = 16,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return commands.slice(0, limit);

  const fuse = new Fuse<MapPaletteSearchCommand>(commands as readonly MapPaletteSearchCommand[], FUSE_OPTIONS);
  const byId = new Map(commands.map((command) => [command.id, command]));
  return fuse
    .search(trimmed, { limit })
    .map((result) => byId.get(result.item.id))
    .filter((command): command is T => command !== undefined);
}
