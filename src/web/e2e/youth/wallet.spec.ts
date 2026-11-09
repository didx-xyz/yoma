import type { Page, Request } from "@playwright/test";
import { expect, test } from "../support/test";
import { apiGet, apiPath, fulfillJson } from "../support/api";
import { CASH_OUT, ROUTES } from "../seed";

// Yo-ID wallet: the ZLTO ledger and the Cash Out flow (YOM-1051).
//
// No ZLTO wallet backend or payout provider runs locally or in CI, so the seeded youth's wallet
// is never `Created` and has nothing available (known-gaps.md). Each test therefore rewrites the
// `zlto` (and where needed `payout`) block of the browser's `GET /user` on top of the real
// response; everything else on the profile stays real. What stays real per test is called out in
// its title or comments: the kill-switch flag, the Treasury conversion preview and the
// initiation refusal all come from the running API. Provider-side steps (session, outcome,
// cancel) are stubbed responses — those tests prove the UI's state machine, not the integration.
// Nothing here writes to the database.

// Routes go on the browser context, not the page: once the PWA service worker controls the page
// it makes the API calls itself, and only context routes see those. (Blocking the worker instead
// trips workbox-window into a dev-overlay error that covers the page.)

type Json = Record<string, unknown>;

const AVAILABLE = 500;
const PAYOUT_ID = "0f5b7c1e-2a8d-4e7b-9c3f-6d1e2a4b5c6d";
// .invalid never resolves; the route answers before DNS.
const PAYMENT_URL = "https://partner.e2e.invalid/checkout#session=e2e";
const WALLET_URL = "https://wallet.e2e.invalid/";
// Stubbed conversions use a round rate so estimates are easy to read; the real one is 57.
const STUB_RATE = 50;

/** A wallet that passes every client-side eligibility check. */
const ELIGIBLE_ZLTO: Json = {
  walletCreationStatus: "Created",
  balance: AVAILABLE,
  available: AVAILABLE,
  pendingRewards: 0,
  pendingPayout: 0,
  total: AVAILABLE,
  zltoOffline: null,
};

/** New cash outs on, the youth's country supported, nothing in flight. */
const ENABLED_PAYOUT: Json = {
  enabled: true,
  countryAvailability: {
    supported: true,
    offline: false,
    minimumAmount: null,
    currency: null,
  },
  walletAvailable: false,
  walletUrl: null,
  active: false,
  status: null,
  canResume: false,
  amount: null,
  currency: null,
  dateCreated: null,
};

/**
 * Overlay `GET /user` — real response, with `zlto` / `payout` / top-level fields replaced. A
 * function so a test can change the wallet mid-journey (e.g. after a cancellation).
 */
async function overlayProfile(
  page: Page,
  overlay: () => { zlto?: Json; payout?: Json; profile?: Json },
) {
  await page.context().route(apiPath("/user"), async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const response = await route.fetch();
    const real = (await response.json()) as Json;
    const { zlto, payout, profile } = overlay();
    await route.fulfill({
      response,
      json: {
        ...real,
        ...profile,
        zlto: { ...(real.zlto as Json), ...zlto },
        payout: { ...(real.payout as Json), ...payout },
      },
    });
  });
  // A `Created` wallet makes the page list vouchers, which the real API refuses for this youth.
  await page
    .context()
    .route(apiPath("/marketplace/voucher/search"), (route) =>
      route.request().method() === "POST"
        ? fulfillJson(route, { items: [] })
        : route.fallback(),
    );
}

/** Stub the conversion preview: funds available, `STUB_RATE` ZLTO per USD. */
async function stubConversion(page: Page) {
  await page
    .context()
    .route(apiPath("/treasury/conversion/zlto-usd"), (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const amount = Number(
        new URL(route.request().url()).searchParams.get("amount"),
      );
      return fulfillJson(route, {
        amount: Math.round((amount / STUB_RATE) * 100) / 100,
        currency: "USD",
        conversionRateZltoPerUsd: STUB_RATE,
        treasuryFundsAvailable: true,
      });
    });
}

