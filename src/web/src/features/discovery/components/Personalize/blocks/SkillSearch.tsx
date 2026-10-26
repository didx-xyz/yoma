import React, { useState } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import type {
  UserPreferences,
  UserPreferenceSkill,
} from "~/api/models/userPreferences";
import { useVerifiedSkillIds } from "../../../state/useVerifiedSkillIds";
import { useSkillSearch } from "../usePreferenceOptions";
import { Pill } from "./Pill";
import { SearchShell } from "./SearchShell";

/**
 * The skills lookup-search block — the youth's SELF-ATTESTED skills. Selections are stored as
 * `{id, name}` pairs (the EMSI lookup is search-by-name only, so a bare id could never be
 * resolved back to a label when re-editing) — a chip therefore keeps its name after the search
 * text, the result set, or the session has moved on.
 *
 * A skill the youth has already verified through a completion is shown as "Already verified" and
 * cannot be picked (the API refuses it as a self-attested skill) — hidden, it would look missing.
 */
export const SkillSearch: React.FC<{
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ draft, onPatch }) => {
  const [text, setText] = useState("");
  const results = useSkillSearch(text);
  const verified = new Set(useVerifiedSkillIds().ids);
  const selected = draft.selfReportedSkills;

  const toggle = (skill: UserPreferenceSkill): void => {
    onPatch({
      selfReportedSkills: selected.some((s) => s.id === skill.id)
        ? selected.filter((s) => s.id !== skill.id)
        : [...selected, skill],
    });
  };

  return (
    <SearchShell
      text={text}
      onChange={setText}
      placeholder="Search skills (3+ letters)…"
      pinned={selected.length}
      pills={[
        ...selected.map((skill) => (
          <Pill
            key={skill.id}
            label={skill.name}
            active
            onToggle={() => toggle(skill)}
          />
        )),
        ...results
          .filter((r) => !selected.some((s) => s.id === r.id))
          .map((r) =>
            verified.has(r.id) ? (
              <span
                key={r.id}
                className="border-gray text-gray-dark inline-flex min-h-11 items-center gap-1 rounded-full border bg-white px-3 text-xs opacity-70 md:min-h-9"
              >
                <IoCheckmarkCircleOutline className="text-green h-4 w-4" />
                {r.label} · Already verified
              </span>
            ) : (
              <Pill
                key={r.id}
                label={r.label}
                active={false}
                onToggle={() => toggle({ id: r.id, name: r.label })}
              />
            ),
          ),
      ]}
    />
  );
};
