import { IoOpenOutline } from "react-icons/io5";
import { HOSTED_COPY } from "~/lib/payout/copy";

/**
 * The hosted journey, embedded **inside Yoma** (API directive, 2026-09-10). The youth confirms
 * their cash out here without leaving the product.
 *
 * What this component may and may not do:
 *
 * - **It renders the URL and nothing else.** No reading of the frame's DOM, no watching its
 *   location, no inferring success from either — both are cross-origin and neither is a fact about
 *   the payout. The outcome comes from `GET /user/payout/latest` after the modal closes.
 * - **No `postMessage` listener.** Automatic close would need an origin-validated contract agreed
 *   with the provider; until that exists, closing is the youth's decision.
 * - **Closing cancels nothing.** The footer says so, because a modal that vanishes over someone's
 *   reserved Zlto invites exactly the wrong conclusion.
 *
 * ## The popup, and why there is no `sandbox` attribute
 *
 * ⚠️ **Sign-in and identity checks do not run in this frame. The provider opens them in a popup**
 * (IXO, 2026-09-18). WorkOS refuses framing outright — `frame-ancestors` without Yoma's origin,
 * found on Dev 2026-09-11 — and rather than allowlisting us, IXO moved those steps out. The popup
 * is opened by their code in their document and returns to the frame afterwards; Yoma neither opens
 * it nor can see it. They confirmed it is opened **synchronously in the click handler**, blank, and
 * navigated afterwards (IXO, 2026-09-21) — the pattern iOS Safari requires, so a block here is a
 * browser policy rather than a bug either side can fix.
 *
 * **There is deliberately no `sandbox` attribute, and adding one would break this.** IXO's note
 * asks for `allow-popups` and `allow-popups-to-escape-sandbox` *if* the frame is sandboxed — it is
 * not, and `sandbox` is deny-by-default, so introducing it to satisfy that line would strip
 * scripts, forms, storage and navigation from a journey that needs all four. Without the attribute
 * the frame may already open popups. Nothing else of Yoma's interferes either: the app sets no CSP,
 * no `Cross-Origin-Opener-Policy` and no `X-Frame-Options` (checked in `next.config.mjs`, the web
 * ingress and `_document.tsx`, 2026-09-18).
 *
 * ## No `allow` attribute: the frame is delegated nothing
 *
 * It used to carry `camera; microphone; clipboard-write; payment`. All four are gone.
 *
 * **`camera` and `microphone`** because IXO confirmed nothing inside this frame ever asks for
 * either (2026-09-21) — identity capture, ComplyCube and its QR hand-off to a phone all run in the
 * KYC window, which is top-level on their origin and prompts for itself. Delegating them was
 * granting a payment frame two of the most sensitive permissions a browser has, for no reason.
 *
 * **`payment`** delegates the browser's Payment Request API, which this flow does not use: the
 * provider collects bank and mobile-money details on its own pages.
 *
 * **`clipboard-write`** (owner, 2026-09-21) — nothing in the frame is believed to copy anything.
 * Note its Permissions-Policy default is `self`, so a cross-origin frame *would* need the grant if
 * that ever changed: the symptom of being wrong here is a copy control in the journey that silently
 * does nothing, not an error. That is the one thing to watch for on STAGE.
 *
 * Adding any of them back is a conversation, not a quiet re-grant — this is a money surface, and
 * the reason each one went is written down above.
 *
 * **A blocked popup is undetectable from here**, for the same reason a refused frame was: it
 * happens in a document we cannot read. So the way out is permanent rather than prompted — see the
 * status slot below.
 *
 * ⚠️ **In-app browsers get the fallback, not a different path** (owner, 2026-09-21). IXO do not
 * support the embedded flow inside Facebook, Instagram or WhatsApp webviews — those block or mangle
 * new windows, and some replace the whole view with the sign-in page, destroying this frame. Their
 * supported path there is the payment URL opened *top-level*, where their page redirects
 * full-window instead of popping.
 *
 * **Yoma deliberately does not detect them.** A youth in one falls back to the permanent "Open in a
 * new window" below, or to the equivalent link IXO render inside their own page. Detection is
 * recorded as possible future work — with a definition of what counts as a webview and how it would
 * be sniffed — in this ticket's `feature.md`. Read that before attempting it; the naive version is
 * both fragile and wrong about Custom Tabs.
 */

export const CashOutHostedStep: React.FC<{
  paymentUrl: string;
  onOpenInNewWindow: () => void;
  onDone: () => void;
}> = ({ paymentUrl, onOpenInNewWindow, onDone }) => {
  return (
    <div className="flex min-h-0 grow flex-col gap-3">
      {/* Whose page this is, before they see it. */}
      <p className="text-gray-dark text-center text-xs">{HOSTED_COPY.lead}</p>

      {/*
      The frame takes every pixel the dialog has left, at whatever size the window is.

      `min-h-0` on both this column and the iframe is what makes that work: a flex child's default
      `min-height: auto` refuses to shrink below its content, and an iframe's content is a whole
      other document — so without it the frame keeps its intrinsic 150px or its own min-height and
      stops tracking the dialog. `h-full` alongside `grow` covers the case where the parent chain
      hands down a definite height rather than free space.
    */}
      <iframe
        src={paymentUrl}
        title={HOSTED_COPY.frameTitle}
        className="border-gray h-full min-h-0 w-full grow rounded-lg border bg-white"
        referrerPolicy="no-referrer"
      />

      <div className="flex flex-col items-center gap-2">
        {/*
          The status slot: the **only** place the escape hatch lives, and it is now here from the
          first paint and never leaves.

          ⚠️ It used to spend four seconds showing "Loading…" first, on the theory that the way out
          was only wanted once the frame had visibly failed. IXO's popup change retires that theory:
          the frame renders fine and the failure arrives later, when a tap on sign-in opens nothing.
          A youth who taps within four seconds would have watched a spinner instead of finding the
          one control that helps, and one who taps at thirty seconds would have needed it back.
          Neither is detectable, so it is simply always available.

          Static content, so no `aria-live` — there is no change to announce. The fixed height is
          kept so the footer never reflows.
        */}
        <div className="flex h-11 flex-row flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-gray-dark">{HOSTED_COPY.blockedHint}</span>
          <button
            type="button"
            onClick={onOpenInNewWindow}
            className="text-purple inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline"
          >
            <IoOpenOutline className="h-4 w-4" aria-hidden="true" />
            {HOSTED_COPY.newWindowAction}
          </button>
        </div>

        {/* `w-full` so it wraps: inside `items-center` the paragraph would take its content width
            and run off the edge of a narrow screen instead of breaking onto a second line. */}
        <p className="text-gray-dark w-full text-center text-xs">
          {HOSTED_COPY.footerNote}
        </p>

        {/* One primary action. The way out is in the status slot above, not competing here. */}
        <button
          type="button"
          onClick={onDone}
          className="btn bg-purple hover:bg-purple w-full rounded-full px-8 text-white normal-case hover:text-white md:w-auto md:self-end"
        >
          {HOSTED_COPY.doneAction}
        </button>
      </div>
    </div>
  );
};
