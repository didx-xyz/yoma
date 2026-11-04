import type { Page } from "@playwright/test";
import { expect, test } from "../support/test";
import { apiGet } from "../support/api";
import { ROUTES } from "../seed";

// Toggles one visible, enabled user setting and restores it. Setting keys come from the API
// migration 20240723103044_ApplicationDb_Settings_Rework_Seeding; this one defaults to false.
const KEY = "User_Notification_Opportunity_Published";

interface SettingsResponse {
  groups: {
    items: { key: string; value: unknown }[];
    groups?: SettingsResponse["groups"];
  }[];
}

function findValue(groups: SettingsResponse["groups"], key: string): unknown {
  for (const g of groups) {
    const hit = (g.items ?? []).find((i) => i.key === key);
    if (hit) return hit.value;
    if (g.groups) {
      const nested = findValue(g.groups, key);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

async function serverValue(page: Page) {
  const body = (await apiGet(page, "/user/settings")) as SettingsResponse;
  return findValue(body.groups, KEY);
}

async function setToggle(page: Page, checked: boolean) {
  await page.locator(`#${KEY}`).setChecked(checked);
  await page.locator("#btnSettingsSubmit").click();
  await expect(page.getByText("Settings updated")).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.afterEach(async ({ page }) => {
  if ((await serverValue(page)) !== false) {
    await page.goto(ROUTES.settings);
    await setToggle(page, false);
  }
});

test("settings page lists the user's notification toggles", async ({
  page,
}) => {
  await page.goto(ROUTES.settings);

  await expect(page).toHaveTitle("Yoma | Settings");
  await expect(page.locator(`#${KEY}`)).toBeVisible();
  await expect(page.locator(`#${KEY}`)).not.toBeChecked();
  await expect(page.locator("#User_MailingList_Subscribe")).toBeVisible();
  await expect(page.locator("#dlgSettings")).toHaveCount(0);
});

test("a toggle change is saved and reflected by the API", async ({ page }) => {
  await page.goto(ROUTES.settings);
  await setToggle(page, true);

  await page.reload();
  await expect(page.locator(`#${KEY}`)).toBeChecked();
  expect(await serverValue(page)).toBe(true);
});
