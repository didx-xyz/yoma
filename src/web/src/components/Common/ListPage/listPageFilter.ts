/**
 * Generic query-string ⇄ filter plumbing shared by the admin list pages (opportunities,
 * links, marketplace store rules, referral programs, verifications, organisations).
 *
 * Each page declares a spec: the ordered list of querystring parameters, the search-filter
 * key each one maps onto, and the keys that never render as a filter badge. Parsing,
 * serialising, the applied-filter count, the react-query cache key and the status tab bar
 * are all derived from that spec, so every list page speaks the same dialect.
 *
 * Querystring values are human-readable (names) wherever the page has a full lookup to map
 * them back to id's — that is what the filter dialog and the badges bind to, and it keeps
 * shared URLs legible. Pages do the name → id mapping for the API themselves (namesToIds).
 * Filters that are backed by an async search (no full list to map against) stay id-based.
 *
 * NB: no manual en/decoding anywhere — URLSearchParams encodes, the router decodes.
 */

/** Router query values (Next.js gives string | string[] | undefined). */
export type QueryValue = string | string[] | undefined;
export type ListPageRouterQuery = Record<string, QueryValue>;

export type ListPageParamKind =
  /** a single scalar value */
  | "single"
  /** '|'-delimited list — some values contain ',' (e.g. "Catalan, Valencian") */
  | "multi"
  /** a list serialised as JSON (e.g. the custom-field clauses) */
  | "json"
  /** the page number; omitted from the url on page 1 */
  | "page"
  /** the status tab; owned by the tab bar rather than the filter dialog */
  | "status";

export interface ListPageStatusTab {
  /** querystring token for this tab; null = the "All" tab */
  value: string | null;
  label: string;
  /** value sent to the API, where it differs from the querystring token */
  apiValue?: string;
}

export interface ListPageParamSpec {
  /** querystring parameter name */
  param: string;
  /** key on the page's search filter */
  key: string;
  kind: ListPageParamKind;
  /** parameter names still honoured when parsing, for urls shared before a rename */
  legacyParams?: string[];
  /** kind "status" only: the tab bar definition */
  tabs?: ListPageStatusTab[];
  /** kind "status" only: value(s) the API expects for the "All" tab (null = omit) */
  allValues?: string[] | null;
}

export interface ListPageFilterSpec {
  /** in querystring order */
  params: ListPageParamSpec[];
  /** filter keys that never render as a badge (paging, and the tab-owned status) */
  badgeExcludeKeys: string[];
}

export const asString = (value: QueryValue): string | null => {
  if (value === undefined || value === null) return null;
  const first = Array.isArray(value) ? value[0] : value;
  return first != undefined && first.length > 0 ? first : null;
};

/** Multi-value params use '|' as delimiter, as some values contain ','. */
export const asArray = (value: QueryValue): string[] | null => {
  const raw = asString(value);
  if (raw === null) return null;
  const items = raw
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
};

