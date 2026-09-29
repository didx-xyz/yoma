import React from "react";
import { ACCESSIBILITY_NAME_OTHER } from "~/api/models/lookups";
import type { UserPreferences } from "~/api/models/userPreferences";
import type { PreferenceOption } from "../usePreferenceOptions";
import { Pill } from "./Pill";

/** The API's limit on the Other description. */
const OTHER_DESCRIPTION_MAX = 500;

/** The Other option, found by its lookup name (the API's `AccessibilityOption.Other`). */
export const otherAccessibilityId = (
  options: PreferenceOption[],
): string | null =>
  options.find((o) => o.label === ACCESSIBILITY_NAME_OTHER)?.id ?? null;

/**
 * Accessibility requirements — the shared accessibility list as pills, and a description box
 * while Other is picked (the API requires it then, and refuses it otherwise). Deselecting Other
 * clears the description, so a stale one is never sent.
 */
export const AccessibilityBlock: React.FC<{
  options: PreferenceOption[];
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ options, draft, onPatch }) => {
  const { requirements, otherDescription } = draft.accessibility;
  const otherId = otherAccessibilityId(options);
  const otherSelected = otherId !== null && requirements.includes(otherId);

  const toggle = (id: string): void => {
    const selected = requirements.includes(id);
    onPatch({
      accessibility: {
        requirements: selected
          ? requirements.filter((r) => r !== id)
          : [...requirements, id],
        otherDescription: id === otherId && selected ? null : otherDescription,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Pill
            key={option.id}
            label={option.label}
            active={requirements.includes(option.id)}
            onToggle={() => toggle(option.id)}
          />
        ))}
      </div>
      {otherSelected && (
        <label className="flex flex-col gap-1">
          <span className="text-gray-dark text-[11px] font-semibold tracking-wide uppercase">
            Tell us what you need
          </span>
          <textarea
            value={otherDescription ?? ""}
            maxLength={OTHER_DESCRIPTION_MAX}
            onChange={(e) =>
              onPatch({
                accessibility: {
                  requirements,
                  otherDescription:
                    e.target.value === "" ? null : e.target.value,
                },
              })
            }
            rows={2}
            className="textarea border-gray focus:border-gray w-full focus:outline-none"
            placeholder="Describe the accommodation you need"
          />
          {!otherDescription?.trim() && (
            <span className="text-gray-dark text-xs">
              Needed when you pick Other.
            </span>
          )}
        </label>
      )}
    </div>
  );
};
