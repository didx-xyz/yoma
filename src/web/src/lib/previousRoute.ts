import { Router } from "next/router";

/**
 * The in-app URL the user was on before the current page, or null when the current page was the
 * first one loaded (a new tab, a deep link, a reload). Client-side only: on the server, and before
 * any client navigation, it is null.
 *
 * A navigation that keeps the path (a shallow query update: discovery's filters, sort, paging)
 * only refreshes the current URL, so the previous URL stays the last *page* the user left.
 */
let previousUrl: string | null = null;
let currentUrl: string | null = null;

const pathOf = (url: string): string => url.split(/[?#]/)[0]!;

/** Whether the previous in-app page was `path` (any query). False on a page loaded first. */
export const cameFrom = (path: string): boolean =>
  previousUrl !== null && pathOf(previousUrl) === path;

/** Whether there is a previous in-app page to go back to. False on a page loaded first. */
export const hasPreviousRoute = (): boolean => previousUrl !== null;

/** Starts tracking. Call once, at module level in `_app`. A no-op on the server. */
export const trackPreviousUrl = (): void => {
  if (typeof window === "undefined") return;
  currentUrl = window.location.pathname + window.location.search;
  Router.events.on("routeChangeComplete", (url: string) => {
    if (currentUrl !== null && pathOf(url) !== pathOf(currentUrl))
      previousUrl = currentUrl;
    currentUrl = url;
  });
};
