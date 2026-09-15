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
import { describeOutcome, formatPayoutStarted } from "~/lib/payout/outcome";

/**
 * ⚠️ **DEV AID — remove before the production release.** Tracked in the epic's T6 hardening item
 * alongside the Treasury `?mock=` removal.
 *
 * **To remove it, delete two files and nothing else:**
 *
 * 1. `src/web/src/pages/dev/cash-out.tsx` (this file)
 * 2. `src/web/src/pages/dev/cash-out-provider.tsx` (the stand-in journey its iframe points at)
 *
 * There is nothing to unpick: no production module imports either of them, and they import
 * production components rather than the other way round. `grep -rn "dev/cash-out" src/web/src`
 * should return only these two files — if it ever returns more, something has grown a dependency on
 * the aid and *that* is what needs removing first. This is deliberately not the `?mock=` approach
 * taken for Treasury, which is threaded through a live page and is now a blocker to unpick.
 *
 * **Safe to leave in meanwhile.** Both files answer `notFound` from `getStaticProps` when
 * `NODE_ENV === "production"`, so a production build serves 404 for `/dev/cash-out` even if they
 * ship. That is a safety net, not a reason to keep them: they are dev scaffolding and carry no
 * tests, no a11y pass and no review.
 *
 * ---
 *
 * What it is: every Cash Out screen, in the real dialog, one click apart — so copy and layout can be
 * worked on without a funded wallet, a provider account, or the hosted journey being reachable.
 *
 * - It renders through `CashOutDialog` and the real step components, so what you see is what ships.
 *   Where the flow *derives* something, derive it here too (`describeOutcome(...).resolved`, the
 *   resume panel's `state`) — hardcoding it is how this page has twice shown a screen the flow
 *   renders correctly.
 * - Strings live in `lib/payout/copy.ts`; edit there and this reloads.
 * - `?scene=` and `?width=` are linkable, so a state at a width is one URL.
 * - The width preview renders the dialog in an iframe because Chrome will not open a window below
 *   ~500px on Windows: dragging the browser narrow (or `--window-size=320`) lays out at 500 and
 *   simply crops. An iframe gets its own layout viewport, so 320 there is genuinely 320.
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
    // Derived, not declared: the gallery must not claim a step is resolved where the flow would not.
    stepResolved: describeOutcome(outcome.payout).resolved,
    render: () => (
      <CashOutOutcomeStep
        payout={outcome.payout}
        onResume={noop}
        onStartAgain={noop}
        onCheckAgain={noop}
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
        state="settingUp"
        busy={false}
        onContinue={noop}
        onClose={noop}
      />
    ),
  },
  {
    group: "Resume",
    name: "ended",
    title: RESUME_COPY.dialogTitle,
    render: () => (
      <CashOutResumePanel
        zltoAmount={100}
        estimateUsd={2.22}
        started={started}
        state="ended"
        busy={false}
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

/** Narrow viewports worth checking. 320 is the smallest phone still in real use. */
const PREVIEW_WIDTHS = ["full", 320, 360, 390] as const;
type PreviewWidth = (typeof PREVIEW_WIDTHS)[number];

