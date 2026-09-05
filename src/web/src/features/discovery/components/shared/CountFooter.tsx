import React from "react";
import { ShowResultsButton } from "./ShowResultsButton";

/**
 * The sticky footer both filter surfaces share: Clear all + "Show N results". The count is live
 * (debounced upstream); results apply only when the button is pressed.
 */
export const CountFooter: React.FC<{
  count: number | null;
  counting: boolean;
  /** The count request failed — say so, rather than letting the button look stuck. */
  countFailed?: boolean;
  onClearAll: () => void;
  onShowResults: () => void;
}> = ({ count, counting, countFailed = false, onClearAll, onShowResults }) => (
  <div className="border-gray sticky bottom-0 flex items-center justify-between gap-4 border-t bg-white p-3">
    <div className="flex min-w-0 flex-col">
      <button
        type="button"
        onClick={onClearAll}
        className="text-purple min-h-11 self-start text-sm font-semibold underline"
      >
        Clear all
      </button>
      {countFailed && (
        <span className="text-gray-dark text-xs">
          Count unavailable right now.
        </span>
      )}
    </div>
    <ShowResultsButton
      count={count}
      counting={counting}
      onClick={onShowResults}
    />
  </div>
);
