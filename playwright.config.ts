import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  use: {
    baseURL: "http://127.0.0.1:5184",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "node scripts/test-server.mjs",
    url: "http://127.0.0.1:5184/exhibits/kl43/",
    reuseExistingServer: false,
  },
  timeout: 60000,
});
