import { test as base } from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";

export { expect } from "@playwright/test";
// Every spec imports `test` from here. With E2E_COVERAGE=1 the fixture records V8 JS coverage
// of the scripts Chromium executed during the test and hands it to monocart-reporter, which
// maps it back to src/ through source maps (see playwright.config.ts). The dev server uses
// eval-source-map, so each module is an eval'd script with a `webpack-internal:///` sourceURL
// and an inline source map; `reportAnonymousScripts` is what makes those visible.
// Without the flag it is a plain Playwright `test`.
const coverageEnabled = process.env.E2E_COVERAGE === "1";

export const test = base.extend<{ coverage: void; quietUi: void }>({
  // Client-only prompts that would otherwise overlay the page under test (components/Global.tsx,
  // lib/store.tsx atomWithStorage keys): the RUM consent dialog for anonymous visitors and the
  // referee referral toast. Answered up front so tests never have to dismiss them.
  quietUi: [
    async ({ context }, use) => {
      await context.addInitScript(() => {
        localStorage.setItem("rumConsent", "false");
        localStorage.setItem("hasShownRefereePendingToast", "true");
      });
      await use();
    },
    { auto: true },
  ],
  coverage: [
    async ({ page }, use, testInfo) => {
      if (!coverageEnabled) {
        await use();
        return;
      }
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
        reportAnonymousScripts: true,
      });
      await use();
      const entries = await page.coverage.stopJSCoverage();
      await addCoverageReport(entries, testInfo);
    },
    { auto: true },
  ],
});
