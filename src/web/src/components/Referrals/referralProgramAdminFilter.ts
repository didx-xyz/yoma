import type { Country } from "~/api/models/lookups";
import {
  ProgramStatus,
  type ProgramSearchFilterAdmin,
} from "~/api/models/referrals";
import {
  isLookupMappingReady,
  namesToIds,
  parseListPageFilter,
  type ListPageFilterSpec,
  type ListPageParamSpec,
  type ListPageRouterQuery,
  type ListPageStatusTab,
} from "~/components/Common/ListPage/listPageFilter";

/**
 * Query-string ⇄ filter plumbing for the admin referral program list page
 * (/admin/referrals): query, countries, dateStart, dateEnd, status, page.
 *
 * Countries have a full lookup, so they travel as names and are mapped to id's for the API.
 */

/** Tab bar definition. */
export const REFERRAL_PROGRAM_STATUS_TABS: ListPageStatusTab[] = [
  { value: ProgramStatus[ProgramStatus.Active], label: "Active" },
  { value: ProgramStatus[ProgramStatus.Inactive], label: "Inactive" },
  { value: ProgramStatus[ProgramStatus.Expired], label: "Expired" },
  { value: ProgramStatus[ProgramStatus.Deleted], label: "Deleted" },
  { value: ProgramStatus[ProgramStatus.LimitReached], label: "Limit Reached" },
  {
    value: ProgramStatus[ProgramStatus.UnCompletable],
    label: "Uncompletable",
  },
];

/**
 * Status travels as the enum name (`?status=LimitReached`), which is what the tabs already
 * used. The API treats "no statuses" as every status, so the "All" tab sends nothing.
 */
export const REFERRAL_PROGRAM_STATUS_PARAM: ListPageParamSpec = {
  param: "status",
  key: "statuses",
  kind: "status",
  tabs: [{ value: null, label: "All" }, ...REFERRAL_PROGRAM_STATUS_TABS],
  allValues: null,
};

/** Keys that never render as a filter badge (paging, and status which the tabs own). */
export const REFERRAL_PROGRAM_BADGE_EXCLUDE_KEYS = [
  "pageNumber",
  "pageSize",
  "statuses",
];

export const REFERRAL_PROGRAM_FILTER_SPEC: ListPageFilterSpec = {
  params: [
    {
      param: "query",
      key: "valueContains",
      kind: "single",
      legacyParams: ["valueContains"],
    },
    { param: "countries", key: "countries", kind: "multi" },
    { param: "dateStart", key: "dateStart", kind: "single" },
    { param: "dateEnd", key: "dateEnd", kind: "single" },
    REFERRAL_PROGRAM_STATUS_PARAM,
    { param: "page", key: "pageNumber", kind: "page" },
  ],
  badgeExcludeKeys: REFERRAL_PROGRAM_BADGE_EXCLUDE_KEYS,
};

export interface ReferralProgramAdminLookups {
  countries?: Country[];
}

/**
 * The display (name-based) filter for the current querystring — what the filter dialog and
 * the badges bind to.
 */
export const parseReferralProgramFilterFromQuery = (
  routerQuery: ListPageRouterQuery,
  pageSize: number,
): ProgramSearchFilterAdmin =>
  // NB: the key order here is the order the filter badges render in
  parseListPageFilter<ProgramSearchFilterAdmin>(
    routerQuery,
    REFERRAL_PROGRAM_FILTER_SPEC,
    {
      pageNumber: 1,
      pageSize: pageSize,
      valueContains: null,
      countries: null,
      dateStart: null,
      dateEnd: null,
      statuses: null,
    },
  );

/** Whether the lookup needed to map the applied country names to id's has loaded. */
export const isReferralProgramFilterMappingReady = (
  filter: ProgramSearchFilterAdmin,
  lookups: ReferralProgramAdminLookups,
): boolean =>
  isLookupMappingReady([
    { values: filter.countries, lookup: lookups.countries },
  ]);

/** Maps the display filter to the id-based filter the search endpoint expects. */
export const mapReferralProgramFilterToApi = (
  filter: ProgramSearchFilterAdmin,
  lookups: ReferralProgramAdminLookups,
): ProgramSearchFilterAdmin => ({
  ...filter,
  countries: namesToIds(filter.countries, lookups.countries),
});
