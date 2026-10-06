import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CustomFieldFilterOperator,
  type CustomFieldFilter,
} from "~/api/models/opportunity";
import type { ClauseAttribution, DiscoveryAction } from "./discoveryReducer";
import {
  needsPush,
  presetToShow,
  reduceDiscovery,
  reduceFromLatest,
  settlePushes,
} from "./discoveryReducer";
import type { InheritedFragments } from "./preferenceMapping";
import type { DiscoveryState } from "./types";
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

const DIFFICULTY: CustomFieldFilter = {
  key: "eventDifficulty",
  operator: OP.AnyOf,
  values: ["Beginner"],
};
/** On a generic definition (no type context): it comes with every type. */
const LANGUAGE: CustomFieldFilter = {
  key: "deliveryLanguage",
  operator: OP.AnyOf,
  values: ["en"],
};

/** Each type's OWN keys, as `typeOwnKeys` reads them from the loaded definitions. */
const TYPE_KEYS: Record<string, string[]> = {
  Job: [INDUSTRY.key, SALARY.key],
  Event: [DIFFICULTY.key],
};

const attribution = (
  fragments: InheritedFragments = {},
  typeKeys: Record<string, string[]> = TYPE_KEYS,
): ClauseAttribution => ({
  fragments,
  typeKeys: (typeName) => typeKeys[typeName],
});

/** No preference layer, every type's definitions loaded. */
const LOADED = attribution();

/** The Goal "Get a job" — supplies the Job type. */
const JOB_GOAL: InheritedFragments = {
  goal: { types: ["Job"], userGoal: "job" },
};

const stateWith = (
  types: string[],
  customFields: CustomFieldFilter[],
  overrides: Partial<DiscoveryState> = {},
): DiscoveryState => ({
  ...DEFAULT_DISCOVERY_STATE,
  filters: { ...DEFAULT_DISCOVERY_STATE.filters, types, customFields },
  ...overrides,
});

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
      reduceFromLatest<Query>(
        pushed,
        query,
        parseDiscoveryQuery,
        action,
        LOADED,
      ),
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
    const pushed = reduceFromLatest<Query>(
      null,
      before,
      parseDiscoveryQuery,
      {
        kind: "setCustomFieldClauses",
        keys: [SALARY.key],
        clauses: [SALARY],
      },
      LOADED,
    );
    // Back to a state without the clause: the next action builds on it, not on the push.
    const after = reduceFromLatest<Query>(
      pushed,
      queryOf([INDUSTRY]),
      parseDiscoveryQuery,
      { kind: "toggleType", name: "Event" },
      LOADED,
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
      LOADED,
    );
    assert.deepEqual(state.filters.customFields, [
      INDUSTRY,
      { ...SALARY, value: "6000" },
    ]);
    assert.equal(state.page, 1);
  });
});

