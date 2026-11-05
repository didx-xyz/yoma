import { expect, test } from "../support/test";
import { ROUTES, USERS } from "../seed";
import { loginViaKeycloak } from "../support/auth";

test("user logs in via Keycloak and returns authenticated @smoke", async ({
  page,
}) => {
  await page.goto(ROUTES.home);
  await loginViaKeycloak(page, USERS.youth);

  // Returned to the page the login started from.
  await expect(page).toHaveURL(ROUTES.home);

  // Server-side session agrees with the UI.
  const session = await page.request.get("/api/auth/session");
  expect(session.ok()).toBe(true);
  expect(await session.json()).toMatchObject({
    user: { email: USERS.youth.email },
  });
});
