/**
 * Recent searches — per device, newest first, capped at three. Stored as the serialised query
 * string plus a display label so replaying one is a plain navigation (the URL is the state).
 */
export interface RecentSearch {
  label: string;
  queryString: string;
  resultCount: number | null;
}

const KEY = "yoma.discovery.recentSearches";
const MAX = 5;

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentSearch =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as RecentSearch).label === "string" &&
        typeof (item as RecentSearch).queryString === "string",
    );
  } catch {
    return [];
  }
}

export function recordRecentSearch(entry: RecentSearch): void {
  if (typeof window === "undefined" || entry.queryString === "") return;
  const rest = readRecentSearches().filter(
    (item) => item.queryString !== entry.queryString,
  );
  window.localStorage.setItem(
    KEY,
    JSON.stringify([entry, ...rest].slice(0, MAX)),
  );
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