const ledgerValue = (page: Page, label: string) =>
  page
    .locator("#section-wallet-balance-body dl > div")
    .filter({ has: page.locator("dt", { hasText: new RegExp(`^${label}$`) }) })
    .locator("dd");

const dialog = (page: Page) => page.locator("#custom-modal-content");

const heading = (page: Page, name: string) =>
  dialog(page).getByRole("heading", { name, exact: true });

/** Open the dialog from the wallet card and enter an amount. */
async function enterAmount(page: Page, amount: number) {
  await page.locator("#btnCashOut_wallet").click();
  await expect(heading(page, "Cash Out")).toBeVisible();
  await page.locator("#cash-out-amount").fill(String(amount));
}

test("Cash Out is hidden while the server has new cash outs switched off @smoke", async ({
  page,
}) => {
  // Real `payout` block: the local API is outside PayoutEnabledEnvironments.
  await overlayProfile(page, () => ({ zlto: ELIGIBLE_ZLTO }));
  await page.goto(ROUTES.yoidWallet);

  await expect(ledgerValue(page, "Available")).toContainText("500");
  await expect(page.locator("#btnCashOut_wallet")).toHaveCount(0);
  expect(await apiGet(page, "/user")).toMatchObject({
    payout: { enabled: CASH_OUT.enabled },
  });
});

test("the link to past cash-outs survives the kill-switch and opens the partner site in a new tab", async ({
  page,
}) => {
  // Real `enabled: false`, with a completed cash out on record.
  await overlayProfile(page, () => ({
    zlto: ELIGIBLE_ZLTO,
    payout: { walletAvailable: true, walletUrl: WALLET_URL },
  }));
  await page.goto(ROUTES.yoidWallet);

  const link = page.locator("#lnkCashOutWallet_wallet");
  await expect(link).toContainText("View my cash-outs");
  await expect(link).toHaveAttribute("href", WALLET_URL);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(page.locator("#btnCashOut_wallet")).toHaveCount(0);
});

test("an incomplete profile is sent to the profile page instead of the amount form", async ({
  page,
}) => {
  await overlayProfile(page, () => ({
    zlto: ELIGIBLE_ZLTO,
    payout: ENABLED_PAYOUT,
    // Email, not one of the five fields the global "Complete your profile" dialog checks — a
    // phone-only account. Any of those five would open that dialog over the page instead.
    profile: { email: null },
  }));
  await page.goto(ROUTES.yoidWallet);

  await page.locator("#btnCashOut_wallet").click();
  await expect(
    heading(page, "Complete your profile to cash out"),
  ).toBeVisible();
  await expect(dialog(page).getByRole("listitem")).toHaveText([
    "email address",
  ]);
  await expect(
    dialog(page).getByRole("link", { name: "Update my profile" }),
  ).toHaveAttribute("href", ROUTES.profile);
  await expect(page.locator("#cash-out-amount")).toHaveCount(0);
});

test("the amount must fit the available balance and the country minimum", async ({
  page,
}) => {
  await overlayProfile(page, () => ({
    zlto: ELIGIBLE_ZLTO,
    payout: {
      ...ENABLED_PAYOUT,
      countryAvailability: {
        supported: true,
        offline: false,
        minimumAmount: 5,
        currency: "USD",
      },
    },
  }));
  await stubConversion(page);
  await page.goto(ROUTES.yoidWallet);

  const field = page.locator("#cash-out-amount");
  const error = page.locator("#cash-out-amount-error");
  const next = page.locator("#btnCashOutAmountContinue");

  await enterAmount(page, AVAILABLE + 1);
  await expect(dialog(page)).toContainText("The smallest cash out is $5.00.");
  await expect(error).toHaveText("You can cash out up to 500 ZLTO.");
  await expect(next).toBeDisabled();

  // 100 ZLTO ≈ $2.00 — judged on the estimate, not the typed ZLTO.
  await field.fill("100");
  await expect(error).toHaveText(
    "That's below the smallest cash out of $5.00. Enter more Zlto.",
  );
  await expect(next).toBeDisabled();

  await page.locator("#btnCashOutUseAll").click();
  await expect(field).toHaveValue(String(AVAILABLE));
  await expect(dialog(page)).toContainText("$10.00");
  await expect(error).toHaveCount(0);
  await expect(next).toBeEnabled();
});

