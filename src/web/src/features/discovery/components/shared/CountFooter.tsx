import React from "react";
import { formatNumber } from "../../lib/format";

/**
 * The sticky footer both filter surfaces share: Clear all + "Show N results". The count is live
 * (debounced upstream); results apply only when the button is pressed.
 */
export const CountFooter: React.FC<{
  count: number | null;
  counting: boolean;
  onClearAll: () => void;
  onShowResults: () => void;
}> = ({ count, counting, onClearAll, onShowResults }) => (
  <div className="border-gray sticky bottom-0 flex items-center justify-between gap-4 border-t bg-white p-3">
    <button
      type="button"
      onClick={onClearAll}
      className="text-purple min-h-11 text-sm font-semibold underline"
    >
      Clear all
    </button>
    <button
      type="button"
      onClick={onShowResults}
      className="btn bg-purple hover:bg-purple-shade min-h-11 rounded-full border-none px-6 text-white"
    >
      {counting || count === null ? (
        <span className="bg-purple-soft inline-block h-4 w-16 animate-pulse rounded motion-reduce:animate-none" />
      ) : (
        <>Show {formatNumber(count)} results</>
      )}
    </button>
  </div>
);
