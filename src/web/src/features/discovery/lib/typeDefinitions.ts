import type { CustomFieldDefinition } from "~/api/models/opportunity";

/**
 * The custom-field definitions loaded for each selected Opportunity type, split into what the
 * types SHARE and what is each type's OWN. Pure; `useTypeDefinitions` loads, this decides.
 *
 * The definitions endpoint returns the generic definitions plus the type's own for every type
 * asked about. A definition's `entityContext` says which it is — `null` applies to every type,
 * a type name to that type only — and it is the scope the search applies a clause by (API
 * 2026-10-03), so the split follows it rather than guessing from which keys repeat.
 *
 * With ONE type selected nothing is shared: its section carries everything, exactly as before.
 * From two types up, the generic definitions render once, above one section per type carrying
 * only its own.
 */
export interface SplitTypeDefinitions {
  /** The generic definitions (`entityContext` null), once each, when two or more types are selected. */
  shared: CustomFieldDefinition[];
  /** Per selected type, in selection order. */
  perType: { typeName: string; definitions: CustomFieldDefinition[] }[];
}

export function splitTypeDefinitions(
  typeNames: string[],
  loaded: CustomFieldDefinition[][],
): SplitTypeDefinitions {
  if (typeNames.length < 2)
    return {
      shared: [],
      perType: typeNames.map((typeName, index) => ({
        typeName,
        definitions: loaded[index] ?? [],
      })),
    };

  const shared = new Map<string, CustomFieldDefinition>();
  for (const definitions of loaded)
    for (const definition of definitions)
      if (definition.entityContext === null && !shared.has(definition.key))
        shared.set(definition.key, definition);

  return {
    shared: [...shared.values()],
    perType: typeNames.map((typeName, index) => ({
      typeName,
      definitions: (loaded[index] ?? []).filter(
        (definition) => definition.entityContext !== null,
      ),
    })),
  };
}

/** A definitions list already loaded, and the types it was asked for. */
export interface LoadedDefinitions {
  types: readonly unknown[];
  definitions: CustomFieldDefinition[] | undefined;
}

/**
 * One type's OWN custom-field keys (its definitions whose `entityContext` names it), from any
 * loaded list that was asked for that type: the filter panel's per-type lists or the chips'
 * combined one. The context makes either exact. `undefined` when no loaded list asked for it
 * (never loaded, failed, or this API has none). Generic definitions belong to no one type, so
 * they are never in it.
 */
export function typeOwnKeys(
  typeName: string,
  loaded: LoadedDefinitions[],
): string[] | undefined {
  const definitions = loaded.find(
    (list) => list.definitions !== undefined && list.types.includes(typeName),
  )?.definitions;
  return definitions
    ?.filter(
      (definition) =>
        definition.entityContext?.toLowerCase() === typeName.toLowerCase(),
    )
    .map((definition) => definition.key);
}
