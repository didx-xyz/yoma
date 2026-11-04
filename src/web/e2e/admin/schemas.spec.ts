import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { apiGet } from "../support/api";
import { ROUTES, SCHEMAS } from "../seed";

// Credential schema management (YOM-1281). Read-only on purpose: POST/PATCH /ssi/schema publish
// an immutable version on the real credential-provider tenant and nothing can delete it, so the
// create wizard is driven up to Review and never submitted (see known-gaps.md).

test.beforeEach(async ({ context }) => {
  // Locally the pages default to an in-browser mock; CI's production build has no mock. Force the
  // live source so both read the API-seeded schemas.
  await context.addInitScript((key) => {
    localStorage.setItem(key, "live");
  }, SCHEMAS.mockModeKey);
  // Safety net, not a mock: a stray Submit must fail loudly instead of reaching the provider.
  await context.route("**/ssi/schema", (route) =>
    route.request().method() === "GET"
      ? route.continue()
      : route.fulfill({ status: 500, body: "blocked by e2e" }),
  );
});

const row = (page: Page, fullName: string) =>
  page.locator(`[id="rowSchema_${fullName}"]`);

// react-select: open, then pick by exact option text ("Opportunity" is a prefix of "MyOpportunity").
async function pick(page: Page, inputId: string, option: string) {
  await page.locator(`#${inputId}`).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("schemas list shows the API-seeded default schemas with their opportunity type @smoke", async ({
  page,
}) => {
  await page.goto(ROUTES.adminSchemas);

  await expect(page).toHaveTitle("Yoma Admin | Schemas");
  await expect(page.getByRole("heading", { name: "Schemas" })).toBeVisible();
  await expect(page.locator("#lnkSchemaAdd")).toHaveAttribute(
    "href",
    ROUTES.adminSchemaCreate,
  );

  const job = row(page, SCHEMAS.opportunityJob);
  await expect(
    job.getByRole("link", { name: SCHEMAS.displayName, exact: true }),
  ).toHaveAttribute("href", ROUTES.adminSchema(SCHEMAS.opportunityJob));
  await expect(
    job.getByRole("cell", { name: "Job", exact: true }),
  ).toBeVisible();
  // Generic schemas have no opportunity type.
  await expect(
    row(page, SCHEMAS.opportunityGeneric).getByRole("cell", {
      name: "All",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    row(page, SCHEMAS.yoid).getByRole("cell", {
      name: "AnonCreds",
      exact: true,
    }),
  ).toBeVisible();
});

test("editing a seeded schema keeps its identity read-only and lists every mapped attribute", async ({
  page,
}) => {
  await page.goto(ROUTES.adminSchema(SCHEMAS.opportunityJob));

  await expect(
    page.getByRole("heading", { level: 4, name: SCHEMAS.displayName }),
  ).toBeVisible();
  await expect(page.locator("#inpSchemaName")).toHaveValue(SCHEMAS.displayName);
  await expect(page.locator("#inpSchemaName")).toBeDisabled();
  for (const id of [
    "#selSchemaType",
    "#selSchemaOpportunityType",
    "#selSchemaArtifactType",
  ]) {
    await expect(page.locator(id)).toBeDisabled();
  }
  await expect(
    page.locator("fieldset", { hasText: "Opportunity type" }),
  ).toContainText("Job");

  await page.locator("#btnSchemaStep1Next").click();
  await expect(page.getByRole("heading", { name: "Attributes" })).toBeVisible();
  // Locked system rows render as text; every other mapping is an editable row.
  await expect(
    page.getByRole("cell", { name: /Always issued — cannot be removed Title/ }),
  ).toBeVisible();
  const locked = await page
    .getByRole("img", { name: "Always issued — cannot be removed" })
    .count();
  const editable = await page.locator("[id^=selSchemaAttrSource_]").count();
  const schema = (await apiGet(
    page,
    `/ssi/schema/${encodeURIComponent(SCHEMAS.opportunityJob)}`,
  )) as { propertyCount: number };
  expect(locked + editable).toBe(schema.propertyCount);
  // Saving would publish a new provider version — the button is the end of this journey.
  await expect(page.locator("#btnSchemaStep2Next")).toHaveText("Submit");
});

test("create wizard validates each step and reaches Review without publishing", async ({
  page,
}) => {
  await page.goto(ROUTES.adminSchemaCreate);
  await expect(
    page.getByRole("heading", { level: 4, name: "New schema" }),
  ).toBeVisible();

  await page.locator("#btnSchemaStep1Next").click();
  for (const field of ["Schema name", "Schema type", "Artifact type"]) {
    await expect(page.getByText(`${field} is required.`)).toBeVisible();
  }

  await page.locator("#inpSchemaName").fill("E2E");
  // The opportunity type belongs to Opportunity schemas only.
  await pick(page, "selSchemaType", "YoID");
  await expect(page.locator("#selSchemaOpportunityType")).toHaveCount(0);
  await pick(page, "selSchemaType", "Opportunity");
  await pick(page, "selSchemaOpportunityType", "Job");
  await pick(page, "selSchemaArtifactType", "JWS");
  await page.locator("#btnSchemaStep1Next").click();

  await expect(page.getByRole("heading", { name: "Attributes" })).toBeVisible();
  await page.locator("#btnSchemaStep2Next").click();
  await expect(
    page.getByText("At least one attribute is required."),
  ).toBeVisible();
  await page.locator("#btnSchemaAttrAdd").click();
  await pick(page, "selSchemaAttrSource_0", "Opportunity");
  // A Job custom field (Compensation group) offered because the context is Job.
  await pick(page, "selSchemaAttr_0", "Minimum Salary");
  await page.locator("#btnSchemaStep2Next").click();

  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  for (const [label, value] of [
    ["Schema name", "E2E"],
    ["Schema type", "Opportunity"],
    ["Opportunity type", "Job"],
    ["Artifact type", "JWS"],
  ]) {
    await expect(page.locator("fieldset", { hasText: label })).toContainText(
      value,
    );
  }
  await expect(
    page.getByRole("cell", { name: "Minimum Salary", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#btnSchemaStep3Submit")).toBeEnabled();
  // Not clicked: see the file header.
});
