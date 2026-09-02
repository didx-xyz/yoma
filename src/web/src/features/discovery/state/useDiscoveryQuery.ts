import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import type { DiscoveryAction } from "../lib/discoveryReducer";
import { reduceDiscovery } from "../lib/discoveryReducer";
import type { DiscoveryState } from "../lib/types";
import { parseDiscoveryQuery, serializeDiscoveryState } from "../lib/urlCodec";

/**
 * URL ↔ `DiscoveryState`. The router's query IS the state — parse on read, serialise on
 * dispatch, nothing mirrored. Navigation is shallow (no data refetch through Next) and keeps
 * scroll; back/forward therefore restore any earlier state exactly.
 */
export function useDiscoveryQuery(): {
  state: DiscoveryState;
  dispatch: (action: DiscoveryAction) => void;
  ready: boolean;
} {
  const router = useRouter();

  const state = useMemo(
    () => parseDiscoveryQuery(router.query),
    [router.query],
  );

  const dispatch = useCallback(
    (action: DiscoveryAction) => {
      const next = reduceDiscovery(parseDiscoveryQuery(router.query), action);
      const queryString = serializeDiscoveryState(next);
      void router.push(
        queryString ? `${router.pathname}?${queryString}` : router.pathname,
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  // Until the router hydrates, `query` is {} and would read as the default state.
  return { state, dispatch, ready: router.isReady };
}
