import { expect, test } from "../support/test";
import { ROUTES } from "../seed";

// A signed-in youth must be refused on every admin surface. These pages are cheap (SSR 403 →
// <Unauthorized />), so one test visits them all rather than one test per route.
const adminOnly = [
  "/admin",
  "/admin/connections",
  "/admin/skills",
  "/admin/treasury",
  ROUTES.adminOpportunities,
  "/admin/links",
  "/admin/schemas",
];

test("youth is refused on admin pages", async ({ page }) => {
  // Seven cold routes on a shared dev server; CI's production build is unaffected.
  test.slow();
  for (const route of adminOnly) {
    // First hit of each route compiles it on the dev server; don't also wait for "load".
    await page.goto(route, { waitUntil: "commit" });
    await expect(
      page.getByRole("heading", { name: "Access Restricted" }),
      route,
    ).toBeVisible({ timeout: 30_000 });
  }
});

test("youth cannot open the organisations admin area", async ({ page }) => {
  await page.goto(ROUTES.organisations);

  await expect(page.locator("#btnUserMenu")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🏢 Organisations" }),
  ).toHaveCount(0);
  await expect(page.locator("#lnkNavbarMenu_Treasury")).toHaveCount(0);
});
