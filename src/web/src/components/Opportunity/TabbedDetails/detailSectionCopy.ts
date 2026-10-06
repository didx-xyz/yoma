import {
  AccessibilitySupport,
  RewardType,
  type OpportunityInfo,
} from "~/api/models/opportunity";
import type { UserProfilePayout } from "~/api/models/user";
import { finiteOrNull } from "~/components/Opportunity/Admin/opportunityCoreFields";
import { formatNumber } from "~/features/discovery/lib/format";
import {
  resolveMoneyBadge,
  type MoneyFacts,
} from "~/features/discovery/lib/money";

// ─────────────────────────────────────────────────────────────────────────────
// The tabbed detail sections' wording (Jason's feedback round, 2026-10-05) — pure, so the unit
// tests reach it. Each section says what its value means for the youth, read from the fields
// the opportunity already carries; nothing is fetched. The pay lines (salary, partner incentive)
// come from `resolveMoneyBadge`, the rule the cards and the sticky bar use. The ZLTO amount is
// the estimate, as the header's Reward tile reads it; the sticky bar's ZLTO pill reads the raw
// `zltoReward`, so those two can differ.
// ─────────────────────────────────────────────────────────────────────────────

/** What the Incentive section shows, per state. */
export type IncentiveCopy =
  | {
      /** One value with nothing to open: "Incentive · None", with its note. */
      kind: "static";
      value: string;
      note: string;
    }
  | {
      kind: "disclosure";
      /** The closed row's preview. */
      preview: string;
      /** The body's bold first line ("200 ZLTO", "USD 150"); `zlto` puts the ZLTO icon first. */
      amount: { text: string; zlto: boolean } | null;
      body: string;
      /** Zlto the youth can still earn: the cash-out line (`cashOutLine`) follows the body. */
      cashOut: boolean;
    };

/** A reward type that pays: ZLTO or a partner incentive. */
const paysReward = (rewardType: string | null | undefined): boolean =>
  rewardType === RewardType.ZLTO || rewardType === RewardType.PartnerIncentive;

/**
 * The Incentive section's state and copy, or null when the section does not show.
 *
 * A stored reward counts as rewarded (Jason, 2026-10-05): the custom-fields migration set the
 * reward type on existing ZLTO opportunities but left `incentivized` null, so null with ZLTO or a
 * partner incentive stored reads exactly as `incentivized === true` with that reward, public
 * and admin. A Job's disclosed salary is a stored reward too, so it reads as its pay line, as
 * the cards and the sticky bar show it. Null with nothing stored is unanswered: hidden on the
 * public page, "Not specified" on the admin pages (`showUnspecified`). `incentivized === false`
 * is None, whatever is stored.
 *
 * The ZLTO amount is the estimate, as the header's Reward tile and the preview read it. A
 * partner incentive shows the partner's own amount: on a Job, a disclosed salary would otherwise
 * take the pay line.
 */
export const incentiveCopy = (
  opportunity: Pick<
    OpportunityInfo,
    "incentivized" | "rewardType" | "zltoRewardEstimate"
  >,
  {
    isJob,
    facts,
    showUnspecified = false,
  }: { isJob: boolean; facts: MoneyFacts; showUnspecified?: boolean },
): IncentiveCopy | null => {
  if (opportunity.incentivized === false)
    return {
      kind: "static",
      value: "None",
      note: "No pay, ZLTO or other reward.",
    };
  const rewardStored =
    paysReward(opportunity.rewardType) || (isJob && facts.salary !== null);
  if (opportunity.incentivized == null && !rewardStored)
    return showUnspecified
      ? {
          kind: "static",
          value: "Not specified",
          note: "The provider hasn't said whether this pays or rewards.",
        }
      : null;

  if (opportunity.rewardType === RewardType.ZLTO) {
    const estimate = opportunity.zltoRewardEstimate;
    if (estimate == null)
      return {
        kind: "disclosure",
        preview: "Earn ZLTO",
        amount: { text: "ZLTO reward", zlto: true },
        body: "You earn Zlto once your completion is verified. The amount isn't shown for this opportunity.",
        cashOut: true,
      };
    if (estimate > 0)
      return {
        kind: "disclosure",
        preview: `Earn ${formatNumber(estimate)} ZLTO`,
        amount: { text: `${formatNumber(estimate)} ZLTO`, zlto: true },
        body: "An estimate. You earn it once your completion is verified, and you may get less if the reward pool runs low.",
        cashOut: true,
      };
    // 0: the pool is depleted (the header's Reward tile says "Depleted")
    return {
      kind: "disclosure",
      preview: "ZLTO rewards have run out",
      amount: null,
      body: "This opportunity's ZLTO reward pool has run out, so completing it now earns no Zlto.",
      cashOut: false,
    };
  }

  if (opportunity.rewardType === RewardType.PartnerIncentive) {
    const { payLine, partnerPaid } = resolveMoneyBadge({
      ...facts,
      salary: null,
    });
    if (payLine && partnerPaid)
      return {
        kind: "disclosure",
        preview: `${payLine} from the partner`,
        amount: { text: payLine, zlto: false },
        body: "Offered and paid by the partner that runs this opportunity, not by Yoma. Ask them how and when it's paid.",
        cashOut: false,
      };
    return {
      kind: "disclosure",
      preview: "Partner incentive",
      amount: null,
      body: "The partner that runs this opportunity offers an incentive. Ask them for the details — Yoma doesn't pay or process it.",
      cashOut: false,
    };
  }

  // Reward type None: for a Job that is its pay; anyone else's is the provider's to explain
  if (isJob) {
    const { payLine } = resolveMoneyBadge(facts);
    if (facts.salary && payLine)
      return {
        kind: "disclosure",
        preview: payLine,
        amount: { text: payLine, zlto: false },
        body: "The pay the employer has shared for this job.",
        cashOut: false,
      };
    return {
      kind: "disclosure",
      preview: "Paid",
      amount: null,
      body: "This job is paid. The employer hasn't shared the amount.",
      cashOut: false,
    };
  }
  return {
    kind: "disclosure",
    preview: "Paid or rewarded",
    amount: null,
    body: "This opportunity offers pay or a reward. Ask the provider for the details.",
    cashOut: false,
  };
};

