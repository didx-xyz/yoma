import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CustomFieldDataType,
  CustomFieldFilterOperator,
  type CustomFieldFilter,
} from "~/api/models/opportunity";
import {
  customFieldChipValue,
  draftSyncOf,
  fixedClauseFor,
  fixedControlValues,
  fixedFilterControlOf,
  isInvertedRange,
  isShownByFixedControl,
  rangeEndToStored,
  sanitizeCustomFieldFilters,
} from "./customFieldFilterClauses";

const OP = CustomFieldFilterOperator;
const T = CustomFieldDataType;

const clause = (
  operator: CustomFieldFilterOperator,
  rest: Partial<CustomFieldFilter> = {},
): CustomFieldFilter => ({ key: "field", operator, ...rest });

describe("sanitizeCustomFieldFilters — a clause without its value never reaches the API", () => {
  test("a cleared value is dropped (the 2026-10-05 400)", () => {
    assert.deepEqual(
      sanitizeCustomFieldFilters([clause(OP.Equals, { value: null })]),
      [],
    );
    assert.deepEqual(
      sanitizeCustomFieldFilters([clause(OP.Contains, { value: "  " })]),
      [],
    );
  });

  test("a cleared multi-select is dropped", () => {
    assert.deepEqual(
      sanitizeCustomFieldFilters([
        clause(OP.AnyOf, { values: null }),
        clause(OP.AllOf, { values: [] }),
      ]),
      [],
    );
  });

  test("Between needs both ends; Exists needs nothing", () => {
    const exists = clause(OP.Exists);
    const between = clause(OP.Between, { value: "1", valueTo: "2" });
    assert.deepEqual(
      sanitizeCustomFieldFilters([
        clause(OP.Between, { value: "1", valueTo: null }),
        exists,
        between,
      ]),
      [exists, between],
    );
  });

  test("complete clauses of any operator are kept as sent", () => {
    const kept = [
      clause(OP.GreaterThan, { value: "5000" }),
      clause(OP.Equals, { value: "5000" }),
      clause(OP.AllOf, { values: ["a", "b"] }),
    ];
    assert.deepEqual(sanitizeCustomFieldFilters(kept), kept);
  });
});

describe("fixedFilterControlOf — one control per data type", () => {
  test("each data type gets its control; an unknown one falls back to String", () => {
    assert.deepEqual(
      [
        T.Option,
        T.String,
        T.Integer,
        T.Decimal,
        T.Date,
        T.DateTime,
        T.Boolean,
        "Unknown",
      ].map(fixedFilterControlOf),
      [
        "anyOf",
        "contains",
        "range",
        "range",
        "range",
        "range",
        "boolean",
        "contains",
      ],
    );
  });
});

describe("fixedClauseFor — the clause a fixed control commits", () => {
  test("a range: From alone is ≥, To alone is ≤, both is Between", () => {
    assert.deepEqual(fixedClauseFor(T.Integer, "salary", ["5000", ""]), {
      key: "salary",
      operator: OP.GreaterThanOrEqual,
      value: "5000",
    });
    assert.deepEqual(fixedClauseFor(T.Integer, "salary", ["", "9000"]), {
      key: "salary",
      operator: OP.LessThanOrEqual,
      value: "9000",
    });
    assert.deepEqual(fixedClauseFor(T.Decimal, "salary", ["5000", "9000"]), {
      key: "salary",
      operator: OP.Between,
      value: "5000",
      valueTo: "9000",
    });
  });

  test("an empty control removes its clause rather than sending an empty one", () => {
    assert.equal(fixedClauseFor(T.Integer, "k", ["", ""]), null);
    assert.equal(fixedClauseFor(T.Integer, "k", [" ", ""]), null);
    assert.equal(fixedClauseFor(T.String, "k", [""]), null);
    assert.equal(fixedClauseFor(T.String, "k", ["   "]), null);
    assert.equal(fixedClauseFor(T.Boolean, "k", [""]), null);
    assert.equal(fixedClauseFor(T.Option, "k", []), null);
  });

  test("Option is Any of, String is Contains, Boolean is Equals", () => {
    assert.deepEqual(fixedClauseFor(T.Option, "k", ["K", "E"]), {
      key: "k",
      operator: OP.AnyOf,
      values: ["K", "E"],
    });
    assert.deepEqual(fixedClauseFor(T.String, "k", ["dri"]), {
      key: "k",
      operator: OP.Contains,
      value: "dri",
    });
    assert.deepEqual(fixedClauseFor(T.Boolean, "k", ["false"]), {
      key: "k",
      operator: OP.Equals,
      value: "false",
    });
  });

  test("a DateTime To is the end of that day; From is its start", () => {
    assert.deepEqual(
      fixedClauseFor(T.DateTime, "k", ["2026-11-01", "2026-11-03"]),
      {
        key: "k",
        operator: OP.Between,
        value: "2026-11-01T00:00:00.000Z",
        valueTo: "2026-11-03T23:59:59.999Z",
      },
    );
    assert.equal(
      rangeEndToStored(T.DateTime, "2026-11-03", "to"),
      "2026-11-03T23:59:59.999Z",
    );
  });

  test("a date-only field sends the date as typed", () => {
    assert.deepEqual(fixedClauseFor(T.Date, "k", ["", "2026-11-03"]), {
      key: "k",
      operator: OP.LessThanOrEqual,
      value: "2026-11-03",
    });
  });
});

