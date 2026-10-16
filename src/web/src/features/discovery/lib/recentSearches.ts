/**
 * Recent searches — per device, newest first. The panel SHOWS three (2026-09-22 client feedback;
 * was five) but the store KEEPS ten, so removing one promotes the next most recent into view
 * instead of shortening the list. Stored as the serialised query string plus a display label so
 * replaying one is a plain navigation (the URL is the state). "Clear recent" empties the store.
 */
export interface RecentSearch {
  label: string;
  queryString: string;
  resultCount: number | null;
  /** When it was last run (epoch ms) — shown as "2h ago". Absent on pre-2026-09-05 entries. */
  at?: number;
}

const KEY = "yoma.discovery.recentSearches";
/** How many the typeahead shows. */
export const RECENT_SEARCHES_SHOWN = 3;
/** How many the store keeps, so removal can promote. */
const RECENT_SEARCHES_STORED = 10;

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentSearch =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as RecentSearch).label === "string" &&
          typeof (item as RecentSearch).queryString === "string",
      )
      .slice(0, RECENT_SEARCHES_STORED);
  } catch {
    return [];
  }
}

/** The entries the panel renders: the newest `RECENT_SEARCHES_SHOWN` of the store. */
export function readVisibleRecentSearches(): RecentSearch[] {
  return readRecentSearches().slice(0, RECENT_SEARCHES_SHOWN);
}

export function recordRecentSearch(entry: RecentSearch): void {
  if (typeof window === "undefined" || entry.queryString === "") return;
  const rest = readRecentSearches().filter(
    (item) => item.queryString !== entry.queryString,
  );
  window.localStorage.setItem(
    KEY,
    JSON.stringify(
      [{ ...entry, at: Date.now() }, ...rest].slice(0, RECENT_SEARCHES_STORED),
    ),
  );
}

/**
 * "just now" / "2h ago" / "3d ago" — how long ago a recent search was run. Coarse by design:
 * the point is which of the three entries is the freshest, not the minute it happened.
 */
export function relativeTime(at: number | undefined, now: Date): string | null {
  if (!at) return null;
  const minutes = Math.floor((now.getTime() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function removeRecentSearch(queryString: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify(
      readRecentSearches().filter((item) => item.queryString !== queryString),
    ),
  );
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
