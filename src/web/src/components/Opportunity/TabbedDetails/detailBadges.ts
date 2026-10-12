import type { OpportunityInfo } from "~/api/models/opportunity";
import { fullDate, startsText } from "~/features/discovery/lib/cardFacts";
import { cardStatus } from "~/features/discovery/lib/cardStatus";
import { calendarDaysUntil } from "~/features/discovery/lib/dates";
import { formatNumber } from "~/features/discovery/lib/format";
import {
  resolveMoneyBadge,
  type MoneyFacts,
} from "~/features/discovery/lib/money";

// ─────────────────────────────────────────────────────────────────────────────
// The tabbed header's fact BADGES (2026-10-09, Jason; spec
// `design/2026-10-09-detail-badges-copy.md` Part A): Pay · Reward · How · Dates · Places, each an
// icon, a value that stands alone and one informative line. Since 2026-10-12 (Jason) the header
// shows them as small chips that jump to their `section` below, and the `panel` is that section's
// content (`OpportunityDetailSections`): nothing expands in the header any more. Pure: every value
// comes from the opportunity the page already has. `now` is the youth's clock, set after mount;
// `null` before it (the server), when the dates read in their absolute form so the two renders
// match. The effort and engagement labels come from the caller (`effortLabel`,
// `getEngagementConfig`, which live in .tsx modules), so this stays a plain module.
// ─────────────────────────────────────────────────────────────────────────────

export type DetailBadgeId = "pay" | "reward" | "how" | "dates" | "places";

/** The section below a badge jumps to and opens: Pay and Reward share "Pay and rewards". */
export type DetailBadgeSection = "incentive" | "how" | "dates" | "places";

const SECTION: Record<DetailBadgeId, DetailBadgeSection> = {
  pay: "incentive",
  reward: "incentive",
  how: "how",
  dates: "dates",
  places: "places",
};

/** What the badge's colours say (spec A2.3): pink is "act soon" only. */
export type DetailBadgeTone =
  | "pay"
  | "reward"
  | "how"
  | "dates"
  | "urgent"
  | "closed"
  | "places"
  | "almostFull"
  | "full";

export type DetailBadgeIcon =
  | "cash"
  | "zlto"
  | "time"
  | "remote"
  | "onsite"
  | "hybrid"
  | "calendar"
  | "hourglass"
  | "lock"
  | "people";

export interface DetailBadge {
  id: DetailBadgeId;
  /** Where a tap on it goes (`SECTION`). */
  section: DetailBadgeSection;
  /** The small label above the value, from `md` only. */
  eyebrow: string;
  value: string;
  info: string;
  tone: DetailBadgeTone;
  icon: DetailBadgeIcon;
  /** Places only: how full, 0–1 (at least 0.04 once anything is taken, so it shows). */
  bar?: number;
  /**
   * The content of its section below, for How, Dates and Places. Pay and Reward have none: they
   * jump to "Pay and rewards", which `incentiveCopy` words.
   */
  panel?: {
    /** A bold first line. */
    lead?: string;
    /** Short paragraphs, each with an optional bold lead word ("Time:"). */
    paragraphs: { lead?: string; text: string }[];
    /** A two-column fact list. */
    facts?: [string, string][];
  };
}

/** A badge before its section is set (`detailBadges` adds it from `SECTION`). */
type BadgeDraft = Omit<DetailBadge, "section">;

const UNDISCLOSED = "Paid — amount not disclosed";

const payBadge = (
  opportunity: OpportunityInfo,
  money: MoneyFacts | null,
): BadgeDraft | null => {
  const pay = money ? resolveMoneyBadge(money) : null;
  if (!pay?.payLine) return null;
  const base = {
    id: "pay" as const,
    eyebrow: "Pay",
    value: pay.payLine,
    tone: "pay" as const,
    icon: "cash" as const,
  };
  if (pay.payLine === UNDISCLOSED)
    return opportunity.type === "Job"
      ? {
          ...base,
          info: "Ask about pay when you apply",
        }
      : {
          ...base,
          info: "Ask the provider about pay",
        };
  if (pay.partnerPaid)
    return {
      ...base,
      info: "Paid by the partner, not Yoma",
    };
  return {
    ...base,
    info: "Salary from the employer",
  };
};

