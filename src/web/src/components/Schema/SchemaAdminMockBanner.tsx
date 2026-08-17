import Link from "next/link";
import { IoMdAlert } from "react-icons/io";
import { SCHEMA_ADMIN_MOCK_FIXTURES } from "~/lib/credentials/schemaAdminMockApi";

/**
 * ⚠️⚠️ TEMPORARY DEV AID — DELETE THIS FILE BEFORE MERGING, together with
 * `~/lib/credentials/schemaAdminMockApi.ts` and the `SCHEMA_ADMIN_MOCK_ENABLED` guards. ⚠️⚠️
 *
 * Makes it impossible to mistake mocked schema data for the real thing, and carries deep links to
 * the representative fixtures.
 */
export const SchemaAdminMockBanner: React.FC<{ current?: string }> = ({
  current,
}) => (
  <div className="mb-2 flex flex-col gap-1 rounded-lg border border-amber-400 bg-amber-100 p-2 text-xs text-amber-900">
    <div className="flex items-center gap-1 font-bold">
      <IoMdAlert className="h-4 w-4" />
      Mocked schema data — nothing reaches the credential provider
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
