import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { closingInfo } from "./dates";

// Local noon, Wed 7 Oct 2026: "today" is the youth's local calendar day, whatever the zone the
// tests run in. Deadlines are stored as the end of their UTC calendar day.
const NOW = new Date(2026, 9, 7, 12);

/** Runs `fn` with the process in `zone` (Node re-reads `TZ` when it is assigned). */
const inZone = (zone: string, fn: () => void): void => {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try {
    fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
};

describe("closingInfo — the status row owns the end date (2026-10-07)", () => {
  test("in calendar days, not hours", () => {
    assert.deepEqual(closingInfo("2026-10-07T23:59:59.999Z", NOW), {
      label: "Ends today",
      urgent: true,
    });
    // A deadline at 23:59 UTC tomorrow is tomorrow, never "2 days left".
    assert.deepEqual(closingInfo("2026-10-08T23:59:59.999Z", NOW), {
      label: "Ends tomorrow",
      urgent: true,
    });
    assert.deepEqual(closingInfo("2026-10-10T23:59:59.999Z", NOW), {
      label: "3 days left",
      urgent: true,
    });
    assert.deepEqual(closingInfo("2026-10-14T23:59:59.999Z", NOW), {
      label: "7 days left",
      urgent: true,
    });
  });

  test("past the urgency window, the date; none, no deadline", () => {
    assert.deepEqual(closingInfo("2026-10-15T23:59:59.999Z", NOW), {
      label: "Apply by 15 Oct",
      urgent: false,
    });
    assert.deepEqual(closingInfo(null, NOW), {
      label: "No deadline",
      urgent: false,
    });
  });

  test("closed is the instant: east of UTC an open deadline is not closed", () => {
    inZone("Africa/Johannesburg", () => {
      // 00:30 on 8 Oct in Johannesburg; the deadline is 01:59 on 8 Oct there, still open.
      const now = new Date("2026-10-07T22:30:00Z");
      assert.deepEqual(closingInfo("2026-10-07T23:59:59.999Z", now), {
        label: "Ends today",
        urgent: true,
      });
      assert.deepEqual(closingInfo("2026-10-07T21:59:59.999Z", now), {
        label: "Closed",
        urgent: false,
      });
    });
  });

  test("closed is the instant: west of UTC a passed deadline is closed", () => {
    inZone("America/New_York", () => {
      // 22:00 on 7 Oct in New York, two hours after the 7 Oct deadline passed.
      const now = new Date("2026-10-08T02:00:00Z");
      assert.deepEqual(closingInfo("2026-10-07T23:59:59.999Z", now), {
        label: "Closed",
        urgent: false,
      });
      assert.deepEqual(closingInfo("2026-10-08T23:59:59.999Z", now), {
        label: "Ends tomorrow",
        urgent: true,
      });
    });
  });
});
