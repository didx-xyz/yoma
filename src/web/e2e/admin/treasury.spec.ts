import type { Request } from "@playwright/test";
import { expect, test } from "../support/test";
import { apiGet, fulfillJson } from "../support/api";
import { ORGANISATIONS, ROUTES } from "../seed";

// Treasury → Organisations: an admin edits one organisation's ZLTO reward pool.
//
// The save must go through the pool-only `PATCH /organization/{id}/rewardpool` with exactly
// `{ zltoRewardPoolCurrentFinancialYear }` — never the full-replacement `PATCH /organization`
// multipart body, which from a stale page would overwrite administrators and metadata. The
// PATCH is stubbed (the response is the real organisation with the new pool) so nothing is
// written to the shared seed; the organisation edit page shares the same mutation hook.

const ORG = ORGANISATIONS.jobJack;
const NEW_POOL = 5_000_000;

test("admin saves an organisation reward pool through the pool-only PATCH", async ({
  page,
}) => {
  const organisation = (await apiGet(page, `/organization/${ORG.id}`)) as {
    id: string;
    name: string;
    zltoRewardPoolCurrentFinancialYear: number | null;
  };
  expect(organisation.id).toBe(ORG.id);

  let patch: Request | undefined;
  await page.context().route(
    (url) => url.pathname.endsWith(`/api/v3/organization/${ORG.id}/rewardpool`),
    (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      patch = route.request();
      return fulfillJson(route, {
        ...organisation,
        zltoRewardPoolCurrentFinancialYear: NEW_POOL,
      });
    },
  );
  // Guard: nothing on this path may fall back to the full-organisation replacement.
  await page.context().route(
    (url) => url.pathname.endsWith("/api/v3/organization"),
    (route) =>
      route.request().method() === "PATCH"
        ? route.abort("failed")
        : route.fallback(),
  );

  await page.goto(`${ROUTES.adminTreasury}?tab=organisations`);
  await expect(page).toHaveTitle("Yoma | Treasury");

  // SearchInput blanks its placeholder on focus, so a placeholder locator dies after `fill`.
  const search = page.getByRole("searchbox");
  await search.fill(ORG.name);
  await page.getByRole("button", { name: "Search" }).click();

  await page.locator(`#btnTreasuryOrgEditPools_${ORG.id}`).click();

  const poolInput = page.locator(
    "#treasuryOrgPools-zltoRewardPoolCurrentFinancialYear",
  );
  await expect(poolInput).toBeVisible();
  await poolInput.fill(String(NEW_POOL));
  await page.locator("#treasuryOrgPools-submit").click();

  await expect(
    page.getByText(`Reward pools updated for ${ORG.name}`),
  ).toBeVisible();
  // The dialog closes on success.
  await expect(poolInput).toHaveCount(0);

  expect(patch, "PATCH /organization/{id}/rewardpool was sent").toBeDefined();
  await expect(patch!.headerValue("content-type")).resolves.toContain(
    "application/json",
  );
  // Exactly the pool — no administrators, no metadata.
  expect(patch!.postDataJSON()).toEqual({
    zltoRewardPoolCurrentFinancialYear: NEW_POOL,
  });
});
