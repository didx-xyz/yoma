import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type {
  CustomFieldDefinition,
  CustomFieldValueRequest,
} from "~/api/models/opportunity";
import {
  applyCustomFieldRules,
  JOB_CUSTOM_FIELD_KEYS as K,
} from "./customFieldRules";

const definitions = (keys: string[]) =>
  keys.map((key) => ({ key })) as unknown as CustomFieldDefinition[];

const JOB = definitions([
  K.employmentType,
  K.employmentDuration,
  K.employmentDurationUnit,
]);

const employment = (
  types: string[],
  duration?: string,
  unit?: string,
): CustomFieldValueRequest[] => [
  { key: K.employmentType, values: types },
  ...(duration !== undefined
    ? [{ key: K.employmentDuration, value: duration }]
    : []),
  ...(unit !== undefined
    ? [{ key: K.employmentDurationUnit, values: [unit] }]
    : []),
];

const errorKeys = (values: CustomFieldValueRequest[], defs = JOB) =>
  applyCustomFieldRules(defs, values)
    .errors.map((e) => e.key)
    .sort();

describe("Contract employment has an optional term (2026-10-19)", () => {
  test("Contract alone needs no duration or unit", () => {
    assert.deepEqual(errorKeys(employment(["Contract"])), []);
  });

  test("Contract with a paired duration and unit is fine", () => {
    assert.deepEqual(errorKeys(employment(["Contract"], "6", "Months")), []);
  });

  test("Contract with a duration but no unit asks for the unit", () => {
    assert.deepEqual(errorKeys(employment(["Contract"], "6")), [
      K.employmentDurationUnit,
    ]);
  });

  test("Contract with a unit but no duration asks for the duration", () => {
    assert.deepEqual(errorKeys(employment(["Contract"], undefined, "Months")), [
      K.employmentDuration,
    ]);
  });

  test("Contract still rejects a non-positive duration", () => {
    assert.deepEqual(errorKeys(employment(["Contract"], "0", "Months")), [
      K.employmentDuration,
    ]);
  });

  for (const other of ["FixedTerm", "Internship", "TemporarySeasonal"])
    test(`Contract plus ${other} keeps ${other}'s duration requirement`, () => {
      assert.deepEqual(errorKeys(employment(["Contract", other])), [
        K.employmentDuration,
        K.employmentDurationUnit,
      ]);
      assert.deepEqual(
        errorKeys(employment(["Contract", other], "1", "Years")),
        [],
      );
    });

  test("the option key is matched case-insensitively, like the other rules", () => {
    assert.deepEqual(errorKeys(employment(["contract"])), []);
  });
});

describe("The other employment rules are unchanged", () => {
  test("a non-permanent type alone still needs a duration and unit", () => {
    assert.deepEqual(errorKeys(employment(["Internship"])), [
      K.employmentDuration,
      K.employmentDurationUnit,
    ]);
  });

  test("Permanent disables and clears the duration and unit", () => {
    const result = applyCustomFieldRules(
      JOB,
      employment(["Permanent"], "6", "Months"),
    );
    assert.deepEqual(result.errors, []);
    assert.ok(result.disabledKeys.has(K.employmentDuration));
    assert.ok(result.disabledKeys.has(K.employmentDurationUnit));
    assert.deepEqual(
      result.values.map((v) => v.key),
      [K.employmentType],
    );
  });

  test("Permanent and Fixed-term cannot be combined", () => {
    assert.deepEqual(errorKeys(employment(["Permanent", "FixedTerm"])), [
      K.employmentType,
    ]);
  });

  test("Permanent plus Contract needs no term", () => {
    assert.deepEqual(errorKeys(employment(["Permanent", "Contract"])), []);
  });

  test("no type selected: a lone duration still needs its unit, as the API checks", () => {
    assert.deepEqual(errorKeys(employment([])), []);
    assert.deepEqual(errorKeys(employment([], "3")), [
      K.employmentDurationUnit,
    ]);
  });

  test("inert when the employment definition is absent", () => {
    const values = employment(["Contract"], "6");
    const result = applyCustomFieldRules(definitions([]), values);
    assert.deepEqual(result.errors, []);
    assert.equal(result.values, values);
  });
});
