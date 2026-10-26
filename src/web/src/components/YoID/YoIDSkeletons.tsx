import React from "react";
import {
  GridSkeleton,
  SKELETON_BONE_CLASS,
} from "~/features/discovery/components/Results/ResultSkeletons";
import { CARD_GRID_CLASS } from "~/lib/card";

// ─────────────────────────────────────────────────────────────────────────────
// YoID loading shapes (YOM-1283 round 3, B3 / C4): discovery's own skeleton — the same bone,
// the same card placeholder (`CardSkeleton`) and grid — on every YoID page, so a youth sees one
// loading language across the site. Each shape is `aria-hidden` and says nothing; the PAGE
// renders ONE sr-only "Loading…" status line (`LoadingStatus`) while any of its shapes shows,
// as discovery's results heading does — the overview mounts four shapes at once, and four live
// regions would announce four times.
// ─────────────────────────────────────────────────────────────────────────────

const BONE = SKELETON_BONE_CLASS;

/** The page's one line for assistive technology while its `aria-hidden` skeletons show. */
export const LoadingStatus: React.FC<{ when: boolean }> = ({ when }) =>
  when ? (
    <p role="status" className="sr-only">
      Loading…
    </p>
  ) : null;

/** The paging-info line's bar, where "Showing x – y out of z results" will be. */
const CountBar: React.FC = () => (
  <div aria-hidden className={`h-5 w-48 rounded ${BONE}`} />
);

/** An opportunity grid: the count bar, then discovery's card placeholders. */
export const OpportunityGridSkeleton: React.FC<{ count?: number }> = ({
  count = 8,
}) => (
  <div className="flex flex-col gap-4">
    <CountBar />
    <GridSkeleton count={count} />
  </div>
);

/** The Recently viewed section: rail header (heading and subtitle) over a row of cards. */
export const RecentlyViewedSkeleton: React.FC = () => (
  <>
    <div aria-hidden className="flex flex-col gap-1.5 pb-1">
      <div className={`h-5 w-40 rounded ${BONE}`} />
      <div className={`h-3.5 w-64 rounded ${BONE}`} />
    </div>
    <div className="pt-2">
      <GridSkeleton count={4} />
    </div>
  </>
);

/** The passport: a chip row, then two type sections, each a heading over one row of cards. */
export const PassportSkeleton: React.FC = () => (
  <>
    <div aria-hidden className="flex gap-2 overflow-hidden md:flex-wrap">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className={`h-11 w-24 shrink-0 rounded-full md:h-9 ${BONE}`}
        />
      ))}
    </div>
    <div className="flex flex-col gap-8 md:gap-10">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="flex flex-col">
          <div aria-hidden className={`mb-1 h-5 w-40 rounded ${BONE}`} />
          <div className="pt-2">
            <GridSkeleton count={4} />
          </div>
        </div>
      ))}
    </div>
  </>
);

/** A YoID tile's body (wallet balance, passport and skills tiles): four text bones. */
export const TileBodySkeleton: React.FC = () => (
  <div aria-hidden className="flex h-[185px] flex-col gap-3">
    <div className={`h-3 w-1/2 rounded ${BONE}`} />
    <div className={`h-3 w-3/4 rounded ${BONE}`} />
    <div className={`h-3 w-2/3 rounded ${BONE}`} />
    <div className={`h-3 w-1/2 rounded ${BONE}`} />
  </div>
);

/** The Opportunities section's summary while it loads: two circles stand in for the row (Jason, 2026-10-26). */
export const SummaryCirclesSkeleton: React.FC = () => (
  <div aria-hidden className="flex flex-wrap justify-center gap-4">
    {Array.from({ length: 2 }, (_, index) => (
      <div key={index} className={`h-24 w-24 rounded-full ${BONE}`} />
    ))}
  </div>
);

/** The skills grid: the skill tile's own shape (name, issuer line, a logo circle). */
export const SkillsGridSkeleton: React.FC<{ count?: number }> = ({
  count = 8,
}) => (
  <div aria-hidden className={CARD_GRID_CLASS}>
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="shadow-custom flex min-h-28 flex-col gap-2 rounded-xl bg-white p-4"
      >
        <div className={`h-4 w-3/4 rounded ${BONE}`} />
        <div className={`h-3 w-1/2 rounded ${BONE}`} />
        <div className={`mt-auto h-8 w-8 rounded-full ${BONE}`} />
      </div>
    ))}
  </div>
);
