import React from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { useCustomFieldFilterLabeler } from "~/components/Opportunity/CustomFieldFilters";
import { useOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import { customFieldChipValue } from "~/lib/customFields/customFieldFilterClauses";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Chip } from "../shared/Chip";

/**
 * One row of applied chips, of ONE kind (round 7 follow-up, 2026-10-01):
 *
 *   inherited — the preference layer (inherited, switched-off and inapplicable chips). Rendered
 *               inside the preference banner, so everything purple sits together.
 *   manual    — this search's own filters, plus the type-scoped custom-field clauses labelled
 *               through YOM-1260's labeler. The operator isn't on screen in discovery, so the
 *               value carries it where the value alone would mislead ("From 5000", "Contains
 *               “dri”"; `customFieldChipValue`). Rendered by the filters panel, which owns
 *               "Clear filters".
 *
 * Mobile: one drag-scrollable line (`ScrollableContainer`), its edges fading while there is more
 * to scroll; desktop: the chips wrap. Removing an
 * inherited chip skips its preference for this search; removing a manual one edits the filter.
 */
export const AppliedChips: React.FC<{
  kind: "inherited" | "manual";
  pulseChipId?: string | null;
}> = ({ kind, pulseChipId }) => {
  const {
    state,
    dispatch,
    chips,
    effectiveFilters,
    skipPreference,
    restorePreference,
  } = useDiscovery();
  const types = effectiveFilters.types;
  const clauses = kind === "manual" ? state.filters.customFields : [];
  const { data: definitions } = useOpportunityCustomFieldDefinitionsQuery(
    types.length > 0 ? types : null,
    { enabled: types.length > 0 && clauses.length > 0 },
  );
  // The skills in these clauses are named by id, one request for all of them. Each filter block
  // asks for the skills in its own fields, so the chips and the controls share one request (one
  // query key) while every selected skill sits in one block; otherwise each block with skills
  // makes its own request, plus one here for all of them
  const labelFor = useCustomFieldFilterLabeler(definitions, clauses);

  const rowChips = chips.filter((c) =>
    kind === "manual" ? c.provenance === "manual" : c.provenance !== "manual",
  );
  if (rowChips.length === 0 && clauses.length === 0) return null;

  return (
    <ScrollableContainer
      containerClassName=""
      className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0"
      // The edge fade of every sideways row (2026-10-08), as a mask: the panels behind are
      // translucent tints no overlay colour can match.
      fadeEdges
    >
      {rowChips.map((chip) => (
        <Chip
          key={chip.id}
          chip={chip}
          pulse={chip.id === pulseChipId}
          onRemove={() =>
            chip.prefKey
              ? skipPreference(chip.prefKey, chip.interest)
              : chip.facet &&
                chip.raw !== null &&
                dispatch({
                  kind: "removeManual",
                  facet: chip.facet,
                  raw: chip.raw,
                })
          }
          onUndo={() =>
            chip.prefKey && restorePreference(chip.prefKey, chip.interest)
          }
        />
      ))}
      {clauses.map((clause) => {
        const definition = definitions?.find(
          (d) => d.key.toLowerCase() === clause.key.toLowerCase(),
        );
        return (
          <Chip
            key={`cf:${clause.key}:${clause.operator}`}
            chip={{
              id: `cf:${clause.key}:${clause.operator}`,
              // The chip is labelled by the FIELD, never its group/sub-group: the definition
              // title is what the youth chose under, and the labeler supplies the value.
              group: definition?.title ?? "Details",
              value: customFieldChipValue(
                clause,
                labelFor(clause),
                definition?.dataType ?? null,
              ),
              provenance: "manual",
              prefKey: null,
              facet: "customFields",
              raw: null,
              pending: false,
              note: null,
              private: false,
            }}
            onRemove={() =>
              dispatch({
                kind: "patchFilters",
                patch: {
                  customFields: state.filters.customFields.filter(
                    (c) => c !== clause,
                  ),
                },
              })
            }
            onUndo={() => undefined}
          />
        );
      })}
    </ScrollableContainer>
  );
};
