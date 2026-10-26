import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  completionSectionStatus,
  nextCompletionSection,
} from "./completionSections";

describe("completionSectionStatus", () => {
  test("Done: every required field given and no errors", () => {
    assert.deepEqual(
      completionSectionStatus(
        { required: 4, requiredGiven: 4, given: 4, errors: 0 },
        false,
      ),
      { kind: "done" },
    );
  });

  test("Needs attention · n to do before a submit", () => {
    assert.deepEqual(
      completionSectionStatus(
        { required: 4, requiredGiven: 1, given: 1, errors: 3 },
        false,
      ),
      { kind: "attention", count: 3, afterSubmit: false },
    );
  });

  test("Needs attention · n to fix after a failed submit", () => {
    assert.deepEqual(
      completionSectionStatus(
        { required: 3, requiredGiven: 3, given: 5, errors: 1 },
        true,
      ),
      { kind: "attention", count: 1, afterSubmit: true },
    );
  });

  test("a missing required value counts even before validation has run", () => {
    assert.deepEqual(
      completionSectionStatus(
        { required: 2, requiredGiven: 0, given: 0, errors: 0 },
        false,
      ),
      { kind: "attention", count: 2, afterSubmit: false },
    );
  });

  test("Optional: no required fields, nothing given, no errors", () => {
    assert.deepEqual(
      completionSectionStatus(
        { required: 0, requiredGiven: 0, given: 0, errors: 0 },
        false,
      ),
      { kind: "optional" },
    );
  });

  test("a section with no required fields is Done once anything is given", () => {
    assert.deepEqual(
      completionSectionStatus(
        { required: 0, requiredGiven: 0, given: 1, errors: 0 },
        false,
      ),
      { kind: "done" },
    );
  });

  test("an invalid optional value needs attention", () => {
    assert.deepEqual(
      completionSectionStatus(
        { required: 0, requiredGiven: 0, given: 1, errors: 1 },
        true,
      ),
      { kind: "attention", count: 1, afterSubmit: true },
    );
  });
});

describe("nextCompletionSection", () => {
  test("skips Done and absent sections", () => {
    assert.equal(
      nextCompletionSection("completion-proof", {
        "completion-proof": { kind: "done" },
        "completion-details": { kind: "done" },
        "completion-feedback": { kind: "optional" },
      }),
      "completion-feedback",
    );
  });

  test("returns the next section that needs attention", () => {
    assert.equal(
      nextCompletionSection("completion-proof", {
        "completion-proof": { kind: "done" },
        "completion-details": {
          kind: "attention",
          count: 3,
          afterSubmit: false,
        },
      }),
      "completion-details",
    );
  });

  test("null when nothing after it is open to advance to", () => {
    assert.equal(
      nextCompletionSection("completion-feedback", {
        "completion-feedback": { kind: "optional" },
      }),
      null,
    );
    assert.equal(
      nextCompletionSection("completion-details", {
        "completion-business": { kind: "done" },
        "completion-feedback": { kind: "done" },
      }),
      null,
    );
  });
});
