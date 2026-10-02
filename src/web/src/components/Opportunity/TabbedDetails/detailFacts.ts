import { TimeIntervalOption } from "~/api/models/common";
import type { OpportunityInfo } from "~/api/models/opportunity";
import {
  fmtDate,
  getCommitmentDisplay,
  getEngagementConfig,
} from "~/components/Opportunity/opportunityTypeTheme";
import { formatNumber } from "~/features/discovery/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// The tabbed header's fact strip (round 10, 2026-10-02) — pure. Every value comes from the
// opportunity the page already has; nothing is fetched. The classic header keeps its own grey
// meta line (`OpportunityMetaTextRow`), so the rules are mirrored here, not shared: that line's
// copy ("1 hour effort · Ends 30 Sept") is unchanged for classic, the legacy cards and
// SocialPreview.
// ─────────────────────────────────────────────────────────────────────────────

export type DetailFactId = "reward" | "effort" | "date" | "engagement";

export interface DetailFact {
  id: DetailFactId;
  label: string;
  /** The label below `md`, where it differs ("Take part"). */
  shortLabel?: string;
  value: string;
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

/** Reward · Effort · Ends / Starts · How you take part — a fact the page lacks drops out. */
export const detailFacts = (
  opportunity: OpportunityInfo,
  now: Date = new Date(),
): DetailFact[] => {
  const facts: DetailFact[] = [];

  // the ZLTO estimate, as the classic header's badge shows it: absent when null
  const reward = opportunity.zltoRewardEstimate;
  if (reward != null)
    facts.push({
      id: "reward",
      label: "Reward",
      value: reward > 0 ? `Z ${formatNumber(reward)}` : "Depleted",
    });

  const effort = effortLabel(opportunity);
  if (effort) facts.push({ id: "effort", label: "Effort", value: effort });

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

  const engagement = getEngagementConfig(
    typeof opportunity.engagementType === "string"
      ? opportunity.engagementType
      : null,
  )?.label;
  if (engagement)
    facts.push({
      id: "engagement",
      label: "How you take part",
      shortLabel: "Take part",
      value: engagement,
    });

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
