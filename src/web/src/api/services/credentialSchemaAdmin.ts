import * as real from "./credentials";
import * as mock from "~/lib/credentials/schemaAdminMockApi";

/**
 * The data source for the Admin credential schema-management pages
 * (`/admin/schemas`, `/admin/schemas/[id]`). Nothing else imports this module.
 *
 * ⚠️⚠️ TEMPORARY: while this is `true`, no schema-management call leaves the browser — reads *and*
 * mutations are served from `~/lib/credentials/schemaAdminMockApi`. Publishing a provider schema
 * cannot be undone, so the mutations are mocked as deliberately as the reads.
 *
 * To go live against `feature/custom-fields-framework`: set this to `false`. That is the whole
 * change. Then delete this file, `~/lib/credentials/schemaAdminMockApi.ts`, the mock banner and the
 * `SCHEMA_ADMIN_MOCK_ENABLED` guards in the two pages, and import from `./credentials` directly.
 */
export const SCHEMA_ADMIN_MOCK_ENABLED = true;

const impl = SCHEMA_ADMIN_MOCK_ENABLED ? mock : real;

// Typed against the real service, so a mock that drifts from the API contract fails the build.
export const getSchemas: typeof real.getSchemas = impl.getSchemas;
export const getSchemaByName: typeof real.getSchemaByName =
  impl.getSchemaByName;
export const getSchemaTypes: typeof real.getSchemaTypes = impl.getSchemaTypes;
export const getSchemaEntities: typeof real.getSchemaEntities =
  impl.getSchemaEntities;
export const createSchema: typeof real.createSchema = impl.createSchema;
export const updateSchema: typeof real.updateSchema = impl.updateSchema;
