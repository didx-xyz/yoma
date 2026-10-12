import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CustomFieldDataType,
  CustomFieldFilterOperator,
  CustomFieldLookupType,
  type CustomFieldDefinition,
} from "~/api/models/opportunity";
import {
  EMPTY_SKILL_LOOKUP,
  PENDING_SKILL_LABEL,
  UNAVAILABLE_SKILL_LABEL,
  UNKNOWN_SKILL_LABEL,
  rememberSkillLookup,
  skillIdsInFilters,
  skillIdsInValues,
  skillIdsToResolve,
  skillLabelOf,
  skillNamesById,
} from "./skillLabels";

const OP = CustomFieldFilterOperator;

const A = "01a110a2-c3e1-70d6-9be9-a21d43893cce";
const B = "01a110a2-c3e1-7e0e-a071-5f3264698664";
const C = "01a0e88e-a2ee-7b30-954f-8117e6e57e92";
const EMPTY = "00000000-0000-0000-0000-000000000000";

const definition = (
  key: string,
  lookupType: string | null,
): CustomFieldDefinition => ({
  id: key,
  entityType: "Opportunity",
  entityContext: null,
  key,
  title: key,
  description: null,
  group: "Requirements",
  subGroup: null,
  dataType: CustomFieldDataType.Option,
  lookupType,
  validationRegex: null,
  validationErrorMessage: null,
  isRequired: false,
  supportsMultiple: true,
  sortOrder: 0,
  isActive: true,
  isSystem: false,
  dateCreated: "",
  dateModified: "",
  options: null,
});

const skills = definition("skillField", CustomFieldLookupType.Skill);
const languages = definition("languageField", CustomFieldLookupType.Language);
const inline = definition("inlineField", null);

describe("skillIdsToResolve — what the lookup is sent, and keyed on", () => {
  test("sorted, de-duplicated and lower-cased", () => {
    assert.deepEqual(skillIdsToResolve([B, A, B.toUpperCase(), ` ${A} `]), [
      A,
      B,
    ]);
  });

  test("a malformed, empty or blank id is never sent (the API rejects the whole request)", () => {
    assert.deepEqual(
      skillIdsToResolve(["not-a-guid", EMPTY, "", null, undefined, A]),
      [A],
    );
  });

  test("nothing to resolve is an empty list (the query stays off)", () => {
    assert.deepEqual(skillIdsToResolve([]), []);
  });
});

describe("skillIdsInValues — exactly the skills selected in the fields given", () => {
  test("only Skill-backed fields' values, matched by key in any case", () => {
    assert.deepEqual(
      skillIdsInValues(
        [skills, languages, inline],
        [
          { key: "SKILLFIELD", values: [B, A] },
          { key: "languageField", values: [C] },
          { key: "inlineField", values: ["optionKey"] },
        ],
      ),
      [A, B],
    );
  });

  test("a value whose field isn't given is left out (the view's whitelist)", () => {
    assert.deepEqual(
      skillIdsInValues([languages], [{ key: "skillField", values: [A] }]),
      [],
    );
  });

  test("no definitions or no values resolve nothing", () => {
    assert.deepEqual(skillIdsInValues(null, [{ key: "x", values: [A] }]), []);
    assert.deepEqual(skillIdsInValues([skills], undefined), []);
  });
});

describe("skillIdsInFilters — the skills in clauses on Skill-backed fields", () => {
  test("values, value and valueTo, whichever the operator uses", () => {
    assert.deepEqual(
      skillIdsInFilters(
        [skills, languages],
        [
          { key: "skillField", operator: OP.AnyOf, values: [C, A] },
          { key: "languageField", operator: OP.AnyOf, values: [B] },
        ],
      ),
      [C, A],
    );
    assert.deepEqual(
      skillIdsInFilters(
        [skills],
        [{ key: "skillField", operator: OP.Equals, value: B }],
      ),
      [B],
    );
  });

  test("an Exists clause and a hand-edited value add nothing", () => {
    assert.deepEqual(
      skillIdsInFilters(
        [skills],
        [
          { key: "skillField", operator: OP.Exists },
          { key: "skillField", operator: OP.AnyOf, values: ["junk", EMPTY] },
        ],
      ),
      [],
    );
  });
});

