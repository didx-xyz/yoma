import React from "react";
import type { UserPreferences } from "~/api/models/userPreferences";
import type { StepBlockDef } from "../../registry/preferenceSteps";
import { Message } from "../shared/Message";
import { usePreferenceOptions } from "./usePreferenceOptions";
import { AccessibilityBlock } from "./blocks/AccessibilityBlock";
import { GoalCards } from "./blocks/GoalCards";
import { IdentityReadonly } from "./blocks/IdentityReadonly";
import { LanguageSearch } from "./blocks/LanguageSearch";
import { LocationBlock } from "./blocks/LocationBlock";
import { Pill } from "./blocks/Pill";
import { PillList } from "./blocks/PillList";
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
    if (block.prefKey === "maxCommitment") {
      // Active only when the draft IS the pill's bucket — (interval, count), never the interval
      // alone: an older {Minute, 1} would light "A few minutes" while saving 1.
      const active = (id: string): boolean =>
        draft.maxCommitment?.intervalId === id &&
        draft.maxCommitment.count === options.find((o) => o.id === id)?.count;
      return {
        active,
        // The bucket's count ("A few minutes" = 15), never a bare 1.
        toggle: (id) =>
          onPatch({
            maxCommitment: active(id)
              ? null
              : {
                  intervalId: id,
                  count: options.find((o) => o.id === id)?.count ?? 1,
                },
          }),
      };
    }
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
      case "chips":
        // Interests alone since 2026-10-21: the languages block became a search.
        return (
          <PillList
            pinned={(i) =>
              draft.targetCategories.includes(options[i]?.id ?? "")
            }
            pills={options.map((option) => (
              <Pill
                key={option.id}
                label={option.label}
                imageURL={option.imageURL}
                active={draft.targetCategories.includes(option.id)}
                onToggle={() =>
                  onPatch({
                    targetCategories: toggleIn(
                      draft.targetCategories,
                      option.id,
                    ),
                  })
                }
              />
            ))}
          />
        );
      case "rows":
      case "pills": {
        const { active, toggle } = pillSelection();
        const entries =
          block.entries ?? options.map((o) => ({ id: o.id, label: o.label }));
        const pills = entries.map((entry) => (
          <Pill
            key={entry.id}
            label={entry.label}
            active={active(entry.id)}
            onToggle={() => toggle(entry.id)}
          />
        ));
        // Rows are short lists (one per line); pills get the wrapping row's "Show all N" cut.
        return block.kind === "rows" ? (
          <div className="flex flex-col items-start gap-2">{pills}</div>
        ) : (
          <PillList
            pinned={(i) => active(entries[i]?.id ?? "")}
            pills={pills}
          />
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
        // Two searches, one kind: skills hit the EMSI lookup by name; languages search the full
        // list on the client, with the facet list as the suggestions (read by the block itself).
        return block.prefKey === "languages" ? (
          <LanguageSearch draft={draft} onPatch={onPatch} />
        ) : (
          <SkillSearch draft={draft} onPatch={onPatch} />
        );
      case "readonly":
        return <IdentityReadonly entries={block.entries ?? []} />;
      case "location":
        return <LocationBlock draft={draft} onPatch={onPatch} />;
    }
  };

  // The registry's icon leads the heading; a block with no heading (the step's title is its
  // heading) puts it on the note instead, so every block carries its glyph exactly once.
  const Icon = block.icon;
  return (
    <div className="flex flex-col gap-2">
      {block.heading && (
        <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-normal">
          <Icon className="text-purple h-4 w-4 shrink-0" />
          {block.heading}
        </h3>
      )}
      {body()}
      <Message icon={block.heading ? undefined : Icon}>{block.note}</Message>
    </div>
  );
};
