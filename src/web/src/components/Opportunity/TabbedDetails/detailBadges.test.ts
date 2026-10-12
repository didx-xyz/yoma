import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { detailBadges } from "./detailBadges";

// Local noon, Fri 9 Oct 2026: "today" is the youth's local calendar day.
const NOW = new Date(2026, 9, 9, 12);

const opportunity = (overrides: Partial<OpportunityInfo>): OpportunityInfo =>
  ({
    type: "Event",
    status: "Active",
    dateStart: "2026-10-01T00:00:00Z",
    dateEnd: "2026-11-30T23:59:59.999Z",
    zltoRewardEstimate: null,
    commitmentInterval: null,
    commitmentIntervalCount: null,
    commitmentIntervalTotalHours: null,
    engagementType: null,
    participantLimit: null,
    participantCountTotal: 0,
    participantLimitReached: false,
    countries: [],
    customFields: [],
    ...overrides,
  }) as unknown as OpportunityInfo;

const ENGAGEMENT: Record<string, string> = {
  Remote: "Remote",
  OnSite: "On-site",
  Hybrid: "Hybrid",
};
const badges = (o: OpportunityInfo, now: Date | null = NOW) =>
  detailBadges(o, {
    now,
    money: null,
    cashOutClosed: false,
    // As the component passes them: `effortLabel` and the engagement's label.
    effort: o.commitmentIntervalCount
      ? `${o.commitmentIntervalCount} ${String(o.commitmentInterval).toLowerCase()}s`
      : null,
    engagement:
      typeof o.engagementType === "string"
        ? (ENGAGEMENT[o.engagementType] ?? o.engagementType)
        : null,
  });
const badge = (o: OpportunityInfo, id: string, now: Date | null = NOW) =>
  badges(o, now).find((b) => b.id === id);

describe("Dates badge (2026-10-09 spec A4)", () => {
  const ends = (dateEnd: string) => badge(opportunity({ dateEnd }), "dates");

  test("days left in calendar days, pink only in the last week, up to 30", () => {
    assert.equal(ends("2026-10-09T23:59:59.999Z")?.value, "Ends today");
    assert.equal(ends("2026-10-09T23:59:59.999Z")?.tone, "urgent");
    assert.equal(ends("2026-10-10T23:59:59.999Z")?.value, "Ends tomorrow");
    assert.equal(ends("2026-10-16T23:59:59.999Z")?.value, "7 days left");
    assert.equal(ends("2026-10-16T23:59:59.999Z")?.tone, "urgent");
    assert.equal(ends("2026-10-17T23:59:59.999Z")?.value, "8 days left");
    assert.equal(ends("2026-10-17T23:59:59.999Z")?.tone, "dates");
    assert.equal(ends("2026-11-08T23:59:59.999Z")?.value, "30 days left");
    assert.equal(ends("2026-11-09T23:59:59.999Z")?.value, "Apply by 9 Nov");
    assert.equal(ends("2026-11-09T23:59:59.999Z")?.info, "31 days left");
  });

  test("a start to come, no deadline, closed, and the absolute form before mount", () => {
    const later = opportunity({ dateStart: "2026-10-10T00:00:00Z" });
    assert.equal(badge(later, "dates")?.value, "Starts tomorrow");
    assert.equal(badge(later, "dates")?.info, "Closes Mon 30 Nov");
    const open = opportunity({ dateEnd: null });
    assert.equal(badge(open, "dates")?.value, "No deadline");
    assert.equal(badge(open, "dates")?.info, "Join any time");
    const closed = opportunity({ dateEnd: "2026-10-08T23:59:59.999Z" });
    assert.equal(badge(closed, "dates")?.value, "Closed");
    assert.equal(badge(closed, "dates")?.tone, "closed");
    assert.equal(badge(opportunity({}), "dates", null)?.value, "Ends 30 Nov");
  });
});

describe("Places badge: the card's rule", () => {
  const places = (limit: number, taken: number) =>
    badge(
      opportunity({ participantLimit: limit, participantCountTotal: taken }),
      "places",
    );

  test("none taken, some taken, almost full, full", () => {
    assert.deepEqual(
      [places(216, 0)?.value, places(216, 0)?.info, places(216, 0)?.bar],
      ["216 places left", "Be one of the first", 0],
    );
    assert.equal(places(442, 1)?.info, "1 of 442 taken");
    assert.equal(places(442, 1)?.bar, 0.04);
    assert.deepEqual(
      [places(100, 95)?.value, places(100, 95)?.info, places(100, 95)?.tone],
      ["5 places left", "Almost full", "almostFull"],
    );
    assert.deepEqual(
      [places(20, 20)?.value, places(20, 20)?.info, places(20, 20)?.tone],
      ["No places left", "All 20 places are taken", "full"],
    );
    assert.equal(badge(opportunity({}), "places"), undefined);
  });
});

describe("How and Reward badges", () => {
  test("effort and engagement on one line; the engagement says what it means", () => {
    const how = badge(
      opportunity({
        commitmentInterval: "Minute",
        commitmentIntervalCount: 10,
        engagementType: "Remote",
      } as Partial<OpportunityInfo>),
      "how",
    );
    assert.equal(how?.value, "10 minutes · Remote");
    assert.equal(how?.info, "Online, from anywhere");
    assert.equal(how?.panel.paragraphs.length, 2);
  });

  test("on-site names its one place", () => {
    const how = badge(
      opportunity({
        engagementType: "OnSite",
        countries: [
          {
            id: "za",
            name: "South Africa",
            city: "Cape Town",
            region: "Western Cape",
          },
        ],
      } as unknown as Partial<OpportunityInfo>),
      "how",
    );
    assert.equal(how?.value, "On-site");
    assert.equal(
      how?.panel.paragraphs[0]?.text,
      "You go there in person, in Cape Town, Western Cape.",
    );
  });

  test("Reward reads in ZLTO, and says when it ran out", () => {
    assert.equal(
      badge(opportunity({ zltoRewardEstimate: 200 }), "reward")?.value,
      "200 ZLTO",
    );
    assert.equal(
      badge(opportunity({ zltoRewardEstimate: 0 }), "reward")?.value,
      "ZLTO ran out",
    );
  });
});
