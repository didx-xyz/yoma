import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type {
  CustomFieldDefinition,
  OpportunityInfo,
} from "~/api/models/opportunity";
import { cardFacts } from "./cardFacts";
import { cardStatus } from "./cardStatus";

// Local noon, Wed 7 Oct 2026: "today" is the youth's local calendar day, whatever the zone the
// tests run in. Stored dates are UTC calendar days.
const NOW = new Date(2026, 9, 7, 12);

const opportunity = (overrides: Partial<OpportunityInfo>): OpportunityInfo =>
  ({
    type: "Job",
    status: "Active",
    dateStart: "2026-10-05T00:00:00Z",
    dateEnd: "2026-11-30T00:00:00Z",
    commitmentIntervalDescription: null,
    participantLimit: null,
    participantCountTotal: 0,
    participantLimitReached: false,
    featured: false,
    customFields: [],
    accommodations: [],
    ...overrides,
  }) as unknown as OpportunityInfo;

const definition = (
  key: string,
  options: [string, string][],
): CustomFieldDefinition =>
  ({
    key,
    options: options.map(([optionKey, name]) => ({ key: optionKey, name })),
  }) as unknown as CustomFieldDefinition;

const DEFINITIONS = [
  definition("JobEmploymentType", [
    ["Permanent", "Permanent"],
    ["FixedTerm", "Fixed term"],
    ["Internship", "Internship"],
  ]),
  definition("JobEmploymentDurationUnit", [["Months", "Months"]]),
  definition("JobWorkSchedule", [
    ["FullTime", "Full-time"],
    ["PartTime", "Part-time"],
  ]),
  definition("LearningDifficulty", [["Beginner", "Beginner"]]),
  definition("EventDifficulty", [["OpenToAll", "Open to all"]]),
];

const RAMP = [
  { id: "ramp", name: "Ramp" },
] as OpportunityInfo["accommodations"];

const texts = (o: OpportunityInfo, accessibilityInSearch = false) =>
  cardFacts(o, DEFINITIONS, NOW, accessibilityInSearch).map(
    (fact) => fact.text,
  );

describe("Card facts say what they are (2026-10-07)", () => {
  test("a Job: the employment type alone, then the effort; a past start is no fact", () => {
    const job = opportunity({
      commitmentIntervalDescription: "1 Week",
      customFields: [
        { key: "JobEmploymentType", values: ["Permanent"] },
      ] as OpportunityInfo["customFields"],
    });
    assert.deepEqual(texts(job), ["Permanent", "1 week effort"]);
  });

  test("an employment type with its duration; the tooltip names it", () => {
    const job = opportunity({
      customFields: [
        { key: "JobEmploymentType", values: ["FixedTerm"] },
        { key: "JobEmploymentDuration", value: "6" },
        { key: "JobEmploymentDurationUnit", values: ["Months"] },
      ] as OpportunityInfo["customFields"],
    });
    const [fact] = cardFacts(job, DEFINITIONS, NOW, false);
    assert.equal(fact?.text, "Fixed term · 6 months");
    assert.equal(fact?.tip, "Employment: Fixed term · 6 months");
    // The accessible name leads with what the card shows (WCAG 2.5.3).
    assert.equal(
      fact?.label,
      "Fixed term · 6 months (Employment: Fixed term · 6 months)",
    );
  });

  test("the work schedule joins the employment fact, between type and duration (R19)", () => {
    const job = opportunity({
      customFields: [
        { key: "JobEmploymentType", values: ["Permanent"] },
        { key: "JobWorkSchedule", values: ["FullTime"] },
      ] as OpportunityInfo["customFields"],
    });
    assert.equal(texts(job)[0], "Permanent · Full-time");
    const fixed = opportunity({
      customFields: [
        { key: "JobEmploymentType", values: ["FixedTerm"] },
        { key: "JobWorkSchedule", values: ["PartTime"] },
        { key: "JobEmploymentDuration", value: "6" },
        { key: "JobEmploymentDurationUnit", values: ["Months"] },
      ] as OpportunityInfo["customFields"],
    });
    assert.equal(texts(fixed)[0], "Fixed term · Part-time · 6 months");
    // A schedule alone still makes the fact.
    const scheduleOnly = opportunity({
      customFields: [
        { key: "JobWorkSchedule", values: ["PartTime"] },
      ] as OpportunityInfo["customFields"],
    });
    assert.equal(texts(scheduleOnly)[0], "Part-time");
  });

  test("the tooltip's two lines: the fact's name and its whole value", () => {
    const learning = opportunity({
      type: "Learning",
      dateStart: "2026-11-06T00:00:00Z",
      customFields: [
        { key: "LearningDifficulty", values: ["Beginner"] },
      ] as OpportunityInfo["customFields"],
    });
    const facts = cardFacts(learning, DEFINITIONS, NOW, false);
    assert.deepEqual(
      facts.map((fact) => [fact.text, fact.name, fact.value, fact.tip]),
      [
        ["Beginner", "Difficulty", "Beginner", "Difficulty: Beginner"],
        ["Starts 6 Nov", "Start date", "Fri 6 Nov", "Start date: Fri 6 Nov"],
      ],
    );
  });
});

