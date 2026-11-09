import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { FIXTURES, ROUTES } from "../seed";

// The Yo-ID layout owns <title> ("Yoma | Yo-ID"), so tabs are asserted on their own content.

/** The Yo-ID lists are ordered by last change with no title search; walk pages for a title. */
async function findOnPages(
  page: Page,
  route: string,
  title: string,
  pages = 8,
) {
  const heading = page.getByRole("heading", {
    level: 3,
    name: title,
    exact: true,
  });
  for (let pageNo = 1; pageNo <= pages; pageNo++) {
    await page.goto(`${route}?page=${pageNo}`);
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
    if (await heading.isVisible()) return;
  }
  throw new Error(`${title} not found in the first ${pages} pages of ${route}`);
}

test("completed opportunities list the seeded placement", async ({ page }) => {
  // Newer completions (e.g. the lifecycle flow's) push the seeded one down the list.
  await findOnPages(page, ROUTES.yoidCompleted, FIXTURES.job01);
  await expect(page).toHaveTitle("Yoma | Completed Opportunities");
});

test("pending opportunities list the seeded verification", async ({ page }) => {
  await findOnPages(page, ROUTES.yoidPending, FIXTURES.event04);
  await expect(page).toHaveTitle("Yoma | Pending Opportunities");
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
  // Three valid renderings: credentials, none yet, or SSI switched off for the environment
  // (YOMA_SSI_ENABLED_ENVIRONMENTS=None — the CI stack and any local run without didx:me).
  await expect(
    page
      .getByRole("group", { name: "Filter by credential type" })
      .or(page.getByRole("heading", { name: "No credentials yet" }))
      .or(page.getByText("SSI is disabled for this environment")),
  ).toBeVisible();

  await page.goto(ROUTES.yoidWallet);
  // Locally the wallet stays "still being set up" (no SSI/Zlto backends), so the balance card
  // is absent; the products section is the stable marker.
  await expect(page.locator("#wallet-products-heading")).toBeVisible();

  await page.goto(ROUTES.yoidSaved);
  await expect(page).toHaveTitle("Yoma | Saved Opportunities");
});
