import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { FIXTURES, ORGANISATIONS, ROUTES } from "../seed";

/**
 * react-select: focus the input, type the filter text, click the option with that exact text.
 * The menu is portalled and its options carry no accessible name, so role locators do not see
 * them; the async opportunity picker debounces its search, so wait for the matching option
 * rather than taking whichever option is first.
 */
async function selectOption(page: Page, inputId: string, option: string) {
  const input = page.locator(inputId);
  await input.click();
  await input.pressSequentially(option, { delay: 20 });
  await expect(input).toHaveAttribute("aria-expanded", "true");
  const listbox = await input.getAttribute("aria-controls");
  // Option labels may render separators as their own elements ("01 - Job" reads as "01 Job"),
  // so match the words rather than the exact string.
  const words = new RegExp(option.split(/\W+/).filter(Boolean).join(".*"));
  await page
    .locator(`[id="${listbox}"] [id*="-option-"]`, { hasText: words })
    .first()
    .click();
}

test("link participants validation echoes a bad entry as text, never as markup", async ({
  page,
}) => {
  await page.goto(ROUTES.orgLinkCreate(ORGANISATIONS.yoma.id));

  // 1 General: a link for the seeded job, so step 2 is reachable. Nothing is saved.
  await selectOption(page, "#input_entityType", "Opportunity");
  await selectOption(page, "#input_entityId", FIXTURES.job01);
  await page.locator('input[name="name"]').fill("e2e participants validation");
  await page.locator("#btnLinkStep1Next").click();

  // 2 Limit: a participant that is neither an email nor a phone number, shaped like HTML.
  await page.locator("#lockToDistributionList").check();
  const participants = page.locator("#input_distributionList");
  await participants.click();
  await participants.pressSequentially("<b>not-an-email</b>");
  await participants.press("Enter");
  await participants.blur();

  const error = page.locator("#error_distributionList");
  await expect(error).toContainText("Invalid entries: <b>not-an-email</b>");
  await expect(error.locator("b")).toHaveCount(0);
});
