import type { UserGoal } from "~/api/models/userPreferences";
import { QUICK_SEARCHES } from "../registry/quickSearches";
import { upToIntervalLabel } from "./format";
import type {
  DiscoverySearch,
  InheritedFragment,
  InheritedFragments,
} from "./preferenceMapping";
import {
  applyInheritedFragments,
  composeSearch,
  manualSearch,
  survivingFragments,
} from "./preferenceMapping";
import type { SearchLookups } from "./searchRequest";
import { buildSearchFilter, DISCOVERY_PAGE_SIZE } from "./searchRequest";
import type { DiscoveryFilters, DiscoveryState, PreferenceKey } from "./types";
import {
  DEFAULT_DISCOVERY_STATE,
  EMPTY_DISCOVERY_FILTERS,
  hasActiveFilters,
} from "./types";
import { serializeDiscoveryState } from "./urlCodec";

/**
 * The landing rails, generated from the preferences (Jason, 2026-10-07). Pure: the landing renders
 * the list, and each rail fetches its own search once it scrolls into view (`useRailResults`).
 *
 * The approved catalogue, in order:
 * 1. `picked`: Picked for you, while any preference applies. The context's own search, the whole
 *    preference layer.
 * 2. `near`: the place alone, while there is one.
 * 3. `goal`: the surviving goal, with its semantics ("Start a business" also ORs its category).
 * 4. `category:<id>`: one per surviving saved category, in the youth's order, every one of
 *    them (Jason, 2026-10-08; capped at 3 the day before). Each loads only as it nears the
 *    viewport, so a long list costs nothing until it is scrolled to.
 * 5. `commitment`: the surviving time commitment; without one, `under-an-hour` (the quick search's
 *    filter set).
 * 6. `paid`: while the youth asked for paid opportunities (`incentivized === true`).
 * 7. `featured`, always.
 * 8. `latest`, always: the place alone, or everything when there is none.
 *
 * Every rail but Picked for you sits on the PLACE BASE LAYER: the surviving `country` and
 * `location` fragments, as `applyInheritedFragments` applies them (the place only while its
 * country survives). It goes into the rail's search as plain manual filters with preferences off,
 * so the rail's See all (the same filters, `prefsOff=1`) composes the identical request: the
 * same page-1 query key, a cache hit on arrival. A rail whose page-1 request repeats an earlier
 * one's is dropped (no place: Near you is absent; Latest collapses into Near you when there is
 * one). There is no cap on the whole list (Jason, 2026-10-07): at most 9 rails.
 *
 * With no preference in play (switched off, none saved, every one skipped) the list is today's:
 * Featured · Latest opportunities · Done in under an hour, with no place.
 *
 * Accessibility needs are private (2026-10-03): only Picked for you applies them, and no See all
 * names them.
 */

export type LandingRailKind =
  | "picked"
  | "near"
  | "goal"
  | "category"
  | "commitment"
  | "under-an-hour"
  | "paid"
  | "featured"
  | "latest";

/** The place under a rail, as names to title it with ("Near Cape Town", "In South Africa"). */
export interface RailPlace {
  countryId: string;
  /** From the countries lookup; `null` when the lookup does not list the country. */
  countryName: string | null;
  region: string | null;
  city: string | null;
}

interface LandingRailBase {
  /** Stable across renders: "picked", "near", `category:<id>`, … — the React key. */
  id: string;
  /** What the rail fetches: `buildSearchFilter(search, "newest", page, DISCOVERY_PAGE_SIZE)`. */
  search: DiscoverySearch;
  /**
   * The rail's own search, preference layer and all (Picked for you), so it waits on the
   * surface's gate (`searchReady`). Every other rail waits only for the preferences to settle.
   */
  personalized: boolean;
  /** The See all link's query string; `""` (a search with no filter of its own) draws none. */
  seeAllQueryString: string;
  /**
   * Whether the See all's page 1 is exactly this rail's request, so the count on the link is the
   * count it opens. `false` only for the "Start a business" goal rail while its category resolves:
   * the URL has no way to say "this type OR that category", so its See all opens the type alone,
   * a subset. Draw that link without the number.
   */
  seeAllExact: boolean;
  /** The base place under the rail; `null` on Picked for you and when no place applies. */
  place: RailPlace | null;
}

