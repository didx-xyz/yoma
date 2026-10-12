import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import CustomCarouselV3 from "~/components/Carousel/CustomCarouselV3";
import { formatNumber } from "../../lib/format";
import type { LandingRail } from "../../lib/landingRails";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useInView, useRailResults } from "../../state/useRailResults";
import { OpportunityCard } from "../Results/OpportunityCard";
import { CardSkeleton } from "../Results/ResultSkeletons";
import { Message } from "../shared/Message";
import { railCopy } from "./railCopy";

/** Share of the rail on screen before its cards rise in. */
const REVEAL_THRESHOLD = 0.15;
const STAGGER_MS = 40;
/** Only the cards a youth can see when the rail arrives rise in; the rest are off to the side. */
const RISING_CARDS = 5;
/** How far ahead of the viewport a rail requests its first page, so it is rarely seen loading. */
const LOAD_AHEAD = "400px 0px";

/**
 * Scroller row, with top room for the card shadow (V3 forces the bottom room). Edge to edge on
 * phones through `BLEED_CLASS` on its wrapper, not on the scroller itself: the edge fades are
 * pinned to the wrapper, and on a bled scroller they sat 16px in, a band sliding over the cards
 * (2026-10-08). `from-gray-light` is the page behind the rails, so the fades show.
 */
const BLEED_CLASS = "-mx-4 sm:mx-0";
const SCROLLER_CLASS = "flex gap-3 px-4 pt-2 scroll-px-4 sm:px-1";

/**
 * One landing rail (`landingRails`, 2026-10-07): our header over `CustomCarouselV3`, which pages
 * sideways through the rail's ONE search (`useRailResults`), never a request per card.
 *
 * - The header renders at once from the catalogue; "See all N →" fades in when the count
 *   arrives, in room reserved for it (`min-w-24`), so the title never rewraps. With
 *   `seeAllExact` false the link has no number; with no query string, no link.
 * - The body reserves the scroller's exact height (card + 8px top + 12px bottom) and says
 *   card skeletons until page 1 arrives. The first page is requested ~400px before the rail
 *   reaches the viewport, so that is rarely on screen.
 * - A failed rail keeps its header and says so, with a Retry; so does a failed sideways page, at
 *   the row's end. An empty one collapses: loading starts early, so that almost always happens
 *   below the fold.
 * - The first time the loaded rail is 15% on screen its first five cards rise 8px in sequence,
 *   once (a 150ms fade under reduced motion); until then they are transparent. Cards appended by
 *   sideways loading just appear.
 *
 * Cards: 290px on phones, 272px at 320 so the next one visibly peeks; 288px from `sm`, where 1440
 * shows four and the 5th peeking. That peek, the edge fades and drag are the sideways affordance
 * (V3 draws no scrollbar since 2026-10-08).
 */
