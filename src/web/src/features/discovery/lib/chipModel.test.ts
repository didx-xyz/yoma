import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { UserPreferences } from "~/api/models/userPreferences";
import { EMPTY_USER_PREFERENCES } from "~/api/models/userPreferences";
import type { DiscoveryChip } from "./chipModel";
import {
  buildChips,
  filteringSummary,
  headingSubject,
  inheritedSummary,
  recentSearchLabel,
  tunedToParts,
} from "./chipModel";
import { mapPreferencesToFilters } from "./preferenceMapping";
import type { SearchLookups } from "./searchRequest";
import type { DiscoveryFilters, PreferenceKey } from "./types";
import { EMPTY_DISCOVERY_FILTERS } from "./types";

const NEEDS: Record<string, string> = {
  wheelchair: "Wheelchair accessible",
  sign: "Sign language interpretation",
};

const NAMES: Record<string, string> = {
  ...NEEDS,
  "c-biz": "Business, Finance & Marketing",
  "c-tech": "Technology, AI & Data",
  remote: "Remote",
  onsite: "On-site",
  za: "South Africa",
};

/** Resolves every value to a readable name, so a leaked need would show by name. */
const resolve = (_facet: string, value: string): string =>
  NAMES[value] ?? value;

const LOOKUPS: SearchLookups = {
  typeIdByName: {
    Job: "t-job",
    Learning: "t-learn",
    Entrepreneurship: "t-ent",
  },
  categories: [
    { id: "c-tech", name: "Technology, AI & Data" },
    { id: "c-biz", name: "Business, Finance & Marketing" },
  ],
  countries: [
    { id: "c-ww", codeAlpha2: "WW" },
    { id: "za", codeAlpha2: "ZA" },
  ],
};

const chipsFor = (
  patch: Partial<UserPreferences>,
  verifiedSkillIds: string[] = [],
  options: {
    manual?: Partial<DiscoveryFilters>;
    skipped?: PreferenceKey[];
    countryId?: string | null;
    lookups?: SearchLookups;
  } = {},
) =>
  buildChips(
    { ...EMPTY_DISCOVERY_FILTERS, ...options.manual },
    mapPreferencesToFilters(
      { ...EMPTY_USER_PREFERENCES, ...patch },
      {
        countryId: options.countryId ?? null,
        age: null,
        verifiedSkillIds,
        otherAccommodationId: null,
      },
    ),
    false,
    options.skipped ?? [],
    resolve,
    options.lookups ?? LOOKUPS,
  );

const chip = (
  patch: Partial<UserPreferences>,
  id: string,
  verifiedSkillIds: string[] = [],
) => chipsFor(patch, verifiedSkillIds).find((c) => c.id === id);

describe("inherited chip values (2026-10-03)", () => {
  test('skills: "Skills: {n} job skill(s)", n the skills sent', () => {
    const one = chip(
      { selfReportedSkills: [{ id: "s1", name: "Excel" }] },
      "pref:skills",
    );
    assert.deepEqual([one?.group, one?.value], ["Skills", "1 job skill"]);
    // Self-attested plus verified, once each.
    const three = chip(
      {
        selfReportedSkills: [
          { id: "s1", name: "Excel" },
          { id: "s2", name: "Sales" },
        ],
      },
      "pref:skills",
      ["s2", "s3"],
    );
    assert.equal(three?.value, "3 job skills");
  });

  test('accessibility: "Accessibility: your needs", never naming or counting them', () => {
    const accessibility = chip(
      {
        accessibility: {
          requirements: ["wheelchair", "sign"],
          otherDescription: "A private need",
        },
      },
      "pref:accessibility",
    );
    assert.equal(accessibility?.group, "Accessibility");
    assert.equal(accessibility?.value, "your needs");
    const text = JSON.stringify(accessibility);
    for (const leak of [...Object.values(NEEDS), "A private need", "2"])
      assert.equal(text.includes(leak), false, leak);
  });

  test("accessibility: Other alone gives no chip", () => {
    const chips = buildChips(
      EMPTY_DISCOVERY_FILTERS,
      mapPreferencesToFilters(
        {
          ...EMPTY_USER_PREFERENCES,
          accessibility: {
            requirements: ["other"],
            otherDescription: "A private need",
          },
        },
        {
          countryId: null,
          age: null,
          verifiedSkillIds: [],
          otherAccommodationId: "other",
        },
      ),
      false,
      [],
      resolve,
      LOOKUPS,
    );
    assert.equal(
      chips.some((c) => c.id === "pref:accessibility"),
      false,
    );
  });

  test('"Start a business": "Goal: Starting a business"; other goals stay "Type: …"', () => {
    const biz = chip({ goal: "biz" }, "pref:goal");
    assert.deepEqual([biz?.group, biz?.value], ["Goal", "Starting a business"]);
    const job = chip({ goal: "job" }, "pref:goal");
    assert.deepEqual([job?.group, job?.value], ["Type", "Job"]);
  });

  test("the new chips come last, accessibility after skills", () => {
    const ids = chipsFor({
      goal: "job",
      languages: ["en"],
      selfReportedSkills: [{ id: "s1", name: "Excel" }],
      accessibility: { requirements: ["wheelchair"], otherDescription: null },
    }).map((c) => c.id);
    assert.deepEqual(ids.slice(-3), [
      "pref:languages",
      "pref:skills",
      "pref:accessibility",
    ]);
  });

  test("a manual pick of an inherited need is not chipped twice", () => {
    const chips = buildChips(
      { ...EMPTY_DISCOVERY_FILTERS, accommodations: ["wheelchair"] },
      mapPreferencesToFilters(
        {
          ...EMPTY_USER_PREFERENCES,
          accessibility: {
            requirements: ["wheelchair"],
            otherDescription: null,
          },
        },
        {
          countryId: null,
          age: null,
          verifiedSkillIds: [],
          otherAccommodationId: null,
        },
      ),
      false,
      [],
      resolve,
      LOOKUPS,
    );
    assert.deepEqual(
      chips.map((c) => c.id),
      ["pref:accessibility"],
    );
  });
});

