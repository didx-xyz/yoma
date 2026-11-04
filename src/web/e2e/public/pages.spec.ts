import { expect, test } from "../support/test";
import { ROUTES } from "../seed";

test("about page", async ({ page }) => {
  await page.goto(ROUTES.about);
  await expect(page).toHaveTitle("Yoma | About Us");
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
    "digital marketplace",
  );
});

test("terms page switches between terms and privacy", async ({ page }) => {
  await page.goto(ROUTES.terms);
  await expect(page).toHaveTitle("Yoma - Terms of Service & Privacy Policy");
  await page.locator("#btnTermsTab_privacy").click();
  await expect(page).toHaveURL(/tab=privacy/);
  await page.locator("#btnTermsTab_terms").click();
  await expect(page).toHaveURL(/tab=terms/);
});

test("unknown route shows the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Page Not Found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Take me home" }),
  ).toHaveAttribute("href", "/");
});

test("marketplace asks for a country and routes to it", async ({ page }) => {
  await page.goto(ROUTES.marketplace);
  await expect(
    page.getByRole("heading", { name: "What is your Country?" }),
  ).toBeVisible();
  await expect(page.locator("#letsGoButton")).toBeDisabled();

  await page.locator("#input_country").fill("South Africa");
  await page.keyboard.press("Enter");
  await expect(page.locator("#letsGoButton")).toBeEnabled();
  await page.locator("#letsGoButton").click();
  await page.waitForURL(/\/marketplace\/[a-z]{2}$/i, { timeout: 30_000 });
});
