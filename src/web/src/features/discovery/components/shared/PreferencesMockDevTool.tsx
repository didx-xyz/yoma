import React, { useState } from "react";
import { IoConstructOutline } from "react-icons/io5";
import {
  USER_PREFERENCES_MOCK_ENABLED,
  setUserPreferencesMockActive,
  userPreferencesMockActive,
} from "~/api/services/userPreferences";

/**
 * The mocked/live preferences switch — a DEVELOPER tool, so it lives in a fixed corner and not,
 * as it did until 2026-09-05, inside the youth's preference banner. A youth on the DEV preview
 * was being told about an API that does not exist yet, in the middle of their own content, in
 * the same warning style the product uses for real warnings.
 *
 * It renders only where the mock can serve at all (`USER_PREFERENCES_MOCK_ENABLED` — local, or
 * the DEV preview host); on stage and production nothing mounts. Collapsed to a small pill by
 * default; expanding shows which source is serving and switches it (a reload drops the caches).
 * Goes out with the rest of the mock when YOM-1257 / YOM-1258 land.
 */
export const PreferencesMockDevTool: React.FC = () => {
  const [open, setOpen] = useState(false);
  if (!USER_PREFERENCES_MOCK_ENABLED) return null;

  const mocked = userPreferencesMockActive();

  return (
    <div className="fixed bottom-3 left-3 z-40 print:hidden">
      {open ? (
        <div className="border-gray shadow-custom max-w-70 rounded-xl border bg-white p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold">
            <IoConstructOutline className="h-4 w-4 shrink-0" />
            Preview build
          </p>
          <p className="text-gray-dark pt-1">
            Preferences are{" "}
            <span className="font-semibold">{mocked ? "mocked" : "live"}</span>.
            The presets API (YOM-1257 / YOM-1258) does not exist yet.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setUserPreferencesMockActive(!mocked);
                window.location.reload();
              }}
              className="text-purple font-semibold underline"
            >
              Switch to {mocked ? "live" : "mocked"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-dark ml-auto"
            >
              Hide
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Preview build — preferences data source"
          className="border-gray shadow-custom text-gray-dark flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] font-semibold opacity-70 hover:opacity-100"
        >
          <IoConstructOutline className="h-3.5 w-3.5" />
          prefs: {mocked ? "mock" : "live"}
        </button>
      )}
    </div>
  );
};
