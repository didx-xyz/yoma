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
  balanceUnknown: "Balance not available right now",
  nothingAvailable: "Nothing to cash out yet",
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
  {
    title: string;
    body: string;
    /** a quiet route to the thing that would unblock them, where one exists */
    link?: { label: string; href: string };
  }
> = {
  activePayout: {
    title: "You have a cash out in progress",
    body: "You can only have one cash out at a time. Finish this one first.",
  },
  /**
   * The environment kill-switch (`payout.enabled`). **Rarely seen**: the entry point hides the
   * button entirely rather than offering one that explains itself, so this is the backstop for the
   * race where the switch is flipped between the profile load and the request.
   *
   * No "try again later" and no "coming soon" — unlike `providerOffline`, which is minutes, this
   * one can stay closed for weeks, and neither a horizon nor a promise is ours to give. It says
   * where the Zlto is and what can still be done with it, and stops.
   */
  payoutDisabled: {
    title: "Cash Out isn't available right now",
    body: "Your Zlto is safe in your wallet, and you can still spend it in the marketplace.",
    link: { label: "Go to the marketplace", href: "/marketplace" },
  },
  profileIncomplete: {
    // Names who needs the data, and the colon introduces the list of missing fields below it.
    title: "Complete your profile to cash out",
    body: "Our secure payout partner needs these details before you can cash out:",
  },
  providerOffline: {
    title: "Cash Out isn't available right now",
    body: "Please try again later. Your Zlto is safe.",
  },
  countryUnsupported: {
    // "Your Zlto is safe" belongs to states where something could have gone wrong; nothing did.
    title: "Cash Out isn't available in your country yet",
    body: "We're working on adding more countries. You can still spend your Zlto in the marketplace.",
    link: { label: "Check my country in my profile", href: "/user/profile" },
  },
  walletNotReady: {
    title: "Your wallet is still being set up",
    body: "This usually takes a few minutes. Please try again soon.",
  },
  balanceUnknown: {
    // Deliberately the same words as `providerOffline`: the same situation, seen by the youth.
    title: "We can't check your balance right now",
    body: "Please try again later. Your Zlto is safe.",
  },
  nothingAvailable: {
    title: "You don't have any Zlto to cash out yet",
    body: "Complete opportunities to earn Zlto. Then come back here.",
    // The one gate whose fix is a link away — Close-only made it a dead end.
    link: { label: "Find opportunities", href: "/opportunities" },
  },
};

/** The profile fields the gate lists, and the button that goes and fixes them. */
export const GATE_PROFILE_ACTION = "Update my profile";
export const GATE_CLOSE_ACTION = "Close";

/**
 * The three-step indicator. Step 3 resolves on the result view, never on the hand-off — and only
 * for a *terminal* outcome (see `outcome.ts`; a tick is a claim).
 *
 * "Check" rather than "Review" (copy review 2026-09-14): "review" is not a word this reader uses.
 * The product does say "Review" elsewhere, but only on admin surfaces, which have a different
 * audience — flip both this and `REVIEW_COPY.dialogTitle` together if that is reconsidered.
 */
export const STEP_LABELS = ["Amount", "Check", "Result"] as const;

export const AMOUNT_COPY = {
  dialogTitle: "Cash Out",
  availableLabel: "Available to cash out",
  /** A question, not a noun phrase: it tells a first-time user what the field is for. */
  fieldLabel: "How much Zlto do you want to cash out?",
  /** "Use all" says what happens; "Max" is jargon (copy review 2026-09-14). */
  maxAction: "Use all",
  unit: "ZLTO",
  estimateLabel: "Estimated",
  /** The estimate label alone does not tell a first-time reader why it is an estimate. */
  estimateNote: "The final amount may be a little different.",
  continueAction: "Continue",
  cancelAction: "Cancel",
  /**
   * `treasuryFundsAvailable: false`. **Never a field error** — the amount the youth typed is
   * perfectly valid, Yoma has simply run out of cash-out funds for the period. Blaming the field
   * for that would send them to change a number that was never the problem.
   */
  pausedTitle: "Cash Out is paused for now",
  pausedBody:
    "Yoma's cash-out funds for this period are used up. Your Zlto is safe. Try again later.",
  /** the preview could not be fetched — the amount is still valid, so this is not a field error */
  estimateFailed: "We couldn't work out an estimate. Try again in a moment.",
  estimateRetryAction: "Try again",
  /** screen-reader text for the skeleton on the USD figure */
  estimateLoading: "Working out your estimate…",
} as const;

/**
 * Amount-field problems, in the server's own order of checks. Only the last of these is a field
 * error server-side; the rest are client-side guards that stop a request the API answers with a
 * 500 (`ArgumentOutOfRangeException` / `ArgumentException` are not mapped to 400 —
 * `ExceptionResponseMiddleware`).
 */
