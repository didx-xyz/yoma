import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { CustomFieldDefinition } from "~/api/models/opportunity";
import { splitTypeDefinitions, typeOwnKeys } from "./typeDefinitions";

const definition = (
  key: string,
  entityContext: string | null,
): CustomFieldDefinition =>
  ({ key, entityContext }) as unknown as CustomFieldDefinition;

const keys = (definitions: CustomFieldDefinition[]): string[] =>
  definitions.map((d) => d.key);

const GENERIC = definition("difficulty", null);
const JOB = [GENERIC, definition("jobSalaryMinimum", "Job")];
const EVENT = [GENERIC, definition("eventRole", "Event")];

describe("splitTypeDefinitions — by entityContext (rule 6)", () => {
  test("one type: nothing shared, its section carries everything, as before", () => {
    const split = splitTypeDefinitions(["Job"], [JOB]);
    assert.deepEqual(split.shared, []);
    assert.deepEqual(
      split.perType.map((t) => [t.typeName, keys(t.definitions)]),
      [["Job", ["difficulty", "jobSalaryMinimum"]]],
    );
  });

  test("two types: the null-context ones shared, once; each type its own", () => {
    const split = splitTypeDefinitions(["Job", "Event"], [JOB, EVENT]);
    assert.deepEqual(keys(split.shared), ["difficulty"]);
    assert.deepEqual(
      split.perType.map((t) => [t.typeName, keys(t.definitions)]),
      [
        ["Job", ["jobSalaryMinimum"]],
        ["Event", ["eventRole"]],
      ],
    );
  });

  test("a type-scoped key two types happen to share is not generic", () => {
    // Intersecting keys would have called it shared; its context says it is each type's own.
    const split = splitTypeDefinitions(
      ["Job", "Event"],
      [[definition("notes", "Job")], [definition("notes", "Event")]],
    );
    assert.deepEqual(split.shared, []);
    assert.deepEqual(
      split.perType.map((t) => keys(t.definitions)),
      [["notes"], ["notes"]],
    );
  });

  test("a type still loading: the generic ones come from the types that have", () => {
    const split = splitTypeDefinitions(["Job", "Event"], [[], EVENT]);
    assert.deepEqual(keys(split.shared), ["difficulty"]);
    assert.deepEqual(split.perType[0]?.definitions, []);
  });
});

describe("typeOwnKeys — one type's own keys, from what is already loaded", () => {
  test("from its own list: the definitions with its context, never the generic ones", () => {
    assert.deepEqual(
      typeOwnKeys("Job", [{ types: ["Job"], definitions: JOB }]),
      ["jobSalaryMinimum"],
    );
  });

  test("from a combined list (the chips'), by context", () => {
    assert.deepEqual(
      typeOwnKeys("Event", [
        { types: ["Job", "Event"], definitions: [...JOB, ...EVENT] },
      ]),
      ["eventRole"],
    );
  });

  test("a type with no definitions of its own owns no keys", () => {
    assert.deepEqual(
      typeOwnKeys("Learning", [
        { types: ["Learning"], definitions: [GENERIC] },
      ]),
      [],
    );
  });

  test("unknown when no loaded list asked for it, or the list has no data", () => {
    assert.equal(
      typeOwnKeys("Event", [{ types: ["Job"], definitions: JOB }]),
      undefined,
    );
    assert.equal(
      typeOwnKeys("Event", [{ types: ["Event"], definitions: undefined }]),
      undefined,
    );
    // A list asked for no type at all doesn't say whose its definitions are.
    assert.equal(
      typeOwnKeys("Event", [{ types: [], definitions: EVENT }]),
      undefined,
    );
  });

  test("a list without data is passed over for one with it", () => {
    assert.deepEqual(
      typeOwnKeys("Event", [
        { types: ["Event"], definitions: undefined },
        { types: ["Job", "Event"], definitions: [...JOB, ...EVENT] },
      ]),
      ["eventRole"],
    );
  });
});
