import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { apiPath, fulfillJson } from "../support/api";
import { ROUTES } from "../seed";

// Yo-ID passport: credential status tags (YOM-1310, API contract from YOM-1309 / PR #2028).
//
// Every wallet list item and detail carries `status` (Unknown | Issued | Revoked | Expired) and
// `verificationStatus` (Unknown | Verified | Invalid). The CI stack runs without an SSI provider
// (YOMA_SSI_ENABLED_ENVIRONMENTS=None), so the wallet search and detail calls are stubbed on the
// browser context with fixtures; the page, its auth and the Opportunity Type lookup stay real.
// These tests prove the UI's mapping and visibility rules, not the provider integration —
// `known-gaps.md` records live didx:me as not tested here.

type Json = Record<string, unknown>;

const ISSUED_AT = "2026-11-01T08:00:00+00:00";

/** A wallet list item (no `attributes`, as the API's list contract omits them). */
const item = (
  id: string,
  overrides: Json & { schemaType: "YoID" | "Opportunity" },
): Json => ({
  id,
  artifactType: "JWS",
  typeContext: null,
  issuer: "Yoma",
  issuerLogoURL: null,
  title: id,
  dateIssued: ISSUED_AT,
  ...overrides,
});

// The temporary replacement pair: a profile change revoked the old YoID and issued a new one; the
// API keeps both until the old wallet copy is deleted. Both have distinct native ids.
const YOID_REVOKED = item("yoid-revoked", {
  schemaType: "YoID",
  title: "YoID Identity",
  status: "Revoked",
  verificationStatus: "Invalid",
});
const YOID_ISSUED = item("yoid-issued", {
  schemaType: "YoID",
  title: "YoID Identity",
  status: "Issued",
  verificationStatus: "Verified",
  dateIssued: "2026-11-10T08:00:00+00:00",
});
const OPP_EXPIRED = item("opp-expired", {
  schemaType: "Opportunity",
  typeContext: "Learning",
  title: "Expired course",
  status: "Expired",
  verificationStatus: "Invalid",
});
const OPP_UNKNOWN = item("opp-unknown", {
  schemaType: "Opportunity",
  typeContext: "Learning",
  title: "Unresolved course",
  status: "Unknown",
  verificationStatus: "Unknown",
});
const OPP_ISSUED = item("opp-issued", {
  schemaType: "Opportunity",
  typeContext: "Job",
  title: "Issued job",
  status: "Issued",
  verificationStatus: "Verified",
});
// An API older than PR #2028: neither field on the wire.
const OPP_LEGACY = item("opp-legacy", {
  schemaType: "Opportunity",
  typeContext: "Job",
  title: "Legacy job",
});
// Guard: a positive verdict must not paper over a non-issued lifecycle.
const OPP_CONTRADICTORY = item("opp-contradictory", {
  schemaType: "Opportunity",
  typeContext: "Job",
  title: "Contradictory job",
  status: "Revoked",
  verificationStatus: "Verified",
});

const WALLET = [
  YOID_REVOKED,
  YOID_ISSUED,
  OPP_EXPIRED,
  OPP_UNKNOWN,
  OPP_ISSUED,
  OPP_LEGACY,
  OPP_CONTRADICTORY,
];

/** Stub wallet search (one page) and detail (list item + attributes) on the browser context. */
async function stubWallet(page: Page, items: Json[]) {
  await page
    .context()
    .route(apiPath("/ssi/wallet/user/search"), (route) =>
      route.request().method() === "POST"
        ? fulfillJson(route, { totalCount: items.length, items })
        : route.fallback(),
    );
  // Detail is POST /ssi/wallet/user/{id}; `search` shares the prefix and must stay with the route
  // above (Playwright tries the most recently registered route first).
  await page.context().route(
    (url) =>
      /\/api\/v3\/ssi\/wallet\/user\/(?!search$)[^/]+$/.test(url.pathname),
    (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const id = new URL(route.request().url()).pathname.split("/").at(-1);
      const found = items.find((i) => i.id === id);
      if (!found) return fulfillJson(route, { message: "not found" }, 404);
      return fulfillJson(route, {
        ...found,
        attributes: [
          {
            name: "Name",
            nameDisplay: "Name",
            valueDisplay: "Test Youth",
            group: null,
            subGroup: null,
            sortOrder: null,
            itemsDisplay: null,
          },
        ],
      });
    },
  );
}