export type LandingRail = LandingRailBase &
  (
    | { kind: "picked" }
    | { kind: "near"; place: RailPlace }
    | { kind: "goal"; goal: UserGoal }
    | {
        kind: "category";
        category: { id: string; name: string; imageURL: string | null };
      }
    /** "Up to a week"; `null` when the intervals lookup does not list the saved one. */
    | { kind: "commitment"; intervalLabel: string | null }
    | { kind: "under-an-hour" | "paid" | "featured" | "latest" }
  );

/** The lookups the rails resolve names and the request through; `DiscoveryLookups` satisfies it. */
export interface LandingRailLookups extends SearchLookups {
  categories: { id: string; name: string; imageURL?: string | null }[];
  countries: { id: string; name: string; codeAlpha2: string }[];
  timeIntervals: { id: string; name: string }[];
  engagementTypes: { id: string; name: string }[];
}

export interface LandingRailsInput {
  fragments: InheritedFragments;
  preferencesOff: boolean;
  preferencesSkipped: PreferenceKey[];
  /**
   * Interests switched off one by one. `fragments` already leaves them out (the context's are
   * `withoutSkippedInterests`); Picked for you's See all carries them, so the destination
   * leaves them out too. Omitted: none.
   */
  interestsSkipped?: string[];
  /** The surface's own search (`useDiscovery().search`): Picked for you's. */
  search: DiscoverySearch;
  /**
   * Whether any preference applies, as the landing reads it today: `inheritedSummary(chips)` names
   * or counts at least one value.
   */
  personalized: boolean;
  lookups: LandingRailLookups;
}

/**
 * A See all link: `""`, which draws none, when its search has no filter of its own. Without one
 * the surface shows the landing (`hasActiveFilters`), never the rail's set, which is why "Latest
 * opportunities" without a place carries `all` (2026-10-08).
 */
export const seeAllOf = (state: DiscoveryState): string =>
  hasActiveFilters(state.filters) ? serializeDiscoveryState(state) : "";

/** The page-1 request, as the query key compares it: what duplicates are dropped by. */
const requestKey = (search: DiscoverySearch, lookups: SearchLookups): string =>
  JSON.stringify(
    buildSearchFilter(search, "newest", 1, DISCOVERY_PAGE_SIZE, lookups),
  );

type PlaceFilters = Pick<
  DiscoveryFilters,
  "countries" | "region" | "city" | "point"
>;

/** The surviving country and location, applied as the preference layer applies them. */
function basePlace(
  fragments: InheritedFragments,
  preferencesOff: boolean,
  skipped: PreferenceKey[],
): PlaceFilters {
  const placeFragments: InheritedFragments = {};
  if (fragments.country) placeFragments.country = fragments.country;
  if (fragments.location) placeFragments.location = fragments.location;
  const { countries, region, city, point } = applyInheritedFragments(
    EMPTY_DISCOVERY_FILTERS,
    placeFragments,
    preferencesOff,
    skipped,
  );
  return { countries, region, city, point };
}

