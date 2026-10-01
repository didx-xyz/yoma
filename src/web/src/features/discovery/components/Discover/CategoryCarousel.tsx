import Image from "next/image";
import React, { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { formatNumber } from "../../lib/format";
import { owningPreference } from "../../lib/preferenceMapping";
import { useDiscovery } from "../../state/DiscoveryContext";

/** Pills shown before "See more" reveals the rest inline (10 in round 7; 6 since 2026-10-01). */
const FIRST_SHOWN = 6;

/**
 * Browse by category — compact pills in the purple header (round 7, 2026-09-30; supersedes the
 * 2026-09-05 "shared square card" decision, Jason's call). Icon + name + count, the first six then
 * "See more" (and "See less" once open); the pills wrap and centre on desktop and run as one sideways row on mobile.
 * Order, counts (the category lookup's, zero included) and the toggle below are unchanged.
 *
 * Colour follows the surface rule — GREEN = filters, PURPLE = preferences: a category this
 * search picked is filled green, one the preference layer supplies is filled purple-tint.
 * The lookup carries full names only, so there are no short names here.
 */
export const CategoryCarousel: React.FC<{
  /** Section label — the welcome step says "Categories". */
  label?: string;
  /** Desktop alignment: centred in the header, start-aligned in the welcome step. */
  align?: "center" | "start";
  /** Called after a pill is tapped — the welcome step closes the dialog. */
  onPick?: () => void;
}> = ({ label = "Browse by category", align = "center", onPick }) => {
  const {
    state,
    dispatch,
    lookups,
    effectiveFilters,
    fragments,
    skipPreference,
  } = useDiscovery();
  const [expanded, setExpanded] = useState(false);
  if (lookups.categories.length === 0) return null;

  // Selection reflects the EFFECTIVE filters, so preference-inherited categories light up on
  // landing. Deselecting an inherited one skips the preference that supplies it — same
  // semantics as its chip. Looked up generically: Interests supplies categories, and so does
  // the "Start a business" Goal (2026-09-22).
  const toggleCategory = (id: string): void => {
    const manual = state.filters.categories;
    if (manual.includes(id)) {
      dispatch({
        kind: "patchFilters",
        patch: { categories: manual.filter((c) => c !== id) },
      });
      return;
    }
    const prefKey = effectiveFilters.categories.includes(id)
      ? owningPreference(fragments, "categories", id)
      : null;
    if (prefKey) skipPreference(prefKey);
    else
      dispatch({
        kind: "patchFilters",
        patch: { categories: [...manual, id] },
      });
  };

  const hidden = lookups.categories.length - FIRST_SHOWN;
  const shown =
    expanded || hidden <= 0
      ? lookups.categories
      : lookups.categories.slice(0, FIRST_SHOWN);

  const pills = [
    ...shown.map((category) => {
      const manual = state.filters.categories.includes(category.id);
      const inherited =
        !manual && effectiveFilters.categories.includes(category.id);
      let tone = "border-white/20 bg-white/10 text-white hover:bg-white/20";
      if (manual) tone = "border-green bg-green text-white";
      else if (inherited)
        tone = "border-purple-tint bg-purple-tint text-purple";
      return (
        <button
          key={category.id}
          type="button"
          aria-pressed={manual || inherited}
          onClick={() => {
            toggleCategory(category.id);
            onPick?.();
          }}
          className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap ${tone}`}
        >
          {category.imageURL && (
            <Image
              src={category.imageURL}
              alt=""
              width={18}
              height={18}
              // the lookup's icons are self-contained badges (glyph on their own circle), so
              // they render as they are — a colour filter turned them into blank discs
              className="h-4.5 w-4.5 shrink-0"
            />
          )}
          {category.name}
          <span className="font-normal opacity-70">
            {formatNumber(category.count ?? 0)}
          </span>
        </button>
      );
    }),
    ...(hidden > 0
      ? [
          <button
            key="see-more"
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-white/40 bg-white/20 px-3 text-xs font-semibold whitespace-nowrap text-white hover:bg-white/30"
          >
            {expanded ? (
              <>
                <IoChevronUp className="h-3.5 w-3.5" />
                See less
              </>
            ) : (
              <>
                <IoChevronDown className="h-3.5 w-3.5" />
                See more
                <span className="font-normal opacity-70">+{hidden}</span>
              </>
            )}
          </button>,
        ]
      : []),
  ];

  return (
    <section aria-label={label}>
      <h2
        className={`text-purple-soft pb-2 text-[10px] font-bold tracking-widest uppercase md:text-xs ${
          align === "center" ? "text-center" : ""
        }`}
      >
        {label}
      </h2>
      {/* Desktop: wrap (centred in the header). Mobile: one drag-scrollable row. */}
      <div
        className={`hidden flex-wrap gap-2 md:flex ${
          align === "center" ? "justify-center" : "justify-start"
        }`}
      >
        {pills}
      </div>
      <div className="min-w-0 md:hidden">
        <ScrollableContainer
          className="flex gap-2 overflow-x-auto pb-1"
          showShadows={true}
          shadowFromClassName="from-purple" // the hero's background — the fade must match it
        >
          {pills}
        </ScrollableContainer>
      </div>
    </section>
  );
};
