import { expect, test } from "../support/test";
import { ApiClient } from "../support/api";
import { createOpportunity } from "../support/opportunities";
import { ROUTES } from "../seed";

// Dev-server-only global from `lib/datadog.ts` `setupLocalTesting`: what the RUM wrapper would send.
declare global {
  interface Window {
    DD_LOCAL_EVENTS?: { name?: string; data: unknown }[];
  }
}

// "Go to opportunity" hands the youth to the partner's site in a new tab. The tab must land on the
// opportunity's link and keep no handle back to Yoma (window.opener): it is opened blank from
// Yoma's origin first, so a live opener would let the partner page script this window.
// Unsafe links (javascript:, data:, …) never navigate — `absoluteWebURL` rejects them, unit-tested
// in providerFacts.test.ts; the details page loads server-side, so e2e cannot plant one.
//
// The link is shaped like a partner auto-login (token in query and fragment). Navigation must use
// it whole; analytics must not see it — only the origin reaches Datadog / Google Analytics
// (`lib/telemetryUrl.ts`, unit-tested in telemetryUrl.test.ts). On the dev server both wrappers log
// what they would send (`window.DD_LOCAL_EVENTS`, "📈 LOCAL DEV - GA Event" console lines), so the
// token must be absent from both.
test.slow(); // the details page is the heaviest route on a cold dev server

const TOKEN = "e2e-partner-login-token-9f8e7d";
const PARTNER = `https://partner.e2e.example.com/sso/landing?ref=yoma&token=${TOKEN}#access_token=${TOKEN}`;
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

test("Go to opportunity opens the partner's link in a new tab with no way back into Yoma, and keeps the login token out of analytics", async ({
  page,
  context,
}) => {
  // Keep the partner site off the network: CI must not depend on (or hit) a real host.
  await context.route(
    (url) => url.hostname === new URL(PARTNER).hostname,
    (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>Partner</h1>" }),
  );

  const consoleLines: string[] = [];
  page.on("console", (message) => consoleLines.push(message.text()));

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

  // Datadog wrapper: the click is recorded with the partner's origin and nothing else of the URL.
  // (Recorded only when this youth has consented to RUM; the token check below holds either way.)
  const ddEvents = await page.evaluate(
    (): { name?: string; data: unknown }[] =>
      "DD_LOCAL_EVENTS" in window && Array.isArray(window.DD_LOCAL_EVENTS)
        ? window.DD_LOCAL_EVENTS
        : [],
  );
  const clicked = ddEvents.filter(
    (e) => e.name === "opportunity_external_link_clicked",
  );
  for (const event of clicked)
    expect(event.data).toMatchObject({
      externalOrigin: new URL(PARTNER).origin,
    });
  expect(JSON.stringify(ddEvents)).not.toContain(TOKEN);

  // Google Analytics wrapper (and anything else the page logged): no token anywhere.
  const gaLines = consoleLines.filter((line) => line.includes("GA Event"));
  for (const line of gaLines) expect(line).toContain(new URL(PARTNER).origin);
  expect(consoleLines.join("\n")).not.toContain(TOKEN);
});
