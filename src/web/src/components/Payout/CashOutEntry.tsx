import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoIosTimer, IoMdClose } from "react-icons/io";
import { IoAlertCircleOutline, IoOpenOutline } from "react-icons/io5";
import type { UserProfile } from "~/api/models/user";
import {
  getZltoPayoutSession,
  initiateZltoPayout,
} from "~/api/services/payout";
import { convertZltoToUsd } from "~/api/services/treasury";
import { getUserProfile } from "~/api/services/user";
import { BTN_DIALOG_CLOSE } from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import { inferConversionRateZltoPerUsd } from "~/lib/payout/conversion";
import {
  AMOUNT_COPY,
  AMOUNT_SERVER_REJECTED,
  CASH_OUT_ACTION,
  CASH_OUT_ACTION_CONTINUE,
  CASH_OUT_DISABLED_HELPER,
  FAILURE_COPY,
  GATE_COPY,
  HANDOFF_COPY,
  RESULT_COPY,
  RESUME_COPY,
  REVIEW_COPY,
} from "~/lib/payout/copy";
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
import { CashOutMessageStep } from "./CashOutMessageStep";
import { CashOutResumePanel } from "./CashOutResumePanel";
import { CashOutReviewStep } from "./CashOutReviewStep";
import { CashOutStepper, type CashOutStep } from "./CashOutStepper";

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
 * ⚠️ The hosted URL is **never persisted** — not in storage, not in a route. It lives in this
 * component's state for as long as the dialog is open, because the popup fallback needs something
 * to open, and it dies with the dialog. An active payout gets a fresh session on tap instead.
 */

type FlowView =
  | { name: "closed" }
  | { name: "gate"; reason: CashOutBlockReason; missingFields?: string[] }
  | { name: "amount" }
  | { name: "review"; amount: number; usd: number; rate: number | null }
  /** the hand-off: a session exists and the new tab has been asked for */
  | { name: "ready"; paymentUrl: string }
  /** the payout in flight, and the way back into it */
  | { name: "resume"; notice?: string; canContinue: boolean }
  /** step 3, reached by coming back to this tab — Yoma knows a payout is in flight, no more */
  | { name: "result" }
  | { name: "failed" };

/** How long after the last keystroke to price the amount. */
const PREVIEW_DEBOUNCE_MS = 400;

