import { expect, test } from "../support/test";
import { ApiClient } from "../support/api";
import { createOpportunity } from "../support/opportunities";
import { ORGANISATIONS, ROUTES } from "../seed";

// Guards the custom-field keys the wizard's rules look up by name. The API renamed the
// Entrepreneurship programme keys on 2026-11-02 (YOM-1306); a stale key on the web side
// silently stops the rule, so this runs against the live definitions, not a fixture.
let api: ApiClient;
let opportunityId: string;

test.beforeAll(async ({ baseURL }) => {
  api = await ApiClient.forRole("orgAdmin", baseURL!);
  opportunityId = await createOpportunity(
    api,
    "Entrepreneurship",
    `E2E ${Date.now().toString(36)} Entrepreneurship CF`,
  );
});

test.afterAll(async () => {
  await api
    .patch(`/opportunity/${opportunityId}/Deleted`)
    .catch(() => undefined);
  await api.dispose();
});

test("an Entrepreneurship programme of Other requires the programme's name", async ({
  page,
}) => {
  await page.goto(
    ROUTES.orgOpportunityEdit(ORGANISATIONS.yoma.id, opportunityId),
  );
  await page.locator("#btnOppStep1Next").click();

  const type = page.locator("#input_customfield_EntrepreneurshipProgrammeType");
  const name = page.locator(
    "#input_customfield_EntrepreneurshipProgrammeOther",
  );
  await expect(name).toBeDisabled();

  await type.click();
  await type.pressSequentially("Other", { delay: 20 });
  await type.press("Enter");
  await expect(name).toBeEnabled();

  await page.locator("#btnOppStep2Next").click();
  await expect(
    page.getByText(
      "Name the other programme — it is required when Other is selected.",
    ),
  ).toBeVisible();

  await name.fill("E2E bootcamp");
  await page.locator("#btnOppStep2Next").click();
  await expect(
    page.getByRole("heading", { level: 5, name: "Rewards" }),
  ).toBeVisible();
});
