import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { completionLocation } from "./completionLocation";

const JOB = { opportunityType: "Job", region: null, city: null };

describe("completionLocation", () => {
  test("null when no country was captured", () => {
    assert.equal(completionLocation({ ...JOB, country: null }), null);
    assert.equal(
      completionLocation({ ...JOB, country: null, city: "Cape Town" }),
      null,
    );
  });

  test("most specific first", () => {
    assert.deepEqual(
      completionLocation({
        ...JOB,
        country: "South Africa",
        region: "Western Cape",
        city: "Cape Town",
      }),
      { label: "Completed in", text: "Cape Town, Western Cape, South Africa" },
    );
  });

  test("a repeated name is said once", () => {
    assert.equal(
      completionLocation({
        ...JOB,
        country: "Singapore",
        region: "Singapore",
        city: "Singapore",
      })?.text,
      "Singapore",
    );
  });

  test("an Entrepreneurship completion is the business location", () => {
    assert.deepEqual(
      completionLocation({
        opportunityType: "Entrepreneurship",
        country: "Kenya",
        region: null,
        city: null,
      }),
      { label: "Business location", text: "Kenya" },
    );
  });
});
