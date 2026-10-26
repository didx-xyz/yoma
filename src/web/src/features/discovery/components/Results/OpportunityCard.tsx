import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import {
  IoAccessibilityOutline,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoBulbOutline,
  IoConstructOutline,
  IoLanguageOutline,
  IoRibbonOutline,
  IoStarOutline,
  IoTimeOutline,
} from "react-icons/io5";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { getTypeConfig } from "~/components/Opportunity/opportunityTypeTheme";
import type { CardFact, CardFactKind } from "../../lib/cardFacts";
import { cardFacts } from "../../lib/cardFacts";
import { cardStatus } from "../../lib/cardStatus";
import { detailHref } from "../../lib/detailHref";
import { cardPlace } from "../../lib/location";
import { moneyFactsOf } from "../../lib/money";
import { useCardDefinitions } from "../../state/useCardDefinitions";
import { useDiscovery } from "../../state/DiscoveryContext";
import { engagementDisplayName } from "../../state/useDiscoveryLookups";
import { MoneyBadge } from "./MoneyBadge";
import {
  CARD_ACTION_CLASS,
  CARD_BAND_CLASS,
  CARD_CHIP_CLASS,
  CARD_LOGO_CLASS,
  CARD_TITLE_CLASS,
} from "~/lib/card";
import { typeBadgeClass, typeBandClass, typeLabel } from "~/lib/typeColours";

export const FACT_ICONS: Record<CardFactKind, React.ElementType> = {
  employment: IoBriefcaseOutline,
  effort: IoTimeOutline,
  difficulty: IoStarOutline,
  tools: IoConstructOutline,
  date: IoCalendarOutline,
  accessibility: IoAccessibilityOutline,
  programme: IoRibbonOutline,
  languages: IoLanguageOutline,
  skills: IoBulbOutline,
};

export const HIGHLIGHT_CLASSES = {
  urgent: "bg-pink text-white",
  featured: "bg-white text-purple",
} as const;

/**
 * One card fact. The whole fact is the tooltip's trigger, so a tap works on touch, where there
 * is no hover: tap to open, tap again or anywhere else to close. A mouse hover and keyboard focus
 * show it too. It names the fact and gives the whole value, which the card may truncate.
 *
 * The tooltip is anchored to the fact GRID, not the fact (2026-10-07): the `ul` is the positioned
 * box, so it sits above the whole grid (never over another fact) and, the grid spanning the
 * card's content width, it can never leave the card. Column 1 aligns left, column 2 right; there
 * is no arrow, which could not point at a column-2 fact without measuring.
 */
