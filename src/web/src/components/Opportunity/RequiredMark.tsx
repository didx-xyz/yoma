import React from "react";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";

// ─────────────────────────────────────────────────────────────────────────────
// The completion form's per-field status (Jason, 2026-10-22): to the left of every required
// field's label — each proof upload and the pin, each required custom field — a green check
// once it is satisfied, else a cross: orange "not yet" before a submit was tried, pink after
// one. Optional fields carry no mark. The section headers' status lines use the same icons and
// colours, so the youth sees at a glance what is left before Submit.
// ─────────────────────────────────────────────────────────────────────────────

export const RequiredMark: React.FC<{
  /** The field has a value and no error. */
  done: boolean;
  /** A submit was tried: a missing field's cross turns pink. */
  afterSubmit: boolean;
  className?: string;
}> = ({ done, afterSubmit, className = "h-4 w-4" }) => {
  const icon = `${className} shrink-0`;
  return (
    <span className="inline-flex items-center">
      {done ? (
        <IoCheckmarkCircle aria-hidden className={`${icon} text-green`} />
      ) : (
        <IoCloseCircle
          aria-hidden
          className={`${icon} ${afterSubmit ? "text-pink" : "text-orange"}`}
        />
      )}
      <span className="sr-only">
        {done ? "Required — done" : "Required — missing"}
      </span>
    </span>
  );
};
