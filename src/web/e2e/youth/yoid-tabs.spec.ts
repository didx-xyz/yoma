import { expect, test } from "../support/test";
import { FIXTURES, ROUTES } from "../seed";

// The Yo-ID layout owns <title> ("Yoma | Yo-ID"), so tabs are asserted on their own content.

test("completed opportunities list the seeded placement", async ({ page }) => {
  await page.goto(ROUTES.yoidCompleted);
  await expect(page).toHaveTitle("Yoma | Completed Opportunities");
  await expect(
    page.getByRole("heading", { level: 3, name: FIXTURES.job01, exact: true }),
  ).toBeVisible();
});

test("pending opportunities list the seeded verification", async ({ page }) => {
  // The list is ordered by last change and has no title search; the API re-stamps pending rows,
  // so the fixture can sit on any page. Walk pages until it shows (seed has ~30 pending rows).
  const heading = page.getByRole("heading", {
    level: 3,
    name: FIXTURES.event04,
    exact: true,
  });
  for (let pageNo = 1; pageNo <= 6; pageNo++) {
    await page.goto(`${ROUTES.yoidPending}?page=${pageNo}`);
    await expect(page).toHaveTitle("Yoma | Pending Opportunities");
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
    if (await heading.isVisible()) return;
  }
  throw new Error(`${FIXTURES.event04} not found in the first 6 pending pages`);
});

test("skills tab lists the seeded verified skills", async ({ page }) => {
  await page.goto(ROUTES.yoidSkills);
  await expect(page.getByText("Skills you've earned")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No skills yet" }),
  ).toHaveCount(0);
});

test("passport, wallet and saved tabs render", async ({ page }) => {
  // Three cold routes on a shared dev server; CI's production build is unaffected.
  test.slow();
  await page.goto(ROUTES.yoidPassport);
  await expect(
    page
      .getByRole("group", { name: "Filter by credential type" })
      .or(page.getByRole("heading", { name: "No credentials yet" })),
  ).toBeVisible();

  await page.goto(ROUTES.yoidWallet);
  // Locally the wallet stays "still being set up" (no SSI/Zlto backends), so the balance card
  // is absent; the products section is the stable marker.
  await expect(page.locator("#wallet-products-heading")).toBeVisible();

  await page.goto(ROUTES.yoidSaved);
  await expect(page).toHaveTitle("Yoma | Saved Opportunities");
});