/**
 * Cash Out is closed to this youth: off in this environment, or not offered in their country.
 * `=== false`, as `lib/payout/eligibility.ts` reads them: a field an older API does not send is
 * not a closed gate. While the provider is offline `supported` carries no information (the
 * server checks offline first), so it closes nothing then. Signed out (no profile) it is open,
 * and the hedged line shows.
 */
export const isCashOutClosed = (
  payout:
    | Pick<UserProfilePayout, "enabled" | "countryAvailability">
    | null
    | undefined,
): boolean =>
  payout?.enabled === false ||
  (payout?.countryAvailability?.supported === false &&
    !payout.countryAvailability.offline);

/**
 * The cash-out line under a ZLTO body, split around its "marketplace" link (Spend and Cash Out
 * both live there). "Zlto" in prose, as the Cash Out copy rules have it (`lib/payout/copy.ts`).
 * Hedged — "in supported countries" — since Cash Out is gated by environment, country and a
 * complete profile; with Cash Out closed to this youth, only the marketplace half.
 */
export const cashOutLine = (
  cashOutClosed: boolean,
): { before: string; link: string; after: string } => ({
  before: "Spend your Zlto in the ",
  link: "marketplace",
  after: cashOutClosed
    ? "."
    : ", or cash it out for real money in supported countries.",
});

/**
 * "18–35 years" · "18 and over" · "Up to 35 years" — the tabbed age row's own wording. Null
 * exactly when `formatAgeRange` is (neither bound set), which classic still uses.
 */
export const ageRangeLabel = (
  ageFrom: number | null | undefined,
  ageTo: number | null | undefined,
): string | null => {
  const from = finiteOrNull(ageFrom);
  const to = finiteOrNull(ageTo);
  if (from !== null && to !== null)
    return from === to ? `${from} years` : `${from}–${to} years`;
  if (from !== null) return `${from} and over`;
  if (to !== null) return `Up to ${to} years`;
  return null;
};

/**
 * The age row's note, from the same bounds as `ageRangeLabel`. "For people aged", never "open
 * to": the API does not gate taking part by age.
 */
export const ageRangeNote = (
  ageFrom: number | null | undefined,
  ageTo: number | null | undefined,
): string | null => {
  const from = finiteOrNull(ageFrom);
  const to = finiteOrNull(ageTo);
  if (from !== null && to !== null)
    return from === to
      ? `For people aged ${from}.`
      : `For people aged ${from} to ${to}.`;
  if (from !== null) return `For people aged ${from} and over.`;
  if (to !== null) return `For people aged ${to} and under.`;
  return null;
};

/**
 * The Accessibility row's note when there is no list to open. No and Not specified mean
 * different things, so each says its own; a value this client does not know reads as Not
 * specified, as its label does. Yes always carries a list (the API requires one), so its note
 * is a fallback.
 */
export const accessibilityNote = (
  support: string | null | undefined,
): string => {
  switch (support) {
    case AccessibilitySupport.No:
      return "The provider says it offers no accessibility accommodations.";
    case AccessibilitySupport.AvailableOnRequest:
      return "The provider can arrange support if you ask. Ask them what's possible before you start.";
    case AccessibilitySupport.Yes:
      return "The provider says it's accessible but hasn't listed how. Ask them before you start.";
    default:
      return "The provider hasn't said whether it offers accessibility accommodations.";
  }
};

/** The open list's closing line, after the chips and the Other description. */
export const accessibilityClosing = (
  support: string | null | undefined,
): string | null => {
  if (support === AccessibilitySupport.AvailableOnRequest)
    return "These aren't in place by default. Ask the provider to arrange what you need before you start.";
  if (support === AccessibilitySupport.Yes)
    return "Need something that isn't listed? Ask the provider before you start.";
  return null;
};
