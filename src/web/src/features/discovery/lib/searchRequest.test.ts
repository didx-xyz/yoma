import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CustomFieldFilterOperator,
  type OpportunitySearchRequest,
  type OpportunitySearchSelection,
} from "~/api/models/opportunity";
import { toSearchFilterPayload } from "~/api/services/opportunitySearchPayload";
import type { UserPreferences } from "~/api/models/userPreferences";
import { EMPTY_USER_PREFERENCES } from "~/api/models/userPreferences";
import type {
  DiscoverySearch,
  PreferenceProfileContext,
} from "./preferenceMapping";
import {
  composeSearch,
  manualSearch,
  mapPreferencesToFilters,
} from "./preferenceMapping";
import type { SearchLookups } from "./searchRequest";
import {
  buildCountFilter,
  buildSearchFilter,
  jobSkillsApply,
} from "./searchRequest";
import type { DiscoveryFilters, DiscoverySort, PreferenceKey } from "./types";
import { EMPTY_DISCOVERY_FILTERS } from "./types";

const LOOKUPS: SearchLookups = {
  typeIdByName: {
    Job: "t-job",
    Learning: "t-learn",
    ImpactAction: "t-impact",
    Event: "t-event",
    Entrepreneurship: "t-ent",
    Other: "t-other",
  },
  categories: [
    { id: "c-tech", name: "Technology, AI & Data" },
    { id: "c-biz", name: "Business, Finance & Marketing" },
  ],
  countries: [
    { id: "c-ww", codeAlpha2: "WW" },
    { id: "za", codeAlpha2: "ZA" },
    { id: "ke", codeAlpha2: "KE" },
  ],
};

const NON_JOB_TYPE_IDS = ["t-learn", "t-impact", "t-event", "t-ent", "t-other"];

const prefs = (patch: Partial<UserPreferences>): UserPreferences => ({
  ...EMPTY_USER_PREFERENCES,
  ...patch,
});

const HOME: PreferenceProfileContext = {
  countryId: "za",
  age: null,
  verifiedSkillIds: [],
  otherAccommodationId: null,
};

/** The search a youth with these preferences runs, with these manual filters. */
const searchOf = (
  preferences: Partial<UserPreferences>,
  manual: Partial<DiscoveryFilters> = {},
  options: {
    skipped?: PreferenceKey[];
    off?: boolean;
    profile?: Partial<PreferenceProfileContext>;
  } = {},
): DiscoverySearch =>
  composeSearch(
    { ...EMPTY_DISCOVERY_FILTERS, ...manual },
    mapPreferencesToFilters(prefs(preferences), {
      ...HOME,
      ...options.profile,
    }),
    options.off ?? false,
    options.skipped ?? [],
  );

const build = (
  search: DiscoverySearch,
  sort: DiscoverySort = "newest",
  lookups: SearchLookups = LOOKUPS,
): OpportunitySearchRequest => buildSearchFilter(search, sort, 1, 20, lookups);

/** Every `unspecified` in a body, by the path of the criterion that carries it. */
const modes = (body: unknown, path = ""): Record<string, string> => {
  if (typeof body !== "object" || body === null) return {};
  return Object.entries(body).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (key === "unspecified") return { ...acc, [path]: String(value) };
      return { ...acc, ...modes(value, path ? `${path}.${key}` : key) };
    },
    {},
  );
};

const BIZ_CATEGORY_BRANCH = { categories: { value: ["c-biz"] } };

