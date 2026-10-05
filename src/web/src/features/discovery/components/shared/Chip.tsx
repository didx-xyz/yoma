import React from "react";
import {
  IoArrowUndoOutline,
  IoClose,
  IoInformationCircleOutline,
} from "react-icons/io5";
import type { DiscoveryChip } from "../../lib/chipModel";

/**
 * One applied chip, in one of the three provenance classes. Colour carries the meaning; the
 * person icon reinforces it. An inherited chip switched off STAYS on screen, struck through,
 * with an undo. Every action target is ≥44px on touch.
 *
 * Long labels wrap to two lines below `md` and truncate from there: `max-w-40 truncate` cut the
 * second chip in half on a 390px row ("Interests: AI, Data and Ana…"), and a chip whose value is
 * unreadable is not a chip. Desktop keeps one line — there is room, and the row stays scannable.
 *
 * A `pending` chip (region / city / distance until the Location search API lands) is drawn with
 * a dashed outline and says so in its title: it is part of the search's state and the URL, but
 * not of the results. An `inheritedInapplicable` chip is ghosted with no action — the note is
 * the whole message. On every other chip the note follows the label in the title (2026-10-03):
 * what an inherited chip does, or every value behind its "+1".
 */
const PENDING_TITLE = " — not applied to results yet";
export const Chip: React.FC<{
  chip: DiscoveryChip;
  onRemove: () => void;
  onUndo: () => void;
  pulse?: boolean;
}> = ({ chip, onRemove, onUndo, pulse }) => {
  const label = `${chip.group}: ${chip.value}`;
  const pending = chip.pending ? "border border-dashed border-current" : "";
  const noted = chip.note ? `${label} — ${chip.note}` : label;
  const title = chip.pending ? `${noted}${PENDING_TITLE}` : noted;

  if (chip.provenance === "inheritedInapplicable")
    return (
      <span
        title={noted}
        className="bg-gray-light text-gray-dark inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs"
      >
        <span className="line-clamp-2 max-w-40 opacity-60 md:truncate">
          {label}
        </span>
        <IoInformationCircleOutline
          className="h-4 w-4 shrink-0"
          aria-label={chip.note ?? undefined}
        />
      </span>
    );

  if (chip.provenance === "inheritedOff")
    return (
      <span
        title={title}
        className="bg-gray-light text-gray-dark inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs"
      >
        <span className="line-clamp-2 max-w-40 line-through opacity-60 md:truncate">
          {label}
        </span>
        <button
          type="button"
          onClick={onUndo}
          aria-label={`Restore ${label}`}
          className="-my-2 -mr-2 flex h-11 w-11 items-center justify-center"
        >
          <IoArrowUndoOutline className="h-4 w-4" />
        </button>
      </span>
    );

  const inherited = chip.provenance === "inherited";
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs motion-reduce:animate-none ${
        inherited
          ? "bg-purple-tint text-purple"
          : "bg-green-light text-green border-green/25 border"
      } ${pending} ${pulse ? "animate-pulse" : ""}`}
    >
      <span className="line-clamp-2 max-w-40 font-semibold md:truncate">
        {label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="-my-2 -mr-2 flex h-11 w-11 items-center justify-center"
      >
        <IoClose className="h-4 w-4" />
      </button>
    </span>
  );
};