describe("isShownByFixedControl / fixedControlValues — what the fixed control displays", () => {
  test("the fixed operators, an Option Is and a Boolean Is are shown", () => {
    const shown: [string, CustomFieldFilter][] = [
      [T.Option, clause(OP.AnyOf, { values: ["K"] })],
      [T.Option, clause(OP.Equals, { value: "K" })],
      [T.String, clause(OP.Contains, { value: "x" })],
      [T.Integer, clause(OP.GreaterThanOrEqual, { value: "1" })],
      [T.Decimal, clause(OP.LessThanOrEqual, { value: "1" })],
      [T.Date, clause(OP.Between, { value: "a", valueTo: "b" })],
      [T.Boolean, clause(OP.Equals, { value: "true" })],
    ];
    for (const [dataType, filter] of shown)
      assert.equal(
        isShownByFixedControl(dataType, filter),
        true,
        `${dataType} ${filter.operator}`,
      );
  });

  test("any other clause is not, so it is kept as sent with a note", () => {
    const kept: [string, CustomFieldFilter][] = [
      [T.Boolean, clause(OP.Exists)],
      [T.Option, clause(OP.AllOf, { values: ["a", "b"] })],
      [T.String, clause(OP.Equals, { value: "x" })],
      [T.Integer, clause(OP.Equals, { value: "5000" })],
      [T.Integer, clause(OP.GreaterThan, { value: "5000" })],
      [T.DateTime, clause(OP.LessThan, { value: "x" })],
      [T.Decimal, clause(OP.AnyOf, { values: ["1"] })],
    ];
    for (const [dataType, filter] of kept) {
      assert.equal(
        isShownByFixedControl(dataType, filter),
        false,
        `${dataType} ${filter.operator}`,
      );
    }
    assert.deepEqual(fixedControlValues(T.Integer, kept[3]![1]), ["", ""]);
    assert.deepEqual(fixedControlValues(T.Option, kept[1]![1]), []);
    assert.deepEqual(fixedControlValues(T.String, kept[2]![1]), [""]);
  });

  test("a range shows each end in its own input", () => {
    assert.deepEqual(
      fixedControlValues(
        T.Integer,
        clause(OP.GreaterThanOrEqual, { value: "5000" }),
      ),
      ["5000", ""],
    );
    assert.deepEqual(
      fixedControlValues(
        T.Integer,
        clause(OP.LessThanOrEqual, { value: "9000" }),
      ),
      ["", "9000"],
    );
    assert.deepEqual(
      fixedControlValues(
        T.Integer,
        clause(OP.Between, { value: "5000", valueTo: "9000" }),
      ),
      ["5000", "9000"],
    );
  });

  test("a DateTime range shows the dates it was committed from", () => {
    const committed = fixedClauseFor(T.DateTime, "k", [
      "2026-11-01",
      "2026-11-03",
    ])!;
    assert.deepEqual(fixedControlValues(T.DateTime, committed), [
      "2026-11-01",
      "2026-11-03",
    ]);
  });

  test("an Option Is shows as its one selected value; nothing set shows empty", () => {
    assert.deepEqual(
      fixedControlValues(T.Option, clause(OP.Equals, { value: "K" })),
      ["K"],
    );
    assert.deepEqual(fixedControlValues(T.Option, undefined), []);
    assert.deepEqual(fixedControlValues(T.Integer, undefined), ["", ""]);
    assert.deepEqual(fixedControlValues(T.Boolean, undefined), [""]);
  });
});

