import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  EMPTY_USER_PREFERENCES,
  mergeUserPreferences,
  normalizeUserPreferences,
} from "./userPreferences";

describe("engagement preference — a list", () => {
  test("a stored single id (2026-09-29 → 10-03) becomes a list of one", () => {
    assert.deepEqual(
      normalizeUserPreferences({ engagement: "remote" }).engagement,
      ["remote"],
    );
  });

  test("a stored list round-trips, once each", () => {
    assert.deepEqual(
      normalizeUserPreferences({ engagement: ["remote", "onsite", "remote"] })
        .engagement,
      ["remote", "onsite"],
    );
  });

  test("nothing, or anything unexpected, is no preference", () => {
    for (const engagement of [undefined, null, "", 3, [""], [4], {}])
      assert.deepEqual(
        normalizeUserPreferences({ engagement }).engagement,
        [],
        JSON.stringify(engagement),
      );
  });

  test("keeping anonymous answers unions engagement with the stored list, once each", () => {
    const stored = { ...EMPTY_USER_PREFERENCES, engagement: ["hybrid"] };

    // Anonymous Remote + On-site over a stored Hybrid: all three, stored first.
    assert.deepEqual(
      mergeUserPreferences(
        stored,
        { ...EMPTY_USER_PREFERENCES, engagement: ["remote", "onsite"] },
        null,
      ).engagement,
      ["hybrid", "remote", "onsite"],
    );
    assert.deepEqual(
      mergeUserPreferences(
        stored,
        { ...EMPTY_USER_PREFERENCES, engagement: ["onsite", "hybrid"] },
        null,
      ).engagement,
      ["hybrid", "onsite"],
    );
    assert.deepEqual(
      mergeUserPreferences(stored, EMPTY_USER_PREFERENCES, null).engagement,
      ["hybrid"],
    );
    assert.deepEqual(
      mergeUserPreferences(
        EMPTY_USER_PREFERENCES,
        { ...EMPTY_USER_PREFERENCES, engagement: ["remote"] },
        null,
      ).engagement,
      ["remote"],
    );
  });
});
