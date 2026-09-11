import { IoOpenOutline } from "react-icons/io5";
import { HOSTED_COPY } from "~/lib/payout/copy";

/**
 * The hosted journey, embedded **inside Yoma** (API directive, 2026-09-10). The youth confirms
 * their cash out here without leaving the product, and without a new tab that a popup blocker can
 * swallow.
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
 * `allow` grants the camera and microphone the provider's identity checks may need — a frame
 * without them fails silently at the worst moment. No `sandbox` attribute: the hosted journey needs
 * scripts, forms, its own storage and its own navigation, and an allow-list assembled by guesswork
 * would break authentication in ways only the provider could diagnose.
 *
 * ⚠️ Whether the provider permits framing at all is **open with IXO**. If it refuses, the youth
 * sees the browser's own refusal inside the frame — which is why the escape hatch below it is not
 * optional.
 */
export const CashOutHostedStep: React.FC<{
  paymentUrl: string;
  onOpenInNewWindow: () => void;
  onDone: () => void;
}> = ({ paymentUrl, onOpenInNewWindow, onDone }) => (
  <div className="flex min-h-0 grow flex-col gap-3">
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
      allow="camera; microphone; clipboard-write; payment"
      referrerPolicy="no-referrer"
    />

    <div className="flex flex-col items-center gap-2">
      {/* `w-full` so it wraps: inside `items-center` the paragraph would take its content width
          and run off the edge of a narrow screen instead of breaking onto a second line. */}
      <p className="text-gray-dark w-full text-center text-xs">
        {HOSTED_COPY.footerNote}
      </p>

      <div className="flex flex-row flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onDone}
          className="btn bg-purple hover:bg-purple rounded-full px-8 text-white normal-case hover:text-white"
        >
          {HOSTED_COPY.doneAction}
        </button>

        {/* Deliberately secondary: the modal is the intended experience, and this exists for the
            youth whose browser or the provider's framing rules will not allow it. */}
        <button
          type="button"
          onClick={onOpenInNewWindow}
          className="btn btn-ghost text-gray-dark rounded-full text-xs normal-case"
        >
          <IoOpenOutline className="h-4 w-4" aria-hidden="true" />
          {HOSTED_COPY.newWindowAction}
        </button>
      </div>
    </div>
  </div>
);
