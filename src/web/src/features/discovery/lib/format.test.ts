import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  commitmentBucket,
  commitmentLabel,
  withCommitmentBucket,
} from "./format";

const MINUTE = { id: "t-minute", name: "Minute" };
const HOUR = { id: "t-hour", name: "Hour" };
const WEEK = { id: "t-week", name: "Week" };
const INTERVALS = [MINUTE, HOUR, WEEK];

describe("commitment buckets (BA R10, 2026-10-21)", () => {
  test("Minute is the curated 'A few minutes' = 15; every other interval is 'Up to' one", () => {
    assert.deepEqual(commitmentBucket(MINUTE), {
      intervalId: "t-minute",
      count: 15,
      label: "A few minutes",
    });
    assert.deepEqual(commitmentBucket(HOUR), {
      intervalId: "t-hour",
      count: 1,
      label: "Up to an hour",
    });
    assert.equal(commitmentBucket(WEEK).label, "Up to a week");
  });

  test("a stored value labels as its bucket when it is one, else spelt out", () => {
    assert.equal(
      commitmentLabel({ intervalId: "t-minute", count: 15 }, "Minute"),
      "A few minutes",
    );
    assert.equal(
      commitmentLabel({ intervalId: "t-minute", count: 1 }, "Minute"),
      "Up to a minute",
    );
    assert.equal(
      commitmentLabel({ intervalId: "t-week", count: 3 }, "Week"),
      "Up to 3 weeks",
    );
  });

  test("a count below its bucket reads as the bucket; at or above, or unknown, as it is", () => {
    assert.deepEqual(
      withCommitmentBucket({ intervalId: "t-minute", count: 1 }, INTERVALS),
      { intervalId: "t-minute", count: 15 },
    );
    const threeWeeks = { intervalId: "t-week", count: 3 };
    assert.equal(withCommitmentBucket(threeWeeks, INTERVALS), threeWeeks);
    const fifteen = { intervalId: "t-minute", count: 15 };
    assert.equal(withCommitmentBucket(fifteen, INTERVALS), fifteen);
    const unknown = { intervalId: "t-minute", count: 1 };
    assert.equal(withCommitmentBucket(unknown, []), unknown);
  });
});
