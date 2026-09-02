import type { IconType } from "react-icons";
import {
  IoAccessibilityOutline,
  IoBriefcaseOutline,
  IoFlashOutline,
  IoLeafOutline,
  IoLocationOutline,
  IoSchoolOutline,
  IoTimeOutline,
} from "react-icons/io5";
import type { DiscoveryFilters } from "../lib/types";

/**
 * Quick-search badges — each one is a saved FILTER SET, never a keyword: it composes with the
 * search box, tapping applies the set it owns, tapping again clears only what it added. Curated
 * and hard-coded for phase one; later they can be seeded from a youth's own preferences. Keep to
 * seven or fewer so the desktop row never wraps.
 *
 * Badges resolve against runtime context (profile country, loaded lookups) rather than hardcoding
 * lookup ids. A badge whose criteria cannot be resolved — or whose target the search API cannot
 * filter on yet — renders visible but unavailable with a note, never failing silently.
 */

export interface QuickSearchContext {
  profileCountry: { id: string; name: string } | null;
  categories: { id: string; name: string }[];
  commitmentIntervals: { id: string; name: string }[];
}

export interface QuickSearchDef {
  id: string;
  icon: IconType;
  /** Static label, or a context-aware one (e.g. "Jobs in South Africa"). */
  label: string | ((ctx: QuickSearchContext) => string);
  /** Shown when the badge cannot currently apply — the SOON tooltip. */
  unavailableNote: string | null;
  /**
   * The filter set this badge owns. `null` = not applicable right now (missing context, or the
   * facet has no API backing yet) → the badge greys out with `unavailableNote`.
   */
  resolve: (ctx: QuickSearchContext) => Partial<DiscoveryFilters> | null;
}

const pendingFields = (what: string) =>
  `${what} arrives with the finalised opportunity field definitions (YOM-1264).`;

export const QUICK_SEARCHES: QuickSearchDef[] = [
  {
    id: "jobs-near-me",
    icon: IoLocationOutline,
    label: "Jobs near me",
    unavailableNote:
      "Coming soon — needs your location, which Yoma doesn't collect yet.",
    resolve: () => null, // Phase two: pending the User Location decision (Adrian).
  },
  {
    id: "jobs-in-country",
    icon: IoBriefcaseOutline,
    label: (ctx) =>
      ctx.profileCountry
        ? `Jobs in ${ctx.profileCountry.name}`
        : "Jobs in my country",
    unavailableNote: "Set your country in your profile to use this one.",
    resolve: (ctx) =>
      ctx.profileCountry
        ? { type: "Job", countries: [ctx.profileCountry.id] }
        : null,
  },
  {
    id: "paid-remote",
    icon: IoFlashOutline,
    label: "Paid & remote",
    unavailableNote: pendingFields("The paid-work filter"),
    resolve: () => null, // "Is paid" is an opportunity field the search API cannot filter on yet.
  },
  {
    id: "no-experience",
    icon: IoSchoolOutline,
    label: "No experience needed",
    unavailableNote: pendingFields("The experience-level filter"),
    resolve: () => null, // Experience level / minimum qualification are pending BA fields.
  },
  {
    id: "under-an-hour",
    icon: IoTimeOutline,
    label: "Under an hour",
    unavailableNote: null,
    resolve: (ctx) => {
      const hour = ctx.commitmentIntervals.find((i) => i.name === "Hour");
      return hour ? { commitment: { intervalId: hour.id, count: 1 } } : null;
    },
  },
  {
    id: "accommodations",
    icon: IoAccessibilityOutline,
    label: "With accommodations",
    unavailableNote: pendingFields("The accommodations filter"),
    resolve: () => null, // Accessibility accommodations are pending BA fields.
  },
  {
    id: "climate-action",
    icon: IoLeafOutline,
    label: "Climate action",
    unavailableNote: null,
    resolve: (ctx) => {
      const category = ctx.categories.find((c) =>
        c.name.toLowerCase().includes("environment"),
      );
      return category ? { categories: [category.id] } : null;
    },
  },
];
