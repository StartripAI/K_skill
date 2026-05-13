import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  webServer: {
    command: "npm run build && node dist/packages/cli/src/index.js serve --port 5999 --vault tmp/playwright-vault.sqlite",
    url: "http://127.0.0.1:5999/api/health",
    timeout: 120_000,
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:5999",
    trace: "retain-on-failure"
  }
});
