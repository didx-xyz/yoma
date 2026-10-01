import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  IoAccessibilityOutline,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoConstructOutline,
  IoRibbonOutline,
  IoStarOutline,
  IoTimeOutline,
} from "react-icons/io5";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { getTypeConfig } from "~/components/Opportunity/opportunityTypeTheme";
import type { CardFactKind } from "../../lib/cardFacts";
import { cardFacts } from "../../lib/cardFacts";
import { cardStatus } from "../../lib/cardStatus";
import { detailHref } from "../../lib/detailHref";
import { moneyFactsOf } from "../../lib/money";
import { useCardDefinitions } from "../../state/useCardDefinitions";
import { useDiscovery } from "../../state/DiscoveryContext";
import { engagementDisplayName } from "../../state/useDiscoveryLookups";
import { MoneyBadge } from "./MoneyBadge";
import {
  typeBadgeClass,
  typeBandClass,
  typeButtonClass,
  typeLabel,
} from "./typeBadge";

export const FACT_ICONS: Record<CardFactKind, React.ElementType> = {
  employment: IoBriefcaseOutline,
  effort: IoTimeOutline,
  difficulty: IoStarOutline,
  tools: IoConstructOutline,
  date: IoCalendarOutline,
  accessibility: IoAccessibilityOutline,
  programme: IoRibbonOutline,
};

export const HIGHLIGHT_CLASSES = {
  urgent: "bg-pink text-white",
  featured: "bg-white text-purple",
} as const;

/**
 * The grid card (round 7, artboard 9a, 2026-09-30). Box discipline: FIXED height per breakpoint —
 * every slot reserves its lines, so a missing field leaves its slot empty and a row of cards
 * aligns; nothing grows the box.
 *
 * Band: the org logo centred on the type's tint, ONE highlight badge top-right (`cardStatus`).
 * Body, top to bottom: type chip + money (`lib/money.ts`) · title (2 lines) · org · place ·
 * engagement · summary (2 lines — restored; dropped on 2026-08-31) · up to two priority facts
 * (`lib/cardFacts.ts`) · status + places (`lib/cardStatus.ts`) · the type button.
 *
 * The type button is the card's ONLY link to the detail page (Jason, 2026-10-01 — the card body is
 * not clickable, as on the legacy cards). Its label is the type's existing CTA copy
 * (`getTypeConfig`), its colour the type chip's. Mobile keeps every field — a shorter band, the
 * facts on one line, status + places beside the button.
 */
export const OpportunityCard: React.FC<{
  opportunity: OpportunityInfo;
  now: Date;
}> = ({ opportunity, now }) => {
  const { lookups } = useDiscovery();
  const definitions = useCardDefinitions();
  const { closing, places, highlight } = cardStatus(opportunity, now);
  const facts = cardFacts(opportunity, definitions);
  // The most specific place the first country names — its city, else the country.
  const firstCountry = opportunity.countries?.[0];
  const location = firstCountry?.city ?? firstCountry?.name ?? null;
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
    <div className="shadow-custom flex h-71 flex-col overflow-hidden rounded-xl bg-white md:h-90">
      <div
        className={`relative flex h-12 shrink-0 items-center justify-center md:h-20 ${typeBandClass(opportunity.type)}`}
      >
        {opportunity.organizationLogoURL && (
          <Image
            src={opportunity.organizationLogoURL}
            alt=""
            width={48}
            height={48}
            className="h-9 w-9 rounded-full bg-white object-contain md:h-12 md:w-12"
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
        <div className="flex items-center justify-between gap-2">
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${typeBadgeClass(opportunity.type)}`}
          >
            {typeLabel(lookups.types, opportunity.type)}
          </span>
          <MoneyBadge
            compact
            facts={moneyFactsOf(opportunity, lookups.currencies)}
          />
        </div>
        <h3 className="line-clamp-2 h-10 text-sm leading-5 font-semibold tracking-normal md:h-11 md:text-base md:leading-5.5">
          {opportunity.title}
        </h3>
        {/* The org name gives way first, so a long one never pushes the place out of view */}
        <p className="text-gray-dark flex h-4 min-w-0 text-xs leading-4 whitespace-nowrap">
          <span className="min-w-0 truncate font-semibold text-black">
            {opportunity.organizationName}
          </span>
          {place && (
            <span className="max-w-[60%] shrink-0 truncate">{` · ${place}`}</span>
          )}
        </p>
        <p className="text-gray-dark line-clamp-2 h-8 text-xs leading-4">
          {opportunity.summary}
        </p>
        <ul className="text-gray-dark flex h-4 gap-3 overflow-hidden text-xs leading-4 md:h-8 md:flex-col md:gap-0">
          {facts.map((fact) => {
            const Icon = FACT_ICONS[fact.kind];
            return (
              <li key={fact.kind} className="flex min-w-0 items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{fact.text}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto flex items-center gap-3 md:flex-col md:items-stretch md:gap-1.5">
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
            className={`flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition hover:brightness-110 motion-reduce:transition-none md:w-full ${typeButtonClass(opportunity.type)}`}
          >
            {cta.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
};
