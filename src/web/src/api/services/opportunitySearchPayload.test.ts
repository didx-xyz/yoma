import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  AccessibilitySupport,
  CustomFieldFilterOperator,
  FilterSortOrder,
  OpportunitySearchOrderField,
  RewardType,
  UnspecifiedMatch,
  type OpportunitySearchFilter,
  type OpportunitySearchFilterAdmin,
  type OpportunitySearchRequest,
  type OpportunitySearchRequestAdmin,
} from "~/api/models/opportunity";
import { manualSearch } from "~/features/discovery/lib/preferenceMapping";
import {
  buildCountFilter,
  buildSearchFilter,
} from "~/features/discovery/lib/searchRequest";
import { EMPTY_DISCOVERY_FILTERS } from "~/features/discovery/lib/types";
import {
  toSearchFilterPayload,
  type OpportunitySearchInput,
} from "./opportunitySearchPayload";

const toYouth = (filter: OpportunitySearchInput) =>
  toSearchFilterPayload(filter, "youth");

/** A youth filter with every member present and nothing set. */
const EMPTY_FILTER: OpportunitySearchFilter = {
  pageNumber: null,
  pageSize: null,
  types: null,
  categories: null,
  languages: null,
  countries: null,
  organizations: null,
  engagementTypes: null,
  featured: null,
  valueContains: null,
  publishedStates: null,
  commitmentInterval: null,
  zltoReward: null,
  mostViewed: null,
  mostCompleted: null,
};

const EMPTY_ADMIN_FILTER: OpportunitySearchFilterAdmin = {
  pageNumber: null,
  pageSize: null,
  types: null,
  categories: null,
  languages: null,
  countries: null,
  organizations: null,
  engagementTypes: null,
  featured: null,
  valueContains: null,
  startDate: null,
  endDate: null,
  statuses: null,
};

/** Every `unspecified` anywhere in a body — the converter itself must never set one. */
const modesIn = (body: unknown): unknown[] =>
  JSON.stringify(body).match(/"unspecified"/g) ?? [];

