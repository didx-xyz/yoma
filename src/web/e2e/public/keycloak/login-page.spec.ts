import { expect, test } from "../../support/test";
import { KEYCLOAK, ROUTES, USERS } from "../../seed";
import { KeycloakAdmin, openKeycloakLogin } from "../../support/keycloak";

// The custom "phone" login theme (src/keycloak/.../theme/phone/login/login.ftl). These checks
// are what an SRE runs after a Keycloak upgrade: the theme still renders on the new base theme,
// the phone authenticator still injects its block, errors still land in the right place.

test.beforeEach(async ({ page }) => {
  await page.goto(ROUTES.home);
  await openKeycloakLogin(page);
});

test("renders the login form with tabs, password login and OTP option", async ({
  page,
}) => {
  await expect(page.locator("form#kc-form-login")).toBeVisible();
  await expect(page.locator("ul.kc-tabs li.active")).toHaveText(/Login/);
  await expect(
    page.locator("ul.kc-tabs a[href*='login-actions/registration']"),
  ).toHaveText(/Register/);

  await expect(page.locator("#username")).toHaveAttribute(
    "placeholder",
    "Enter email or phone number",
  );
  await expect(page.locator("#password")).toHaveAttribute(
    "placeholder",
    "Enter password",
  );
  await expect(page.locator("#kc-login")).toBeDisabled();
  await expect(
    page.locator("a[href*='login-actions/reset-credentials']"),
  ).toHaveText("Forgot password?");
  await expect(
    page.getByRole("button", { name: "Login with OTP" }),
  ).toBeVisible();
  await expect(page.locator("#social-google")).toBeVisible();
  await expect(page.locator("#social-facebook")).toBeVisible();
  await expect(page.locator("a#terms-text")).toHaveAttribute(
    "href",
    "https://yoma.world/terms",
  );
});

test("submit enables only once both fields are filled", async ({ page }) => {
  const submit = page.locator("#kc-login");
  await page.locator("#username").fill(USERS.youth.email);
  await expect(submit).toBeDisabled();
  await page.locator("#password").fill("x");
  await expect(submit).toBeEnabled();
});

test("Login with OTP switches to the phone form and back", async ({ page }) => {
  await page.getByRole("button", { name: "Login with OTP" }).click();
  await expect(page.locator("#username")).toHaveCount(0);
  await expect(page.locator("#phoneNumber")).toBeVisible();
  await expect(
    page.locator('input[type="button"][value="Send OTP"]'),
  ).toBeVisible();

  await page.getByRole("button", { name: "Login with Password" }).click();
  await expect(page.locator("#username")).toBeVisible();
  await expect(page.locator("#phoneNumber")).toBeHidden();
});

test("Register tab opens the registration form", async ({ page }) => {
  await page
    .locator("ul.kc-tabs a[href*='login-actions/registration']")
    .click();
  await page.waitForURL(/\/login-actions\/registration/);
  await expect(page.locator("form#kc-register-form")).toBeVisible();
  await expect(page.locator("#email")).toBeVisible();
  await expect(page.locator("#register-password")).toBeVisible();
  await expect(page.locator("#password-confirm")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use phone number to register" }),
  ).toBeVisible();
});

test("Forgot password opens the reset form", async ({ page }) => {
  await page.locator("a[href*='login-actions/reset-credentials']").click();
  await page.waitForURL(/\/login-actions\/reset-credentials/);
  await expect(page.locator("form#kc-reset-password-form")).toBeVisible();
  await expect(page.locator("#kc-page-title")).toHaveText("Forgot password?");
  await expect(page.locator("#username")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use Phone to reset your account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Go back to Login" }),
  ).toBeVisible();
});

test("wrong password shows the invalid credentials error", async ({ page }) => {
  await page.locator("#username").fill(USERS.youth.email);
  await page.locator("#password").fill("definitely-not-the-password");
  await page.locator("#kc-login").click();

  await page.waitForURL(/\/login-actions\/authenticate/);
  await expect(page.locator("span#input-error")).toHaveText(
    "Invalid username or password.",
  );
  await expect(page.locator("#username")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test.afterAll(async ({ request }) => {
  // One failed attempt per run counts toward the realm's 30-failure lockout; reset it.
  await new KeycloakAdmin(request).clearBruteForce(USERS.youth.email);
});

test("the site's language is passed to Keycloak (ui_locales)", async ({
  page,
}) => {
  // Back on the site: switch to French via the navbar language switcher (sets the Google
  // Translate cookie and reloads), then open Login. handleUserSignIn sends ui_locales=fr.
  // (kc_locale on the auth URL is not honoured by this realm; ui_locales is the product path.)
  await page.goto(ROUTES.home);
  // Navbar and drawer both render the switcher; the drawer's is hidden.
  await page.locator("select[title='Language']:visible").selectOption("fr");
  await page.waitForLoadState("domcontentloaded");
  await openKeycloakLogin(page);

  await expect(page.locator("#kc-login")).toHaveValue("Se connecter");
  await expect(page.locator("ul.kc-tabs li.active")).toHaveText(/Se connecter/);
  await expect(page.locator("#username")).toHaveAttribute(
    "placeholder",
    "Entrez votre adresse e-mail ou votre numéro de téléphone",
  );
  await expect(
    page.getByRole("button", { name: "Se connecter avec OTP" }),
  ).toBeVisible();
  expect(KEYCLOAK.locales).toContain("fr");
});
