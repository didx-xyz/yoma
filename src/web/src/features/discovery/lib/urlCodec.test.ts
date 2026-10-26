import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { CustomFieldFilterOperator } from "~/api/models/opportunity";
import type { CustomFieldFilter } from "~/api/models/opportunity";
import { DEFAULT_DISCOVERY_STATE } from "./types";
import { parseDiscoveryQuery, serializeDiscoveryState } from "./urlCodec";

const OP = CustomFieldFilterOperator;

const parseCf = (clauses: unknown): CustomFieldFilter[] =>
  parseDiscoveryQuery({ cf: JSON.stringify(clauses) }).filters.customFields;

describe("urlCodec — the cf param", () => {
  test("an incomplete clause from an old link or recent search is dropped", () => {
    assert.deepEqual(
      parseCf([{ key: "JobSalaryMinimum", operator: "Equals", value: null }]),
      [],
    );
    assert.deepEqual(
      parseCf([{ key: "JobIndustry", operator: "AnyOf", values: null }]),
      [],
    );
  });

  test("a complete clause keeps its operator, whatever it is", () => {
    const clauses = [
      { key: "JobSalaryDisclosed", operator: OP.Exists },
      { key: "JobSalaryMinimum", operator: OP.GreaterThan, value: "5000" },
      { key: "JobIndustry", operator: OP.Equals, value: "K" },
    ];
    assert.deepEqual(parseCf(clauses), clauses);
  });

  test("a malformed clause drops alone; the rest still filter", () => {
    const good = { key: "JobIndustry", operator: OP.AnyOf, values: ["K"] };
    assert.deepEqual(
      parseCf([
        { key: "JobSalaryMinimum", operator: "Equals", value: 5000 },
        { key: "JobIndustry", operator: "AnyOf", values: "K" },
        { key: "noOperator" },
        good,
      ]),
      [good],
    );
  });

  test("a clause with an operator the API doesn't know drops alone", () => {
    const good = { key: "JobSalaryDisclosed", operator: OP.Exists };
    assert.deepEqual(
      parseCf([
        { key: "JobSalaryMinimum", operator: "AtLeast", value: "5000" },
        { key: "JobIndustry", operator: "anyof", values: ["K"] },
        good,
      ]),
      [good],
    );
  });

  test("an unreadable param reads as no clauses", () => {
    assert.deepEqual(
      parseDiscoveryQuery({ cf: "{not json" }).filters.customFields,
      [],
    );
    assert.deepEqual(parseCf({ key: "x", operator: "Exists" }), []);
  });

  test("clauses round-trip through the URL", () => {
    const customFields: CustomFieldFilter[] = [
      {
        key: "JobSalaryMinimum",
        operator: OP.Between,
        value: "5000",
        valueTo: "9000",
      },
    ];
    const state = {
      ...DEFAULT_DISCOVERY_STATE,
      filters: { ...DEFAULT_DISCOVERY_STATE.filters, customFields },
    };
    const query = Object.fromEntries(
      new URLSearchParams(serializeDiscoveryState(state)),
    );
    assert.deepEqual(
      parseDiscoveryQuery(query).filters.customFields,
      customFields,
    );
  });
});

describe("urlCodec — the group param (2026-10-21)", () => {
  test("targeted groups travel as `group=`, comma-joined, and round-trip", () => {
    const state = {
      ...DEFAULT_DISCOVERY_STATE,
      filters: {
        ...DEFAULT_DISCOVERY_STATE.filters,
        targetedGroups: ["g-women", "g-rural"],
      },
    };
    const serialized = serializeDiscoveryState(state);
    assert.equal(serialized, "group=g-women%2Cg-rural");
    const query = Object.fromEntries(new URLSearchParams(serialized));
    assert.deepEqual(parseDiscoveryQuery(query).filters.targetedGroups, [
      "g-women",
      "g-rural",
    ]);
    assert.deepEqual(parseDiscoveryQuery({}).filters.targetedGroups, []);
  });

  test("Open to all is read out of `group=`; a Minute count below the bucket reads as 15", () => {
    const lookups = {
      timeIntervals: [{ id: "t-minute", name: "Minute" }],
      targetedGroups: [
        { id: "g-all", name: "Open to all" },
        { id: "g-women", name: "Women / girls" },
      ],
    };
    const state = parseDiscoveryQuery(
      { group: "g-all,g-women", time: "t-minute:1" },
      lookups,
    );
    assert.deepEqual(state.filters.targetedGroups, ["g-women"]);
    assert.deepEqual(state.filters.commitment, {
      intervalId: "t-minute",
      count: 15,
    });
    // Without the lookups (not loaded yet) both read as written.
    const raw = parseDiscoveryQuery({ group: "g-all", time: "t-minute:1" });
    assert.deepEqual(raw.filters.targetedGroups, ["g-all"]);
    assert.deepEqual(raw.filters.commitment, {
      intervalId: "t-minute",
      count: 1,
    });
  });
});
