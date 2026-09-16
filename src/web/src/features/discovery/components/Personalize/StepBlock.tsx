import React from "react";
import type { UserPreferences } from "~/api/models/userPreferences";
import type { StepBlockDef } from "../../registry/preferenceSteps";
import { Message } from "../shared/Message";
import { usePreferenceOptions } from "./usePreferenceOptions";
import { GoalCards } from "./blocks/GoalCards";
import { IdentityReadonly } from "./blocks/IdentityReadonly";
import { Pill } from "./blocks/Pill";
import { SkillSearch } from "./blocks/SkillSearch";

/**
 * The ONE kind→control switch for wizard blocks. Adding a preference is a registry data change —
 * no new JSX here; the heavier kinds live in `./blocks/`.
 */
const toggleIn = (values: string[], id: string): string[] =>
  values.includes(id) ? values.filter((v) => v !== id) : [...values, id];

export const StepBlock: React.FC<{
  block: StepBlockDef;
  draft: UserPreferences;
  onPatch: (patch: Partial<UserPreferences>) => void;
}> = ({ block, draft, onPatch }) => {
  const options = usePreferenceOptions(block.optionsSource);

  // Single-select semantics keyed by the PREFERENCE, not by the block kind — `rows` and `pills`
  // are purely visual, so the registry can swap kinds without cross-wiring another preference.
  const singleSelect = (): {
    active: (id: string) => boolean;
    toggle: (id: string) => void;
  } => {
    if (block.prefKey === "maxCommitment")
      return {
        active: (id) => draft.maxCommitment?.intervalId === id,
        toggle: (id) =>
          onPatch({
            maxCommitment:
              draft.maxCommitment?.intervalId === id
                ? null
                : { intervalId: id, count: 1 },
          }),
      };
    return {
      active: (id) => draft.engagement === id,
      toggle: (id) =>
        onPatch({ engagement: draft.engagement === id ? null : id }),
    };
  };

  const body = (): React.ReactNode => {
    switch (block.kind) {
      case "cards":
        return (
          <GoalCards
            entries={block.entries ?? []}
            draft={draft}
            onPatch={onPatch}
          />
        );
      case "chips": {
        const key =
          block.prefKey === "languages" ? "languages" : "targetCategories";
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <Pill
                key={option.id}
                label={option.label}
                active={draft[key].includes(option.id)}
                onToggle={() =>
                  onPatch({ [key]: toggleIn(draft[key], option.id) })
                }
              />
            ))}
          </div>
        );
      }
      case "rows":
      case "pills": {
        const { active, toggle } = singleSelect();
        const entries =
          block.entries ?? options.map((o) => ({ id: o.id, label: o.label }));
        return (
          <div
            className={
              block.kind === "rows"
                ? "flex flex-col items-start gap-2"
                : "flex flex-wrap gap-2"
            }
          >
            {entries.map((entry) => (
              <Pill
                key={entry.id}
                label={entry.label}
                active={active(entry.id)}
                onToggle={() => toggle(entry.id)}
              />
            ))}
          </div>
        );
      }
      case "toggle":
        return (
          <label className="border-gray flex items-center gap-3 rounded-xl border p-3">
            <input
              type="checkbox"
              className="toggle checked:[--input-color:var(--color-green)]"
              checked={draft.accessibility.enabled}
              onChange={(e) =>
                onPatch({
                  accessibility: {
                    ...draft.accessibility,
                    enabled: e.target.checked,
                  },
                })
              }
            />
            <span className="text-sm font-semibold">
              Only show opportunities with accommodations
            </span>
          </label>
        );
      case "lookupSearch":
        return <SkillSearch draft={draft} onPatch={onPatch} />;
      case "readonly":
        return <IdentityReadonly entries={block.entries ?? []} />;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {block.heading && (
        <h3 className="text-sm font-semibold tracking-normal">
          {block.heading}
        </h3>
      )}
      {body()}
      {block.note && <Message>{block.note}</Message>}
    </div>
  );
};
