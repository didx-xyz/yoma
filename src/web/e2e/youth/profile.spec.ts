import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { apiGet } from "../support/api";
import { ROUTES, USERS } from "../seed";

// Mutates the seeded youth's surname and restores it. Serial so the two tests never race on the
// same row; afterEach restores even when an assertion fails mid-way.
test.describe.configure({ mode: "serial" });

const SURNAME = "User";
// Single word: the API title-cases names ("User E2E" comes back as "User E2e").
const SURNAME_CHANGED = "Usertest";

async function saveSurname(page: Page, value: string) {
  await page.locator("#inpProfileSurname").fill(value);
  await page.locator("#btnProfileSubmit").click();
  await expect(page.getByText("Your profile has been updated")).toBeVisible();
}

test.afterEach(async ({ page }) => {
  await page.goto(ROUTES.profile);
  if ((await page.locator("#inpProfileSurname").inputValue()) !== SURNAME) {
    await saveSurname(page, SURNAME);
  }
});

test("profile is prefilled from the seeded account @smoke", async ({
  page,
}) => {
  await page.goto(ROUTES.profile);

  await expect(page).toHaveTitle("Yoma | Profile");
  await expect(page.locator("#inpProfileFirstName")).toHaveValue(
    USERS.youth.firstName,
  );
  await expect(page.locator("#inpProfileSurname")).toHaveValue(SURNAME);
  await expect(page.locator('input[name="email"]')).toHaveValue(
    USERS.youth.email,
  );
  // Seeded phone is confirmed, so it renders read-only.
  await expect(page.locator('input[name="phoneNumber"]')).toBeDisabled();
  // Profile/settings dialogs are suppressed on this route.
  await expect(page.locator("#dlgUpdateProfile")).toHaveCount(0);
});

test("surname change is saved and survives a reload", async ({ page }) => {
  await page.goto(ROUTES.profile);
  await saveSurname(page, SURNAME_CHANGED);

  await page.reload();
  await expect(page.locator("#inpProfileSurname")).toHaveValue(SURNAME_CHANGED);
  expect(await apiGet(page, "/user")).toMatchObject({
    surname: SURNAME_CHANGED,
  });
});
