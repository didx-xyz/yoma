import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import React, { useEffect, useState } from "react";
import {
  IoCalendarOutline,
  IoCashOutline,
  IoHourglassOutline,
  IoLocationOutline,
  IoLockClosedOutline,
  IoPeopleOutline,
  IoSwapHorizontalOutline,
  IoTimeOutline,
  IoWifiOutline,
} from "react-icons/io5";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { getEngagementConfig } from "~/components/Opportunity/opportunityTypeTheme";
import { moneyFactsOf } from "~/features/discovery/lib/money";
import { useCurrenciesQuery } from "~/hooks/useOpportunityMutations";
import type { DetailBadge, DetailBadgeIcon } from "./detailBadges";
import { detailBadges } from "./detailBadges";
import { effortLabel } from "./detailFacts";
import { jumpToDetailSection } from "./detailSectionJump";

// ─────────────────────────────────────────────────────────────────────────────
// The tabbed header's fact chips (2026-10-12, Jason: the coloured, expandable badges of
// 2026-10-09 were too big). Small neutral pills, an icon and the value; a tap jumps to the
// badge's section below and opens it, where the detail now lives (`OpportunityDetailSections`).
// Only "act soon" keeps a colour: a deadline within 7 days is pink. The wording and rules are
// `detailBadges` (pure, tested); this draws them.
// ─────────────────────────────────────────────────────────────────────────────

const ICON: Record<Exclude<DetailBadgeIcon, "zlto">, React.ElementType> = {
  cash: IoCashOutline,
  time: IoTimeOutline,
  remote: IoWifiOutline,
  onsite: IoLocationOutline,
  hybrid: IoSwapHorizontalOutline,
  calendar: IoCalendarOutline,
  hourglass: IoHourglassOutline,
  lock: IoLockClosedOutline,
  people: IoPeopleOutline,
};

/** The chip's text colour: pink only for a deadline that is close, grey once it is over. */
const TEXT: Partial<Record<DetailBadge["tone"], string>> = {
  urgent: "text-pink",
  closed: "text-gray-dark",
  full: "text-gray-dark",
};

const ChipIcon: React.FC<{ badge: DetailBadge }> = ({ badge }) => {
  if (badge.icon === "zlto")
    return (
      <Image
        src={iconZlto}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 shrink-0"
      />
    );
  const Icon = ICON[badge.icon];
  return (
    <Icon
      aria-hidden
      className={`h-4 w-4 shrink-0 ${TEXT[badge.tone] ?? "text-gray-dark"}`}
    />
  );
};

export const DetailFactBadges: React.FC<{
  opportunity: OpportunityInfo;
}> = ({ opportunity }) => {
  // The currency lookup the sections below already load (same key), so Pay makes no request.
  const { data: currencies } = useCurrenciesQuery();
  // The youth's clock, after mount: the relative dates and the urgency wait for it (A2.7).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const badges = detailBadges(opportunity, {
    now,
    money: moneyFactsOf(opportunity, currencies ?? []),
    effort: effortLabel(opportunity),
    engagement:
      getEngagementConfig(
        typeof opportunity.engagementType === "string"
          ? opportunity.engagementType
          : null,
      )?.label ?? null,
  });
  if (badges.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Key facts">
      {badges.map((badge) => (
        <li key={badge.id} className="max-w-full">
          <button
            type="button"
            onClick={() => jumpToDetailSection(badge.section)}
            title={badge.info}
            aria-label={`${badge.eyebrow}: ${badge.value}. ${badge.info}. Show details below.`}
            className={`border-gray hover:border-gray-dark/40 hover:bg-gray-light/60 inline-flex max-w-full items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150 motion-reduce:transition-none ${
              TEXT[badge.tone] ?? "text-black"
            }`}
          >
            <ChipIcon badge={badge} />
            <span className="truncate">{badge.value}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
