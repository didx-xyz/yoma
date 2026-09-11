/**
 * Guards for values that are interpolated into an API **request path**.
 *
 * Why this exists: a path segment built from a route parameter is attacker-controlled. Next.js
 * hands `context.params` straight through — `fallback: "blocking"` means any URL reaches
 * `getStaticProps`, not only the paths that were pre-generated — and the request is then made
 * *server-side*, with the caller's credentials attached (`ApiServer(context)`). A segment
 * containing `..` or an encoded slash walks the path and reaches an endpoint the page never meant
 * to call. CodeQL reports this as server-side request forgery, and it is right to.
 *
 * Encoding alone does not fix it: `encodeURIComponent("..")` is still `".."`, and the browser and
 * the server both normalise `a/../b` to `b`. **Validating the shape is the fix**; encoding is the
 * belt to its braces, for the characters a valid value will never contain anyway.
 *
 * So: every interpolated segment gets a pattern, and anything that does not match is refused before
 * a request is built. Callers that take the value from a route should also use the matching
 * predicate to answer with a 404 rather than an exception — a malformed URL is a missing page, not
 * a server error.
 */

/** ISO 3166-1 alpha-2, plus Yoma's own "WW" for worldwide: exactly two ASCII letters. */
const COUNTRY_CODE_ALPHA2 = /^[A-Za-z]{2}$/;

/** Canonical 8-4-4-4-12 hex form, as every id the API issues arrives. */
const UUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const isCountryCodeAlpha2 = (
  value: string | undefined | null,
): boolean => !!value && COUNTRY_CODE_ALPHA2.test(value);

const segment = (
  value: string | undefined | null,
  pattern: RegExp,
  what: string,
): string => {
  if (!value || !pattern.test(value)) {
    // Deliberately does not echo the value back: it is attacker-controlled, and this message can
    // end up in a log or an error overlay.
    throw new Error(`Invalid ${what} in request path`);
  }
  return encodeURIComponent(value);
};

/** A country code safe to place in a path. Throws rather than building a request from junk. */
export const countryCodeSegment = (value: string | undefined | null): string =>
  segment(value, COUNTRY_CODE_ALPHA2, "country code");

/** An entity id safe to place in a path. */
export const uuidSegment = (value: string | undefined | null): string =>
  segment(value, UUID, "identifier");