describe("isInvertedRange", () => {
  test("numbers compare as numbers, not text", () => {
    assert.equal(isInvertedRange(T.Integer, "9", "10"), false);
    assert.equal(isInvertedRange(T.Integer, "10000", "9000"), true);
    assert.equal(isInvertedRange(T.Decimal, "1.5", "1.25"), true);
  });

  test("dates compare as YYYY-MM-DD; an open end is never inverted", () => {
    assert.equal(isInvertedRange(T.Date, "2026-11-04", "2026-11-03"), true);
    assert.equal(
      isInvertedRange(T.DateTime, "2026-11-03", "2026-11-03"),
      false,
    );
    assert.equal(isInvertedRange(T.Integer, "9000", ""), false);
  });
});

describe("customFieldChipValue — discovery's chip wording (F4)", () => {
  const chip = (
    operator: CustomFieldFilterOperator,
    label: string,
    dataType: string | null,
  ) => customFieldChipValue(clause(operator), label, dataType);

  test("the fixed operators", () => {
    assert.equal(
      chip(OP.AnyOf, "Construction, Mining and quarrying", T.Option),
      "Construction, Mining and quarrying",
    );
    assert.equal(chip(OP.Contains, "incub", T.String), "Contains “incub”");
    assert.equal(chip(OP.GreaterThanOrEqual, "5000", T.Integer), "From 5000");
    assert.equal(chip(OP.LessThanOrEqual, "9000", T.Integer), "Up to 9000");
    assert.equal(chip(OP.Between, "5000 – 9000", T.Integer), "5000 – 9000");
    assert.equal(chip(OP.Equals, "Yes", T.Boolean), "Yes");
  });

  test("older links name their operator, except a selected Option", () => {
    assert.equal(
      chip(OP.Exists, "Salary disclosed", T.Boolean),
      "Has any value",
    );
    assert.equal(chip(OP.Equals, "5000", T.Integer), "Is 5000");
    assert.equal(chip(OP.Equals, "abc", T.String), "Is abc");
    assert.equal(chip(OP.GreaterThan, "5000", T.Decimal), "Greater than 5000");
    assert.equal(chip(OP.LessThan, "5000", T.Integer), "Less than 5000");
    assert.equal(
      chip(OP.AllOf, "Permanent, Internship", T.Option),
      "All of Permanent, Internship",
    );
    assert.equal(chip(OP.Equals, "Construction", T.Option), "Construction");
  });

  test("an older link's Any of on a non-Option field names its operator", () => {
    assert.equal(chip(OP.AnyOf, "5000, 6000", T.Integer), "Any of 5000, 6000");
    assert.equal(chip(OP.AnyOf, "a, b", T.String), "Any of a, b");
  });

  test("while the definitions load, an Is reads as the bare value", () => {
    assert.equal(chip(OP.Equals, "K", null), "K");
  });
});

describe("draftSyncOf — when a typed field's drafts follow its committed values", () => {
  test("not focused: its own value changing, or a replaced search, resets it", () => {
    assert.equal(
      draftSyncOf({
        focused: false,
        committed: ["", ""],
        sent: null,
        drafts: ["9000", "5000"],
      }),
      "reset",
    );
  });

  test("focused, its own Enter landed and nothing typed since: it takes the committed values", () => {
    assert.equal(
      draftSyncOf({
        focused: true,
        committed: ["dri"],
        sent: ["dri"],
        drafts: ["dri "],
      }),
      "adopt",
    );
  });

  test("focused, typed on after Enter before it rendered: the drafts stay", () => {
    assert.equal(
      draftSyncOf({
        focused: true,
        committed: ["5000", ""],
        sent: ["5000", ""],
        drafts: ["50000", ""],
      }),
      "keep",
    );
  });

  test("focused, something else changed it: a focused field is never overwritten", () => {
    assert.equal(
      draftSyncOf({
        focused: true,
        committed: ["", ""],
        sent: null,
        drafts: ["5", ""],
      }),
      "keep",
    );
    assert.equal(
      draftSyncOf({
        focused: true,
        committed: ["", ""],
        sent: ["5000", ""],
        drafts: ["5000", ""],
      }),
      "keep",
    );
  });
});
