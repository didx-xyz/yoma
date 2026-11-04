import { expect, type Page } from "@playwright/test";

export const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? "http://localhost:5000/api/v3";

/**
 * GET an API endpoint as the page's signed-in user. Used to assert server truth after a UI
 * mutation, so a test cannot pass on optimistic client state alone.
 */
export async function apiGet(page: Page, path: string): Promise<unknown> {
  const session = await (await page.request.get("/api/auth/session")).json();
  expect(typeof session.accessToken, "session.accessToken").toBe("string");
  const res = await page.request.get(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  expect(res.ok(), `GET ${path}`).toBe(true);
  return res.json();
}
