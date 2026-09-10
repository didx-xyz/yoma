import Image from "next/image";
import worldMap from "public/images/world-map.webp";
import stamp1 from "public/images/stamp-1.png";
import stamp2 from "public/images/stamp-2.png";
import type { ReactNode } from "react";

/**
 * The themed band across the top of a page.
 *
 * Two modes:
 *
 * - **Overlay** (no `children`) — an absolutely positioned band of a fixed height sitting *behind*
 *   whatever the page renders. This is how the twenty-odd existing callers use it, and it is why
 *   they each carry a hand-measured height (`h-[14.3rem] md:h-[18.4rem]`, `h-[341px]`, `h-[310px]`
 *   …): the band knows nothing about the content in front of it, so the two numbers have to be
 *   kept in step by hand. Change the content and the band no longer matches it.
 *
 * - **Wrapper** (with `children`) — the band sits in normal flow and **its height is its content's
 *   height**. Nothing to measure, nothing to keep in step, and whatever follows starts exactly
 *   where the band ends. Prefer this for new work; pass vertical padding via `className`.
 *
 * Overlay behaviour is unchanged — every existing caller keeps the band it has today.
 */
export const PageBackground: React.FC<{
  /**
   * Overlay mode: the band's height (defaults to `h-80`), replacing the default entirely.
   * Wrapper mode: the band's padding — its height comes from `children`.
   */
  className?: string;
  includeStamps?: boolean;
  /** supplying content switches the band into wrapper mode */
  children?: ReactNode;
}> = ({ className, includeStamps, children }) => {
  const isWrapper = children != null;

  return (
    <div
      className={`bg-theme z-0 flex w-full items-center justify-center ${
        isWrapper ? "relative overflow-hidden" : "absolute top-0 left-0"
      } ${className ?? (isWrapper ? "" : "h-80")}`}
    >
      {/* WORLD MAP */}
      <Image
        src={worldMap}
        alt="world-map"
        width={640}
        /*
          `fixed` in overlay mode is load-bearing for the existing pages — it is what puts the map
          where they expect it. In wrapper mode the band is a positioned box that should contain
          its own decoration, so the map is absolute and clipped by `overflow-hidden`.
        */
        className={`user-select-none pointer-events-none mt-14 h-auto object-scale-down opacity-10 ${
          isWrapper ? "absolute" : "fixed"
        }`}
        priority={true}
      />

      {/* STAMPS */}
      {includeStamps && (
        <div
          className={`w-full max-w-5xl ${isWrapper ? "absolute" : "relative"}`}
        >
          <Image
            src={stamp1}
            alt="Stamp1"
            width={135}
            sizes="100vw"
            priority={true}
            className="absolute left-2 z-0 h-auto -rotate-3 mix-blend-plus-lighter"
          />
          <Image
            src={stamp2}
            alt="Stamp2"
            width={161}
            sizes="100vw"
            priority={true}
            className="absolute -top-6 right-0 z-0 h-auto mix-blend-plus-lighter"
          />
        </div>
      )}

      {isWrapper && (
        <div className="relative z-10 flex w-full flex-col items-center">
          {children}
        </div>
      )}
    </div>
  );
};