describe("custom-field clauses leave with their type, and only theirs (2026-10-06)", () => {
  test("master switch: the inherited Job's clauses go; the manual Event's and the shared ones stay", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [SALARY, DIFFICULTY, LANGUAGE]),
      { kind: "setPreferencesOff", off: true },
      attribution(JOB_GOAL),
    );
    assert.deepEqual(state.filters.customFields, [DIFFICULTY, LANGUAGE]);
  });

  test("master switch with every type inherited: every clause goes, the shared ones too", () => {
    const state = reduceDiscovery(
      stateWith([], [SALARY, LANGUAGE]),
      { kind: "setPreferencesOff", off: true },
      attribution(JOB_GOAL),
    );
    assert.deepEqual(state.filters.customFields, []);
  });

  test("master switch with Job also picked by hand: Job stays in effect, and so does its salary", () => {
    const state = reduceDiscovery(
      stateWith(["Job"], [SALARY, LANGUAGE]),
      { kind: "setPreferencesOff", off: true },
      attribution(JOB_GOAL),
    );
    assert.deepEqual(state.filters.customFields, [SALARY, LANGUAGE]);
  });

  test("fallback: a departed type whose definitions aren't loaded clears every clause", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [SALARY, DIFFICULTY, LANGUAGE]),
      { kind: "setPreferencesOff", off: true },
      attribution(JOB_GOAL, { Event: [DIFFICULTY.key] }),
    );
    assert.deepEqual(state.filters.customFields, []);
  });

  test("a remaining type's definitions not loaded don't matter: only the departed type's are needed", () => {
    const state = reduceDiscovery(
      stateWith(["Job", "Event"], [SALARY, DIFFICULTY, LANGUAGE]),
      { kind: "toggleType", name: "Job" },
      attribution({}, { Job: TYPE_KEYS.Job! }),
    );
    assert.deepEqual(state.filters.customFields, [DIFFICULTY, LANGUAGE]);
  });

  test("the type row: deselecting Job drops its clauses and keeps Event's and the shared ones", () => {
    const state = reduceDiscovery(
      stateWith(["Job", "Event"], [INDUSTRY, SALARY, DIFFICULTY, LANGUAGE]),
      { kind: "toggleType", name: "Job" },
      LOADED,
    );
    assert.deepEqual(state.filters.types, ["Event"]);
    assert.deepEqual(state.filters.customFields, [DIFFICULTY, LANGUAGE]);
  });

  test("the type row: deselecting the last type clears every clause", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [DIFFICULTY, LANGUAGE]),
      { kind: "toggleType", name: "Event" },
      LOADED,
    );
    assert.deepEqual(state.filters.customFields, []);
  });

  test("skipping the Goal drops the inherited Job's clauses and keeps the manual Event's", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [SALARY, DIFFICULTY, LANGUAGE]),
      { kind: "skipPreference", key: "goal", fragment: JOB_GOAL.goal! },
      attribution(JOB_GOAL),
    );
    assert.deepEqual(state.preferencesSkipped, ["goal"]);
    assert.deepEqual(state.filters.customFields, [DIFFICULTY, LANGUAGE]);
  });

  test("a type reset with the Goal's Job still inherited: Job's clauses stay, Event's go", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [SALARY, DIFFICULTY, LANGUAGE]),
      { kind: "patchFilters", patch: { types: [] } },
      attribution(JOB_GOAL),
    );
    assert.deepEqual(state.filters.customFields, [SALARY, LANGUAGE]);
  });

  test("a manual duplicate of the inherited type removed: Job is still in effect, nothing goes", () => {
    const state = reduceDiscovery(
      stateWith(["Job"], [SALARY]),
      { kind: "toggleType", name: "Job" },
      attribution(JOB_GOAL),
    );
    assert.deepEqual(state.filters.types, []);
    assert.deepEqual(state.filters.customFields, [SALARY]);
  });

  test("adding a type, or an unrelated change, keeps every clause", () => {
    const before = stateWith(["Job"], [SALARY, LANGUAGE]);
    for (const action of [
      { kind: "toggleType", name: "Event" },
      { kind: "patchFilters", patch: { q: "driver" } },
    ] satisfies DiscoveryAction[])
      assert.deepEqual(
        reduceDiscovery(before, action, LOADED).filters.customFields,
        [SALARY, LANGUAGE],
      );
  });

  test("keys match case-insensitively, as the API matches them", () => {
    const state = reduceDiscovery(
      stateWith(["Job", "Event"], [{ ...SALARY, key: "JOBSALARYMINIMUM" }]),
      { kind: "toggleType", name: "Job" },
      LOADED,
    );
    assert.deepEqual(state.filters.customFields, []);
  });

  test("a key a remaining type owns too stays", () => {
    const state = reduceDiscovery(
      stateWith(["Job", "Event"], [SALARY]),
      { kind: "toggleType", name: "Job" },
      attribution({}, { ...TYPE_KEYS, Event: [SALARY.key] }),
    );
    assert.deepEqual(state.filters.customFields, [SALARY]);
  });

  test("composes in one task: a blur commit on Job's salary, then the tap that deselects Job", () => {
    const state = inOneTask(queryOf([DIFFICULTY], ["Job", "Event"]), [
      { kind: "setCustomFieldClauses", keys: [SALARY.key], clauses: [SALARY] },
      { kind: "toggleType", name: "Job" },
    ]);
    assert.deepEqual(state.filters.types, ["Event"]);
    assert.deepEqual(state.filters.customFields, [DIFFICULTY]);
  });
});

