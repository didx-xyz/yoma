import { COUNTRY_CODE_WW } from "~/lib/constants";

/**
 * The order the language and country lists present their options in (Jason, 2026-10-22), the
 * same rule in every home: the filters dialog and sheet, the bar's section popovers and the
 * preferences wizard.
 *
 * COLLAPSED — the first rows before "Show all", the wizard's suggestion row — leads with the
 * preferred options, in their own order, then the rest alphabetically: the site's five supported
 * languages (`public/scripts/lang-config.js`), or the youth's own country and Worldwide.
 * EXPANDED — every option on screen — is alphabetical throughout: with the whole list visible a
 * pinned row at the top is noise, and an alphabetical run is where a youth looks for Xhosa.
 *
 * Order only: labels, ids and selection are untouched, and an option the rule does not know
 * simply sorts by name, so nothing is ever dropped.
 */
export interface OptionOrder<T> {
  collapsed: T[];
  expanded: T[];
}

/** Not a preferred option: sorts after every preferred one, by name. */
export const UNRANKED = Number.POSITIVE_INFINITY;

/**
 * The supported languages, in the order the site offers them (`lang-config.js`). Matched on the
 * lookup's ISO code first, then on its name — the lookup says "Spanish, Castilian" and "Swahili"
 * where the site says Español and Kiswahili, so neither side's spelling is trusted alone.
 */
const PREFERRED_LANGUAGES: readonly {
  code: string;
  names: readonly string[];
}[] = [
  { code: "en", names: ["English"] },
  { code: "es", names: ["Spanish", "Español"] },
  { code: "fr", names: ["French", "Français"] },
  { code: "pt", names: ["Portuguese", "Português"] },
  { code: "sw", names: ["Kiswahili", "Swahili"] },
];

const fold = (text: string): string => text.trim().toLowerCase();

/** The language's place in the preferred row, or `UNRANKED`. Case-insensitive on code and name. */
export function languageRank(language: {
  name: string;
  codeAlpha2?: string | null;
}): number {
  const code = language.codeAlpha2 ? fold(language.codeAlpha2) : null;
  // "Spanish, Castilian" — any comma-separated part of the name counts.
  const names = language.name.split(",").map(fold);
  const index = PREFERRED_LANGUAGES.findIndex(
    (preferred) =>
      preferred.code === code ||
      preferred.names.some((name) => names.includes(fold(name))),
  );
  return index === -1 ? UNRANKED : index;
}

/**
 * The country's place in the preferred row: the youth's own country (the profile's, or the
 * session answer — `homeCountryId`) first, Worldwide next, or `UNRANKED`.
 */
export const countryRank =
  (homeCountryId: string | null) =>
  (country: { id: string; codeAlpha2?: string | null }): number => {
    if (homeCountryId !== null && country.id === homeCountryId) return 0;
    if (fold(country.codeAlpha2 ?? "") === fold(COUNTRY_CODE_WW)) return 1;
    return UNRANKED;
  };

/** By name, case- and accent-insensitive, so "éwé" sits between "Estonian" and "Fijian". */
export function alphabetical<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function orderOptions<T extends { name: string }>(
  items: T[],
  rank: (item: T) => number,
): OptionOrder<T> {
  const expanded = alphabetical(items);
  const preferred = expanded
    .map((item) => ({ item, rank: rank(item) }))
    .filter((entry) => entry.rank !== UNRANKED)
    // Stable: two options of one rank (a duplicate code) keep their alphabetical order.
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.item);
  const pinned = new Set(preferred);
  return {
    collapsed: [...preferred, ...expanded.filter((item) => !pinned.has(item))],
    expanded,
  };
}