describe("rule 1 — union, and the manual mode wins", () => {
  test("inherited engagement only: its values, Include", () => {
    const body = build(searchOf({ engagement: ["remote"] }));
    assert.deepEqual(body.engagementTypes, {
      value: ["remote"],
      unspecified: "Include",
    });
  });

  test("a manual pick unions with the inherited values, under Exclude", () => {
    const body = build(
      searchOf({ engagement: ["remote"] }, { engagementTypes: ["onsite"] }),
    );
    assert.deepEqual(body.engagementTypes, {
      value: ["onsite", "remote"],
      unspecified: "Exclude",
    });
  });

  test("a manual pick alone: Exclude", () => {
    const body = build(
      manualSearch({ ...EMPTY_DISCOVERY_FILTERS, engagementTypes: ["onsite"] }),
    );
    assert.deepEqual(body.engagementTypes, {
      value: ["onsite"],
      unspecified: "Exclude",
    });
  });

  test("to replace an inherited multi-select, skip it: the manual pick stays, alone", () => {
    const body = build(
      searchOf(
        { engagement: ["remote"] },
        { engagementTypes: ["onsite"] },
        { skipped: ["engagement"] },
      ),
    );
    assert.deepEqual(body.engagementTypes, {
      value: ["onsite"],
      unspecified: "Exclude",
    });
  });

  test("scalars: the manual value replaces the inherited one", () => {
    const body = build(
      searchOf(
        { maxCommitment: { intervalId: "week", count: 2 }, incentivized: true },
        { commitment: { intervalId: "day", count: 1 }, incentivized: false },
      ),
    );
    assert.deepEqual(body.commitmentInterval, {
      value: { interval: { id: "day", count: 1 } },
    });
    assert.deepEqual(body.incentivized, { value: false });
  });
});

describe("rule 2 — modes by provenance", () => {
  test("inherited accommodations: Include, without Other or its description", () => {
    const body = build(
      searchOf(
        {
          accessibility: {
            requirements: ["wheelchair", "other"],
            otherDescription: "A private need",
          },
        },
        {},
        { profile: { otherAccommodationId: "other" } },
      ),
    );
    assert.deepEqual(body.accommodations, {
      value: ["wheelchair"],
      unspecified: "Include",
    });
    assert.equal("accommodationOtherDescription" in body, false);
    assert.equal(JSON.stringify(body).includes("A private need"), false);
  });

  test("an inherited Other alone sends no accommodations criterion", () => {
    const body = build(
      searchOf(
        {
          accessibility: {
            requirements: ["other"],
            otherDescription: "A private need",
          },
        },
        {},
        { profile: { otherAccommodationId: "other" } },
      ),
    );
    assert.equal("accommodations" in body, false);
  });

  test("manual accommodations: Exclude, also when unioned with inherited needs", () => {
    assert.deepEqual(
      build(
        manualSearch({ ...EMPTY_DISCOVERY_FILTERS, accommodations: ["ramp"] }),
      ).accommodations,
      { value: ["ramp"], unspecified: "Exclude" },
    );
    assert.deepEqual(
      build(
        searchOf(
          {
            accessibility: {
              requirements: ["wheelchair"],
              otherDescription: null,
            },
          },
          { accommodations: ["ramp"] },
        ),
      ).accommodations,
      { value: ["ramp", "wheelchair"], unspecified: "Exclude" },
    );
  });

  test("every other criterion goes without a mode; nothing sends Only", () => {
    const body = build(
      searchOf(
        {
          goal: "job",
          targetCategories: ["c-tech"],
          maxCommitment: { intervalId: "week", count: 1 },
          engagement: ["remote"],
          incentivized: true,
          languages: ["en"],
          selfReportedSkills: [{ id: "s1", name: "Excel" }],
          accessibility: {
            requirements: ["wheelchair"],
            otherDescription: null,
          },
        },
        {
          q: "farm",
          types: ["Learning"],
          categories: ["c-biz"],
          zltoRanges: ["0|100"],
          sdgs: ["sdg-13"],
          provider: "KFC",
          featured: true,
          customFields: [
            {
              key: "eventRole",
              operator: CustomFieldFilterOperator.Equals,
              values: ["Speaker"],
            },
          ],
        },
        { profile: { age: 20 } },
      ),
    );
    assert.deepEqual(modes(body), {
      engagementTypes: "Include",
      accommodations: "Include",
      "groups.0.anyOf.1.skills": "Include",
    });
    assert.equal(JSON.stringify(body).includes('"Only"'), false);
  });

  test("types never carry a mode, at the root or in a branch", () => {
    for (const body of [
      build(searchOf({ goal: "job" })),
      build(searchOf({ goal: "biz" })),
      build(searchOf({ selfReportedSkills: [{ id: "s1", name: "Excel" }] })),
    ])
      assert.equal(
        Object.keys(modes(body)).some((path) => path.includes("types")),
        false,
      );
  });
});