const card = (page: Page, id: string) =>
  page.locator(`article[data-credential-id="${id}"]`);
const cardBadge = (page: Page, id: string) =>
  card(page, id).locator("[data-status]");
const detailBadge = (page: Page) =>
  page.locator("#credential-detail-status [data-status]");

async function openDetail(page: Page, id: string) {
  await card(page, id).getByRole("button", { name: "View credential" }).click();
  await expect(detailBadge(page)).toBeVisible();
}
async function closeDetail(page: Page) {
  await page
    .locator("#custom-modal-content")
    .getByRole("button", { name: "Close", exact: true })
    .last()
    .click();
  await expect(detailBadge(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await stubWallet(page, WALLET);
  await page.goto(ROUTES.yoidPassport);
  await expect(
    page.getByRole("group", { name: "Filter by credential type" }),
  ).toBeVisible();
});

test("each lifecycle status renders its own tag on the card, never a bare Verified @smoke", async ({
  page,
}) => {
  await expect(cardBadge(page, "yoid-issued")).toHaveAttribute(
    "data-status",
    "verified",
  );
  await expect(cardBadge(page, "yoid-issued")).toHaveText("Verified");

  await expect(cardBadge(page, "yoid-revoked")).toHaveAttribute(
    "data-status",
    "invalid",
  );
  await expect(cardBadge(page, "yoid-revoked")).toHaveAttribute(
    "title",
    "Invalid — revoked",
  );

  await expect(cardBadge(page, "opp-expired")).toHaveAttribute(
    "data-status",
    "invalid",
  );
  await expect(cardBadge(page, "opp-expired")).toHaveAttribute(
    "title",
    "Invalid — expired",
  );

  await expect(cardBadge(page, "opp-unknown")).toHaveAttribute(
    "data-status",
    "unverified",
  );
  await expect(cardBadge(page, "opp-unknown")).toHaveText("Unverified");
});

test("missing fields from an older API and a contradictory verdict never read Verified", async ({
  page,
}) => {
  await expect(cardBadge(page, "opp-legacy")).toHaveAttribute(
    "data-status",
    "unverified",
  );
  await expect(cardBadge(page, "opp-contradictory")).toHaveAttribute(
    "data-status",
    "invalid",
  );
  await expect(cardBadge(page, "opp-contradictory")).toHaveAttribute(
    "title",
    "Invalid — revoked",
  );
});

test("a revoked YoID and its issued replacement both stay listed under their own ids", async ({
  page,
}) => {
  // Not deduplicated by schema or title: two YoID cards, one per native credential id.
  await expect(card(page, "yoid-revoked")).toBeVisible();
  await expect(card(page, "yoid-issued")).toBeVisible();
  await expect(page.locator("article[data-credential-id]")).toHaveCount(
    WALLET.length,
  );
  // The header count is the API's totalCount, so both copies count toward paging.
  await expect(
    page.getByRole("group", { name: "Filter by credential type" }),
  ).toContainText(String(WALLET.length));
});

test("the detail dialog shows the same verdict as the card, with the reason", async ({
  page,
}) => {
  await openDetail(page, "yoid-revoked");
  await expect(detailBadge(page)).toHaveAttribute("data-status", "invalid");
  await expect(detailBadge(page)).toHaveText("Invalid — revoked");
  await closeDetail(page);

  await openDetail(page, "opp-expired");
  await expect(detailBadge(page)).toHaveText("Invalid — expired");
  await closeDetail(page);

  await openDetail(page, "opp-issued");
  await expect(detailBadge(page)).toHaveAttribute("data-status", "verified");
  await expect(detailBadge(page)).toHaveText("Verified");
  await closeDetail(page);

  await openDetail(page, "opp-legacy");
  await expect(detailBadge(page)).toHaveAttribute("data-status", "unverified");
});
