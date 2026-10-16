import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { UserPreferences } from "~/api/models/userPreferences";
import { EMPTY_USER_PREFERENCES } from "~/api/models/userPreferences";
import type { LandingRail, LandingRailLookups } from "./landingRails";
import { landingRails } from "./landingRails";
import type {
  InheritedFragments,
  PreferenceProfileContext,
} from "./preferenceMapping";
import {
  composeSearch,
  mapPreferencesToFilters,
  survivingFragments,
  withoutSkippedInterests,
} from "./preferenceMapping";
import { buildSearchFilter, DISCOVERY_PAGE_SIZE } from "./searchRequest";
import type { PreferenceKey } from "./types";
import { EMPTY_DISCOVERY_FILTERS } from "./types";
import { parseDiscoveryQuery } from "./urlCodec";

const LOOKUPS: LandingRailLookups = {
  typeIdByName: {
    Job: "t-job",
    Learning: "t-learn",
    ImpactAction: "t-impact",
    Event: "t-event",
    Entrepreneurship: "t-ent",
    Other: "t-other",
  },
  categories: [
    { id: "c-tech", name: "Technology, AI & Data", imageURL: "tech.svg" },
    { id: "c-biz", name: "Business, Finance & Marketing", imageURL: "biz.svg" },
    { id: "c-env", name: "Agriculture, Food, Environment and Climate" },
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `c-${i}`,
      name: `Category ${i}`,
    })),
  ],
  countries: [
    { id: "c-ww", name: "Worldwide", codeAlpha2: "WW" },
    { id: "za", name: "South Africa", codeAlpha2: "ZA" },
  ],
  timeIntervals: [
    { id: "hour", name: "Hour" },
    { id: "week", name: "Week" },
  ],
  engagementTypes: [{ id: "remote", name: "Remote" }],
};

const CAPE_TOWN: UserPreferences["location"] = {
  countryId: "za",
  region: "Western Cape",
  city: "Cape Town",
  // More precision than the URL keeps (`pt=` rounds to 2 decimals): the request must not care.
  coordinates: { latitude: -33.92487, longitude: 18.42406 },
  source: "places",
  placeId: null,
};

/** Every preference that shapes a rail, plus the ones only Picked for you applies. */
const FULL: Partial<UserPreferences> = {
  goal: "job",
  targetCategories: ["c-tech", "c-env"],
  location: CAPE_TOWN,
  maxCommitment: { intervalId: "week", count: 1 },
  incentivized: true,
  engagement: ["remote"],
  languages: ["en"],
  accessibility: {
    requirements: ["need-ramp", "need-sign"],
    otherDescription: null,
  },
};

const HOME: PreferenceProfileContext = {
  countryId: "za",
  age: 22,
  verifiedSkillIds: ["skill-1"],
  otherAccommodationId: null,
};

interface Options {
  skipped?: PreferenceKey[];
  off?: boolean;
  profile?: Partial<PreferenceProfileContext>;
  lookups?: LandingRailLookups;
}

/** The landing's inputs for a youth with these preferences, as `DiscoveryContext` builds them. */
const setup = (
  preferences: Partial<UserPreferences> | null,
  options: Options = {},
): { fragments: InheritedFragments; rails: LandingRail[] } => {
  const fragments = preferences
    ? mapPreferencesToFilters(
        { ...EMPTY_USER_PREFERENCES, ...preferences },
        { ...HOME, ...options.profile },
      )
    : {};
  const off = options.off ?? false;
  const skipped = options.skipped ?? [];
  const rails = landingRails({
    fragments,
    preferencesOff: off,
    preferencesSkipped: skipped,
    // The landing: no filter of its own, only the preference layer.
    search: composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, off, skipped),
    // Every surviving fragment here draws an inherited chip, so this is `inheritedSummary`'s answer.
    personalized: survivingFragments(fragments, off, skipped).length > 0,
    lookups: options.lookups ?? LOOKUPS,
  });
  return { fragments, rails };
};

const ids = (rails: LandingRail[]): string[] => rails.map((rail) => rail.id);

