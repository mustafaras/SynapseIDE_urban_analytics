import Fuse from "fuse.js";

export type MapCommandTaxonomyId =
  | "data"
  | "layers"
  | "contents"
  | "qa"
  | "analyze"
  | "query"
  | "style"
  | "scene"
  | "publish"
  | "review"
  | "diagnostics"
  | "project"
  | "extensions";

export interface MapCommandTaxonomyMetadata {
  id: MapCommandTaxonomyId;
  label: string;
  title: string;
  keywords: readonly string[];
}

export const MAP_COMMAND_TAXONOMY_ORDER = [
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
] as const satisfies readonly MapCommandTaxonomyId[];

export const MAP_COMMAND_TAXONOMY_META: Record<MapCommandTaxonomyId, MapCommandTaxonomyMetadata> = {
  data: {
    id: "data",
    label: "Data",
    title: "Import, source catalog, external service, restore, and demo data commands",
    keywords: ["data", "import", "source", "catalog", "connection", "wms", "wfs", "geojson", "geoparquet", "shapefile", "geotiff"],
  },
  layers: {
    id: "layers",
    label: "Layers",
    title: "Layer stack, focus, visibility, opacity, ordering, inspection, and removal commands",
    keywords: ["layers", "layer stack", "visibility", "opacity", "focus layer", "inspect layer", "source", "schema"],
  },
  contents: {
    id: "contents",
    label: "Contents",
    title: "Contents tree, grouping, scale range, filters, duplicate, and source repair commands",
    keywords: ["contents", "layer tree", "group", "scale range", "definition filter", "duplicate", "repair"],
  },
  qa: {
    id: "qa",
    label: "QA",
    title: "Problems, CRS, projection, geometry repair, noData, and source caveat commands",
    keywords: ["qa", "problems", "crs", "projection", "geometry", "repair", "nodata", "noData", "caveat"],
  },
  analyze: {
    id: "analyze",
    label: "Analyze",
    title: "Workflow, processing, buffer, intersect, model, statistics, AOI, draw, and measure commands",
    keywords: ["analyze", "workflow", "processing", "buffer", "intersect", "join", "lisa", "gi*", "hotspot", "aoi", "measure"],
  },
  query: {
    id: "query",
    label: "Query",
    title: "Natural language, selection, attribute, field, schema, and table query commands",
    keywords: ["query", "natural language", "selection", "attribute", "field", "schema", "table", "sql"],
  },
  style: {
    id: "style",
    label: "Style",
    title: "Renderer, choropleth, point symbols, labels, legend, and cartography commands",
    keywords: ["style", "renderer", "choropleth", "symbols", "labels", "legend", "cartography"],
  },
  scene: {
    id: "scene",
    label: "Scene",
    title: "Raster, temporal, 3D, terrain, zoning, massing, sun/shadow, and VoxCity commands",
    keywords: ["scene", "raster", "geotiff", "nodata", "noData", "temporal", "3d", "terrain", "cityjson", "voxcity"],
  },
  publish: {
    id: "publish",
    label: "Publish",
    title: "Figure, image export, data export, offline package, attribution, and report commands",
    keywords: ["publish", "figure", "image", "export", "geojson", "geoparquet", "package", "report", "attribution"],
  },
  review: {
    id: "review",
    label: "Review",
    title: "Timeline, audit, notes, comments, collaboration, revert, and review package commands",
    keywords: ["review", "timeline", "audit", "notes", "comments", "collaboration", "revert"],
  },
  diagnostics: {
    id: "diagnostics",
    label: "Diagnostics",
    title: "Performance diagnostics, render budget, worker, telemetry, retry, and recovery commands",
    keywords: ["diagnostics", "performance", "render budget", "worker", "telemetry", "retry", "recovery"],
  },
  project: {
    id: "project",
    label: "Project",
    title: "Project, command palette, task lens, layout, focus, save, load, undo, and redo commands",
    keywords: ["project", "command palette", "task lens", "layout", "focus", "save", "load", "undo", "redo", "shortcut"],
  },
  extensions: {
    id: "extensions",
    label: "Extensions",
    title: "Plugin registry, source connector, renderer, processing, and Urban bridge extension commands",
    keywords: ["extensions", "plugins", "registry", "source connector", "renderer", "processing", "urban bridge"],
  },
};

export interface MapPaletteCommandGroup<T extends MapPaletteSearchCommand> {
  taxonomyId: MapCommandTaxonomyId;
  metadata: MapCommandTaxonomyMetadata;
  commands: T[];
}