/** `Gate · activePayout` → `gate-activepayout`, so a state can be linked to and bookmarked. */
const sceneSlug = (scene: Scene) =>
  `${scene.group}-${scene.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function CashOutStates() {
  const [sceneIndex, setSceneIndex] = useState(1);
  const [frameUrl, setFrameUrl] = useState(FRAME_SOURCES[0]!.url);
  const [panelOpen, setPanelOpen] = useState(false);
  const [width, setWidth] = useState<PreviewWidth>("full");
  /** `?bare=1` renders the dialog alone, so the width preview can frame it in an iframe. */
  const [bare, setBare] = useState(false);
  /** viewport width × document width — the second being larger is horizontal overflow. */
  const [size, setSize] = useState<{ view: number; doc: number } | null>(null);
  const scene = SCENES[sceneIndex]!;

  // Read after mount, not during render: branching on `window` while rendering is a hydration
  // mismatch. `replaceState` rather than the router so switching states does not stack history.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("scene");
    const found = SCENES.findIndex((item) => sceneSlug(item) === wanted);
    if (found >= 0) setSceneIndex(found);
    // Open on a desktop, out of the way on a phone — at 320px the panel is most of the screen.
    setPanelOpen(window.innerWidth >= 768);

    const params = new URLSearchParams(window.location.search);
    setBare(params.has("bare"));
    // Linkable like the scene, so "this state, at this width" is one URL.
    const wantedWidth = Number(params.get("width"));
    if (PREVIEW_WIDTHS.includes(wantedWidth as PreviewWidth))
      setWidth(wantedWidth as PreviewWidth);
  }, []);

  /*
    A readout rather than an eyeball: at narrow widths the question "does this fit?" is answered by
    whether the document is wider than the viewport, and that is a number. Anything clipped in a
    screenshot is either this — real overflow — or the shot being narrower than the layout.
  */
  useEffect(() => {
    const measure = () =>
      setSize({
        view: window.innerWidth,
        doc: document.documentElement.scrollWidth,
      });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [sceneIndex, panelOpen]);

  const selectScene = (index: number) => {
    setSceneIndex(index);
    const url = new URL(window.location.href);
    url.searchParams.set("scene", sceneSlug(SCENES[index]!));
    window.history.replaceState(null, "", url);
  };

  // Inside the width preview: the dialog and nothing else, plus the readout, since the whole
  // question at 320px is whether anything overflows.
  if (bare) {
    return (
      <>
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

        {size && (
          <span
            className={`fixed top-1 right-1 z-70 rounded px-1.5 py-0.5 font-mono text-[10px] text-white ${
              size.doc > size.view ? "bg-red-500" : "bg-black/50"
            }`}
          >
            {size.view}
            {size.doc > size.view ? ` ⟶ ${size.doc}` : " ✓"}
          </span>
        )}
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dev · Cash Out states</title>
      </Head>

      <div className="flex min-h-screen flex-col gap-4 bg-white p-4 text-black md:flex-row">
        {/*
          The toggle, always reachable and above everything: at 320px the panel covers four fifths
          of the screen, so testing a dialog at phone width means getting it out of the way. It also
          carries the width readout, which is the whole point of being here at 320 — `doc > view` is
          horizontal overflow, in numbers rather than in a guess about a screenshot.
        */}
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          className="bg-purple fixed bottom-3 left-3 z-70 flex flex-row items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg"
        >
          {panelOpen ? "Hide" : "States"}
          {size && (
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                size.doc > size.view ? "bg-red-500" : "bg-white/20"
              }`}
            >
              {size.view}
              {size.doc > size.view ? ` ⟶ ${size.doc}` : ""}
            </span>
          )}
        </button>

        {/* Floated above the dialog: `CustomModal` renders a full-screen overlay that swallows
            clicks, so an in-flow picker would be visible and unusable. `z-50` is the modal's, so
            this sits one above it. */}
        <aside
          className={`border-gray fixed top-16 bottom-0 left-0 z-60 w-64 shrink-0 flex-col gap-3 overflow-y-auto border-r bg-white p-3 pb-16 shadow-lg ${
            panelOpen ? "flex" : "hidden"
          }`}
        >
          <div>
            <h5>Cash Out states</h5>
            <p className="text-gray-dark text-xs">
              Dev only. Copy lives in{" "}
              <code className="text-[11px]">lib/payout/copy.ts</code>.
            </p>
          </div>

          {/* Chrome will not open a window narrower than ~500px on Windows, so the only honest way
              to see a phone width is to give the dialog its own viewport. */}
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">Preview width</span>
            <div className="flex flex-row flex-wrap gap-1">
              {PREVIEW_WIDTHS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setWidth(option);
                    const url = new URL(window.location.href);
                    if (option === "full") url.searchParams.delete("width");
                    else url.searchParams.set("width", String(option));
                    window.history.replaceState(null, "", url);
                  }}
                  className={`rounded px-2 py-1 text-[11px] ${
                    option === width
                      ? "bg-purple text-white"
                      : "bg-gray-light hover:bg-gray"
                  }`}
                >
                  {option === "full" ? "full" : `${option}px`}
                </button>
              ))}
            </div>
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

        <main className={`grow ${panelOpen ? "md:pl-64" : ""}`}>
          {width === "full" ? (
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
          ) : (
            /*
              A real narrow viewport, not a narrow window. Chrome will not open a window below about
              500px on Windows, so `--window-size=320` and dragging the browser both lie: the page
              lays out at 500 and the edges are simply cropped. An iframe has its own layout
              viewport, so 320 here is genuinely 320 — which is the only way to answer "does this
              fit a small phone?" without devtools emulation.
            */
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-gray-dark text-xs">
                {width}px viewport — a real one, not a cropped window
              </span>
              <iframe
                key={`${width}-${sceneSlug(scene)}`}
                title={`Cash Out at ${width}px`}
                src={`/dev/cash-out?bare=1&scene=${sceneSlug(scene)}`}
                style={{ width: `${width}px` }}
                className="border-gray h-[720px] rounded-2xl border-4 bg-white"
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
