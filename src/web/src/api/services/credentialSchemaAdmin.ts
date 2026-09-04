import * as real from "./credentials";
import * as mock from "~/lib/credentials/schemaAdminMockApi";

/**
 * The data source for every credential-schema call the web app makes:
 *
 * - the Admin schema-management pages (`/admin/schemas`, `/admin/schemas/[id]`) — reads *and*
 *   mutations, because publishing a provider schema cannot be undone (YOM-1281);
 * - the Opportunity wizard's schema selector, through `useOpportunitySchemasQuery` (YOM-1282) —
 *   a read, mocked only because every server-side schema resolution goes through the credential
 *   provider (`SSISchemaService.ListInternal` → `ISSIProviderClient.ListSchemas`), so the lookup
 *   fails outright whenever that provider is unavailable.
 *
 * The module keeps its `…Admin` name because YOM-1281's removal list cites it; it is temporary
 * either way.
 *
 * ⚠️⚠️ TEMPORARY: the mock is available in **local development only** — the guard is the
 * environment, not a hand-edited boolean, so no deployed build can ever serve fixtures even while
 * this code still exists. Whether the mock *is* serving locally is a per-session choice; see
 * `schemaMockActive`, so the real API can be exercised without a rebuild.
 *
 * NB: this mocks the *web* only. Opportunity create/update still validates the submitted schema
 * server-side (`OpportunityService.AssertSSISchemaApplicable`), which also reaches the provider —
 * so with the provider down the selector works but saving with credential issuance enabled fails.
 *
 * To remove for good: delete this file, `~/lib/credentials/schemaAdminMockApi.ts`, the mock banner
 * and notice, and the `SCHEMA_ADMIN_MOCK_ENABLED` guards in the three pages, then import from
 * `./credentials` directly.
 */
export const SCHEMA_ADMIN_MOCK_ENABLED =
  process.env.NEXT_PUBLIC_ENVIRONMENT === "local";

const SCHEMA_MOCK_MODE_KEY = "yoma.schemaMockMode";

/**
 * Whether mocked data is serving *right now*.
 *
 * Read per call rather than once per module load, so the banner's mocked/live switch takes effect
 * on the next request instead of the next build. The choice lives in `localStorage` rather than a
 * query param because it has to hold across navigation and across both surfaces — the Opportunity
 * wizard has no schema-related URL of its own.
 *
 * On the server the build-time default applies, `localStorage` being unavailable there. Nothing
 * server-rendered depends on it: the admin pages skip their SSR prefetch whenever
 * `SCHEMA_ADMIN_MOCK_ENABLED` is set, precisely so the client is the only thing that fetches.
 */
export const schemaMockActive = (): boolean => {
  if (!SCHEMA_ADMIN_MOCK_ENABLED) return false;
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SCHEMA_MOCK_MODE_KEY) !== "live";
};

/** Chooses the data source for the rest of the session. Callers reload so caches are dropped. */
export const setSchemaMockActive = (active: boolean): void => {
  window.localStorage.setItem(SCHEMA_MOCK_MODE_KEY, active ? "mock" : "live");
};

const impl = () => (schemaMockActive() ? mock : real);

// Typed against the real service, so a mock that drifts from the API contract fails the build.
export const getSchemas: typeof real.getSchemas = (...args) =>
  impl().getSchemas(...args);
export const getSchemaByName: typeof real.getSchemaByName = (...args) =>
  impl().getSchemaByName(...args);
export const getSchemaTypes: typeof real.getSchemaTypes = (...args) =>
  impl().getSchemaTypes(...args);
export const getSchemaEntities: typeof real.getSchemaEntities = (...args) =>
  impl().getSchemaEntities(...args);
export const createSchema: typeof real.createSchema = (...args) =>
  impl().createSchema(...args);
export const updateSchema: typeof real.updateSchema = (...args) =>
  impl().updateSchema(...args);