export const AMOUNT_PROBLEM_COPY = {
  invalid: "Enter an amount in Zlto, using numbers only.",
  notPositive: "Enter an amount more than 0.",
  /** The second sentence is the plain-language gloss — "whole number" is not universal. */
  notWhole: "Zlto must be a whole number. No decimals.",
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
  "That's more than you have available. We've updated your balance.";

export const REVIEW_COPY = {
  dialogTitle: "Check your cash out",
  amountLabel: "Amount",
  estimateLabel: "Estimated",
  rateLabel: "Rate",
  /** What happens next, in order — no "processed" (a status word) and no "held" (see the pending note). */
  handoffNote:
    "Next, our secure payout partner will ask where to send your money.",
  pendingNote: "Your Zlto stays pending until your cash out is finished.",
  estimateNote: "The final amount may be a little different from the estimate.",
  /** The heading already says cash out; a short label reads faster. */
  confirmAction: "Continue",
  confirmBusyAction: "Starting your cash out…",
  backAction: "Back",
} as const;

/**
 * The hosted journey, which runs in an **iframe inside Yoma** (API directive, 2026-09-10) rather
 * than in a new tab. The youth never leaves the product for the payment page itself.
 *
 * ⚠️ **They do leave it for sign-in and identity checks** (IXO, 2026-09-18). WorkOS refuses to be
 * framed at all, so rather than allowlisting Yoma's origin the provider now opens those two steps
 * in a **popup of its own**, returning to the frame afterwards. That is their code in their
 * document — Yoma neither opens the popup nor can observe it — so the copy's job is to say it will
 * happen before it happens, and to offer a way through when a popup blocker eats it.
 *
 * Closing the modal neither cancels nor completes anything — it just stops showing the journey, and
 * Yoma then asks the API how the payout actually stands.
 */
export const HOSTED_COPY = {
  preparingTitle: "Preparing your cash out…",
  dialogTitle: "Finish your cash out",
  /**
   * Under the title: whose page this is, and that part of it happens elsewhere.
   *
   * The second sentence is the whole point — a window appearing unannounced on a money screen reads
   * as something going wrong, and a window that never appears reads as nothing happening at all.
   * Said up front, both become expected.
   */
  lead: "Our secure payout partner will take it from here. Signing in and identity checks open in a separate window.",
  /** the iframe's accessible name — the provider is not named, here or anywhere */
  frameTitle: "Secure cash out",
  /** what the ✕ actually does, for a screen reader */
  closeLabel: "Close and check my cash out",
  /**
   * Says what the button does. The previous line answered a question the youth had not asked
   * ("what if I close it?") and left the one they had to the button label.
   */
  footerNote:
    "Your Zlto stays pending while you finish. When you're done, tap I'm done and we'll check how it went.",
  /**
   * The escape hatch: the whole journey in a tab of its own, where sign-in is top-level and no
   * popup is needed. **Not** a way to re-open the blocked popup — Yoma has no handle on it.
   *
   * IXO asked for this to be kept (2026-09-18) and it is now the *only* recovery from a blocked
   * popup, so it is visible from first paint rather than on a timer. See `blockedHint`.
   */
  newWindowAction: "Open in a new window",
  /**
   * Sits beside the escape hatch, permanently.
   *
   * ⚠️ **It used to be "Taking a while?", on a four-second timer**, and both were written for a
   * different failure: a frame that would not render. IXO's popup change makes that one rare and
   * introduces one the timer cannot serve — the frame renders perfectly, the youth taps sign-in,
   * and *nothing happens* because the popup was blocked. That can land at any point in the journey,
   * long after four seconds, and it is invisible to us: the popup is attempted by their code in
   * their document, so there is no event, no return value and nothing cross-origin to read.
   *
   * So it asks about the window rather than the page, and it never goes away. It still asks rather
   * than asserts — we do not know that anything failed (copy review 2026-09-14).
   */
  blockedHint: "Window didn't open?",
  doneAction: "I'm done",
} as const;

export const FAILURE_COPY = {
  createFailedTitle: "We couldn't start your cash out",
  /**
   * ⚠️ It used to say "Nothing has been taken from your wallet", which **can be false**:
   * `PayoutRewards` can fail after reserving. The entry point checks the profile before showing
   * this screen at all, but the copy must be true in both cases even so — and the release is real,
   * whether immediate (`TryReleaseReservation`), by reconciliation, or by the reservation expiry.
   * No timing promise, because that last path is hours.
   */
  createFailedBody:
    "Something went wrong on our side. Please try again. If your wallet shows Zlto as pending, we'll release it back to you.",
  retryAction: "Try again",
  closeAction: "Close",
} as const;

/**
 * The active-payout panel (Flow C): the payout in flight and the way back into it — the reserved
 * Zlto (the wallet's `pendingPayout`), its value in USD (`payout.amount`) and when it started
 * (`payout.dateCreated`).
 *
 * ⚠️ **No status line, deliberately, even though `status` now exists.** `Processing` begins when
 * the hosted payout is created, not when the youth confirms it, so neither `status` nor `canResume`
 * separates "still needs you" from "confirmed and on its way". Naming a status here would put a
 * claim on screen the contract cannot support; `canResume` decides what is *offered* instead.
 */
export const RESUME_COPY = {
  dialogTitle: "Your cash out",
  amountLabel: "Amount",
  estimateLabel: "Estimated",
  startedLabel: "Started",
  /** Same words as the hosted dialog's title, which is where the button goes. */
  title: "Finish your cash out",
  body: "You started this cash out but haven't finished it. Your Zlto stays pending until it's done.",
  continueAction: CASH_OUT_ACTION_CONTINUE,
  continueBusyAction: "Getting your cash out ready…",
  retryAction: "Try again",
  /** nothing failed in the setup window — they are checking, not retrying */
  checkAgainAction: "Check again",
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
  notResumableTitle: "We're still setting up your cash out",
  /** word for word the same as `OUTCOME_COPY.settingUpBody` — it is the same situation */
  notResumable:
    "This usually takes a few minutes. Your Zlto stays pending until it's done.",
  /**
   * The session route answered 404. ⚠️ **That alone does not prove the payout closed** — the
   * refusal can originate at the provider and can be transient — so this is never shown on its own:
   * the caller reads the outcome endpoint and shows the real outcome instead. It survives only as
   * the fallback for when that read also fails.
   */
  noLongerActive:
    "We couldn't open your cash out just now. Check back in a few minutes.",
} as const;

/**
 * Step 3 — Flow D, read from `GET /user/payout/latest` when the hosted modal closes. **Never
 * inferred from the wallet**: a committed reservation and a released one both leave
 * `pendingPayout` at zero, so only the recorded status can tell a youth whether their money
 * arrived.
 *
 * Four rules hold this copy together:
 *
 * - **In-progress is neutral.** `Processing` starts at hosted-payout creation, before the youth
 *   confirms anything, so nothing here may suggest money is on its way.
 * - **Expired is not cancelled.** One is a clock running out, the other is a decision — telling
 *   someone they cancelled something they did not is its own small injustice.
 * - **Unsuccessful outcomes are neutral, not apologetic and never blaming.** The Zlto comes back.
 * - **No historical Zlto figure.** The API deliberately does not carry one, and recomputing it at
 *   today's rate would invent a number. The USD amount is real and the wallet shows the rest.
 */
export const OUTCOME_COPY = {
  dialogTitle: "Your cash out",
  /**
   * ⚠️ **"Estimated", not "Amount".** The resume panel labels the *ZLTO* figure "Amount"; labelling
   * the USD one the same word two screens later was one word for two units. "Estimated" is also
   * what the youth saw on the amount step, and it stays true even on a completed payout:
   * `PayoutTransaction.Amount` is computed at initiation and never updated afterwards
   * (`UpdatePayoutTerminal` touches status, error, reconciliation and retry only), so Yoma cannot
   * call it the amount that landed.
   */
  amountLabel: "Estimated",
  startedLabel: "Started",

  inProgressTitle: "Your cash out is in progress",
  /**
   * Ends with where the Zlto is, and explains why a Continue button can sit under an in-progress
   * message: the youth may not have finished with the partner, and Yoma cannot tell.
   */
  inProgressBody:
    "This can take a few hours. Your Zlto stays pending until it's done. If you haven't finished with our payout partner yet, you can continue below.",
  /** active but with no provider reference yet — reconciliation is still placing it */
  settingUpTitle: "We're still setting up your cash out",
  settingUpBody:
    "This usually takes a few minutes. Your Zlto stays pending until it's done.",

  completedTitle: "Your cash out is complete",
  completedBody: "The money has been sent. Your wallet shows your new balance.",

  cancelledTitle: "Your cash out was cancelled",
  cancelledBody:
    "No money was sent. Your Zlto is back in your wallet. You can start again any time.",

  /** "Expired" is a word this reader meets on milk and passports, not on their own actions. */
  expiredTitle: "Your cash out ran out of time",
  expiredBody:
    "It wasn't finished in time, so it closed. No money was sent. Your Zlto is back in your wallet.",

  failedTitle: "Your cash out didn't go through",
  /** Says what failed — the payment, not the youth — and that no money moved, before comforting. */
  failedBody:
    "Something went wrong with the payment. No money was sent. Your Zlto is back in your wallet. You can try again when you're ready.",

  /** the outcome read itself failed — say so plainly rather than guessing at an outcome */
  unknownTitle: "We couldn't check your cash out",
  /** True without having read anything: our failure to read it did not touch the cash out. */
  unknownBody: "Your cash out is safe. Check again in a few minutes.",

  /** shown while the outcome is being read — "how it went" presumes it ended; it may not have */
  checkingBody: "Checking your cash out…",

  continueAction: CASH_OUT_ACTION_CONTINUE,
  /** a read failure and a setup wait are both worth another look, and neither is a retry */
  checkAgainAction: "Check again",
  startAgainAction: "Start a new cash out",
  doneAction: "Close",
} as const;
