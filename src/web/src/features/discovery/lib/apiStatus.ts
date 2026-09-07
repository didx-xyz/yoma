/**
 * How a failed request should read on screen.
 *
 * A 404 from a lookup or the definitions endpoint is not a fault: it means the API this build is
 * talking to does not serve that facet — the DEV preview runs an API image with no custom-field
 * endpoints at all (YOM-1254 is not deployed there), and the same will be true of any
 * environment that lags the web app. That deserves "not available here", in the same
 * visible-but-inert style the surface already uses for facets the API cannot express yet.
 *
 * Anything else — 5xx, a timeout, no network — IS a fault, and gets the error treatment with a
 * Retry. Collapsing the two would either cry wolf on every stale environment or bury real
 * outages behind a polite note.
 */
export type FacetStatus = "ok" | "unavailable" | "failed";

/** Duck-typed: the app's axios client rejects with the original `AxiosError`. */
export const isNotFoundError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { response?: { status?: number } }).response?.status === 404;

export const facetStatus = (isError: boolean, error: unknown): FacetStatus => {
  if (!isError) return "ok";
  return isNotFoundError(error) ? "unavailable" : "failed";
};
