import { useAtomValue } from "jotai";
import React from "react";
import { userProfileAtom } from "~/lib/store";
import type { StepBlockEntry } from "../../../registry/preferenceSteps";
import { useIdentityLookups } from "../usePreferenceOptions";

/**
 * The read-only identity block — the fields the mapping reads and never writes, each captioned
 * with what it maps to. Nothing in the wizard can change these. Country is not here: it has its
 * own block in step 4 (`LocationBlock`), beside the region and city that belong to it.
 */
export const IdentityReadonly: React.FC<{ entries: StepBlockEntry[] }> = ({
  entries,
}) => {
  const profile = useAtomValue(userProfileAtom);
  const identity = useIdentityLookups();

  const valueOf = (id: string): string => {
    switch (id) {
      case "dateOfBirth":
        return profile?.dateOfBirth?.slice(0, 10) ?? "Not set";
      case "gender":
        return identity.genderName(profile?.genderId ?? null);
      default:
        return identity.educationName(profile?.educationId ?? null);
    }
  };

  return (
    <ul className="divide-gray border-gray flex flex-col divide-y rounded-xl border">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center gap-2 p-3 text-sm">
          <span className="w-28 shrink-0 font-semibold">{entry.label}</span>
          <span className="grow">{valueOf(entry.id)}</span>
          <span className="text-gray-dark text-right text-xs">
            {entry.caption}
          </span>
        </li>
      ))}
    </ul>
  );
};
