import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { CustomFieldDefinition } from "~/api/models/opportunity";
import { getOpportunityCustomFieldDefinitions } from "~/api/services/opportunities";
import { OPPORTUNITY_QUERY_KEYS } from "~/hooks/useOpportunityMutations";
import { CUSTOM_FIELDS_ENABLED } from "~/lib/constants";
import { isNotFoundError } from "../lib/apiStatus";
import { splitTypeDefinitions, typeOwnKeys } from "../lib/typeDefinitions";

/**
 * Custom-field definitions for the selected Opportunity types, split into what they SHARE and
 * what is particular to each — by each definition's `entityContext` (`splitTypeDefinitions`).
 * Without the split, Job + Event rendered the generic controls twice, and editing one silently
 * edited "both". With ONE type selected nothing is split, and it renders exactly as before.
 *
 * `useQueries` (rather than the shared `useOpportunityCustomFieldDefinitionsQuery`, which cannot
 * be called in a loop) deliberately reuses that hook's query key and fetcher, so both share one
 * cache entry per type.
 */
export interface TypeDefinitions {
  /** The generic definitions (no type context) — rendered once, above the per-type sections. */
  shared: CustomFieldDefinition[];
  /** Per selected type, in selection order: its own definitions (all of them, with one type). */
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
      // Gated here as well as in `useOpportunityCustomFieldDefinitionsQuery`: this is a
      // `useQueries` loop reusing that hook's key and fetcher, not a call to the hook itself,
      // so the hook's own `CUSTOM_FIELDS_ENABLED` guard does not reach it.
      enabled: CUSTOM_FIELDS_ENABLED,
    })),
  });

  const { shared, perType } = splitTypeDefinitions(
    typeNames,
    queries.map((query) => query.data ?? []),
  );

  return {
    shared,
    perType,
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

/**
 * Reads one type's own custom-field keys (`typeOwnKeys`) from the definitions already in the
 * query cache, never through a request. For the reducer's clause rule (`ClauseAttribution`),
 * called at dispatch, so it sees whatever has loaded since the last render.
 */
export function useLoadedTypeKeys(): (
  typeName: string,
) => string[] | undefined {
  const queryClient = useQueryClient();
  return useCallback(
    (typeName: string) =>
      typeOwnKeys(
        typeName,
        queryClient
          .getQueriesData<CustomFieldDefinition[]>({
            queryKey: OPPORTUNITY_QUERY_KEYS.customFieldDefinitions(),
          })
          .map(([key, definitions]) => ({ types: key.slice(1), definitions })),
      ),
    [queryClient],
  );
}
