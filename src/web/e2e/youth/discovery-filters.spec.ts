import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { CUSTOM_FIELDS, FIXTURES, FIXTURE_TITLE, ROUTES } from "../seed";

// Custom-field ("type-specific") filters on discovery (YOM-1260 / YOM-1262). Every journey narrows
// the search to the six Job fixtures first (CUSTOM_FIELDS.jobFixturesQuery): the random seed
// opportunities carry the same Employment Type, so only the fixtures tell presence from absence.
// Nothing here mutates server state.

type Clause = {
  key: string;
  operator: string;
  value?: string;
  values?: string[];
};

const JOB_FIXTURES = `${ROUTES.discover}?q=${encodeURIComponent(CUSTOM_FIELDS.jobFixturesQuery)}&type=Job`;

const clausesInUrl = (page: Page): Clause[] => {
  const cf = new URL(page.url()).searchParams.get("cf");
  return cf ? (JSON.parse(cf) as Clause[]) : [];
};

const card = (page: Page, title: string) =>
  page.getByRole("heading", { level: 3, name: title, exact: true });

const chip = (page: Page, label: string) =>
  page
    .getByRole("region", { name: "Filters on this search" })
    .getByRole("button", { name: `Remove ${label}` });

const SALARY_CLAUSES: Clause[] = [
  {
    key: CUSTOM_FIELDS.jobSalaryMinimum.key,
    operator: "GreaterThanOrEqual",
    value: "1000",
  },
  {
    key: CUSTOM_FIELDS.jobSalaryDisclosed.key,
    operator: "Equals",
    value: "true",
  },
];
const SALARY_URL = `${JOB_FIXTURES}&cf=${encodeURIComponent(JSON.stringify(SALARY_CLAUSES))}`;

test("custom-field clauses in the URL are applied as chips and narrow the results @smoke", async ({
  page,
}) => {
  await page.goto(SALARY_URL);

  await expect(page).toHaveTitle("Yoma | Discover opportunities");
  await expect(
    chip(page, `${CUSTOM_FIELDS.jobSalaryMinimum.title}: From 1000`),
  ).toBeVisible();
  await expect(
    chip(page, `${CUSTOM_FIELDS.jobSalaryDisclosed.title}: Yes`),
  ).toBeVisible();
  // Only 01 - Job carries a disclosed salary of 1 000.
  await expect(card(page, FIXTURES.job01)).toBeVisible();
  await expect(page.locator("#hdrDiscoveryResults")).toHaveText(/^1 match/);
  await expect(card(page, FIXTURES.job02)).toHaveCount(0);
});

test("picking a type-specific filter in the panel writes the URL, the request and the results", async ({
  page,
}) => {
  const { jobEmploymentType: field } = CUSTOM_FIELDS;
  await page.goto(JOB_FIXTURES);
  // Unfiltered: all six Job fixtures, including the two without custom-field values.
  await expect(card(page, FIXTURE_TITLE(6, "Job", true))).toBeVisible();

  await page.locator("#btnDiscoveryFilters").click();
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(
    dialog.getByRole("heading", { name: "Job filters" }),
  ).toBeVisible();

  // Row 1: field picker (react-select), then the field's own value control.
  await dialog.locator("#discovery-cf-field-row-1").fill(field.title);
  await page.keyboard.press("Enter");
  const search = page.waitForRequest(
    (req) =>
      req.method() === "POST" &&
      req.url().endsWith("/opportunity/search") &&
      Array.isArray(req.postDataJSON()?.customFields),
  );
  await dialog
    .locator(`#input_customfieldfilter_${field.key}`)
    .fill(field.permanent.name);
  await page.keyboard.press("Enter");

  expect((await search).postDataJSON().customFields).toEqual([
    { key: field.key, operator: "AnyOf", values: [field.permanent.key] },
  ]);
  await expect
    .poll(() => clausesInUrl(page))
    .toEqual([
      { key: field.key, operator: "AnyOf", values: [field.permanent.key] },
    ]);

  await dialog.getByRole("button", { name: "Close filters" }).click();
  await expect(
    chip(page, `${field.title}: ${field.permanent.name}`),
  ).toBeVisible();
  await expect(page.locator("#hdrDiscoveryResults")).toHaveText(/^4 matches/);
  for (const title of [
    FIXTURES.job01,
    FIXTURES.job02,
    FIXTURE_TITLE(5, "Job"),
    FIXTURE_TITLE(22, "Job"),
  ]) {
    await expect(card(page, title)).toBeVisible();
  }
  await expect(card(page, FIXTURE_TITLE(6, "Job", true))).toHaveCount(0);
  await expect(card(page, FIXTURE_TITLE(21, "Job", true))).toHaveCount(0);
});

test("removing a chip drops that clause and clear filters drops them all", async ({
  page,
}) => {
  await page.goto(SALARY_URL);
  await expect(page.locator("#hdrDiscoveryResults")).toHaveText(/^1 match/);

  await chip(page, `${CUSTOM_FIELDS.jobSalaryDisclosed.title}: Yes`).click();
  await expect.poll(() => clausesInUrl(page)).toEqual([SALARY_CLAUSES[0]]);
  await expect(
    chip(page, `${CUSTOM_FIELDS.jobSalaryMinimum.title}: From 1000`),
  ).toBeVisible();

  await page.locator("#btnDiscoveryClearFilters").click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("cf"))
    .toBe(false);
  await expect(
    page.getByRole("region", { name: "Filters on this search" }),
  ).toHaveCount(0);
  // Clearing also drops the search text, so discovery is back on its home rails.
  await expect(page.getByRole("region", { name: "Featured" })).toBeVisible();
});