/** A list serialised as JSON, e.g. the opportunity custom-field clauses. */
export const asJsonArray = <T>(value: QueryValue): T[] | null => {
  const raw = asString(value);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

/** Reads a param, falling back to any legacy names it was previously published under. */
const readParam = (
  routerQuery: ListPageRouterQuery,
  paramSpec: ListPageParamSpec,
): QueryValue => {
  const value = routerQuery[paramSpec.param];
  if (asString(value) !== null) return value;

  for (const legacy of paramSpec.legacyParams ?? []) {
    const legacyValue = routerQuery[legacy];
    if (asString(legacyValue) !== null) return legacyValue;
  }
  return undefined;
};

export const getStatusParamSpec = (
  spec: ListPageFilterSpec,
): ListPageParamSpec | undefined =>
  spec.params.find((paramSpec) => paramSpec.kind === "status");

/**
 * The status tab currently selected, as its querystring token, or null for "All" / an
 * unknown value. Matching is case-insensitive so urls published before the status tokens
 * were normalised (e.g. `?statuses=active`) still land on the right tab.
 */
export const parseStatusTab = (
  routerQuery: ListPageRouterQuery,
  spec: ListPageFilterSpec,
): string | null => {
  const statusSpec = getStatusParamSpec(spec);
  if (!statusSpec) return null;

  const raw = asString(readParam(routerQuery, statusSpec));
  if (raw === null) return null;

  const match = (statusSpec.tabs ?? []).find(
    (tab) =>
      tab.value !== null && tab.value.toLowerCase() === raw.toLowerCase(),
  );
  return match?.value ?? null;
};

/** The value(s) the API expects for the given tab. */
const statusApiValues = (
  statusSpec: ListPageParamSpec,
  tabValue: string | null,
): string[] | null => {
  if (tabValue === null) return statusSpec.allValues ?? null;

  const tab = (statusSpec.tabs ?? []).find((x) => x.value === tabValue);
  if (!tab?.value) return statusSpec.allValues ?? null;
  return [tab.apiValue ?? tab.value];
};

/**
 * The display filter for the current querystring — what the filter dialog and the badges
 * bind to.
 *
 * `base` supplies the defaults (page size, and any keys the querystring never carries) and
 * — because assigning to an existing key does not move it — also fixes the key order of
 * the result, which is the order the badges render in. `spec.params` fixes the querystring
 * order. List every filter key in `base` to control both independently.
 */
export const parseListPageFilter = <T extends object>(
  routerQuery: ListPageRouterQuery,
  spec: ListPageFilterSpec,
  base: T,
): T => {
  // NB: `object` rather than Record<string, unknown> — TypeScript does not give interfaces
  // (which every page's filter is) an implicit index signature.
  const filter = { ...base } as Record<string, unknown>;

  for (const paramSpec of spec.params) {
    const value = readParam(routerQuery, paramSpec);

    switch (paramSpec.kind) {
      case "single":
        filter[paramSpec.key] = asString(value);
        break;
      case "multi":
        filter[paramSpec.key] = asArray(value);
        break;
      case "json":
        filter[paramSpec.key] = asJsonArray(value);
        break;
      case "page": {
        const page = asString(value);
        const parsed = page ? Number.parseInt(page, 10) : 1;
        filter[paramSpec.key] = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
        break;
      }
      case "status":
        filter[paramSpec.key] = statusApiValues(
          paramSpec,
          parseStatusTab(routerQuery, spec),
        );
        break;
    }
  }

  return filter as T;
};

/**
 * The querystring token for a status filter value, or null when it should not appear in the
 * url: a single status = a status tab, while the "All" tab (every status, or none) stays out.
 */
const statusToken = (
  paramSpec: ListPageParamSpec,
  value: unknown,
): string | null => {
  if (!Array.isArray(value) || value.length !== 1) return null;

  const [selected] = value as unknown[];
  if (typeof selected !== "string" || selected.length === 0) return null;

  const tab = (paramSpec.tabs ?? []).find(
    (x) => (x.apiValue ?? x.value) === selected,
  );
  return tab?.value ?? selected;
};

/** The querystring value for one param, or null when the param should be omitted. */
const paramToken = (
  paramSpec: ListPageParamSpec,
  value: unknown,
): string | null => {
  switch (paramSpec.kind) {
    case "single":
      return typeof value === "string" && value.length > 0 ? value : null;
    case "multi":
      return Array.isArray(value) && value.length > 0 ? value.join("|") : null;
    case "json":
      // URLSearchParams handles the encoding
      return Array.isArray(value) && value.length > 0
        ? JSON.stringify(value)
        : null;
    case "page":
      return typeof value === "number" && value > 1 ? value.toString() : null;
    case "status":
      return statusToken(paramSpec, value);
  }
};

/** Serialises the display filter back to the querystring. */
export const buildListPageQueryString = (
  filter: object,
  spec: ListPageFilterSpec,
): URLSearchParams | null => {
  const values = filter as Record<string, unknown>;
  const params = new URLSearchParams();

  for (const paramSpec of spec.params) {
    const token = paramToken(paramSpec, values[paramSpec.key]);
    if (token !== null) params.append(paramSpec.param, token);
  }

  if (params.size === 0) return null;
  return params;
};

/** True when any filter other than the status tab / paging is applied. */
export const isSearchPerformed = (
  routerQuery: ListPageRouterQuery,
  spec: ListPageFilterSpec,
): boolean =>
  spec.params
    .filter(
      (paramSpec) => paramSpec.kind !== "status" && paramSpec.kind !== "page",
    )
    .some((paramSpec) => asString(readParam(routerQuery, paramSpec)) !== null);

/** Number of badges the applied filter renders — drives the "Filters (n)" button label. */
export const getAppliedFilterCount = (
  filter: object,
  spec: ListPageFilterSpec,
): number =>
  Object.entries(filter)
    .filter(([key, value]) => !spec.badgeExcludeKeys.includes(key) && !!value)
    .reduce((count, [, value]) => {
      if (Array.isArray(value)) return count + value.length;
      return count + 1;
    }, 0);

/** Cache-key fragment representing every filter that influences the result set. */
export const getFilterKeyParts = (
  routerQuery: ListPageRouterQuery,
  spec: ListPageFilterSpec,
): string =>
  spec.params
    .map((paramSpec) => asString(readParam(routerQuery, paramSpec)))
    .join("_");

/** Maps display names to the id's the search endpoint expects. */
export const namesToIds = <T extends { id: string; name: string }>(
  names: string[] | null | undefined,
  lookup: T[] | undefined,
): string[] | null => {
  if (!names || names.length === 0) return null;
  const ids = names
    .map((name) => lookup?.find((item) => item.name === name)?.id ?? "")
    .filter((id) => id !== "");
  return ids.length > 0 ? ids : null;
};

/**
 * Whether the lookups needed to map the applied name-based params to id's have loaded.
 * Pass one entry per name-based filter; a filter with no applied values needs no lookup.
 */
export const isLookupMappingReady = (
  entries: { values: unknown; lookup: unknown[] | undefined }[],
): boolean =>
  entries.every(
    ({ values, lookup }) =>
      !(Array.isArray(values) && values.length > 0) || !!lookup,
  );

/**
 * Href for a status tab: the current filters, minus the status (under any of its names)
 * and minus paging, which is meaningless across tabs.
 */
export const statusTabHref = (
  basePath: string,
  baseParams: URLSearchParams | null | undefined,
  statusSpec: ListPageParamSpec,
  tabValue: string | null,
  pageParam = "page",
): string => {
  const params = new URLSearchParams(baseParams?.toString() ?? "");

  params.delete(statusSpec.param);
  for (const legacy of statusSpec.legacyParams ?? []) params.delete(legacy);
  params.delete(pageParam);

  if (tabValue !== null) params.append(statusSpec.param, tabValue);

  return params.size > 0 ? `${basePath}?${params.toString()}` : basePath;
};