export const DiscoveryRail: React.FC<{
  rail: LandingRail;
  /** Picked for you's nameable values ("Job · Technology, AI & Data +7 others"); `""` for none. */
  tunedTo: string;
  now: Date;
}> = ({ rail, tunedTo, now }) => {
  const { title, subtitle } = railCopy(rail, tunedTo);
  const router = useRouter();
  const { scrollToResults } = useDiscovery();
  // See all lands on the results, not the top of the page (2026-10-09, Jason): once the route
  // has changed, the results heading scrolls into view (`scrollToResults` waits for it).
  const jumpToResults = (): void => {
    const done = (): void => {
      router.events.off("routeChangeComplete", done);
      scrollToResults();
    };
    router.events.on("routeChangeComplete", done);
  };
  const headingId = useId();

  // The section, or the sentinel a collapsed rail leaves: whichever is mounted is watched.
  const sectionRef = useRef<HTMLElement | null>(null);
  const { ref: inViewRef, inView } = useInView({ rootMargin: LOAD_AHEAD });
  const setSection = useCallback(
    (element: HTMLElement | null) => {
      sectionRef.current = element;
      inViewRef(element);
    },
    [inViewRef],
  );
  const { results, failed, retry, loadData } = useRailResults(rail, inView);
  const items: OpportunityInfo[] | null = results?.items ?? null;
  const drawn = items !== null && items.length > 0;

  const [revealed, setRevealed] = useState(false);
  // Keyed on `drawn`: the cards only exist once page 1 has some.
  useEffect(() => {
    const section = sectionRef.current;
    if (!drawn || !section || revealed) return;
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

  // Empty: collapse, header and all (as an empty rail always has). A zero-height sentinel stays,
  // so a rail that mounts on a cached empty page 1 is still watched, and refreshes once in view.
  // Its negative margin cancels the landing's gap (`gap-8 md:gap-10`), so it takes no room.
  if (!failed && items !== null && items.length === 0)
    return <div ref={setSection} aria-hidden className="-mt-8 h-0 md:-mt-10" />;

  const total = results?.totalCount ?? null;
  // A CSS id: the rail ids carry a colon (`category:<id>`).
  const carouselId = `discovery-rail-${rail.id.replace(/[^\w-]/g, "-")}`;

  return (
    <section ref={setSection} aria-labelledby={headingId}>
      <div className="pb-1">
        <div className="flex items-start justify-between gap-3">
          <h2
            id={headingId}
            className="font-nunito flex min-w-0 items-start gap-2 text-base font-black tracking-normal md:text-lg"
          >
            {rail.kind === "category" && rail.category.imageURL && (
              // The category's own badge, as Browse by category draws it: never tinted.
              <Image
                src={rail.category.imageURL}
                alt=""
                width={20}
                height={20}
                className="mt-0.5 h-5 w-5 shrink-0 md:mt-1"
              />
            )}
            <span className="line-clamp-2">{title}</span>
          </h2>
          {/* An empty query string is the landing itself, never the set the rail shows. */}
          {rail.seeAllQueryString !== "" && (
            <span className="min-w-24 shrink-0 text-right leading-6 md:leading-7">
              {results !== undefined &&
                (!rail.seeAllExact || total !== null) && (
                  <Link
                    href={`/opportunities/discover?${rail.seeAllQueryString}`}
                    scroll={false}
                    onClick={jumpToResults}
                    className="text-green text-xs font-semibold whitespace-nowrap motion-safe:animate-[fade-in_150ms_ease-out] md:text-sm"
                  >
                    {rail.seeAllExact && total !== null
                      ? `See all ${formatNumber(total)} →`
                      : "See all →"}
                  </Link>
                )}
            </span>
          )}
        </div>
        <p className="text-gray-dark line-clamp-2 text-sm">{subtitle}</p>
      </div>
      {failed ? (
        <Message kind="error" className="mt-2">
          Couldn&apos;t load these.{" "}
          <button
            type="button"
            onClick={retry}
            className="font-semibold underline"
          >
            Retry
          </button>
        </Message>
      ) : items !== null && drawn ? (
        // Not a tab stop: each card's one link scrolls into view when tabbed to.
        <div className={BLEED_CLASS}>
          <CustomCarouselV3
            id={carouselId}
            data={items}
            loadData={loadData}
            scrollerClassName={SCROLLER_CLASS}
            shadowFromClassName="from-gray-light"
            renderLoadFailed={(retryLoad) => (
              <Message kind="error" className="w-56">
                Couldn&apos;t load more.{" "}
                <button
                  type="button"
                  onClick={retryLoad}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </Message>
            )}
            renderSlide={(item: OpportunityInfo, index: number) => {
              const rises = index < RISING_CARDS;
              return (
                <div
                  style={
                    revealed && rises
                      ? ({
                          "--rise-delay": `${index * STAGGER_MS}ms`,
                        } as React.CSSProperties)
                      : undefined
                  }
                  className={`w-[min(18.125rem,calc(100vw-3rem))] sm:w-72 ${
                    !rises
                      ? ""
                      : revealed
                        ? "motion-safe:animate-[rise-in_240ms_ease-out_both] motion-safe:[animation-delay:var(--rise-delay)] motion-reduce:animate-[fade-in_150ms_ease-out_both]"
                        : "opacity-0 print:opacity-100"
                  }`}
                >
                  <OpportunityCard opportunity={item} now={now} />
                </div>
              );
            }}
          />
        </div>
      ) : (
        // The scroller's exact height, so nothing below jumps when the cards arrive: the card and
        // V3's 8px top and 12px bottom room (it draws no scrollbar). Card skeletons in the
        // cards' own widths and spacing (2026-10-09, Jason), clipped like the row they become.
        <div className={`${BLEED_CLASS} overflow-hidden`}>
          <div className={`${SCROLLER_CLASS} pb-3`}>
            <span className="sr-only">Searching…</span>
            {Array.from({ length: 5 }, (_, index) => (
              <CardSkeleton
                key={index}
                className="w-[min(18.125rem,calc(100vw-3rem))] shrink-0 sm:w-72"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
