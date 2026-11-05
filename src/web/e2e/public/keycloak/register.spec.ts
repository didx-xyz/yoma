import { expect, test } from "../../support/test";
import { ROUTES, USERS } from "../../seed";
import { openKeycloakLogin } from "../../support/keycloak";

// Email registration cannot complete locally (no mail catcher: VERIFY_EMAIL fails at SMTP), so
// these cover the form's own validation and the server-side duplicate check only. The full
// phone registration lives in phone.spec.ts.

test.beforeEach(async ({ page }) => {
  await page.goto(ROUTES.home);
  await openKeycloakLogin(page);
  await page
    .locator("ul.kc-tabs a[href*='login-actions/registration']")
    .click();
  await page.waitForURL(/\/login-actions\/registration/);
});

test("password requirements are enforced client-side", async ({ page }) => {
  const submit = page.locator("#kc-form-buttons input[type='submit']");
  await page.locator("#email").fill("someone@example.com");
  await page.locator("#register-password").fill("short");
  await page.locator("#password-confirm").fill("short");
  await submit.click();
  // Still on the registration page: the client gate did not post.
  await expect(page).toHaveURL(/\/login-actions\/registration/);
  await expect(page.locator("form#kc-register-form")).toBeVisible();
});

test("registering an existing email is rejected by the server", async ({
  page,
}) => {
  await page.locator("#email").fill(USERS.youth.email);
  await page.locator("#register-password").fill(USERS.youth.password);
  await page.locator("#password-confirm").fill(USERS.youth.password);
  await page.locator("#kc-form-buttons input[type='submit']").click();

  await expect(page.getByText("Email already exists.")).toBeVisible();
  await expect(page.locator("form#kc-register-form")).toBeVisible();
});
