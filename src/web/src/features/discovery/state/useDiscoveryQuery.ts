import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DiscoveryAction,
  PushedDiscoveryState,
} from "../lib/discoveryReducer";
import { reduceFromLatest, settlePushes } from "../lib/discoveryReducer";
import type { DiscoveryState } from "../lib/types";
import { parseDiscoveryQuery, serializeDiscoveryState } from "../lib/urlCodec";

/**
 * URL ↔ `DiscoveryState`. The router's query IS the state — parse on read, serialise on
 * dispatch, nothing mirrored. Navigation is shallow (no data refetch through Next) and keeps
 * scroll; back/forward therefore restore any earlier state exactly.
 *
 * Held here, and nothing else: the last push until the router renders it, so dispatches in the
 * same task (a blur commit and the tap that caused it) compose instead of the last one winning
 * (`reduceFromLatest`); and the query strings pushed but not yet rendered, so `resetEpoch` can
 * tell the search being edited here from it being replaced (`settlePushes`).
 */
export function useDiscoveryQuery(): {
  state: DiscoveryState;
  dispatch: (action: DiscoveryAction) => void;
  ready: boolean;
  /**
   * Bumped when the search is replaced rather than edited: Clear filters, or the router landing
   * on a state this hook didn't push (back / forward, a replayed recent search, a link). Typed
   * filter drafts drop what they hold on it, and on nothing less (2026-10-05).
   */
  resetEpoch: number;
} {
  const router = useRouter();

  const state = useMemo(
    () => parseDiscoveryQuery(router.query),
    [router.query],
  );
  const rendered = useMemo(() => serializeDiscoveryState(state), [state]);

  const pushed = useRef<PushedDiscoveryState<typeof router.query> | null>(null);
  const pending = useRef<string[]>([]);
  const [resetEpoch, setResetEpoch] = useState(0);

  useEffect(() => {
    const settled = settlePushes(pending.current, rendered);
    pending.current = settled.pending;
    if (settled.replaced) setResetEpoch((epoch) => epoch + 1);
  }, [rendered]);

  const dispatch = useCallback(
    (action: DiscoveryAction) => {
      pushed.current = reduceFromLatest(
        pushed.current,
        router.query,
        parseDiscoveryQuery,
        action,
      );
      const queryString = serializeDiscoveryState(pushed.current.state);
      pending.current = [...pending.current, queryString];
      if (action.kind === "clearFilters") setResetEpoch((epoch) => epoch + 1);
      void router.push(
        queryString ? `${router.pathname}?${queryString}` : router.pathname,
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  // Until the router hydrates, `query` is {} and would read as the default state.
  return { state, dispatch, ready: router.isReady, resetEpoch };
}
