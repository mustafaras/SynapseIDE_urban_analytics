import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