describe("preferencesSaved — a saved preset's Goal takes its type's clauses with it (2026-10-06)", () => {
  const EVENT_GOAL: InheritedFragments = {
    goal: { types: ["Event"], userGoal: "event" },
  };

  test("the wizard: Goal Job → Event drops Job's clauses, keeps the shared ones, resets overrides", () => {
    const state = reduceDiscovery(
      stateWith([], [SALARY, LANGUAGE], {
        preferencesSkipped: ["languages"],
        page: 3,
      }),
      {
        kind: "preferencesSaved",
        from: JOB_GOAL,
        to: EVENT_GOAL,
        then: { kind: "resetPreferenceOverrides" },
      },
      // The fragments as last rendered may already be the new ones: the action's win.
      attribution(EVENT_GOAL),
    );
    assert.deepEqual(state.filters.customFields, [LANGUAGE]);
    assert.deepEqual(state.preferencesSkipped, []);
    assert.equal(state.page, 1);
  });

  test("the wizard: Job also picked by hand stays in effect, and so does its salary", () => {
    const state = reduceDiscovery(
      stateWith(["Job"], [SALARY]),
      {
        kind: "preferencesSaved",
        from: JOB_GOAL,
        to: EVENT_GOAL,
        then: { kind: "resetPreferenceOverrides" },
      },
      LOADED,
    );
    assert.deepEqual(state.filters.customFields, [SALARY]);
  });

  test("the wizard: the old Goal's type unattributable falls back to clearing every clause", () => {
    const state = reduceDiscovery(
      stateWith([], [SALARY, LANGUAGE]),
      {
        kind: "preferencesSaved",
        from: JOB_GOAL,
        to: EVENT_GOAL,
        then: { kind: "resetPreferenceOverrides" },
      },
      attribution({}, { Event: [DIFFICULTY.key] }),
    );
    assert.deepEqual(state.filters.customFields, []);
  });

  test("the wizard with preferences off: the old Goal wasn't in effect, so nothing goes", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [DIFFICULTY], { preferencesOff: true }),
      {
        kind: "preferencesSaved",
        from: JOB_GOAL,
        to: JOB_GOAL,
        then: { kind: "resetPreferenceOverrides" },
      },
      LOADED,
    );
    assert.equal(state.preferencesOff, false);
    assert.deepEqual(state.filters.customFields, [DIFFICULTY]);
  });

  test("Keep answers: the session's Goal replaces the stored one; only the clauses change", () => {
    const before = stateWith(["Event"], [SALARY, DIFFICULTY, LANGUAGE], {
      preferencesSkipped: ["age"],
      page: 2,
    });
    const state = reduceDiscovery(
      before,
      { kind: "preferencesSaved", from: JOB_GOAL, to: EVENT_GOAL },
      LOADED,
    );
    assert.deepEqual(state, {
      ...before,
      filters: { ...before.filters, customFields: [DIFFICULTY, LANGUAGE] },
      page: 1,
    });
  });

  test("a save that removes no type changes nothing, so it pushes the same URL (no history entry)", () => {
    const before = stateWith([], [SALARY], { page: 2 });
    for (const to of [
      JOB_GOAL,
      { ...JOB_GOAL, languages: { languages: ["en"] } },
    ])
      assert.equal(
        serializeDiscoveryState(
          reduceDiscovery(
            before,
            { kind: "preferencesSaved", from: JOB_GOAL, to },
            LOADED,
          ),
        ),
        serializeDiscoveryState(before),
      );
  });

  test("a first Goal only adds a type: nothing goes", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [DIFFICULTY]),
      { kind: "preferencesSaved", from: {}, to: JOB_GOAL },
      LOADED,
    );
    assert.deepEqual(state.filters.customFields, [DIFFICULTY]);
  });

  test("Make this my default: the skipped Goal is cleared from the preset; nothing was in effect, nothing goes", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [DIFFICULTY], { preferencesSkipped: ["goal"] }),
      {
        kind: "preferencesSaved",
        from: JOB_GOAL,
        to: {},
        then: { kind: "setSkippedPreferences", keys: [] },
      },
      LOADED,
    );
    assert.deepEqual(state.preferencesSkipped, []);
    assert.deepEqual(state.filters.customFields, [DIFFICULTY]);
  });

  test("its undo: the Goal comes back skipped; nothing goes", () => {
    const state = reduceDiscovery(
      stateWith(["Event"], [DIFFICULTY]),
      {
        kind: "preferencesSaved",
        from: {},
        to: JOB_GOAL,
        then: { kind: "setSkippedPreferences", keys: ["goal"] },
      },
      LOADED,
    );
    assert.deepEqual(state.preferencesSkipped, ["goal"]);
    assert.deepEqual(state.filters.customFields, [DIFFICULTY]);
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

describe("needsPush — a dispatch that changes nothing pushes nothing", () => {
  test("nothing pending and the same query string: no push (no history entry, no router run)", () => {
    assert.equal(needsPush([], "type=Job", "type=Job"), false);
    assert.equal(needsPush([], "", ""), false);
  });

  test("a different query string pushes", () => {
    assert.equal(needsPush([], "type=Job&type=Event", "type=Job"), true);
  });

  test("with a push pending it always pushes: the router is about to show something else", () => {
    // Toggled on and off in one task: the second push takes the URL back.
    assert.equal(needsPush(["type=Job%2CEvent"], "type=Job", "type=Job"), true);
  });
});

describe("presetToShow — the preset from before a save, until the save's push renders", () => {
  const BEFORE = "before";
  const SAVED = "saved";

  test("no save in flight: the stored preset", () => {
    assert.equal(presetToShow(SAVED, null, "a"), SAVED);
  });

  test("the cache updated, the save's push not dispatched yet: the preset from before", () => {
    assert.equal(
      presetToShow(SAVED, { preferences: BEFORE, until: null }, "a"),
      BEFORE,
    );
  });

  test("pushed, the router still on the old URL: the preset from before", () => {
    assert.equal(
      presetToShow(SAVED, { preferences: BEFORE, until: "b" }, "a"),
      BEFORE,
    );
  });

  test("the push rendered: the stored preset, in the same render as the new URL", () => {
    assert.equal(
      presetToShow(SAVED, { preferences: BEFORE, until: "b" }, "b"),
      SAVED,
    );
  });
});
