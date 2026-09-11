import Image from "next/image";
import Link from "next/link";
import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { closingInfo } from "../../lib/dates";
import { MoneyBadge } from "./MoneyBadge";
import { typeBadgeClass } from "./typeBadge";

/**
 * The grid card. Box discipline: FIXED height per breakpoint — content never grows the box, a
 * missing field leaves its slot empty, the title clamps to two lines and the footer row is
 * pinned to the bottom so a row of cards with different title lengths still aligns. Any future
 * per-type layout must share this box.
 *
 * Field set (2026-08-31 revision §7): type badge + reward · title · location + engagement (one
 * meta line) · up to two skill chips + a "+N" counter · due date (urgency inside seven days,
 * the one rule in `lib/dates.ts`) · participant places. Both
 * `participantLimit` and `participantCountTotal` are exposed on `OpportunityInfo`, so
 * "X of Y places left" renders from exposed fields only.
 */
const placesLeft = (opportunity: OpportunityInfo): string | null => {
  if (opportunity.participantLimit === null) return null;
  const left = Math.max(
    0,
    opportunity.participantLimit - opportunity.participantCountTotal,
  );
  return `${left} of ${opportunity.participantLimit} places left`;
};

export const OpportunityCard: React.FC<{
  opportunity: OpportunityInfo;
  now: Date;
}> = ({ opportunity, now }) => {
  const closing = closingInfo(opportunity.dateEnd, now);
  const skills = opportunity.skills ?? [];
  const location = opportunity.countries?.[0]?.name ?? null;
  const engagement =
    typeof opportunity.engagementType === "string"
      ? opportunity.engagementType
      : null;
  const meta = [location, engagement].filter(Boolean).join(" · ");
  const places = placesLeft(opportunity);

  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="shadow-custom flex h-64 flex-col overflow-hidden rounded-xl bg-white transition hover:shadow-lg motion-reduce:transition-none md:h-72"
    >
      <div className="bg-beige flex h-16 shrink-0 items-center justify-center md:h-20">
        {opportunity.organizationLogoURL && (
          <Image
            src={opportunity.organizationLogoURL}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-contain"
          />
        )}
      </div>
      <div className="flex grow flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${typeBadgeClass(opportunity.type)}`}
          >
            {opportunity.type}
          </span>
          <MoneyBadge
            compact
            facts={{
              zltoReward: opportunity.zltoReward,
              salary: null, // pending YOM-1264 — see lib/money.ts
              partnerIncentive: null,
              isPaid: null,
            }}
          />
        </div>
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold tracking-normal md:text-base">
          {opportunity.title}
        </h3>
        {meta && <p className="text-gray-dark truncate text-xs">{meta}</p>}
        {skills.length > 0 && (
          <p className="flex items-center gap-1 overflow-hidden">
            {skills.slice(0, 2).map((skill) => (
              <span
                key={skill.id}
                className="bg-gray-light max-w-28 truncate rounded-full px-2 py-0.5 text-[10px]"
              >
                {skill.name}
              </span>
            ))}
            {skills.length > 2 && (
              <span className="text-gray-dark text-[10px]">
                +{skills.length - 2}
              </span>
            )}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
          <span
            className={
              closing.urgent ? "text-pink font-semibold" : "text-gray-dark"
            }
          >
            {closing.label}
          </span>
          {places && <span className="text-gray-dark truncate">{places}</span>}
        </div>
      </div>
    </Link>
  );
};
