import {
  expect,
  request,
  type APIRequestContext,
  type Page,
  type Route,
} from "@playwright/test";
import type { Role } from "../seed";
import { storageStatePath } from "./auth";

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

/** URL predicate for `page.route` / `waitForResponse`: matches one API v3 path (any origin). */
export const apiPath = (suffix: string) => (url: URL) =>
  url.pathname.endsWith(`/api/v3${suffix}`);

/** Fulfil a cross-origin API call (web :3000 → API :5000) with CORS headers the browser accepts. */
export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin":
        (await route.request().headerValue("origin")) ?? "*",
      "access-control-allow-credentials": "true",
    },
    body: body === undefined ? "" : JSON.stringify(body),
  });
}

/**
 * Yoma API client for a seeded role, without a page: the access token is read through the
 * site's /api/auth/session using the storage state auth.setup.ts saved for that role. For
 * test setup/teardown that must not go through the UI (creating fixtures, archiving them).
 */
export class ApiClient {
  private constructor(
    private readonly ctx: APIRequestContext,
    private readonly token: string,
  ) {}

  static async forRole(role: Role, baseURL: string): Promise<ApiClient> {
    const ctx = await request.newContext({
      baseURL,
      storageState: storageStatePath(role),
    });
    const session = await (await ctx.get("/api/auth/session")).json();
    expect(typeof session.accessToken, `${role} session.accessToken`).toBe(
      "string",
    );
    return new ApiClient(ctx, session.accessToken);
  }

  async dispose() {
    await this.ctx.dispose();
  }

  private async send(
    method: "get" | "post" | "patch",
    path: string,
    data?: unknown,
  ) {
    const res = await this.ctx[method](`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      ...(data !== undefined && { data }),
    });
    expect(
      res.ok(),
      `${method.toUpperCase()} ${path}: ${res.status()} ${await res.text()}`,
    ).toBe(true);
    const text = await res.text();
    return text ? JSON.parse(text) : undefined;
  }

  get(path: string): Promise<unknown> {
    return this.send("get", path);
  }

  post(path: string, data: unknown): Promise<unknown> {
    return this.send("post", path, data);
  }

  patch(path: string, data?: unknown): Promise<unknown> {
    return this.send("patch", path, data);
  }
}
