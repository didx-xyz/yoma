import React from "react";
import { IoArrowUndoOutline, IoClose, IoPersonOutline } from "react-icons/io5";
import type { DiscoveryChip } from "../../lib/chipModel";

/**
 * One applied chip, in one of the three provenance classes. Colour carries the meaning; the
 * person icon reinforces it. An inherited chip switched off STAYS on screen, struck through,
 * with an undo. Long labels truncate with the full text in the native tooltip; every action
 * target is ≥44px on touch.
 */
export const Chip: React.FC<{
  chip: DiscoveryChip;
  onRemove: () => void;
  onUndo: () => void;
  pulse?: boolean;
}> = ({ chip, onRemove, onUndo, pulse }) => {
  const label = `${chip.group}: ${chip.value}`;

  if (chip.provenance === "inheritedOff")
    return (
      <span
        title={label}
        className="bg-gray-light text-gray-dark inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs whitespace-nowrap"
      >
        <IoPersonOutline className="h-4 w-4 shrink-0 opacity-60" />
        <span className="max-w-40 truncate line-through opacity-60">
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
      title={label}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs whitespace-nowrap motion-reduce:animate-none ${
        inherited ? "bg-purple-tint text-purple" : "bg-green-light text-green"
      } ${pulse ? "animate-pulse" : ""}`}
    >
      {inherited && <IoPersonOutline className="h-4 w-4 shrink-0" />}
      <span className="max-w-40 truncate">{label}</span>
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