describe("toSearchFilterPayload — flat filters", () => {
  test("wraps every criterion as { value }, with no mode", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      pageNumber: 2,
      pageSize: 12,
      types: ["type-1"],
      categories: ["category-1", "category-2"],
      languages: ["language-1"],
      organizations: ["organization-1"],
      engagementTypes: ["engagement-1"],
      provider: "KFC",
      incentivized: false,
      rewardTypes: [RewardType.ZLTO],
      accessibilitySupport: AccessibilitySupport.Yes,
      accommodationOtherDescription: "Sign language",
      accommodations: ["accessibility-other"],
      targetedGroups: ["group-1"],
      sustainableDevelopmentGoals: ["sdg-1"],
      age: 19,
    });

    assert.deepEqual(body, {
      pageNumber: 2,
      pageSize: 12,
      types: { value: ["type-1"] },
      categories: { value: ["category-1", "category-2"] },
      languages: { value: ["language-1"] },
      organizations: { value: ["organization-1"] },
      engagementTypes: { value: ["engagement-1"] },
      provider: { value: "KFC" },
      incentivized: { value: false },
      rewardTypes: { value: [RewardType.ZLTO] },
      accessibilitySupport: { value: AccessibilitySupport.Yes },
      accommodationOtherDescription: { value: "Sign language" },
      accommodations: { value: ["accessibility-other"] },
      targetedGroups: { value: ["group-1"] },
      sustainableDevelopmentGoals: { value: ["sdg-1"] },
      age: 19,
    });
    assert.equal(modesIn(body).length, 0);
  });

  test("omits null, empty and blank criteria", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      pageNumber: 1,
      pageSize: 20,
      types: [],
      categories: [],
      countries: [],
      countryLocations: [],
      customFields: [],
      provider: "  ",
      accommodationOtherDescription: "",
      rewardTypes: [],
      accessibilitySupport: null,
      incentivized: null,
      age: null,
      commitmentInterval: { options: [], interval: null },
      zltoReward: { ranges: [], hasReward: null },
    });

    assert.deepEqual(body, { pageNumber: 1, pageSize: 20 });
  });

  test("country ids become { countryId } entries, once each", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      countries: ["za", "ww", "za", ""],
    });

    assert.deepEqual(body.countries, [
      { countryId: "za" },
      { countryId: "ww" },
    ]);
  });

  test("a region / city entry wraps each part and replaces the ids", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      countries: ["za"],
      countryLocations: [
        { countryId: "za", region: "Western Cape", city: "Cape Town" },
      ],
    });

    assert.deepEqual(body.countries, [
      {
        countryId: "za",
        region: { value: "Western Cape" },
        city: { value: "Cape Town" },
      },
    ]);
  });

  test("a region alone sends no city", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      countryLocations: [{ countryId: "za", region: "Gauteng", city: null }],
    });

    assert.deepEqual(body.countries, [
      { countryId: "za", region: { value: "Gauteng" } },
    ]);
  });

  test("a point + radius becomes `radius`, never flat, and replaces region / city", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      countryLocations: [
        {
          countryId: "za",
          region: "Western Cape",
          city: "Cape Town",
          coordinates: [18.4231, -33.9221],
          radiusKm: 25,
        },
      ],
    });

    assert.deepEqual(body.countries, [
      {
        countryId: "za",
        radius: { value: { coordinates: [18.4231, -33.9221], radiusKm: 25 } },
      },
    ]);
  });

  test("zltoReward: hasReward false or null with no ranges is dropped", () => {
    for (const hasReward of [false, null]) {
      const body = toYouth({
        ...EMPTY_FILTER,
        zltoReward: { ranges: null, hasReward },
      });
      assert.equal("zltoReward" in body, false, `hasReward: ${hasReward}`);
    }
  });

  test("zltoReward: ranges and hasReward true are kept", () => {
    assert.deepEqual(
      toYouth({
        ...EMPTY_FILTER,
        zltoReward: { ranges: ["0|100", "100|500"], hasReward: null },
      }).zltoReward,
      { value: { ranges: ["0|100", "100|500"], hasReward: null } },
    );
    assert.deepEqual(
      toYouth({
        ...EMPTY_FILTER,
        zltoReward: { ranges: null, hasReward: true },
      }).zltoReward,
      { value: { ranges: null, hasReward: true } },
    );
  });

  test("commitment: a maximum interval and exact options are each wrapped", () => {
    assert.deepEqual(
      toYouth({
        ...EMPTY_FILTER,
        commitmentInterval: {
          options: null,
          interval: { id: "interval-week", count: 4 },
        },
      }).commitmentInterval,
      {
        value: { options: null, interval: { id: "interval-week", count: 4 } },
      },
    );
    assert.deepEqual(
      toYouth({
        ...EMPTY_FILTER,
        commitmentInterval: { options: ["4|interval-week"], interval: null },
      }).commitmentInterval,
      { value: { options: ["4|interval-week"], interval: null } },
    );
  });

  test("custom-field clauses pass through as they are", () => {
    const customFields = [
      {
        key: "jobSalaryMinimum",
        operator: CustomFieldFilterOperator.GreaterThanOrEqual,
        value: "5000",
      },
      {
        key: "jobWorkArrangement",
        operator: CustomFieldFilterOperator.AnyOf,
        values: ["remote", "hybrid"],
      },
      { key: "eventRole", unspecified: UnspecifiedMatch.Only },
    ];
    const body = toYouth({ ...EMPTY_FILTER, customFields });

    assert.deepEqual(body.customFields, customFields);
  });

  test("youth root controls stay unwrapped", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      pageNumber: 1,
      pageSize: 4,
      publishedStates: ["Active", "NotStarted"],
      featured: true,
      valueContains: "design",
      mostViewed: true,
      mostCompleted: false,
    });

    assert.deepEqual(body, {
      pageNumber: 1,
      pageSize: 4,
      publishedStates: ["Active", "NotStarted"],
      featured: true,
      valueContains: "design",
      mostViewed: true,
      mostCompleted: false,
    });
  });

  test("admin root controls stay unwrapped, and count-only is kept", () => {
    const body = toSearchFilterPayload(
      {
        ...EMPTY_ADMIN_FILTER,
        statuses: ["Active", "Inactive"],
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        valueContains: "design",
        totalCountOnly: true,
        organizations: ["organization-1"],
      },
      "admin",
    );

    assert.deepEqual(body, {
      statuses: ["Active", "Inactive"],
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      valueContains: "design",
      totalCountOnly: true,
      organizations: { value: ["organization-1"] },
    });
  });

  test("the CSV export never carries totalCountOnly", () => {
    const body = toSearchFilterPayload(
      {
        ...EMPTY_ADMIN_FILTER,
        pageNumber: 1,
        pageSize: 1000,
        statuses: ["Active"],
        totalCountOnly: true,
      },
      "adminCSV",
    );

    assert.deepEqual(body, {
      pageNumber: 1,
      pageSize: 1000,
      statuses: ["Active"],
    });
  });

  test("members the API does not know are dropped", () => {
    const body = toYouth({
      ...EMPTY_FILTER,
      types: ["type-1"],
      somethingElse: true,
    } as OpportunitySearchFilter);

    assert.deepEqual(body, { types: { value: ["type-1"] } });
  });

  test("converting twice changes nothing", () => {
    const once = toYouth({
      ...EMPTY_FILTER,
      pageNumber: 1,
      pageSize: 20,
      types: ["type-1"],
      provider: "KFC",
      incentivized: true,
      countryLocations: [{ countryId: "za", city: "Cape Town" }],
      commitmentInterval: {
        options: null,
        interval: { id: "interval-week", count: 4 },
      },
      zltoReward: { ranges: ["0|100"], hasReward: null },
    });

    assert.deepEqual(toYouth(once), once);
  });
});

