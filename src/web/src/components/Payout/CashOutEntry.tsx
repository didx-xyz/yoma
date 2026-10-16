import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import type { PayoutSession, PayoutTransactionInfo } from "~/api/models/payout";
import { PayoutTransactionStatus } from "~/api/models/payout";
import type { UserProfile } from "~/api/models/user";
import {
  cancelPayout,
  getLatestPayout,
  getZltoPayoutSession,
  initiateZltoPayout,
} from "~/api/services/payout";
import { convertZltoToUsd } from "~/api/services/treasury";
import { getUserProfile } from "~/api/services/user";
import {
  AMOUNT_COPY,
  AMOUNT_PROBLEM_COPY,
  AMOUNT_SERVER_REJECTED,
  CANCEL_COPY,
  CASH_OUT_ACTION,
  CASH_OUT_ACTION_CONTINUE,
  CASH_OUT_DISABLED_HELPER,
  FAILURE_COPY,
  GATE_COPY,
  HOSTED_COPY,
  MINIMUM_COPY,
  OUTCOME_COPY,
  RESUME_COPY,
  REVIEW_COPY,
} from "~/lib/payout/copy";
import { cashOutMinimum, isBelowCashOutMinimum } from "~/lib/payout/minimum";
import { describeOutcome, formatPayoutStarted } from "~/lib/payout/outcome";
import type { CashOutBlockReason } from "~/lib/payout/eligibility";
import { cashOutEligibility } from "~/lib/payout/eligibility";
import { isSafePaymentUrl, openPaymentUrl } from "~/lib/payout/handoff";
import { parseCashOutAmount } from "~/lib/payout/amount";
import { mapPayoutFailure } from "~/lib/payout/serverErrors";
import { userProfileAtom } from "~/lib/store";
import type { ZltoLedgerVariant } from "../Rewards/ZltoLedger";
import { CashOutAmountStep, type CashOutPreview } from "./CashOutAmountStep";
import { CashOutButton } from "./CashOutButton";
import { CashOutGate } from "./CashOutGate";
import { CashOutHostedStep } from "./CashOutHostedStep";
import { CashOutMessageStep } from "./CashOutMessageStep";
import { CashOutOutcomeStep } from "./CashOutOutcomeStep";
import {
  CashOutResumePanel,
  type CashOutResumeState,
} from "./CashOutResumePanel";
import { CashOutReviewStep } from "./CashOutReviewStep";
import { CashOutDialog } from "./CashOutDialog";
import type { CashOutStep } from "./CashOutStepper";

/**
 * The Cash Out entry point and the flow behind it: the button on the ledger, the eligibility gate,
 * amount → review → hand-off, and the way back into a payout already in flight.
 *
 * **Why this component owns the fetching rather than a page.** The epic's rule is that components
 * take props and the page owns fetching, routing and toasts — written for the admin surfaces, where
 * one page owns one dataset. This entry point has no page: it lives in `ZltoLedger`'s `actions`
 * slot, and the ledger's two homes are a *layout* (`Layout/Marketplace`) and a dashboard *card*
 * (`YoID/WalletCard`) rendered by two different pages. Pushing the orchestration up would mean
 * duplicating a money-moving state machine into three places, which is precisely the drift the rule
 * exists to prevent. So the state machine lives here, once, and the step components below it stay
 * presentational and prop-driven.
 *
 * The order of operations is not stylistic — it mirrors `PayoutService`:
 *
 * 1. `cashOutEligibility` runs the server's five pre-checks so nobody types an amount into a form
 *    the API would refuse. An active payout short-circuits everything (the server never
 *    re-validates availability for one).
 * 2. The amount is checked against `available`, whole and positive, before the request.
 * 3. `treasuryFundsAvailable: false` is a paused panel, never a field error.
 * 4. Only "insufficient reward balance" is a field error; everything else is a state.
 *
 * The hosted journey runs in an **iframe inside this dialog** (API directive, 2026-09-10), so the
 * youth never leaves Yoma. Closing it cancels nothing: Yoma re-reads the profile and asks
 * `GET /user/payout/latest` how the payout actually stands, and shows that.
 *
 * ⚠️ The hosted URL is **never persisted** — not in storage, not in a route. It lives in this
 * component's state while the dialog is open and dies with it; an active payout gets a *fresh*
 * session from `GET /user/payout/zlto` on tap. Never `POST` to refresh — that starts a second
 * payout.
 */

