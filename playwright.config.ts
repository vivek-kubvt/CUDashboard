import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./scripts",
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
