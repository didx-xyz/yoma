import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * World Cleanup Day campaign banner — shown on the landing state of `/opportunities`
 * only (under the category chips, above the Jobs carousel).
 *
 * Variant 2 "Green" (Option D palette) of the approved mock: gradient + copy, no campaign
 * artwork. The orange campaign chip carries over from Variant 1 unchanged.
 * The surface itself is deliberately NOT a link — there are two CTAs, so each button is
 * its own tap target (min 44px).
 *
 * Everything the campaign owns — copy, date label, display window and both link targets —
 * is a constant below, so retiming or retiring it never means editing the markup.
 */

/**
 * The cleanup opportunities on the overview. Double-encoded on purpose: the page pre-encodes
 * the search value (`onSearchInputSubmit`) and `URLSearchParams.toString()` encodes it again,
 * so this is byte-for-byte what the search box itself produces for "clean up".
 */
const HREF_CLEANUP_SEARCH = "/opportunities?query=clean%2520up";

/** The global cleanup opportunity — hard-coded to production per the campaign brief. */
const HREF_GLOBAL_CLEANUP =
  "https://yoma.world/opportunities/01a068f6-4f1b-7871-9dfb-3de7e2254940";

/** Date chip. The mock said "SAT 20 SEP"; 20 Sep 2026 is a Sunday. */
const CAMPAIGN_DATE_LABEL = "SUN 20 SEP";

/** Weekday in the headline — kept beside the chip so the two can never drift apart. */
const CAMPAIGN_DAY_NAME = "Sunday";

/**
 * Auto-retire, end of day Sun 27 Sep SAST — the brief's display window (late enough to catch
 * weekend submissions). Delete this component's usage when the campaign is done for good.
 */
const CAMPAIGN_END = new Date("2026-09-27T23:59:59+02:00");

/**
 * Shared geometry for both CTAs. Full width on mobile (stacked blocks), hugging their content
 * on desktop; `min-h-11` is the 44px tap target.
 */
const BTN_BASE =
  "group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-center text-sm font-extrabold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:w-auto md:text-[15px] md:whitespace-nowrap";

const BTN_OUTLINE = `${BTN_BASE} border-2 border-white/60 text-white hover:border-white hover:bg-white/15`;

/** White on green — the primary CTA of the green variant; its label is the mid-gradient green. */
const BTN_PRIMARY = `${BTN_BASE} bg-white text-[#2f6b4f] shadow-sm hover:brightness-95 hover:shadow-md`;

/** Nudges right on hover, alongside the button's own colour change. */
const Arrow: React.FC = () => (
  <span
    aria-hidden
    className="transition-transform duration-200 group-hover:translate-x-1"
  >
    →
  </span>
);

export const WorldCleanupDayBanner: React.FC = () => {
  // The page is statically generated, so a build-time date check would either bake in a stale
  // answer or disagree with the client and trip hydration. Decide after mount instead: the
  // banner fades in a frame late, which is fine for a promo and wrong for nothing.
  const [withinWindow, setWithinWindow] = useState(false);
  useEffect(() => {
    setWithinWindow(Date.now() <= CAMPAIGN_END.getTime());
  }, []);

  if (!withinWindow) return null;

  return (
    <>
      <div className="divider !bg-gray" />
      <div className="relative my-2 overflow-hidden rounded-2xl bg-[linear-gradient(150deg,#1e4d36_0%,#2f6b4f_100%)] p-5 md:bg-[linear-gradient(100deg,#1e4d36_0%,#2f6b4f_70%,#3a7d5c_100%)] md:px-8 md:py-6">
        {/* Ornamental wash, desktop only — on mobile the mock drops it, where it would sit
          behind the copy rather than beside it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-15 hidden size-75 rounded-full bg-white/7 md:block"
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:gap-7">
          <div className="flex flex-col gap-1.5 md:grow">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-orange text-purple rounded-full px-3 py-1 text-[11px] leading-none font-extrabold tracking-[0.08em]">
                WORLD CLEANUP DAY
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] leading-none font-extrabold tracking-[0.08em] text-white">
                {CAMPAIGN_DATE_LABEL}
              </span>
            </div>

            <h2 className="text-xl leading-tight font-extrabold text-white md:text-3xl">
              Clean up your corner of the world this {CAMPAIGN_DAY_NAME}!
            </h2>

            <p className="max-w-2xl text-sm text-[#d9ece1] md:text-[15px]">
              Find it, clean it, prove it — and earn a verifiable credential,
              your achievement certificate, for taking part.
            </p>
          </div>

          {/* Stacked under the copy on mobile, a column beside it from md up. */}
          <div className="flex shrink-0 flex-col gap-2.5">
            <Link href={HREF_CLEANUP_SEARCH} className={BTN_OUTLINE}>
              Find your cleanup opportunity
              <Arrow />
            </Link>

            <a href={HREF_GLOBAL_CLEANUP} className={BTN_PRIMARY}>
              Join the global cleanup
              <Arrow />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