const rewardBadge = (opportunity: OpportunityInfo): BadgeDraft | null => {
  const reward = opportunity.zltoRewardEstimate;
  if (reward == null) return null;
  if (reward <= 0)
    return {
      id: "reward",
      eyebrow: "Reward",
      value: "ZLTO ran out",
      info: "No reward left to earn",
      tone: "reward",
      icon: "zlto",
    };
  const amount = formatNumber(reward);
  return {
    id: "reward",
    eyebrow: "Reward",
    value: `${amount} ZLTO`,
    info: "Earn it when you finish",
    tone: "reward",
    icon: "zlto",
  };
};

const ENGAGEMENT_INFO: Record<string, string> = {
  Remote: "Online, from anywhere",
  OnSite: "In person",
  Hybrid: "Online and in person",
};

const ENGAGEMENT_ICON: Record<string, DetailBadgeIcon> = {
  Remote: "remote",
  OnSite: "onsite",
  Hybrid: "hybrid",
};

/** "in Cape Town, Western Cape" / "in Western Cape" — only with exactly one named place. */
const onsitePlace = (opportunity: OpportunityInfo): string | null => {
  const countries = opportunity.countries ?? [];
  if (countries.length !== 1) return null;
  const { city, region } = countries[0]!;
  if (city) return `in ${[city, region].filter(Boolean).join(", ")}`;
  if (region) return `in ${region}`;
  return null;
};

const engagementParagraph = (
  key: string,
  label: string,
  opportunity: OpportunityInfo,
): { lead: string; text: string } => {
  if (key === "Remote")
    return {
      lead: `${label}:`,
      text: "You take part online, from wherever you are.",
    };
  if (key === "OnSite") {
    const place = onsitePlace(opportunity);
    return {
      lead: `${label}:`,
      text: `You go there in person${place ? `, ${place}` : ""}.`,
    };
  }
  if (key === "Hybrid")
    return {
      lead: `${label}:`,
      text: "Some of it is online and some in person.",
    };
  return { lead: `${label}:`, text: "How you take part." };
};

const howBadge = (
  opportunity: OpportunityInfo,
  effort: string | null,
  engagement: string | null,
): BadgeDraft | null => {
  const key =
    typeof opportunity.engagementType === "string"
      ? opportunity.engagementType
      : null;
  if (!effort && !engagement) return null;
  const paragraphs: { lead?: string; text: string }[] = [];
  if (effort)
    paragraphs.push({
      lead: "Time:",
      text: `About ${effort}. It's a guide, not a deadline.`,
    });
  if (key && engagement)
    paragraphs.push(engagementParagraph(key, engagement, opportunity));
  return {
    id: "how",
    eyebrow: "How",
    value: [effort, engagement].filter(Boolean).join(" · "),
    info:
      key && engagement
        ? (ENGAGEMENT_INFO[key] ?? "How you take part")
        : "Roughly how long it takes",
    tone: "how",
    icon: effort ? "time" : key ? (ENGAGEMENT_ICON[key] ?? "time") : "time",
    panel: { paragraphs },
  };
};

/** "8 Nov" — the absolute form, as before mount and beyond 30 days. */
const shortDate = (date: Date): string =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const timeLeft = (days: number): string =>
  days <= 0 ? "Less than a day" : days === 1 ? "1 day" : `${days} days`;

