import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { LandingRail, RailPlace } from "../../lib/landingRails";
import { railCopy, railPlaceText, tunedToText } from "./railCopy";

const CAPE_TOWN: RailPlace = {
  countryId: "za",
  countryName: "South Africa",
  region: "Western Cape",
  city: "Cape Town",
};

/** A rail of this kind; only what the copy reads. */
const rail = (
  kind: Partial<LandingRail> & Pick<LandingRail, "kind">,
  place: RailPlace | null = CAPE_TOWN,
): LandingRail => ({ id: kind.kind, place, ...kind }) as LandingRail;

describe("railCopy — titles and subtitles (2026-10-07)", () => {
  test("the place: the city, else the region, else the country, else nothing", () => {
    assert.equal(railPlaceText(CAPE_TOWN), "near Cape Town");
    assert.equal(
      railPlaceText({ ...CAPE_TOWN, city: null }),
      "in Western Cape",
    );
    assert.equal(
      railPlaceText({ ...CAPE_TOWN, city: null, region: null }),
      "in South Africa",
    );
    assert.equal(
      railPlaceText({
        ...CAPE_TOWN,
        city: null,
        region: null,
        countryName: null,
      }),
      null,
    );
    assert.equal(railPlaceText(null), null);
  });

  test("the place closes the subtitle, and its comma goes with it", () => {
    assert.deepEqual(railCopy(rail({ kind: "goal", goal: "impact" }), ""), {
      title: "Impact actions for you",
      subtitle: "Because you want to volunteer and give back, near Cape Town",
    });
    assert.deepEqual(railCopy(rail({ kind: "featured" }, null), ""), {
      title: "Featured",
      subtitle: "Hand-picked by the Yoma team",
    });
    assert.deepEqual(
      railCopy(rail({ kind: "near" }, { ...CAPE_TOWN, city: null }), ""),
      {
        title: "Opportunities in Western Cape",
        subtitle: "Every type, close to where you are",
      },
    );
  });

  test("a category keeps its own name; Picked for you never lowercases", () => {
    const category = rail({
      kind: "category",
      category: { id: "c-tech", name: "Technology, AI & Data", imageURL: null },
    });
    assert.deepEqual(railCopy(category, ""), {
      title: "Technology, AI & Data",
      subtitle: "One of your interests, near Cape Town",
    });
    assert.equal(
      railCopy(
        rail({ kind: "picked" }, null),
        "Job · Technology, AI & Data +2 · +3",
      ).subtitle,
      "Based on your choices: Job · Technology, AI & Data +2 · +3",
    );
    assert.equal(
      railCopy(rail({ kind: "picked" }, null), "").subtitle,
      "Because of your preferences",
    );
  });

  test("the commitment names its interval, or the time itself", () => {
    assert.equal(
      railCopy(rail({ kind: "commitment", intervalLabel: "Up to a month" }), "")
        .title,
      "Fits in up to a month",
    );
    assert.equal(
      railCopy(rail({ kind: "commitment", intervalLabel: null }), "").title,
      "Fits your time",
    );
  });

  test("Latest never names the place", () => {
    assert.deepEqual(railCopy(rail({ kind: "latest" }), ""), {
      title: "Latest opportunities",
      subtitle: "Newest start dates first",
    });
  });
});

describe("tunedToText — Picked for you's values (2026-10-08)", () => {
  test("as the preference banner words them: two first values, then every other one as one count", () => {
    // "Technology, AI & Data +3" counts as its first value plus 3 more; with 3 more chips and a
    // private one, that is 7 others, never "+3 · +4".
    assert.equal(
      tunedToText({
        named: [
          "Job",
          "Technology, AI & Data +3",
          "Paid or rewarded",
          "Remote",
          "Cape Town",
        ],
        unnamed: 1,
        firsts: [
          "Job",
          "Technology, AI & Data",
          "Paid or rewarded",
          "Remote",
          "Cape Town",
        ],
        more: 3,
      }),
      "Job · Technology, AI & Data +7 others",
    );
    assert.equal(
      tunedToText({ named: ["Job", "Cape Town"], unnamed: 0 }),
      "Job · Cape Town",
    );
    assert.equal(tunedToText({ named: ["Job"], unnamed: 1 }), "Job +1 other");
  });

  test("nothing nameable: empty, so the subtitle falls back to the layer", () => {
    assert.equal(tunedToText({ named: [], unnamed: 2 }), "");
  });
});
