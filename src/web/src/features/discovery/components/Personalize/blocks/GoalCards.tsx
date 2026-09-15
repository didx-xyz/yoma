import React from "react";
import type { UserGoal, UserPreferences } from "~/api/models/userPreferences";
import type { StepBlockEntry } from "../../../registry/preferenceSteps";

/**
 * The goal card grid — single-select by design (the sub-heading says so on screen). `comingSoon`
 * entries render their badge and are NOT selectable; that is modelled in the registry, not here.
 */
export const GoalCards: React.FC<{
  entries: StepBlockEntry[];
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ entries, draft, onPatch }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {entries.map((entry) => {
      const Icon = entry.icon;
      const active = draft.goal === entry.id;
      let variant = "border-gray hover:border-green bg-white";
      if (active) variant = "border-green bg-green-light";
      else if (entry.comingSoon) variant = "border-gray bg-white opacity-70";
      return (
        <button
          key={entry.id}
          type="button"
          aria-disabled={entry.comingSoon}
          onClick={() =>
            !entry.comingSoon &&
            onPatch({ goal: active ? null : (entry.id as UserGoal) })
          }
          className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left ${variant}`}
        >
          {Icon && (
            <span className="bg-gray-light flex h-8 w-8 items-center justify-center rounded-lg">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <span className="text-xs font-semibold md:text-sm">
            {entry.label}
          </span>
          {entry.comingSoon && (
            <span className="bg-yellow-light text-yellow ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
              COMING SOON
            </span>
          )}
        </button>
      );
    })}
  </div>
);