describe("skillLabelOf — a name, never the id", () => {
  // A lookup for [A, B] that named A and left B out
  const lookup = rememberSkillLookup(
    EMPTY_SKILL_LOOKUP,
    [A, B],
    [{ id: A.toUpperCase(), name: "Python", infoURL: null }],
  );

  test("a known id is its name, in any case and any state", () => {
    for (const status of ["pending", "failed", "settled"] as const) {
      assert.equal(skillLabelOf(A, lookup, status), "Python");
      assert.equal(skillLabelOf(A.toUpperCase(), lookup, status), "Python");
    }
  });

  test("an id never resolved is pending while the lookup runs, then no longer listed", () => {
    assert.equal(skillLabelOf(C, lookup, "pending"), PENDING_SKILL_LABEL);
    assert.equal(skillLabelOf(C, lookup, "settled"), UNKNOWN_SKILL_LABEL);
  });

  test("a failed lookup says the name is unavailable, never that the skill is gone", () => {
    assert.equal(skillLabelOf(C, lookup, "failed"), UNAVAILABLE_SKILL_LABEL);
    assert.equal(
      skillLabelOf(C, EMPTY_SKILL_LOOKUP, "failed"),
      UNAVAILABLE_SKILL_LABEL,
    );
  });

  test("an id a successful response left out stays no longer listed, even while loading or failed", () => {
    for (const status of ["pending", "failed", "settled"] as const)
      assert.equal(skillLabelOf(B, lookup, status), UNKNOWN_SKILL_LABEL);
  });

  test("the labels say what happened, and never show the id", () => {
    assert.equal(UNKNOWN_SKILL_LABEL, "Skill no longer listed");
    assert.equal(UNAVAILABLE_SKILL_LABEL, "Skill name unavailable");
    assert.equal(PENDING_SKILL_LABEL, "…");
  });

  test("an id that is never sent is unknown straight away, not pending for ever", () => {
    assert.equal(skillLabelOf("junk", lookup, "pending"), UNKNOWN_SKILL_LABEL);
    assert.equal(skillLabelOf(EMPTY, lookup, "failed"), UNKNOWN_SKILL_LABEL);
  });

  test("a blank id has no label", () => {
    assert.equal(skillLabelOf("", lookup, "pending"), "");
  });
});

describe("rememberSkillLookup — what the successful lookups said, kept", () => {
  const first = rememberSkillLookup(
    EMPTY_SKILL_LOOKUP,
    [A, B],
    [{ id: A, name: "Python", infoURL: null }],
  );

  test("names what it returned, and marks what it was asked for and left out", () => {
    assert.equal(first.names.get(A), "Python");
    assert.deepEqual([...first.absent], [B]);
  });

  test("a later response for other ids keeps the earlier names and misses", () => {
    const next = rememberSkillLookup(
      first,
      [C],
      [{ id: C, name: "Excel", infoURL: null }],
    );
    assert.equal(next.names.get(A), "Python");
    assert.equal(next.names.get(C), "Excel");
    assert.equal(next.absent.has(B), true);
    // the memory given is never changed
    assert.equal(first.names.has(C), false);
  });

  test("the newest response wins, either way", () => {
    const next = rememberSkillLookup(
      first,
      [A, B],
      [{ id: B, name: "Sales", infoURL: null }],
    );
    assert.equal(next.names.get(B), "Sales");
    assert.equal(next.absent.has(B), false);
    assert.equal(next.names.has(A), false);
    assert.equal(next.absent.has(A), true);
  });

  test("a failed lookup after a success keeps the names it had", () => {
    // a changed selection [A, C] whose lookup failed: nothing new to fold in
    assert.equal(skillLabelOf(A, first, "failed"), "Python");
    assert.equal(skillLabelOf(C, first, "failed"), UNAVAILABLE_SKILL_LABEL);
  });
});

describe("skillNamesById — a later source wins", () => {
  test("the lookup's name overrides a search cache's for the same id", () => {
    const names = skillNamesById(
      [{ id: A, name: "Old", infoURL: null }],
      undefined,
      [{ id: A, name: "New", infoURL: null }],
    );
    assert.equal(names.get(A), "New");
    assert.equal(names.size, 1);
  });
});
