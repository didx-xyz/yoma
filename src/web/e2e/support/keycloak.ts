import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { KEYCLOAK } from "../seed";

// Browser-side global the Keycloak theme loads (resources/js/intlTelInput.min.js), read inside
// page.evaluate. Only the members the helper below touches are declared.
declare global {
  interface Window {
    intlTelInput?: {
      getInstance(el: Element): { promise: Promise<unknown> } | null;
    };
  }
}

/**
 * Minimal Keycloak admin REST client for test setup/teardown. Used only to remove throw-away
 * users and to reset brute-force counters so runs stay independent of each other.
 */
export class KeycloakAdmin {
  private token?: string;

  constructor(private readonly request: APIRequestContext) {}

  private async headers() {
    if (!this.token) {
      const res = await this.request.post(
        `${KEYCLOAK.url}/realms/master/protocol/openid-connect/token`,
        {
          form: {
            grant_type: "password",
            client_id: "admin-cli",
            username: KEYCLOAK.admin.username,
            password: KEYCLOAK.admin.password,
          },
        },
      );
      expect(res.ok(), "Keycloak admin token").toBe(true);
      this.token = (await res.json()).access_token;
    }
    return { Authorization: `Bearer ${this.token}` };
  }

  private get base() {
    return `${KEYCLOAK.url}/admin/realms/${KEYCLOAK.realm}`;
  }

  async findUsers(query: Record<string, string>): Promise<{ id: string }[]> {
    const res = await this.request.get(`${this.base}/users`, {
      headers: await this.headers(),
      params: { ...query, exact: "true" },
    });
    expect(res.ok(), "Keycloak user search").toBe(true);
    return res.json();
  }

  async deleteUsersByPhone(phoneNumber: string) {
    for (const user of await this.findUsers({
      q: `phoneNumber:${phoneNumber}`,
    })) {
      const res = await this.request.delete(`${this.base}/users/${user.id}`, {
        headers: await this.headers(),
      });
      expect(res.ok(), "Keycloak user delete").toBe(true);
    }
  }

  /** Clears the realm's brute-force failure counter for a user (wrong-password tests). */
  async clearBruteForce(email: string) {
    for (const user of await this.findUsers({ email })) {
      const res = await this.request.delete(
        `${this.base}/attack-detection/brute-force/users/${user.id}`,
        { headers: await this.headers() },
      );
      expect(res.ok(), "Keycloak brute-force reset").toBe(true);
    }
  }
}

/** From any page of the site: click Login and wait for the Keycloak form. */
export async function openKeycloakLogin(page: Page) {
  // Toasts (e.g. the referral reminder) overlay the navbar's right side where the button sits.
  for (const close of await page.locator(".Toastify__close-button").all()) {
    await close.click();
  }
  await page.locator("#btnSignIn").click();
  await page.waitForURL(/\/realms\/yoma\/protocol\/openid-connect\/auth/);
  await expect(page.locator("#kc-login")).toBeAttached();
}

/** On the Keycloak page: request an OTP for the phone number and wait for the code input. */
export async function requestOtp(page: Page, phoneNumber: string) {
  const input = page.locator("#phoneNumber");
  await expect(input).toBeVisible();
  // intl-tel-input (theme/.../intlTelInputDirective.js) loads its validation utils from a CDN
  // and resolves the initial country via a geo-IP lookup; `promise` settles when both are done.
  // Typing before that leaves the number unvalidated ("Phone number is invalid").
  await input.evaluate((el) =>
    window.intlTelInput?.getInstance(el)?.promise.catch(() => undefined),
  );
  await input.click();
  await input.pressSequentially(phoneNumber);
  await page.locator('input[type="button"][value="Send OTP"]').click();
  // The provider caps sends per number: 3 per code type per hour (DefaultPhoneProvider
  // targetHourMaximum). Name that cause instead of reporting "#code not visible".
  const limit = page.getByText(/maximum \(\d+\) OTPs/).first();
  await expect(page.locator("#code").or(limit).first()).toBeVisible();
  if (await limit.isVisible()) {
    throw new Error(
      `Keycloak OTP hourly limit reached for ${phoneNumber}: ${await limit.innerText()} ` +
        "(3 sends per code type per hour; wait or `docker compose down -v`).",
    );
  }
  await expect(page.locator("#code")).toBeVisible();
}
