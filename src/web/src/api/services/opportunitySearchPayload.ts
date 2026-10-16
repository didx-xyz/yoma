import type {
  AccessibilitySupport,
  CustomFieldFilter,
  OpportunitySearchCountryLocation,
  OpportunitySearchFilter,
  OpportunitySearchFilterAdmin,
  OpportunitySearchFilterCommitmentInterval,
  OpportunitySearchFilterCountry,
  OpportunitySearchFilterZltoReward,
  OpportunitySearchGroup,
  OpportunitySearchOrdering,
  OpportunitySearchRequest,
  OpportunitySearchRequestAdmin,
  OpportunitySearchRequestAdminCSV,
  PublishedState,
  RewardType,
  SearchCriterion,
  Status,
} from "../models/opportunity";

/**
 * The ONE conversion from a search caller's filter to the body the opportunity searches take
 * (`/opportunity/search`, `…/admin` and `…/admin/csv`; the revised contract of 2026-10-03). Pure,
 * with type-only imports, so `pnpm test` can load it without the API clients.
 *
 * The input is the flat filter the legacy and admin pages hold (`OpportunitySearchFilter*`), a
 * typed wire request (`OpportunitySearchRequest*`), or any mix: each criterion is read in the
 * form it arrives in.
 * - Flat: wrapped as `{ value }` with NO mode, so the API's default for that criterion applies.
 *   Nulls, empty lists and blank text are left out. Country ids become `{ countryId }` entries;
 *   `countryLocations` (region / city, or a point + radius) replaces them when set.
 * - Typed: a `SearchCriterion`, or a wire country entry, passes through untouched, mode and all.
 *   So do `groups` and `ordering`, unless empty.
 * Root controls (paging, published states, statuses, dates, featured, valueContains, popularity,
 * totalCountOnly) are never wrapped; a null one is left out, and so is one the target endpoint's
 * model lacks. Any other member is dropped too: the API rejects unknown members.
 */

/** What the search services accept. */
export type OpportunitySearchInput =
  | OpportunitySearchFilter
  | OpportunitySearchFilterAdmin
  | OpportunitySearchRequest
  | OpportunitySearchRequestAdmin;

/** The search a body is for. Each binds its own model and rejects the others' root controls. */
export type OpportunitySearchEndpoint = "youth" | "admin" | "adminCSV";

/** The body each endpoint takes. */
interface OpportunitySearchPayloads {
  youth: OpportunitySearchRequest;
  admin: OpportunitySearchRequestAdmin;
  adminCSV: OpportunitySearchRequestAdminCSV;
}

/** Every member any endpoint takes, before the target's foreign root controls are removed. */
type AllMembers = OpportunitySearchRequest & OpportunitySearchRequestAdmin;

/**
 * Root controls the endpoint's model lacks: the youth search binds `OpportunitySearchFilter`, the
 * admin search and the CSV export `OpportunitySearchFilterAdmin` (whose `PublishedStates` is
 * internal), and the export rejects count-only. Sent anyway, each is an unknown member — a 400.
 */
const NOT_ON_ENDPOINT: Record<
  OpportunitySearchEndpoint,
  readonly (keyof AllMembers)[]
> = {
  youth: ["statuses", "startDate", "endDate"],
  admin: ["publishedStates", "mostViewed", "mostCompleted"],
  adminCSV: [
    "publishedStates",
    "mostViewed",
    "mostCompleted",
    "totalCountOnly",
  ],
};

/** A criterion in either form. */
type Either<T> = T | SearchCriterion<T> | null | undefined;

/** Every member the conversion reads, in either form — each input type is assignable to it. */
interface SearchInputMembers {
  pageNumber?: number | null;
  pageSize?: number | null;
  publishedStates?: PublishedState[] | string[] | null;
  statuses?: Status[] | string[] | null;
  startDate?: string | null;
  endDate?: string | null;
  featured?: boolean | null;
  shareWithPartners?: boolean | null;
  valueContains?: string | null;
  mostViewed?: boolean | null;
  mostCompleted?: boolean | null;
  totalCountOnly?: boolean;
  groups?: OpportunitySearchGroup[];
  ordering?: OpportunitySearchOrdering[];
  provider?: Either<string>;
  incentivized?: Either<boolean>;
  rewardTypes?: Either<RewardType[]>;
  accessibilitySupport?: Either<AccessibilitySupport>;
  accommodationOtherDescription?: Either<string>;
  accommodations?: Either<string[]>;
  targetedGroups?: Either<string[]>;
  sustainableDevelopmentGoals?: Either<string[]>;
  age?: number | null;
  types?: Either<string[]>;
  categories?: Either<string[]>;
  languages?: Either<string[]>;
  countries?: string[] | OpportunitySearchFilterCountry[] | null;
  countryLocations?: OpportunitySearchCountryLocation[] | null;
  organizations?: Either<string[]>;
  engagementTypes?: Either<string[]>;
  skills?: Either<string[]>;
  commitmentInterval?: Either<
    Partial<OpportunitySearchFilterCommitmentInterval>
  >;
  zltoReward?: Either<Partial<OpportunitySearchFilterZltoReward>>;
  customFields?: CustomFieldFilter[] | null;
}

/** A list with entries; an empty one is left out (the API rejects empty groups and ordering). */
const nonEmpty = <T>(raw: T[] | null | undefined): T[] | undefined =>
  raw && raw.length > 0 ? raw : undefined;

/** Already a criterion: an object carrying `value` and / or `unspecified`. */
const isCriterion = <T>(
  raw: T | SearchCriterion<T>,
): raw is SearchCriterion<T> =>
  typeof raw === "object" &&
  raw !== null &&
  !Array.isArray(raw) &&
  ("value" in raw || "unspecified" in raw);