const FactItem: React.FC<{
  fact: CardFact;
  alignEnd: boolean;
  shown: boolean;
  open: boolean;
  on: (
    event: "toggle" | "hover" | "unhover" | "focus" | "blur" | "escape",
  ) => void;
}> = ({ fact, alignEnd, shown, open, on }) => {
  const Icon = FACT_ICONS[fact.kind];
  return (
    <li className="min-w-0">
      <button
        type="button"
        // Leads with the visible text (WCAG 2.5.3, `cardFacts`).
        aria-label={fact.label}
        aria-expanded={open}
        onClick={() => on("toggle")}
        // A mouse only: a tap's emulated hover would keep the tooltip up after a second tap.
        onPointerEnter={(e) => e.pointerType === "mouse" && on("hover")}
        onPointerLeave={(e) => e.pointerType === "mouse" && on("unhover")}
        onFocus={(e) =>
          e.currentTarget.matches(":focus-visible") && on("focus")
        }
        onBlur={() => on("blur")}
        // Dismissable without moving the pointer or focus (WCAG 1.4.13).
        onKeyDown={(e) => e.key === "Escape" && on("escape")}
        className="flex w-full min-w-0 items-center gap-1.5 rounded text-left"
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-semibold">{fact.text}</span>
      </button>
      {shown && (
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-full z-20 mb-2 block w-max max-w-full rounded-lg bg-black px-3 py-2 wrap-break-word whitespace-normal shadow-lg motion-safe:animate-[fade-in_120ms_ease-out] ${
            alignEnd ? "right-0" : "left-0"
          }`}
        >
          <span className="text-gray block text-[11px] leading-4 font-semibold tracking-wide uppercase">
            {fact.name}
          </span>
          <span className="line-clamp-3 text-sm leading-5 font-semibold text-white">
            {fact.value}
          </span>
        </span>
      )}
    </li>
  );
};

/**
 * The fact grid: two equal columns, two rows, reserved whether filled or not, with 6px between
 * the rows and a little room above and below (2026-10-08). A long fact truncates; its tooltip
 * gives it whole. Not `overflow-hidden`: the tooltips rise out of it, anchored here (`relative`) rather than on
 * their fact, so they stay inside the card. They all share that one spot, so at most ONE shows:
 * the tapped one, else the hovered one, else the keyboard-focused one. Focus leaving a tapped
 * fact closes it, as does a tap anywhere outside the grid; Escape closes any.
 */
const FactList: React.FC<{ facts: CardFact[] }> = ({ facts }) => {
  const [open, setOpen] = useState<CardFactKind | null>(null);
  const [hovered, setHovered] = useState<CardFactKind | null>(null);
  const [focused, setFocused] = useState<CardFactKind | null>(null);
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent): void => {
      if (!ref.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const shown = open ?? hovered ?? focused;

  return (
    <ul
      ref={ref}
      className="text-gray-dark relative my-1 grid h-9.5 shrink-0 grid-cols-2 grid-rows-2 gap-x-3 gap-y-1.5 text-xs leading-4"
    >
      {facts.map((fact, index) => (
        <FactItem
          key={fact.kind}
          fact={fact}
          alignEnd={index % 2 === 1}
          shown={shown === fact.kind}
          open={open === fact.kind}
          on={(event) => {
            const mine = (current: CardFactKind | null) =>
              current === fact.kind ? null : current;
            if (event === "toggle")
              setOpen((current) => (current === fact.kind ? null : fact.kind));
            else if (event === "hover") setHovered(fact.kind);
            else if (event === "unhover") setHovered(mine);
            else if (event === "focus") setFocused(fact.kind);
            else if (event === "escape") {
              setOpen(null);
              setHovered(null);
              setFocused(null);
            } else {
              setFocused(mine);
              setOpen(mine);
            }
          }}
        />
      ))}
    </ul>
  );
};

/**
 * The grid card (round 7, artboard 9a, 2026-09-30). Box discipline: FIXED height per breakpoint —
 * every slot reserves its lines, so a missing field leaves its slot empty and a row of cards
 * aligns; nothing grows the box.
 *
 * Band: the org logo centred on the type's tint, ONE highlight badge top-right (`cardStatus`).
 * Body, top to bottom: type chip + money (`lib/money.ts`) · title (2 lines) · org · place ·
 * engagement · summary (2 lines — restored; dropped on 2026-08-31) · up to four priority facts
 * in two columns (`lib/cardFacts.ts`; four since 2026-10-07) · status + places
 * (`lib/cardStatus.ts`) · the type button.
 *
 * The type button is the card's ONLY link to the detail page (Jason, 2026-10-01 — the card body is
 * not clickable, as on the legacy cards). Its label is the type's existing CTA copy
 * (`getTypeConfig`), its colour the type chip's. Mobile keeps every field — a shorter band,
 * status + places beside the button.
 */
export const OpportunityCard: React.FC<{
  opportunity: OpportunityInfo;
  now: Date;
}> = ({ opportunity, now }) => {
  const { lookups, effectiveFilters } = useDiscovery();
  const definitions = useCardDefinitions();
  const { closing, places, highlight } = cardStatus(opportunity, now);
  const facts = cardFacts(
    opportunity,
    definitions,
    now,
    effectiveFilters.accommodations.length > 0,
  );
  // The first country's city, else its name; a Worldwide one names where its provider is based.
  const location = cardPlace(opportunity);
  const engagement =
    typeof opportunity.engagementType === "string"
      ? engagementDisplayName(
          lookups.engagementTypes,
          opportunity.engagementType,
          "name",
        )
      : null;
  const place = [location, engagement].filter(Boolean).join(" · ");

  const cta = getTypeConfig(opportunity.type);

  return (
    <div className="shadow-custom flex h-74 flex-col overflow-hidden rounded-xl bg-white md:h-88.5">
      <div
        className={`${CARD_BAND_CLASS} relative ${typeBandClass(opportunity.type)}`}
      >
        {opportunity.organizationLogoURL && (
          <Image
            src={opportunity.organizationLogoURL}
            alt=""
            width={48}
            height={48}
            // straight from storage, like `AvatarImage`: the optimizer path failed on Stage
            unoptimized
            className={CARD_LOGO_CLASS}
          />
        )}
        {highlight && (
          <span
            className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-sm ${HIGHLIGHT_CLASSES[highlight.tone]}`}
          >
            {highlight.label}
          </span>
        )}
      </div>
      <div className="flex min-h-0 grow flex-col gap-1.5 p-3">
        {/* Every row below is a fixed height and never shrinks: the card is a fixed height, and a
            clipped (`line-clamp`) row would otherwise give way first and cut its text (2026-10-08). */}
        <div className="flex h-5 shrink-0 items-center justify-between gap-2">
          <span
            className={`${CARD_CHIP_CLASS} ${typeBadgeClass(opportunity.type)}`}
          >
            {typeLabel(lookups.types, opportunity.type)}
          </span>
          <MoneyBadge
            compact
            facts={moneyFactsOf(opportunity, lookups.currencies)}
          />
        </div>
        <h3 className={CARD_TITLE_CLASS}>{opportunity.title}</h3>
        {/* The org name gives way first, so a long one never pushes the place out of view */}
        <p className="text-gray-dark flex h-4 min-w-0 shrink-0 text-xs leading-4 whitespace-nowrap">
          <span className="min-w-0 truncate font-semibold text-black">
            {opportunity.organizationName}
          </span>
          {place && (
            <span className="max-w-[60%] shrink-0 truncate">{` · ${place}`}</span>
          )}
        </p>
        <p className="text-gray-dark line-clamp-2 h-8 shrink-0 text-xs leading-4">
          {opportunity.summary}
        </p>
        <FactList facts={facts} />
        <div className="mt-auto flex shrink-0 items-center gap-3 md:flex-col md:items-stretch md:gap-1.5">
          <div className="flex min-w-0 grow flex-col text-xs leading-4 md:flex-row md:items-center md:justify-between md:gap-2">
            <span
              className={`truncate ${
                closing.urgent ? "text-pink font-semibold" : "text-gray-dark"
              }`}
            >
              {closing.label}
            </span>
            {places && (
              <span className="text-gray-dark truncate">{places}</span>
            )}
          </div>
          <Link
            href={detailHref(opportunity.id)}
            title={cta.ctaTitle}
            className={`${CARD_ACTION_CLASS} shrink-0 md:w-full ${typeBadgeClass(opportunity.type)}`}
          >
            {cta.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
};
