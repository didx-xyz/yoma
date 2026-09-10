/**
 * Handing the youth over to the hosted payout journey.
 *
 * The URL comes from the provider by way of Yoma, is HTTPS-enforced server-side and expires in
 * about 30 minutes (`PayoutSession.expiresAt`). Two rules, both binding:
 *
 * - **Never persist it.** Not in local storage, not in a query string, not in component state that
 *   outlives the dialog. An active payout gets a *fresh* session from `GET /user/payout/zlto`
 *   instead — a stored URL is either expired or a live payment link sitting in a browser store.
 * - **Check the scheme here too.** The server enforces HTTPS, and PR #1924 already reports
 *   URL-redirect findings on web, so a second check costs nothing and closes the case where the
 *   value arrives from anywhere other than where we think it does.
 */

/**
 * True only for an absolute `https:` URL. Anything else — `http:`, `javascript:`, `data:`, a
 * protocol-relative `//host`, a relative path, an unparseable string — is refused, and the caller
 * treats a refusal as a failed initiation rather than navigating.
 */
export const isSafePaymentUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Opens the hosted journey in a new tab, keeping Yoma's own tab on the flow so the youth has
 * somewhere to come back to (there is no provider redirect back into Yoma — nothing in the payout
 * request carries a return URL).
 *
 * `noopener,noreferrer`: the hosted page must not reach back into this window, and Yoma's URL is
 * not the provider's business.
 *
 * ⚠️ **Whether it opened cannot be detected, and that is by design on both sides.** `noopener`
 * makes `window.open` return `null` per spec whether it succeeded or was blocked, and dropping it
 * to find out would hand a payment page a handle on Yoma's window. A popup blocker can also swallow
 * the tab silently *after* the Zlto has been reserved. So the flow does not branch on the outcome:
 * the hand-off screen says a window should have opened and always offers the button, which is the
 * one wording that is true either way.
 */
export const openPaymentUrl = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};
