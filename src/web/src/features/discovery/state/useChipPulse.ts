import { useEffect, useRef } from "react";
import { isDefaultDiscoveryState } from "../lib/urlCodec";
import { useDiscovery } from "./DiscoveryContext";
import { useDiscoveryResults } from "./useDiscoveryResults";

/**
 * The chip that caused the current reload — whatever id wasn't in the previous chip set — while
 * the results are loading; otherwise null. Read by both chip homes (the preference banner and the
 * filters panel). It reads the SAME results query as the results view (identical key, so
 * react-query shares it — no second request).
 */
export function useChipPulse(): string | null {
  const { state, search, lookups, searchReady, chips } = useDiscovery();
  const landing = isDefaultDiscoveryState(state);
  const { loading } = useDiscoveryResults(
    search,
    state.sort,
    state.page,
    lookups,
    searchReady && !landing,
  );

  const previousChipIds = useRef<Set<string>>(new Set());
  const newChipId =
    chips.find((c) => !previousChipIds.current.has(c.id))?.id ?? null;
  useEffect(() => {
    previousChipIds.current = new Set(chips.map((c) => c.id));
  });

  return !landing && loading ? newChipId : null;
}
