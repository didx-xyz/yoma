/**
 * The order the type row (and every other type list on this surface) presents the Opportunity
 * Types in — by enum NAME, never by GUID or displayName. Labels keep coming from the lookup's
 * `displayName`; this is order only. A type the list does not know (a sixth type, tomorrow)
 * is appended after these in the order the API returned it, so nothing is ever dropped.
 */
export const TYPE_ORDER: readonly string[] = [
  "Job",
  "Learning",
  "Task",
  "Event",
  "Other",
];

export function sortTypes<T extends { name: string }>(types: T[]): T[] {
  const rank = (name: string): number => {
    const index = TYPE_ORDER.indexOf(name);
    return index === -1 ? TYPE_ORDER.length : index;
  };
  // Stable: equal ranks (all unknown types) keep the API's order.
  return [...types].sort((a, b) => rank(a.name) - rank(b.name));
}
