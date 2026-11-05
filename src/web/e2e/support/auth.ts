import { expect, type Page } from "@playwright/test";
import path from "node:path";
import type { Role, SeedUser } from "../seed";

export const storageStatePath = (role: Role) =>
  path.join(__dirname, "..", ".auth", `${role}.json`);

/**
 * From any page of the site: click Login, complete the Keycloak form and wait until the
 * site shows the user menu. Leaves the page on the post-login callback target.
 */
export async function loginViaKeycloak(page: Page, user: SeedUser) {
  const signIn = page.locator("#btnSignIn");
  await expect(signIn).toBeVisible();
  await signIn.click();

  // next-auth redirects to the Keycloak "phone" login theme.
  await page.waitForURL(/\/realms\/yoma\/protocol\/openid-connect\/auth/);
  await page.locator("#username").fill(user.email);
  await page.locator("#password").fill(user.password);
  // Submit is Vue-bound and disabled until both fields are filled.
  const submit = page.locator("#kc-login");
  await expect(submit).toBeEnabled();
  const keycloakOrigin = new URL(page.url()).origin;
  await submit.click();

  // Back on the site. Wait for commit only; the home page's embeds can keep "load" from
  // firing for a long time on the dev server. The visibility check does the real waiting.
  await page.waitForURL((url) => url.origin !== keycloakOrigin, {
    waitUntil: "commit",
  });
  // Hydration after the callback is the slowest step on a cold dev server (and ~2x under coverage).
  await expect(page.locator("#btnUserMenu")).toBeVisible({ timeout: 30_000 });
  await expect(signIn).toHaveCount(0);
}
