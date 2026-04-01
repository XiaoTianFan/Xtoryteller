import os from 'node:os';
import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const testPort = Number(
  process.env.PLAYWRIGHT_TEST_PORT ?? process.env.PLAYWRIGHT_PORT ?? 3101
);
const managedBaseURL = `http://127.0.0.1:${testPort}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? managedBaseURL;
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1' ||
  process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === 'true';
const tempArtifactsRoot =
  process.env.PLAYWRIGHT_ARTIFACTS_DIR ??
  path.join(os.tmpdir(), 'xtoryteller-playwright');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: path.join(tempArtifactsRoot, 'report') },
    ],
  ],
  outputDir: path.join(tempArtifactsRoot, 'artifacts'),
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run start -- --port ${testPort}`,
        url: managedBaseURL,
        reuseExistingServer,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
