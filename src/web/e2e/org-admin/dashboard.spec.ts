import { expect, test } from "../support/test";
import { ORGANISATIONS, ROUTES } from "../seed";

test("dashboard renders for the Yoma organisation with its tabs", async ({
  page,
}) => {
  await page.goto(ROUTES.orgDashboard(ORGANISATIONS.yoma.id));

  await expect(page).toHaveTitle("Yoma | Dashboard");
  for (const tab of ["Engagement", "Rewards & Skills", "Demographics"]) {
    await expect(
      page.getByRole("tab", { name: new RegExp(tab) }),
    ).toBeVisible();
  }
  // Not an admin: the ecosystem tab is admin-only.
  await expect(page.getByRole("tab", { name: /Ecosystem/ })).toHaveCount(0);
});

test("main menu lists the organisations this user administers", async ({
  page,
}) => {
  await page.goto(ROUTES.home);
  await page.locator("#btnMainMenu").click();

  await expect(page.locator("#userMenu_orgs_all")).toBeVisible();
  const yoma = page.locator(`[id="userMenu_orgs_${ORGANISATIONS.yoma.name}"]`);
  await expect(yoma).toBeVisible();
  await expect(yoma).toHaveAttribute(
    "href",
    ROUTES.orgDashboard(ORGANISATIONS.yoma.id),
  );
  await expect(
    page.locator(`[id="userMenu_orgs_${ORGANISATIONS.jobJack.name}"]`),
  ).toBeVisible();
});
