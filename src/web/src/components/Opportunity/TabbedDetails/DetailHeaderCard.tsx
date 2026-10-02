import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import React from "react";
import { IoMdPerson } from "react-icons/io";
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoWifiOutline,
} from "react-icons/io5";
import type { OpportunityInfo } from "~/api/models/opportunity";
import {
  getTypeConfig,
  OpportunityOrgCountriesRow,
  OpportunityTypeBadge,
} from "~/components/Opportunity/opportunityTypeTheme";
import {
  detailFacts,
  spotsLeftLabel,
  type DetailFact,
  type DetailFactId,
} from "./detailFacts";

// ─────────────────────────────────────────────────────────────────────────────
// The TABBED layout's header card (round 10, claude.design P2, 2026-10-02):
// what it is (type chip, org · location) → the title → the facts → the host's
// actions, with the organisation's logo square at the top right. The classic
// header in `OpportunityPublicDetails` is untouched — this card replaces it only
// when the layout is tabbed — and so are `AvatarImage` and `ZltoRewardBadge`:
// the logo square and the Reward tile are drawn here.
// ─────────────────────────────────────────────────────────────────────────────

const FACT_TONE: Record<DetailFactId, { tile: string; icon: string }> = {
  reward: { tile: "bg-orange-light", icon: "text-yellow" },
  effort: { tile: "bg-blue-light", icon: "text-blue-dark" },
  date: { tile: "bg-pink/10", icon: "text-pink" },
  engagement: { tile: "bg-green-light", icon: "text-green" },
};

const FACT_ICON: Record<DetailFactId, React.ReactNode> = {
  reward: (
    <Image src={iconZlto} alt="" width={20} height={20} className="h-5 w-5" />
  ),
  effort: <IoTimeOutline className="h-5 w-5" />,
  date: <IoCalendarOutline className="h-5 w-5" />,
  engagement: <IoWifiOutline className="h-5 w-5" />,
};

/**
 * Columns per tile count. Four are 2 × 2 below `lg` — four with icons are too narrow for "How
 * you take part" between 768 and ~900 — and one row from `lg`. Three are one row. One or two
 * share the row below `lg`, and from `lg` keep the quarter-width tile, left-aligned: one tile
 * stretched across the card read like an alert banner.
 */
const STRIP_COLUMNS: Record<number, string> = {
  1: "grid-cols-1 lg:grid-cols-4",
  2: "grid-cols-2 lg:grid-cols-4",
  3: "grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

// The tile metrics, shared with the admin header's stat strip so the two strips match.
/** The grid columns for a strip of `count` tiles. */
export const stripColumns = (count: number): string =>
  STRIP_COLUMNS[count] ?? "";
export const TILE = "rounded-[14px] px-3.5 py-3";
export const TILE_LABEL = "text-gray-dark block text-xs";
export const TILE_VALUE =
  "font-nunito block text-[15px] leading-tight font-black text-black md:text-[17px]";

const FactTile: React.FC<{ fact: DetailFact }> = ({ fact }) => (
  <div
    className={`flex min-w-0 items-center gap-3 ${TILE} ${FACT_TONE[fact.id].tile}`}
  >
    {/* icons from `md` only: three tiles across 390 leave no room for them */}
    <span
      aria-hidden
      className={`hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-white md:flex ${FACT_TONE[fact.id].icon}`}
    >
      {FACT_ICON[fact.id]}
    </span>
    <span className="min-w-0">
      <span className={TILE_LABEL}>
        {fact.shortLabel ? (
          <>
            <span className="md:hidden">{fact.shortLabel}</span>
            <span className="hidden md:inline">{fact.label}</span>
          </>
        ) : (
          fact.label
        )}
      </span>
      <span className={TILE_VALUE}>{fact.value}</span>
    </span>
  </div>
);

/**
 * Reward · Effort · Ends / Starts · How you take part, as tinted tiles, and the spots left as a
 * caption. A fact the opportunity lacks drops out and the row reflows; nothing at all, no strip.
 */
const DetailFactStrip: React.FC<{ opportunity: OpportunityInfo }> = ({
  opportunity,
}) => {
  const facts = detailFacts(opportunity);
  const spotsLeft = spotsLeftLabel(opportunity);
  if (facts.length === 0 && !spotsLeft) return null;

  return (
    <div className="mt-5">
      {facts.length > 0 && (
        <div className={`grid gap-3 ${stripColumns(facts.length)}`}>
          {facts.map((fact) => (
            <FactTile key={fact.id} fact={fact} />
          ))}
        </div>
      )}
      {spotsLeft && <p className="text-gray-dark pt-2 text-xs">{spotsLeft}</p>}
    </div>
  );
};

/** The organisation's logo in a rounded square; the person placeholder without one. */
const LogoSquare: React.FC<{ url: string | null }> = ({ url }) => (
  <div
    className={`border-gray flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2 md:h-[76px] md:w-[76px] md:rounded-[20px] ${
      url ? "bg-white" : "bg-gray-light"
    }`}
  >
    {url ? (
      <Image
        src={url}
        alt="Company Logo"
        width={76}
        height={76}
        className="h-full w-full object-contain"
      />
    ) : (
      <IoMdPerson className="text-gray h-full w-full" />
    )}
  </div>
);

export const DetailHeaderCard: React.FC<{
  opportunity: OpportunityInfo;
  /** The host's header ref: the sticky bars appear once this card has scrolled away. */
  ref?: React.Ref<HTMLDivElement>;
  /** Host chips before the type chip (admin: the status chips). */
  leadingChips?: React.ReactNode;
  /** Host chips after the type chip (admin: the externally-managed badge). */
  trailingChips?: React.ReactNode;
  /** The host's actions, under the fact strip. */
  children?: React.ReactNode;
}> = ({ opportunity, ref, leadingChips, trailingChips, children }) => {
  const typeConfig = getTypeConfig(opportunity.type);
  // With host chips the row may not fit one line: it wraps, and org · location keeps at least
  // 12rem beside the chips or takes the next line. The public row (type chip only) is as it was.
  const hostChips = !!leadingChips || !!trailingChips;

  return (
    <div
      ref={ref}
      className="relative rounded-[20px] bg-white px-5 py-5 shadow-lg md:px-8 md:py-7"
    >
      <div className="grid grid-cols-[1fr_auto] gap-x-6">
        <div className="min-w-0">
          {/* md+: the chip and org · location on one line; below md the org row follows the title */}
          <div
            className={
              hostChips
                ? "flex min-w-0 flex-wrap items-center gap-2"
                : "flex min-w-0 items-center gap-2"
            }
          >
            {leadingChips}
            <OpportunityTypeBadge
              data={opportunity}
              className={`shrink-0 ${typeConfig.badgeClassName}`}
            />
            {trailingChips}
            {/* flex-1: the row's org name is capped at 60% of this box, so it must fill the line */}
            <div
              className={
                hostChips
                  ? "hidden min-w-0 flex-[1_1_12rem] md:block"
                  : "hidden min-w-0 flex-1 md:block"
              }
            >
              <OpportunityOrgCountriesRow data={opportunity} />
            </div>
          </div>
          <h4 className="font-nunito mt-2 line-clamp-2 text-[24px] leading-tight font-black text-black md:text-[32px]">
            {opportunity.title}
          </h4>
          <div className="mt-1.5 md:hidden">
            <OpportunityOrgCountriesRow data={opportunity} />
          </div>
        </div>
        <LogoSquare url={opportunity.organizationLogoURL} />
      </div>

      <DetailFactStrip opportunity={opportunity} />

      {children}
    </div>
  );
};
