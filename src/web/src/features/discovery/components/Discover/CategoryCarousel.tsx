import Image from "next/image";
import React, { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { formatNumber } from "../../lib/format";
import { owningPreference } from "../../lib/preferenceMapping";
import { useDiscovery } from "../../state/DiscoveryContext";
import { HERO_BONE_CLASS } from "./heroSkeleton";

/** Pills shown before "Show all N" reveals the rest inline (10 in round 7; 6 since 2026-10-01). */
const FIRST_SHOWN = 6;
/**
 * Bone widths while the lookup loads — the first six pills and "Show all", sized like the real
 * ones on Stage ("Agriculture, Food, Environment and Climate 147" is ~325px; the shortest ~200px),
 * so they wrap into the same rows at every breakpoint (five + two at 1440, three + four at 1024,
 * three rows at 768) and the section is as tall on first paint as once the categories arrive
 * (2026-10-22, measured).
 */
const BONE_WIDTHS = ["w-80", "w-52", "w-64", "w-56", "w-48", "w-72", "w-28"];

/**
 * Browse by category — compact pills in the purple header (round 7, 2026-09-30; supersedes the
 * 2026-09-05 "shared square card" decision, Jason's call). Icon + name + count, the first six then
 * "Show all N" (and "Show fewer" once open — round 10, the detail page's wording); the pills wrap
 * and centre on desktop and run as one sideways row on mobile.
 * Order, counts (the category lookup's, zero included) and the toggle below are unchanged.
 *
 * Colour follows the surface rule — GREEN = filters, PURPLE = preferences: on a white pill (since
 * 2026-10-08), a category this search picked is outlined green, one the preference layer
 * supplies is outlined purple.
 * The lookup carries full names only, so there are no short names here.
 * Still loading, the section renders its label and bones (`BONE_WIDTHS`); failed or empty, it
 * is absent.
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
  const loading =
    lookups.categories.length === 0 && lookups.status.categories === "loading";
  if (lookups.categories.length === 0 && !loading) return null;

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
    // A saved interest goes on its own (2026-10-08); the goal's category takes the goal with it.
    if (prefKey === "targetCategories") skipPreference(prefKey, id);
    else if (prefKey) skipPreference(prefKey);
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

  const pills = loading
    ? BONE_WIDTHS.map((width, index) => (
        <span
          key={index}
          aria-hidden
          className={`inline-flex min-h-8 shrink-0 rounded-full border border-transparent ${width} ${HERO_BONE_CLASS}`}
        />
      ))
    : [
        ...shown.map((category, index) => {
          // Revealed by "Show all" (2026-10-09): rise in one after another, a fade alone under
          // reduced motion. The first ones were already there.
          const revealed = expanded && index >= FIRST_SHOWN;
          const manual = state.filters.categories.includes(category.id);
          const inherited =
            !manual && effectiveFilters.categories.includes(category.id);
          // White, like the quick searches and the search bar (2026-10-08): the icons bring their own
          // colours, which no tint or fill can be trusted to sit behind. Picked, a pill keeps its
          // white and is outlined — green for this search, purple from preferences — with the
          // outline INSIDE its edge (`inset-ring`), so it reads on the purple hero.
          let tone = "border-gray hover:border-green bg-white text-black";
          if (manual)
            tone =
              "border-green inset-ring inset-ring-green bg-white text-green";
          else if (inherited)
            tone =
              "border-purple inset-ring inset-ring-purple bg-white text-purple";
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={manual || inherited}
              onClick={() => {
                toggleCategory(category.id);
                onPick?.();
              }}
              style={
                revealed
                  ? { animationDelay: `${(index - FIRST_SHOWN) * 30}ms` }
                  : undefined
              }
              className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap ${tone} ${
                revealed
                  ? "motion-safe:animate-[rise-in_220ms_ease-out_both] motion-reduce:animate-[fade-in_150ms_ease-out_both]"
                  : ""
              }`}
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
                className="border-gray hover:border-green text-gray-dark inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border bg-white px-3 text-xs font-semibold whitespace-nowrap"
              >
                {expanded ? (
                  <>
                    <IoChevronUp className="h-3.5 w-3.5" />
                    Show fewer
                  </>
                ) : (
                  <>
                    <IoChevronDown className="h-3.5 w-3.5" />
                    Show all {lookups.categories.length}
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