describe("The start date, while it is still to come (2026-10-07)", () => {
  const start = (dateStart: string) =>
    cardFacts(opportunity({ dateStart }), DEFINITIONS, NOW, false).find(
      (fact) => fact.kind === "date",
    );

  test("in calendar days: today, tomorrow, a weekday within the week, then the date", () => {
    assert.equal(start("2026-10-07T00:00:00Z")?.text, "Starts today");
    assert.equal(start("2026-10-08T23:59:59.999Z")?.text, "Starts tomorrow");
    assert.equal(start("2026-10-09T00:00:00Z")?.text, "Starts Fri");
    assert.equal(start("2026-10-13T00:00:00Z")?.text, "Starts Tue");
    assert.equal(start("2026-10-14T00:00:00Z")?.text, "Starts 14 Oct");
  });

  test("the tooltip gives the full date, with the year only when it is not this year", () => {
    assert.equal(start("2026-10-07T00:00:00Z")?.value, "Wed 7 Oct");
    assert.equal(start("2026-11-14T00:00:00Z")?.value, "Sat 14 Nov");
    assert.equal(start("2027-01-06T00:00:00Z")?.value, "Wed 6 Jan 2027");
  });

  test("a start that has passed is no fact", () => {
    assert.equal(start("2026-10-06T00:00:00Z"), undefined);
  });
});

describe("Accessibility, only while it is part of this search (2026-10-07)", () => {
  test("a Job names its accommodations only while accessibility is in the search", () => {
    const job = opportunity({ accommodations: RAMP });
    assert.deepEqual(texts(job), []);
    assert.deepEqual(texts(job, true), ["Accessibility: Ramp"]);
  });

  test("an Event names them whenever it says something, then difficulty fills a slot", () => {
    const event = opportunity({
      type: "Event",
      accommodations: RAMP,
      commitmentIntervalDescription: "2 Hours",
      customFields: [
        { key: "EventDifficulty", values: ["OpenToAll"] },
      ] as OpportunityInfo["customFields"],
    });
    // The start has passed, so the accessibility leads.
    assert.deepEqual(texts(event), [
      "Accessibility: Ramp",
      "2 hours effort",
      "Open to all",
    ]);
  });

  test("support alone: the tooltip's value is the support, not the fact's name again", () => {
    const event = opportunity({
      type: "Event",
      accessibilitySupport: "Yes",
    } as Partial<OpportunityInfo>);
    const [fact] = cardFacts(event, DEFINITIONS, NOW, false);
    assert.deepEqual(fact && [fact.text, fact.name, fact.value], [
      "Accessibility: Yes",
      "Accessibility",
      "Yes",
    ]);
  });

  test("four at most, in the type's order", () => {
    const job = opportunity({
      dateStart: "2026-10-08T00:00:00Z",
      commitmentIntervalDescription: "1 Week",
      accommodations: RAMP,
      customFields: [
        { key: "JobEmploymentType", values: ["Internship"] },
      ] as OpportunityInfo["customFields"],
    });
    assert.deepEqual(texts(job, true), [
      "Internship",
      "Starts tomorrow",
      "1 week effort",
      "Accessibility: Ramp",
    ]);
  });
});

describe("Languages and skills fill the spare slots (2026-10-08)", () => {
  const LANGUAGES = [
    { id: "en", name: "English" },
    { id: "fr", name: "French" },
    { id: "zu", name: "isiZulu" },
  ] as OpportunityInfo["languages"];
  const SKILLS = [
    { id: "a", name: "Teamwork" },
    { id: "b", name: "Sales" },
  ] as NonNullable<OpportunityInfo["skills"]>;

  test("after the type's own facts, the languages then the skills to earn", () => {
    const job = opportunity({
      commitmentIntervalDescription: "1 Week",
      languages: LANGUAGES,
      skills: SKILLS,
      verificationEnabled: true,
      customFields: [
        { key: "JobEmploymentType", values: ["Permanent"] },
      ] as OpportunityInfo["customFields"],
    });
    const facts = cardFacts(job, DEFINITIONS, NOW, false);
    assert.deepEqual(
      facts.map((fact) => [fact.text, fact.tip]),
      [
        ["Permanent", "Employment: Permanent"],
        ["1 week effort", "Time commitment: 1 Week"],
        ["English, French +1", "Languages: English, French, isiZulu"],
        ["2 skills to earn", "Skills you earn: Teamwork, Sales"],
      ],
    );
  });

  test("skills only while a completion is verified: that is what adds them to the YoID", () => {
    const job = opportunity({ skills: SKILLS, verificationEnabled: false });
    assert.deepEqual(texts(job), []);
    const one = opportunity({
      skills: SKILLS.slice(0, 1),
      verificationEnabled: true,
    });
    assert.deepEqual(texts(one), ["1 skill to earn"]);
  });

  test("never past four: the type's own facts keep their slots", () => {
    const job = opportunity({
      dateStart: "2026-10-08T00:00:00Z",
      commitmentIntervalDescription: "1 Week",
      languages: LANGUAGES,
      skills: SKILLS,
      verificationEnabled: true,
      customFields: [
        { key: "JobEmploymentType", values: ["Internship"] },
      ] as OpportunityInfo["customFields"],
    });
    assert.deepEqual(texts(job), [
      "Internship",
      "Starts tomorrow",
      "1 week effort",
      "English, French +1",
    ]);
  });
});

describe("Places left", () => {
  const status = (type: string, left: number) =>
    cardStatus(
      opportunity({
        type,
        participantLimit: 160,
        participantCountTotal: 160 - left,
      }),
      NOW,
    );

  test("the count only, singular for one", () => {
    assert.equal(status("Event", 160).places, "160 places left");
    assert.equal(status("Event", 1).places, "1 place left");
    assert.equal(status("Event", 0).places, "No places left");
    assert.equal(status("Event", 0).full, true);
  });

  test("a Job counts positions (R19)", () => {
    assert.equal(status("Job", 160).places, "160 positions left");
    assert.equal(status("Job", 1).places, "1 position left");
    assert.equal(status("Job", 0).places, "No positions left");
    assert.equal(status("Job", 0).full, true);
  });
});
