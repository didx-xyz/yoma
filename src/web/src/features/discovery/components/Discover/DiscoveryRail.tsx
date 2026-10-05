import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { formatNumber } from "../../lib/format";
import type { DiscoverySearch } from "../../lib/preferenceMapping";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useDiscoveryResults } from "../../state/useDiscoveryResults";
import { OpportunityCard } from "../Results/OpportunityCard";

/** Share of the rail on screen before its cards rise in. */
const REVEAL_THRESHOLD = 0.15;
const STAGGER_MS = 40;

/**
 * One landing rail — a titled row of cards over a search (`composeSearch`, or `manualSearch` for a
 * rail that ignores preferences) in the default order, with "See all N" navigating to the same
 * set as a real search (the URL is the state, so a rail is just a saved query).
 *
 * Round 10 (2026-10-02): below `sm` the row is a sideways snap scroller (290px cards, the next one
 * peeking), a plain `div` because `ScrollableContainer`'s drag handler fights snapping; from `sm`
 * it is the 2-column grid, 4 from `lg`. The first time a rail is 15% on screen its cards rise 8px
 * in sequence, once — a 150ms fade with no stagger under reduced motion. Until then they are
 * transparent, so no frame shows them before the rise begins.
 */
export const DiscoveryRail: React.FC<{
  title: string;
  subtitle: string;
  search: DiscoverySearch;
  /**
   * `search` is the surface's own (`useDiscovery().search`), preference layer and all, so it waits
   * on the surface's gate (`searchReady`) too.
   */
  personalized?: boolean;
  /** `""` (a search no URL can carry apart from the landing itself) draws no See all. */
  seeAllQueryString: string;
  now: Date;
}> = ({
  title,
  subtitle,
  search,
  personalized = false,
  seeAllQueryString,
  now,
}) => {
  const { lookups, ready, searchReady } = useDiscovery();
  const { results } = useDiscoveryResults(
    search,
    "newest",
    1,
    lookups,
    personalized ? searchReady : ready && lookups.searchReady,
  );
  const items = results?.items.slice(0, 4) ?? [];
  const drawn = items.length > 0;

  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Keyed on `drawn`: the section only exists once the rail has cards to show.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || revealed) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.intersectionRatio >= REVEAL_THRESHOLD)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: REVEAL_THRESHOLD },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [drawn, revealed]);

  if (!drawn) return null;

  return (
    <section ref={sectionRef}>
      <div className="pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-nunito text-base font-black tracking-normal md:text-lg">
            {title}
          </h2>
          {/* An empty query string is the landing itself, never the set the rail shows. */}
          {seeAllQueryString !== "" &&
            results?.totalCount !== null &&
            results !== undefined && (
              <Link
                href={`/opportunities/discover?${seeAllQueryString}`}
                className="text-green shrink-0 text-xs font-semibold whitespace-nowrap md:text-sm"
              >
                See all {formatNumber(results.totalCount)} →
              </Link>
            )}
        </div>
        <p className="text-gray-dark text-sm">{subtitle}</p>
      </div>
      {/* A labelled region, not a tab stop: it scrolls only below `sm`, and there each card's
          one link scrolls into view in the snap row when tabbed to. The scrollbar is hidden
          inline: the global unlayered `* { scrollbar-width: thin }` outranks utilities. A
          scroller clips on both axes, so `-my-2 py-2` gives the cards' shadow room without
          changing the rail's height. */}
      <div
        role="region"
        aria-label={title}
        style={{ scrollbarWidth: "none" }}
        className="-mx-4 -my-2 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 py-2 sm:m-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:p-0 lg:grid-cols-4"
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            style={
              revealed
                ? ({
                    "--rise-delay": `${i * STAGGER_MS}ms`,
                  } as React.CSSProperties)
                : undefined
            }
            className={`w-72.5 shrink-0 snap-start sm:w-auto ${
              revealed
                ? "motion-safe:animate-[rise-in_240ms_ease-out_both] motion-safe:[animation-delay:var(--rise-delay)] motion-reduce:animate-[fade-in_150ms_ease-out_both]"
                : "opacity-0 print:opacity-100"
            }`}
          >
            <OpportunityCard opportunity={item} now={now} />
          </div>
        ))}
      </div>
    </section>
  );
};
