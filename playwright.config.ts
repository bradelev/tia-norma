import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3123" },
  webServer: {
    command: "pnpm start -p 3123",
    url: "http://localhost:3123",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
