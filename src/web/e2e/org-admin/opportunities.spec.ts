import { expect, test } from "../support/test";
import { FIXTURES, ORGANISATIONS, ROUTES } from "../seed";

test("organisation admin sees the Yoma organisation's opportunities @smoke", async ({
  page,
}) => {
  // Filter by title: the unfiltered list is ordered by last change, so other tests can push
  // the fixture off page 1.
  await page.goto(
    `${ROUTES.orgOpportunities(ORGANISATIONS.yoma.id)}?query=${encodeURIComponent(FIXTURES.job01)}`,
  );

  await expect(
    page.getByRole("heading", { name: /🏆 Opportunities/ }),
  ).toBeVisible();
  // Navbar switched to the organisation view.
  await expect(page.locator("#lnkNavbarMenu_Submissions")).toBeVisible();
  await expect(page.locator("#userMenu_admin")).toHaveCount(0);
  // Seeded fixtures belong to this organisation; each row's title links to the opportunity.
  await expect(
    page.getByRole("link", { name: FIXTURES.job01, exact: true }),
  ).toBeVisible();
});