const SKILLS = [{ id: "s1", name: "Excel" }];
const WHEELCHAIR = {
  accessibility: { requirements: ["wheelchair"], otherDescription: null },
};

describe("inherited chip notes — the tooltip after the label (2026-10-03)", () => {
  test("skills: what the group does", () => {
    const skills = chip({ selfReportedSkills: SKILLS }, "pref:skills");
    assert.equal(skills?.provenance, "inherited");
    assert.equal(
      skills?.note,
      "Jobs that ask for none of these are left out; jobs that list no skills stay in. Other types aren't affected.",
    );
  });

  test("accessibility: the rule, never a need", () => {
    const accessibility = chip(
      {
        accessibility: {
          requirements: ["wheelchair", "sign"],
          otherDescription: null,
        },
      },
      "pref:accessibility",
    );
    assert.equal(
      accessibility?.note,
      "Leaves out opportunities that say No, or whose list misses one of your needs. Ones that haven't said stay in.",
    );
  });

  test('"Start a business": both halves, named from the lookups', () => {
    assert.equal(
      chip({ goal: "biz" }, "pref:goal")?.note,
      "Entrepreneurship, plus Business, Finance & Marketing opportunities of any type.",
    );
    // The category cannot be resolved: the request sends the type alone, so no note claims it.
    assert.equal(
      chipsFor({ goal: "biz" }, [], {
        lookups: { ...LOOKUPS, categories: [] },
      }).find((c) => c.id === "pref:goal")?.note,
      null,
    );
    assert.equal(chip({ goal: "job" }, "pref:goal")?.note, null);
  });

  test("a multi-value chip lists every value, so its +1 is never a dead end", () => {
    const engagement = chip(
      { engagement: ["remote", "onsite"] },
      "pref:engagement",
    );
    assert.equal(engagement?.value, "Remote +1");
    assert.equal(engagement?.note, "Remote, On-site");
    const interests = chip(
      { targetCategories: ["c-tech", "c-biz"] },
      "pref:targetCategories",
    );
    assert.equal(
      interests?.note,
      "Technology, AI & Data, Business, Finance & Marketing",
    );
    assert.equal(
      chip({ engagement: ["remote"] }, "pref:engagement")?.note,
      null,
    );
  });

  test("the inherited country also brings in worldwide", () => {
    assert.equal(
      chipsFor({}, [], { countryId: "za" }).find((c) => c.id === "pref:country")
        ?.note,
      "Also includes opportunities open worldwide, except in a distance search.",
    );
  });
});

