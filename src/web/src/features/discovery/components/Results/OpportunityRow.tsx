import Image from "next/image";
import Link from "next/link";
import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { getTypeConfig } from "~/components/Opportunity/opportunityTypeTheme";
import { cardFacts } from "../../lib/cardFacts";
import { cardStatus } from "../../lib/cardStatus";
import { detailHref } from "../../lib/detailHref";
import { moneyFactsOf } from "../../lib/money";
import { useCardDefinitions } from "../../state/useCardDefinitions";
import { useDiscovery } from "../../state/DiscoveryContext";
import { engagementDisplayName } from "../../state/useDiscoveryLookups";
import { HIGHLIGHT_CLASSES } from "./OpportunityCard";
import { LIST_COLUMNS } from "./listColumns";
import { MoneyBadge } from "./MoneyBadge";
import { typeBadgeClass, typeLabel, typeOutlineClass } from "./typeBadge";

/**
 * The compact-list row (round 7, artboard 9a, 2026-09-30) — the card's fields as aligned columns
 * on desktop (`LIST_COLUMNS`): tile · type · title + highlight badge over org · summary · money ·
 * where · key fact · status · places · the type button in outline. Same sources as the card:
 * `lib/money.ts`, `lib/cardFacts.ts`, `lib/cardStatus.ts`.
 *
 * Mobile is a two-line row — title, then type chip · money · place — with the status on the
 * right; the summary, facts and button stay on the card and the detail page.
 */
export const OpportunityRow: React.FC<{
  opportunity: OpportunityInfo;
  now: Date;
}> = ({ opportunity, now }) => {
  const { lookups } = useDiscovery();
  const definitions = useCardDefinitions();
  // Same status rule as the grid card (`lib/cardStatus.ts`): a closed opportunity says so.
  const { closing, places, highlight } = cardStatus(opportunity, now);
  const closesClass = closing.urgent
    ? "font-semibold text-pink"
    : "text-gray-dark";
  const money = moneyFactsOf(opportunity, lookups.currencies);
  const fact = cardFacts(opportunity, definitions)[0] ?? null;
  const type = typeLabel(lookups.types, opportunity.type);
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
  const where = [location, engagement].filter(Boolean).join(" · ");
  const hasMoney =
    (money.zltoReward ?? 0) > 0 ||
    money.salary !== null ||
    money.partnerIncentive !== null ||
    money.isPaid === true;

  const tile = (
    <span
      className={`${LIST_COLUMNS.tile} bg-beige text-gray-dark flex h-10 items-center justify-center overflow-hidden rounded-full text-xs font-bold`}
    >
      {opportunity.organizationLogoURL ? (
        <Image
          src={opportunity.organizationLogoURL}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
      ) : (
        opportunity.organizationName.slice(0, 2).toUpperCase()
      )}
    </span>
  );
  const chip = (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${typeBadgeClass(opportunity.type)}`}
    >
      {type}
    </span>
  );

  return (
    <Link
      href={detailHref(opportunity.id)}
      className="shadow-custom block rounded-lg bg-white px-3 py-2 hover:shadow-lg"
    >
      {/* Desktop: one aligned line, widths from LIST_COLUMNS */}
      <div className="hidden items-center gap-3 text-sm md:flex">
        {tile}
        <span className={LIST_COLUMNS.badge}>{chip}</span>
        <span className={LIST_COLUMNS.title}>
          <span className="flex min-w-0 items-center gap-2">
            {/* Same title size as the grid card */}
            <span className="truncate text-sm font-semibold md:text-base">
              {opportunity.title}
            </span>
            {highlight && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${HIGHLIGHT_CLASSES[highlight.tone]} ${highlight.tone === "featured" ? "border-purple-tint border" : ""}`}
              >
                {highlight.label}
              </span>
            )}
          </span>
          <span className="text-gray-dark block truncate text-xs">
            <span className="font-semibold text-black">
              {opportunity.organizationName}
            </span>
            {opportunity.summary && ` · ${opportunity.summary}`}
          </span>
        </span>
        <span className={`${LIST_COLUMNS.money} truncate`}>
          {hasMoney ? <MoneyBadge compact facts={money} /> : "—"}
        </span>
        <span className={`${LIST_COLUMNS.where} text-gray-dark truncate`}>
          {where || "—"}
        </span>
        <span className={`${LIST_COLUMNS.fact} text-gray-dark truncate`}>
          {fact?.text ?? "—"}
        </span>
        <span className={`${LIST_COLUMNS.status} truncate ${closesClass}`}>
          {closing.label}
        </span>
        <span className={`${LIST_COLUMNS.places} text-gray-dark truncate`}>
          {places ?? "—"}
        </span>
        <span className={LIST_COLUMNS.action}>
          <span
            className={`flex h-9 items-center justify-center rounded-lg border bg-white px-3 text-xs font-semibold whitespace-nowrap ${typeOutlineClass(opportunity.type)}`}
          >
            {getTypeConfig(opportunity.type).ctaText}
          </span>
        </span>
      </div>

      {/* Mobile: title, then type chip · money · place; the status on the right */}
      <div className="flex items-center gap-3 md:hidden">
        {tile}
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="line-clamp-1 text-sm font-semibold">
            {opportunity.title}
          </span>
          <span className="flex min-w-0 items-center gap-2 text-xs">
            {chip}
            {hasMoney && (
              <span className="shrink-0 whitespace-nowrap">
                <MoneyBadge compact facts={money} />
              </span>
            )}
            {location && (
              <span className="text-gray-dark truncate">{location}</span>
            )}
          </span>
        </span>
        <span
          className={`shrink-0 text-right text-xs whitespace-nowrap ${closesClass}`}
        >
          {closing.label}
        </span>
      </div>
    </Link>
  );
};
