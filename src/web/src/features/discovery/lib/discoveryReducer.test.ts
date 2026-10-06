import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CustomFieldFilterOperator,
  type CustomFieldFilter,
} from "~/api/models/opportunity";
import type { DiscoveryAction } from "./discoveryReducer";
import {
  reduceDiscovery,
  reduceFromLatest,
  settlePushes,
} from "./discoveryReducer";
import { DEFAULT_DISCOVERY_STATE } from "./types";
import { parseDiscoveryQuery, serializeDiscoveryState } from "./urlCodec";

const OP = CustomFieldFilterOperator;

type Query = Record<string, string>;

const INDUSTRY: CustomFieldFilter = {
  key: "jobIndustry",
  operator: OP.AnyOf,
  values: ["K"],
};
const SALARY: CustomFieldFilter = {
  key: "jobSalaryMinimum",
  operator: OP.GreaterThanOrEqual,
  value: "5000",
};

/** The router query for a state, as Next hands it to the hook. */
const queryOf = (customFields: CustomFieldFilter[], types = ["Job"]): Query =>
  Object.fromEntries(
    new URLSearchParams(
      serializeDiscoveryState({
        ...DEFAULT_DISCOVERY_STATE,
        filters: { ...DEFAULT_DISCOVERY_STATE.filters, types, customFields },
      }),
    ),
  );

/** Dispatches in one task: the router still shows `query` for every one of them. */
const inOneTask = (query: Query, actions: DiscoveryAction[]) =>
  actions.reduce(
    (pushed, action) =>
      reduceFromLatest<Query>(pushed, query, parseDiscoveryQuery, action),
    null as ReturnType<typeof reduceFromLatest<Query>> | null,
  )!.state;

describe("reduceFromLatest — dispatches before the router renders compose", () => {
  test("a blur commit, then a tap on another type: both land", () => {
    const state = inOneTask(queryOf([]), [
      { kind: "setCustomFieldClauses", keys: [SALARY.key], clauses: [SALARY] },
      { kind: "toggleType", name: "Event" },
    ]);
    assert.deepEqual(state.filters.types, ["Job", "Event"]);
    assert.deepEqual(state.filters.customFields, [SALARY]);
  });

  test("a multi-select cleared, then another block's blur commit: both land", () => {
    const state = inOneTask(queryOf([INDUSTRY]), [
      { kind: "setCustomFieldClauses", keys: [INDUSTRY.key], clauses: [] },
      { kind: "setCustomFieldClauses", keys: [SALARY.key], clauses: [SALARY] },
    ]);
    assert.deepEqual(state.filters.customFields, [SALARY]);
  });

  test("once the query changes (the push landing, back / forward) the URL is the state", () => {
    const before = queryOf([]);
    const pushed = reduceFromLatest<Query>(null, before, parseDiscoveryQuery, {
      kind: "setCustomFieldClauses",
      keys: [SALARY.key],
      clauses: [SALARY],
    });
    // Back to a state without the clause: the next action builds on it, not on the push.
    const after = reduceFromLatest<Query>(
      pushed,
      queryOf([INDUSTRY]),
      parseDiscoveryQuery,
      { kind: "toggleType", name: "Event" },
    );
    assert.deepEqual(after.state.filters.customFields, [INDUSTRY]);
  });
});

describe("setCustomFieldClauses", () => {
  test("replaces only its own keys, and resets the page", () => {
    const state = reduceDiscovery(
      {
        ...parseDiscoveryQuery(queryOf([INDUSTRY, SALARY])),
        page: 3,
      },
      {
        kind: "setCustomFieldClauses",
        keys: [SALARY.key],
        clauses: [{ ...SALARY, value: "6000" }],
      },
    );
    assert.deepEqual(state.filters.customFields, [
      INDUSTRY,
      { ...SALARY, value: "6000" },
    ]);
    assert.equal(state.page, 1);
  });
});

describe("settlePushes — edited here, or replaced", () => {
  test("rendering our own push is an edit, and settles it", () => {
    assert.deepEqual(settlePushes(["a"], "a"), {
      replaced: false,
      pending: [],
    });
  });

  test("two pushes in one task: the first rendering leaves the second pending", () => {
    assert.deepEqual(settlePushes(["a", "b"], "a"), {
      replaced: false,
      pending: ["b"],
    });
    assert.deepEqual(settlePushes(["a", "b"], "b"), {
      replaced: false,
      pending: [],
    });
  });

  test("anything else replaced the search (back / forward, a replayed search, a link)", () => {
    assert.deepEqual(settlePushes(["a"], "z"), { replaced: true, pending: [] });
    assert.deepEqual(settlePushes([], "z"), { replaced: true, pending: [] });
  });
});