describe('rule 3 — "Start a business" is one group', () => {
  test("the goal alone: Entrepreneurship OR the Business category, and no root types", () => {
    const body = build(searchOf({ goal: "biz" }));
    assert.deepEqual(body.groups, [
      { anyOf: [{ types: { value: ["t-ent"] } }, BIZ_CATEGORY_BRANCH] },
    ]);
    assert.equal("types" in body, false);
    assert.equal("categories" in body, false, "the category is request-only");
  });

  test("manual types fold into the goal's type branch", () => {
    const body = build(searchOf({ goal: "biz" }, { types: ["Event"] }));
    assert.deepEqual(body.groups, [
      {
        anyOf: [
          { types: { value: ["t-event", "t-ent"] } },
          BIZ_CATEGORY_BRANCH,
        ],
      },
    ]);
    assert.equal("types" in body, false);
  });

  test("skipping the goal, or preferences off, removes the group: manual types go root", () => {
    for (const options of [{ skipped: ["goal" as const] }, { off: true }]) {
      const body = build(
        searchOf({ goal: "biz" }, { types: ["Event"] }, options),
      );
      assert.equal("groups" in body, false);
      assert.deepEqual(body.types, { value: ["t-event"] });
    }
  });

  test("another goal stays a root types entry", () => {
    const body = build(searchOf({ goal: "learn" }, { types: ["Event"] }));
    assert.equal("groups" in body, false);
    assert.deepEqual(body.types, { value: ["t-event", "t-learn"] });
  });

  test("the pre-migration category name resolves too", () => {
    const body = build(searchOf({ goal: "biz" }), "newest", {
      ...LOOKUPS,
      categories: [{ id: "c-old", name: "Business and Entrepreneurship" }],
    });
    assert.deepEqual(body.groups?.[0]?.anyOf[1], {
      categories: { value: ["c-old"] },
    });
  });

  test("an unresolvable category degrades to the goal's type as a root criterion", () => {
    const body = build(searchOf({ goal: "biz" }), "newest", {
      ...LOOKUPS,
      categories: [{ id: "c-tech", name: "Technology, AI & Data" }],
    });
    assert.equal("groups" in body, false);
    assert.deepEqual(body.types, { value: ["t-ent"] });
  });

  test("interests stay a root criterion beside the group", () => {
    const body = build(searchOf({ goal: "biz", targetCategories: ["c-tech"] }));
    assert.deepEqual(body.categories, { value: ["c-tech"] });
    assert.equal(body.groups?.length, 1);
  });
});