test("cash out pauses when the Treasury has no payout funds", async ({
  page,
}) => {
  // Real conversion preview against the seeded Treasury (payout pool USD 0).
  await overlayProfile(page, () => ({
    zlto: ELIGIBLE_ZLTO,
    payout: ENABLED_PAYOUT,
  }));
  await page.goto(ROUTES.yoidWallet);

  await enterAmount(page, 100);
  const conversion = (await apiGet(
    page,
    "/treasury/conversion/zlto-usd?amount=100",
  )) as { amount: number; treasuryFundsAvailable: boolean };
  expect(
    conversion.treasuryFundsAvailable,
    `Treasury payout pool is USD ${CASH_OUT.payoutPoolUsd} in the seed`,
  ).toBe(false);

  await expect(dialog(page)).toContainText("Cash Out is paused for now");
  await expect(dialog(page)).toContainText(`$${conversion.amount.toFixed(2)}`);
  // The amount is fine; the Treasury is not. Never a field error.
  await expect(page.locator("#cash-out-amount-error")).toHaveCount(0);
  await expect(page.locator("#btnCashOutAmountContinue")).toBeDisabled();
});

test("the server's refusal to start a cash out is explained and reserves nothing", async ({
  page,
}) => {
  // Real POST /user/payout/zlto: the local API refuses with "Cash-out is not available".
  await overlayProfile(page, () => ({
    zlto: ELIGIBLE_ZLTO,
    payout: ENABLED_PAYOUT,
  }));
  await stubConversion(page);
  await page.goto(ROUTES.yoidWallet);

  await enterAmount(page, 100);
  await page.locator("#btnCashOutAmountContinue").click();
  await expect(heading(page, "Check your cash out")).toBeVisible();
  await expect(dialog(page)).toContainText("$2.00");

  const initiate = page.waitForResponse(
    (res) =>
      apiPath("/user/payout/zlto")(new URL(res.url())) &&
      res.request().method() === "POST",
  );
  await page.locator("#btnCashOutReviewConfirm").click();
  const response = await initiate;
  expect(new URL(response.url()).searchParams.get("amount")).toBe("100");
  expect(response.status()).toBe(400);

  await expect(
    heading(page, "Cash Out isn't available right now"),
  ).toBeVisible();
  await expect(dialog(page)).toContainText("Your Zlto is safe in your wallet");
  expect(await apiGet(page, "/user")).toMatchObject({
    zlto: { pendingPayout: 0 },
    payout: { active: false },
  });
});

