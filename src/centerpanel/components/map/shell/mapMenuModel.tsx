import React from "react";
import {
  BarChart3,
  Command,
  Eye,
  FileStack,
  FolderOpen,
  Grip,
  HelpCircle,
  LayoutPanelTop,
  Palette,
  Puzzle,
  Search,
  Shapes,
  type LucideIcon,
} from "lucide-react";

import { MAP_ICON_SIZES } from "../mapTokens";

export interface MapPremiumSourceCommand {
  id: string;
  label: string;
  shortLabel: string;
  title: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  badge?: string | number | null;
  shortcut?: string;
}

export interface MapPremiumMenuItemModel {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  onSelect?: () => void;
  checked?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  shortcut?: React.ReactNode;
  destructive?: boolean;
  testId?: string;
}

export interface MapPremiumMenuSectionModel {
  id: string;
  title?: React.ReactNode;
  items: MapPremiumMenuItemModel[];
}

export interface MapPremiumMenuModel {
  id: string;
  label: string;
  shortLabel: string;
  title: string;
  icon: React.ReactNode;
  sections: MapPremiumMenuSectionModel[];
  triggerTestId?: string;
  menuTestId?: string;
}

export interface MapPremiumQuickActionModel {
  id: string;
  label: string;
  shortLabel: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  badge?: string | number | null;
  testId?: string;
}

interface BuildMapPremiumMenuModelArgs {
  commands: readonly MapPremiumSourceCommand[];
  onOpenPalette: () => void;
  paletteShortcut: string;
  primaryCommand?: MapPremiumSourceCommand | null;
}

