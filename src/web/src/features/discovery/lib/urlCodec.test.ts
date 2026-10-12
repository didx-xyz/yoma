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
