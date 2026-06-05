import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IoBriefcase } from "react-icons/io5";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";

const CustomCarouselV3: React.FC<{
  [id: string]: any;
  title?: string;
  subtitle?: string;
  viewAllUrl?: string;
  data: any[];
  renderSlide: (item: any, index: number) => React.ReactElement;
  totalAll?: number;
  loadData?: (startRow: number) => Promise<any>;
}> = ({
  id,
  title,
  subtitle,
  viewAllUrl,
  data,
  renderSlide,
  totalAll,
  loadData,
}) => {
  const [slides, setSlides] = useState(data);
  const effectiveTotal = totalAll ?? data.length;
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

  // Reset when parent data changes (e.g. country scope toggle)
  useEffect(() => {
    setSlides(data);
    hasMoreRef.current = true;
    loadingRef.current = false;
  }, [data]);

  const checkAndLoad = useCallback(() => {
    if (!loadDataRef.current || loadingRef.current || !hasMoreRef.current)
      return;

    loadingRef.current = true;
    loadDataRef.current(slidesLengthRef.current + 1).then((result) => {
      if (!result?.items?.length) {
        hasMoreRef.current = false;
        loadingRef.current = false;
      } else {
        setSlides((prev) => [...prev, ...result.items]);
        // After DOM updates, re-check if sentinel is still visible (viewport wider than content)
        requestAnimationFrame(() => {
          loadingRef.current = false;
          const sentinel = sentinelRef.current;
          const inner =
            wrapperRef.current?.querySelector<HTMLDivElement>(
              ":scope > div > div",
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

  // Use IntersectionObserver on a sentinel element at the end of the list.
  // Fires only when the sentinel enters/exits visibility — no continuous scroll events.
  useEffect(() => {
    const inner =
      wrapperRef.current?.querySelector<HTMLDivElement>(":scope > div > div");
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
    const inner =
      wrapperRef.current?.querySelector<HTMLDivElement>(":scope > div > div");
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
      inner.scrollTo({ left: nearest.offsetLeft, behavior: "smooth" });
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="border-purple from-purple-tint to-purple-tint/40 rounded-2xl border-2 bg-gradient-to-br p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-4 flex flex-row flex-wrap items-center gap-x-3 gap-y-2">
        <span className="bg-purple font-family-nunito flex h-6 items-center gap-1 rounded-md px-3 text-xs font-bold tracking-wide text-white uppercase">
          <IoBriefcase className="mr-2 size-3" /> Jobs · New
        </span>

        <div className="flex min-w-0 grow flex-row flex-wrap items-baseline gap-x-2 overflow-hidden">
          <span className="font-family-nunito text-base font-bold text-black md:text-xl">
            {title}
          </span>
          {subtitle && (
            <span className="text-gray-dark text-sm md:text-base">
              · {subtitle}
            </span>
          )}

          <span className="text-purple truncate text-sm font-semibold md:text-base">
            <span className="hidden md:inline">·</span> {effectiveTotal}{" "}
            {effectiveTotal === 1 ? "job" : "jobs"} available
          </span>

          {viewAllUrl && (
            <Link
              href={viewAllUrl}
              className="text-purple hover:border-purple ml-auto flex border-b-2 border-transparent text-sm font-semibold tracking-wide whitespace-nowrap duration-300 select-none"
              title="See all our job opportunities"
            >
              See All →
            </Link>
          )}
        </div>
      </div>

      {/* SCROLLABLE CONTAINER */}
      <div ref={wrapperRef} id={`${id}-v3`}>
        <ScrollableContainer
          className="pb-2xx flex gap-3"
          scrollSpeed={1.5}
          showShadows={true}
        >
          {slides.map((item, index) => (
            <div
              key={`slide_${id}_${index}`}
              className="flex shrink-0 items-center justify-center"
            >
              {renderSlide(item, index)}
            </div>
          ))}
          {/* Sentinel: triggers IntersectionObserver when scrolled into view */}
          <div ref={sentinelRef} className="w-px shrink-0 self-stretch" />
        </ScrollableContainer>
      </div>

      {/* Enable overflow + purple scrollbar on ScrollableContainer's inner div */}
      <style>{`
        #${id}-v3 > div > div {
          overflow-x: auto !important;
          scrollbar-width: thin !important;
          scrollbar-color: #41204b transparent !important;
          padding-bottom: 12px !important;
        }
        #${id}-v3 > div > div::-webkit-scrollbar { height: 8px; }
        #${id}-v3 > div > div::-webkit-scrollbar-track { background: transparent; }
        #${id}-v3 > div > div::-webkit-scrollbar-thumb {
          background-color: #41204b;
          border-radius: 4px;
        }
        #${id}-v3 > div > div::-webkit-scrollbar-thumb:hover {
          background-color: #54365d;
        }
      `}</style>
    </div>
  );
};

export default CustomCarouselV3;
