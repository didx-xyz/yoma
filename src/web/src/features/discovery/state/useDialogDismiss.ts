import { useEffect, useRef } from "react";

/**
 * The ONE dismiss behaviour for the discovery overlays (filters dialog, mobile sheet,
 * personalization wizard): Escape closes, and so does the browser/hardware Back button.
 *
 * Back works via a same-URL sentinel entry pushed when the overlay opens; a popstate while it is
 * open closes it. The sentinel is pushed only when not already on one, and is deliberately NOT
 * consumed on close: a cleanup-time `history.back()` lands asynchronously, and under React
 * StrictMode's dev double-mount the remounted listener received that self-inflicted popstate and
 * closed the overlay the moment it opened. The cost of leaving it is one silent Back press after
 * a non-Back close (same URL, no visible change) — and reopening reuses the entry.
 *
 * The sentinel COPIES Next's own history state (`__N`, url, as, options) and adds its flag
 * (2026-10-22). A bare `{ discoveryDialog: true }` was an entry Next's popstate handler ignores:
 * Back from a page the overlay linked to (the wizard's "Change in your profile") changed the URL
 * to this page and left the other page rendered.
 *
 * Filter changes dispatched WHILE an overlay is open sit above the sentinel, so Back first
 * reverts them (the URL is the filter state, by design) and next closes the overlay.
 *
 * Native <dialog open> is non-modal, so the UA does not handle Escape itself (only showModal
 * does — which we avoid because it would fight our own styling and stacking).
 */
export function useDialogDismiss(active: boolean, onClose: () => void): void {
  // The close callback is an inline arrow at every call site — keep the effect off its identity.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !e.defaultPrevented) closeRef.current();
    };
    const onPop = (): void => closeRef.current();

    if (!window.history.state?.discoveryDialog)
      window.history.pushState(
        { ...window.history.state, discoveryDialog: true },
        "",
      );
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [active]);
}