const requestOf = (rail: LandingRail, lookups = LOOKUPS) =>
  buildSearchFilter(rail.search, "newest", 1, DISCOVERY_PAGE_SIZE, lookups);

/** The results page a See all opens: parsed from its URL, composed as `DiscoveryContext` does. */
const destinationRequest = (
  queryString: string,
  fragments: InheritedFragments,
  lookups = LOOKUPS,
) => {
  const state = parseDiscoveryQuery(
    Object.fromEntries(new URLSearchParams(queryString)),
  );
  const search = composeSearch(
    state.filters,
    fragments,
    state.preferencesOff,
    state.preferencesSkipped,
  );
  return buildSearchFilter(
    search,
    state.sort,
    state.page,
    DISCOVERY_PAGE_SIZE,
    lookups,
  );
};

/** Every rail with a See all opens on its own page-1 request: the same query key. */
const assertSeeAllReusesQuery = (
  rails: LandingRail[],
  fragments: InheritedFragments,
): void => {
  for (const rail of rails) {
    if (rail.seeAllQueryString === "" || !rail.seeAllExact) continue;
    assert.deepEqual(
      destinationRequest(rail.seeAllQueryString, fragments),
      requestOf(rail),
      `${rail.id}: See all builds a different request`,
    );
  }
};

describe("landingRails — the catalogue and its order", () => {
  test("every preference: picked, near, goal, a rail per category, commitment, paid, featured", () => {
    const { rails } = setup(FULL);
    // Latest is the place alone, which Near you already is.
    assert.deepEqual(ids(rails), [
      "picked",
      "near",
      "goal",
      "category:c-tech",
      "category:c-env",
      "commitment",
      "paid",
      "featured",
    ]);
  });

  test("one rail per saved category, in the youth's order, named from the lookup", () => {
    const { rails } = setup({ targetCategories: ["c-env", "c-tech"] });
    const categories = rails.filter((rail) => rail.kind === "category");
    assert.deepEqual(
      categories.map((rail) => rail.kind === "category" && rail.category),
      [
        {
          id: "c-env",
          name: "Agriculture, Food, Environment and Climate",
          imageURL: null,
        },
        { id: "c-tech", name: "Technology, AI & Data", imageURL: "tech.svg" },
      ],
    );
    assert.deepEqual(requestOf(categories[0]!).categories, {
      value: ["c-env"],
    });
  });

  test("a saved category the lookup does not list draws no rail", () => {
    const { rails } = setup({ targetCategories: ["c-gone", "c-tech"] });
    assert.ok(!ids(rails).includes("category:c-gone"));
    assert.ok(ids(rails).includes("category:c-tech"));
  });

  test("a saved time commitment, else Done in under an hour, in the same slot", () => {
    const withCommitment = setup(FULL).rails;
    const commitment = withCommitment.find((r) => r.kind === "commitment");
    assert.ok(commitment && commitment.kind === "commitment");
    assert.equal(commitment.intervalLabel, "Up to a week");
    assert.deepEqual(requestOf(commitment).commitmentInterval, {
      value: { interval: { id: "week", count: 1 } },
    });
    assert.ok(!ids(withCommitment).includes("under-an-hour"));

    const without = setup({ ...FULL, maxCommitment: null }).rails;
    assert.deepEqual(ids(without).slice(5, 7), ["under-an-hour", "paid"]);
    const hour = without.find((r) => r.kind === "under-an-hour")!;
    assert.deepEqual(requestOf(hour).commitmentInterval, {
      value: { interval: { id: "hour", count: 1 } },
    });

    // A skipped commitment is no commitment.
    const skipped = setup(FULL, { skipped: ["maxCommitment"] }).rails;
    assert.ok(ids(skipped).includes("under-an-hour"));
    assert.ok(!ids(skipped).includes("commitment"));
  });

  test("Paid only for a youth who asked for paid opportunities", () => {
    assert.ok(
      !ids(setup({ ...FULL, incentivized: false }).rails).includes("paid"),
    );
    assert.ok(
      !ids(setup({ ...FULL, incentivized: null }).rails).includes("paid"),
    );
    const paid = setup(FULL).rails.find((r) => r.kind === "paid")!;
    assert.deepEqual(requestOf(paid).incentivized, { value: true });
  });

  test("a rail for every saved category, in the youth's order (2026-10-08)", () => {
    const { rails } = setup({
      ...FULL,
      targetCategories: [
        "c-gone",
        ...Array.from({ length: 10 }, (_, i) => `c-${i}`),
      ],
    });
    // A category the lookup does not list has no rail.
    assert.deepEqual(ids(rails), [
      "picked",
      "near",
      "goal",
      ...Array.from({ length: 10 }, (_, i) => `category:c-${i}`),
      "commitment",
      "paid",
      "featured",
    ]);
  });

  test("with nothing deduplicated, every rail draws: nine with three categories", () => {
    // No place: Latest stands on its own beside Featured.
    const { rails } = setup(
      { ...FULL, location: undefined, targetCategories: ["c-0", "c-1", "c-2"] },
      { profile: { countryId: null } },
    );
    assert.deepEqual(ids(rails), [
      "picked",
      "goal",
      "category:c-0",
      "category:c-1",
      "category:c-2",
      "commitment",
      "paid",
      "featured",
      "latest",
    ]);
  });
});

