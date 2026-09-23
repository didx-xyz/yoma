/**
 * Engagement-type display names — the ONE map, used by cards, applied chips, the Engagement
 * section, the search-bar segment and wizard step 4.
 *
 * TEMPORARY. The BA sign-off (2026-09-22) renames the lookup values — Remote replaces Online,
 * On-site replaces Offline, Hybrid stays — with the reference IDs preserved. Until the API ships
 * that rename this module translates; once it has, every entry becomes identity and the module
 * can be deleted without touching a consumer. Keyed by the lookup NAME (a core Opportunity
 * lookup, not a custom field), and unknown names pass through unchanged.
 */
const ENGAGEMENT_DISPLAY_NAMES: Record<string, string> = {
  Online: "Remote",
  Offline: "On-site",
  Hybrid: "Hybrid",
};

export const engagementLabel = (name: string): string =>
  ENGAGEMENT_DISPLAY_NAMES[name] ?? name;

/**
 * The lookup names a designed value may currently carry — the new BA name first, then the
 * legacy one — so a badge or mapping can resolve "Remote" against whichever the API serves.
 */
export const ENGAGEMENT_NAME_ALIASES: Record<string, string[]> = {
  Remote: ["Remote", "Online"],
  "On-site": ["On-site", "Offline"],
  Hybrid: ["Hybrid"],
};
