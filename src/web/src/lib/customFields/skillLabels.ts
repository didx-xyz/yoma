import type { Skill } from "~/api/models/lookups";
import {
  CustomFieldLookupType,
  type CustomFieldDefinition,
  type CustomFieldFilter,
  type CustomFieldValueItem,
} from "~/api/models/opportunity";

// ─────────────────────────────────────────────────────────────────────────────
// Selected skill labels (YOM-1262) — the pure rules behind `useSkillLabeler`
// (hooks/useOpportunityMutations), kept free of React so the unit tests (`pnpm test`) can use
// them.
//
// A Skill-backed custom field stores catalogue GUIDs, and the catalogue is searched by name a
// page at a time, so a page can't be relied on to hold the selected skills. Their names are
// resolved by id instead (`POST /lookup/skill/ids`): these helpers pick the ids to send, remember
// what the lookups said, and label each one. Labels are presentation only — values and filter
// payloads stay ids.
//
// Like the rest of the framework, nothing here is keyed to a definition key or title.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The label of a selected skill a successful lookup didn't return. The API validated the id
 * when it was saved, so a miss means the catalogue retired it: the label says so, and tells an
 * admin to remove or replace it (2026-10-06).
 */
export const UNKNOWN_SKILL_LABEL = "Skill no longer listed";

/** Shown while a selected skill's name loads, so its id never flashes on screen. */
export const PENDING_SKILL_LABEL = "…";

/**
 * Shown when the lookup failed and the skill was never named. It says nothing about the skill
 * itself, so an admin isn't told to remove a valid one (Jason, 2026-10-06).
 */
export const UNAVAILABLE_SKILL_LABEL = "Skill name unavailable";

// The id format the catalogue uses. The API rejects the WHOLE request for one malformed or empty
// (all-zero) id, which a hand-edited link could carry, so those are never sent.
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const normalise = (id: string): string => id.trim().toLowerCase();

const isResolvable = (id: string): boolean =>
  GUID.test(id) && id !== EMPTY_GUID;

export const isSkillLookup = (definition: CustomFieldDefinition): boolean =>
  (definition.lookupType as string | null) === CustomFieldLookupType.Skill;

/**
 * The ids to resolve, as the request and its query key take them: well-formed, non-empty GUIDs,
 * lower-cased, de-duplicated and sorted.
 */
export function skillIdsToResolve(
  ids: Iterable<string | null | undefined>,
): string[] {
  const resolvable = new Set<string>();
  for (const id of ids) {
    const normalised = id ? normalise(id) : "";
    if (isResolvable(normalised)) resolvable.add(normalised);
  }
  return [...resolvable].sort();
}

/** The lower-cased keys of the Skill-backed definitions. */
const skillKeysOf = (
  definitions: CustomFieldDefinition[] | null | undefined,
): Set<string> =>
  new Set(
    (definitions ?? [])
      .filter(isSkillLookup)
      .map((definition) => definition.key.toLowerCase()),
  );

/**
 * The skill ids selected in Skill-backed fields' saved values (an Option field keeps them in
 * `values`), resolvable and sorted. Values of any other field are left out.
 */
export function skillIdsInValues(
  definitions: CustomFieldDefinition[] | null | undefined,
  values: CustomFieldValueItem[] | null | undefined,
): string[] {
  const keys = skillKeysOf(definitions);
  if (keys.size === 0) return [];
  return skillIdsToResolve(
    (values ?? [])
      .filter((item) => keys.has(item.key.toLowerCase()))
      .flatMap((item) => item.values ?? []),
  );
}

/**
 * The skill ids in filter clauses on Skill-backed fields, from whichever of `values`, `value`
 * and `valueTo` the operator uses, resolvable and sorted. Clauses on any other field are left
 * out.
 */
export function skillIdsInFilters(
  definitions: CustomFieldDefinition[] | null | undefined,
  filters: CustomFieldFilter[] | null | undefined,
): string[] {
  const keys = skillKeysOf(definitions);
  if (keys.size === 0) return [];
  return skillIdsToResolve(
    (filters ?? [])
      .filter((filter) => keys.has(filter.key.toLowerCase()))
      .flatMap((filter) => [
        ...(filter.values ?? []),
        filter.value,
        filter.valueTo,
      ]),
  );
}

/** Skill names by lower-cased id. A later source wins over an earlier one for the same id. */
export function skillNamesById(
  ...sources: (readonly Skill[] | null | undefined)[]
): Map<string, string> {
  const names = new Map<string, string>();
  for (const source of sources)
    for (const skill of source ?? [])
      names.set(normalise(skill.id), skill.name);
  return names;
}

/**
 * Where the lookup for the ids on screen stands: `pending` while it loads (a changed selection
 * included), `failed` once it has errored (after its retries), `settled` once it has answered.
 */
export type SkillLookupStatus = "pending" | "failed" | "settled";

/**
 * What the successful lookups so far have said, kept across selection changes and failures:
 * names by lower-cased id, and the ids a successful response left out (`absent`: the catalogue
 * no longer returns them). So a name once shown stays shown, and a retired skill doesn't flash
 * "…" while a changed selection loads.
 */
export interface SkillLookupMemory {
  names: ReadonlyMap<string, string>;
  absent: ReadonlySet<string>;
}

export const EMPTY_SKILL_LOOKUP: SkillLookupMemory = {
  names: new Map(),
  absent: new Set(),
};

/**
 * Folds one successful response into the memory. The newest response wins: an id it returns is
 * named and no longer absent; an id it was asked for and left out is absent, and loses any
 * older name. `requested` are the ids the request sent (`skillIdsToResolve`).
 */
export function rememberSkillLookup(
  memory: SkillLookupMemory,
  requested: readonly string[],
  result: readonly Skill[],
): SkillLookupMemory {
  const returned = skillNamesById(result);
  const names = new Map(memory.names);
  const absent = new Set(memory.absent);
  for (const [id, name] of returned) {
    names.set(id, name);
    absent.delete(id);
  }
  for (const id of requested.map(normalise))
    if (!returned.has(id)) {
      names.delete(id);
      absent.add(id);
    }
  return { names, absent };
}

/**
 * The label for one selected skill id:
 * - its name, when known;
 * - `UNKNOWN_SKILL_LABEL` when a successful response left it out, at once, even while a changed
 *   selection loads; also an id that is never sent (malformed or empty), rather than pending for
 *   ever;
 * - otherwise, by `status`: `PENDING_SKILL_LABEL` while the lookup loads,
 *   `UNAVAILABLE_SKILL_LABEL` once it has failed, and `UNKNOWN_SKILL_LABEL` once it has answered
 *   without it.
 *
 * A blank id has no label.
 */
export function skillLabelOf(
  id: string,
  lookup: SkillLookupMemory,
  status: SkillLookupStatus,
): string {
  const normalised = normalise(id);
  if (!normalised) return "";
  const name = lookup.names.get(normalised);
  if (name !== undefined) return name;
  if (!isResolvable(normalised) || lookup.absent.has(normalised))
    return UNKNOWN_SKILL_LABEL;
  switch (status) {
    case "pending":
      return PENDING_SKILL_LABEL;
    case "failed":
      return UNAVAILABLE_SKILL_LABEL;
    case "settled":
      return UNKNOWN_SKILL_LABEL;
  }
}
