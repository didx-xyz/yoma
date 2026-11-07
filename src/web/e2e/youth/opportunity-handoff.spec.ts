import { expect, test } from "../support/test";
import { ApiClient } from "../support/api";
import { createOpportunity } from "../support/opportunities";
import { ROUTES } from "../seed";

// "Go to opportunity" hands the youth to the partner's site in a new tab. The tab must land on the
// opportunity's link and keep no handle back to Yoma (window.opener): it is opened blank from
// Yoma's origin first, so a live opener would let the partner page script this window.
// Unsafe links (javascript:, data:, …) never navigate — `absoluteWebURL` rejects them, unit-tested
// in providerFacts.test.ts; the details page loads server-side, so e2e cannot plant one.
test.slow(); // the details page is the heaviest route on a cold dev server

const PARTNER = "https://partner.e2e.example.com/landing?ref=yoma";
let api: ApiClient;
let opportunityId: string;

test.beforeAll(async ({ baseURL }) => {
  api = await ApiClient.forRole("orgAdmin", baseURL!);
  opportunityId = await createOpportunity(
    api,
    "Learning",
    `E2E ${Date.now().toString(36)} partner hand-off`,
    { url: PARTNER },
  );
});

test.afterAll(async () => {
  await api
    .patch(`/opportunity/${opportunityId}/Deleted`)
    .catch(() => undefined);
  await api.dispose();
});

test("Go to opportunity opens the partner's link in a new tab with no way back into Yoma", async ({
  page,
  context,
}) => {
  // Keep the partner site off the network: CI must not depend on (or hit) a real host.
  await context.route(
    (url) => url.hostname === new URL(PARTNER).hostname,
    (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>Partner</h1>" }),
  );

  await page.goto(ROUTES.opportunity(opportunityId));
  const popup = page.waitForEvent("popup");
  await page.locator("#btnOpportunityGoTo").click();

  // The "leaving Yoma" notice shows unless this youth ticked "do not show again" earlier.
  const proceed = page.getByRole("button", { name: "Proceed" });
  const tab = await Promise.race([
    popup,
    proceed.waitFor().then(async () => {
      await proceed.click();
      return popup;
    }),
  ]);

  await expect(tab).toHaveURL(PARTNER);
  await expect(tab.getByRole("heading", { name: "Partner" })).toBeVisible();
  expect(await tab.evaluate(() => window.opener)).toBeNull();
});