test("a confirmed cash out runs the partner journey inside Yoma and reports the recorded outcome", async ({
  page,
}) => {
  await overlayProfile(page, () => ({
    zlto: ELIGIBLE_ZLTO,
    payout: ENABLED_PAYOUT,
  }));
  await stubConversion(page);
  let initiation: Request | undefined;
  await page.context().route(apiPath("/user/payout/zlto"), (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    initiation = route.request();
    return fulfillJson(route, {
      payoutId: PAYOUT_ID,
      canCancel: true,
      amount: 2,
      currency: "USD",
      paymentUrl: PAYMENT_URL,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
  });
  await page.context().route("https://partner.e2e.invalid/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Partner checkout</h1>",
    }),
  );
  await page.context().route(apiPath("/user/payout/latest"), (route) =>
    route.request().method() === "GET"
      ? fulfillJson(route, {
          id: PAYOUT_ID,
          status: "Completed",
          amount: 2,
          currency: "USD",
          dateCreated: new Date().toISOString(),
          canResume: false,
          canCancel: false,
        })
      : route.fallback(),
  );
  await page.goto(ROUTES.yoidWallet);

  await enterAmount(page, 100);
  await page.locator("#btnCashOutAmountContinue").click();
  await page.locator("#btnCashOutReviewConfirm").click();

  await expect(heading(page, "Finish your cash out")).toBeVisible();
  // The amount travels as a query parameter with no body.
  expect(new URL(initiation!.url()).searchParams.get("amount")).toBe("100");
  expect(initiation!.postData() ?? "").toBe("");
  const frame = page.locator("#frmCashOutHosted");
  await expect(frame).toHaveAttribute("src", PAYMENT_URL);
  await expect(frame).toHaveAttribute("title", "Secure cash out");
  await expect(
    page.frameLocator("#frmCashOutHosted").getByRole("heading"),
  ).toHaveText("Partner checkout");
  await expect(page.locator("#btnCashOutNewWindow")).toBeVisible();

  await page.locator("#btnCashOutHostedDone").click();
  await expect(heading(page, "Your cash out is complete")).toBeVisible();
});

test("a cash out in progress can be resumed or cancelled, and cancel targets the payout on screen", async ({
  page,
}) => {
  let active = true;
  await overlayProfile(page, () =>
    active
      ? {
          zlto: {
            ...ELIGIBLE_ZLTO,
            balance: AVAILABLE,
            pendingPayout: 300,
            available: 200,
            total: 200,
          },
          payout: {
            ...ENABLED_PAYOUT,
            active: true,
            status: "Processing",
            canResume: true,
            amount: 6,
            currency: "USD",
            dateCreated: new Date().toISOString(),
          },
        }
      : { zlto: ELIGIBLE_ZLTO, payout: ENABLED_PAYOUT },
  );
  await page.context().route(apiPath("/user/payout/zlto"), (route) =>
    route.request().method() === "GET"
      ? fulfillJson(route, {
          payoutId: PAYOUT_ID,
          canCancel: true,
          amount: 6,
          currency: "USD",
          paymentUrl: PAYMENT_URL,
          expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        })
      : route.fallback(),
  );
  let cancelledUrl: string | undefined;
  await page.context().route(
    (url) => /\/api\/v3\/user\/payout\/[^/]+\/cancel$/.test(url.pathname),
    (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      cancelledUrl = route.request().url();
      active = false;
      return fulfillJson(route, undefined);
    },
  );
  await page.goto(ROUTES.yoidWallet);

  // The reserved Zlto shows on the ledger as a movement out of the balance.
  await expect(ledgerValue(page, "Pending cash out")).toContainText("300");
  await expect(ledgerValue(page, "Available")).toContainText("200");

  const button = page.locator("#btnCashOut_wallet");
  await expect(button).toHaveText("Continue cash out");
  await button.click();
  await expect(heading(page, "Finish your cash out")).toBeVisible();
  await expect(page.locator("#btnCashOutResumeContinue")).toBeVisible();

  await page.locator("#btnCashOutCancel").click();
  await expect(heading(page, "Cancel this cash out?").last()).toBeVisible();
  await dialog(page).getByRole("button", { name: "Yes, cancel it" }).click();

  await expect(heading(page, "Your cash out is cancelled")).toBeVisible();
  expect(new URL(cancelledUrl!).pathname).toMatch(
    new RegExp(`/user/payout/${PAYOUT_ID}/cancel$`),
  );

  // The text button, not the ✕ (whose accessible name is also "Close").
  await dialog(page).locator("button", { hasText: "Close" }).click();
  await expect(button).toHaveText("Cash Out");
});
