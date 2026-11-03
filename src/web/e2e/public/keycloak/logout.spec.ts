import { expect, test } from "../../support/test";
import { ROUTES, USERS } from "../../seed";
import { loginViaKeycloak } from "../../support/auth";
import { openKeycloakLogin } from "../../support/keycloak";

test("logout ends both the site session and the Keycloak SSO session", async ({
  page,
}) => {
  await page.goto(ROUTES.home);
  await loginViaKeycloak(page, USERS.youth);

  await page.locator("#btnUserMenu").click();
  await page.locator("#btnSignOut").click();

  // Site session gone.
  await expect(page.locator("#btnSignIn")).toBeVisible({ timeout: 30_000 });
  expect(await (await page.request.get("/api/auth/session")).json()).toEqual(
    {},
  );

  // Keycloak session gone too: next-auth's signOut event posts the refresh token to the
  // realm logout endpoint, so Login must show the credentials form, not silently SSO in.
  await openKeycloakLogin(page);
  await expect(page.locator("#username")).toBeVisible();
});
