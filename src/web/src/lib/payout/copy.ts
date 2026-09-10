import { formatZlto } from "~/lib/format/rewards";
import type { CashOutBlockReason } from "./eligibility";

/**
 * **Every user-facing string in the Cash Out flow, in one place.**
 *
 * Why one module rather than copy sitting in the component that renders it: the copy sheet is still
 * owed (design pass, YOM-1074) and none of this wording is signed off. When it is, the reviewer has
 * to be able to read the whole flow in one file and change a phrase without opening nine
 * components — and the seven gate bodies in particular were invented against `PayoutService`
 * rather than drawn from a brief, so they are the most likely to be rewritten.
 *
 * The rules every string here obeys, all from the epic:
 *
 * - **The payout provider is never named, branded or hinted at.** "our secure payout partner".
 * - The user-facing action is **"Cash Out"** (title case as the action/product, lower case as a
 *   noun or verb in prose: "your cash out", "cash out your Zlto"). Never "payout", "withdraw",
 *   "redeem" or "off-ramp" in copy — `payout` is the internal/contract term only.
 * - **"Zlto" in prose, "ZLTO" as the unit** and in image alt text.
 * - The USD figure is **always** labelled an estimate, and never presented as guaranteed.
 * - Nothing implies Zlto has been lost, and nothing blames the youth for a state Yoma or the
 *   provider produced.
 * - No timing promise beyond "this can take a few hours" — the provider's own windows are 24h
 *   pre-confirmation and up to ~6h after, so anything tighter is a promise Yoma cannot keep.
 */

/** The action, as it appears on a button. Title case: it is the name of the thing. */
export const CASH_OUT_ACTION = "Cash Out";
/** The same action when a payout is already in flight — resume, not start. */
export const CASH_OUT_ACTION_CONTINUE = "Continue cash out";

/**
 * Shown under a disabled Cash Out button, for the two states the ledger itself already displays:
 * an unknown balance (em dashes, plus the ledger's own offline notice) and a known zero. Every
 * other reason a cash out cannot start is invisible on the ledger, so it gets the gate dialog
 * instead of a disabled button.
 */
export const CASH_OUT_DISABLED_HELPER: Partial<
  Record<CashOutBlockReason, string>
> = {
  balanceUnknown:
    "Cash Out is unavailable while your balance can't be checked.",
  nothingAvailable:
    "Nothing is available to cash out yet. Complete opportunities to earn Zlto.",
};

/**
 * The blocking states of the gate — what a youth is told instead of the amount form.
 *
 * Order and titles mirror `PayoutService`'s own checks (see `eligibility.ts`), so the reason shown
 * is the reason the API would have given. Titles are treated as fixed by the design; the bodies are
 * drafts owned by the copy sheet.
 */
export const GATE_COPY: Record<
  CashOutBlockReason,
  { title: string; body: string }
> = {
  activePayout: {
    title: "You already have a cash out in progress",
    body: "You can have one cash out at a time. Finish or wait for your current cash out first.",
  },
  profileIncomplete: {
    title: "Complete your profile to cash out",
    body: "We need a few more details before you can cash out.",
  },
  providerOffline: {
    title: "Cash Out is temporarily unavailable",
    body: "Please try again later. Your Zlto is safe.",
  },
  countryUnsupported: {
    title: "Cash Out isn't available in your country yet",
    body: "We're working on adding more countries. Your Zlto is safe and you can still spend it on the marketplace.",
  },
  walletNotReady: {
    title: "Your wallet is still being set up",
    body: "This usually takes a few minutes. Please try again shortly.",
  },
  balanceUnknown: {
    title: "We can't check your balance right now",
    body: "Please try again in a few minutes. Your Zlto is safe.",
  },
  nothingAvailable: {
    title: "You don't have any Zlto to cash out yet",
    body: "Complete opportunities to earn Zlto, then come back to cash it out.",
  },
};

/** The three-step indicator. Step 3 resolves on the result view, never on the hand-off. */
export const STEP_LABELS = ["Amount", "Review", "Result"] as const;

export const AMOUNT_COPY = {
  dialogTitle: "Cash Out",
  availableLabel: "Available to cash out",
  fieldLabel: "Amount to cash out",
  maxAction: "Max",
  unit: "ZLTO",
  estimateLabel: "Estimated",
  continueAction: "Continue",
  cancelAction: "Cancel",
  /**
   * `treasuryFundsAvailable: false`. **Never a field error** — the amount the youth typed is
   * perfectly valid, Yoma has simply run out of cash-out funds for the period. Blaming the field
   * for that would send them to change a number that was never the problem.
   */
  pausedTitle: "Cash Out is paused for now",
  pausedBody:
    "Yoma's cash-out funds for this period have been used up. Your Zlto is safe and you can try again later.",
  /** the preview could not be fetched — the amount is still valid, so this is not a field error */
  estimateFailed: "We couldn't work out an estimate just now.",
} as const;