/** A list, wrapped when it has entries. */
const list = <T>(raw: Either<T[]>): SearchCriterion<T[]> | undefined => {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.length > 0 ? { value: raw } : undefined;
  return raw;
};

/** Text, wrapped unless blank. The value itself is sent as given. */
const text = (raw: Either<string>): SearchCriterion<string> | undefined => {
  if (raw == null) return undefined;
  if (typeof raw === "string")
    return raw.trim() !== "" ? { value: raw } : undefined;
  return raw;
};

/** A boolean or an enum name, wrapped as it is: `false` is a real value. */
const scalar = <T extends boolean | string>(
  raw: Either<T>,
): SearchCriterion<T> | undefined => {
  if (raw == null) return undefined;
  return isCriterion(raw) ? raw : { value: raw };
};

/** Exact options or a maximum interval; with neither it is left out. */
const commitmentInterval = (
  raw: Either<Partial<OpportunitySearchFilterCommitmentInterval>>,
):
  | SearchCriterion<Partial<OpportunitySearchFilterCommitmentInterval>>
  | undefined => {
  if (raw == null) return undefined;
  if (isCriterion(raw)) return raw;
  const options = raw.options && raw.options.length > 0 ? raw.options : null;
  return options || raw.interval
    ? { value: { options, interval: raw.interval ?? null } }
    : undefined;
};

/**
 * Ranges or a positive `hasReward`. `hasReward: false` with no ranges filters nothing — the API
 * treats it as inactive, and rejects it as a branch's only criterion — so it is left out.
 */
const zltoReward = (
  raw: Either<Partial<OpportunitySearchFilterZltoReward>>,
): SearchCriterion<Partial<OpportunitySearchFilterZltoReward>> | undefined => {
  if (raw == null) return undefined;
  if (isCriterion(raw)) return raw;
  const ranges = raw.ranges && raw.ranges.length > 0 ? raw.ranges : null;
  return ranges || raw.hasReward === true
    ? { value: { ranges, hasReward: raw.hasReward ?? null } }
    : undefined;
};

/**
 * A flat place → the wire entry. A point + radius replaces region / city, since the API takes
 * one or the other.
 */
const countryEntry = ({
  countryId,
  region,
  city,
  coordinates,
  radiusKm,
}: OpportunitySearchCountryLocation): OpportunitySearchFilterCountry => {
  if (coordinates && radiusKm != null)
    return { countryId, radius: { value: { coordinates, radiusKm } } };
  const entry: OpportunitySearchFilterCountry = { countryId };
  const regionCriterion = text(region);
  const cityCriterion = text(city);
  if (regionCriterion) entry.region = regionCriterion;
  if (cityCriterion) entry.city = cityCriterion;
  return entry;
};

const isIdList = (
  raw: string[] | OpportunitySearchFilterCountry[],
): raw is string[] => raw.some((item) => typeof item === "string");

/** Ids → `{ countryId }` entries, once each (the API rejects duplicates); entries as they are. */
const countries = (
  raw: string[] | OpportunitySearchFilterCountry[] | null | undefined,
  locations: OpportunitySearchCountryLocation[] | null | undefined,
): OpportunitySearchFilterCountry[] | undefined => {
  if (locations && locations.length > 0) return locations.map(countryEntry);
  if (!raw || raw.length === 0) return undefined;
  if (!isIdList(raw)) return raw;
  const ids = [...new Set(raw.filter((id) => id !== ""))];
  return ids.length > 0 ? ids.map((countryId) => ({ countryId })) : undefined;
};

export const toSearchFilterPayload = <E extends OpportunitySearchEndpoint>(
  filter: OpportunitySearchInput,
  endpoint: E,
): OpportunitySearchPayloads[E] => {
  const input: SearchInputMembers = filter;
  const payload: AllMembers = {
    // root controls
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    publishedStates: input.publishedStates,
    statuses: input.statuses,
    startDate: input.startDate,
    endDate: input.endDate,
    featured: input.featured,
    shareWithPartners: input.shareWithPartners,
    valueContains: input.valueContains,
    mostViewed: input.mostViewed,
    mostCompleted: input.mostCompleted,
    totalCountOnly: input.totalCountOnly,
    groups: nonEmpty(input.groups),
    ordering: nonEmpty(input.ordering),
    // the root selection
    provider: text(input.provider),
    incentivized: scalar(input.incentivized),
    rewardTypes: list(input.rewardTypes),
    accessibilitySupport: scalar(input.accessibilitySupport),
    accommodationOtherDescription: text(input.accommodationOtherDescription),
    accommodations: list(input.accommodations),
    targetedGroups: list(input.targetedGroups),
    sustainableDevelopmentGoals: list(input.sustainableDevelopmentGoals),
    age: input.age ?? undefined,
    types: list(input.types),
    categories: list(input.categories),
    languages: list(input.languages),
    countries: countries(input.countries, input.countryLocations),
    organizations: list(input.organizations),
    engagementTypes: list(input.engagementTypes),
    skills: list(input.skills),
    commitmentInterval: commitmentInterval(input.commitmentInterval),
    zltoReward: zltoReward(input.zltoReward),
    customFields: nonEmpty(input.customFields),
  };

  // a member with nothing to send, or one the endpoint's model lacks, is left out of the body
  const foreign: readonly string[] = NOT_ON_ENDPOINT[endpoint];
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => value != null && !foreign.includes(key),
    ),
  ) as OpportunitySearchPayloads[E];
};
