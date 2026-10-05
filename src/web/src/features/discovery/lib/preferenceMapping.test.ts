import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { UserPreferences } from "~/api/models/userPreferences";
import { EMPTY_USER_PREFERENCES } from "~/api/models/userPreferences";
import type { PreferenceProfileContext } from "./preferenceMapping";
import {
  applySkipsToPreferences,
  categoryIdByName,
  composeSearch,
  GOAL_CATEGORY_NAMES,
  manualSearch,
  mapPreferencesToFilters,
  owningPreference,
  savableSkips,
  skipsAfterSave,
} from "./preferenceMapping";
import { EMPTY_DISCOVERY_FILTERS } from "./types";

const NO_PROFILE: PreferenceProfileContext = {
  countryId: null,
  age: null,
  verifiedSkillIds: [],
  otherAccommodationId: null,
};

const prefs = (patch: Partial<UserPreferences>): UserPreferences => ({
  ...EMPTY_USER_PREFERENCES,
  ...patch,
});

describe("engagement preference — mapping", () => {
  test("the whole list is the fragment", () => {
    assert.deepEqual(
      mapPreferencesToFilters(
        { ...EMPTY_USER_PREFERENCES, engagement: ["remote", "onsite"] },
        NO_PROFILE,
      ).engagement,
      { engagementTypes: ["remote", "onsite"] },
    );
  });

  test("an empty list maps to no fragment", () => {
    assert.equal(
      "engagement" in
        mapPreferencesToFilters(EMPTY_USER_PREFERENCES, NO_PROFILE),
      false,
    );
  });

  test("saving a skip clears it to an empty list", () => {
    assert.deepEqual(
      applySkipsToPreferences(
        { ...EMPTY_USER_PREFERENCES, engagement: ["remote"] },
        ["engagement"],
      ).engagement,
      [],
    );
  });
});

