import React from "react";
import { CARD_GRID_CLASS } from "~/lib/card";
import { LIST_COLUMNS } from "./listColumns";

/**
 * The loading shapes of the discovery results (2026-10-09, Jason: "when Searching… show a loading
 * skeleton", replacing the 2026-09-05 one-loading-treatment rule for the FIRST load). Each mirrors
 * its real counterpart's layout and fixed height, so nothing moves when the results arrive: the
 * grid card (`OpportunityCard`: band, chip row, 2-line title, org line, 2-line summary, the 2 × 2
 * facts, status and button) and the list row (`OpportunityRow`, the `LIST_COLUMNS` widths).
 *
 * daisyUI's `skeleton` shimmers; under reduced motion it holds still. Hidden from assistive
 * technology: the heading says the results are loading. The YoID pages build their own shapes
 * from the same bone (`components/YoID/YoIDSkeletons.tsx`).
 */
export const SKELETON_BONE_CLASS =
  "skeleton bg-gray motion-reduce:animate-none";
const BONE = SKELETON_BONE_CLASS;

export const CardSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    aria-hidden
    className={`shadow-custom flex h-74 flex-col overflow-hidden rounded-xl bg-white md:h-88.5 ${className}`}
  >
    <div className={`h-12 shrink-0 rounded-none md:h-20 ${BONE}`} />
    <div className="flex min-h-0 grow flex-col gap-1.5 p-3">
      <div className="flex h-5 shrink-0 items-center justify-between">
        <div className={`h-4 w-14 rounded ${BONE}`} />
        <div className={`h-4 w-12 rounded-full ${BONE}`} />
      </div>
      <div className="flex h-10 shrink-0 flex-col justify-center gap-1.5 md:h-11">
        <div className={`h-3.5 w-11/12 rounded ${BONE}`} />
        <div className={`h-3.5 w-2/3 rounded ${BONE}`} />
      </div>
      <div className={`h-3 w-3/4 shrink-0 rounded ${BONE}`} />
      <div className="flex h-8 shrink-0 flex-col justify-center gap-1.5">
        <div className={`h-2.5 w-full rounded ${BONE}`} />
        <div className={`h-2.5 w-4/5 rounded ${BONE}`} />
      </div>
      <div className="my-1 grid h-9.5 shrink-0 grid-cols-2 grid-rows-2 gap-x-3 gap-y-1.5">
        <div className={`h-3 w-4/5 self-center rounded ${BONE}`} />
        <div className={`h-3 w-3/4 self-center rounded ${BONE}`} />
        <div className={`h-3 w-2/3 self-center rounded ${BONE}`} />
      </div>
      <div className="mt-auto flex shrink-0 items-center gap-3 md:flex-col md:items-stretch md:gap-1.5">
        <div className={`h-3 grow rounded md:w-1/2 md:grow-0 ${BONE}`} />
        <div className={`h-10 w-28 rounded-lg md:w-full ${BONE}`} />
      </div>
    </div>
  </div>
);

/** A grid of card skeletons, in the results grid's own columns. */
export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className={CARD_GRID_CLASS}>
    {Array.from({ length: count }, (_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

/** The compact list's rows, in its columns. */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div aria-hidden className="flex flex-col gap-2">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="shadow-custom rounded-lg bg-white px-3 py-2">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 shrink-0 rounded-lg ${BONE}`} />
          <div className={`hidden md:block ${LIST_COLUMNS.badge}`}>
            <div className={`h-4 w-16 rounded ${BONE}`} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={`h-3.5 w-3/4 rounded ${BONE}`} />
            <div className={`h-3 w-1/2 rounded ${BONE}`} />
          </div>
          <div className={`hidden md:block ${LIST_COLUMNS.money}`}>
            <div className={`h-3 w-20 rounded ${BONE}`} />
          </div>
          <div className={LIST_COLUMNS.where}>
            <div className={`h-3 w-24 rounded ${BONE}`} />
          </div>
          <div
            className={`h-9 w-10 shrink-0 rounded-full md:w-24 md:rounded-lg ${BONE}`}
          />
        </div>
      </div>
    ))}
  </div>
);
