import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { PREFERENCE_STEPS } from "../registry/preferenceSteps";
import {
  personalizeStepIndex,
  profileHrefFrom,
  stepIdOfPreference,
} from "./wizardReturn";

describe("wizard ↔ profile round trip (2026-10-22)", () => {
  test("the location block's step is named in the URL, and read back as its index", () => {
    const stepId = stepIdOfPreference("location");
    assert.equal(stepId, "language");
    assert.equal(
      personalizeStepIndex(stepId),
      PREFERENCE_STEPS.findIndex((step) => step.id === "language"),
    );
  });

  test("`personalize=1` (the user menu) and unknown values mean 'open as usual'", () => {
    assert.equal(personalizeStepIndex("1"), null);
    assert.equal(personalizeStepIndex("nope"), null);
    assert.equal(personalizeStepIndex(["language"]), null);
    assert.equal(personalizeStepIndex(undefined), null);
  });

  test("the profile href carries the discovery URL, filters intact, with the step set", () => {
    const href = profileHrefFrom(
      "/opportunities/discover?types=Job&q=solar",
      "language",
    );
    assert.equal(
      href,
      "/user/profile?returnUrl=" +
        encodeURIComponent(
          "/opportunities/discover?types=Job&q=solar&personalize=language",
        ),
    );
    // A stale instruction is replaced, never doubled.
    const again = profileHrefFrom(
      "/opportunities/discover?personalize=1",
      "language",
    );
    assert.equal(
      decodeURIComponent(again.split("returnUrl=")[1]!),
      "/opportunities/discover?personalize=language",
    );
  });
});