describe("the skills chip on a search with no jobs (Q8)", () => {
  const skillsChip = (
    manual: Partial<DiscoveryFilters>,
    patch: Partial<UserPreferences> = {},
    skipped: PreferenceKey[] = [],
  ) =>
    chipsFor({ selfReportedSkills: SKILLS, ...patch }, [], {
      manual,
      skipped,
    }).find((c) => c.id === "pref:skills");

  test("types without Job: ghosted, with why", () => {
    const skills = skillsChip({ types: ["Learning"] });
    assert.equal(skills?.provenance, "inheritedInapplicable");
    assert.equal(skills?.note, "Not applied — this search has no jobs.");
  });

  test("no type, or Job among them: applied", () => {
    assert.equal(skillsChip({})?.provenance, "inherited");
    assert.equal(
      skillsChip({ types: ["Learning", "Job"] })?.provenance,
      "inherited",
    );
  });

  test("the goal's category branch can still bring Jobs in, so it stays applied", () => {
    // `jobSkillsApply`, not "no Job among the types": the group still narrows here.
    assert.equal(skillsChip({}, { goal: "biz" })?.provenance, "inherited");
    assert.equal(
      skillsChip({ types: ["Learning"] }, { goal: "biz" })?.provenance,
      "inherited",
    );
  });

  test("skipped wins: struck through with its own note, not ghosted", () => {
    const skills = skillsChip({ types: ["Learning"] }, {}, ["skills"]);
    assert.equal(skills?.provenance, "inheritedOff");
    assert.match(skills?.note ?? "", /^Jobs that ask/);
  });
});

describe("private chips and the summaries (Q2)", () => {
  const BIZ_WEEK_NEEDS: Partial<UserPreferences> = {
    goal: "biz",
    maxCommitment: { intervalId: "Week", count: 1 },
    ...WHEELCHAIR,
  };
  const leaks = (text: string): boolean =>
    [...Object.values(NEEDS), "your needs"].some((leak) =>
      text.toLowerCase().includes(leak.toLowerCase()),
    );

  test("only the inherited accessibility chip is private", () => {
    const chips = chipsFor(BIZ_WEEK_NEEDS, [], {
      manual: { accommodations: ["sign"] },
    });
    assert.deepEqual(
      chips.filter((c) => c.private).map((c) => c.id),
      ["pref:accessibility"],
    );
  });

  test('"tuned to": named values first, the private one only in the +N', () => {
    const chips = chipsFor(BIZ_WEEK_NEEDS);
    const parts = tunedToParts(inheritedSummary(chips), 2);
    assert.deepEqual(parts, ["Starting a business", "Up to 1 week", "+1"]);
    assert.equal(leaks(parts.join(" · ")), false);
  });

  test('"tuned to" with nothing nameable is empty — the caller says "your preferences"', () => {
    assert.deepEqual(
      tunedToParts(inheritedSummary(chipsFor(WHEELCHAIR)), 2),
      [],
    );
    // The rail still renders: a preference applies.
    assert.equal(inheritedSummary(chipsFor(WHEELCHAIR)).unnamed, 1);
  });

  test("a skipped private chip is neither named nor counted", () => {
    const summary = inheritedSummary(
      chipsFor(BIZ_WEEK_NEEDS, [], { skipped: ["accessibility"] }),
    );
    assert.deepEqual(summary, {
      named: ["Starting a business", "Up to 1 week"],
      unnamed: 0,
    });
  });

  test("the results heading counts it in + N filters, never names it", () => {
    const subject = headingSubject(
      null,
      filteringSummary(chipsFor(BIZ_WEEK_NEEDS)),
      0,
    );
    assert.deepEqual(subject, { first: "Starting a business", rest: 2 });
    // The free text leads; custom-field clauses add to the rest.
    assert.deepEqual(
      headingSubject("kfc", filteringSummary(chipsFor(BIZ_WEEK_NEEDS)), 1),
      { first: "“kfc”", rest: 4 },
    );
  });

  test("the heading with a private value alone names the layer, not the need", () => {
    assert.deepEqual(
      headingSubject(null, filteringSummary(chipsFor(WHEELCHAIR)), 0),
      { first: "your preferences", rest: 0 },
    );
    assert.equal(headingSubject(null, filteringSummary([]), 0), null);
  });

  test("the recent-search label leaves it out entirely", () => {
    const label = recentSearchLabel(
      null,
      filteringSummary(chipsFor(BIZ_WEEK_NEEDS)),
    );
    assert.equal(label, "Starting a business · Up to 1 week");
    assert.equal(
      recentSearchLabel(null, filteringSummary(chipsFor(WHEELCHAIR))),
      "Your preferences",
    );
    assert.equal(
      recentSearchLabel(null, filteringSummary([])),
      "All opportunities",
    );
    assert.equal(
      recentSearchLabel("kfc", filteringSummary(chipsFor(WHEELCHAIR))),
      "kfc",
    );
  });

  test("no chip's label, note or value names a need", () => {
    const chips: DiscoveryChip[] = chipsFor({
      ...BIZ_WEEK_NEEDS,
      accessibility: {
        requirements: ["wheelchair", "sign"],
        otherDescription: null,
      },
    }).filter((c) => c.prefKey !== null);
    for (const c of chips)
      assert.equal(
        [...Object.values(NEEDS)].some((need) =>
          `${c.group} ${c.value} ${c.note ?? ""}`.includes(need),
        ),
        false,
        c.id,
      );
  });
});
