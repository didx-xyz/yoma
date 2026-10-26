import { useEffect, useRef } from "react";

/** The fixed navbar plus the layout's sticky chip bar, and a little room under them. */
export const PAGER_SCROLL_MARGIN_CLASS = "scroll-mt-[148px]";

/**
 * Paging jumps back to the top of the results, as discovery's `scrollToResults` does on a page
 * change (Jason, 2026-10-22): the new page starts at its count line, not mid-scroll. The pages
 * push the page number into the URL (`router.push`, with `scroll: false` so Next's own jump to
 * the top of the page does not race this one); the prop comes back changed and the effect
 * scrolls the returned ref into view — put it on the box around the list, which stays mounted
 * while the next page loads, with `PAGER_SCROLL_MARGIN_CLASS` so it clears the sticky bar.
 * The first render never scrolls, and reduced motion gets an instant jump.
 */
export const usePagerScroll = (
  page: number,
): React.RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);
  const previous = useRef(page);
  useEffect(() => {
    if (page === previous.current) return;
    previous.current = page;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    ref.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, [page]);
  return ref;
};