type FlowView =
  | { name: "closed" }
  | { name: "gate"; reason: CashOutBlockReason; missingFields?: string[] }
  | { name: "amount" }
  | { name: "review"; amount: number; usd: number; rate: number | null }
  /** the hosted journey, embedded */
  | { name: "hosted"; paymentUrl: string }
  /**
   * The payout in flight, and the ways to act on it.
   *
   * ⚠️ **It carries the session now** (API 2026-09-21). Cancellation eligibility only exists on a
   * session (or a matched `latest` read), and Cancel has to sit beside Continue *before* the youth
   * goes near the hosted screen — so the session is fetched when this view opens rather than when
   * Continue is tapped. It lives here, in dialog memory, and dies with the dialog: never stored,
   * never re-fetched by `POST`.
   */
  | {
      name: "resume";
      state?: CashOutResumeState;
      notice?: string;
      session?: PayoutSession;
    }
  /** the cancellation confirmation, holding the id it will act on and nothing else */
  | { name: "cancelConfirm"; payoutId: string }
  | { name: "cancelling"; payoutId: string }
  | { name: "cancelled" }
  /** step 3 — the recorded outcome, or `null` when it could not be read */
  | { name: "outcome"; payout: PayoutTransactionInfo | null }
  /** reading the outcome, right after the hosted modal closed */
  | { name: "checking" }
  | { name: "failed" };

/** How long after the last keystroke to price the amount. */
const PREVIEW_DEBOUNCE_MS = 400;

const STEP_BY_VIEW: Partial<Record<FlowView["name"], CashOutStep>> = {
  amount: 1,
  review: 2,
  hosted: 3,
  checking: 3,
  outcome: 3,
};

