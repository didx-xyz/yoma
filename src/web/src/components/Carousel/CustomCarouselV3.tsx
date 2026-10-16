import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";

const CustomCarouselV3: React.FC<{
  [id: string]: any;
  title?: string;
  subtitle?: string;
  description?: string;
  /** Override for the outer container (e.g. purple gradient/border). Defaults to a plain container. */
  className?: string;
  /** Optional section badge text (e.g. "Jobs · New"). Omit for a plain header. */
  badgeText?: string;
  /** Optional icon rendered inside the section badge. */
  badgeIcon?: React.ReactNode;
  /** Override for the section badge colour. Defaults to solid purple. */
  badgeClassName?: string;
  /** Sub-text shown after the title (e.g. "123 jobs available"). Omit to hide. */
  subTextAvailable?: string;
  viewAllUrl?: string;
  /** Text for the "view all" link. Defaults to "See All →". */
  viewAllText?: string;
  data: any[];
  renderSlide: (item: any, index: number) => React.ReactElement;
  loadData?: (startRow: number) => Promise<any>;
  /** Classes for the scrolling row. Defaults to `"flex gap-3"`. */
  scrollerClassName?: string;
  /**
   * The edge fades' `from-*` class: the colour behind the carousel (e.g. `from-gray-light`).
   * Omitted, `ScrollableContainer`'s near-invisible default.
   */
  shadowFromClassName?: string;
  /**
   * Drawn at the end of the row when `loadData` resolves `{ failed: true }`, with a `retry` that
   * loads again. Omitted, a failed load ends the paging, as an empty one does.
   */
  renderLoadFailed?: (retry: () => void) => React.ReactNode;
}> = ({
  id,
  title,
  subtitle,
  description,
  className = "",
  badgeText,
  badgeIcon,
  badgeClassName = "bg-purple text-white",
  subTextAvailable,
  viewAllUrl,
  viewAllText = "See All →",
  data,
  renderSlide,
  loadData,
  scrollerClassName = "flex gap-3",
  shadowFromClassName,
  renderLoadFailed,
}) => {
  const [slides, setSlides] = useState(data);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadFailedRef = useRef(false);
  const renderLoadFailedRef = useRef(renderLoadFailed);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const slidesLengthRef = useRef(data.length);
  const loadDataRef = useRef(loadData);

  useEffect(() => {
    slidesLengthRef.current = slides.length;
  }, [slides.length]);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);
  useEffect(() => {
    renderLoadFailedRef.current = renderLoadFailed;
  }, [renderLoadFailed]);

  // Reset when parent data changes (e.g. country scope toggle)
  useEffect(() => {
    setSlides(data);
    hasMoreRef.current = true;
    loadingRef.current = false;
    loadFailedRef.current = false;
    setLoadFailed(false);
  }, [data]);

  const checkAndLoad = useCallback(() => {
    if (
      !loadDataRef.current ||
      loadingRef.current ||
      !hasMoreRef.current ||
      loadFailedRef.current
    )
      return;

    loadingRef.current = true;
    loadDataRef.current(slidesLengthRef.current + 1).then((result) => {
      if (result?.failed && renderLoadFailedRef.current) {
        // Held until the youth retries: the sentinel must not retry on its own.
        loadFailedRef.current = true;
        loadingRef.current = false;
        setLoadFailed(true);
      } else if (!result?.items?.length) {
        hasMoreRef.current = false;
        loadingRef.current = false;
      } else {
        setSlides((prev) => [...prev, ...result.items]);
        // After DOM updates, re-check if sentinel is still visible (viewport wider than content)
        requestAnimationFrame(() => {
          loadingRef.current = false;
          const sentinel = sentinelRef.current;
          const inner = wrapperRef.current?.querySelector<HTMLDivElement>(
            ":scope > div > div:first-child",
          );
          if (sentinel && inner) {
            const sentinelRect = sentinel.getBoundingClientRect();
            const innerRect = inner.getBoundingClientRect();
            if (sentinelRect.left < innerRect.right) checkAndLoad();
          }
        });
      }
    });
  }, []); // stable — reads everything via refs

  const retryLoad = useCallback(() => {
    loadFailedRef.current = false;
    setLoadFailed(false);
    checkAndLoad();
  }, [checkAndLoad]);

  // Use IntersectionObserver on a sentinel element at the end of the list.
  // Fires only when the sentinel enters/exits visibility — no continuous scroll events.
  useEffect(() => {
    const inner = wrapperRef.current?.querySelector<HTMLDivElement>(
      ":scope > div > div:first-child",
    );
    const sentinel = sentinelRef.current;
    if (!inner || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) checkAndLoad();
      },
      { root: inner, threshold: 0, rootMargin: "0px 300px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Snap to nearest card after drag release. CSS scroll-snap conflicts with
  // ScrollableContainer's manual scrollLeft updates, so we do it programmatically.
  useEffect(() => {
    const inner = wrapperRef.current?.querySelector<HTMLDivElement>(
      ":scope > div > div:first-child",
    );
    if (!inner) return;

    let dragging = false;
    const onStart = () => {
      dragging = true;
    };
    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      // All slide wrappers except the sentinel (last child)
      const cards = Array.from(
        inner.querySelectorAll<HTMLDivElement>(":scope > div:not(:last-child)"),
      );
      if (!cards.length) return;
      const nearest = cards.reduce((best, card) =>
        Math.abs(card.offsetLeft - inner.scrollLeft) <
        Math.abs(best.offsetLeft - inner.scrollLeft)
          ? card
          : best,
      );
      // Under reduced motion the snap jumps rather than glides.
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      inner.scrollTo({
        left: nearest.offsetLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    inner.addEventListener("mousedown", onStart);
    inner.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
    return () => {
      inner.removeEventListener("mousedown", onStart);
      inner.removeEventListener("touchstart", onStart);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  const subtitleText = subtitle ?? description;
  // A caller that draws its own header passes none of these: no empty header block either.
  const hasHeader =
    !!title ||
    !!badgeText ||
    !!subTextAvailable ||
    !!viewAllUrl ||
    !!subtitleText;

  return (
    <div className={className}>
      {/* HEADER */}
      {/* Mobile: 3 rows (badge / title+subtitle / subtext+see-all). Desktop: 1 row. */}
      {hasHeader && (
        <div className="mb-4 flex flex-col gap-x-3 sm:flex-row sm:items-center">
          {/* BADGE — own row on mobile (w-fit prevents full-width stretch) */}
          {badgeText && (
            <span
              className={`font-family-nunito flex h-6 w-fit shrink-0 items-center gap-1 rounded-md px-3 text-xs font-bold tracking-wide uppercase ${badgeClassName}`}
            >
              {badgeIcon}
              {badgeText}
            </span>
          )}

          <div className="flex min-w-0 grow flex-col gap-x-2 sm:flex-row sm:items-center">
            {/* LEFT CLUSTER: title + subtitle + (desktop) subtext (subtitle truncates) */}
            {/* Desktop (sm+) always grows so "See All" floats right. On mobile it only
              grows when there's subtext; otherwise "See All" stays left. */}
            <div
              className={`flex min-w-0 flex-row items-center gap-x-2 overflow-hidden sm:grow ${
                subTextAvailable ? "grow" : ""
              }`}
            >
              <span className="font-family-nunito shrink-0 text-base font-bold whitespace-nowrap text-black md:text-xl">
                {title}
              </span>
              {subtitleText && (
                <span className="text-gray-dark truncate text-sm md:text-base">
                  · {subtitleText}
                </span>
              )}
              {/* subtext — inline on desktop only */}
              {subTextAvailable && (
                <span className="text-purple hidden shrink-0 text-sm font-semibold whitespace-nowrap sm:flex md:text-base">
                  · {subTextAvailable}
                </span>
              )}
            </div>

            {/* SEE ALL ROW — own row on mobile (with subtext), floats right on desktop */}
            <div className="flex shrink-0 items-center gap-x-2">
              {/* subtext — shares the See All row on mobile only */}
              {subTextAvailable && (
                <span className="text-purple text-sm font-semibold whitespace-nowrap sm:hidden md:text-base">
                  {subTextAvailable}
                </span>
              )}
              {viewAllUrl && (
                <Link
                  href={viewAllUrl}
                  className={`text-purple hover:border-purple flex border-b-2 border-transparent text-sm font-semibold tracking-wide whitespace-nowrap duration-300 select-none ${
                    subTextAvailable ? "ml-auto" : ""
                  }`}
                  title="See all"
                >
                  {viewAllText}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCROLLABLE CONTAINER */}
      <div ref={wrapperRef} id={`${id}-v3`}>
        <ScrollableContainer
          className={scrollerClassName}
          scrollSpeed={1.5}
          showShadows={true}
          shadowFromClassName={shadowFromClassName}
        >
          {slides.map((item, index) => (
            <div
              key={`slide_${id}_${index}`}
              className="flex shrink-0 items-center justify-center"
            >
              {renderSlide(item, index)}
            </div>
          ))}
          {loadFailed && renderLoadFailed && (
            <div className="flex shrink-0 items-center">
              {renderLoadFailed(retryLoad)}
            </div>
          )}
          {/* Sentinel: triggers IntersectionObserver when scrolled into view */}
          <div ref={sentinelRef} className="w-px shrink-0 self-stretch" />
        </ScrollableContainer>
      </div>

      {/* Enable overflow on ScrollableContainer's inner div, with no scrollbar (2026-10-08): the
          peeking card, the edge fades and drag are the affordance. The bottom room keeps the
          cards' shadow. */}
      <style>{`
        #${id}-v3 > div > div:first-child {
          overflow-x: auto !important;
          scrollbar-width: none !important;
          padding-bottom: 12px !important;
        }
        #${id}-v3 > div > div:first-child::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default CustomCarouselV3;
