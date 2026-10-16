import { TimeIntervalOption } from "~/api/models/common";
import type { OpportunityInfo } from "~/api/models/opportunity";
import {
  fmtDate,
  getCommitmentDisplay,
  getEngagementConfig,
} from "~/components/Opportunity/opportunityTypeTheme";
import { formatNumber } from "~/features/discovery/lib/format";
import {
  resolveMoneyBadge,
  type MoneyFacts,
} from "~/features/discovery/lib/money";

// ─────────────────────────────────────────────────────────────────────────────
// The tabbed header's fact strip (round 10, 2026-10-02) — pure. Every value comes from the
// opportunity the page already has; nothing is fetched. The classic header keeps its own grey
// meta line (`OpportunityMetaTextRow`), so the rules are mirrored here, not shared: that line's
// copy ("1 hour effort · Ends 30 Sept") is unchanged for classic, the legacy cards and
// SocialPreview.
//
// Pay (2026-10-06) names a salary's currency from the currency lookup, so the caller works out
// the money facts (`moneyFactsOf`) and passes them in, and this stays pure.
// ─────────────────────────────────────────────────────────────────────────────

export type DetailFactId = "pay" | "reward" | "how" | "date";

export interface DetailFact {
  id: DetailFactId;
  label: string;
  /** The label below `md`, where it differs ("Take part"). */
  shortLabel?: string;
  value: string;
  /** Pay only: a partner incentive, which the tile labels partner-paid as the card's badge does. */
  partnerPaid?: boolean;
  /** A short line saying what the fact covers, for the tile's tooltip. */
  description?: string;
  /**
   * How only: its two halves, one per line in the tile ("10 minutes", "Remote"), so a narrow
   * phone tile never breaks the pair mid-way. `value` joins them for everything else.
   */
  lines?: string[];
}

const hoursLabel = (hours: number): string =>
  `${hours} hour${hours === 1 ? "" : "s"}`;

/** The interval's name ("Minute"), as `getCommitmentDisplay` reads it. */
const intervalName = (
  interval: OpportunityInfo["commitmentInterval"],
): string | null => {
  if (typeof interval === "string") return interval;
  if (typeof interval === "number") return TimeIntervalOption[interval] ?? null;
  return null;
};

/**
 * Effort as the interval ("4 minutes", Jason 2026-10-02) — a 4-minute task no longer reads as
 * "1 hour" — falling back to the total hours ("2 hours"). Null when neither is known: a
 * free-text interval description is not a quantity, so callers keep their own fallback.
 */
export const effortLabel = (opportunity: OpportunityInfo): string | null => {
  const display = getCommitmentDisplay(opportunity);
  if (!display) return null;
  if (
    opportunity.commitmentIntervalCount != null &&
    intervalName(opportunity.commitmentInterval)
  )
    return display.label.toLowerCase();
  return display.totalHours != null ? hoursLabel(display.totalHours) : null;
};

/**
 * Pay · Reward · How · Ends / Starts — a fact the page lacks drops out. "How" is the effort and
 * how you take part in one tile ("1 week · Remote", 2026-10-09, Jason: the two were separate
 * tiles), either alone when the other isn't known; the filters' "How" section pairs the same two.
 * Pay needs `money`; without it there is no Pay fact.
 */
export const detailFacts = (
  opportunity: OpportunityInfo,
  now: Date = new Date(),
  money?: MoneyFacts | null,
): DetailFact[] => {
  const facts: DetailFact[] = [];

  // the card's pay line, verbatim, for any type whose card shows one: the one money rule
  // (salary, then a partner incentive, then "Paid — amount not disclosed"), so the header never
  // disagrees with the card or the sticky bar
  const pay = money ? resolveMoneyBadge(money) : null;
  if (pay?.payLine)
    facts.push({
      id: "pay",
      label: "Pay",
      value: pay.payLine,
      partnerPaid: pay.partnerPaid,
    });

  // the ZLTO estimate, as the classic header's badge shows it: absent when null
  const reward = opportunity.zltoRewardEstimate;
  if (reward != null)
    facts.push({
      id: "reward",
      label: "Reward",
      value: reward > 0 ? `Z ${formatNumber(reward)}` : "Depleted",
    });

  const effort = effortLabel(opportunity);
  const engagement = getEngagementConfig(
    typeof opportunity.engagementType === "string"
      ? opportunity.engagementType
      : null,
  )?.label;
  const howLines = [effort, engagement].filter(
    (line): line is string => !!line,
  );
  if (howLines.length > 0)
    facts.push({
      id: "how",
      label: "How",
      value: howLines.join(" · "),
      lines: howLines,
      description: "How long it takes, and how you take part.",
    });

  // only while Active: upcoming → its start, else its end (or none at all)
  if (opportunity.status === "Active") {
    if (new Date(opportunity.dateStart) > now)
      facts.push({
        id: "date",
        label: "Starts",
        value: fmtDate(opportunity.dateStart),
      });
    else
      facts.push({
        id: "date",
        label: "Ends",
        value: opportunity.dateEnd ? fmtDate(opportunity.dateEnd) : "Ongoing",
      });
  }

  return facts;
};

/** "754 spots left" — the caption under the strip; null without a limit or once it is reached. */
export const spotsLeftLabel = (opportunity: OpportunityInfo): string | null => {
  if (
    opportunity.participantLimit == null ||
    opportunity.participantLimitReached
  )
    return null;
  const left = Math.max(
    opportunity.participantLimit - (opportunity.participantCountCompleted ?? 0),
    0,
  );
  return `${left} spot${left === 1 ? "" : "s"} left`;
};
