import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { FIXTURES, ROUTES } from "../seed";

// Both tests touch the same fixture's saved state → serial. The details route is the heaviest
// page in the app; its first compile on the dev server can exceed a minute, hence slow().
test.describe.configure({ mode: "serial" });
test.slow();

// Fixture ids are random per seed, so the details page is reached through search by title.
async function openFixture(page: Page, title: string) {
  await page.goto(`${ROUTES.discover}?q=${encodeURIComponent(title)}`);
  // The search returns exactly this fixture; its CTA is the only /opportunities/<uuid> link
  // (the navbar's hidden drawer also links to /opportunities/discover, so exclude that).
  await expect(
    page.getByRole("heading", { level: 3, name: title, exact: true }),
  ).toBeVisible();
  await page
    .locator('a[href^="/opportunities/"]:not([href*="/discover"])')
    .first()
    .click();
  await page.waitForURL(/\/opportunities\/[0-9a-f-]{36}/, { timeout: 120_000 });
  await expect(
    page.getByRole("heading", { level: 4, name: title }),
  ).toBeVisible();
}

test("details page shows the fixture with its call to action", async ({
  page,
}) => {
  await openFixture(page, FIXTURES.job02);
  await expect(page.locator("#btnOpportunityGoTo")).toBeVisible();
  await expect(page.locator("#btnOpportunitySave")).toBeEnabled();
});

test("save and unsave an opportunity", async ({ page }) => {
  await openFixture(page, FIXTURES.job02);
  const save = page.locator("#btnOpportunitySave");

  // Start from a known state whatever a previous run left behind.
  if ((await save.getAttribute("aria-label")) === "Saved") {
    await save.click();
    await expect(
      page.getByText("Opportunity removed from saved"),
    ).toBeVisible();
  }

  await save.click();
  await expect(page.getByText("Opportunity saved")).toBeVisible();
  await expect(save).toHaveAttribute("aria-label", "Saved");

  await page.goto(ROUTES.yoidSaved);
  await expect(
    page.getByRole("heading", { level: 3, name: FIXTURES.job02, exact: true }),
  ).toBeVisible();

  await openFixture(page, FIXTURES.job02);
  await save.click();
  await expect(page.getByText("Opportunity removed from saved")).toBeVisible();
  await expect(save).toHaveAttribute("aria-label", "Save");
});
