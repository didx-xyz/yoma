import type { Browser, Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { ApiClient, apiGet } from "../support/api";
import { storageStatePath } from "../support/auth";
import { ORGANISATIONS, ROUTES, USERS } from "../seed";
import {
  createOpportunity,
  isoDate,
  type Definition,
  type Lookup,
} from "../support/opportunities";

/**
 * The opportunity lifecycle across roles, on fresh data every run:
 *
 *   org-admin creates a Learning opportunity through the wizard (Manual verification, Location
 *   proof, ZLTO reward, one skill) and four more types through the API →
 *   org-admin edit page shows each type's custom fields →
 *   youth completes the Learning one (current location as proof) →
 *   org-admin approves it on the Submissions page →
 *   youth sees the skill on Yo-ID and the pending ZLTO on the wallet.
 *
 * Learning, not Job: the API skips skill assignment for Jobs and forbids ZLTO on them.
 * Location proof, not file upload: files go to real AWS S3 from the API container (no local
 * stub) — see known-gaps.md. Credentials are not asserted (external Aries).
 * Everything created is archived in afterAll (there is no DELETE; archive = status Deleted).
 */
test.describe.configure({ mode: "serial" });

const RUN = `E2E ${Date.now().toString(36)}`;
const TYPES = [
  "Learning",
  "Job",
  "Event",
  "ImpactAction",
  "Entrepreneurship",
] as const;
const ZLTO = 7;

const created: Record<string, string> = {}; // type → opportunity id
let orgApi: ApiClient;
let youthApi: ApiClient;
let skill: Lookup;

async function roleContext(browser: Browser, role: "youth" | "orgAdmin") {
  return browser.newContext({
    storageState: storageStatePath(role),
    geolocation: { latitude: -33.9249, longitude: 18.4241 }, // Cape Town
    permissions: ["geolocation"],
  });
}

test.beforeAll(async ({ baseURL }) => {
  orgApi = await ApiClient.forRole("orgAdmin", baseURL!);
  youthApi = await ApiClient.forRole("youth", baseURL!);
  // Verification-enabled opportunities need a credential schema, read live from the external
  // Aries CloudAPI tenant. When the provider rejects the API's credentials (first CI run:
  // `invalid_client`), the wizard's schema list is empty — skip with the reason (known-gaps.md).
  const schemas = await orgApi
    .get("/ssi/schema?schemaType=Opportunity")
    .catch((e: unknown) => e);
  test.skip(
    schemas instanceof Error || !Array.isArray(schemas) || schemas.length === 0,
    `credential provider unreachable from the API: ${schemas instanceof Error ? schemas.message.slice(0, 200) : "no schemas"}`,
  );
  const skills = (await orgApi.get(
    "/lookup/skill?pageNumber=1&pageSize=1",
  )) as {
    items: Lookup[];
  };
  skill = skills.items[0]!;
});

test.afterAll(async () => {
  for (const id of Object.values(created)) {
    await orgApi.patch(`/opportunity/${id}/Deleted`).catch(() => undefined);
  }
  await orgApi.dispose();
  await youthApi.dispose();
});

test("org admin creates a Learning opportunity through the wizard @smoke", async ({
  browser,
}) => {
  const ctx = await roleContext(browser, "orgAdmin");
  const page = await ctx.newPage();
  const title = `${RUN} Learning`;
  await page.goto(ROUTES.orgOpportunityCreate(ORGANISATIONS.yoma.id));

  // 1 General
  await page.locator('input[name="title"]').fill(title);
  await selectOption(page, "#input_typeid", "Learning");
  await selectOption(page, "#input_categories");
  await page
    .locator('textarea[name="summary"]')
    .fill("Created by the e2e lifecycle flow.");
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type("Complete this course to earn a skill and ZLTO.");
  await page.locator("#btnOppStep1Next").click();

  // 2 Details
  await selectOption(page, "#input_languages", "English");
  await selectOption(page, "#input_countries", "South Africa");
  await page.locator('input[name="commitmentIntervalCount"]').fill("1");
  await selectOption(page, "#input_commitmentIntervalId", "Hour");
  await page.locator("#input_dateStart").fill(isoDate(-1));
  await page.locator("#input_dateStart").press("Tab");
  // required Learning custom field(s): first option each
  const cfIds = await page
    .locator(
      '[data-testid="opportunity-custom-fields"] [id^="input_customfield_"]',
    )
    .evaluateAll((els) => els.map((e) => e.id));
  for (const id of cfIds) await selectOption(page, `#${id}`);
  await page.locator("#btnOppStep2Next").click();

  // 3 Rewards
  await page.locator("#incentivizedYes").check();
  await page.locator("#rewardTypeZLTO").check();
  await page.locator('input[name="zltoReward"]').fill(String(ZLTO));
  await page.locator("#btnOppStep3Next").click();

  // 4 Skills
  // Async select: wait for the skill's own option before Enter, or Enter selects nothing
  // (skills are optional for Learning, so the wizard would carry on without one).
  await page.locator("#input_skills").click();
  await page
    .locator("#input_skills")
    .pressSequentially(skill.name.slice(0, 6), { delay: 30 });
  await expect(page.getByText(skill.name, { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await page.locator("#input_skills").press("Enter");
  await page.locator("#input_skills").press("Escape");
  await page.locator("#btnOppStep4Next").click();

  // 5 Keywords
  await page.locator("#input_keywords").fill("e2e");
  await page.keyboard.press("Enter");
  await page.locator("#btnOppStep5Next").click();

  // 6 Verification: Manual, Location proof (the only S3-free type)
  await page.locator("#verificationEnabledManual").check();
  await page.locator('[id="chk_verificationType_Location"]').check();
  await page.locator("#btnOppStep6Next").click();

  // 7 Credential
  await selectOption(page, "#input_ssiSchemaName", "Default");
  await page.locator("#btnOppStep7Next").click();

  // 8 Preview
  await page.locator("#postAsActive").check();
  await expect(page.locator("#btnOppSubmit")).toBeEnabled();
  await page.locator("#btnOppSubmit").click();
  await expect(page.getByText("Opportunity created")).toBeVisible();
  await page.waitForURL(/\/opportunities\/([0-9a-f-]{36})\/info/);
  created.Learning = page
    .url()
    .match(/\/opportunities\/([0-9a-f-]{36})\/info/)![1]!;

  const saved = (await apiGet(
    page,
    `/opportunity/${created.Learning}/admin`,
  )) as {
    title: string;
    zltoReward: number;
    verificationEnabled: boolean;
    status: string;
    skills: { name: string }[];
  };
  expect(saved).toMatchObject({
    title,
    zltoReward: ZLTO,
    verificationEnabled: true,
    status: "Active",
  });
  expect(saved.skills.map((x) => x.name)).toContain(skill.name);
  await ctx.close();
});

test("the other opportunity types are created and their edit pages show the type's custom fields", async ({
  browser,
}) => {
  for (const type of TYPES.filter((t) => t !== "Learning")) {
    created[type] = await createOpportunity(orgApi, type, `${RUN} ${type}`);
  }

  const ctx = await roleContext(browser, "orgAdmin");
  const page = await ctx.newPage();
  for (const type of TYPES) {
    await page.goto(
      ROUTES.orgOpportunityEdit(ORGANISATIONS.yoma.id, created[type]!),
    );
    await expect(page.locator('input[name="title"]')).toHaveValue(
      `${RUN} ${type}`,
    );
    await page.locator("#btnOppStep1Next").click();
    // Step 2 renders the type's custom-field definitions, each with its input id.
    const defs = (await orgApi.get(
      `/opportunity/custom/field/definition?types=${type}`,
    )) as Definition[];
    const section = page.locator('[data-testid="opportunity-custom-fields"]');
    await expect(section, type).toBeVisible();
    for (const d of defs.filter((x) => x.isRequired)) {
      await expect(
        section
          .locator(
            `[id^="input_customfield_${d.key}"], [id^="customfield_${d.key}_"]`,
          )
          .first(),
        `${type}.${d.key}`,
      ).toBeAttached();
    }
  }
  await ctx.close();
});

test("youth completes the Learning opportunity with a location proof", async ({
  browser,
}) => {
  const ctx = await roleContext(browser, "youth");
  const page = await ctx.newPage();
  await page.goto(ROUTES.opportunity(created.Learning!));
  await expect(
    page.getByRole("heading", { level: 4, name: `${RUN} Learning` }),
  ).toBeVisible();

  await page.locator("#btnOpportunityComplete").click();
  await expect(page.locator("#section-completion-proof-body")).toBeVisible();
  await page.getByRole("button", { name: "use your current location" }).click();
  await page.locator("#btnCompletionSubmit").click();
  await expect(page.getByRole("heading", { name: "Submitted!" })).toBeVisible();

  const status = (await apiGet(
    page,
    `/myopportunity/action/${created.Learning}/verify/status`,
  )) as { status: string };
  expect(status.status).toBe("Pending");
  await ctx.close();
});

test("org admin approves the submission", async ({ browser }) => {
  const ctx = await roleContext(browser, "orgAdmin");
  const page = await ctx.newPage();
  await page.goto(
    `${ROUTES.orgVerifications(ORGANISATIONS.yoma.id)}?status=Pending`,
  );

  const row = page.locator(
    `[id="btnVerifyRow_${created.Learning}_${USERS.youth.id}"]`,
  );
  await row.click();
  // The API requires a comment on finalize (the UI only surfaces that as an error toast).
  await page
    .locator("#txtVerifyComment")
    .fill("Approved by the e2e lifecycle flow.");
  await page.locator("#btnVerifyApprove").click();
  // The result modal opens after the list refetches; the server state is what matters.
  await expect
    .poll(() => youthVerifyStatus(), { timeout: 30_000 })
    .toBe("Completed");
  await page.reload();
  await expect(row).toHaveCount(0);
  await ctx.close();
});

test("youth is awarded the skill and a pending ZLTO reward", async ({
  browser,
}) => {
  const ctx = await roleContext(browser, "youth");
  const page = await ctx.newPage();

  const status = (await apiGet(
    page,
    `/myopportunity/action/${created.Learning}/verify/status`,
  )) as { status: string };
  expect(status.status).toBe("Completed");

  await page.goto(ROUTES.yoidSkills);
  await expect(
    page.getByText(skill.name, { exact: true }).first(),
  ).toBeVisible();

  const me = (await apiGet(page, "/user")) as {
    zlto: { pendingRewards: number };
  };
  expect(me.zlto.pendingRewards).toBeGreaterThanOrEqual(ZLTO);
  await page.goto(ROUTES.yoidWallet);
  // The wallet card's ledger (DetailDisclosure #wallet-balance → #section-wallet-balance-body);
  // the user-menu drawer repeats the label while hidden, so scope to the card.
  await expect(
    page.locator("#section-wallet-balance-body").getByText("Pending rewards"),
  ).toBeVisible();
  await ctx.close();
});

/** The youth's verification status for the Learning opportunity, straight from the API. */
async function youthVerifyStatus(): Promise<string> {
  const body = await youthApi.get(
    `/myopportunity/action/${created.Learning}/verify/status`,
  );
  if (body && typeof body === "object" && "status" in body) {
    return String(body.status);
  }
  throw new Error(`unexpected verify/status body: ${JSON.stringify(body)}`);
}

// --- helpers -----------------------------------------------------------------------------

/**
 * react-select: focus the input, type the filter text, pick the first matching option with
 * Enter. The menu is portalled and its options carry no accessible name, so role locators do
 * not see them; the keyboard path is what a user does and what react-select guarantees.
 * `filter` empty = first option.
 */
async function selectOption(page: Page, inputId: string, filter = "") {
  const input = page.locator(inputId);
  await input.click();
  if (filter) await input.pressSequentially(filter, { delay: 20 });
  // Wait for the menu: react-select sets aria-expanded on the input once it is open and renders
  // the options under the listbox the input's aria-controls points at (portalled, no option
  // roles exposed, and the "N results available" live region is unreliable on a fast build).
  await expect(input).toHaveAttribute("aria-expanded", "true");
  const listbox = await input.getAttribute("aria-controls");
  await expect(
    page.locator(`[id="${listbox}"] [id*="-option-"]`).first(),
  ).toBeVisible();
  await input.press("Enter");
  await input.press("Escape");
}
