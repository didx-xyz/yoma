/**
 * The hosted payout journey's URL.
 *
 * It comes from the provider by way of Yoma, is HTTPS-enforced server-side and expires in about 30
 * minutes (`PayoutSession.expiresAt`). It is used as an **iframe `src`** — the journey runs inside
 * Yoma — with `openPaymentUrl` kept only as the escape hatch for a browser or a provider that will
 * not allow framing. Three rules, all binding:
 *
 * - **Use it complete, fragment token and all.** It is not a URL to tidy, rebuild or normalise.
 * - **Never persist it.** Not in local storage, not in a query string, not in component state that
 *   outlives the dialog. An active payout gets a *fresh* session from `GET /user/payout/zlto`
 *   instead — a stored URL is either expired or a live payment link sitting in a browser store.
 *   And never `POST` to refresh it: that starts a second payout.
 * - **Check the scheme here too.** The server enforces HTTPS, and PR #1924 already reports
 *   URL-redirect findings on web, so a second check costs nothing — and it keeps a `javascript:` or
 *   `data:` URL out of an iframe `src`, which is a worse place for one than a link.
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
 * The escape hatch: opens the hosted journey in a new tab.
 *
 * **Not the intended path** — the journey belongs in the iframe modal, where the youth stays inside
 * Yoma. This exists because framing depends on the provider's own headers and authentication rules
 * (open with IXO), and someone whose Zlto is already reserved cannot be left in front of a frame
 * that refused to load.
 *
 * `noopener,noreferrer`: the hosted page must not reach back into this window, and Yoma's URL is
 * not the provider's business. It returns nothing on purpose — `noopener` makes `window.open`
 * return `null` per spec whether it opened or was blocked, and dropping it to find out would hand a
 * payment page a handle on this one. Nothing branches on the result, and closing the modal reads
 * the real outcome from the API either way.
 */
export const openPaymentUrl = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};
