import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { IoMdPerson } from "react-icons/io";
import {
  IoCalendarOutline,
  IoChevronDown,
  IoChevronUp,
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
import { clampHidesText, lineHeightPx } from "./lineClamp";

// ─────────────────────────────────────────────────────────────────────────────
// The TABBED layout's header card (round 10, claude.design P2, 2026-10-02):
// what it is (type chip, org · location) → the title → the facts → the host's
// actions, with the organisation's logo square at the top right. The classic
// header in `OpportunityPublicDetails` is untouched — this card replaces it only
// when the layout is tabbed — and so are `AvatarImage` and `ZltoRewardBadge`:
// the logo square and the Reward tile are drawn here.
//
// Below `md` (2026-10-06) the logo joins the type chip's row, so the title and
// the organisation line take the card's full width.
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

// The tile metrics, shared with the admin header's stat strip so the two strips match. Below
// 360px three tiles leave ~52px for a value: less padding and a 14px value make room for
// "months", "minutes" or "Ongoing", and a word that still can't fit breaks rather than
// overflowing its tile (320 is the minimum width, 2026-10-05).
/** The grid columns for a strip of `count` tiles. */
export const stripColumns = (count: number): string =>
  STRIP_COLUMNS[count] ?? "";
export const TILE = "rounded-[14px] px-3.5 py-3 max-[359px]:px-2";
export const TILE_LABEL = "text-gray-dark block text-xs";
export const TILE_VALUE =
  "font-nunito block text-[15px] leading-tight font-black text-black max-[359px]:text-[14px] max-[359px]:wrap-break-word md:text-[17px]";

const FactTile: React.FC<{ fact: DetailFact }> = ({ fact }) => (
  <div
    className={`flex min-w-0 items-center gap-3 max-[359px]:items-start ${TILE} ${FACT_TONE[fact.id].tile}`}
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

/**
 * The organisation's logo in a rounded square; the person placeholder without one. 48px beside
 * the type chip below `md` (the height of the buttons below), 76px spanning the chip and title
 * rows from `md`.
 */
const LogoSquare: React.FC<{ url: string | null }> = ({ url }) => (
  <div
    className={`border-gray flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-1.5 md:row-span-3 md:h-[76px] md:w-[76px] md:rounded-[20px] md:p-2 ${
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

/**
 * The title, clamped at 4 lines below `md` and 2 from it, and "Show full title" when the clamp
 * actually hides text (the pattern of `ClampedDescription`). It is measured on the client, so for
 * a clamped title the toggle appears at hydration and moves what follows down, as the
 * description's does. After that (client-side navigation, the editor Preview) it is measured
 * before paint, so nothing shifts. Measured only while collapsed: open, nothing is clipped, so the
 * toggle stays until it is closed and measured again. Two grid cells, the title and the toggle.
 */
const DetailTitle: React.FC<{ title: string }> = ({ title }) => {
  const id = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el || expanded) return;
    const measure = (): void => {
      const style = getComputedStyle(el);
      const hides = clampHidesText(
        el.scrollHeight,
        el.clientHeight,
        lineHeightPx(style.lineHeight, style.fontSize),
      );
      // The toggle is about to go (closed after a wider window, or the window widened) while
      // focused: hand focus to the title rather than losing it to the page
      if (!hides && document.activeElement === toggleRef.current) el.focus();
      setClipped(hides);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // The web font can change the wrap without changing the clamped box's size. Guarded: an
    // error here would take the page down where the Font Loading API is missing
    let live = true;
    void document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [title, expanded]);

  return (
    <>
      {/* 24px below 390 (30px would break "Entrepreneurship" mid-word at 320), 30px to `md`,
          32px from it; a word wider than the line breaks rather than being clipped. Focusable
          from script only, for when the toggle goes while focused */}
      <h4
        id={id}
        ref={titleRef}
        tabIndex={-1}
        className={`font-nunito col-span-2 mt-3 text-xl leading-tight font-black wrap-break-word text-black focus:outline-none min-[390px]:text-2xl md:col-span-1 md:mt-2 md:text-[32px] ${
          expanded ? "" : "line-clamp-4 md:line-clamp-2"
        }`}
      >
        {title}
      </h4>
      {clipped && (
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((open) => !open)}
          className="text-green col-span-2 mt-1 inline-flex items-center gap-1 justify-self-start py-0.5 text-sm font-semibold md:col-span-1"
        >
          {expanded ? "Show less" : "Show full title"}
          {expanded ? (
            <IoChevronUp className="h-4 w-4" />
          ) : (
            <IoChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </>
  );
};

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
  // As `OpportunityOrgCountriesRow` lists them
  const countries =
    opportunity.countries
      ?.map((c) => c.name)
      .filter(Boolean)
      .join(", ") ?? null;

  return (
    <div
      ref={ref}
      className="relative rounded-[20px] bg-white px-5 py-5 shadow-lg md:px-8 md:py-7"
    >
      {/* One grid. Below md: the chip row and the logo share row 1, and the title, its toggle and
          the org line span both columns. From md: the logo spans rows 1–3 at the top right, and
          the empty third row absorbs whatever the chip row and title are shorter than it, so the
          title sits where it always has. The title's row is `min-content`, not `auto`: a clamped
          title clips its overflow, so as an `auto` row it would count as 0px tall when the logo's
          height is shared out, and the third row would take most of it. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 md:grid-rows-[auto_min-content_1fr] md:gap-x-6">
        {/* md+: the chip and org · location on one line; below md the org line follows the title.
            The public chip is centred on the 48px logo; host chips wrap, top-aligned */}
        <div
          className={
            hostChips
              ? "flex min-w-0 flex-wrap items-center gap-2"
              : "flex min-w-0 items-center gap-2 self-center md:self-start"
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
        <LogoSquare url={opportunity.organizationLogoURL} />
        {/* keyed: another opportunity starts collapsed */}
        <DetailTitle key={opportunity.id} title={opportunity.title} />
        {/* Below md, the header's own org line rather than the shared row: 16px, the full width
            (the shared row caps the name at 60%) and up to 2 lines */}
        <p className="col-span-2 mt-2 line-clamp-2 text-base font-semibold wrap-break-word text-black md:hidden">
          {opportunity.organizationName}
          {countries && (
            <span className="text-gray-dark text-sm font-normal">
              {" "}
              · {countries}
            </span>
          )}
        </p>
      </div>

      <DetailFactStrip opportunity={opportunity} />

      {children}
    </div>
  );
};
