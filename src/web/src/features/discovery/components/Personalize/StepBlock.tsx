import React from "react";
import type { UserPreferences } from "~/api/models/userPreferences";
import type { StepBlockDef } from "../../registry/preferenceSteps";
import { Message } from "../shared/Message";
import { usePreferenceOptions } from "./usePreferenceOptions";
import { AccessibilityBlock } from "./blocks/AccessibilityBlock";
import { GoalCards } from "./blocks/GoalCards";
import { IdentityReadonly } from "./blocks/IdentityReadonly";
import { LocationBlock } from "./blocks/LocationBlock";
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

  // Selection semantics keyed by the PREFERENCE, not by the block kind — `rows` and `pills`
  // are purely visual, so the registry can swap kinds without cross-wiring another preference.
  // Time commitment (one maximum) and the incentive preference (`yes` / `no` entries) are
  // single-select, and tapping the chosen pill clears it. Engagement is multi-select (the API
  // stores a list, 2026-10-03): each tap toggles its own pill, and none = no preference.
  const pillSelection = (): {
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
    if (block.prefKey === "incentivized")
      return {
        active: (id) =>
          draft.incentivized !== null && draft.incentivized === (id === "yes"),
        toggle: (id) => {
          const value = id === "yes";
          onPatch({
            incentivized: draft.incentivized === value ? null : value,
          });
        },
      };
    return {
      active: (id) => draft.engagement.includes(id),
      toggle: (id) => onPatch({ engagement: toggleIn(draft.engagement, id) }),
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
        const { active, toggle } = pillSelection();
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
      case "accessibility":
        return (
          <AccessibilityBlock
            options={options}
            draft={draft}
            onPatch={onPatch}
          />
        );
      case "lookupSearch":
        return <SkillSearch draft={draft} onPatch={onPatch} />;
      case "readonly":
        return <IdentityReadonly entries={block.entries ?? []} />;
      case "location":
        return <LocationBlock draft={draft} onPatch={onPatch} />;
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