describe("landingRails — the place base layer", () => {
  test("every rail but Picked for you carries the place, as plain filters", () => {
    const { rails } = setup(FULL);
    for (const rail of rails.filter((r) => r.kind !== "picked")) {
      assert.deepEqual(
        requestOf(rail).countries,
        [
          {
            countryId: "za",
            region: { value: "Western Cape" },
            city: { value: "Cape Town" },
          },
        ],
        rail.id,
      );
      assert.deepEqual(rail.place, {
        countryId: "za",
        countryName: "South Africa",
        region: "Western Cape",
        city: "Cape Town",
      });
      // Only the place: none of the youth's other preferences.
      const body = requestOf(rail);
      assert.equal(body.age, undefined, rail.id);
      assert.equal(body.engagementTypes, undefined, rail.id);
      assert.equal(body.languages, undefined, rail.id);
      assert.equal(body.accommodations, undefined, rail.id);
      assert.equal(body.groups, undefined, rail.id);
    }
  });

  test("Picked for you is the surface's own search, the whole layer", () => {
    const { rails } = setup(FULL);
    const picked = rails[0]!;
    assert.equal(picked.kind, "picked");
    assert.equal(picked.personalized, true);
    const body = requestOf(picked);
    assert.equal(body.age, 22);
    assert.deepEqual(body.accommodations, {
      value: ["need-ramp", "need-sign"],
      unspecified: "Include",
    });
    // The inherited country brings Worldwide.
    assert.ok(body.countries?.some((c) => c.countryId === "c-ww"));
    assert.ok(rails.slice(1).every((rail) => !rail.personalized));
  });

  test("a skipped location leaves the country under every rail", () => {
    const { rails } = setup(FULL, { skipped: ["location"] });
    for (const rail of rails.filter((r) => r.kind !== "picked")) {
      assert.deepEqual(
        requestOf(rail).countries,
        [{ countryId: "za" }],
        rail.id,
      );
      assert.ok(!rail.seeAllQueryString.includes("city="), rail.id);
    }
    assert.ok(ids(rails).includes("near"));
  });

  test("a skipped country takes the place with it: no Near you, Latest is everything", () => {
    const { rails } = setup(FULL, { skipped: ["country"] });
    assert.ok(!ids(rails).includes("near"));
    for (const rail of rails.filter((r) => r.kind !== "picked")) {
      assert.equal(requestOf(rail).countries, undefined, rail.id);
      assert.equal(rail.place, null, rail.id);
    }
    const latest = rails.find((r) => r.kind === "latest");
    assert.ok(latest);
    // No filter of its own, so its See all carries "All opportunities" (2026-10-08).
    assert.equal(latest.seeAllQueryString, "all=1&prefsOff=1");
  });

  test("no place: no Near you, and Latest stays", () => {
    const { rails } = setup(
      { goal: "learn" },
      { profile: { countryId: null } },
    );
    // Picked for you also carries the age and the verified skills, so the goal keeps its rail.
    assert.deepEqual(ids(rails), [
      "picked",
      "goal",
      "under-an-hour",
      "featured",
      "latest",
    ]);
    const latest = rails.find((r) => r.kind === "latest")!;
    assert.equal(latest.seeAllQueryString, "all=1&prefsOff=1");
    assert.deepEqual(requestOf(latest), { pageNumber: 1, pageSize: 20 });
    // `all` never reaches the API: the results page asks exactly what the rail asked.
    assert.deepEqual(
      destinationRequest(latest.seeAllQueryString, {}),
      requestOf(latest),
    );
  });
});

