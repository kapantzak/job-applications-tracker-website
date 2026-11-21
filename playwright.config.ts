import { defineConfig, devices } from '@playwright/test';

// When PLAYWRIGHT_BASE_URL is set, tests run against that deployment and no local server starts.
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

// Lets automated runs through Vercel preview protection; the secret is only sent as a header.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: externalBaseURL ?? 'http://localhost:4321',
    ...(bypassSecret
      ? {
          extraHTTPHeaders: {
            'x-vercel-protection-bypass': bypassSecret,
            'x-vercel-set-bypass-cookie': 'true',
          },
        }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(externalBaseURL
    ? {}
    : {
        webServer: {
          // --ignore-lock keeps preview in the foreground when an AI agent runs the tests.
          command: 'npm run build && npm run preview -- --port 4321 --ignore-lock',
          port: 4321,
          reuseExistingServer: !process.env.CI,
        },
      }),
});
