import { expect, test } from "../support/test";
import { FIXTURES, ROUTES, USERS } from "../seed";

test("Yo-ID greets the signed-in youth by first name", async ({ page }) => {
  await page.goto(ROUTES.yoid);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: new RegExp(`Good \\w+, ${USERS.youth.firstName}`),
    }),
  ).toBeVisible();
  // pages/yoid/index.tsx renders one <section id=…> per tab.
  for (const id of ["wallet", "passport", "opportunities", "skills"]) {
    await expect(page.locator(`section#${id}`)).toBeVisible();
  }
});

test("discovery search finds a seeded fixture by title", async ({ page }) => {
  await page.goto(`${ROUTES.discover}?q=${encodeURIComponent(FIXTURES.job01)}`);

  await expect(
    page.getByRole("heading", { level: 3, name: FIXTURES.job01, exact: true }),
  ).toBeVisible();
});

test("youth cannot open the organisations admin area", async ({ page }) => {
  await page.goto(ROUTES.organisations);

  await expect(page.locator("#btnUserMenu")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🏢 Organisations" }),
  ).toHaveCount(0);
  await expect(page.locator("#lnkNavbarMenu_Treasury")).toHaveCount(0);
});
