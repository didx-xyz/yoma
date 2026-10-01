import React from "react";
import { IoClose, IoOptionsOutline } from "react-icons/io5";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useChipPulse } from "../../state/useChipPulse";
import { AppliedChips } from "./AppliedChips";

/** Filter values named in the summary before it collapses to "+N" — as the banner does. */
const SHOWN = 2;

/**
 * This search's filters panel (round 7 follow-up, 2026-10-01) — the GREEN twin of the purple
 * preference banner, built the same way: an icon, a one-line summary with a short subline, the
 * action on the right ("Clear filters", which takes out this search's filters only — never the
 * preferences, 2026-09-05), then the chips. The preference chips live in the banner, so each
 * colour has one home. Renders only while the search has filters of its own.
 */
export const CurrentFilters: React.FC = () => {
  const { state, chips, clearFilters, hasFilters } = useDiscovery();
  const pulse = useChipPulse();

  const manual = chips.filter((c) => c.provenance === "manual");
  const clauses = state.filters.customFields.length;
  if (manual.length === 0 && clauses === 0) return null;

  const values = manual.map((c) => c.value);
  const rest = values.length - SHOWN + clauses;
  const summary = [
    ...values.slice(0, SHOWN),
    ...(rest > 0 ? [`+${rest}`] : []),
  ].join(" · ");

  return (
    <section
      aria-label="Filters on this search"
      className="bg-green-light/60 flex flex-col gap-2 rounded-xl p-2.5"
    >
      {/* Wraps below sm: text row first, the action beneath — nothing overflows at 390px. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span className="bg-green-light flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <IoOptionsOutline className="text-green h-4 w-4" />
        </span>
        <p className="min-w-40 grow basis-56 text-xs">
          <span className="font-semibold">This search is filtered by </span>
          <span className="text-green font-semibold">{summary}</span>
          <span className="text-gray-dark block text-[11px]">
            For this search only. Your preferences don&apos;t change.
          </span>
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-xs bg-green hover:bg-green-dark h-7 rounded-full border-none text-[11px] font-semibold text-white"
          >
            <IoClose className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>
      <AppliedChips kind="manual" pulseChipId={pulse} />
    </section>
  );
};