const datesBadge = (
  opportunity: OpportunityInfo,
  now: Date | null,
): BadgeDraft | null => {
  // Only while Active, as before.
  if (opportunity.status !== "Active") return null;
  const start = new Date(opportunity.dateStart);
  const end = opportunity.dateEnd ? new Date(opportunity.dateEnd) : null;
  // Before mount (the server): the absolute form only, no relative words, no urgency.
  const yearOf = now ?? end ?? start;
  const closes = end ? `Closes ${fullDate(end, yearOf)}` : "No deadline";
  const base = {
    id: "dates" as const,
    eyebrow: "Dates",
  };
  if (!now) {
    const startsLater = start.getTime() > Date.now();
    return {
      ...base,
      value: startsLater
        ? `Starts ${shortDate(start)}`
        : end
          ? `Ends ${shortDate(end)}`
          : "No deadline",
      info: startsLater || end ? closes : "Join any time",
      tone: "dates",
      icon: "calendar",
      panel: { paragraphs: [] },
    };
  }

  const facts: [string, string][] = [];
  const started = start.getTime() <= now.getTime();
  facts.push([started ? "Started" : "Starts", fullDate(start, now)]);

  if (end && end.getTime() < now.getTime()) {
    facts.push(["Closed", fullDate(end, now)]);
    return {
      ...base,
      value: "Closed",
      info: `Ended ${fullDate(end, now)}`,
      tone: "closed",
      icon: "lock",
      panel: {
        facts,
        paragraphs: [{ text: "This opportunity has closed." }],
      },
    };
  }

  facts.push(["Closes", end ? fullDate(end, now) : "No deadline"]);
  const days = end ? Math.max(0, calendarDaysUntil(end, now)) : null;
  if (days !== null) facts.push(["Time left", timeLeft(days)]);

  if (!started)
    return {
      ...base,
      value: startsText(start, calendarDaysUntil(start, now)),
      info: closes,
      tone: "dates",
      icon: "calendar",
      panel: {
        facts,
        paragraphs: [
          { text: "It hasn't started yet. Save it so you don't miss it." },
        ],
      },
    };

  if (days === null)
    return {
      ...base,
      value: "No deadline",
      info: "Join any time",
      tone: "dates",
      icon: "calendar",
      panel: { facts, paragraphs: [] },
    };

  const urgent = days <= 7;
  const value =
    days === 0
      ? "Ends today"
      : days === 1
        ? "Ends tomorrow"
        : days <= 30
          ? `${days} days left`
          : `Apply by ${shortDate(end!)}`;
  return {
    ...base,
    value,
    info: days > 30 ? `${days} days left` : closes,
    tone: urgent ? "urgent" : "dates",
    icon: urgent ? "hourglass" : "calendar",
    panel: {
      facts,
      paragraphs: urgent ? [{ text: "Don't wait. This closes soon." }] : [],
    },
  };
};

const PLACES_RULE =
  "A place is taken when someone finishes, or sends proof that's waiting to be verified.";

const placesBadge = (
  opportunity: OpportunityInfo,
  now: Date | null,
): BadgeDraft | null => {
  const limit = opportunity.participantLimit;
  if (limit == null) return null;
  // Closed shows no badge; before mount nothing is known closed (the dates wait the same way).
  const status = cardStatus(
    opportunity,
    now ?? new Date(opportunity.dateStart),
  );
  if (status.closed || status.places === null) return null;
  const taken = Math.min(Math.max(opportunity.participantCountTotal, 0), limit);
  const left = limit - taken;
  const ratio = limit > 0 ? taken / limit : 1;
  const bar = taken > 0 ? Math.max(ratio, 0.04) : 0;
  const base = {
    id: "places" as const,
    eyebrow: "Places",
    value: status.places,
    icon: "people" as const,
  };
  if (status.places === "No places left" || left <= 0)
    return {
      ...base,
      info: `All ${formatNumber(limit)} places are taken`,
      tone: "full",
      bar: 1,
      panel: {
        paragraphs: [{ text: `All ${formatNumber(limit)} places are taken.` }],
      },
    };
  const almostFull = left <= 10 || ratio >= 0.9;
  return {
    ...base,
    info: almostFull
      ? "Almost full"
      : taken === 0
        ? "Be one of the first"
        : `${formatNumber(taken)} of ${formatNumber(limit)} taken`,
    tone: almostFull ? "almostFull" : "places",
    bar,
    panel: {
      paragraphs: [
        {
          text: `Up to ${formatNumber(limit)} ${limit === 1 ? "person" : "people"} can take part.${
            taken > 0
              ? ` ${formatNumber(taken)} ${taken === 1 ? "place is" : "places are"} taken so far.`
              : ""
          } ${PLACES_RULE}`,
        },
      ],
    },
  };
};

/**
 * The badges in their fixed order, Pay · Reward · How · Dates · Places; one the opportunity lacks
 * drops out. `money` is `moneyFactsOf(...)` (the caller has the currency lookup).
 */
export const detailBadges = (
  opportunity: OpportunityInfo,
  options: {
    now: Date | null;
    money: MoneyFacts | null;
    /** `effortLabel(opportunity)`: "10 minutes". */
    effort: string | null;
    /** `getEngagementConfig(engagementType)?.label`: "Remote". */
    engagement: string | null;
  },
): DetailBadge[] =>
  [
    payBadge(opportunity, options.money),
    rewardBadge(opportunity),
    howBadge(opportunity, options.effort, options.engagement),
    datesBadge(opportunity, options.now),
    placesBadge(opportunity, options.now),
  ]
    .filter((badge): badge is BadgeDraft => badge !== null)
    .map((badge) => ({ ...badge, section: SECTION[badge.id] }));
