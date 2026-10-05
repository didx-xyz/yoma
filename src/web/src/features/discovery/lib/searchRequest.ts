import { toApiCoordinates } from "~/api/models/location";
import {
  FilterSortOrder,
  OpportunitySearchOrderField,
  UnspecifiedMatch,
  type OpportunitySearchFilterCountry,
  type OpportunitySearchFilterZltoReward,
  type OpportunitySearchGroup,
  type OpportunitySearchOrdering,
  type OpportunitySearchRequest,
  type SearchCriterion,
} from "~/api/models/opportunity";
import { COUNTRY_CODE_WW, OPPORTUNITY_TYPE_NANE_JOB } from "~/lib/constants";
import { LOCATION_SEARCH_LIVE } from "./location";
import type { DiscoverySearch } from "./preferenceMapping";
import { categoryIdByName } from "./preferenceMapping";
import type { DiscoveryFilters, DiscoverySort } from "./types";

/**
 * The composed search (`composeSearch`) → the `/opportunity/search` request, typed for the wire
 * (the revised contract, 2026-10-03). Pure; the ONE place the request is built, shared by the
 * results, the live count, the landing rails and the wizard's live count, so no two of them can
 * disagree. `searchOpportunities` takes it as it is: typed criteria pass through the converter
 * untouched.
 *
 * The API applies no preferences, so provenance is decided here:
 * - engagement and accommodations carry their mode — `Include` while inherited only, `Exclude`
 *   once the youth picks one by hand;
 * - the "Start a business" goal and the saved skills become OR groups;
 * - the inherited home country brings Worldwide along.
 * Every other criterion goes without a mode, so the API's default applies. `types`,
 * `organizations` and `rewardTypes` never carry one (the API rejects every mode there), and no UI
 * sends `Only`.
 *
 * The URL and state carry the Opportunity Type enum NAME; the search filters types by id, so the
 * caller supplies the loaded lookups. The view mode is deliberately NOT a parameter here: it is a
 * rendering choice and must never reach the query.
 */

/**
 * The lookups the request resolves through; `DiscoveryLookups` satisfies it. Worldwide and the
 * goal's category are found by code and name, so a list that failed to load degrades the request
 * (no Worldwide entry; the goal's type alone) rather than blocking it.
 */
export interface SearchLookups {
  /** Opportunity Type enum name → id. */
  typeIdByName: Record<string, string>;
  categories: { id: string; name: string }[];
  countries: { id: string; codeAlpha2: string }[];
}

/**
 * The sort → `ordering` (2026-10-03). Newest is the API's own default order — the "Newest on
 * Yoma" rail's — so it sends none. The others break ties (and order the nulls, which sort last)
 * newest first, rather than by id.
 */
const ORDERING: Record<DiscoverySort, OpportunitySearchOrdering[] | undefined> =
  {
    newest: undefined,
    endingSoonest: [
      {
        field: OpportunitySearchOrderField.DateEnd,
        direction: FilterSortOrder.Ascending,
      },
      {
        field: OpportunitySearchOrderField.DateCreated,
        direction: FilterSortOrder.Descending,
      },
    ],
    mostZlto: [
      {
        field: OpportunitySearchOrderField.ZltoReward,
        direction: FilterSortOrder.Descending,
      },
      {
        field: OpportunitySearchOrderField.DateCreated,
        direction: FilterSortOrder.Descending,
      },
    ],
  };

/** A list criterion, left out when empty. */
const listCriterion = (
  value: string[],
  unspecified?: UnspecifiedMatch,
): SearchCriterion<string[]> | undefined => {
  if (value.length === 0) return undefined;
  return unspecified ? { value, unspecified } : { value };
};

/** Inherited only → opportunities that haven't said stay in; any manual pick → they don't. */
const modeByProvenance = (inheritedOnly: boolean): UnspecifiedMatch =>
  inheritedOnly ? UnspecifiedMatch.Include : UnspecifiedMatch.Exclude;

const typeIdsOf = (
  names: string[],
  typeIdByName: Record<string, string>,
): string[] =>
  names.map((name) => typeIdByName[name]).filter((id): id is string => !!id);

