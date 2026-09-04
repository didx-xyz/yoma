import { useRouter } from "next/router";
import React, { useState } from "react";
import { IoClose, IoTimeOutline } from "react-icons/io5";
import type { RecentSearch } from "../../lib/recentSearches";
import {
  readRecentSearches,
  removeRecentSearch,
} from "../../lib/recentSearches";

/**
 * Recent searches — a typeahead panel under the free-text input (both breakpoints render it
 * through the shared `FilterPanelBlocks`; it is not a standalone block). Up to five, newest
 * first, each removable. Replaying one is a plain navigation: the stored query string IS the
 * state. `onMouseDown` is intercepted so choosing an entry doesn't blur (and close) the panel
 * before the click lands.
 */
export const RecentSearchesPanel: React.FC = () => {
  const router = useRouter();
  const [entries, setEntries] = useState<RecentSearch[]>(readRecentSearches);
  if (entries.length === 0) return null;

  // `onMouseDown` preventDefault on the buttons keeps the input focused (and the panel open)
  // until the click lands — native buttons only, so no interactive-role gymnastics needed.
  const keepPanelOpen = (e: React.MouseEvent): void => e.preventDefault();

  return (
    <div className="border-gray shadow-custom absolute top-full right-0 left-0 z-30 mt-1 rounded-xl border bg-white p-2">
      <h3 className="text-gray-dark px-2 pb-1 text-xs font-bold tracking-wide uppercase">
        Recent
      </h3>
      <ul className="flex flex-col">
        {entries.map((entry) => (
          <li key={entry.queryString} className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={keepPanelOpen}
              onClick={() =>
                void router.push(`${router.pathname}?${entry.queryString}`)
              }
              className="hover:bg-gray-light flex min-h-11 min-w-0 grow items-center gap-2 rounded-lg px-2 text-left"
            >
              <IoTimeOutline className="text-gray-dark h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate text-sm font-semibold">
                {entry.label}
              </span>
              {entry.resultCount !== null && (
                <span className="text-gray-dark ml-auto shrink-0 text-xs whitespace-nowrap">
                  {entry.resultCount} results
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label={`Remove recent search ${entry.label}`}
              onMouseDown={keepPanelOpen}
              onClick={() => {
                removeRecentSearch(entry.queryString);
                setEntries((prev) =>
                  prev.filter((e) => e.queryString !== entry.queryString),
                );
              }}
              className="text-gray-dark flex h-11 w-11 shrink-0 items-center justify-center"
            >
              <IoClose className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