describe("toSearchFilterPayload — endpoints", () => {
  /** Every root control either search takes, plus one shared criterion. */
  const everyRootControl: OpportunitySearchRequest &
    OpportunitySearchRequestAdmin = {
    pageNumber: 1,
    pageSize: 4,
    featured: true,
    shareWithPartners: false,
    valueContains: "design",
    totalCountOnly: true,
    ordering: [
      {
        field: OpportunitySearchOrderField.DateCreated,
        direction: FilterSortOrder.Descending,
      },
    ],
    groups: [{ anyOf: [{ types: { value: ["type-1"] } }] }],
    publishedStates: ["Active"],
    mostViewed: false,
    mostCompleted: false,
    statuses: ["Active"],
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    types: { value: ["type-2"] },
  };
  const shared = {
    pageNumber: 1,
    pageSize: 4,
    featured: true,
    shareWithPartners: false,
    valueContains: "design",
    ordering: everyRootControl.ordering,
    groups: everyRootControl.groups,
    types: { value: ["type-2"] },
  };

  test("the youth search drops the admin-only root controls", () => {
    assert.deepEqual(toSearchFilterPayload(everyRootControl, "youth"), {
      ...shared,
      totalCountOnly: true,
      publishedStates: ["Active"],
      mostViewed: false,
      mostCompleted: false,
    });
  });

  test("the admin search drops the youth-only root controls", () => {
    assert.deepEqual(toSearchFilterPayload(everyRootControl, "admin"), {
      ...shared,
      totalCountOnly: true,
      statuses: ["Active"],
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
  });

  test("the CSV export drops the youth-only root controls and count-only", () => {
    assert.deepEqual(toSearchFilterPayload(everyRootControl, "adminCSV"), {
      ...shared,
      statuses: ["Active"],
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
  });

  test("empty groups and ordering are left out, on every endpoint", () => {
    for (const endpoint of ["youth", "admin", "adminCSV"] as const)
      assert.deepEqual(
        toSearchFilterPayload(
          { types: { value: ["type-1"] }, groups: [], ordering: [] },
          endpoint,
        ),
        { types: { value: ["type-1"] } },
        endpoint,
      );
  });
});

describe("toSearchFilterPayload — typed requests", () => {
  test("a typed request passes through untouched", () => {
    const request: OpportunitySearchRequest = {
      pageNumber: 1,
      pageSize: 12,
      publishedStates: ["Active", "NotStarted"],
      valueContains: "design",
      ordering: [
        {
          field: OpportunitySearchOrderField.DateEnd,
          direction: FilterSortOrder.Ascending,
        },
      ],
      engagementTypes: {
        value: ["engagement-remote"],
        unspecified: UnspecifiedMatch.Include,
      },
      accommodations: {
        value: ["accessibility-1"],
        unspecified: UnspecifiedMatch.Include,
      },
      provider: { unspecified: UnspecifiedMatch.Only },
      incentivized: { value: false },
      age: 19,
      countries: [
        {
          countryId: "za",
          region: {
            value: "Western Cape",
            unspecified: UnspecifiedMatch.Include,
          },
        },
        { countryId: "ww" },
      ],
      commitmentInterval: {
        value: { options: null, interval: { id: "interval-week", count: 4 } },
        unspecified: UnspecifiedMatch.Exclude,
      },
      zltoReward: { value: { ranges: null, hasReward: true } },
      groups: [
        {
          anyOf: [
            { types: { value: ["type-entrepreneurship"] } },
            { categories: { value: ["category-business"] } },
          ],
        },
        {
          anyOf: [
            { types: { value: ["type-learning", "type-event"] } },
            {
              types: { value: ["type-job"] },
              skills: {
                value: ["skill-1"],
                unspecified: UnspecifiedMatch.Include,
              },
            },
          ],
        },
      ],
      customFields: [
        { key: "jobSalaryMinimum", unspecified: UnspecifiedMatch.Only },
      ],
    };
    const snapshot = structuredClone(request);

    assert.deepEqual(toYouth(request), snapshot);
    assert.deepEqual(request, snapshot, "the input is not mutated");
  });

  test("a radius entry with its own mode passes through", () => {
    const countries = [
      {
        countryId: "za",
        radius: {
          value: { coordinates: [18.4231, -33.9221], radiusKm: 25 },
          unspecified: UnspecifiedMatch.Only,
        },
      },
    ];

    assert.deepEqual(toYouth({ countries }).countries, countries);
  });

  test("a count-only request keeps totalCountOnly and sends no paging", () => {
    assert.deepEqual(
      toYouth({
        totalCountOnly: true,
        pageNumber: null,
        pageSize: null,
        types: { value: ["type-1"] },
      }),
      { totalCountOnly: true, types: { value: ["type-1"] } },
    );
  });
});

describe("discovery's request, through the converter", () => {
  const lookups = {
    typeIdByName: { Job: "type-job" },
    categories: [],
    countries: [],
  };

  test("a picked city with Distance sends `radius`, with no flat point or radius", () => {
    const body = toYouth(
      buildSearchFilter(
        manualSearch({
          ...EMPTY_DISCOVERY_FILTERS,
          types: ["Job"],
          countries: ["za"],
          city: "Cape Town",
          point: { longitude: 18.4231, latitude: -33.9221 },
          radiusKm: 25,
        }),
        "newest",
        1,
        20,
        lookups,
      ),
    );

    assert.deepEqual(body.countries, [
      {
        countryId: "za",
        radius: { value: { coordinates: [18.4231, -33.9221], radiusKm: 25 } },
      },
    ]);
    assert.deepEqual(body.types, { value: ["type-job"] });
    assert.equal("countryLocations" in body, false);
    assert.equal(modesIn(body).length, 0);
  });

  test("the live count is count-only, with no paging", () => {
    const body = toYouth(
      buildCountFilter(
        manualSearch({
          ...EMPTY_DISCOVERY_FILTERS,
          countries: ["za"],
          region: "Gauteng",
        }),
        lookups,
      ),
    );

    assert.deepEqual(body, {
      totalCountOnly: true,
      countries: [{ countryId: "za", region: { value: "Gauteng" } }],
    });
  });
});
