import React from "react";
import { IoWarningOutline } from "react-icons/io5";
import { formatNumber } from "../../lib/format";

/**
 * The purple live-count panel. Fixed 340px on md+ (`flex: 0 0 340px` — load-bearing: sized to
 * content it resizes as the youth moves between steps); a compact row above the wizard below md.
 * The count always shows (Jason, 2026-10-05 — it was floored, and 0 could not be told from 4):
 * 0 is a warning, yellow with a warning icon; below the threshold the "narrow feed" sentence sits
 * under the label, and blurs with the number while recounting.
 */
const FLOOR = 5;

export const LiveCountPanel: React.FC<{
  count: number | null;
  counting: boolean;
  /** The count request failed — say so; the wizard still saves fine without it. */
  failed?: boolean;
  /** Extra classes on the purple root (the welcome → step 1 text fade, round 10). */
  className?: string;
}> = ({ count, counting, failed = false, className = "" }) => {
  let body: React.ReactNode;
  if (failed && count === null)
    body = (
      <p className="text-lg leading-snug font-bold md:text-xl">
        Couldn&apos;t count matches right now — your answers still save.
      </p>
    );
  else if (count === null)
    // Nothing to show yet (first load, or a count that failed): a word, not a shimmer block.
    // The surface has one loading treatment and a pulsing rectangle is not it.
    body = (
      <p className="text-purple-soft py-1 text-lg leading-snug font-bold md:text-xl">
        Counting…
      </p>
    );
  else
    // While recounting, the previous number stays and only the white TEXT blurs — never the
    // purple panel behind it (browser feedback, 2026-09-03).
    body = (
      <div
        className={`transition duration-300 motion-reduce:transition-none ${
          counting ? "opacity-70 blur-[3px]" : ""
        }`}
      >
        <p
          className={`flex items-center gap-2 text-2xl font-bold transition-colors duration-300 motion-reduce:transition-none md:text-5xl ${
            count === 0 ? "text-yellow-light" : ""
          }`}
        >
          {count === 0 && (
            <IoWarningOutline aria-hidden className="h-6 w-6 md:h-10 md:w-10" />
          )}
          {formatNumber(count)}
        </p>
        <p className="text-purple-soft text-sm">
          {count === 1
            ? "opportunity matches your answers so far"
            : "opportunities match your answers so far"}
        </p>
        {count < FLOOR && (
          <p className="mt-2 text-[13px] leading-snug font-semibold text-balance text-white motion-safe:animate-[fade-in_200ms_ease-out_both] md:text-sm">
            That&apos;s a narrow feed — consider widening a choice or two.
          </p>
        )}
      </div>
    );

  return (
    <div
      className={`bg-purple flex shrink-0 grow-0 items-center gap-3 rounded-t-2xl p-4 text-white md:basis-85 md:flex-col md:items-start md:justify-between md:rounded-t-none md:rounded-l-2xl md:p-8 ${className}`}
    >
      <div className="md:flex md:flex-col md:gap-2">
        <p className="text-purple-soft text-[10px] font-bold tracking-widest uppercase">
          Tuning your feed
        </p>
        {body}
      </div>
      {/* Signed in, the place IS written to the profile (the API keeps region / city there), so
          "your profile is untouched" would be false — the line names the one exception. */}
      <p className="text-purple-soft hidden text-sm md:block">
        Every step is optional and nothing is locked. These are saved as search
        preferences — your YoID is untouched, and only the place you pick is
        added to your profile.
      </p>
    </div>
  );
};
