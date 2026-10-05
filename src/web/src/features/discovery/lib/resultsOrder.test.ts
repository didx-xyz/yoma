import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  incentiveSplitAt,
  isJobsOnly,
  sortNote,
  visibleSortOptions,
} from "./resultsOrder";

const ids = (types: string[], sort: Parameters<typeof sortNote>[1]) =>
  visibleSortOptions(types, sort).map((option) => option.id);

describe("Sort options — Most ZLTO on a Jobs-only search (Q1)", () => {
  test("Jobs-only: the effective types are non-empty and all Job", () => {
    assert.equal(isJobsOnly(["Job"]), true);
    assert.equal(isJobsOnly([]), false);
    assert.equal(isJobsOnly(["Job", "Learning"]), false);
    assert.equal(isJobsOnly(["Entrepreneurship"]), false);
  });

  test("every option on any other search", () => {
    for (const types of [[], ["Learning"], ["Job", "Learning"]])
      assert.deepEqual(ids(types, "newest"), [
        "newest",
        "endingSoonest",
        "mostZlto",
      ]);
  });

  test("hidden on a Jobs-only search", () => {
    assert.deepEqual(ids(["Job"], "newest"), ["newest", "endingSoonest"]);
    assert.deepEqual(ids(["Job"], "endingSoonest"), [
      "newest",
      "endingSoonest",
    ]);
    assert.equal(sortNote(["Job"], "newest"), null);
  });

  test("kept, selected, and explained when it is already the sort", () => {
    assert.deepEqual(ids(["Job"], "mostZlto"), [
      "newest",
      "endingSoonest",
      "mostZlto",
    ]);
    assert.equal(
      sortNote(["Job"], "mostZlto"),
      "Jobs don't carry ZLTO, so they're shown newest first.",
    );
    assert.equal(sortNote(["Job", "Learning"], "mostZlto"), null);
  });
});

describe("the incentive divider's place on the page (Q4)", () => {
  /** A page as fetched: its Paid filter, then each item's incentive. */
  const fetched = (
    paidFilter: boolean | null,
    ...values: (boolean | null | undefined)[]
  ) => ({
    paidFilter,
    items: values.map((incentivized) => ({ incentivized })),
  });

  test("no page, or no Paid filter behind it, no divider", () => {
    assert.equal(incentiveSplitAt(undefined), null);
    assert.equal(incentiveSplitAt(fetched(null, true, null)), null);
  });

  test("a page with no recorded filter (cached before it was recorded) gets no divider", () => {
    assert.equal(
      incentiveSplitAt({
        items: [{ incentivized: true }, { incentivized: null }],
      }),
      null,
    );
  });

  test("before the first unspecified item", () => {
    assert.equal(incentiveSplitAt(fetched(false, false, false, null, null)), 2);
    assert.equal(incentiveSplitAt(fetched(true, true, undefined)), 1);
  });

  test("at the top when the page begins in the unknown bucket", () => {
    assert.equal(incentiveSplitAt(fetched(true, null, null)), 0);
  });

  test("none when everything on the page matched", () => {
    assert.equal(incentiveSplitAt(fetched(true, true, true)), null);
    assert.equal(incentiveSplitAt(fetched(true)), null);
  });

  test("a kept page splits on the filter it was fetched with, never the current one", () => {
    // Undo a skipped Pay chip: the page on screen until the new one arrives was fetched with no
    // Paid filter, in date order. Its first unknown says nothing about this search's buckets.
    const beforeUndo = fetched(null, false, true, null);
    assert.equal(incentiveSplitAt(beforeUndo), null);
    // Another sort, or the next page, under the same Paid filter: the order still holds, so the
    // faded page keeps its divider and its layout.
    const sameFilter = fetched(false, false, false, null);
    assert.equal(incentiveSplitAt(sameFilter), 2);
  });
});