describe("skills, accessibility and the goal — mapping", () => {
  test("skills: self-attested plus verified, once each", () => {
    const fragments = mapPreferencesToFilters(
      prefs({
        selfReportedSkills: [
          { id: "s1", name: "Excel" },
          { id: "s2", name: "Sales" },
        ],
      }),
      { ...NO_PROFILE, verifiedSkillIds: ["s2", "s3"] },
    );
    assert.deepEqual(fragments.skills, { skills: ["s1", "s2", "s3"] });
  });

  test("skills: verified alone are inherited; none at all is no fragment", () => {
    assert.deepEqual(
      mapPreferencesToFilters(EMPTY_USER_PREFERENCES, {
        ...NO_PROFILE,
        verifiedSkillIds: ["s3"],
      }).skills,
      { skills: ["s3"] },
    );
    assert.equal(
      "skills" in mapPreferencesToFilters(EMPTY_USER_PREFERENCES, NO_PROFILE),
      false,
    );
  });

  test("accessibility: the requirements, never the private Other description", () => {
    const fragments = mapPreferencesToFilters(
      prefs({
        accessibility: {
          requirements: ["wheelchair", "other"],
          otherDescription: "A private need",
        },
      }),
      NO_PROFILE,
    );
    assert.deepEqual(fragments.accessibility, {
      accommodations: ["wheelchair", "other"],
    });
    assert.equal(JSON.stringify(fragments).includes("A private need"), false);
  });

  test("accessibility: Other is dropped — it cannot match without its description", () => {
    const withOther = { ...NO_PROFILE, otherAccommodationId: "other" };
    assert.deepEqual(
      mapPreferencesToFilters(
        prefs({
          accessibility: {
            requirements: ["wheelchair", "other"],
            otherDescription: "A private need",
          },
        }),
        withOther,
      ).accessibility,
      { accommodations: ["wheelchair"] },
    );
    assert.equal(
      "accessibility" in
        mapPreferencesToFilters(
          prefs({
            accessibility: {
              requirements: ["other"],
              otherDescription: "A private need",
            },
          }),
          withOther,
        ),
      false,
      "Other alone inherits nothing",
    );
  });

  test("accessibility: nothing until Other is known, so no chip shows and then vanishes", () => {
    const saved = prefs({
      accessibility: {
        requirements: ["wheelchair", "other"],
        otherDescription: null,
      },
    });
    assert.equal(
      "accessibility" in
        mapPreferencesToFilters(saved, {
          ...NO_PROFILE,
          otherAccommodationId: undefined,
        }),
      false,
    );
    // Settled without Other in either list: the accepted degraded path sends the needs as saved.
    assert.deepEqual(
      mapPreferencesToFilters(saved, {
        ...NO_PROFILE,
        otherAccommodationId: null,
      }).accessibility,
      { accommodations: ["wheelchair", "other"] },
    );
  });

  test("accessibility: no requirements is no fragment", () => {
    assert.equal(
      "accessibility" in
        mapPreferencesToFilters(
          prefs({
            accessibility: { requirements: [], otherDescription: "stale" },
          }),
          NO_PROFILE,
        ),
      false,
    );
  });

  test("the goal fragment carries its type and the goal itself", () => {
    assert.deepEqual(
      mapPreferencesToFilters(prefs({ goal: "biz" }), NO_PROFILE).goal,
      { types: ["Entrepreneurship"], userGoal: "biz" },
    );
    assert.deepEqual(
      mapPreferencesToFilters(prefs({ goal: "job" }), NO_PROFILE).goal,
      { types: ["Job"], userGoal: "job" },
    );
  });

  test("fragment order: skills after languages, accessibility last (L8)", () => {
    const fragments = mapPreferencesToFilters(
      prefs({
        goal: "job",
        engagement: ["remote"],
        languages: ["en"],
        selfReportedSkills: [{ id: "s1", name: "Excel" }],
        accessibility: { requirements: ["wheelchair"], otherDescription: null },
      }),
      {
        countryId: "za",
        age: 20,
        verifiedSkillIds: [],
        otherAccommodationId: null,
      },
    );
    assert.deepEqual(Object.keys(fragments), [
      "goal",
      "country",
      "age",
      "engagement",
      "languages",
      "skills",
      "accessibility",
    ]);
  });

  test("owningPreference finds the goal, accessibility and skills values", () => {
    const fragments = mapPreferencesToFilters(
      prefs({
        goal: "biz",
        selfReportedSkills: [{ id: "s1", name: "Excel" }],
        accessibility: { requirements: ["wheelchair"], otherDescription: null },
      }),
      NO_PROFILE,
    );
    assert.equal(
      owningPreference(fragments, "types", "Entrepreneurship"),
      "goal",
    );
    assert.equal(
      owningPreference(fragments, "accommodations", "wheelchair"),
      "accessibility",
    );
    assert.equal(owningPreference(fragments, "skills", "s1"), "skills");
  });

  test("the goal's category resolves by name, the pre-migration name too", () => {
    const names = GOAL_CATEGORY_NAMES.biz!;
    assert.equal(
      categoryIdByName(
        [{ id: "c-biz", name: "business, finance & marketing" }],
        names,
      ),
      "c-biz",
    );
    assert.equal(
      categoryIdByName(
        [{ id: "c-old", name: "Business and Entrepreneurship" }],
        names,
      ),
      "c-old",
    );
    assert.equal(categoryIdByName([{ id: "x", name: "Other" }], names), null);
  });
});