/** The surviving goal's category alternative, resolved from the lookup by name. */
const goalCategoryId = (
  search: DiscoverySearch,
  lookups: SearchLookups,
): string | null =>
  search.goalCategoryNames
    ? categoryIdByName(lookups.categories, search.goalCategoryNames)
    : null;

/**
 * "Start a business": the effective types OR the goal's category, as one group, and NO root
 * `types` — a root `types` AND the group would turn "Event + Start a business" into "Events in
 * the Business category". The manual types therefore fold into the type branch. `null` when the
 * category cannot be resolved: the types then go out as a root criterion, the goal's type alone.
 */
function goalGroup(
  search: DiscoverySearch,
  typeIds: string[],
  lookups: SearchLookups,
): OpportunitySearchGroup | null {
  const categoryId = goalCategoryId(search, lookups);
  if (!categoryId) return null;
  return {
    anyOf: [
      ...(typeIds.length > 0 ? [{ types: { value: typeIds } }] : []),
      { categories: { value: [categoryId] } },
    ],
  };
}

/**
 * Whether the inherited skills have a Job to narrow: there are some, and the search can return a
 * Job — it names no type, names Job, or carries the goal's category branch (which admits every
 * type). Otherwise their group would do nothing, so it is not sent.
 */
export function jobSkillsApply(
  search: DiscoverySearch,
  lookups: SearchLookups,
): boolean {
  const { types, skills } = search.filters;
  return (
    skills.length > 0 &&
    (types.length === 0 ||
      types.includes(OPPORTUNITY_TYPE_NANE_JOB) ||
      goalCategoryId(search, lookups) !== null)
  );
}

/**
 * The saved skills narrow Jobs only, and inclusively (2026-10-03): every other type, OR a Job that
 * asks for one of the skills or lists none. The partner job feeds set no skills, so a strict
 * branch would hide every partner job. Type ids come from the lookup; the API has no "not Job".
 */
function jobSkillsGroup(
  search: DiscoverySearch,
  lookups: SearchLookups,
): OpportunitySearchGroup | null {
  const jobId = lookups.typeIdByName[OPPORTUNITY_TYPE_NANE_JOB];
  if (!jobId || !jobSkillsApply(search, lookups)) return null;
  const otherTypeIds = Object.entries(lookups.typeIdByName)
    .filter(([name]) => name !== OPPORTUNITY_TYPE_NANE_JOB)
    .map(([, id]) => id);
  return {
    anyOf: [
      ...(otherTypeIds.length > 0 ? [{ types: { value: otherTypeIds } }] : []),
      {
        types: { value: [jobId] },
        skills: {
          value: search.filters.skills,
          unspecified: UnspecifiedMatch.Include,
        },
      },
    ],
  };
}

/**
 * The country entries, which are alternatives. One entry per country: the API rejects duplicates.
 * - The place — region / city, or a point + radius, never both — attaches to the one REAL country
 *   when the search is for exactly one: it means nothing across several, and the API rejects any
 *   detail on Worldwide.
 * - The inherited home country brings a plain Worldwide entry, as the legacy page does (Alison
 *   lists every course as Worldwide), unless a radius is on: a distance search is a deliberate
 *   "near me" (2026-10-03). Request-only: Worldwide never enters the effective filters, so the
 *   Where controls, the chips and the summaries never see it.
 */
function countryEntries(
  search: DiscoverySearch,
  lookups: SearchLookups,
): OpportunitySearchFilterCountry[] | undefined {
  const { filters } = search;
  const worldwideId =
    lookups.countries.find(
      (c) => c.codeAlpha2?.toUpperCase() === COUNTRY_CODE_WW,
    )?.id ?? null;
  const entries: OpportunitySearchFilterCountry[] = [
    ...new Set(filters.countries),
  ].map((countryId) => ({ countryId }));

  const only = entries.length === 1 ? entries[0]! : null;
  if (LOCATION_SEARCH_LIVE && only && only.countryId !== worldwideId) {
    const coordinates = toApiCoordinates(filters.point);
    if (filters.radiusKm !== null && coordinates)
      only.radius = { value: { coordinates, radiusKm: filters.radiusKm } };
    else {
      if (filters.region) only.region = { value: filters.region };
      if (filters.city) only.city = { value: filters.city };
    }
  }

  const radiusOn = only?.radius !== undefined;
  if (
    search.inheritedCountry &&
    !radiusOn &&
    worldwideId !== null &&
    !entries.some((entry) => entry.countryId === worldwideId)
  )
    entries.push({ countryId: worldwideId });

  return entries.length > 0 ? entries : undefined;
}

