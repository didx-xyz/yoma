import Link from "next/link";
import { useEffect, useState } from "react";
import { IoMdAlert, IoMdCloudOutline } from "react-icons/io";
import {
  SCHEMA_ADMIN_MOCK_ENABLED,
  schemaMockActive,
  setSchemaMockActive,
} from "~/api/services/credentialSchemaAdmin";
import { SCHEMA_ADMIN_MOCK_FIXTURES } from "~/lib/credentials/schemaAdminMockApi";

/**
 * ⚠️⚠️ TEMPORARY DEV AID — DELETE THIS FILE BEFORE MERGING, together with
 * `~/lib/credentials/schemaAdminMockApi.ts`, `~/api/services/credentialSchemaAdmin.ts` and the
 * `SCHEMA_ADMIN_MOCK_ENABLED` guards in the schema pages and the Opportunity wizard. ⚠️⚠️
 */

/**
 * The active data source, read after mount so the server-rendered markup (which cannot see
 * `localStorage`) and the client's first paint agree. Queries do not use this — they call
 * `schemaMockActive()` directly, so they are never a render behind.
 */
export const useSchemaMockActive = (): boolean => {
  const [active, setActive] = useState(SCHEMA_ADMIN_MOCK_ENABLED);

  useEffect(() => {
    setActive(schemaMockActive());
  }, []);

  return active;
};

/** Mocked ⇄ live for the rest of the session. Reloads, so no stale query cache survives. */
const SchemaMockSwitch: React.FC<{ active: boolean }> = ({ active }) => (
  <span className="flex items-center gap-1">
    <span>Data:</span>
    {[
      { label: "mocked", mock: true },
      { label: "live", mock: false },
    ].map((mode) => (
      <button
        key={mode.label}
        type="button"
        className={`badge badge-sm ${
          mode.mock === active
            ? "bg-gray-dark border-gray-dark text-white"
            : "border-gray text-gray-dark bg-white"
        }`}
        onClick={() => {
          if (mode.mock === active) return;
          setSchemaMockActive(mode.mock);
          window.location.reload();
        }}
      >
        {mode.label}
      </button>
    ))}
  </span>
);

/**
 * Makes it impossible to mistake mocked schema data for the real thing, and carries deep links to
 * the representative fixtures. Used by the Admin schema pages.
 */
export const SchemaAdminMockBanner: React.FC<{ current?: string }> = ({
  current,
}) => {
  const active = useSchemaMockActive();

  if (!active)
    return (
      <div className="border-gray text-gray-dark mb-2 flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 text-xs">
        <span className="flex items-center gap-1 font-bold">
          <IoMdCloudOutline className="h-4 w-4" />
          Live schema data — calls reach the credential provider
        </span>
        <SchemaMockSwitch active={active} />
      </div>
    );

  return (
    <div className="mb-2 flex flex-col gap-1 rounded-lg border border-amber-400 bg-amber-100 p-2 text-xs text-amber-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 font-bold">
          <IoMdAlert className="h-4 w-4" />
          Mocked schema data — nothing reaches the credential provider
        </span>
        <SchemaMockSwitch active={active} />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span>Fixtures:</span>
        {SCHEMA_ADMIN_MOCK_FIXTURES.map((fixture) => (
          <Link
            key={fixture.name}
            href={`/admin/schemas/${encodeURIComponent(fixture.name)}`}
            className={`badge badge-sm ${
              current === fixture.name
                ? "bg-amber-500 text-white"
                : "border-amber-300 bg-white text-amber-900"
            }`}
          >
            {fixture.label}
          </Link>
        ))}
        <Link
          href="/admin/schemas/create"
          className="badge badge-sm border-amber-300 bg-white text-amber-900"
        >
          create
        </Link>
        <Link
          href="/admin/schemas"
          className="badge badge-sm border-amber-300 bg-white text-amber-900"
        >
          list
        </Link>
        <Link
          href="/admin/schemas?mock=empty"
          className="badge badge-sm border-amber-300 bg-white text-amber-900"
        >
          empty list
        </Link>
      </div>
      <span className="italic">
        Created and updated schemas live in memory for this session only.
      </span>
    </div>
  );
};

/**
 * The same control for surfaces outside `/admin/schemas`, where the fixture deep links would
 * navigate away from what the tester is looking at. Used by the Opportunity wizard's Credential
 * step (YOM-1282).
 */
export const SchemaMockNotice: React.FC = () => {
  const active = useSchemaMockActive();

  if (!active)
    return (
      <div className="border-gray text-gray-dark flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 text-xs">
        <span className="flex items-center gap-1 font-bold">
          <IoMdCloudOutline className="h-4 w-4" />
          Live schema data
        </span>
        <SchemaMockSwitch active={active} />
      </div>
    );

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-amber-400 bg-amber-100 p-2 text-xs text-amber-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 font-bold">
          <IoMdAlert className="h-4 w-4" />
          Mocked schema data
        </span>
        <SchemaMockSwitch active={active} />
      </div>
      <span>
        The schemas below are fixtures, not the credential provider&apos;s.
        Saving with credential issuance enabled still validates server-side and
        will fail while the provider is offline.
      </span>
    </div>
  );
};
