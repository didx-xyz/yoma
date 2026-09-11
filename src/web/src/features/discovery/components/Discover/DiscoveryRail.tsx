import Link from "next/link";
import React from "react";
import { formatNumber } from "../../lib/format";
import type { DiscoveryFilters } from "../../lib/types";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useDiscoveryResults } from "../../state/useDiscoveryResults";
import { OpportunityCard } from "../Results/OpportunityCard";

/**
 * One landing rail — a titled row of cards over a filter set, with "See all N" navigating to the
 * same set as a real search (the URL is the state, so a rail is just a saved query).
 */
export const DiscoveryRail: React.FC<{
  title: string;
  subtitle: string;
  filters: DiscoveryFilters;
  seeAllQueryString: string;
  now: Date;
}> = ({ title, subtitle, filters, seeAllQueryString, now }) => {
  const { lookups, ready } = useDiscovery();
  const { results } = useDiscoveryResults(
    filters,
    1,
    lookups.typeIdByName,
    ready && lookups.types.length > 0,
  );
  const items = results?.items.slice(0, 4) ?? [];
  if (items.length === 0) return null;

  return (
    <section>
      <div className="pb-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold tracking-normal md:text-lg">
            {title}
          </h2>
          {results?.totalCount !== null && results !== undefined && (
            <Link
              href={`/opportunities/discover?${seeAllQueryString}`}
              className="text-green shrink-0 text-xs font-semibold whitespace-nowrap md:text-sm"
            >
              See all {formatNumber(results.totalCount)} →
            </Link>
          )}
        </div>
        <p className="text-gray-dark text-xs">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <OpportunityCard key={item.id} opportunity={item} now={now} />
        ))}
      </div>
    </section>
  );
};
