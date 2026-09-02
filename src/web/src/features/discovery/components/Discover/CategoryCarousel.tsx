import React from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { OpportunityCategoryHorizontalCard } from "~/components/Opportunity/OpportunityCategoryHorizontalCard";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * Browse by category — the app's EXISTING pieces, not a second implementation: the category card
 * is `OpportunityCategoryHorizontalCard` (which renders the count) and the carousel behaviour is
 * `ScrollableContainer` (drag/touch scroll). The card selects on category NAMES while discovery
 * state carries ids, so this wrapper translates between the two.
 */
export const CategoryCarousel: React.FC = () => {
  const { state, dispatch, lookups, effectiveFilters, fragments } =
    useDiscovery();
  if (lookups.categories.length === 0) return null;

  // Selection reflects the EFFECTIVE filters, so preference-inherited categories light up on
  // landing. Deselecting an inherited one skips the preference — same semantics as its chip.
  const toggleCategory = (id: string): void => {
    const manual = state.filters.categories;
    if (manual.includes(id)) {
      dispatch({
        kind: "patchFilters",
        patch: { categories: manual.filter((c) => c !== id) },
      });
      return;
    }
    const inherited =
      effectiveFilters.categories.includes(id) &&
      fragments.targetCategories?.categories?.includes(id);
    if (inherited)
      dispatch({
        kind: "setPreferenceSkipped",
        key: "targetCategories",
        skipped: true,
      });
    else
      dispatch({
        kind: "patchFilters",
        patch: { categories: [...manual, id] },
      });
  };

  return (
    <section>
      <div className="flex flex-col items-baseline justify-between pb-2 md:flex-row">
        <h2 className="text-base font-bold tracking-normal md:text-lg">
          Browse by category
        </h2>
        <span className="text-gray-dark text-xs">
          Counts are live and respect your preferences
        </span>
      </div>
      <ScrollableContainer
        showShadows
        shadowFromClassName="from-gray-light" // the page body's background
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {lookups.categories.map((category) => (
          <OpportunityCategoryHorizontalCard
            key={category.id}
            data={category}
            selected={effectiveFilters.categories.includes(category.id)}
            onClick={() => toggleCategory(category.id)}
          />
        ))}
      </ScrollableContainer>
    </section>
  );
};
