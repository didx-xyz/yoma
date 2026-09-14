import type { GetStaticProps } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { IoAlertCircleOutline } from "react-icons/io5";
import type { PayoutTransactionInfo } from "~/api/models/payout";
import { PayoutTransactionStatus } from "~/api/models/payout";
import { CashOutAmountStep } from "~/components/Payout/CashOutAmountStep";
import { CashOutButton } from "~/components/Payout/CashOutButton";
import { CashOutDialog } from "~/components/Payout/CashOutDialog";
import { CashOutGate } from "~/components/Payout/CashOutGate";
import { CashOutHostedStep } from "~/components/Payout/CashOutHostedStep";
import { CashOutMessageStep } from "~/components/Payout/CashOutMessageStep";
import { CashOutOutcomeStep } from "~/components/Payout/CashOutOutcomeStep";
import { CashOutResumePanel } from "~/components/Payout/CashOutResumePanel";
import { CashOutReviewStep } from "~/components/Payout/CashOutReviewStep";
import type { CashOutStep } from "~/components/Payout/CashOutStepper";
import { ZltoLedger } from "~/components/Rewards/ZltoLedger";
import type { UserProfileZlto } from "~/api/models/user";
import { WalletCreationStatus } from "~/api/models/user";
import type { CashOutBlockReason } from "~/lib/payout/eligibility";
import {
  AMOUNT_COPY,
  FAILURE_COPY,
  OUTCOME_COPY,
  RESUME_COPY,
  REVIEW_COPY,
} from "~/lib/payout/copy";
import { formatPayoutStarted } from "~/lib/payout/outcome";

/**
 * ⚠️⚠️ **TEMPORARY DEV AID — DELETE THIS FILE (and `dev/cash-out-provider.tsx`) BEFORE MERGING.**
 * Listed with the `?mock=` removal in the epic's T6 hardening item. ⚠️⚠️
 *
 * Every Cash Out screen, in the real dialog, one click apart — so copy and layout can be worked on
 * without a funded wallet, a provider account, or the hosted journey being reachable at all.
 *
 * Deliberately built as a **standalone page that imports the real components**, rather than the
 * `?mock=` approach taken for Treasury. That one is woven into a production page and is now a
 * blocker to unpick; this one touches no production code, so removing it is deleting two files.
 *
 * It renders through `CashOutDialog`, the same chrome the flow uses, so what you see here is what
 * ships. The strings all live in `lib/payout/copy.ts` — edit there and this reloads.
 *
 * Not reachable in production: `getStaticProps` answers 404 in a production build.
 */

// ⚠️ TEMPORARY — part of the dev aid.
export const getStaticProps: GetStaticProps = async () => {
  if (process.env.NODE_ENV === "production") return { notFound: true };
  return { props: {} };
};

const zlto = (over: Partial<UserProfileZlto> = {}): UserProfileZlto => ({
  walletCreationStatus: WalletCreationStatus.Created,
  balance: 2000,
  pendingPayout: 0,
  available: 2000,
  pendingRewards: 0,
  total: 2000,
  zltoOffline: false,
  ...over,
});

const payout = (
  status: PayoutTransactionStatus,
  canResume = false,
): PayoutTransactionInfo => ({
  status,
  amount: 2.22,
  currency: "USD",
  dateCreated: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  canResume,
});

const started = formatPayoutStarted(
  new Date(Date.now() - 42 * 60 * 1000).toISOString(),
);

const noop = () => undefined;

type Scene = {
  group: string;
  name: string;
  title: string;
  step?: CashOutStep;
  stepResolved?: boolean;
  hosted?: boolean;
  render: (ctx: { frameUrl: string }) => React.ReactNode;
};

const GATE_REASONS: CashOutBlockReason[] = [
  "activePayout",
  "profileIncomplete",
  "providerOffline",
  "countryUnsupported",
  "walletNotReady",
  "balanceUnknown",
  "nothingAvailable",
];

const OUTCOMES: { name: string; payout: PayoutTransactionInfo | null }[] = [
  { name: "completed", payout: payout(PayoutTransactionStatus.Completed) },
  { name: "cancelled", payout: payout(PayoutTransactionStatus.Cancelled) },
  { name: "expired", payout: payout(PayoutTransactionStatus.Expired) },
  { name: "failed", payout: payout(PayoutTransactionStatus.Failed) },
  {
    name: "in progress",
    payout: payout(PayoutTransactionStatus.Processing, true),
  },
  {
    name: "still setting up",
    payout: payout(PayoutTransactionStatus.Initiated, false),
  },
  { name: "unreadable", payout: null },
];

