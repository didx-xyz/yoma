import React from "react";
import { ShowResultsButton } from "./ShowResultsButton";

/**
 * The sticky footer both filter surfaces share: Clear filters + "Show N results". The count is
 * live (debounced upstream); results apply only when the button is pressed. Clearing takes out
 * this search's filters and leaves the preference layer standing — see the `clearFilters`
 * action for why the two are not one button.
 */
export const CountFooter: React.FC<{
  count: number | null;
  counting: boolean;
  /** The count request failed — say so, rather than letting the button look stuck. */
  countFailed?: boolean;
  onClearFilters: () => void;
  onShowResults: () => void;
}> = ({
  count,
  counting,
  countFailed = false,
  onClearFilters,
  onShowResults,
}) => (
  <div className="border-gray sticky bottom-0 flex items-center justify-between gap-4 border-t bg-white p-3">
    <div className="flex min-w-0 flex-col">
      <button
        type="button"
        onClick={onClearFilters}
        className="text-purple min-h-11 self-start text-sm font-semibold underline"
      >
        Clear filters
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