describe("rule 4 — saved skills are one Jobs-only group", () => {
  const skills = [
    { id: "s1", name: "Excel" },
    { id: "s2", name: "Sales" },
  ];

  test("every non-Job type, OR a Job with the skills or none listed", () => {
    const body = build(
      searchOf(
        { selfReportedSkills: skills },
        {},
        { profile: { verifiedSkillIds: ["s2", "s3"] } },
      ),
    );
    assert.deepEqual(body.groups, [
      {
        anyOf: [
          { types: { value: NON_JOB_TYPE_IDS } },
          {
            types: { value: ["t-job"] },
            skills: { value: ["s1", "s2", "s3"], unspecified: "Include" },
          },
        ],
      },
    ]);
    assert.equal("skills" in body, false, "never a root criterion");
  });

  test("no skills, no group", () => {
    assert.equal("groups" in build(searchOf({})), false);
  });

  test("types without Job: the group would do nothing, so it is left out", () => {
    const search = searchOf(
      { selfReportedSkills: skills },
      { types: ["Learning", "Event"] },
    );
    assert.equal(jobSkillsApply(search, LOOKUPS), false);
    assert.equal("groups" in build(search), false);
  });

  test("types with Job keep it", () => {
    const body = build(
      searchOf({ selfReportedSkills: skills }, { types: ["Learning", "Job"] }),
    );
    assert.equal(body.groups?.length, 1);
    assert.deepEqual(body.types, { value: ["t-learn", "t-job"] });
  });

  test("with the goal's category branch, Jobs can still come in, so it stays", () => {
    const body = build(searchOf({ goal: "biz", selfReportedSkills: skills }));
    assert.equal(body.groups?.length, 2);
    assert.deepEqual(body.groups?.[1]?.anyOf[1]?.types, { value: ["t-job"] });
  });

  test("skipped, it goes", () => {
    assert.equal(
      "groups" in
        build(
          searchOf({ selfReportedSkills: skills }, {}, { skipped: ["skills"] }),
        ),
      false,
    );
  });
});

describe("rule 5 — country and Worldwide (L1)", () => {
  const capeTown = {
    countryId: "za",
    region: "Western Cape",
    city: "Cape Town",
    coordinates: { latitude: -33.92, longitude: 18.42 },
    source: null,
    placeId: null,
  };

  test("the inherited home country also sends a plain Worldwide entry", () => {
    const search = searchOf({});
    assert.deepEqual(build(search).countries, [
      { countryId: "za" },
      { countryId: "c-ww" },
    ]);
    assert.deepEqual(search.filters.countries, ["za"], "request-only");
  });

  test("the inherited place attaches to the home country, never to Worldwide", () => {
    assert.deepEqual(build(searchOf({ location: capeTown })).countries, [
      {
        countryId: "za",
        region: { value: "Western Cape" },
        city: { value: "Cape Town" },
      },
      { countryId: "c-ww" },
    ]);
  });

  test("a radius is on: no Worldwide at all", () => {
    const body = build(searchOf({ location: capeTown }, { radiusKm: 25 }));
    assert.deepEqual(body.countries, [
      {
        countryId: "za",
        radius: { value: { coordinates: [18.42, -33.92], radiusKm: 25 } },
      },
    ]);
  });

  test('"Jobs near me" (Job + the default radius) sends no Worldwide either', () => {
    const body = build(
      searchOf({ location: capeTown }, { types: ["Job"], radiusKm: 25 }),
    );
    assert.equal(body.countries?.length, 1);
    assert.ok(body.countries?.[0]?.radius);
  });

  test("a radius with no point to measure from is not on: Worldwide stays", () => {
    assert.deepEqual(build(searchOf({}, { radiusKm: 25 })).countries, [
      { countryId: "za" },
      { countryId: "c-ww" },
    ]);
  });

  test("one entry per country: a manual home or Worldwide pick is not repeated", () => {
    assert.deepEqual(build(searchOf({}, { countries: ["za"] })).countries, [
      { countryId: "za" },
      { countryId: "c-ww" },
    ]);
    assert.deepEqual(build(searchOf({}, { countries: ["c-ww"] })).countries, [
      { countryId: "c-ww" },
      { countryId: "za" },
    ]);
  });

  test("with Worldwide among two countries, the place goes nowhere", () => {
    const body = build(
      searchOf({ location: capeTown }, { countries: ["c-ww"] }),
    );
    assert.equal(
      body.countries?.some((c) => c.region || c.city || c.radius),
      false,
    );
  });

  test("a manual Worldwide alone carries no detail", () => {
    assert.deepEqual(
      build(
        manualSearch({
          ...EMPTY_DISCOVERY_FILTERS,
          countries: ["c-ww"],
          city: "Cape Town",
        }),
      ).countries,
      [{ countryId: "c-ww" }],
    );
  });

  test("the inherited country skipped, or another country instead: no Worldwide", () => {
    assert.deepEqual(
      build(searchOf({}, { countries: ["ke"] }, { skipped: ["country"] }))
        .countries,
      [{ countryId: "ke" }],
    );
    assert.equal(
      "countries" in build(searchOf({}, {}, { skipped: ["country"] })),
      false,
    );
  });

  test("a countries lookup without Worldwide degrades to the home country alone", () => {
    assert.deepEqual(
      build(searchOf({}), "newest", {
        ...LOOKUPS,
        countries: [{ id: "za", codeAlpha2: "ZA" }],
      }).countries,
      [{ countryId: "za" }],
    );
  });
});

