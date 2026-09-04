/**
 * Shared ordering for credential schema attributes.
 *
 * Static entity properties, custom fields and issued credential attributes all carry the same
 * API-owned presentation metadata (`group` / `subGroup` / `sortOrder`) and live in one shared
 * presentation space — a group name may legitimately be used by both a static property and a
 * custom field, and must then render once. Every surface that lists attributes orders them the
 * same way, so the rule lives here rather than being restated per component.
 */

/** The minimum an attribute must expose to be ordered. */
export interface AttributePresentation {
  attributeName: string;
  nameDisplay: string;
  /** Null = ungrouped. Ungrouped attributes sort after every configured group. */
  group: string | null;
  subGroup: string | null;
  sortOrder: number | null;
}

/** The heading an attribute belongs under, or null when it is ungrouped. */
export const groupLabelOf = (
  attribute: Pick<AttributePresentation, "group" | "subGroup">,
): string | null => {
  if (!attribute.group) return null;
  return attribute.subGroup
    ? `${attribute.group} › ${attribute.subGroup}`
    : attribute.group;
};

/**
 * Mirrors `SSIAttributePresentationHelper.Order` on the API: configured groups first, then
 * Group → SubGroup → SortOrder → display label → attribute name.
 */
export const byPresentationOrder = (
  a: AttributePresentation,
  b: AttributePresentation,
): number =>
  Number(!a.group) - Number(!b.group) ||
  (a.group ?? "").localeCompare(b.group ?? "") ||
  (a.subGroup ?? "").localeCompare(b.subGroup ?? "") ||
  (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
    (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
  a.nameDisplay.localeCompare(b.nameDisplay) ||
  a.attributeName.localeCompare(b.attributeName);
