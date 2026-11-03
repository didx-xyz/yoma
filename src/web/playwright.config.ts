import { defineConfig, devices } from "@playwright/test";
import { storageStatePath } from "./e2e/support/auth";

// End-to-end tests run against an already-running local stack:
//   - web:      pnpm dev            (http://localhost:3000)
//   - api + keycloak + db: docker compose in src/api
// The Keycloak issuer is http://keycloak:8080, so the browser host needs
// "127.0.0.1 keycloak" in /etc/hosts. Nothing is started by this config.
//
// Projects:
//   setup      e2e/auth.setup.ts — signs in each seeded role once, saves e2e/.auth/<role>.json
//   anonymous  e2e/public/**     — no session (the login journey itself lives here)
//   youth      e2e/youth/**      — testuser@gmail.com
//   org-admin  e2e/org-admin/**  — testorgadminuser@gmail.com
//   admin      e2e/admin/**      — testadminuser@gmail.com
// Add a test under the folder of the role it needs; the session is already there.
//
// Coverage: `pnpm test:e2e:coverage` (E2E_COVERAGE=1). e2e/support/test.ts records V8 coverage
// per test; monocart-reporter maps it to src/ and writes monocart-report/ (html + lcov). Only
// client bundles are measured — getServerSideProps, pages/api and server/ never run in the browser.
const isCI = !!process.env.CI;
const chromium = { ...devices["Desktop Chrome"] };
const coverage = process.env.E2E_COVERAGE === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [
    ["list"],
    ...(isCI ? [["html", { open: "never" }] as const] : []),
    ...(coverage
      ? [
          [
            "monocart-reporter",
            {
              outputFile: "monocart-report/index.html",
              coverage: {
                // Dev server: each src/ module is an eval'd script named
                // webpack-internal:///(pages-dir-browser)/./src/… with an inline source map.
                entryFilter: (entry: { url: string }) =>
                  entry.url.startsWith("webpack-internal:///") &&
                  entry.url.includes("/./src/"),
                sourceFilter: (sourcePath: string) =>
                  sourcePath.includes("src/") &&
                  !sourcePath.includes("node_modules"),
                reports: ["console-summary", "v8", "lcovonly"],
              },
            },
          ] as const,
        ]
      : []),
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: chromium },
    { name: "anonymous", testDir: "./e2e/public", use: chromium },
    {
      name: "youth",
      testDir: "./e2e/youth",
      dependencies: ["setup"],
      use: { ...chromium, storageState: storageStatePath("youth") },
    },
    {
      name: "org-admin",
      testDir: "./e2e/org-admin",
      dependencies: ["setup"],
      use: { ...chromium, storageState: storageStatePath("orgAdmin") },
    },
    {
      name: "admin",
      testDir: "./e2e/admin",
      dependencies: ["setup"],
      use: { ...chromium, storageState: storageStatePath("admin") },
    },
  ],
});
