import type { CustomFieldDefinition } from "~/api/models/opportunity";
import { useOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import { useDiscovery } from "./DiscoveryContext";

/**
 * The custom-field definitions the cards label their facts with (`lib/cardFacts.ts`). ONE query
 * for every opportunity type the lookup knows — a stable key, so each card reads the same cached
 * result: no request per card, and none per page of results.
 */
export function useCardDefinitions(): CustomFieldDefinition[] {
  const { lookups } = useDiscovery();
  const types = lookups.types.map((t) => t.name).sort();
  const { data } = useOpportunityCustomFieldDefinitionsQuery(
    types.length > 0 ? types : null,
    { enabled: types.length > 0 },
  );
  return data ?? [];
}