const STEP_BY_VIEW: Partial<Record<FlowView["name"], CashOutStep>> = {
  amount: 1,
  review: 2,
  ready: 3,
  result: 3,
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
      rate: inferConversionRateZltoPerUsd(
        amountValue,
        previewQuery.data.amount,
      ),
      paused: serverPaused || !previewQuery.data.treasuryFundsAvailable,
    };
  })();

  const canContinue =
    amount.ok && preview.state === "ready" && !preview.paused && !busy;

  const close = useCallback(() => {
    setView({ name: "closed" });
    setAmountText("");
    setAmountTouched(false);
    setServerAmountError(undefined);
    setServerPaused(false);
  }, []);

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
      setView({ name: "resume", canContinue: true });
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
  }, [eligibility]);

  /** Fetch a *fresh* hosted session for the active payout and hand over. Never a stored URL. */
  const continueCashOut = useCallback(async () => {
    setBusy(true);
    setView({ name: "resume", canContinue: true });

    try {
      const session = await getZltoPayoutSession();

      // 404: the profile said a payout was active and the API says otherwise, so it closed while
      // this page was open. Nothing is wrong — but there is nothing to continue either.
      if (!session) {
        setView({
          name: "resume",
          notice: RESUME_COPY.noLongerActive,
          canContinue: false,
        });
        void refreshProfile();
        return;
      }

      if (!isSafePaymentUrl(session.paymentUrl)) {
        setView({
          name: "resume",
          notice: RESUME_COPY.linkFailed,
          canContinue: true,
        });
        return;
      }

      openPaymentUrl(session.paymentUrl);
      setView({ name: "ready", paymentUrl: session.paymentUrl });
    } catch (error) {
      const failure = mapPayoutFailure(error);
      if (failure.kind === "noActivePayout") {
        setView({
          name: "resume",
          notice: RESUME_COPY.noLongerActive,
          canContinue: false,
        });
        void refreshProfile();
      } else if (failure.kind === "sessionNotReady") {
        setView({
          name: "resume",
          notice: RESUME_COPY.notResumable,
          canContinue: false,
        });
      } else {
        setView({
          name: "resume",
          notice: RESUME_COPY.linkFailed,
          canContinue: true,
        });
      }
    } finally {
      setBusy(false);
    }
  }, [refreshProfile]);

  /**
   * `POST /user/payout/zlto?amount=` — the point at which Zlto is reserved.
   *
   * Imperative rather than a react-query mutation on purpose: `window.open` has to run as close to
   * the youth's tap as the round trip allows, and the outcome drives a state machine rather than a
   * cache.
   */
  const initiate = useCallback(
    async (value: number) => {
      setBusy(true);
      setServerAmountError(undefined);

      try {
        const session = await initiateZltoPayout(value);

        // The server enforces HTTPS; this is the second check (PR #1924 reports URL-redirect
        // findings on web). A URL we will not navigate to is not the "we couldn't start your cash
        // out" screen either: the payout exists and the Zlto is reserved, so the youth goes to the
        // payout in flight, where Try again fetches a fresh session.
        if (!isSafePaymentUrl(session.paymentUrl)) {
          void refreshProfile();
          setView({
            name: "resume",
            notice: RESUME_COPY.linkFailed,
            canContinue: true,
          });
          return;
        }

        openPaymentUrl(session.paymentUrl);
        setView({ name: "ready", paymentUrl: session.paymentUrl });
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
              setView({
                name: "resume",
                notice: GATE_COPY.activePayout.body,
                canContinue: true,
              });
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
              setView({
                name: "resume",
                notice: RESUME_COPY.linkFailed,
                canContinue: true,
              });
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
   * The return view's trigger. There is no provider redirect back into Yoma — nothing in the payout
   * request carries a return URL — so "coming back" is this tab regaining visibility after losing
   * it. Requiring it to have been hidden first is what keeps a *blocked* popup (which never takes
   * focus away) on the hand-off screen, where the button that opens the journey still is.
   */
  const wasHidden = useRef(false);
  useEffect(() => {
    if (view.name !== "ready") {
      wasHidden.current = false;
      return;
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        wasHidden.current = true;
        return;
      }
      if (!wasHidden.current) return;
      void refreshProfile();
      setView({ name: "result" });
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [view.name, refreshProfile]);

  const step = STEP_BY_VIEW[view.name];
  const title = (() => {
    switch (view.name) {
      case "amount":
        return AMOUNT_COPY.dialogTitle;
      case "review":
        return REVIEW_COPY.dialogTitle;
      case "resume":
        return RESUME_COPY.dialogTitle;
      default:
        return CASH_OUT_ACTION;
    }
  })();

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

      <CustomModal
        isOpen={isOpen}
        shouldCloseOnOverlayClick={false}
        onRequestClose={close}
        // `md:h-fit` matters: `CustomModal`'s box is `fixed inset-0`, so without it the dialog is
        // as tall as its max-height whatever the content, and the amount step sat above 250px of
        // empty white (the dead-space note from the design review). Mobile keeps the product's
        // full-screen modal rather than the board's bottom sheet — every other dialog in the app
        // behaves that way.
        className="md:h-fit md:max-h-[680px] md:w-[520px]"
      >
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 pb-8 text-black">
          <div className="flex flex-row items-start gap-2">
            {/* The title is centred over the content, with the ✕ out of the flow on the right —
                the grey circular close control the product uses everywhere. */}
            <h4 className="grow pt-1 text-center">{title}</h4>
            <button
              type="button"
              className={BTN_DIALOG_CLOSE}
              onClick={close}
              aria-label="Close"
            >
              <IoMdClose className="h-5 w-5" />
            </button>
          </div>

          {step && (
            <CashOutStepper current={step} resolved={view.name === "result"} />
          )}

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
              busy={busy}
              notice={view.notice}
              canContinue={view.canContinue}
              onContinue={() => void continueCashOut()}
              onClose={close}
            />
          )}

          {view.name === "ready" && (
            <CashOutMessageStep
              icon={<IoOpenOutline className="h-6 w-6" />}
              title={HANDOFF_COPY.readyTitle}
              body={HANDOFF_COPY.readyBody}
              primary={{
                label: HANDOFF_COPY.openAction,
                icon: <IoOpenOutline className="h-4 w-4" aria-hidden="true" />,
                onClick: () => openPaymentUrl(view.paymentUrl),
              }}
              secondary={{ label: HANDOFF_COPY.closeAction, onClick: close }}
            />
          )}

          {view.name === "result" && (
            <CashOutMessageStep
              icon={<IoIosTimer className="h-6 w-6" />}
              tone="info"
              title={RESULT_COPY.processingTitle}
              body={RESULT_COPY.processingBody}
              primary={{ label: RESULT_COPY.doneAction, onClick: close }}
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
        </div>
      </CustomModal>
    </>
  );
};