export function landingRails({
  fragments,
  preferencesOff,
  preferencesSkipped,
  interestsSkipped = [],
  search,
  personalized,
  lookups,
}: LandingRailsInput): LandingRail[] {
  const surviving = new Map<PreferenceKey, InheritedFragment>(
    survivingFragments(fragments, preferencesOff, preferencesSkipped),
  );
  const placeFilters = basePlace(fragments, preferencesOff, preferencesSkipped);
  const countryId = placeFilters.countries[0] ?? null;
  const place: RailPlace | null = countryId
    ? {
        countryId,
        countryName:
          lookups.countries.find((c) => c.id === countryId)?.name ?? null,
        region: placeFilters.region,
        city: placeFilters.city,
      }
    : null;

  /**
   * A rail over `extra` on the base place. Manual filters with preferences off, both in the rail
   * and in its See all, so the destination composes the same search (`manualSearch`). The goal
   * passes its fragment, which `composeSearch` alone turns into the type OR its category.
   */
  const onPlace = (
    extra: Partial<DiscoveryFilters>,
    goal?: InheritedFragment,
  ): Pick<
    LandingRailBase,
    "search" | "personalized" | "seeAllQueryString" | "seeAllExact" | "place"
  > => {
    const base: DiscoveryFilters = {
      ...EMPTY_DISCOVERY_FILTERS,
      ...placeFilters,
    };
    const filters: DiscoveryFilters = { ...base, ...extra };
    const plain = manualSearch(filters);
    const railSearch = goal ? composeSearch(base, { goal }, false, []) : plain;
    return {
      search: railSearch,
      personalized: false,
      seeAllQueryString: seeAllOf({
        ...DEFAULT_DISCOVERY_STATE,
        filters,
        preferencesOff: true,
      }),
      seeAllExact:
        requestKey(railSearch, lookups) === requestKey(plain, lookups),
      place,
    };
  };

  const featured: LandingRail = {
    id: "featured",
    kind: "featured",
    ...onPlace({ featured: true }),
  };
  // With no place its set has no filter, so its See all carries "All opportunities" (`all`,
  // 2026-10-08), which the API never sees: the destination's request is still the rail's.
  const latest: LandingRail = {
    id: "latest",
    kind: "latest",
    ...onPlace(placeFilters.countries.length > 0 ? {} : { all: true }),
  };

  // The quick search's own filter set; absent until the Hour interval resolves. It reads the
  // intervals only, so it gets none of the youth's own context.
  const underAnHourFilters = QUICK_SEARCHES.find(
    (q) => q.id === "under-an-hour",
  )?.resolve({
    profileCountry: null,
    hasPoint: false,
    categories: lookups.categories,
    commitmentIntervals: lookups.timeIntervals,
    engagementTypes: lookups.engagementTypes,
  });
  const underAnHour: LandingRail | null = underAnHourFilters
    ? {
        id: "under-an-hour",
        kind: "under-an-hour",
        ...onPlace(underAnHourFilters),
      }
    : null;

  const picked = (): LandingRail => {
    // The inherited values go into the URL as the destination's own, and the skips with them, so
    // it composes this search again (`composeSearch` unions a manual duplicate of an inherited
    // value back into the same criterion, mode and all). Except the accessibility needs, which
    // are private: the destination inherits them, as this rail does. Skills and age have no
    // parameter and are inherited there too.
    const inheritedNeeds = fragments.accessibility?.accommodations ?? [];
    return {
      id: "picked",
      kind: "picked",
      search,
      personalized: true,
      seeAllQueryString: seeAllOf({
        ...DEFAULT_DISCOVERY_STATE,
        filters: {
          ...search.filters,
          accommodations: search.filters.accommodations.filter(
            (id) => !inheritedNeeds.includes(id),
          ),
        },
        preferencesSkipped,
        interestsSkipped,
      }),
      seeAllExact: true,
      place: null,
    };
  };

  // Nothing of the youth's in play: today's three, in today's order.
  if (surviving.size === 0)
    return dedupe(
      [
        ...(personalized && !preferencesOff ? [picked()] : []),
        featured,
        latest,
        ...(underAnHour ? [underAnHour] : []),
      ],
      lookups,
    );

  const rails: LandingRail[] = [];
  if (personalized && !preferencesOff) rails.push(picked());
  if (place) rails.push({ id: "near", kind: "near", ...onPlace({}), place });

  const goal = surviving.get("goal");
  if (goal?.userGoal && goal.types)
    rails.push({
      id: "goal",
      kind: "goal",
      goal: goal.userGoal,
      ...onPlace({ types: goal.types }, goal),
    });

  // Only categories the lookup lists: it lists the ones published opportunities use, so any
  // other would be an empty rail, and it has no name to title one with. One the lookup lacks
  // takes no slot of the cap.
  for (const id of surviving.get("targetCategories")?.categories ?? []) {
    const category = lookups.categories.find((c) => c.id === id);
    if (category)
      rails.push({
        id: `category:${id}`,
        kind: "category",
        category: {
          id,
          name: category.name,
          imageURL: category.imageURL ?? null,
        },
        ...onPlace({ categories: [id] }),
      });
  }

  const commitment = surviving.get("maxCommitment")?.commitment;
  if (commitment) {
    const interval = lookups.timeIntervals.find(
      (i) => i.id === commitment.intervalId,
    );
    rails.push({
      id: "commitment",
      kind: "commitment",
      intervalLabel: interval ? upToIntervalLabel(interval.name) : null,
      ...onPlace({ commitment }),
    });
  } else if (underAnHour) rails.push(underAnHour);

  if (surviving.get("incentivized")?.incentivized === true)
    rails.push({
      id: "paid",
      kind: "paid",
      ...onPlace({ incentivized: true }),
    });

  rails.push(featured, latest);
  return dedupe(rails, lookups);
}

/** Drops a rail whose page-1 request repeats an earlier rail's. */
function dedupe(rails: LandingRail[], lookups: SearchLookups): LandingRail[] {
  const seen = new Set<string>();
  return rails.filter((rail) => {
    const key = requestKey(rail.search, lookups);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