const SCENES: Scene[] = [
  ...GATE_REASONS.map<Scene>((reason) => ({
    group: "Gate",
    name: reason,
    title: AMOUNT_COPY.dialogTitle,
    render: () => (
      <CashOutGate
        reason={reason}
        missingFields={
          reason === "profileIncomplete"
            ? ["gender", "date of birth"]
            : undefined
        }
        onClose={noop}
      />
    ),
  })),

  {
    group: "Amount",
    name: "empty",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value=""
        onChange={noop}
        onMax={noop}
        problem="empty"
        showProblem={false}
        preview={{ state: "idle" }}
        canContinue={false}
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },
  {
    group: "Amount",
    name: "valid",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value="100"
        onChange={noop}
        onMax={noop}
        showProblem={false}
        preview={{ state: "ready", usd: 2.22, rate: 45, paused: false }}
        canContinue
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },
  {
    group: "Amount",
    name: "above available",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value="2500"
        onChange={noop}
        onMax={noop}
        problem="aboveAvailable"
        showProblem
        preview={{ state: "idle" }}
        canContinue={false}
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },
  {
    group: "Amount",
    name: "fractional",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value="100.5"
        onChange={noop}
        onMax={noop}
        problem="notWhole"
        showProblem
        preview={{ state: "idle" }}
        canContinue={false}
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },
  {
    group: "Amount",
    name: "preview loading",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value="100"
        onChange={noop}
        onMax={noop}
        showProblem={false}
        preview={{ state: "loading" }}
        canContinue={false}
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },
  {
    group: "Amount",
    name: "paused (treasury)",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value="100"
        onChange={noop}
        onMax={noop}
        showProblem={false}
        preview={{ state: "ready", usd: 2.22, rate: 45, paused: true }}
        canContinue={false}
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },
  {
    group: "Amount",
    name: "preview failed",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value="100"
        onChange={noop}
        onMax={noop}
        showProblem={false}
        preview={{ state: "failed" }}
        canContinue={false}
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },
  {
    group: "Amount",
    name: "server rejected",
    title: AMOUNT_COPY.dialogTitle,
    step: 1,
    render: () => (
      <CashOutAmountStep
        available={2000}
        value="100"
        onChange={noop}
        onMax={noop}
        showProblem
        serverError="That's more than you have available to cash out right now."
        preview={{ state: "ready", usd: 2.22, rate: 45, paused: false }}
        canContinue={false}
        onContinue={noop}
        onCancel={noop}
      />
    ),
  },

  {
    group: "Review",
    name: "ready",
    title: REVIEW_COPY.dialogTitle,
    step: 2,
    render: () => (
      <CashOutReviewStep
        amount={100}
        estimateUsd={2.22}
        rate={45}
        busy={false}
        onConfirm={noop}
        onBack={noop}
      />
    ),
  },
  {
    group: "Review",
    name: "submitting",
    title: REVIEW_COPY.dialogTitle,
    step: 2,
    render: () => (
      <CashOutReviewStep
        amount={100}
        estimateUsd={2.22}
        rate={45}
        busy
        onConfirm={noop}
        onBack={noop}
      />
    ),
  },

  {
    group: "Hosted",
    name: "journey",
    title: "Finish your cash out",
    step: 3,
    hosted: true,
    render: ({ frameUrl }) => (
      <CashOutHostedStep
        paymentUrl={frameUrl}
        onOpenInNewWindow={noop}
        onDone={noop}
      />
    ),
  },

  {
    group: "Result",
    name: "checking",
    title: OUTCOME_COPY.dialogTitle,
    step: 3,
    render: () => (
      <div className="flex flex-col items-center gap-3 py-8">
        <span
          className="loading loading-spinner loading-md text-purple"
          aria-hidden="true"
        />
        <p className="text-gray-dark text-sm">{OUTCOME_COPY.checkingBody}</p>
      </div>
    ),
  },
  ...OUTCOMES.map<Scene>((outcome) => ({
    group: "Result",
    name: outcome.name,
    title: OUTCOME_COPY.dialogTitle,
    step: 3,
    stepResolved: true,
    render: () => (
      <CashOutOutcomeStep
        payout={outcome.payout}
        onResume={noop}
        onStartAgain={noop}
        onClose={noop}
      />
    ),
  })),
  {
    group: "Result",
    name: "initiation failed",
    title: AMOUNT_COPY.dialogTitle,
    render: () => (
      <CashOutMessageStep
        icon={<IoAlertCircleOutline className="h-6 w-6" />}
        tone="warning"
        title={FAILURE_COPY.createFailedTitle}
        body={FAILURE_COPY.createFailedBody}
        primary={{ label: FAILURE_COPY.retryAction, onClick: noop }}
        secondary={{ label: FAILURE_COPY.closeAction, onClick: noop }}
      />
    ),
  },

  {
    group: "Resume",
    name: "resumable",
    title: RESUME_COPY.dialogTitle,
    render: () => (
      <CashOutResumePanel
        zltoAmount={100}
        estimateUsd={2.22}
        started={started}
        busy={false}
        onContinue={noop}
        onClose={noop}
      />
    ),
  },
  {
    group: "Resume",
    name: "fetching session",
    title: RESUME_COPY.dialogTitle,
    render: () => (
      <CashOutResumePanel
        zltoAmount={100}
        estimateUsd={2.22}
        started={started}
        busy
        onContinue={noop}
        onClose={noop}
      />
    ),
  },
  {
    group: "Resume",
    name: "link failed",
    title: RESUME_COPY.dialogTitle,
    render: () => (
      <CashOutResumePanel
        zltoAmount={100}
        estimateUsd={2.22}
        started={started}
        busy={false}
        notice={RESUME_COPY.linkFailed}
        onContinue={noop}
        onClose={noop}
      />
    ),
  },
  {
    group: "Resume",
    name: "not placed yet",
    title: RESUME_COPY.dialogTitle,
    render: () => (
      <CashOutResumePanel
        zltoAmount={100}
        estimateUsd={2.22}
        started={started}
        busy={false}
        notice={RESUME_COPY.notResumable}
        invitation={false}
        onContinue={noop}
        onClose={noop}
      />
    ),
  },
];

