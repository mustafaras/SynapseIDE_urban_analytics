import { expect, type Locator, type Page } from "@playwright/test";

import { triggerDomClick } from "./urbanAnalytics";

function searchTextFromPattern(pattern: RegExp): string {
  return pattern.source
    .replace(/\\s\+/g, " ")
    .replace(/\\\//g, "/")
    .replace(/[\\^$.*+?()[\]{}|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function openMapCommand(
  page: Page,
  mapExplorer: Locator,
  directName: RegExp,
  commandName: RegExp,
): Promise<void> {
  const directButton = mapExplorer.getByRole("button", { name: directName }).first();
  if (await directButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(directButton);
    return;
  }

  await triggerDomClick(mapExplorer.getByTestId("map-commands-trigger"));
  const commandsMenu = page.getByTestId("map-commands-menu");
  await expect(commandsMenu).toBeVisible();
  const searchText = searchTextFromPattern(commandName);
  await commandsMenu.getByLabel("Search commands").fill(searchText);

  const menuCommand = commandsMenu.getByRole("menuitem", { name: commandName }).first();
  if (await menuCommand.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(menuCommand);
    return;
  }

  await triggerDomClick(commandsMenu.getByTestId("map-commands-open-palette"));
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await expect(palette).toBeVisible();
  await palette.getByLabel("Search map commands").fill(searchText);
  await triggerDomClick(palette.getByRole("option", { name: commandName }).first());
}
