import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    env: {
      ...process.env,
      VITE_GEOAI_OBJECT_DETECTION_MODEL_URL:
        process.env.VITE_GEOAI_OBJECT_DETECTION_MODEL_URL ?? '/models/yolo-nano-urban-local-smoke.onnx',
      VITE_GEOAI_OBJECT_DETECTION_BACKEND:
        process.env.VITE_GEOAI_OBJECT_DETECTION_BACKEND ?? 'wasm',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});