export interface MapPaletteSearchCommand {
  id: string;
  label: string;
  title: string;
  category: string;
  taxonomy?: MapCommandTaxonomyId;
  keywords: readonly string[];
  aliases?: readonly string[];
  shortcut?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export type MapKeybindingId =
  | "openPalette"
  | "closePalette"
  | "runSelected"
  | "nextCommand"
  | "previousCommand"
  | "undoAction"
  | "redoAction";

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
  undoAction: {
    commandId: "undoAction",
    label: "Undo map action",
    shortcut: "Ctrl+Z",
    macShortcut: "Cmd+Z",
    description: "Undo the latest reversible map edit.",
  },
  redoAction: {
    commandId: "redoAction",
    label: "Redo map action",
    shortcut: "Ctrl+Y",
    macShortcut: "Cmd+Shift+Z",
    description: "Redo the latest undone map edit.",
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

export function isMapUndoShortcut(event: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "key">): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "z";
}

export function isMapRedoShortcut(event: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "key">): boolean {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
  const key = event.key.toLowerCase();
  return (!event.shiftKey && key === "y") || (event.shiftKey && key === "z");
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
    { name: "keywords", weight: 0.18 },
    { name: "aliases", weight: 0.13 },
    { name: "category", weight: 0.06 },
    { name: "taxonomy", weight: 0.05 },
    { name: "shortcut", weight: 0.04 },
    { name: "id", weight: 0.04 },
  ],
};

function inferMapCommandTaxonomy(command: Pick<MapPaletteSearchCommand, "category" | "keywords" | "title" | "label">): MapCommandTaxonomyId {
  const fingerprint = [command.category, command.label, command.title, ...command.keywords].join(" ").toLowerCase();
  if (/\b(wms|wfs|source|catalog|import|geojson|geoparquet|shapefile|geotiff)\b/.test(fingerprint)) return "data";
  if (/\b(contents|layer tree|scale range|definition filter|duplicate)\b/.test(fingerprint)) return "contents";
  if (/\b(layer|visibility|opacity|schema)\b/.test(fingerprint)) return "layers";
  if (/\b(qa|crs|projection|geometry repair|nodata|no data|caveat|problem)\b/.test(fingerprint)) return "qa";
  if (/\b(query|sql|field|attribute table|selection)\b/.test(fingerprint)) return "query";
  if (/\b(style|choropleth|symbology|symbol|label|legend|cartography)\b/.test(fingerprint)) return "style";
  if (/\b(scene|raster|terrain|3d|cityjson|voxcity|temporal)\b/.test(fingerprint)) return "scene";
  if (/\b(publish|figure|export|package|report|attribution)\b/.test(fingerprint)) return "publish";
  if (/\b(review|timeline|audit|comment|collaboration|note)\b/.test(fingerprint)) return "review";
  if (/\b(diagnostics|performance|worker|render budget|telemetry|recovery)\b/.test(fingerprint)) return "diagnostics";
  if (/\b(extension|plugin|registry|connector)\b/.test(fingerprint)) return "extensions";
  if (/\b(analyze|processing|tool|buffer|intersect|join|lisa|gi\*|hotspot|aoi|measure|model|workflow)\b/.test(fingerprint)) return "analyze";
  return "project";
}

export function resolveMapCommandTaxonomy(command: MapPaletteSearchCommand): MapCommandTaxonomyId {
  return command.taxonomy ?? inferMapCommandTaxonomy(command);
}

export function groupMapPaletteCommandsByTaxonomy<T extends MapPaletteSearchCommand>(
  commands: readonly T[],
): MapPaletteCommandGroup<T>[] {
  const grouped = new Map<MapCommandTaxonomyId, T[]>();
  for (const command of commands) {
    const taxonomyId = resolveMapCommandTaxonomy(command);
    const existing = grouped.get(taxonomyId);
    if (existing) {
      existing.push(command);
    } else {
      grouped.set(taxonomyId, [command]);
    }
  }

  return MAP_COMMAND_TAXONOMY_ORDER.map((taxonomyId) => {
    const groupCommands = grouped.get(taxonomyId) ?? [];
    return {
      taxonomyId,
      metadata: MAP_COMMAND_TAXONOMY_META[taxonomyId],
      commands: groupCommands,
    } satisfies MapPaletteCommandGroup<T>;
  }).filter((group) => group.commands.length > 0);
}

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
