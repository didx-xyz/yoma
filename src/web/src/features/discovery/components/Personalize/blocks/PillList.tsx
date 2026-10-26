import React, { useState } from "react";
import { VISIBLE_BEFORE_SHOW_ALL } from "../../Filters/FilterControl";

/**
 * The wizard's wrapping pill row with the filters dialog's cut (Jason, 2026-10-22): the first
 * `VISIBLE_BEFORE_SHOW_ALL` pills, then "Show all N" reveals the rest. Each block renders its own
 * pills; `pinned` names the PICKED ones, which are never hidden behind the cut — the dialog's
 * `ChipSet` rule — so the row always shows every answer, wherever it sits in the list. A block
 * whose open row reads in another order (languages: A–Z, where the cut leads with the site's
 * languages) passes it as `expanded`, the `SectionModel.expanded` rule.
 */
export const PillList: React.FC<{
  pills: React.ReactElement[];
  pinned: (index: number) => boolean;
  expanded?: React.ReactElement[];
}> = ({ pills, pinned, expanded }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll
    ? (expanded ?? pills)
    : pills.filter((_, i) => i < VISIBLE_BEFORE_SHOW_ALL || pinned(i));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible}
      {pills.length > visible.length && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-green text-xs font-semibold underline"
        >
          Show all {pills.length}
        </button>
      )}
    </div>
  );
};