/**
 * Ranges, or a positive "With ZLTO" — never both, which the API rejects as mutually exclusive and
 * the Paid and rewards section lets a youth pick: the ranges, the narrower ask, go alone. Never
 * `hasReward: false` on its own either, which filters nothing. Only the member in use goes out.
 */
function zltoReward(
  filters: DiscoveryFilters,
): SearchCriterion<Partial<OpportunitySearchFilterZltoReward>> | undefined {
  if (filters.zltoRanges.length > 0)
    return { value: { ranges: filters.zltoRanges } };
  if (filters.hasReward === true) return { value: { hasReward: true } };
  return undefined;
}

/** Every criterion — no paging and no order: the results and the count add what they need. */
function buildCriteria(
  search: DiscoverySearch,
  lookups: SearchLookups,
): OpportunitySearchRequest {
  const { filters, inheritedOnly } = search;
  const typeIds = typeIdsOf(filters.types, lookups.typeIdByName);
  const goal = goalGroup(search, typeIds, lookups);
  const groups = [goal, jobSkillsGroup(search, lookups)].filter(
    (group): group is OpportunitySearchGroup => group !== null,
  );

  const request: OpportunitySearchRequest = {
    valueContains: filters.q ?? undefined,
    featured: filters.featured ?? undefined,
    types: goal ? undefined : listCriterion(typeIds),
    categories: listCriterion(filters.categories),
    countries: countryEntries(search, lookups),
    languages: listCriterion(filters.languages),
    engagementTypes: listCriterion(
      filters.engagementTypes,
      modeByProvenance(inheritedOnly.engagementTypes),
    ),
    // The private Other description never goes out: needs are matched by id only.
    accommodations: listCriterion(
      filters.accommodations,
      modeByProvenance(inheritedOnly.accommodations),
    ),
    sustainableDevelopmentGoals: listCriterion(filters.sdgs),
    // A maximum: only the interval goes out, never a null `options` beside it.
    commitmentInterval: filters.commitment
      ? {
          value: {
            interval: {
              id: filters.commitment.intervalId,
              count: filters.commitment.count,
            },
          },
        }
      : undefined,
    // Root and without a mode, always: only that shape lists the explicit matches before the
    // unknowns (the results' incentive divider relies on it). Never moved into a group.
    incentivized:
      filters.incentivized === null
        ? undefined
        : { value: filters.incentivized },
    zltoReward: zltoReward(filters),
    provider: filters.provider ? { value: filters.provider } : undefined,
    age: filters.age ?? undefined,
    // Root, as they are: the API scopes each clause to its definition's type.
    customFields:
      filters.customFields.length > 0 ? filters.customFields : undefined,
    groups: groups.length > 0 ? groups : undefined,
  };

  return withoutAbsent(request);
}

/** Absent members stay absent, so the body — and the query key built from it — is stable. */
const withoutAbsent = (
  request: OpportunitySearchRequest,
): OpportunitySearchRequest =>
  Object.fromEntries(
    Object.entries(request).filter(([, value]) => value !== undefined),
  ) as OpportunitySearchRequest;

/** One page of results, in the chosen order. */
export function buildSearchFilter(
  search: DiscoverySearch,
  sort: DiscoverySort,
  page: number,
  pageSize: number,
  lookups: SearchLookups,
): OpportunitySearchRequest {
  return withoutAbsent({
    pageNumber: page,
    pageSize,
    ...buildCriteria(search, lookups),
    // Never with `mostViewed` / `mostCompleted`, which discovery does not send.
    ordering: ORDERING[sort],
  });
}

/**
 * The live count's request: the results request without paging or order, as a count-only search
 * (`totalCountOnly`) — no items loaded, and the same criteria, so the count and what "Show N
 * results" returns cannot disagree. Without the order, a sort change refetches no count. One
 * request per effective combination: there is no batched count.
 */
export function buildCountFilter(
  search: DiscoverySearch,
  lookups: SearchLookups,
): OpportunitySearchRequest {
  return { ...buildCriteria(search, lookups), totalCountOnly: true };
}
