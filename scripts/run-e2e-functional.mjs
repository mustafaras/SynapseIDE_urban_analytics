import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const grepInvert = process.env.RUN_REAL_MODELS === "1" ? "@smoke|@a11y" : "@smoke|@a11y|@real-model";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const playwrightCli = path.resolve(scriptDirectory, "../node_modules/@playwright/test/cli.js");

const result = spawnSync(process.execPath, [playwrightCli, "test", "--grep-invert", grepInvert], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
