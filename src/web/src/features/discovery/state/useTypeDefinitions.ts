import { useQueries } from "@tanstack/react-query";
import type { CustomFieldDefinition } from "~/api/models/opportunity";
import { getOpportunityCustomFieldDefinitions } from "~/api/services/opportunities";
import { OPPORTUNITY_QUERY_KEYS } from "~/hooks/useOpportunityMutations";
import { isNotFoundError } from "../lib/apiStatus";

/**
 * Custom-field definitions for the selected Opportunity types, split into what they SHARE and
 * what is particular to each.
 *
 * The definitions endpoint returns the generic definitions plus the type's own for every type
 * asked about, and a definition carries no marker saying which. With Job + Event selected that
 * meant the same nine controls rendered twice — 18 of 24 controls on screen were duplicates, and
 * editing one silently edited "both". Intersecting the keys across the fetched types recovers
 * the generic set without an API change: what every type returns is by definition not particular
 * to any of them.
 *
 * With ONE type selected the intersection is the whole set, which would leave an empty per-type
 * section — so the split only applies from two types up, and one type renders exactly as before.
 *
 * `useQueries` (rather than the shared `useOpportunityCustomFieldDefinitionsQuery`, which cannot
 * be called in a loop) deliberately reuses that hook's query key and fetcher, so both share one
 * cache entry per type.
 */
export interface TypeDefinitions {
  /** Definitions every selected type returns — rendered once, above the per-type sections. */
  shared: CustomFieldDefinition[];
  /** Per selected type, in selection order: what that type adds over `shared`. */
  perType: { typeName: string; definitions: CustomFieldDefinition[] }[];
  loading: boolean;
  /** 404: this API build has no custom-field definitions at all (the DEV preview, today). */
  unavailable: boolean;
  /** A real fault — offered with a Retry. */
  failed: boolean;
  retry: () => void;
}

export function useTypeDefinitions(typeNames: string[]): TypeDefinitions {
  const queries = useQueries({
    queries: typeNames.map((name) => ({
      queryKey: OPPORTUNITY_QUERY_KEYS.customFieldDefinitions([name]),
      queryFn: () => getOpportunityCustomFieldDefinitions([name]),
    })),
  });

  const loaded = queries.map((query) => query.data ?? []);
  const sharedKeys =
    typeNames.length > 1
      ? new Set(
          loaded[0]
            ?.map((definition) => definition.key)
            .filter((key) =>
              loaded
                .slice(1)
                .every((definitions) =>
                  definitions.some((definition) => definition.key === key),
                ),
            ) ?? [],
        )
      : new Set<string>();

  return {
    shared: (loaded[0] ?? []).filter((definition) =>
      sharedKeys.has(definition.key),
    ),
    perType: typeNames.map((typeName, index) => ({
      typeName,
      definitions: (loaded[index] ?? []).filter(
        (definition) => !sharedKeys.has(definition.key),
      ),
    })),
    loading: queries.some((query) => query.isLoading),
    unavailable: queries.some(
      (query) => query.isError && isNotFoundError(query.error),
    ),
    failed: queries.some(
      (query) => query.isError && !isNotFoundError(query.error),
    ),
    retry: () => {
      for (const query of queries) if (query.isError) void query.refetch();
    },
  };
}
