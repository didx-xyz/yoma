import React, { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import type {
  UserPreferences,
  UserPreferenceSkill,
} from "~/api/models/userPreferences";
import { useSkillSearch } from "../usePreferenceOptions";
import { Pill } from "./Pill";

/**
 * The skills lookup-search block. Selections are stored as `{id, name}` pairs (the EMSI lookup is
 * search-by-name only, so a bare id could never be resolved back to a label when re-editing) —
 * a chip therefore keeps its name after the search text, the result set, or the session has
 * moved on.
 */
export const SkillSearch: React.FC<{
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ draft, onPatch }) => {
  const [text, setText] = useState("");
  const results = useSkillSearch(text);
  const selected = draft.selfReportedSkills;

  const toggle = (skill: UserPreferenceSkill): void => {
    onPatch({
      selfReportedSkills: selected.some((s) => s.id === skill.id)
        ? selected.filter((s) => s.id !== skill.id)
        : [...selected, skill],
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="input input-bordered flex h-11 items-center gap-2 rounded-full">
        <IoSearchOutline className="text-gray-dark h-4 w-4" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search skills…"
          className="grow"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {selected.map((skill) => (
          <Pill
            key={skill.id}
            label={skill.name}
            active
            onToggle={() => toggle(skill)}
          />
        ))}
        {results
          .filter((r) => !selected.some((s) => s.id === r.id))
          .map((r) => (
            <Pill
              key={r.id}
              label={r.label}
              active={false}
              onToggle={() => toggle({ id: r.id, name: r.label })}
            />
          ))}
      </div>
    </div>
  );
};
