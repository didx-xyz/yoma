import React from "react";
import type { UserGoal, UserPreferences } from "~/api/models/userPreferences";
import type { StepBlockEntry } from "../../../registry/preferenceSteps";
import { typeBadgeClass } from "../../Results/typeBadge";

/**
 * The goal card grid — single-select by design (the sub-heading says so on screen). `comingSoon`
 * entries render their badge and are NOT selectable; that is modelled in the registry, not here.
 * Each card's icon wears the colour of the type its goal leads to, and a line under the label
 * says what the goal means (2026-10-09, Jason).
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
          aria-pressed={active}
          aria-disabled={entry.comingSoon}
          onClick={() =>
            !entry.comingSoon &&
            onPatch({ goal: active ? null : (entry.id as UserGoal) })
          }
          className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left ${variant}`}
        >
          {Icon && (
            <span
              aria-hidden
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                entry.toneType
                  ? typeBadgeClass(entry.toneType)
                  : "bg-gray-light"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-xs font-semibold md:text-sm">
              {entry.label}
            </span>
            {entry.description && (
              <span className="text-gray-dark block text-[11px] leading-snug md:text-xs">
                {entry.description}
              </span>
            )}
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
