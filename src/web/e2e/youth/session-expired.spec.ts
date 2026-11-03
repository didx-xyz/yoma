import { expect, test } from "../support/test";
import { ROUTES } from "../seed";

// Real expiry needs the Keycloak session revoked plus the 300 s access token to lapse, so the
// refresh failure next-auth reports (server/auth.ts refreshAccessToken → error:
// "RefreshAccessTokenError") is injected into the session response instead. What is under
// test is the site's reaction: the blocking "Session Expired" dialog with a re-login button.
test("a failed token refresh shows the Session Expired dialog", async ({
  page,
}) => {
  await page.route("**/api/auth/session", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({
      response,
      json: { ...body, error: "RefreshAccessTokenError" },
    });
  });

  await page.goto(ROUTES.home);

  await expect(page.getByText("Session Expired")).toBeVisible();
  await expect(page.locator("#btnSignIn_sessionExpired")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Stay logged out" }),
  ).toBeVisible();
});