function findCommand(commands: readonly MapPremiumSourceCommand[], ids: readonly string[]): MapPremiumSourceCommand | undefined {
  for (const id of ids) {
    const found = commands.find((command) => command.id === id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function commandItem(
  commands: readonly MapPremiumSourceCommand[],
  ids: readonly string[],
  options: {
    id?: string;
    label?: string;
    description?: string;
    checked?: boolean;
    testId?: string;
  } = {},
): MapPremiumMenuItemModel | null {
  const command = findCommand(commands, ids);
  if (!command) {
    return null;
  }

  const Icon = command.icon;
  return {
    id: options.id ?? command.id,
    label: options.label ?? command.label,
    description: options.description ?? (command.disabled ? command.disabledReason ?? command.title : undefined),
    icon: <Icon size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
    onSelect: command.disabled ? undefined : command.onClick,
    checked: options.checked ?? command.active,
    disabled: command.disabled,
    disabledReason: command.disabledReason,
    shortcut: command.shortcut,
    testId: options.testId ?? `map-toolbar-command-${command.id}`,
  };
}

function disabledItem(input: {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  testId?: string;
}): MapPremiumMenuItemModel {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    icon: input.icon,
    disabled: true,
    disabledReason: input.description,
    testId: input.testId,
  };
}

function paletteItem(onOpenPalette: () => void, paletteShortcut: string): MapPremiumMenuItemModel {
  return {
    id: "command-palette",
    label: "Command Palette",
    icon: <Command size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
    onSelect: onOpenPalette,
    shortcut: paletteShortcut,
    testId: "map-premium-menu-command-palette",
  };
}

function compactItems(items: Array<MapPremiumMenuItemModel | null>): MapPremiumMenuItemModel[] {
  return items.filter((item): item is MapPremiumMenuItemModel => item != null);
}

function commandAliasItem(
  commands: readonly MapPremiumSourceCommand[],
  commandId: string,
  aliasId: string,
  label: string,
): MapPremiumMenuItemModel | null {
  return commandItem(commands, [commandId], {
    id: aliasId,
    label,
    testId: `map-toolbar-command-${aliasId}`,
  });
}

export function buildMapPremiumMenuModel({
  commands,
  onOpenPalette,
  paletteShortcut,
  primaryCommand = null,
}: BuildMapPremiumMenuModelArgs): {
  menus: MapPremiumMenuModel[];
  quickActions: MapPremiumQuickActionModel[];
} {
  const qaCommand = findCommand(commands, ["qa"]);
  const reviewCommand = findCommand(commands, ["review-timeline"]);
  const diagnosticsCommand = findCommand(commands, ["performance-diagnostics"]);
  const layersCommand = findCommand(commands, ["layers"]);
  const contentsCommand = findCommand(commands, ["contents"]);
  const catalogCommand = findCommand(commands, ["catalog"]);

  const menus: MapPremiumMenuModel[] = [
    {
      id: "project",
      label: "Project",
      shortLabel: "Project",
      title: "Project, save state, layout, and launch commands",
      icon: <FolderOpen size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "project-state",
          title: "Workspace",
          items: compactItems([
            commandItem(commands, ["navigator"], { label: "Start Workspace" }),
            commandItem(commands, ["load-project"], { label: "Open Project" }),
            commandItem(commands, ["save-project"], { label: "Save Project" }),
            commandItem(commands, ["import"], { label: "Import Data" }),
            commandItem(commands, ["export-geojson"], { label: "Export Data" }),
            commandItem(commands, ["reset-layout"], { label: "Reset Layout" }),
          ]),
        },
        {
          id: "project-lenses",
          title: "Task Lens",
          items: compactItems([
            commandItem(commands, ["task-lens-analyst"]),
            commandItem(commands, ["task-lens-planner"]),
            commandItem(commands, ["task-lens-reviewer"]),
            commandItem(commands, ["task-lens-publisher"]),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-project",
      menuTestId: "map-premium-menu-content-project",
    },
    {
      id: "add-data",
      label: "Add Data",
      shortLabel: "Data",
      title: "Local files, catalog, services, and scene data sources",
      icon: <FileStack size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "add-data-files",
          title: "Files",
          items: compactItems([
            commandAliasItem(commands, "import", "import-vector", "Vector Layer"),
            commandAliasItem(commands, "import", "import-raster", "Raster Layer"),
            commandAliasItem(commands, "import", "import-delimited", "Delimited Text Layer"),
            commandAliasItem(commands, "import", "import-gpx", "GPX Layer"),
            commandAliasItem(commands, "import", "import-mbtiles", "MBTiles Layer"),
            commandAliasItem(commands, "import", "import-osm-pbf", "OSM PBF Layer"),
          ]),
        },
        {
          id: "add-data-services",
          title: "Web Services",
          items: compactItems([
            commandAliasItem(commands, "services", "services-xyz", "XYZ Layer"),
            commandAliasItem(commands, "services", "services-wms", "WMS Layer"),
            commandAliasItem(commands, "services", "services-wfs", "WFS Layer"),
            commandAliasItem(commands, "services", "services-wmts", "WMTS Layer"),
            commandAliasItem(commands, "services", "services-arcgis", "ArcGIS Layer"),
            commandAliasItem(commands, "services", "services-stac", "STAC Layer"),
          ]),
        },
        {
          id: "add-data-cloud",
          title: "Cloud Formats",
          items: compactItems([
            commandAliasItem(commands, "catalog", "catalog-geoparquet", "GeoParquet Layer"),
            commandAliasItem(commands, "catalog", "catalog-flatgeobuf", "FlatGeobuf Layer"),
            commandAliasItem(commands, "catalog", "catalog-pmtiles", "PMTiles Layer"),
            commandAliasItem(commands, "catalog", "catalog-zarr", "Zarr Layer"),
            commandAliasItem(commands, "catalog", "catalog-netcdf", "NetCDF / HDF"),
          ]),
        },
        {
          id: "add-data-3d",
          title: "3D Sources",
          items: compactItems([
            commandAliasItem(commands, "voxcity", "voxcity-lidar", "LiDAR Layer"),
            commandAliasItem(commands, "voxcity", "voxcity-splats", "Splatting Layer"),
            commandAliasItem(commands, "voxcity", "voxcity-3dtiles", "3D Tiles Layer"),
          ]),
        },
        {
          id: "add-data-database",
          title: "Databases",
          items: compactItems([
            commandAliasItem(commands, "catalog", "catalog-duckdb", "DuckDB Layer"),
            commandAliasItem(commands, "services", "services-postgis", "PostgreSQL / PostGIS"),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-add-data",
      menuTestId: "map-premium-menu-content-add-data",
    },
    {
      id: "layers",
      label: "Layers",
      shortLabel: "Layers",
      title: "Layer, contents, QA, and source-health commands",
      icon: <Grip size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "layers-core",
          title: "Workspace",
          items: compactItems([
            commandItem(commands, ["layers"], { label: "Layers Workspace", checked: layersCommand?.active }),
            commandItem(commands, ["contents"], { label: "Contents Tree", checked: contentsCommand?.active }),
          ]),
        },
        {
          id: "layers-governance",
          title: "Quality",
          items: compactItems([
            commandItem(commands, ["catalog"], { label: "Source Catalog", checked: catalogCommand?.active }),
            commandItem(commands, ["qa"], { label: "CRS and QA", checked: qaCommand?.active }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-layers",
      menuTestId: "map-premium-menu-content-layers",
    },
    {
      id: "style",
      label: "Style",
      shortLabel: "Style",
      title: "Renderer, labels, symbology, and cartographic presentation commands",
      icon: <Palette size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "style-core",
          title: "Cartography",
          items: compactItems([
            commandItem(commands, ["theme"], { label: "Renderer and Symbols" }),
            commandItem(commands, ["annotations"], { label: "Labels and Annotations" }),
            commandItem(commands, ["figure-composer"], { label: "Legend and Layout Preview" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-style",
      menuTestId: "map-premium-menu-content-style",
    },
    {
      id: "analyze",
      label: "Processing",
      shortLabel: "Process",
      title: "Processing tools, workflows, and statistical analysis",
      icon: <BarChart3 size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "analyze-exploration",
          title: "Exploration",
          items: compactItems([
            commandItem(commands, ["query"], { label: "Natural-Language Query" }),
            commandItem(commands, ["workflow"], { label: "Spatial Workflows" }),
            commandItem(commands, ["lisa"], { label: "LISA" }),
            commandItem(commands, ["hotspot"], { label: "Hot Spot" }),
            commandItem(commands, ["emerging-hotspot"], { label: "Emerging Hot Spot" }),
          ]),
        },
        {
          id: "analyze-automation",
          title: "Automation",
          items: compactItems([
            commandItem(commands, ["processing-toolbox"], { label: "Processing Toolbox" }),
            commandItem(commands, ["sql-workspace"], { label: "SQL Workspace (DuckDB)" }),
            commandItem(commands, ["model-builder"], { label: "Model Builder" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-analyze",
      menuTestId: "map-premium-menu-content-analyze",
    },
    {
      id: "scene",
      label: "Scene",
      shortLabel: "Scene",
      title: "3D, terrain, raster, and scene overlay commands",
      icon: <Shapes size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "scene-core",
          title: "Scene",
          items: compactItems([
            commandItem(commands, ["sync"], { label: "3D and Terrain" }),
            commandItem(commands, ["voxcity"], { label: "VoxCity and Scene Sources" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-scene",
      menuTestId: "map-premium-menu-content-scene",
    },
    {
      id: "publish",
      label: "Publish",
      shortLabel: "Publish",
      title: "Figure composition, export, and report handoff commands",
      icon: <FileStack size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "publish-composition",
          title: "Composition",
          items: compactItems([
            commandItem(commands, ["figure-composer"]),
            commandItem(commands, ["export-image"], { label: "Image Export" }),
          ]),
        },
        {
          id: "publish-delivery",
          title: "Delivery",
          items: compactItems([
            commandItem(commands, ["export-offline-package"], { label: "Offline Package" }),
            commandItem(commands, ["add-map-to-report"], { label: "Report Handoff" }),
            commandItem(commands, ["export-geojson"], { label: "Data Export" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-publish",
      menuTestId: "map-premium-menu-content-publish",
    },
    {
      id: "review",
      label: "Review",
      shortLabel: "Review",
      title: "Timeline, QA, evidence, and collaboration signals",
      icon: <Search size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "review-quality",
          title: "Quality",
          items: compactItems([
            commandItem(commands, ["qa"], { label: "QA Issues", checked: qaCommand?.active }),
            commandItem(commands, ["performance-diagnostics"], { label: "Diagnostics", checked: diagnosticsCommand?.active }),
          ]),
        },
        {
          id: "review-collaboration",
          title: "Collaboration",
          items: compactItems([
            commandItem(commands, ["review-timeline"], { label: "Review Timeline", checked: reviewCommand?.active }),
            commandItem(commands, ["pins"], { label: "Comments and Pins" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-review",
      menuTestId: "map-premium-menu-content-review",
    },
    {
      id: "controls",
      label: "Controls",
      shortLabel: "Ctrl",
      title: "Search, pins, drawing, measurement, and map interaction controls",
      icon: <Search size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "controls-navigation",
          title: "Navigation",
          items: compactItems([
            paletteItem(onOpenPalette, paletteShortcut),
            commandItem(commands, ["focus-map-canvas"], { label: "Keyboard Focus" }),
            commandItem(commands, ["minimap"], { label: "Minimap" }),
            commandItem(commands, ["view-state-copy"], { label: "Copy View State" }),
            commandItem(commands, ["view-state-restore"], { label: "Restore View State" }),
          ]),
        },
        {
          id: "controls-markup",
          title: "Markup and Measure",
          items: compactItems([
            commandItem(commands, ["pin-mode"], { label: "Drop Pins" }),
            commandItem(commands, ["pins"], { label: "Bookmarks and Pins" }),
            commandItem(commands, ["drawings"], { label: "Drawing Tools" }),
            commandItem(commands, ["measure-results"], { label: "Measurement Tools" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-controls",
      menuTestId: "map-premium-menu-content-controls",
    },
    {
      id: "plugins",
      label: "Plugins",
      shortLabel: "Plug",
      title: "Plugin registry and extension integrations",
      icon: <Puzzle size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "plugins-core",
          title: "Extensions",
          items: compactItems([
            commandItem(commands, ["plugin-registry"], { label: "Extension Registry" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-plugins",
      menuTestId: "map-premium-menu-content-plugins",
    },
    {
      id: "view",
      label: "Settings",
      shortLabel: "Settings",
      title: "Panel visibility, layout controls, and workspace settings",
      icon: <Eye size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "view-panels",
          title: "Panels",
          items: compactItems([
            commandItem(commands, ["layers"], { label: "Left Panel", checked: layersCommand?.active }),
            commandItem(commands, ["qa", "review-timeline", "performance-diagnostics"], { label: "Right Inspector", checked: Boolean(qaCommand?.active || reviewCommand?.active || diagnosticsCommand?.active) }),
            disabledItem({
              id: "bottom-drawer",
              label: "Bottom Drawer",
              description: "Available through the bottom output workspace.",
              icon: <LayoutPanelTop size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
            }),
            disabledItem({
              id: "map-only-mode",
              label: "Map-Only Mode",
              description: "Available when full-screen canvas mode is enabled.",
              icon: <Eye size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
            }),
          ]),
        },
        {
          id: "view-layout",
          title: "Layout",
          items: compactItems([
            commandItem(commands, ["switch-density"], { label: "Density" }),
            commandItem(commands, ["restore-default-widths"], { label: "Panel Widths" }),
            commandItem(commands, ["reset-layout"], { label: "Responsive Reset" }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-view",
      menuTestId: "map-premium-menu-content-view",
    },
    {
      id: "help",
      label: "Help",
      shortLabel: "Help",
      title: "Diagnostics, accessibility, palette, and keyboard help",
      icon: <HelpCircle size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      sections: [
        {
          id: "help-core",
          title: "Support",
          items: compactItems([
            paletteItem(onOpenPalette, paletteShortcut),
            commandItem(commands, ["performance-diagnostics"], { label: "Performance Diagnostics" }),
            commandItem(commands, ["focus-map-canvas"], { label: "Accessibility Focus" }),
            disabledItem({
              id: "keyboard-shortcuts",
              label: "Keyboard Shortcuts",
              description: `Use ${paletteShortcut} for the command palette and map canvas shortcuts.`,
              icon: <Command size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
            }),
          ]),
        },
      ],
      triggerTestId: "map-premium-menu-help",
      menuTestId: "map-premium-menu-content-help",
    },
  ];

  const quickActionCandidates = compactItems([
    primaryCommand
      ? {
          id: primaryCommand.id,
          label: primaryCommand.label,
          shortLabel: primaryCommand.shortLabel,
          title: primaryCommand.disabled ? `${primaryCommand.title}. ${primaryCommand.disabledReason ?? "Unavailable in the current map state."}` : primaryCommand.title,
          icon: React.createElement(primaryCommand.icon, { size: MAP_ICON_SIZES.sm, strokeWidth: 1.8, "aria-hidden": true }),
          onClick: primaryCommand.onClick,
          active: primaryCommand.active,
          disabled: primaryCommand.disabled,
          disabledReason: primaryCommand.disabledReason,
          badge: primaryCommand.badge,
          testId: `map-premium-quick-action-${primaryCommand.id}`,
        }
      : null,
    (() => {
      const command = findCommand(commands, ["import"]);
      if (!command) return null;
      return {
        id: command.id,
        label: command.label,
        shortLabel: command.shortLabel,
        title: command.title,
        icon: React.createElement(command.icon, { size: MAP_ICON_SIZES.sm, strokeWidth: 1.8, "aria-hidden": true }),
        onClick: command.onClick,
        active: command.active,
        disabled: command.disabled,
        disabledReason: command.disabledReason,
        badge: command.badge,
        testId: `map-premium-quick-action-${command.id}`,
      } satisfies MapPremiumQuickActionModel;
    })(),
    (() => {
      const command = findCommand(commands, ["layers"]);
      if (!command) return null;
      return {
        id: command.id,
        label: "Layers",
        shortLabel: "Layers",
        title: command.title,
        icon: React.createElement(command.icon, { size: MAP_ICON_SIZES.sm, strokeWidth: 1.8, "aria-hidden": true }),
        onClick: command.onClick,
        active: command.active,
        disabled: command.disabled,
        disabledReason: command.disabledReason,
        badge: command.badge,
        testId: `map-premium-quick-action-${command.id}`,
      } satisfies MapPremiumQuickActionModel;
    })(),
    (() => {
      const command = findCommand(commands, ["drawings"]);
      if (!command) return null;
      return {
        id: command.id,
        label: "Draw",
        shortLabel: "Draw",
        title: command.disabled ? `${command.title}. ${command.disabledReason ?? "Unavailable in the current map state."}` : command.title,
        icon: React.createElement(command.icon, { size: MAP_ICON_SIZES.sm, strokeWidth: 1.8, "aria-hidden": true }),
        onClick: command.onClick,
        active: command.active,
        disabled: command.disabled,
        disabledReason: command.disabledReason,
        badge: command.badge,
        testId: `map-premium-quick-action-${command.id}`,
      } satisfies MapPremiumQuickActionModel;
    })(),
    (() => {
      const command = findCommand(commands, ["qa", "workflow", "save-project"]);
      if (!command) return null;
      return {
        id: command.id,
        label: command.label,
        shortLabel: command.shortLabel,
        title: command.disabled ? `${command.title}. ${command.disabledReason ?? "Unavailable in the current map state."}` : command.title,
        icon: React.createElement(command.icon, { size: MAP_ICON_SIZES.sm, strokeWidth: 1.8, "aria-hidden": true }),
        onClick: command.onClick,
        active: command.active,
        disabled: command.disabled,
        disabledReason: command.disabledReason,
        badge: command.badge,
        testId: `map-premium-quick-action-${command.id}`,
      } satisfies MapPremiumQuickActionModel;
    })(),
    {
      id: "command-palette",
      label: "Palette",
      shortLabel: "Cmd",
      title: `Open command palette (${paletteShortcut})`,
      icon: <Command size={MAP_ICON_SIZES.sm} strokeWidth={1.8} aria-hidden="true" />,
      onClick: onOpenPalette,
      testId: "map-premium-quick-action-command-palette",
    },
  ]);

  const quickActions = quickActionCandidates.filter((action, index, collection) => collection.findIndex((candidate) => candidate.id === action.id) === index).slice(0, 5);
  const projectMenu = menus.find((menu) => menu.id === "project");
  const addDataMenu = menus.find((menu) => menu.id === "add-data");
  const layersMenu = menus.find((menu) => menu.id === "layers");
  const processingMenu = menus.find((menu) => menu.id === "analyze");
  const controlsMenu = menus.find((menu) => menu.id === "controls");
  const pluginsMenu = menus.find((menu) => menu.id === "plugins");
  const settingsMenu = menus.find((menu) => menu.id === "view");
  const helpMenu = menus.find((menu) => menu.id === "help");
  const styleMenu = menus.find((menu) => menu.id === "style");
  const sceneMenu = menus.find((menu) => menu.id === "scene");
  const publishMenu = menus.find((menu) => menu.id === "publish");
  const reviewMenu = menus.find((menu) => menu.id === "review");

  const resolvedProjectMenu = projectMenu
    ? {
        ...projectMenu,
        sections: [
          ...projectMenu.sections,
          ...(reviewMenu?.sections ?? []),
          ...(publishMenu?.sections ?? []),
        ],
      }
    : null;

  const resolvedLayersMenu = layersMenu
    ? {
        ...layersMenu,
        sections: [
          ...layersMenu.sections,
          ...(styleMenu?.sections ?? []),
        ],
      }
    : null;

  const resolvedControlsMenu = controlsMenu
    ? {
        ...controlsMenu,
        sections: [
          ...controlsMenu.sections,
          ...(sceneMenu?.sections ?? []),
        ],
      }
    : null;

  const consolidatedMenus = [
    resolvedProjectMenu,
    addDataMenu,
    resolvedLayersMenu,
    processingMenu,
    resolvedControlsMenu,
    pluginsMenu,
    settingsMenu,
    helpMenu,
  ].filter((menu): menu is MapPremiumMenuModel => menu != null);

  return { menus: consolidatedMenus, quickActions };
}