describe("composeSearch — provenance", () => {
  const fragments = mapPreferencesToFilters(
    prefs({
      goal: "biz",
      engagement: ["remote"],
      accessibility: { requirements: ["wheelchair"], otherDescription: null },
      selfReportedSkills: [{ id: "s1", name: "Excel" }],
    }),
    {
      countryId: "za",
      age: null,
      verifiedSkillIds: [],
      otherAccommodationId: null,
    },
  );

  test("inherited only: the effective values, and both multi-selects inherited", () => {
    const search = composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, false, []);
    assert.deepEqual(search.filters.engagementTypes, ["remote"]);
    assert.deepEqual(search.filters.accommodations, ["wheelchair"]);
    assert.deepEqual(search.filters.skills, ["s1"]);
    assert.deepEqual(search.inheritedOnly, {
      engagementTypes: true,
      accommodations: true,
    });
    assert.equal(search.inheritedCountry, true);
  });

  test("a manual pick unions with the inherited values, and the manual mode wins", () => {
    const search = composeSearch(
      {
        ...EMPTY_DISCOVERY_FILTERS,
        engagementTypes: ["onsite"],
        accommodations: ["ramp"],
      },
      fragments,
      false,
      [],
    );
    assert.deepEqual(search.filters.engagementTypes, ["onsite", "remote"]);
    assert.deepEqual(search.filters.accommodations, ["ramp", "wheelchair"]);
    assert.deepEqual(search.inheritedOnly, {
      engagementTypes: false,
      accommodations: false,
    });
  });

  test("a manual duplicate of an inherited value is not a pick of its own", () => {
    // The "Picked for you" See all writes the inherited values into the URL: the count holds.
    const search = composeSearch(
      { ...EMPTY_DISCOVERY_FILTERS, engagementTypes: ["remote"] },
      fragments,
      false,
      [],
    );
    assert.equal(search.inheritedOnly.engagementTypes, true);
  });

  test("a skipped preference leaves the manual pick alone", () => {
    const search = composeSearch(
      { ...EMPTY_DISCOVERY_FILTERS, engagementTypes: ["onsite"] },
      fragments,
      false,
      ["engagement"],
    );
    assert.deepEqual(search.filters.engagementTypes, ["onsite"]);
    assert.equal(search.inheritedOnly.engagementTypes, false);
  });

  test("scalars and a manual place replace the inherited value", () => {
    const withScalars = mapPreferencesToFilters(
      prefs({
        maxCommitment: { intervalId: "week", count: 1 },
        incentivized: true,
        location: {
          countryId: "za",
          region: "Western Cape",
          city: "Cape Town",
          coordinates: { latitude: -33.9, longitude: 18.4 },
          source: null,
          placeId: null,
        },
      }),
      {
        countryId: "za",
        age: null,
        verifiedSkillIds: [],
        otherAccommodationId: null,
      },
    );
    const search = composeSearch(
      {
        ...EMPTY_DISCOVERY_FILTERS,
        commitment: { intervalId: "day", count: 1 },
        incentivized: false,
        city: "Durban",
      },
      withScalars,
      false,
      [],
    );
    assert.deepEqual(search.filters.commitment, {
      intervalId: "day",
      count: 1,
    });
    assert.equal(search.filters.incentivized, false);
    assert.equal(search.filters.city, "Durban");
    assert.equal(search.filters.region, null);
  });

  test("the goal: Entrepreneurship stays a type; the category is request-only (L6)", () => {
    const search = composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, false, []);
    assert.deepEqual(search.filters.types, ["Entrepreneurship"]);
    assert.deepEqual(search.filters.categories, []);
    assert.deepEqual(search.goalCategoryNames, GOAL_CATEGORY_NAMES.biz);
  });

  test("skipping the goal, or preferences off, removes the category alternative", () => {
    assert.equal(
      composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, false, ["goal"])
        .goalCategoryNames,
      null,
    );
    assert.equal(
      composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, true, [])
        .goalCategoryNames,
      null,
    );
  });

  test("another goal brings no category alternative", () => {
    const job = mapPreferencesToFilters(prefs({ goal: "job" }), NO_PROFILE);
    assert.equal(
      composeSearch(EMPTY_DISCOVERY_FILTERS, job, false, []).goalCategoryNames,
      null,
    );
  });

  test("the inherited country: skipped or off, it no longer brings Worldwide", () => {
    assert.equal(
      composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, false, ["country"])
        .inheritedCountry,
      false,
    );
    assert.equal(
      composeSearch(EMPTY_DISCOVERY_FILTERS, fragments, true, [])
        .inheritedCountry,
      false,
    );
  });

  test("manualSearch carries no provenance", () => {
    const search = manualSearch({
      ...EMPTY_DISCOVERY_FILTERS,
      engagementTypes: ["remote"],
    });
    assert.deepEqual(search.inheritedOnly, {
      engagementTypes: false,
      accommodations: false,
    });
    assert.equal(search.goalCategoryNames, null);
    assert.equal(search.inheritedCountry, false);
  });
});

describe('"Make this my default" and skipped skills (2026-10-03)', () => {
  const selfAttested = prefs({
    selfReportedSkills: [{ id: "s1", name: "Excel" }],
  });

  test("skills are savable only while there are self-attested skills to clear", () => {
    assert.deepEqual(savableSkips(["skills", "goal"], selfAttested), [
      "skills",
      "goal",
    ]);
    assert.deepEqual(savableSkips(["skills", "goal"], EMPTY_USER_PREFERENCES), [
      "goal",
    ]);
  });

  test("identity-derived skips are never savable", () => {
    assert.deepEqual(savableSkips(["country", "age"], selfAttested), []);
  });

  test("after saving, skills stay skipped while verified skills remain", () => {
    assert.deepEqual(skipsAfterSave(["skills", "goal", "country"], ["v1"]), [
      "skills",
      "country",
    ]);
  });

  test("with no verified skills, saving drops the skills skip as before", () => {
    assert.deepEqual(skipsAfterSave(["skills", "goal", "age"], []), ["age"]);
  });

  test("saving clears the self-attested skills only", () => {
    assert.deepEqual(
      applySkipsToPreferences(selfAttested, ["skills"]).selfReportedSkills,
      [],
    );
  });
});
