import Image from "next/image";
import Link from "next/link";
import iconZlto from "public/images/icon-zlto.svg";
import React, { useEffect, useRef, useState } from "react";
import {
  IoCalendarOutline,
  IoCashOutline,
  IoChevronDown,
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
import type {
  DetailBadge,
  DetailBadgeIcon,
  DetailBadgeTone,
} from "./detailBadges";
import { detailBadges } from "./detailBadges";
import { effortLabel } from "./detailFacts";

// ─────────────────────────────────────────────────────────────────────────────
// The tabbed header's fact badges (2026-10-09, Jason; spec
// `design/2026-10-09-detail-badges-copy.md` Part A). Below `md` one bordered list, a row per
// badge, each opening under its own row; from `md` tinted cards in a grid, the open one ringed and
// its panel across the card under the grid. One open at a time; Escape closes it. The wording and
// rules are `detailBadges` (pure, tested); this draws them.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per tone (spec A2.3), every class written out whole, as Tailwind only generates classes it
 * finds in full: the icon disc's tint below `md` (`tile`), the card's tint from `md`
 * (`card`), the icon colour, the open card's ring, and the Places bar's fill.
 */
const TONE: Record<
  DetailBadgeTone,
  { tile: string; card: string; icon: string; ring: string; bar?: string }
> = {
  pay: {
    tile: "bg-orange-light",
    card: "md:bg-orange-light",
    icon: "text-yellow",
    ring: "md:ring-yellow",
  },
  reward: {
    tile: "bg-orange-light",
    card: "md:bg-orange-light",
    icon: "text-orange",
    ring: "md:ring-orange",
  },
  how: {
    tile: "bg-blue-light",
    card: "md:bg-blue-light",
    icon: "text-blue-dark",
    ring: "md:ring-blue-dark",
  },
  dates: {
    tile: "bg-purple-tint",
    card: "md:bg-purple-tint",
    icon: "text-purple",
    ring: "md:ring-purple",
  },
  urgent: {
    tile: "bg-pink/10",
    card: "md:bg-pink/10",
    icon: "text-pink",
    ring: "md:ring-pink",
  },
  closed: {
    tile: "bg-gray-light",
    card: "md:bg-gray-light",
    icon: "text-gray-dark",
    ring: "md:ring-gray-dark",
  },
  places: {
    tile: "bg-green-light",
    card: "md:bg-green-light",
    icon: "text-green",
    ring: "md:ring-green",
    bar: "bg-green",
  },
  almostFull: {
    tile: "bg-green-light",
    card: "md:bg-green-light",
    icon: "text-pink",
    ring: "md:ring-pink",
    bar: "bg-pink",
  },
  full: {
    tile: "bg-gray-light",
    card: "md:bg-gray-light",
    icon: "text-gray-dark",
    ring: "md:ring-gray-dark",
    bar: "bg-gray-dark",
  },
};

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

/**
 * Columns from `md` (spec A2.2): a 6-column grid to 1279, then one row from `xl`. One or two
 * badges keep a quarter width, left-aligned: a single stretched badge read like an alert.
 */
const GRID: Record<number, string> = {
  1: "md:grid-cols-6 xl:grid-cols-4",
  2: "md:grid-cols-6 xl:grid-cols-4",
  3: "md:grid-cols-6 xl:grid-cols-3",
  4: "md:grid-cols-6 xl:grid-cols-4",
  5: "md:grid-cols-6 xl:grid-cols-5",
};
const SPANS: Record<number, string[]> = {
  1: ["md:col-span-3"],
  2: ["md:col-span-3", "md:col-span-3"],
  3: ["md:col-span-2", "md:col-span-2", "md:col-span-2"],
  4: ["md:col-span-3", "md:col-span-3", "md:col-span-3", "md:col-span-3"],
  5: [
    "md:col-span-2",
    "md:col-span-2",
    "md:col-span-2",
    "md:col-span-3",
    "md:col-span-3",
  ],
};

const BadgeIcon: React.FC<{ badge: DetailBadge; pulse: boolean }> = ({
  badge,
  pulse,
}) => {
  const tone = TONE[badge.tone];
  const Icon = badge.icon === "zlto" ? null : ICON[badge.icon];
  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] md:h-10 md:w-10 md:bg-white ${tone.tile} ${tone.icon} ${
        // The deadline's hourglass pulses three times, then holds still (no endless motion).
        pulse ? "motion-safe:animate-[pulse_2s_ease-in-out_3]" : ""
      }`}
    >
      {Icon ? (
        <Icon className="h-[18px] w-[18px] md:h-5 md:w-5" />
      ) : (
        <Image
          src={iconZlto}
          alt=""
          width={20}
          height={20}
          className="h-[18px] w-[18px] md:h-5 md:w-5"
        />
      )}
    </span>
  );
};

const Panel: React.FC<{
  badge: DetailBadge;
  preview: boolean;
}> = ({ badge, preview }) => {
  const { panel } = badge;
  return (
    <div className="flex flex-col gap-2 text-sm text-black">
      {panel.lead && <p className="font-semibold">{panel.lead}</p>}
      {panel.facts && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {panel.facts.map(([term, value]) => (
            <React.Fragment key={term}>
              <dt className="text-gray-dark">{term}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
      {panel.paragraphs.map((paragraph, index) => (
        <p key={index}>
          {paragraph.lead && (
            <span className="font-semibold">{paragraph.lead} </span>
          )}
          {paragraph.text}
        </p>
      ))}
      {panel.cashOut && (
        <p className="text-gray-dark">
          {panel.cashOut.before}
          {preview ? (
            // the editor's preview: a link out would lose the unsaved draft
            <span className="text-green font-semibold underline">
              {panel.cashOut.link}
            </span>
          ) : (
            <Link
              href="/marketplace"
              className="text-green font-semibold underline"
            >
              {panel.cashOut.link}
            </Link>
          )}
          {panel.cashOut.after}
        </p>
      )}
    </div>
  );
};

export const DetailFactBadges: React.FC<{
  opportunity: OpportunityInfo;
  /** The youth's Cash Out is closed: the Reward panel's cash-out line keeps the marketplace only. */
  cashOutClosed?: boolean;
  /** The editor's preview: the marketplace link isn't a link. */
  preview?: boolean;
}> = ({ opportunity, cashOutClosed = false, preview = false }) => {
  // The currency lookup the sections below already load (same key), so Pay makes no request.
  const { data: currencies } = useCurrenciesQuery();
  // The youth's clock, after mount: the relative dates and the urgency wait for it (A2.7).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const [openId, setOpenId] = useState<string | null>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  const badges = detailBadges(opportunity, {
    now,
    money: moneyFactsOf(opportunity, currencies ?? []),
    cashOutClosed,
    effort: effortLabel(opportunity),
    engagement:
      getEngagementConfig(
        typeof opportunity.engagementType === "string"
          ? opportunity.engagementType
          : null,
      )?.label ?? null,
  });
  if (badges.length === 0) return null;
  const count = Math.min(badges.length, 5);

  return (
    <div
      className={`divide-gray border-gray mt-5 divide-y overflow-hidden rounded-2xl border bg-white md:grid md:gap-3 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent ${GRID[count]}`}
    >
      {badges.map((badge, index) => {
        const tone = TONE[badge.tone];
        const open = openId === badge.id;
        const panelId = `fact-${badge.id}-panel`;
        const buttonId = `fact-${badge.id}-button`;
        const urgent = badge.tone === "urgent";
        return (
          // Below `md` the wrapper is the list row (badge, then its panel); from `md` it steps
          // aside (`contents`), so the badge is a grid cell and the panel a full-width row last.
          <div
            key={badge.id}
            className={`md:contents ${urgent ? "bg-pink/10 md:bg-transparent" : ""}`}
            onKeyDown={(event) => {
              if (event.key === "Escape" && open) {
                setOpenId(null);
                buttons.current[badge.id]?.focus();
              }
            }}
          >
            <button
              ref={(element) => {
                buttons.current[badge.id] = element;
              }}
              id={buttonId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : badge.id)}
              style={{ animationDelay: `${index * 50}ms` }}
              className={`flex min-h-14 w-full items-center gap-3 px-3.5 py-3 text-left motion-safe:animate-[fade-in_240ms_ease-out_both] motion-reduce:transition-none md:min-h-[88px] md:items-start md:rounded-[14px] md:p-3.5 md:transition-shadow md:duration-150 md:hover:shadow-md ${tone.card} ${SPANS[count]?.[index] ?? ""} xl:col-span-1 ${
                open ? `md:ring-2 md:ring-inset ${tone.ring}` : ""
              }`}
            >
              <BadgeIcon badge={badge} pulse={urgent && now !== null} />
              <span className="min-w-0 grow">
                <span className="text-gray-dark hidden text-xs md:block">
                  {badge.eyebrow}
                </span>
                <span className="font-nunito block text-[15px] leading-tight font-black text-black max-[359px]:text-[14px] md:text-[17px]">
                  {badge.value}
                </span>
                <span className="text-gray-dark block text-[13px] leading-snug md:line-clamp-2">
                  {badge.info}
                </span>
                {badge.bar !== undefined && (
                  <span
                    aria-hidden
                    className="bg-gray-light mt-1.5 block h-1 w-full overflow-hidden rounded-full md:bg-white"
                  >
                    <span
                      className={`block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${tone.bar ?? "bg-green"}`}
                      // Grows to its value after mount; drawn at it under reduced motion.
                      style={{ width: `${(now ? badge.bar : 0) * 100}%` }}
                    />
                  </span>
                )}
              </span>
              <IoChevronDown
                aria-hidden
                className={`text-gray-dark mt-0.5 h-4 w-4 shrink-0 self-start transition-transform duration-220 motion-reduce:transition-none ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            {/* Below `md`: in the row, easing between 0fr and 1fr (as DetailDisclosure). From
                `md`: only the open one is drawn, as a full-width row under the grid; a closed
                one would leave an empty grid row. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              className={`grid transition-[grid-template-rows] duration-220 ease-out motion-reduce:transition-none md:order-last md:col-span-full ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr] md:hidden"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`px-3.5 pb-3.5 pl-[62px] md:rounded-[14px] md:p-4 ${tone.card} ${
                    open
                      ? "motion-safe:animate-[fade-in_220ms_ease-out_both]"
                      : ""
                  }`}
                >
                  <Panel badge={badge} preview={preview} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
