import { expect, test } from "../../support/test";
import { KEYCLOAK, ROUTES } from "../../seed";
import {
  KeycloakAdmin,
  openKeycloakLogin,
  requestOtp,
} from "../../support/keycloak";

// Exercises the phone provider SPI end to end on the configured test number: register with
// phone, log in with OTP, reset the password with OTP. Serial: each step needs the previous
// one's state. The user is removed before and after so the run is repeatable.
//
// Abuse limits (DefaultPhoneProvider): one send per code type while an unused code is live (5 min)
// and three per hour for this number — so at most three runs of this file per hour.

const PASSWORD_1 = "E2ePassw0rd!a";
const PASSWORD_2 = "E2ePassw0rd!b";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  await new KeycloakAdmin(request).deleteUsersByPhone(KEYCLOAK.testPhone);
});

test.afterAll(async ({ request }) => {
  await new KeycloakAdmin(request).deleteUsersByPhone(KEYCLOAK.testPhone);
});

test("registers a new user with a phone number and OTP", async ({ page }) => {
  await page.goto(ROUTES.home);
  await openKeycloakLogin(page);
  await page
    .locator("ul.kc-tabs a[href*='login-actions/registration']")
    .click();
  await page.waitForURL(/\/login-actions\/registration/);

  await page
    .getByRole("button", { name: "Use phone number to register" })
    .click();
  await requestOtp(page, KEYCLOAK.testPhone);
  await page.locator("#code").fill(KEYCLOAK.testOtp);
  await page.locator('input[type="button"][value="Confirm code"]').click();
  await expect(page.locator("div.pf-c-alert.pf-m-success")).toContainText(
    "has been verified",
  );

  await page.locator("#register-password").fill(PASSWORD_1);
  await page.locator("#password-confirm").fill(PASSWORD_1);
  await page.locator("#kc-form-buttons input[type='submit']").click();

  // No email on the account, so VERIFY_EMAIL is skipped and we land back on the site signed in.
  await expect(page.locator("#btnUserMenu")).toBeVisible({ timeout: 30_000 });
});

test("logs in with phone number and OTP; rejects a wrong code", async ({
  page,
}) => {
  await page.goto(ROUTES.home);
  await openKeycloakLogin(page);
  await page.getByRole("button", { name: "Login with OTP" }).click();
  await requestOtp(page, KEYCLOAK.testPhone);

  await page.locator("#code").fill("0000");
  await page.locator("#kc-login").click();
  await expect(page.locator("#input-error-code")).toBeVisible();

  // Same OTP is still valid; the retry re-renders the form with the phone block active.
  await page.locator("#code").fill(KEYCLOAK.testOtp);
  await page.locator("#kc-login").click();
  await expect(page.locator("#btnUserMenu")).toBeVisible({ timeout: 30_000 });
});

test("resets the password with phone OTP and logs in with the new one", async ({
  page,
}) => {
  await page.goto(ROUTES.home);
  await openKeycloakLogin(page);
  await page.locator("a[href*='login-actions/reset-credentials']").click();
  await page.waitForURL(/\/login-actions\/reset-credentials/);

  await page
    .getByRole("button", { name: "Use Phone to reset your account" })
    .click();
  await requestOtp(page, KEYCLOAK.testPhone);
  await page.locator("#code").fill(KEYCLOAK.testOtp);
  await page.locator("#kc-form-buttons input[type='submit']").click();

  await expect(page.locator("form#kc-passwd-update-form")).toBeVisible();
  await page.locator("#password-new").fill(PASSWORD_2);
  await page.locator("#password-confirm").fill(PASSWORD_2);
  await page.locator("#kc-form-buttons input[type='submit']").click();
  await expect(page.locator("#btnUserMenu")).toBeVisible({ timeout: 30_000 });

  // The new password works through the ordinary form. Fresh cookies instead of the UI logout:
  // this phone-only account has no profile, so the "Complete your profile" dialog covers the
  // navbar until it is filled in.
  await page.context().clearCookies();
  await page.goto(ROUTES.home);
  await openKeycloakLogin(page);
  await page.locator("#username").fill(KEYCLOAK.testPhone);
  await page.locator("#password").fill(PASSWORD_2);
  await page.locator("#kc-login").click();
  await expect(page.locator("#btnUserMenu")).toBeVisible({ timeout: 30_000 });
});
