import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: {
    // Create local secrets from the example if missing and apply local D1 migrations, so a fresh
    // checkout has auth configured and the schema and base content in place.
    command:
      "(test -f .dev.vars || cp .dev.vars.example .dev.vars) && bun run db:migrate:local && bun run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