/**
 * Amount-field problems, in the server's own order of checks. Only the last of these is a field
 * error server-side; the rest are client-side guards that stop a request the API answers with a
 * 500 (`ArgumentOutOfRangeException` / `ArgumentException` are not mapped to 400 —
 * `ExceptionResponseMiddleware`).
 */
export const AMOUNT_PROBLEM_COPY = {
  invalid: "Enter an amount in Zlto, using numbers only.",
  notPositive: "Enter an amount greater than 0.",
  notWhole: "Enter a whole number of Zlto.",
} as const;

export const amountAboveAvailableMessage = (available: number): string =>
  `You can cash out up to ${formatZlto(available)} ZLTO.`;

/**
 * The server refused the amount against its own reading of the wallet, which means the balance on
 * screen was stale. Deliberately quotes no figure: the profile's number has just been proved wrong
 * and the server's message carries internal wording ("payout") that copy may not show. The entry
 * point refreshes the profile when this happens, so the ledger corrects itself behind the dialog.
 */
export const AMOUNT_SERVER_REJECTED =
  "That's more than you have available to cash out right now.";

export const REVIEW_COPY = {
  dialogTitle: "Review your cash out",
  amountLabel: "Amount",
  estimateLabel: "Estimated",
  rateLabel: "Rate",
  handoffNote:
    "You'll continue to our secure payout partner to finish. This may take a few minutes. Your Zlto will be held while your cash out is processed.",
  estimateNote: "The final amount may differ slightly from the estimate.",
  confirmAction: "Continue to cash out",
  backAction: "Back",
} as const;

export const HANDOFF_COPY = {
  preparingTitle: "Preparing your cash out…",
  /**
   * One screen covers both outcomes of the hand-off, because the browser does not reliably tell us
   * which one happened: the initiation is a round trip, so `window.open` runs outside the youth's
   * tap and a popup blocker can swallow the new tab silently. Their Zlto is already reserved by
   * then, so "nothing happened" is the one reading to avoid — hence a button that is always there.
   */
  readyTitle: "Your cash out is ready",
  readyBody:
    "A new window should have opened. If nothing opened, use the button below.",
  openAction: "Open cash out",
  closeAction: "Close",
} as const;

export const FAILURE_COPY = {
  createFailedTitle: "We couldn't start your cash out",
  createFailedBody: "Nothing has been taken from your wallet.",
  retryAction: "Try again",
  closeAction: "Close",
} as const;

/**
 * The active-payout panel (Flow C). It shows what Yoma actually knows about the payout in flight:
 * the reserved Zlto (the wallet's `pendingPayout`) and its estimated value (`payout.amount`).
 *
 * There is deliberately no status line distinguishing "waiting for you" from "processing", and no
 * start time: the profile carries neither. See the feature doc — resolving that needs the payout
 * status on `UserProfilePayout`.
 */
export const RESUME_COPY = {
  dialogTitle: "Your cash out",
  amountLabel: "Amount",
  estimateLabel: "Estimated",
  title: "Pick up where you left off",
  body: "You started a cash out but haven't finished it. Continue to complete it — your Zlto stays held until it's done.",
  continueAction: CASH_OUT_ACTION_CONTINUE,
  retryAction: "Try again",
  closeAction: "Close",
  /** the session fetch failed — the payout is untouched, so the tone stays neutral */
  linkFailed:
    "We couldn't open your cash out right now. Please try again in a moment.",
  /**
   * `GET /user/payout/zlto` answered but the provider session does not exist yet — Yoma has
   * recorded the payout and has not yet placed it with the provider ("The payout provider session
   * is not yet available").
   *
   * **This is a wait, not a dead end**, and API `8d34eee7` is why: reconciliation retries
   * initiation whenever the provider transaction id is missing, including from
   * `ReconciliationRequired`, so a session appears within a reconciliation cycle. So the copy gives
   * the youth a horizon and the panel keeps its retry — "being processed" would have sent someone
   * away from a screen that works again in minutes.
   */
  notResumable:
    "We're still setting up your cash out. Try again in a few minutes — your Zlto is safe.",
  /** the profile said a payout was active and the API says otherwise — 404 from the session route */
  noLongerActive:
    "This cash out has finished processing. Check your Zlto balance for the outcome.",
} as const;

/**
 * Step 3. **Not an outcome** — Yoma does not know one yet, and receiving a hosted session is not a
 * completed payout.
 *
 * The four drawn outcome states (completed / cancelled / expired / failed) are not built: no
 * youth-facing endpoint reports a payout's terminal status, so the UI cannot tell which of them
 * happened without inventing it. Recorded as a gap in the feature doc.
 */
export const RESULT_COPY = {
  processingTitle: "Thanks — your cash out is being processed",
  /**
   * The board's body is "This can take a few hours. We'll update your wallet when it's done."
   * This adds the "if you haven't already" clause, because the view is reached by coming back to
   * this tab — which a youth may do having abandoned the hosted journey rather than finished it.
   * Yoma cannot tell the two apart, so the copy must be true either way.
   */
  processingBody:
    "Finish up with our secure payout partner if you haven't already. This can take a few hours — we'll update your wallet when it's done.",
  doneAction: "Back to wallet",
} as const;