describe("rule 6 — custom-field clauses stay root", () => {
  test("sent as they are, beside the groups", () => {
    const clause = {
      key: "jobSalaryMinimum",
      operator: CustomFieldFilterOperator.GreaterThanOrEqual,
      values: ["5000"],
    };
    const body = build(
      searchOf({ goal: "biz" }, { types: ["Job"], customFields: [clause] }),
    );
    assert.deepEqual(body.customFields, [clause]);
    assert.equal(
      body.groups?.some((g) => g.anyOf.some((b) => "customFields" in b)),
      false,
    );
  });
});

describe("rule 7 — sort (L4)", () => {
  test("newest sends no ordering", () => {
    assert.equal("ordering" in build(searchOf({}), "newest"), false);
  });

  test("ending soonest: end date ascending, then newest", () => {
    assert.deepEqual(build(searchOf({}), "endingSoonest").ordering, [
      { field: "DateEnd", direction: "Ascending" },
      { field: "DateCreated", direction: "Descending" },
    ]);
  });

  test("most ZLTO: reward descending, then newest", () => {
    assert.deepEqual(build(searchOf({}), "mostZlto").ordering, [
      { field: "ZltoReward", direction: "Descending" },
      { field: "DateCreated", direction: "Descending" },
    ]);
  });

  test("never popularity", () => {
    for (const sort of ["newest", "endingSoonest", "mostZlto"] as const) {
      const body = build(searchOf({}), sort);
      assert.equal("mostViewed" in body, false);
      assert.equal("mostCompleted" in body, false);
    }
  });
});

describe("rule 8 — count parity", () => {
  test("the count is the results body without paging or order, plus totalCountOnly", () => {
    const search = searchOf(
      {
        goal: "biz",
        engagement: ["remote"],
        selfReportedSkills: [{ id: "s1", name: "Excel" }],
      },
      { types: ["Job"], engagementTypes: ["onsite"] },
    );
    for (const sort of ["newest", "endingSoonest", "mostZlto"] as const) {
      const { pageNumber, pageSize, ordering, ...criteria } = buildSearchFilter(
        search,
        sort,
        3,
        20,
        LOOKUPS,
      );
      assert.equal(pageNumber, 3);
      assert.equal(pageSize, 20);
      assert.equal(ordering === undefined, sort === "newest");
      assert.deepEqual(buildCountFilter(search, LOOKUPS), {
        ...criteria,
        totalCountOnly: true,
      });
    }
  });

  test("a sort change leaves the count body as it was", () => {
    const search = searchOf({ engagement: ["remote"] });
    const count = JSON.stringify(buildCountFilter(search, LOOKUPS));
    for (const sort of ["endingSoonest", "mostZlto"] as const) {
      const { pageNumber, pageSize, ordering, ...criteria } = buildSearchFilter(
        search,
        sort,
        1,
        20,
        LOOKUPS,
      );
      assert.ok(pageNumber && pageSize && ordering);
      assert.equal(
        JSON.stringify({ ...criteria, totalCountOnly: true }),
        count,
      );
    }
  });
});

