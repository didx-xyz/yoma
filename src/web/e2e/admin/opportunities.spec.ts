import { expect, test } from "../support/test";
import { FIXTURES, ROUTES } from "../seed";

test("admin opportunities list includes the seeded fixtures", async ({
  page,
}) => {
  await page.goto(
    `${ROUTES.adminOpportunities}?query=${encodeURIComponent(FIXTURES.job01)}`,
  );

  await expect(page).toHaveTitle("Yoma | Opportunities");
  await expect(
    page
      .locator("#results")
      .getByRole("link", { name: FIXTURES.job01, exact: true }),
  ).toBeVisible();
});

test("treasury page renders its tabs and the manage form", async ({ page }) => {
  await page.goto(ROUTES.adminTreasury);

  await expect(page).toHaveTitle("Yoma | Treasury");
  await expect(page.getByRole("heading", { name: /Treasury/ })).toBeVisible();
  await page.getByRole("tab", { name: "Manage" }).click();
  await expect(page.locator("#btnTreasurySave")).toBeVisible();
});
