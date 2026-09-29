import { defineConfig } from "@playwright/test";

// E2E_PORT lets parallel worktrees run their own servers side by side.
const PORT = Number(process.env.E2E_PORT ?? 3000);
// Optional escape hatch for sandboxes whose preinstalled Chromium does not
// match this Playwright version. Unset in CI.
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: "chromium",
    trace: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "phone",
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
  ],
  webServer: {
    // `exec` keeps `next start` in Playwright's process group. pnpm 12 runs
    // scripts in a new process group, so `pnpm start` would be orphaned on
    // teardown and Playwright would hang waiting for its stdout to close.
    // NEXT_PUBLIC_DEBUG_GL=1 (non-secret) lets e2e/scene.spec.ts read the live WebGL context count
    // (`window.__urjaGL`, TC-030) and opt one page past the software-GPU guard. It changes nothing
    // else, so every other spec runs as before; next.config.ts inlines it ("0" elsewhere) and
    // `pnpm check:bundle` keeps the hooks out of flagless builds. A second server
    // was not used: two `next build`s would share .next (distDir is not configurable by env).
    command: `NEXT_PUBLIC_DEBUG_GL=1 pnpm build && exec ./node_modules/.bin/next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
