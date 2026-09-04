import React from "react";
import { formatNumber } from "../../lib/format";

/**
 * The purple live-count panel. Fixed 340px on md+ (`flex: 0 0 340px` — load-bearing: sized to
 * content it resizes as the youth moves between steps); a compact row above the wizard below md.
 * The count is floored: below the threshold it swaps to a "widen your feed" state rather than
 * rendering a dead 0.
 */
const FLOOR = 5;

export const LiveCountPanel: React.FC<{
  count: number | null;
  counting: boolean;
}> = ({ count, counting }) => {
  const floored = count !== null && count < FLOOR;

  let body: React.ReactNode;
  if (counting || count === null)
    body = (
      <span className="bg-purple-shade my-1 inline-block h-10 w-28 animate-pulse rounded motion-reduce:animate-none md:h-12" />
    );
  else if (floored)
    body = (
      <p className="text-lg leading-snug font-bold md:text-xl">
        That&apos;s a narrow feed — consider widening a choice or two.
      </p>
    );
  else
    body = (
      <>
        <p className="text-2xl font-bold md:text-5xl">{formatNumber(count)}</p>
        <p className="text-purple-soft text-sm">
          opportunities match your answers so far
        </p>
      </>
    );

  return (
    <div className="bg-purple flex shrink-0 grow-0 items-center gap-3 rounded-t-2xl p-4 text-white md:basis-85 md:flex-col md:items-start md:justify-between md:rounded-t-none md:rounded-l-2xl md:p-8">
      <div className="md:flex md:flex-col md:gap-2">
        <p className="text-purple-soft text-[10px] font-bold tracking-widest uppercase">
          Tuning your feed
        </p>
        {body}
      </div>
      <p className="text-purple-soft hidden text-sm md:block">
        Every step is optional and nothing is locked. These are saved as search
        preferences — your profile and YoID are untouched.
      </p>
    </div>
  );
};
