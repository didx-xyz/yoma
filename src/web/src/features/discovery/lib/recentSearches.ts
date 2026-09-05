/**
 * Recent searches — per device, newest first, capped at five. Stored as the serialised query
 * string plus a display label so replaying one is a plain navigation (the URL is the state).
 */
export interface RecentSearch {
  label: string;
  queryString: string;
  resultCount: number | null;
  /** When it was last run (epoch ms) — shown as "2h ago". Absent on pre-2026-09-05 entries. */
  at?: number;
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
    JSON.stringify([{ ...entry, at: Date.now() }, ...rest].slice(0, MAX)),
  );
}

/**
 * "just now" / "2h ago" / "3d ago" — how long ago a recent search was run. Coarse by design:
 * the point is which of five entries is the freshest, not the minute it happened.
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
