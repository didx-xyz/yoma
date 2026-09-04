import React from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { useCustomFieldFilterLabeler } from "~/components/Opportunity/CustomFieldFilters";
import { useOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Chip } from "../shared/Chip";

/**
 * The applied-chip row above the results — all three provenance classes, plus the type-scoped
 * custom-field clauses labelled through YOM-1260's labeler (values only; Exists shows the
 * title). Prominent Clear all.
 */
export const AppliedChips: React.FC<{ pulseChipId?: string | null }> = ({
  pulseChipId,
}) => {
  const { state, dispatch, chips } = useDiscovery();
  const type = state.filters.type;
  const { data: definitions } = useOpportunityCustomFieldDefinitionsQuery(
    type ? [type] : null,
    { enabled: !!type && state.filters.customFields.length > 0 },
  );
  const labelFor = useCustomFieldFilterLabeler(definitions);

  const hasAny = chips.length > 0 || state.filters.customFields.length > 0;
  if (!hasAny) return null;

  return (
    // One drag-scrollable row — chips never wrap into a tall block.
    <ScrollableContainer
      className="flex items-center gap-2 overflow-x-auto pb-1"
      showShadows={true}
      shadowFromClassName="from-gray-light" // the page body's background
    >
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          chip={chip}
          pulse={chip.id === pulseChipId}
          onRemove={() =>
            chip.prefKey
              ? dispatch({
                  kind: "setPreferenceSkipped",
                  key: chip.prefKey,
                  skipped: true,
                })
              : chip.facet &&
                chip.raw !== null &&
                dispatch({
                  kind: "removeManual",
                  facet: chip.facet,
                  raw: chip.raw,
                })
          }
          onUndo={() =>
            chip.prefKey &&
            dispatch({
              kind: "setPreferenceSkipped",
              key: chip.prefKey,
              skipped: false,
            })
          }
        />
      ))}
      {state.filters.customFields.map((clause) => (
        <Chip
          key={`cf:${clause.key}:${clause.operator}`}
          chip={{
            id: `cf:${clause.key}:${clause.operator}`,
            group: "Details",
            value: labelFor(clause),
            provenance: "manual",
            prefKey: null,
            facet: "customFields",
            raw: null,
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
      ))}
      <button
        type="button"
        onClick={() => dispatch({ kind: "clearAll" })}
        className="text-purple shrink-0 text-xs font-semibold whitespace-nowrap underline"
      >
        Clear all
      </button>
    </ScrollableContainer>
  );
};
