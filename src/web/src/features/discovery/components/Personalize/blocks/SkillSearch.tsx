import React, { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import type { UserPreferences } from "~/api/models/userPreferences";
import { useSkillSearch } from "../usePreferenceOptions";
import { Pill } from "./Pill";

/**
 * The skills lookup-search block. Labels of already-selected skills are cached locally so a chip
 * keeps its name after the search text (and therefore the result set) has moved on.
 */
export const SkillSearch: React.FC<{
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ draft, onPatch }) => {
  const [text, setText] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({});
  const results = useSkillSearch(text);

  const toggle = (id: string, label: string): void => {
    setLabels((prev) => ({ ...prev, [id]: label }));
    onPatch({
      selfReportedSkills: draft.selfReportedSkills.includes(id)
        ? draft.selfReportedSkills.filter((v) => v !== id)
        : [...draft.selfReportedSkills, id],
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
        {draft.selfReportedSkills.map((id) => (
          <Pill
            key={id}
            label={labels[id] ?? results.find((s) => s.id === id)?.label ?? id}
            active
            onToggle={() => toggle(id, labels[id] ?? id)}
          />
        ))}
        {results
          .filter((s) => !draft.selfReportedSkills.includes(s.id))
          .map((s) => (
            <Pill
              key={s.id}
              label={s.label}
              active={false}
              onToggle={() => toggle(s.id, s.label)}
            />
          ))}
      </div>
    </div>
  );
};