export const CashOutEntry: React.FC<{
  profile: UserProfile;
  variant: ZltoLedgerVariant;
}> = ({ profile, variant }) => {
  const setUserProfile = useSetAtom(userProfileAtom);
  const queryClient = useQueryClient();

  const [view, setView] = useState<FlowView>({ name: "closed" });
  const [amountText, setAmountText] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [serverAmountError, setServerAmountError] = useState<string>();
  /**
   * The Treasury said no while holding its own lock, after the preview said yes. Sticky until the
   * amount changes: re-enabling Continue off the back of a cached preview would send the youth
   * straight back into the same refusal.
   */
  const [serverPaused, setServerPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [debouncedAmount, setDebouncedAmount] = useState<number | null>(null);

  const eligibility = cashOutEligibility(profile);
  const available = profile.zlto?.available ?? 0;
  const isOpen = view.name !== "closed";

  /**
   * The country's floor, from the profile — the same figure the server checks, so no request is
   * spent asking for it again. Re-derived on every render, which is what makes a country change
   * show the new minimum rather than the old one.
   */
  const minimum = cashOutMinimum(profile.payout?.countryAvailability);

  const amount = parseCashOutAmount(amountText, available);
  /** The amount worth pricing, or null when there is nothing valid to price. */
  const amountValue = amount.ok ? amount.value : null;

  /**
   * Refresh the profile so the ledger behind the dialog tells the truth about the wallet — and
   * hand the fresh copy back, because after a failed initiation it is the only thing that can say
   * whether a payout exists (see `initiate`).
   */
  const refreshProfile = useCallback(async () => {
    try {
      const refreshed = await getUserProfile();
      setUserProfile(refreshed);
      return refreshed;
    } catch {
      // A stale ledger is not worth interrupting the flow the youth is in the middle of.
      return null;
    }
  }, [setUserProfile]);

  // Price the amount only once typing settles: every keystroke locks the Treasury row server-side
  // (`ConvertZltoToUsd` takes it with `LockMode.Wait`), so an un-debounced preview would take that
  // lock on "6", "60" and "600" to answer a question about 600.
  useEffect(() => {
    if (amountValue == null) {
      setDebouncedAmount(null);
      return;
    }
    const timer = setTimeout(
      () => setDebouncedAmount(amountValue),
      PREVIEW_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [amountValue]);

  const previewQuery = useQuery({
    queryKey: ["Payout", "Conversion", debouncedAmount],
    queryFn: () => convertZltoToUsd(debouncedAmount ?? 0),
    enabled: isOpen && debouncedAmount != null,
    // Indicative and cheap to re-ask, but the rate and the Treasury's capacity can both move —
    // long enough to survive a Back/Continue, short enough not to quote a stale estimate.
    staleTime: 30_000,
    retry: false,
  });

  const preview: CashOutPreview = (() => {
    if (amountValue == null) return { state: "idle" };
    // Still catching up with what has been typed: the figure on screen must never belong to a
    // different amount than the one in the field.
    if (debouncedAmount !== amountValue || previewQuery.isFetching)
      return { state: "loading" };
    if (previewQuery.isError) return { state: "failed" };
    if (!previewQuery.data) return { state: "loading" };

    return {
      state: "ready",
      usd: previewQuery.data.amount,
      rate: previewQuery.data.conversionRateZltoPerUsd,
      paused: serverPaused || !previewQuery.data.treasuryFundsAvailable,
    };
  })();

  /**
   * ⚠️ Judged against the **preview's** USD figure, and only a preview that belongs to what is in
   * the field right now — `preview.state === "ready"` already guarantees that (it is false while
   * `debouncedAmount` trails `amountValue`), so a stale estimate can never qualify a smaller new
   * amount. Never the typed ZLTO, and never a threshold back-calculated from the rounded rate.
   */
  const belowMinimum =
    preview.state === "ready" && isBelowCashOutMinimum(minimum, preview.usd);

  const canContinue =
    amount.ok &&
    preview.state === "ready" &&
    !preview.paused &&
    !belowMinimum &&
    !busy;

  const close = useCallback(() => {
    setView({ name: "closed" });
    setAmountText("");
    setAmountTouched(false);
    setServerAmountError(undefined);
    setServerPaused(false);
  }, []);

  /**
   * Step 3. Reads the recorded outcome — the **only** thing that can say how a cash out went, since
   * the wallet cannot: a committed reservation and a released one both leave `pendingPayout` at
   * zero. The profile is refreshed alongside it so the ledger behind the dialog agrees.
   *
   * A failed read shows "we couldn't check", never a guessed outcome.
   */
  const showOutcome = useCallback(async () => {
    setView({ name: "checking" });
    const [payout] = await Promise.all([
      getLatestPayout().catch(() => null),
      refreshProfile(),
    ]);
    setView({ name: "outcome", payout });

    /*
      ⚠️ A second refresh, and it is not redundant (API note, 2026-09-25).

      The two reads above are concurrent, so the completion webhook can land *between* them: the
      outcome comes back `Completed` while the profile was fetched a moment earlier and still says
      `walletAvailable: false`. The youth would then be told their cash out is complete on a screen
      whose wallet link is missing — precisely when they most want it — and it would stay missing
      until something else happened to refresh the profile.

      So: re-read once a terminal Completed is actually in hand. Only then, because this is the one
      status that flips the flag, and every other outcome would be spending a request to learn
      nothing. `await`ed rather than fired and forgotten so the ledger behind the dialog is correct
      by the time it is looked at.

      This does not cover a webhook arriving after the dialog closes; nothing pushes into the page,
      so that one waits for the next profile refresh or navigation.
    */
    if (payout?.status === PayoutTransactionStatus.Completed)
      await refreshProfile();
  }, [refreshProfile]);

  /**
   * Fetch a *fresh* hosted session for the active payout and park it on the resume view — the URL
   * for Continue and `canCancel` for Cancel, from one request.
   *
   * Every outcome lands on a state the panel can render; nothing here hands the youth to the
   * provider, because the point of fetching early is to let them choose first.
   */
  const loadResumeSession = useCallback(async () => {
    setView((current) =>
      current.name === "resume"
        ? {
            ...current,
            state: "loading",
            notice: undefined,
            session: undefined,
          }
        : { name: "resume", state: "loading" },
    );

    try {
      const session = await getZltoPayoutSession();

      // 404 — but ⚠️ **that alone does not prove the payout closed**: the refusal can originate at
      // the provider and can be transient. Ask the outcome endpoint what is actually true rather
      // than telling the youth their cash out has ended.
      if (!session) {
        await showOutcome();
        return;
      }

      if (!isSafePaymentUrl(session.paymentUrl)) {
        setView({ name: "resume", notice: RESUME_COPY.linkFailed });
        return;
      }

      setView({ name: "resume", state: "resumable", session });
    } catch (error) {
      const failure = mapPayoutFailure(error);
      if (failure.kind === "noActivePayout") {
        await showOutcome();
      } else if (failure.kind === "sessionNotReady") {
        // Yoma has the payout; the provider does not have it yet. Reconciliation retries initiation
        // whenever the provider transaction id is missing (API `8d34eee7`), so this resolves on its
        // own within a cycle — the youth gets a retry and a horizon, not a dead end. No invitation
        // to "pick up where you left off": there is nothing to pick up until the session exists.
        setView({ name: "resume", state: "settingUp" });
      } else {
        setView({ name: "resume", notice: RESUME_COPY.linkFailed });
      }
    }
  }, [showOutcome]);

  const openFlow = useCallback(() => {
    if (eligibility.allowed) {
      setAmountText("");
      setAmountTouched(false);
      setServerAmountError(undefined);
      setServerPaused(false);
      setView({ name: "amount" });
      return;
    }

    // One active payout per user: the answer is to finish that one, not to start another, so the
    // youth goes to the payout in flight rather than to a dialog explaining that they cannot.
    if (eligibility.reason === "activePayout") {
      // `canResume: false` means Yoma has the payout and the provider does not yet — there is no
      // session to fetch and nothing to cancel there, so it says so immediately rather than
      // spending a request to find out.
      if (!profile.payout?.canResume) {
        setView({ name: "resume", state: "settingUp" });
        return;
      }
      // Otherwise fetch the session *now*, not on Continue. It carries the cancellation eligibility
      // (API 2026-09-21), and Cancel has to be offered beside Continue rather than discovered after
      // the youth has already been handed to the provider.
      setView({ name: "resume", state: "loading" });
      void loadResumeSession();
      return;
    }

    setView({
      name: "gate",
      reason: eligibility.reason,
      missingFields:
        eligibility.reason === "profileIncomplete"
          ? eligibility.missingFields
          : undefined,
    });
  }, [eligibility, profile.payout?.canResume, loadResumeSession]);

  /**
   * Continue into the hosted journey. **Reuses the session already fetched for this panel** rather
   * than asking for another — it was issued moments ago for this payout, and a second request buys
   * nothing. A session past its `expiresAt` is refetched; `POST` is never used to refresh, because
   * that starts a second payout.
   */
  const continueCashOut = useCallback(async () => {
    const current = view.name === "resume" ? view.session : undefined;
    const stillValid =
      current &&
      isSafePaymentUrl(current.paymentUrl) &&
      new Date(current.expiresAt).getTime() > Date.now();

    if (stillValid) {
      setView({ name: "hosted", paymentUrl: current.paymentUrl });
      return;
    }

    setBusy(true);
    try {
      await loadResumeSession();
      // Deliberately *not* chained into the hosted view: the refetch may have landed on
      // "still setting up" or a failure, and forcing the youth onward from here would override the
      // state the panel just worked out. They press Continue again on a panel that now has a
      // session — one extra tap, and never a hand-off built on a stale assumption.
    } finally {
      setBusy(false);
    }
  }, [view, loadResumeSession]);

  /**
   * Re-read cancellation eligibility when the session's answer was `null` — unknown, not "no".
   *
   * Uses `GET /user/payout/latest` rather than another session: the session on screen is still
   * valid and refreshing it would cost a provider round-trip to learn one boolean.
   *
   * ⚠️ **The id match is the safety check, not a formality.** `latest` answers about whatever
   * payout is current, which on a stale screen is a *different* one. Applying its `canCancel` to
   * the session in front of the youth would arm a Cancel button for a payout they are not looking
   * at — so a mismatch discards this session and starts again rather than reconciling the two.
   */
  const checkCancelEligibility = useCallback(async () => {
    const session = view.name === "resume" ? view.session : undefined;
    if (!session?.payoutId) return;

    setBusy(true);
    try {
      const latest = await getLatestPayout();

      if (latest && latest.id !== session.payoutId) {
        await loadResumeSession();
        return;
      }

      setView((current) =>
        current.name === "resume" && current.session
          ? {
              ...current,
              session: {
                ...current.session,
                canCancel: latest?.canCancel ?? undefined,
              },
            }
          : current,
      );
    } catch {
      // Still unknown, and the panel already says so. Nothing has changed and nothing is claimed.
    } finally {
      setBusy(false);
    }
  }, [view, loadResumeSession]);

  /**
   * Cancel the payout **on screen**, by the id the session gave us.
   *
   * ⚠️ Never re-resolve "the active payout" here. If this dialog has gone stale, that resolves to a
   * different payout, and the endpoint would cancel it — releasing Zlto the youth never asked to
   * release. The id travels with the confirmation view for exactly that reason.
   *
   * Nothing is released optimistically: the API answers only after the provider has agreed *and*
   * the reservation has been released, so success is the single thing that licenses the success
   * screen. A refusal means the provider took a submission in the meantime — the payout is intact
   * and on its way, which is a fact worth stating plainly rather than an error to apologise for.
   */
  const confirmCancel = useCallback(
    async (payoutId: string) => {
      setView({ name: "cancelling", payoutId });

      try {
        await cancelPayout(payoutId);

        // Both the wallet and the payout state have moved: the reservation is released and the
        // payout is terminal. Refresh before showing the result so the ledger behind the dialog
        // agrees with it.
        await refreshProfile();
        void queryClient.invalidateQueries({ queryKey: ["Payout"] });
        setView({ name: "cancelled" });
      } catch (error) {
        const failure = mapPayoutFailure(error);

        // 404 — the id is unknown to the server, which on this path means the payout moved on.
        // Ask what it actually is rather than guessing from a failed cancellation.
        if (failure.kind === "noActivePayout") {
          await showOutcome();
          return;
        }

        // Anything else: the payout is untouched. Back to the panel with the session refetched, so
        // what it offers reflects the state that just refused us.
        const refused = failure.kind !== "failed";
        await loadResumeSession();
        setView((current) =>
          current.name === "resume"
            ? {
                ...current,
                notice: refused
                  ? CANCEL_COPY.refusedBody
                  : CANCEL_COPY.failedBody,
              }
            : current,
        );
      }
    },
    [refreshProfile, queryClient, showOutcome, loadResumeSession],
  );

  /**
   * `POST /user/payout/zlto?amount=` — the point at which Zlto is reserved. **Called once per
   * payout**: a session is refreshed with `GET`, never by posting again.
   *
   * Imperative rather than a react-query mutation on purpose: the result drives a state machine,
   * not a cache.
   */
  const initiate = useCallback(
    async (value: number) => {
      setBusy(true);
      setServerAmountError(undefined);

      try {
        const session = await initiateZltoPayout(value);

        // The server enforces HTTPS; this is the second check (PR #1924 reports URL-redirect
        // findings on web), and it also keeps a non-https URL out of an iframe `src`. A URL we will
        // not load is not the "we couldn't start your cash out" screen either: the payout exists
        // and the Zlto is reserved, so the youth goes to the payout in flight, where Try again
        // fetches a fresh session.
        if (!isSafePaymentUrl(session.paymentUrl)) {
          void refreshProfile();
          setView({ name: "resume", notice: RESUME_COPY.linkFailed });
          return;
        }

        setView({ name: "hosted", paymentUrl: session.paymentUrl });
        void refreshProfile();
      } catch (error) {
        const failure = mapPayoutFailure(error);

        switch (failure.kind) {
          // The wallet refused an amount this client considered valid, which means the balance on
          // screen was stale: back to the field, and refresh the ledger so it stops disagreeing.
          case "amountRejected":
            setServerAmountError(AMOUNT_SERVER_REJECTED);
            setAmountTouched(true);
            setView({ name: "amount" });
            void refreshProfile();
            break;

          // The client guards both of these, so arriving here means the guard and the server
          // disagree — show the server's objection on the field rather than a generic failure.
          case "amountInvalid":
            setServerAmountError(AMOUNT_PROBLEM_COPY[failure.problem]);
            setAmountTouched(true);
            setView({ name: "amount" });
            break;

          // The country floor refused an amount the client had cleared, so the limit or the rate
          // moved underneath us. Refresh the profile — that is what carries the minimum, so the
          // hint under the field corrects itself — and put them back on the field with the amount
          // they typed still in it.
          case "belowMinimum":
            setServerAmountError(MINIMUM_COPY.serverRejected);
            setAmountTouched(true);
            setView({ name: "amount" });
            void refreshProfile();
            break;

          // Treasury capacity, not the youth's amount. Re-ask the preview so the panel below the
          // field agrees with what just happened.
          case "paused":
            setServerPaused(true);
            setView({ name: "amount" });
            void queryClient.invalidateQueries({
              queryKey: ["Payout", "Conversion"],
            });
            break;

          // Something the gate checks changed since the profile was fetched — most often the
          // initiation race, where another tab started a payout first.
          case "gate":
            void refreshProfile();
            if (failure.reason === "activePayout") {
              setView({ name: "resume", notice: GATE_COPY.activePayout.body });
            } else {
              setView({ name: "gate", reason: failure.reason });
            }
            break;

          /**
           * ⚠️ **"Nothing has been taken from your wallet" has to be checked, not assumed.**
           * Every 400 the service throws happens before the payout record exists, so nothing is
           * reserved — but `PayoutRewards` can also fail *after* reserving (the reservation
           * succeeds and recording or initiation does not, leaving the payout
           * `ReconciliationRequired` and the Zlto held) and that reaches here as an unmapped 500.
           * The profile is the only thing that knows which happened, so ask it: an active payout
           * means the youth has one in flight, whatever the request said.
           */
          default: {
            const refreshed = await refreshProfile();
            if (refreshed?.payout?.active) {
              setView({ name: "resume", notice: RESUME_COPY.linkFailed });
            } else {
              setView({ name: "failed" });
            }
            break;
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [queryClient, refreshProfile],
  );

  /**
   * Closing the hosted journey is the youth's own action — there is no automatic close. It would
   * need an origin-validated `postMessage` contract with the provider, which does not exist yet;
   * and the frame is cross-origin, so its DOM and its URL are neither readable nor evidence. The
   * modal simply stops showing the journey and Yoma asks the API what actually happened.
   */
  const closeHosted = useCallback(() => void showOutcome(), [showOutcome]);

  /**
   * The ✕ and the overlay. Everywhere except the hosted journey it simply closes; there, dismissing
   * means "I'm finished looking at this", which is the moment to find out what the payout actually
   * did — so it goes to the outcome rather than vanishing over reserved Zlto.
   */
  const dismiss = useCallback(() => {
    if (view.name === "hosted") {
      closeHosted();
      return;
    }
    close();
  }, [view.name, closeHosted, close]);

  const step = STEP_BY_VIEW[view.name];
  const title = (() => {
    switch (view.name) {
      case "amount":
        return AMOUNT_COPY.dialogTitle;
      case "review":
        return REVIEW_COPY.dialogTitle;
      case "resume":
        return RESUME_COPY.dialogTitle;
      case "cancelConfirm":
      case "cancelling":
      case "cancelled":
        return CANCEL_COPY.dialogTitle;
      case "hosted":
        return HOSTED_COPY.dialogTitle;
      case "checking":
      case "outcome":
        return OUTCOME_COPY.dialogTitle;
      default:
        return CASH_OUT_ACTION;
    }
  })();

  /**
   * The release kill-switch (`payout.enabled`, API 2026-09-16). With new cash outs off in this
   * environment the entry point **renders nothing at all** — hidden, not disabled: a disabled
   * button is for a reason the ledger already shows (an unknown balance, a known zero), and this
   * one is invisible there. Advertising an action that has never been announced in this
   * environment, and that could stay off for weeks, only generates the question it cannot answer.
   *
   * ⚠️ **A payout already in flight keeps its way back.** The switch governs initiation only — the
   * API leaves resume, webhooks and reconciliation alone — so a youth with Zlto reserved still gets
   * the button, reading "Continue cash out", and `openFlow` still routes them to the resume panel.
   * Hiding the whole thing here would strand them.
   *
   * This is not the enforcement. The API refuses initiation independently, and
   * `mapPayoutFailure` maps its "Cash-out is not available" onto the gate for the race where the
   * switch is flipped between the profile load and the request.
   *
   * ⚠️ `isOpen` guards a real disappearing act, not a hypothetical one. The last thing a youth
   * with an active payout does is reach the result screen — and `showOutcome` refreshes the
   * profile, so at that exact moment `active` goes false and this reason becomes the live one.
   * Without the guard the dialog would unmount from under them as the outcome arrived. Nothing is
   * hidden mid-flow; the entry point goes once the flow is closed.
   */
  const payoutDisabled =
    !eligibility.allowed && eligibility.reason === "payoutDisabled";
  if (payoutDisabled && !isOpen) return null;

  return (
    <>
      <CashOutButton
        variant={variant}
        label={
          profile.payout?.active ? CASH_OUT_ACTION_CONTINUE : CASH_OUT_ACTION
        }
        disabledHelper={
          eligibility.allowed
            ? undefined
            : CASH_OUT_DISABLED_HELPER[eligibility.reason]
        }
        onClick={openFlow}
      />

      <CashOutDialog
        isOpen={isOpen}
        title={title}
        step={step}
        /* A tick claims the cash out resolved, so only a recorded terminal status earns one —
           "in progress", "still setting up" and "we couldn't check" leave step 3 live. */
        stepResolved={
          view.name === "outcome" && describeOutcome(view.payout).resolved
        }
        hosted={view.name === "hosted"}
        closeLabel={view.name === "hosted" ? HOSTED_COPY.closeLabel : undefined}
        onClose={dismiss}
      >
        <>
          {view.name === "gate" && (
            <CashOutGate
              reason={view.reason}
              missingFields={view.missingFields}
              onClose={close}
            />
          )}

          {view.name === "amount" && (
            <CashOutAmountStep
              available={available}
              value={amountText}
              onChange={(next) => {
                setAmountText(next);
                setAmountTouched(true);
                setServerAmountError(undefined);
                setServerPaused(false);
              }}
              onMax={() => {
                setAmountText(String(available));
                setAmountTouched(true);
                setServerAmountError(undefined);
                setServerPaused(false);
              }}
              problem={amount.ok ? undefined : amount.problem}
              showProblem={amountTouched}
              serverError={serverAmountError}
              minimumUsd={minimum.amount}
              belowMinimum={belowMinimum}
              preview={preview}
              canContinue={canContinue}
              onContinue={() => {
                if (!amount.ok || preview.state !== "ready") return;
                setView({
                  name: "review",
                  amount: amount.value,
                  usd: preview.usd,
                  rate: preview.rate,
                });
              }}
              onCancel={close}
            />
          )}

          {view.name === "review" && (
            <CashOutReviewStep
              amount={view.amount}
              estimateUsd={view.usd}
              rate={view.rate}
              busy={busy}
              onConfirm={() => void initiate(view.amount)}
              onBack={() => setView({ name: "amount" })}
            />
          )}

          {view.name === "resume" && (
            <CashOutResumePanel
              // The Zlto reserved for the payout, and its value in USD — two different figures
              // from two different places on the profile. See `CashOutResumePanel`.
              zltoAmount={profile.zlto?.pendingPayout ?? null}
              estimateUsd={profile.payout?.amount ?? null}
              started={formatPayoutStarted(profile.payout?.dateCreated)}
              busy={busy}
              state={view.state}
              notice={view.notice}
              // Straight from the session this panel is holding — never from the profile, which
              // cannot know it, and never inferred from `canResume`, which answers a different
              // question. Without a `payoutId` there is nothing safe to cancel, so nothing is
              // offered however eligible the provider says the payout is.
              canCancel={
                view.session?.payoutId ? view.session.canCancel : false
              }
              onCancel={
                view.session?.payoutId
                  ? () =>
                      setView({
                        name: "cancelConfirm",
                        payoutId: view.session!.payoutId!,
                      })
                  : undefined
              }
              onCheckCancel={() => void checkCancelEligibility()}
              onContinue={() => void continueCashOut()}
              onClose={close}
            />
          )}

          {/* The confirmation, carrying the id it will act on. A full screen rather than a nested
              dialog: this is a money decision, and the consequence — where the Zlto goes — deserves
              the same room the other outcomes get. */}
          {view.name === "cancelConfirm" && (
            <CashOutMessageStep
              icon={<IoAlertCircleOutline className="h-6 w-6" />}
              tone="warning"
              title={CANCEL_COPY.confirmTitle}
              body={CANCEL_COPY.confirmBody}
              primary={{
                label: CANCEL_COPY.confirmAction,
                onClick: () => void confirmCancel(view.payoutId),
              }}
              // Leaving is the safe default here, so it gets the quieter treatment but stays
              // present and full width — the youth may well have arrived by mistake.
              secondary={{
                label: CANCEL_COPY.keepAction,
                onClick: () => void loadResumeSession(),
              }}
            />
          )}

          {view.name === "cancelling" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <span
                className="loading loading-spinner loading-md text-purple"
                aria-hidden="true"
              />
              <p className="text-gray-dark text-sm" role="status">
                {CANCEL_COPY.confirmBusyAction}
              </p>
            </div>
          )}

          {view.name === "cancelled" && (
            <CashOutMessageStep
              icon={<IoCheckmarkCircleOutline className="h-6 w-6" />}
              tone="success"
              title={CANCEL_COPY.successTitle}
              body={CANCEL_COPY.successBody}
              primary={{ label: OUTCOME_COPY.doneAction, onClick: close }}
            />
          )}

          {view.name === "hosted" && (
            <CashOutHostedStep
              paymentUrl={view.paymentUrl}
              onOpenInNewWindow={() => openPaymentUrl(view.paymentUrl)}
              onDone={closeHosted}
            />
          )}

          {/* Reading the outcome. Brief, but it must not flash an answer before it has one. */}
          {view.name === "checking" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <span
                className="loading loading-spinner loading-md text-purple"
                aria-hidden="true"
              />
              <p className="text-gray-dark text-sm" role="status">
                {OUTCOME_COPY.checkingBody}
              </p>
            </div>
          )}

          {view.name === "outcome" && (
            <CashOutOutcomeStep
              payout={view.payout}
              onResume={() => void continueCashOut()}
              onStartAgain={openFlow}
              canStartNew={!payoutDisabled}
              onCheckAgain={() => void showOutcome()}
              onClose={close}
            />
          )}

          {view.name === "failed" && (
            <CashOutMessageStep
              icon={<IoAlertCircleOutline className="h-6 w-6" />}
              tone="warning"
              title={FAILURE_COPY.createFailedTitle}
              body={FAILURE_COPY.createFailedBody}
              primary={{
                label: FAILURE_COPY.retryAction,
                onClick: () => setView({ name: "amount" }),
              }}
              secondary={{ label: FAILURE_COPY.closeAction, onClick: close }}
            />
          )}
        </>
      </CashOutDialog>
    </>
  );
};
