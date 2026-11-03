import { expect, test } from "../support/test";
import { ORGANISATIONS, ROUTES } from "../seed";

test("admin sees every organisation with admin navigation @smoke", async ({
  page,
}) => {
  await page.goto(ROUTES.organisations);

  await expect(
    page.getByRole("heading", { name: "🏢 Organisations" }),
  ).toBeVisible();
  // Admin-only navigation.
  await expect(page.locator("#lnkNavbarMenu_Treasury")).toBeVisible();
  // Partner organisations are seeded with fixed ids in every environment.
  await expect(
    page.locator("#results").getByText(ORGANISATIONS.jobJack.name, {
      exact: true,
    }),
  ).toBeVisible();
});
