import React, { useEffect, useMemo, useState } from "react";
import { IoOptionsOutline, IoSearchOutline } from "react-icons/io5";
import AnimatedText from "~/components/Opportunity/AnimatedText";
import { formatNumber } from "../../lib/format";
import { isDefaultDiscoveryState } from "../../lib/urlCodec";
import { useDiscovery } from "../../state/DiscoveryContext";
import { FiltersDialog } from "../Filters/FiltersDialog";
import { FiltersSheet } from "../Filters/FiltersSheet";
import { PersonalizeDialog } from "../Personalize/PersonalizeDialog";
import { DiscoveryResults } from "../Results/DiscoveryResults";
import { SegmentedSearchBar } from "../SearchBar/SegmentedSearchBar";
import { FloatingFilterButton } from "../shared/FloatingFilterButton";
import { DiscoveryLanding } from "./DiscoveryLanding";
import { MyOpportunitiesLink } from "./MyOpportunitiesLink";
import { QuickSearchRow } from "./QuickSearchRow";

/**
 * The whole discovery surface under one provider: the purple hero (badges above the segmented
 * bar on desktop; one search pill on mobile), then landing or results. Personalization opens
 * automatically on the first visit only; afterwards the banner, the sheet's preference block and
 * this surface's Edit entry points reopen it.
 */
export const DiscoverySurface: React.FC = () => {
  const { state, ready, count, preferences, readPersonalizationSeen, chips } =
    useDiscovery();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const landing = isDefaultDiscoveryState(state);
  // One clock per render pass, so every card row shares identical urgency math.
  const now = useMemo(() => new Date(), []);

  // The page must not scroll behind an open dialog/sheet.
  useEffect(() => {
    document.body.style.overflow =
      filtersOpen || personalizeOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen, personalizeOpen]);

  // Auto-open once: never captured (or skipped) before, and only after hydration.
  useEffect(() => {
    if (ready && preferences === null && !readPersonalizationSeen())
      setPersonalizeOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first-visit check only
  }, [ready, preferences]);

  const editPreferences = (): void => setPersonalizeOpen(true);

  return (
    // MainLayout centres a flex child, so the root must claim the full width itself —
    // the purple band then bleeds edge to edge while the content stays contained.
    <div className="flex w-full flex-col">
      <header className="bg-purple w-full px-4 pt-20 pb-4 text-white md:pt-24">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {/* Rendered on landing AND results, so switching between them never shifts the layout. */}
          <div className="text-center">
            <h3 className="text-xl font-semibold md:text-2xl">
              Find <span className="text-orange mx-2">opportunities</span> to{" "}
              <span className="text-orange mx-2">unlock</span> your future.
            </h3>
            <div className="flex justify-center pt-1">
              <AnimatedText
                sentences={
                  landing
                    ? [
                        count !== null
                          ? `${formatNumber(count)} open right now`
                          : "Opportunities across jobs, learning, events and more",
                        "Set your preferences once — every search uses them",
                        "Earn ZLTO while you build your future",
                      ]
                    : [
                        count !== null
                          ? `${formatNumber(count)} match your search`
                          : "Refine your search with the filters",
                        "Tap a chip above the results to adjust this search",
                        "Your preferences shape these results — switch them off any time",
                      ]
                }
              />
            </div>
          </div>
          <div className="hidden justify-center md:flex">
            <QuickSearchRow wrap={false} />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="grow">
              <SegmentedSearchBar onOpenFilters={() => setFiltersOpen(true)} />
            </div>
            <MyOpportunitiesLink />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-12 grow items-center gap-3 rounded-full bg-white px-4 text-left text-black"
            >
              <IoSearchOutline className="text-gray-dark h-5 w-5 shrink-0" />
              <span className="grow">
                <span className="block text-sm font-semibold">
                  {state.filters.q ?? "Search opportunities"}
                </span>
              </span>
              <span className="text-gray-dark flex shrink-0 items-center gap-1">
                <IoOptionsOutline className="h-5 w-5" />
                {chips.length > 0 && (
                  <span className="bg-purple flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
                    {chips.length}
                  </span>
                )}
              </span>
            </button>
            <MyOpportunitiesLink />
          </div>
          <div className="md:hidden">
            <QuickSearchRow wrap={false} />
          </div>
        </div>
      </header>

      <FloatingFilterButton onOpen={() => setFiltersOpen(true)} />

      <main className="mx-auto w-full max-w-7xl px-4 py-4">
        {landing ? (
          <DiscoveryLanding onEditPreferences={editPreferences} now={now} />
        ) : (
          <DiscoveryResults onEditPreferences={editPreferences} now={now} />
        )}
      </main>

      {/* Same filter state, two containers — the breakpoint picks the chrome, never the content. */}
      <div className="hidden md:contents">
        <FiltersDialog
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onEditPreferences={editPreferences}
        />
      </div>
      <div className="md:hidden">
        <FiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onEditPreferences={editPreferences}
        />
      </div>
      {/* Mounted only while open — the dialog seeds its draft from stored preferences at mount. */}
      {personalizeOpen && (
        <PersonalizeDialog onClose={() => setPersonalizeOpen(false)} />
      )}
    </div>
  );
};
