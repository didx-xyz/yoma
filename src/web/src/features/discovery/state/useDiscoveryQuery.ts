import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ClauseAttribution,
  DiscoveryAction,
  PushedDiscoveryState,
} from "../lib/discoveryReducer";
import {
  needsPush,
  reduceFromLatest,
  settlePushes,
} from "../lib/discoveryReducer";
import type { DiscoveryState } from "../lib/types";
import { parseDiscoveryQuery, serializeDiscoveryState } from "../lib/urlCodec";

/**
 * URL ↔ `DiscoveryState`. The router's query IS the state — parse on read, serialise on
 * dispatch, nothing mirrored. Navigation is shallow (no data refetch through Next) and keeps
 * scroll; back/forward therefore restore any earlier state exactly.
 *
 * Held here: the last push until the router renders it, so dispatches in the same task (a blur
 * commit and the tap that caused it) compose instead of the last one winning
 * (`reduceFromLatest`); the query strings pushed but not yet rendered, so `resetEpoch` can tell
 * the search being edited here from it being replaced (`settlePushes`); and whether the hook is
 * still mounted.
 *
 * `attribution` is what the reducer's clause rule needs beyond the URL. A ref the provider keeps
 * current, read at each dispatch, so an async handler holding an older `dispatch` still reduces
 * with the current fragments (and the provider can call this before it knows them).
 *
 * `dispatch` pushes nothing when the action changes nothing (`needsPush`), and nothing once the
 * surface has unmounted: an async handler finishing after the youth left (a save resolving on a
 * detail page) would push them back to discover.
 */
export function useDiscoveryQuery(attribution: {
  readonly current: ClauseAttribution;
}): {
  state: DiscoveryState;
  /** Returns the query string pushed, or `null` when nothing was. */
  dispatch: (action: DiscoveryAction) => string | null;
  ready: boolean;
  /** The query string the router shows, in its canonical form. */
  rendered: string;
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
  const latestRendered = useRef(rendered);
  latestRendered.current = rendered;
  // True from the first render (a child's mount effect runs before this one), false once
  // unmounted; set again on mount, for StrictMode's dev remount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const settled = settlePushes(pending.current, rendered);
    pending.current = settled.pending;
    if (settled.replaced) setResetEpoch((epoch) => epoch + 1);
  }, [rendered]);

  const dispatch = useCallback(
    (action: DiscoveryAction): string | null => {
      if (!mounted.current) return null;
      pushed.current = reduceFromLatest(
        pushed.current,
        router.query,
        parseDiscoveryQuery,
        action,
        attribution.current,
      );
      const queryString = serializeDiscoveryState(pushed.current.state);
      // Before the no-op check: Clear filters drops the typed drafts even when nothing else
      // changes.
      if (action.kind === "clearFilters") setResetEpoch((epoch) => epoch + 1);
      if (!needsPush(pending.current, queryString, latestRendered.current))
        return null;
      pending.current = [...pending.current, queryString];
      void router.push(
        queryString ? `${router.pathname}?${queryString}` : router.pathname,
        undefined,
        { shallow: true, scroll: false },
      );
      return queryString;
    },
    [router, attribution],
  );

  // Until the router hydrates, `query` is {} and would read as the default state.
  return { state, dispatch, ready: router.isReady, rendered, resetEpoch };
}
