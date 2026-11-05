import { expect, test as setup } from "@playwright/test";
import { ROUTES, USERS, type Role } from "./seed";
import { loginViaKeycloak, storageStatePath } from "./support/auth";

// Signs in once per role through the real Keycloak form and saves the browser state
// (next-auth session cookie) to e2e/.auth/<role>.json. The role projects in
// playwright.config.ts load that state so their tests start authenticated.
for (const role of Object.keys(USERS) as Role[]) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const user = USERS[role];
    await page.goto(ROUTES.home);
    await loginViaKeycloak(page, user);

    const session = await page.request.get("/api/auth/session");
    expect(session.ok()).toBe(true);
    const body = await session.json();
    expect(body).toMatchObject({ user: { email: user.email } });
    expect(body.user.roles).toEqual(expect.arrayContaining(user.roles));

    await page.context().storageState({ path: storageStatePath(role) });
  });
}
