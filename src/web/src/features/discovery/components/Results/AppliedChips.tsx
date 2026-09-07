import React from "react";
import { CustomFieldFilterOperator } from "~/api/models/opportunity";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { useCustomFieldFilterLabeler } from "~/components/Opportunity/CustomFieldFilters";
import { useOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Chip } from "../shared/Chip";

/**
 * The applied-chip row above the results — all three provenance classes, plus the type-scoped
 * custom-field clauses labelled through YOM-1260's labeler (values only; Exists shows the
 * title). Clear filters sits at the end of the row and takes out the SESSION's filters only —
 * inherited chips stay, because preferences are a standing setting rather than part of this
 * search (2026-09-05).
 */
export const AppliedChips: React.FC<{ pulseChipId?: string | null }> = ({
  pulseChipId,
}) => {
  const {
    state,
    dispatch,
    chips,
    effectiveFilters,
    clearFilters,
    hasFilters,
    skipPreference,
  } = useDiscovery();
  const types = effectiveFilters.types;
  const { data: definitions } = useOpportunityCustomFieldDefinitionsQuery(
    types.length > 0 ? types : null,
    { enabled: types.length > 0 && state.filters.customFields.length > 0 },
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
              ? skipPreference(chip.prefKey)
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
            // The chip is labelled by the FIELD, never its group/sub-group: the definition
            // title is what the youth chose under, and the labeler supplies the value.
            group:
              definitions?.find(
                (d) => d.key.toLowerCase() === clause.key.toLowerCase(),
              )?.title ?? "Details",
            value:
              clause.operator === CustomFieldFilterOperator.Exists
                ? "Has any value"
                : labelFor(clause),
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
      {/* Only when this search carries filters of its own. A row of purely inherited chips has
          nothing for this button to clear — offering it there would imply it takes the
          preferences off too, which is exactly what it must not do. */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-purple shrink-0 text-xs font-semibold whitespace-nowrap underline"
        >
          Clear filters
        </button>
      )}
    </ScrollableContainer>
  );
};