describe("landingRails — duplicates", () => {
  test("Latest collapses into Near you: both are the place alone", () => {
    const { rails } = setup({ location: CAPE_TOWN });
    assert.ok(ids(rails).includes("near"));
    assert.ok(!ids(rails).includes("latest"));
  });

  test("a rail whose request repeats an earlier one's is dropped", () => {
    // Signed out with one category and no country: Picked for you IS that category's rail.
    const { rails } = setup(
      { targetCategories: ["c-tech"] },
      { profile: { countryId: null, age: null, verifiedSkillIds: [] } },
    );
    assert.deepEqual(ids(rails), [
      "picked",
      "under-an-hour",
      "featured",
      "latest",
    ]);
  });
});

describe("landingRails — nothing of the youth's in play", () => {
  const TODAY = ["featured", "latest", "under-an-hour"];

  test("preferences off: today's three, in today's order, with no place", () => {
    const { rails } = setup(FULL, { off: true });
    assert.deepEqual(ids(rails), TODAY);
    for (const rail of rails) {
      assert.equal(requestOf(rail).countries, undefined, rail.id);
      assert.equal(rail.place, null);
    }
    // Latest has no filter of its own: its See all carries "All opportunities" (2026-10-08).
    assert.equal(rails[1]!.seeAllQueryString, "all=1&prefsOff=1");
    assert.equal(rails[0]!.seeAllQueryString, "featured=1&prefsOff=1");
  });

  test("no preferences, signed out", () => {
    assert.deepEqual(
      ids(setup(null, { profile: { countryId: null } }).rails),
      TODAY,
    );
  });

  test("every preference skipped", () => {
    const { fragments } = setup(FULL);
    const all = Object.keys(fragments) as PreferenceKey[];
    assert.deepEqual(ids(setup(FULL, { skipped: all }).rails), TODAY);
  });

  test("Done in under an hour waits for the Hour interval", () => {
    const { rails } = setup(null, {
      lookups: { ...LOOKUPS, timeIntervals: [] },
    });
    assert.deepEqual(ids(rails), ["featured", "latest"]);
  });
});