describe("rule 9 — ZLTO", () => {
  const zlto = (patch: Partial<DiscoveryFilters>) =>
    build(manualSearch({ ...EMPTY_DISCOVERY_FILTERS, ...patch })).zltoReward;

  test("hasReward: false with no ranges is never sent", () => {
    assert.equal(zlto({ hasReward: false }), undefined);
  });

  test("ranges with a positive reward: the ranges alone", () => {
    assert.deepEqual(zlto({ hasReward: true, zltoRanges: ["0|100"] }), {
      value: { ranges: ["0|100"] },
    });
  });

  test("a positive reward alone, or ranges alone", () => {
    assert.deepEqual(zlto({ hasReward: true }), {
      value: { hasReward: true },
    });
    assert.deepEqual(zlto({ zltoRanges: ["100|500"] }), {
      value: { ranges: ["100|500"] },
    });
  });

  test("only the member in use goes out: no null inside ZLTO or the commitment", () => {
    const body = build(
      searchOf(
        { maxCommitment: { intervalId: "week", count: 1 } },
        { zltoRanges: ["0|100"], hasReward: true },
      ),
    );
    assert.deepEqual(body.commitmentInterval, {
      value: { interval: { id: "week", count: 1 } },
    });
    assert.equal(JSON.stringify(body).includes("null"), false);
  });
});

describe("rule 10 — incentivized is root, with no mode (L5)", () => {
  test("inherited or manual, never in a group", () => {
    for (const body of [
      build(searchOf({ incentivized: true, goal: "biz" })),
      build(
        searchOf(
          { selfReportedSkills: [{ id: "s1", name: "Excel" }] },
          { incentivized: false },
        ),
      ),
    ]) {
      assert.ok(body.incentivized);
      assert.equal("unspecified" in body.incentivized, false);
      assert.equal(
        body.groups?.some((g) => g.anyOf.some((b) => "incentivized" in b)),
        false,
      );
    }
  });
});

describe("rule 11 — group limits", () => {
  /** The API counts a branch's members that are set. */
  const activeCriteria = (selection: OpportunitySearchSelection): number =>
    Object.values(selection).filter((value) => value != null).length;

  test("the worst realistic case: both groups, every type, every facet", () => {
    const body = build(
      searchOf(
        {
          goal: "biz",
          targetCategories: ["c-tech"],
          maxCommitment: { intervalId: "week", count: 1 },
          engagement: ["remote"],
          incentivized: true,
          languages: ["en"],
          selfReportedSkills: [{ id: "s1", name: "Excel" }],
          accessibility: {
            requirements: ["wheelchair"],
            otherDescription: "x",
          },
        },
        {
          q: "farm",
          types: Object.keys(LOOKUPS.typeIdByName),
          categories: ["c-biz"],
          countries: ["ke"],
          engagementTypes: ["onsite"],
          zltoRanges: ["0|100"],
          languages: ["fr"],
          accommodations: ["ramp"],
          sdgs: ["sdg-13"],
          provider: "KFC",
          featured: true,
          customFields: [
            {
              key: "jobSalaryMinimum",
              operator: CustomFieldFilterOperator.GreaterThanOrEqual,
              values: ["5000"],
            },
          ],
        },
        { profile: { age: 20, verifiedSkillIds: ["s2"] } },
      ),
      "mostZlto",
    );

    const groups = body.groups ?? [];
    assert.equal(groups.length, 2);
    assert.ok(groups.length <= 4);
    for (const group of groups) {
      assert.ok(group.anyOf.length >= 1 && group.anyOf.length <= 8);
      for (const branch of group.anyOf) {
        const count = activeCriteria(branch);
        assert.ok(count >= 1 && count <= 24, `${count} criteria`);
      }
    }
  });
});

describe("through the converter", () => {
  test("the typed request passes through untouched", () => {
    const body = build(
      searchOf(
        {
          goal: "biz",
          engagement: ["remote"],
          selfReportedSkills: [{ id: "s1", name: "Excel" }],
          accessibility: {
            requirements: ["wheelchair"],
            otherDescription: null,
          },
        },
        { zltoRanges: ["0|100"], hasReward: true },
      ),
      "endingSoonest",
    );
    assert.deepEqual(toSearchFilterPayload(body, "youth"), body);
  });
});
