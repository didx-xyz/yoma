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
  const {
    state,
    dispatch,
    lookups,
    effectiveFilters,
    fragments,
    skipPreference,
  } = useDiscovery();
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
    if (inherited) skipPreference("targetCategories");
    else
      dispatch({
        kind: "patchFilters",
        patch: { categories: [...manual, id] },
      });
  };

  return (
    <section>
      {/* No caption. It used to claim "Counts are live and respect your preferences" — the
          counts come from the category lookup, which knows nothing about the current search or
          the youth's preferences, so the line was describing something the page does not do. */}
      <div className="pb-2">
        <h2 className="text-base font-bold tracking-normal md:text-lg">
          Browse by category
        </h2>
      </div>
      {/* items-start: the cards are aspect-square, so default cross-axis stretch converts any
          imposed row height into card WIDTH too — they inflate in both directions. Top-aligned,
          each card keeps its natural size (the old page's CustomSlider renders them the same
          way). containerClassName="" drops the wrapper's h-full for the same reason as the
          wizard footer: never hand this row a height it must fill. */}
      {/* Below md the tiles drop to one line — icon and label, no count and no square aspect —
          so the results heading clears the fold at 390×844 (the square tiles pushed it to
          y≈618). Done with child variants rather than a prop on the shared card, so the legacy
          discovery page's carousel is untouched. */}
      <ScrollableContainer
        showShadows
        shadowFromClassName="from-gray-light" // the page body's background
        containerClassName=""
        className="flex items-start gap-3 overflow-x-auto pb-2 max-md:[&_button]:aspect-auto max-md:[&_h1]:line-clamp-1 max-md:[&_h6]:hidden"
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