describe("landingRails — See all reuses the rail's query", () => {
  test("every rail, every preference", () => {
    const { fragments, rails } = setup(FULL);
    assertSeeAllReusesQuery(rails, fragments);
    assert.ok(rails.every((rail) => rail.seeAllExact));
    assert.ok(rails.every((rail) => rail.seeAllQueryString !== ""));
  });

  test("Done in under an hour, Latest and Near you", () => {
    const { fragments, rails } = setup(
      { ...FULL, maxCommitment: null },
      { skipped: ["location"] },
    );
    assert.ok(ids(rails).includes("under-an-hour"));
    assertSeeAllReusesQuery(rails, fragments);
    // Without a place Latest's See all carries `all`; Near you takes it otherwise.
    const off = setup(FULL, { off: true });
    assertSeeAllReusesQuery(off.rails, off.fragments);
  });

  test("a skipped interest: no rail of its own, and Picked's See all carries it (2026-10-08)", () => {
    const saved = mapPreferencesToFilters(
      { ...EMPTY_USER_PREFERENCES, ...FULL },
      HOME,
    );
    // The surface hands the rails the layer without the skipped interest, as the context does.
    const fragments = withoutSkippedInterests(saved, ["c-tech"]);
    const rails = landingRails({
      fragments,
      preferencesOff: false,
      preferencesSkipped: [],
      interestsSkipped: ["c-tech"],
      search: composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, false, []),
      personalized: true,
      lookups: LOOKUPS,
    });
    assert.ok(!ids(rails).includes("category:c-tech"));
    assert.ok(ids(rails).includes("category:c-env"));
    const picked = rails.find((r) => r.kind === "picked")!;
    const state = parseDiscoveryQuery(
      Object.fromEntries(new URLSearchParams(picked.seeAllQueryString)),
    );
    assert.deepEqual(state.interestsSkipped, ["c-tech"]);
    // The destination composes from the saved layer minus the skipped interest: the same request.
    const destination = composeSearch(
      state.filters,
      withoutSkippedInterests(saved, state.interestsSkipped),
      state.preferencesOff,
      state.preferencesSkipped,
    );
    assert.deepEqual(
      buildSearchFilter(destination, "newest", 1, DISCOVERY_PAGE_SIZE, LOOKUPS),
      requestOf(picked),
    );
  });

  test("with skips: Picked for you carries them, so the destination composes the same search", () => {
    const skipped: PreferenceKey[] = ["goal", "location", "engagement"];
    const { fragments, rails } = setup(FULL, { skipped });
    const picked = rails.find((r) => r.kind === "picked")!;
    const state = parseDiscoveryQuery(
      Object.fromEntries(new URLSearchParams(picked.seeAllQueryString)),
    );
    assert.deepEqual(state.preferencesSkipped, skipped);
    assert.equal(state.preferencesOff, false);
    assertSeeAllReusesQuery(rails, fragments);
  });

  test("Picked for you with only private or unparametered preferences has no See all", () => {
    const { rails } = setup(
      {
        accessibility: { requirements: ["need-ramp"], otherDescription: null },
      },
      { profile: { countryId: null, age: null } },
    );
    assert.equal(rails[0]!.kind, "picked");
    assert.equal(rails[0]!.seeAllQueryString, "");
  });

  test("Start a business: the rail keeps the category OR; its See all opens the type alone", () => {
    const { fragments, rails } = setup({ ...FULL, goal: "biz" });
    const goal = rails.find((r) => r.kind === "goal")!;
    assert.deepEqual(requestOf(goal).groups, [
      {
        anyOf: [
          { types: { value: ["t-ent"] } },
          { categories: { value: ["c-biz"] } },
        ],
      },
    ]);
    assert.equal(goal.seeAllExact, false);
    const destination = destinationRequest(goal.seeAllQueryString, fragments);
    assert.deepEqual(destination.types, { value: ["t-ent"] });
    assert.equal(destination.groups, undefined);
    assert.deepEqual(destination.countries, requestOf(goal).countries);
    // Every other rail still reuses its query.
    assertSeeAllReusesQuery(rails, fragments);
  });

  test("Start a business without its category in the lookup: the type alone, exact", () => {
    const lookups = {
      ...LOOKUPS,
      categories: LOOKUPS.categories.filter((c) => c.id !== "c-biz"),
    };
    const { rails } = setup({ ...FULL, goal: "biz" }, { lookups });
    const goal = rails.find((r) => r.kind === "goal")!;
    assert.equal(goal.seeAllExact, true);
    assert.deepEqual(requestOf(goal, lookups).types, { value: ["t-ent"] });
  });
});

describe("landingRails — accessibility needs stay private", () => {
  test("no See all names them, with or without skips", () => {
    for (const skipped of [
      [],
      ["goal"],
      ["location", "country"],
    ] as PreferenceKey[][]) {
      const { rails } = setup(FULL, { skipped });
      for (const rail of rails) {
        const params = new URLSearchParams(rail.seeAllQueryString);
        assert.equal(params.get("acc"), null, rail.id);
        assert.ok(!rail.seeAllQueryString.includes("need-"), rail.id);
      }
    }
  });

  test("only Picked for you applies them", () => {
    const { rails } = setup(FULL);
    for (const rail of rails)
      assert.equal(
        requestOf(rail).accommodations !== undefined,
        rail.kind === "picked",
        rail.id,
      );
  });
});