/** What to put in the frame. The provider's own page is not reachable without a real payout. */
const FRAME_SOURCES = [
  { name: "stand-in journey", url: "/dev/cash-out-provider" },
  // Refuses framing, so the blank-box state a returning youth hits on Dev can be seen and designed
  // around without waiting on IXO's allowlist.
  { name: "refuses framing", url: "https://www.google.com/" },
  { name: "blank", url: "about:blank" },
];

/** `Gate · activePayout` → `gate-activepayout`, so a state can be linked to and bookmarked. */
const sceneSlug = (scene: Scene) =>
  `${scene.group}-${scene.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function CashOutStates() {
  const [sceneIndex, setSceneIndex] = useState(1);
  const [frameUrl, setFrameUrl] = useState(FRAME_SOURCES[0]!.url);
  const scene = SCENES[sceneIndex]!;

  // Read after mount, not during render: branching on `window` while rendering is a hydration
  // mismatch. `replaceState` rather than the router so switching states does not stack history.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("scene");
    const found = SCENES.findIndex((item) => sceneSlug(item) === wanted);
    if (found >= 0) setSceneIndex(found);
  }, []);

  const selectScene = (index: number) => {
    setSceneIndex(index);
    const url = new URL(window.location.href);
    url.searchParams.set("scene", sceneSlug(SCENES[index]!));
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <Head>
        <title>Dev · Cash Out states</title>
      </Head>

      <div className="flex min-h-screen flex-col gap-4 bg-white p-4 text-black md:flex-row">
        {/* Floated above the dialog: `CustomModal` renders a full-screen overlay that swallows
            clicks, so an in-flow picker would be visible and unusable. `z-50` is the modal's, so
            this sits one above it. */}
        <aside className="border-gray fixed top-16 bottom-0 left-0 z-60 flex w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r bg-white p-3 shadow-lg">
          <div>
            <h5>Cash Out states</h5>
            <p className="text-gray-dark text-xs">
              Dev only. Copy lives in{" "}
              <code className="text-[11px]">lib/payout/copy.ts</code>.
            </p>
          </div>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">Frame source</span>
            <select
              className="select select-sm border-gray rounded-lg"
              value={frameUrl}
              onChange={(event) => setFrameUrl(event.target.value)}
            >
              {FRAME_SOURCES.map((source) => (
                <option key={source.url} value={source.url}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>

          <nav className="flex flex-col gap-1">
            {SCENES.map((item, index) => (
              <button
                key={`${item.group}-${item.name}`}
                type="button"
                onClick={() => selectScene(index)}
                className={`rounded px-2 py-1 text-left text-xs ${
                  index === sceneIndex
                    ? "bg-purple text-white"
                    : "hover:bg-gray-light"
                }`}
              >
                <span className="opacity-60">{item.group}</span> · {item.name}
              </button>
            ))}
          </nav>

          {/* The entry points, which are not dialog states but are where the flow starts. */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-gray-dark text-xs font-semibold">
              Entry point
            </span>
            <div className="bg-blue flex flex-col items-center gap-2 rounded-lg p-3">
              <ZltoLedger zlto={zlto()} variant="compact" />
              <CashOutButton
                variant="compact"
                label="Cash Out"
                onClick={noop}
              />
            </div>
            <div className="border-gray flex flex-col gap-2 rounded-lg border p-3">
              <ZltoLedger
                zlto={zlto({ pendingPayout: 100, balance: 2100 })}
                variant="expanded"
                actions={
                  <CashOutButton
                    variant="expanded"
                    label="Continue cash out"
                    onClick={noop}
                  />
                }
              />
            </div>
          </div>
        </aside>

        <main className="grow md:pl-64">
          <CashOutDialog
            isOpen
            title={scene.title}
            step={scene.step}
            stepResolved={scene.stepResolved}
            hosted={scene.hosted}
            onClose={noop}
          >
            {scene.render({ frameUrl })}
          </CashOutDialog>
        </main>
      </div>
    </>
  );
}
