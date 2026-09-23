import type { IconType } from "react-icons";
import {
  IoAccessibilityOutline,
  IoBriefcaseOutline,
  IoFlashOutline,
  IoGlobeOutline,
  IoLeafOutline,
  IoLocationOutline,
  IoSchoolOutline,
  IoTimeOutline,
  IoWifiOutline,
} from "react-icons/io5";
import { ENGAGEMENT_NAME_ALIASES } from "../lib/engagementLabels";
import type { DiscoveryFilters } from "../lib/types";

/**
 * Quick-search badges — each one is a saved FILTER SET, never a keyword: it composes with the
 * search box, tapping applies the set it owns, tapping again clears only what it added. Curated
 * and hard-coded for phase one; later they can be seeded from a youth's own preferences.
 *
 * Only what filters TODAY renders (2026-09-22 client feedback): a `shipped` badge whose criteria
 * resolve is drawn; one whose criteria cannot resolve right now (no profile country, lookups not
 * loaded) is simply absent — there is no SOON state, no tooltip, no greyed placeholder. `parked`
 * badges stay in the registry as the record of what is designed and what it waits on; they never
 * render. The ones that depend on custom fields deliberately carry NO definition keys — nothing
 * on this surface may be keyed to a specific custom field, and the BA set is not seeded yet.
 *
 * Badges resolve against runtime context (profile country, loaded lookups) rather than
 * hardcoding lookup ids. Where a lookup is mid-rename (categories to the 16-value taxonomy,
 * engagement types to Remote / On-site / Hybrid) the resolver accepts the new name first, then
 * the legacy one, so the badge works on whichever the environment serves.
 */

export interface QuickSearchContext {
  profileCountry: { id: string; name: string } | null;
  categories: { id: string; name: string }[];
  commitmentIntervals: { id: string; name: string }[];
  engagementTypes: { id: string; name: string }[];
}

export interface QuickSearchDef {
  id: string;
  icon: IconType;
  /** Static label, or a context-aware one (e.g. "Jobs in South Africa"). */
  label: string | ((ctx: QuickSearchContext) => string);
  /**
   * `shipped` renders whenever its criteria resolve. `parked` never renders — `needs` names the
   * API field or decision it waits on, for the reference page and the docs.
   */
  status: "shipped" | "parked";
  needs: string | null;
  /**
   * The filter set this badge owns. `null` = cannot apply right now (missing context) → the
   * badge is not drawn.
   */
  resolve: (ctx: QuickSearchContext) => Partial<DiscoveryFilters> | null;
}

/** Exact, case-insensitive match against the first name in the list the lookup carries. */
const byName = (
  items: { id: string; name: string }[],
  names: readonly string[],
): { id: string; name: string } | null => {
  for (const name of names) {
    const hit = items.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    if (hit) return hit;
  }
  return null;
};

/** The approved taxonomy name first, the pre-migration name second (YOM-1259). */
const CLIMATE_CATEGORY_NAMES = [
  "Agriculture, Food, Environment and Climate",
  "Environment and Climate",
] as const;

export const QUICK_SEARCHES: QuickSearchDef[] = [
  {
    id: "under-an-hour",
    icon: IoTimeOutline,
    label: "Under an hour",
    status: "shipped",
    needs: null,
    resolve: (ctx) => {
      const hour = byName(ctx.commitmentIntervals, ["Hour"]);
      return hour ? { commitment: { intervalId: hour.id, count: 1 } } : null;
    },
  },
  {
    id: "climate-action",
    icon: IoLeafOutline,
    label: "Climate action",
    status: "shipped",
    needs: null,
    resolve: (ctx) => {
      const category = byName(ctx.categories, CLIMATE_CATEGORY_NAMES);
      return category ? { categories: [category.id] } : null;
    },
  },
  {
    id: "remote",
    icon: IoWifiOutline,
    label: "Remote",
    status: "shipped",
    needs: null,
    resolve: (ctx) => {
      const remote = byName(
        ctx.engagementTypes,
        ENGAGEMENT_NAME_ALIASES.Remote ?? [],
      );
      return remote ? { engagementTypes: [remote.id] } : null;
    },
  },
  // Renders only for a signed-in youth whose profile has a country; anonymous users never see it.
  {
    id: "jobs-in-country",
    icon: IoBriefcaseOutline,
    label: (ctx) =>
      ctx.profileCountry
        ? `Jobs in ${ctx.profileCountry.name}`
        : "Jobs in my country",
    status: "shipped",
    needs: null,
    resolve: (ctx) =>
      ctx.profileCountry
        ? { types: ["Job"], countries: [ctx.profileCountry.id] }
        : null,
  },

  // ── Parked until the fields exist — kept as the record of the designed set, never rendered.
  {
    id: "paid-remote",
    icon: IoFlashOutline,
    label: "Paid & remote",
    status: "parked",
    needs: "Is Paid (core field, YOM-1264)",
    resolve: () => null,
  },
  {
    id: "no-experience",
    icon: IoSchoolOutline,
    label: "No experience needed",
    status: "parked",
    needs: "Job fields — Experience Level, Minimum Qualification (YOM-1264)",
    resolve: () => null,
  },
  {
    id: "accommodations",
    icon: IoAccessibilityOutline,
    label: "With accommodations",
    status: "parked",
    needs: "Accessibility Support (core field, YOM-1264)",
    resolve: () => null,
  },
  {
    id: "climate-sdg13",
    icon: IoGlobeOutline,
    label: "Climate action + SDG 13",
    status: "parked",
    needs: "SDGs (core field, YOM-1264)",
    resolve: () => null,
  },
  {
    id: "jobs-near-me",
    icon: IoLocationOutline,
    label: "Jobs near me",
    status: "parked",
    needs: "User Location decision (Adrian) — coordinates",
    resolve: () => null,
  },
];
