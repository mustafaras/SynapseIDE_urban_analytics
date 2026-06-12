import { describe, expect, it, vi } from "vitest";
import { Boxes } from "lucide-react";
import { buildMapPremiumMenuModel, type MapPremiumSourceCommand } from "../shell/mapMenuModel";

function command(id: string, overrides: Partial<MapPremiumSourceCommand> = {}): MapPremiumSourceCommand {
  return {
    id,
    label: id,
    shortLabel: id,
    title: `Run ${id}`,
    icon: Boxes,
    onClick: vi.fn(),
    ...overrides,
  };
}

const FULL_COMMAND_IDS = [
  "navigator",
  "load-project",
  "save-project",
  "import",
  "export-geojson",
  "reset-layout",
  "services",
  "catalog",
  "layers",
  "contents",
  "qa",
  "theme",
  "annotations",
  "figure-composer",
  "query",
  "workflow",
  "lisa",
  "hotspot",
  "emerging-hotspot",
  "processing-toolbox",
  "sql-workspace",
  "model-builder",
  "sync",
  "voxcity",
  "export-image",
  "export-offline-package",
  "add-map-to-report",
  "performance-diagnostics",
  "review-timeline",
  "pins",
  "pin-mode",
  "drawings",
  "measure-results",
  "focus-map-canvas",
  "plugin-registry",
  "switch-density",
  "restore-default-widths",
];

function buildModel(commands: readonly MapPremiumSourceCommand[]) {
  return buildMapPremiumMenuModel({
    commands,
    onOpenPalette: vi.fn(),
    paletteShortcut: "Ctrl+K",
    primaryCommand: null,
  });
}

describe("buildMapPremiumMenuModel", () => {
  it("consolidates the topbar into the grouped premium menus in stable order", () => {
    const { menus } = buildModel(FULL_COMMAND_IDS.map((id) => command(id)));
    expect(menus.map((menu) => menu.id)).toEqual([
      "project",
      "add-data",
      "layers",
      "analyze",
      "controls",
      "plugins",
      "view",
      "help",
    ]);
  });

  it("places the SQL workspace command in the Processing menu and wires its action", () => {
    const sqlCommand = command("sql-workspace");
    const { menus } = buildModel([sqlCommand, command("processing-toolbox")]);
    const processingMenu = menus.find((menu) => menu.id === "analyze");
    expect(processingMenu).toBeDefined();
    const items = processingMenu!.sections.flatMap((section) => section.items);
    const sqlItem = items.find((item) => item.id === "sql-workspace");
    expect(sqlItem).toBeDefined();
    expect(sqlItem!.label).toBe("SQL Workspace (DuckDB)");
    sqlItem!.onSelect?.();
    expect(sqlCommand.onClick).toHaveBeenCalledTimes(1);
  });

  it("routes Add Data alias entries to the underlying import/services/catalog handlers", () => {
    const importCommand = command("import");
    const servicesCommand = command("services");
    const catalogCommand = command("catalog");
    const { menus } = buildModel([importCommand, servicesCommand, catalogCommand]);
    const addDataMenu = menus.find((menu) => menu.id === "add-data");
    expect(addDataMenu).toBeDefined();
    const items = addDataMenu!.sections.flatMap((section) => section.items);

    items.find((item) => item.id === "import-vector")!.onSelect?.();
    expect(importCommand.onClick).toHaveBeenCalledTimes(1);

    items.find((item) => item.id === "services-wms")!.onSelect?.();
    expect(servicesCommand.onClick).toHaveBeenCalledTimes(1);

    items.find((item) => item.id === "catalog-pmtiles")!.onSelect?.();
    expect(catalogCommand.onClick).toHaveBeenCalledTimes(1);
  });

  it("exposes minimap and view-state commands in the Controls menu", () => {
    const minimapCommand = command("minimap", { active: true });
    const copyCommand = command("view-state-copy");
    const restoreCommand = command("view-state-restore", {
      disabled: true,
      disabledReason: "Copy a view state first.",
    });
    const { menus } = buildModel([minimapCommand, copyCommand, restoreCommand, command("pins")]);
    const controlsMenu = menus.find((menu) => menu.id === "controls");
    expect(controlsMenu).toBeDefined();
    const items = controlsMenu!.sections.flatMap((section) => section.items);

    const minimapItem = items.find((item) => item.id === "minimap");
    expect(minimapItem?.checked).toBe(true);
    minimapItem!.onSelect?.();
    expect(minimapCommand.onClick).toHaveBeenCalledTimes(1);

    const copyItem = items.find((item) => item.id === "view-state-copy");
    expect(copyItem?.label).toBe("Copy View State");
    copyItem!.onSelect?.();
    expect(copyCommand.onClick).toHaveBeenCalledTimes(1);

    const restoreItem = items.find((item) => item.id === "view-state-restore");
    expect(restoreItem?.disabled).toBe(true);
    expect(restoreItem?.onSelect).toBeUndefined();
  });

  it("keeps disabled commands selectable-looking but inert", () => {
    const disabledCommand = command("save-project", {
      disabled: true,
      disabledReason: "Persistence is unavailable in this session.",
    });
    const { menus } = buildModel([disabledCommand]);
    const projectMenu = menus.find((menu) => menu.id === "project");
    const item = projectMenu!.sections
      .flatMap((section) => section.items)
      .find((entry) => entry.id === "save-project");
    expect(item).toBeDefined();
    expect(item!.disabled).toBe(true);
    expect(item!.onSelect).toBeUndefined();
  });

  it("caps quick actions at five entries without duplicate ids", () => {
    const { quickActions } = buildModel(FULL_COMMAND_IDS.map((id) => command(id)));
    expect(quickActions.length).toBeLessThanOrEqual(5);
    const ids = quickActions.map((action) => action.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
