import { useEffect } from "react";
import type { DiscoveryAction } from "../lib/discoveryReducer";
import type { DiscoveryState, DiscoveryViewMode } from "../lib/types";

/**
 * Grid ↔ compact list. The URL wins so a shared link opens the way it was sent; the choice is
 * also persisted per device so a returning youth keeps it. Switching changes NOTHING about the
 * query — same request, same results, different component.
 */
const VIEW_MODE_KEY = "yoma.discovery.viewMode";

export function readPersistedViewMode(): DiscoveryViewMode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(VIEW_MODE_KEY);
  return value === "list" || value === "grid" ? value : null;
}

export function useViewMode(
  state: DiscoveryState,
  dispatch: (action: DiscoveryAction) => void,
  urlHasView: boolean,
  ready: boolean,
): { view: DiscoveryViewMode; setView: (view: DiscoveryViewMode) => void } {
  // Restore the per-device choice once, only when the URL doesn't carry one (URL wins).
  useEffect(() => {
    if (!ready || urlHasView) return;
    const persisted = readPersistedViewMode();
    if (persisted && persisted !== state.view)
      dispatch({ kind: "setView", view: persisted });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once on hydration only
  }, [ready]);

  const setView = (view: DiscoveryViewMode): void => {
    window.localStorage.setItem(VIEW_MODE_KEY, view);
    dispatch({ kind: "setView", view });
  };

  return { view: state.view, setView };
}
