import {defineConfig, devices} from "@playwright/test";

const config = defineConfig({
  globalSetup: require.resolve("./global.setup.ts"),
  testDir: "./tests",
  // Test directory pattern to run all tests
  testMatch: ["**/ui/**/*.spec.js", "**/api/**/*.spec.js"],
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL for UI tests - can be overridden by projects */
    baseURL: process.env.UI_BASE_URL || "http://localhost:4200",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    // UI Tests - use the global baseURL setting
    {
      name: "ui-firefox",
      testMatch: "**/ui/**/*.spec.ts",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    // API Tests - override the baseURL for API endpoints
    {
      name: "api",
      testMatch: "**/api/**/*.spec.ts",
      use: {
        baseURL: process.env.API_BASE_URL || "http://localhost:3000",
      },
    },
    /* Test against mobile viewports for UI tests only */
    {
      name: "ui-mobile-chrome",
      testMatch: "**/ui/**/*.spec.ts",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "ui-mobile-firefox",
      testMatch: "**/ui/**/*.spec.ts",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});

module.exports = config;
